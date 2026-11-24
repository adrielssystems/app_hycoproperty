import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import {
  verifyQuickBooksAccess,
  createQuickBooksInvoice,
  updateQuickBooksInvoice,
  voidOrDeleteQuickBooksInvoice,
  recordQuickBooksPayment,
  isRealQboEntityId,
} from '@/lib/quickbooksUtils';

let invoiceSchemaChecked = false;

async function ensureInvoiceColumns() {
  if (invoiceSchemaChecked) return;
  const pool = getDbPool();
  await pool.query(`
    ALTER TABLE invoices ADD COLUMN IF NOT EXISTS qbo_sync_token VARCHAR(50);
    ALTER TABLE invoices ADD COLUMN IF NOT EXISTS qbo_customer_id VARCHAR(100);
    ALTER TABLE invoices ADD COLUMN IF NOT EXISTS qbo_payment_id VARCHAR(100);
    ALTER TABLE invoices ADD COLUMN IF NOT EXISTS base_rent NUMERIC(10, 2) DEFAULT 0;
    ALTER TABLE invoices ADD COLUMN IF NOT EXISTS cam_amount NUMERIC(10, 2) DEFAULT 0;
    ALTER TABLE invoices ADD COLUMN IF NOT EXISTS notes TEXT;
    ALTER TABLE invoices ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
  `);
  invoiceSchemaChecked = true;
}

async function isQboConnected(): Promise<boolean> {
  const pool = getDbPool();
  const res = await pool.query(
    `SELECT is_connected FROM settings_integrations WHERE provider = 'quickbooks' LIMIT 1`
  );
  return Boolean(res.rows[0]?.is_connected);
}

function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `INV-${year}-${random}`;
}

function normalizeDateString(val: unknown): string {
  if (!val) return new Date().toISOString().split('T')[0];
  const str = String(val);
  if (str.includes('T')) return str.split('T')[0];
  return str.slice(0, 10);
}

/**
 * GET /api/invoices
 * Lists invoices from PostgreSQL.
 */
export async function GET() {
  const { authenticated, authorized } = await verifyQuickBooksAccess([
    'SUPER_ADMIN',
    'ADMIN',
    'FINANCE',
    'PROPERTY_MANAGER',
  ]);
  if (!authenticated) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (!authorized) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  try {
    await ensureInvoiceColumns();
    const pool = getDbPool();
    const res = await pool.query(`
      SELECT id, invoice_number, qbo_invoice_id, qbo_sync_token, qbo_customer_id, qbo_payment_id,
             tenant_name, suite_reference, base_rent, cam_amount, amount, due_date, status, notes, paid_at, created_at
      FROM invoices
      ORDER BY id DESC
      LIMIT 100
    `);

    const qboConnected = await isQboConnected();

    return NextResponse.json({
      success: true,
      qbo_connected: qboConnected,
      invoices: res.rows,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load invoices';
    console.error('GET /api/invoices error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * POST /api/invoices
 * Creates an Invoice in HYCO PostgreSQL and pushes it live to QuickBooks Online (Customer + Invoice).
 */
export async function POST(request: NextRequest) {
  const { authenticated, authorized } = await verifyQuickBooksAccess([
    'SUPER_ADMIN',
    'ADMIN',
    'FINANCE',
  ]);
  if (!authenticated) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (!authorized) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  try {
    await ensureInvoiceColumns();
    const body = await request.json();

    const tenantName = String(body.tenant_name || '').trim();
    const suiteReference = String(body.suite_reference || '').trim();
    const baseRent = Number(body.base_rent ?? body.amount ?? 0);
    const camAmount = Number(body.cam_amount ?? 0);
    const totalAmount = Number((baseRent + camAmount).toFixed(2));
    const dueDate = normalizeDateString(body.due_date);
    const notes = body.notes ? String(body.notes).trim() : '';
    const invoiceNumber = body.invoice_number
      ? String(body.invoice_number).trim()
      : generateInvoiceNumber();
    const syncToQbo = body.sync_to_qbo !== false;
    const tenantEmail = body.tenant_email ? String(body.tenant_email).trim() : undefined;

    if (!tenantName || !suiteReference || totalAmount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tenant name, suite reference, and a positive amount are required.',
        },
        { status: 400 }
      );
    }

    let qboInvoiceId: string | null = null;
    let qboSyncToken: string | null = null;
    let qboCustomerId: string | null = null;
    let qboSynced = false;
    let qboNotice: string | null = null;

    if (syncToQbo && (await isQboConnected())) {
      const qboResult = await createQuickBooksInvoice({
        invoiceNumber,
        tenantName,
        tenantEmail,
        suiteReference,
        baseRent,
        camAmount,
        dueDate,
        notes,
      });
      qboInvoiceId = qboResult.qboInvoiceId;
      qboSyncToken = qboResult.syncToken;
      qboCustomerId = qboResult.qboCustomerId;
      qboSynced = true;
    } else if (syncToQbo) {
      qboNotice = 'QuickBooks Online is not connected; invoice saved locally only.';
    }

    const pool = getDbPool();
    const insertRes = await pool.query(
      `INSERT INTO invoices
        (invoice_number, qbo_invoice_id, qbo_sync_token, qbo_customer_id, tenant_name, suite_reference,
         base_rent, cam_amount, amount, due_date, status, notes, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'PENDING', $11, NOW())
       RETURNING id, invoice_number, qbo_invoice_id, qbo_sync_token, qbo_customer_id, qbo_payment_id,
                 tenant_name, suite_reference, base_rent, cam_amount, amount, due_date, status, notes, paid_at`,
      [
        invoiceNumber,
        qboInvoiceId || `LOCAL-${Date.now().toString().slice(-5)}`,
        qboSyncToken,
        qboCustomerId,
        tenantName,
        suiteReference,
        baseRent,
        camAmount,
        totalAmount,
        dueDate,
        notes || null,
      ]
    );

    return NextResponse.json({
      success: true,
      qbo_synced: qboSynced,
      notice: qboNotice,
      invoice: insertRes.rows[0],
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create invoice';
    console.error('POST /api/invoices error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * PUT /api/invoices
 * Supports:
 * - action: 'update' (edits invoice in HYCO & updates live QBO Invoice via SyncToken)
 * - action: 'sync_qbo' (pushes an existing local/legacy invoice into QBO)
 * - action: 'record_payment' (creates linked Payment in QBO & marks Invoice PAID)
 */
export async function PUT(request: NextRequest) {
  const { authenticated, authorized } = await verifyQuickBooksAccess([
    'SUPER_ADMIN',
    'ADMIN',
    'FINANCE',
  ]);
  if (!authenticated) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (!authorized) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  try {
    await ensureInvoiceColumns();
    const pool = getDbPool();
    const body = await request.json();
    const id = Number(body.id);
    const action = String(body.action || 'update');

    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ success: false, error: 'Valid invoice ID is required.' }, { status: 400 });
    }

    const existingRes = await pool.query(`SELECT * FROM invoices WHERE id = $1 LIMIT 1`, [id]);
    const existing = existingRes.rows[0];
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Invoice not found.' }, { status: 404 });
    }

    const connected = await isQboConnected();

    // ACTION 1: PUSH EXISTING LOCAL INVOICE TO QBO
    if (action === 'sync_qbo') {
      if (!connected) {
        return NextResponse.json(
          { success: false, error: 'QuickBooks Online is not connected.' },
          { status: 400 }
        );
      }

      const baseRent =
        Number(existing.base_rent) > 0 ? Number(existing.base_rent) : Number(existing.amount);
      const camAmount = Number(existing.cam_amount) || 0;

      const qboResult = isRealQboEntityId(existing.qbo_invoice_id)
        ? await updateQuickBooksInvoice(existing.qbo_invoice_id, {
            invoiceNumber: existing.invoice_number,
            tenantName: existing.tenant_name,
            suiteReference: existing.suite_reference,
            baseRent,
            camAmount,
            dueDate: normalizeDateString(existing.due_date),
            notes: existing.notes || undefined,
          })
        : await createQuickBooksInvoice({
            invoiceNumber: existing.invoice_number,
            tenantName: existing.tenant_name,
            suiteReference: existing.suite_reference,
            baseRent,
            camAmount,
            dueDate: normalizeDateString(existing.due_date),
            notes: existing.notes || undefined,
          });

      const updated = await pool.query(
        `UPDATE invoices
         SET qbo_invoice_id = $1,
             qbo_sync_token = $2,
             qbo_customer_id = $3,
             base_rent = $4,
             cam_amount = $5,
             updated_at = NOW()
         WHERE id = $6
         RETURNING *`,
        [
          qboResult.qboInvoiceId,
          qboResult.syncToken,
          qboResult.qboCustomerId,
          baseRent,
          camAmount,
          id,
        ]
      );

      return NextResponse.json({
        success: true,
        qbo_synced: true,
        invoice: updated.rows[0],
      });
    }

    // ACTION 2: RECORD PAYMENT (Platform -> QBO Linked Payment)
    if (action === 'record_payment') {
      if (existing.status === 'PAID') {
        return NextResponse.json(
          { success: false, error: 'Invoice is already marked as PAID.' },
          { status: 400 }
        );
      }
      if (existing.status === 'VOIDED') {
        return NextResponse.json(
          { success: false, error: 'Cannot record payment on a VOIDED invoice.' },
          { status: 400 }
        );
      }

      let qboInvoiceId = existing.qbo_invoice_id as string | null;
      let qboSyncToken = existing.qbo_sync_token as string | null;
      let qboCustomerId = existing.qbo_customer_id as string | null;
      let qboPaymentId: string | null = null;
      let qboSynced = false;

      if (connected) {
        // Ensure invoice exists in QBO before posting Payment
        if (!isRealQboEntityId(qboInvoiceId) || !qboCustomerId) {
          const baseRent =
            Number(existing.base_rent) > 0 ? Number(existing.base_rent) : Number(existing.amount);
          const camAmount = Number(existing.cam_amount) || 0;
          const created = await createQuickBooksInvoice({
            invoiceNumber: existing.invoice_number,
            tenantName: existing.tenant_name,
            suiteReference: existing.suite_reference,
            baseRent,
            camAmount,
            dueDate: normalizeDateString(existing.due_date),
            notes: existing.notes || undefined,
          });
          qboInvoiceId = created.qboInvoiceId;
          qboSyncToken = created.syncToken;
          qboCustomerId = created.qboCustomerId;
        }

        const payAmount = Number(body.amount ?? existing.amount);
        const paymentResult = await recordQuickBooksPayment({
          qboCustomerId: qboCustomerId!,
          qboInvoiceId: qboInvoiceId!,
          amount: payAmount,
          txnDate: body.payment_date ? normalizeDateString(body.payment_date) : undefined,
          paymentRefNum: existing.invoice_number,
        });
        qboPaymentId = paymentResult.qboPaymentId;
        qboSynced = true;
      }

      const updated = await pool.query(
        `UPDATE invoices
         SET status = 'PAID',
             paid_at = NOW(),
             qbo_invoice_id = COALESCE($1, qbo_invoice_id),
             qbo_sync_token = COALESCE($2, qbo_sync_token),
             qbo_customer_id = COALESCE($3, qbo_customer_id),
             qbo_payment_id = COALESCE($4, qbo_payment_id),
             updated_at = NOW()
         WHERE id = $5
         RETURNING *`,
        [qboInvoiceId, qboSyncToken, qboCustomerId, qboPaymentId, id]
      );

      return NextResponse.json({
        success: true,
        qbo_synced: qboSynced,
        invoice: updated.rows[0],
      });
    }

    // ACTION 3: UPDATE INVOICE (Edit in PostgreSQL + Live QBO Sync)
    const tenantName = String(body.tenant_name ?? existing.tenant_name).trim();
    const suiteReference = String(body.suite_reference ?? existing.suite_reference).trim();
    const baseRent = Number(body.base_rent ?? existing.base_rent ?? existing.amount ?? 0);
    const camAmount = Number(body.cam_amount ?? existing.cam_amount ?? 0);
    const totalAmount = Number((baseRent + camAmount).toFixed(2));
    const dueDate = normalizeDateString(body.due_date ?? existing.due_date);
    const notes = body.notes !== undefined ? String(body.notes).trim() : existing.notes || '';
    const invoiceNumber = String(body.invoice_number ?? existing.invoice_number).trim();

    if (!tenantName || !suiteReference || totalAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Tenant, suite, and a positive total amount are required.' },
        { status: 400 }
      );
    }

    let qboInvoiceId = existing.qbo_invoice_id as string | null;
    let qboSyncToken = existing.qbo_sync_token as string | null;
    let qboCustomerId = existing.qbo_customer_id as string | null;
    let qboSynced = false;

    if (connected && isRealQboEntityId(qboInvoiceId)) {
      const updatedQbo = await updateQuickBooksInvoice(qboInvoiceId!, {
        invoiceNumber,
        tenantName,
        suiteReference,
        baseRent,
        camAmount,
        dueDate,
        notes,
      });
      qboInvoiceId = updatedQbo.qboInvoiceId;
      qboSyncToken = updatedQbo.syncToken;
      qboCustomerId = updatedQbo.qboCustomerId;
      qboSynced = true;
    }

    const updated = await pool.query(
      `UPDATE invoices
       SET invoice_number = $1,
           tenant_name = $2,
           suite_reference = $3,
           base_rent = $4,
           cam_amount = $5,
           amount = $6,
           due_date = $7,
           notes = $8,
           qbo_invoice_id = $9,
           qbo_sync_token = $10,
           qbo_customer_id = $11,
           updated_at = NOW()
       WHERE id = $12
       RETURNING *`,
      [
        invoiceNumber,
        tenantName,
        suiteReference,
        baseRent,
        camAmount,
        totalAmount,
        dueDate,
        notes || null,
        qboInvoiceId,
        qboSyncToken,
        qboCustomerId,
        id,
      ]
    );

    return NextResponse.json({
      success: true,
      qbo_synced: qboSynced,
      invoice: updated.rows[0],
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update invoice';
    console.error('PUT /api/invoices error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/invoices?id=123&mode=void|delete
 * Strictly SUPER_ADMIN or ADMIN.
 * Voids or permanently deletes the Invoice in QuickBooks Online (if synced) and updates/deletes in PostgreSQL.
 */
export async function DELETE(request: NextRequest) {
  const { authenticated, authorized } = await verifyQuickBooksAccess(['SUPER_ADMIN', 'ADMIN']);
  if (!authenticated) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (!authorized) {
    return NextResponse.json(
      { success: false, error: 'Forbidden: Admin access required to void or delete invoices.' },
      { status: 403 }
    );
  }

  try {
    await ensureInvoiceColumns();
    const pool = getDbPool();
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get('id'));
    const mode = searchParams.get('mode') === 'delete' ? 'delete' : 'void';

    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ success: false, error: 'Valid invoice ID is required.' }, { status: 400 });
    }

    const existingRes = await pool.query(`SELECT * FROM invoices WHERE id = $1 LIMIT 1`, [id]);
    const existing = existingRes.rows[0];
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Invoice not found.' }, { status: 404 });
    }

    let qboSynced = false;
    if ((await isQboConnected()) && isRealQboEntityId(existing.qbo_invoice_id)) {
      await voidOrDeleteQuickBooksInvoice(existing.qbo_invoice_id, mode);
      qboSynced = true;
    }

    if (mode === 'void') {
      const updated = await pool.query(
        `UPDATE invoices
         SET status = 'VOIDED', updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [id]
      );
      return NextResponse.json({
        success: true,
        mode: 'void',
        qbo_synced: qboSynced,
        invoice: updated.rows[0],
      });
    }

    await pool.query(`DELETE FROM invoices WHERE id = $1`, [id]);
    return NextResponse.json({
      success: true,
      mode: 'delete',
      qbo_synced: qboSynced,
      deleted_id: id,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to void/delete invoice';
    console.error('DELETE /api/invoices error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
