import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import {
  verifyQuickBooksAccess,
  getValidTokens,
  fetchQuickBooksAccounts,
  fetchQuickBooksCustomers,
  fetchQuickBooksInvoices,
  fetchQuickBooksExpenses,
  fetchQuickBooksClassesAndLocations,
} from '@/lib/quickbooksUtils';
import { OFFICIAL_QBO_ACCOUNT_MAPPINGS } from '@/lib/qboData';

function classifyAccountDefault(accountName: string): {
  category: string;
  recovery: 'Recoverable' | 'Lease-Specific' | 'Non-Recoverable';
} {
  const lower = accountName.toLowerCase();

  // Exact or fuzzy match against HYCO's official 43-account mapping table
  const official = OFFICIAL_QBO_ACCOUNT_MAPPINGS.find(
    (m) => m.qbo_account_name.toLowerCase() === lower
  );
  if (official) {
    return {
      category: official.platform_category,
      recovery: official.default_recovery,
    };
  }

  if (lower.includes('utilit') || lower.includes('waste') || lower.includes('water') || lower.includes('electric')) {
    return { category: 'Utilities', recovery: 'Recoverable' };
  }
  if (lower.includes('landscap') || lower.includes('lawn') || lower.includes('grounds')) {
    return { category: 'Landscaping', recovery: 'Recoverable' };
  }
  if (lower.includes('insurance')) {
    return { category: 'Insurance', recovery: 'Recoverable' };
  }
  if (lower.includes('property tax') && !lower.includes('penalt')) {
    return { category: 'Property Taxes', recovery: 'Recoverable' };
  }
  if (lower.includes('roof')) {
    return { category: 'Roofing', recovery: 'Lease-Specific' };
  }
  if (lower.includes('hvac')) {
    return { category: 'HVAC', recovery: 'Recoverable' };
  }
  if (lower.includes('repair') || lower.includes('mainten') || lower.includes('plumb')) {
    return { category: 'Repairs & Maintenance', recovery: 'Recoverable' };
  }
  if (lower.includes('legal') || lower.includes('accounting') || lower.includes('professional')) {
    return { category: 'Professional Fees', recovery: 'Lease-Specific' };
  }
  if (lower.includes('remodel') || lower.includes('capital')) {
    return { category: 'Capital Expenditure', recovery: 'Non-Recoverable' };
  }

  return { category: 'Administrative', recovery: 'Non-Recoverable' };
}

async function ensureImportTablesAndColumns() {
  const pool = getDbPool();
  await pool.query(`
    ALTER TABLE invoices ADD COLUMN IF NOT EXISTS qbo_sync_token VARCHAR(50);
    ALTER TABLE invoices ADD COLUMN IF NOT EXISTS qbo_customer_id VARCHAR(100);
    ALTER TABLE invoices ADD COLUMN IF NOT EXISTS qbo_payment_id VARCHAR(100);
    ALTER TABLE invoices ADD COLUMN IF NOT EXISTS base_rent NUMERIC(10, 2) DEFAULT 0;
    ALTER TABLE invoices ADD COLUMN IF NOT EXISTS cam_amount NUMERIC(10, 2) DEFAULT 0;
    ALTER TABLE invoices ADD COLUMN IF NOT EXISTS notes TEXT;
    ALTER TABLE invoices ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

    CREATE TABLE IF NOT EXISTS tenants (
      id SERIAL PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      company VARCHAR(150),
      email VARCHAR(150),
      phone VARCHAR(50),
      property_name VARCHAR(150) DEFAULT '7898 Zionsville Rd Commercial Center',
      suite_number VARCHAR(50) DEFAULT 'TBD',
      monthly_rent NUMERIC(10, 2) DEFAULT 0,
      lease_start DATE DEFAULT CURRENT_DATE,
      lease_end DATE DEFAULT (CURRENT_DATE + INTERVAL '1 year'),
      qbo_customer_id VARCHAR(100),
      status VARCHAR(50) DEFAULT 'ACTIVE',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

/**
 * GET /api/integrations/quickbooks/import
 * Safe live Preview (Dry Run) of all data available in the connected QuickBooks Online company.
 * Writes NOTHING to PostgreSQL.
 */
export async function GET() {
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
    const tokens = await getValidTokens();
    const pool = getDbPool();

    const [accounts, customers, invoices, expenses, propertyRefs, localPropertiesRes] =
      await Promise.all([
        fetchQuickBooksAccounts(tokens),
        fetchQuickBooksCustomers(tokens),
        fetchQuickBooksInvoices(tokens),
        fetchQuickBooksExpenses(tokens),
        fetchQuickBooksClassesAndLocations(tokens),
        pool.query(`SELECT id, name, address FROM properties ORDER BY id ASC`),
      ]);

    const expenseAccounts = accounts.filter(
      (a) =>
        a.classification === 'Expense' ||
        a.accountType.toLowerCase().includes('expense') ||
        a.accountType.toLowerCase().includes('cost of goods')
    );

    const totalExpensesAmt = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalInvoicesAmt = invoices.reduce((sum, i) => sum + i.totalAmt, 0);
    const paidInvoicesCount = invoices.filter((i) => i.status === 'PAID').length;

    return NextResponse.json({
      success: true,
      realm_id: tokens.realmId,
      environment: (process.env.QB_ENVIRONMENT || 'production').toLowerCase().trim(),
      summary: {
        accounts_total: accounts.length,
        expense_accounts_total: expenseAccounts.length,
        expenses_total: expenses.length,
        expenses_amount: Number(totalExpensesAmt.toFixed(2)),
        bills_count: expenses.filter((e) => e.sourceType === 'Bill').length,
        purchases_count: expenses.filter((e) => e.sourceType === 'Purchase').length,
        invoices_total: invoices.length,
        invoices_paid: paidInvoicesCount,
        invoices_open: invoices.length - paidInvoicesCount,
        invoices_amount: Number(totalInvoicesAmt.toFixed(2)),
        customers_total: customers.length,
        property_refs_total: propertyRefs.length,
      },
      preview: {
        expense_accounts: expenseAccounts.slice(0, 12),
        expenses: expenses.slice(0, 10),
        invoices: invoices.slice(0, 10),
        customers: customers.slice(0, 10),
        property_refs: propertyRefs,
      },
      local_properties: localPropertiesRes.rows,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to preview QuickBooks data';
    console.error('GET /api/integrations/quickbooks/import error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * POST /api/integrations/quickbooks/import
 * Strictly SUPER_ADMIN or ADMIN.
 * Selectively imports selected QBO entities into PostgreSQL with full deduplication.
 */
export async function POST(request: NextRequest) {
  const { authenticated, authorized } = await verifyQuickBooksAccess(['SUPER_ADMIN', 'ADMIN']);
  if (!authenticated) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (!authorized) {
    return NextResponse.json(
      { success: false, error: 'Forbidden: Only administrators can run QuickBooks imports.' },
      { status: 403 }
    );
  }

  try {
    await ensureImportTablesAndColumns();
    const body = await request.json();

    const importAccounts = Boolean(body.import_accounts);
    const importExpenses = Boolean(body.import_expenses);
    const importInvoices = Boolean(body.import_invoices);
    const importCustomers = Boolean(body.import_customers);
    const importClassesAsProperties = Boolean(body.import_classes_as_properties);
    const defaultPropertyId = Number(body.default_property_id) || 1;

    if (
      !importAccounts &&
      !importExpenses &&
      !importInvoices &&
      !importCustomers &&
      !importClassesAsProperties
    ) {
      return NextResponse.json(
        { success: false, error: 'Select at least one dataset to import.' },
        { status: 400 }
      );
    }

    const tokens = await getValidTokens();
    const pool = getDbPool();

    const stats = {
      properties_imported: 0,
      accounts_synced: 0,
      expenses_imported: 0,
      expenses_updated: 0,
      customers_synced: 0,
      invoices_imported: 0,
      invoices_updated: 0,
    };

    // Load current properties map (lowercase name -> id)
    const propRes = await pool.query(`SELECT id, name FROM properties ORDER BY id ASC`);
    const propertyNameToId = new Map<string, number>();
    for (const p of propRes.rows) {
      propertyNameToId.set(String(p.name).toLowerCase(), Number(p.id));
    }

    // 1. Optional: Import QBO Classes / Locations as Properties
    if (importClassesAsProperties) {
      const refs = await fetchQuickBooksClassesAndLocations(tokens);
      for (const ref of refs) {
        const key = ref.name.trim().toLowerCase();
        if (!propertyNameToId.has(key)) {
          const inserted = await pool.query(
            `INSERT INTO properties (name, type, address, total_units, available_units, occupancy_rate)
             VALUES ($1, 'Commercial', 'Imported from QuickBooks Online', 0, 0, 0)
             RETURNING id`,
            [ref.name.trim()]
          );
          propertyNameToId.set(key, Number(inserted.rows[0].id));
          stats.properties_imported++;
        }
      }
    }

    // 2. Sync QBO Chart of Accounts -> qbo_account_mappings
    if (importAccounts || importExpenses) {
      const accounts = await fetchQuickBooksAccounts(tokens);
      const expenseAccounts = accounts.filter(
        (a) =>
          a.classification === 'Expense' ||
          a.accountType.toLowerCase().includes('expense') ||
          a.accountType.toLowerCase().includes('cost of goods')
      );

      for (const acct of expenseAccounts) {
        const acctName = acct.fullyQualifiedName || acct.name;
        const classified = classifyAccountDefault(acctName);

        await pool.query(
          `INSERT INTO qbo_account_mappings
            (qbo_account_id, qbo_account_name, platform_category, default_recovery, account_type, description, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())
           ON CONFLICT (qbo_account_name) DO UPDATE SET
             qbo_account_id = EXCLUDED.qbo_account_id,
             account_type = EXCLUDED.account_type,
             updated_at = NOW()`,
          [
            acct.id,
            acctName,
            classified.category,
            classified.recovery,
            acct.accountType || 'Expense',
            `Synced from QBO (${acct.accountSubType || acct.accountType})`,
          ]
        );
        stats.accounts_synced++;
      }
    }

    // 3. Import QBO Bills & Purchases -> property_expenses (Deduplicated by qbo_expense_id)
    if (importExpenses) {
      const expenses = await fetchQuickBooksExpenses(tokens);
      const mappingsRes = await pool.query(
        `SELECT id, qbo_account_id, qbo_account_name FROM qbo_account_mappings`
      );
      const mappingByName = new Map<string, number>();
      const mappingByQboId = new Map<string, number>();
      for (const m of mappingsRes.rows) {
        mappingByName.set(String(m.qbo_account_name).toLowerCase(), Number(m.id));
        if (m.qbo_account_id) {
          mappingByQboId.set(String(m.qbo_account_id), Number(m.id));
        }
      }

      for (const exp of expenses) {
        // Resolve account_mapping_id (create mapping on the fly if QBO expense uses an unmapped account)
        let mappingId =
          (exp.accountId ? mappingByQboId.get(exp.accountId) : undefined) ||
          mappingByName.get(exp.accountName.toLowerCase());

        if (!mappingId) {
          const classified = classifyAccountDefault(exp.accountName);
          const createdMap = await pool.query(
            `INSERT INTO qbo_account_mappings
              (qbo_account_id, qbo_account_name, platform_category, default_recovery, account_type, description, updated_at)
             VALUES ($1, $2, $3, $4, 'Expense', 'Auto-mapped during QBO expense sync', NOW())
             ON CONFLICT (qbo_account_name) DO UPDATE SET updated_at = NOW()
             RETURNING id`,
            [exp.accountId || null, exp.accountName, classified.category, classified.recovery]
          );
          mappingId = Number(createdMap.rows[0].id);
          mappingByName.set(exp.accountName.toLowerCase(), mappingId);
        }

        // Resolve target Property via QBO Class/Department name or fallback to defaultPropertyId
        const refTag = (exp.className || exp.departmentName || '').trim().toLowerCase();
        let targetPropertyId = defaultPropertyId;
        if (refTag) {
          for (const [propName, propId] of propertyNameToId.entries()) {
            if (propName === refTag || propName.includes(refTag) || refTag.includes(propName)) {
              targetPropertyId = propId;
              break;
            }
          }
        }

        const existingExp = await pool.query(
          `SELECT id FROM property_expenses WHERE qbo_expense_id = $1 LIMIT 1`,
          [exp.qboExpenseId]
        );

        if (existingExp.rows.length > 0) {
          await pool.query(
            `UPDATE property_expenses
             SET property_id = $1,
                 account_mapping_id = $2,
                 vendor_name = $3,
                 amount = $4,
                 expense_date = $5,
                 fiscal_year = $6,
                 payment_method = $7,
                 description = $8
             WHERE id = $9`,
            [
              targetPropertyId,
              mappingId,
              exp.vendorName,
              exp.amount,
              exp.expenseDate,
              exp.fiscalYear,
              exp.paymentMethod,
              exp.description,
              existingExp.rows[0].id,
            ]
          );
          stats.expenses_updated++;
        } else {
          await pool.query(
            `INSERT INTO property_expenses
              (property_id, account_mapping_id, qbo_expense_id, vendor_name, amount, expense_date, fiscal_year, payment_method, description)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              targetPropertyId,
              mappingId,
              exp.qboExpenseId,
              exp.vendorName,
              exp.amount,
              exp.expenseDate,
              exp.fiscalYear,
              exp.paymentMethod,
              exp.description,
            ]
          );
          stats.expenses_imported++;
        }
      }
    }

    // 4. Import QBO Customers -> tenants (Deduplicated by qbo_customer_id)
    if (importCustomers) {
      const customers = await fetchQuickBooksCustomers(tokens);
      const defaultPropName =
        propRes.rows.find((p) => Number(p.id) === defaultPropertyId)?.name ||
        '7898 Zionsville Rd Commercial Center';

      for (const cust of customers) {
        const existingTenant = await pool.query(
          `SELECT id FROM tenants WHERE qbo_customer_id = $1 OR LOWER(name) = LOWER($2) LIMIT 1`,
          [cust.id, cust.displayName]
        );

        if (existingTenant.rows.length > 0) {
          await pool.query(
            `UPDATE tenants
             SET qbo_customer_id = $1,
                 company = COALESCE(NULLIF($2, ''), company),
                 email = COALESCE(NULLIF($3, ''), email),
                 phone = COALESCE(NULLIF($4, ''), phone)
             WHERE id = $5`,
            [cust.id, cust.companyName, cust.email, cust.phone, existingTenant.rows[0].id]
          );
        } else {
          await pool.query(
            `INSERT INTO tenants
              (name, company, email, phone, property_name, suite_number, monthly_rent, qbo_customer_id, status)
             VALUES ($1, $2, $3, $4, $5, $6, 0, $7, 'ACTIVE')`,
            [
              cust.displayName,
              cust.companyName || cust.displayName,
              cust.email || 'billing@pending-update.com',
              cust.phone || '—',
              cust.parentName || defaultPropName,
              cust.isSubCustomer ? cust.displayName : 'QBO Imported',
              cust.id,
            ]
          );
        }
        stats.customers_synced++;
      }
    }

    // 5. Import Historical QBO Invoices -> invoices (Deduplicated by qbo_invoice_id)
    if (importInvoices) {
      const invoices = await fetchQuickBooksInvoices(tokens);
      for (const inv of invoices) {
        if (inv.totalAmt <= 0) continue;

        const existingInv = await pool.query(
          `SELECT id FROM invoices WHERE qbo_invoice_id = $1 LIMIT 1`,
          [inv.id]
        );

        if (existingInv.rows.length > 0) {
          await pool.query(
            `UPDATE invoices
             SET qbo_sync_token = $1,
                 qbo_customer_id = $2,
                 tenant_name = $3,
                 amount = $4,
                 due_date = $5,
                 status = $6,
                 paid_at = CASE WHEN $6 = 'PAID' AND paid_at IS NULL THEN NOW() ELSE paid_at END,
                 updated_at = NOW()
             WHERE id = $7`,
            [
              inv.syncToken,
              inv.customerId || null,
              inv.customerName,
              inv.totalAmt,
              inv.dueDate,
              inv.status,
              existingInv.rows[0].id,
            ]
          );
          stats.invoices_updated++;
        } else {
          // Ensure unique invoice_number if collision with existing local invoice
          let safeDocNumber = inv.docNumber;
          const numCheck = await pool.query(
            `SELECT id FROM invoices WHERE invoice_number = $1 LIMIT 1`,
            [safeDocNumber]
          );
          if (numCheck.rows.length > 0) {
            safeDocNumber = `${inv.docNumber}-QBO${inv.id}`;
          }

          await pool.query(
            `INSERT INTO invoices
              (invoice_number, qbo_invoice_id, qbo_sync_token, qbo_customer_id, tenant_name, suite_reference,
               base_rent, cam_amount, amount, due_date, status, notes, paid_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $7, $8, $9, $10, $11, NOW())`,
            [
              safeDocNumber,
              inv.id,
              inv.syncToken,
              inv.customerId || null,
              inv.customerName,
              'Imported from QBO',
              inv.totalAmt,
              inv.dueDate,
              inv.status,
              inv.privateNote || `Imported from QBO Invoice #${inv.id}`,
              inv.status === 'PAID' ? inv.txnDate : null,
            ]
          );
          stats.invoices_imported++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to import from QuickBooks';
    console.error('POST /api/integrations/quickbooks/import error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
