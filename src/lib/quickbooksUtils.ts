import crypto from 'crypto';
import { cookies } from 'next/headers';
import type { PoolClient } from 'pg';
import { getDbPool } from './db';
import { isSessionValid, SessionUser } from './auth';

/**
 * QuickBooks Online (QBO) OAuth 2.0 & Accounting API Utilities
 * Enterprise-grade token management with:
 * - AES-256-GCM token encryption at rest (transparently backward-compatible)
 * - PostgreSQL Advisory Lock + In-Memory Mutex (zero race-condition invalid_grant)
 * - Transient error retry with exponential backoff (never drops connection on network blips)
 * - Proactive keep-alive renewal (45m background + 10m on-demand margin)
 * - Strict HMAC-signed RBAC session verification
 */

// Mutex in-memory to serialize concurrent calls within the same Node.js process
let activeRefreshPromise: Promise<{ accessToken: string; realmId: string; tokenExpiresAt?: string }> | null = null;

// Dedicated PostgreSQL advisory lock key for QuickBooks token rotation
const QB_ADVISORY_LOCK_KEY = 78982026;
const TOKEN_ENC_PREFIX = 'enc:v1:';

function getTokenEncryptionKey(): Buffer {
  const secret = process.env.SESSION_SECRET || 'hyco_production_security_key_2026_x89a1';
  return crypto.createHash('sha256').update(`${secret}:qbo-oauth-tokens`).digest();
}

/**
 * Encrypts sensitive OAuth tokens at rest using AES-256-GCM.
 */
export function encryptQbToken(plainText: string): string {
  if (!plainText) return plainText;
  if (plainText.startsWith(TOKEN_ENC_PREFIX)) return plainText;
  const key = getTokenEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${TOKEN_ENC_PREFIX}${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypts AES-256-GCM stored tokens. Transparently accepts legacy plaintext tokens
 * so existing connections seamlessly upgrade to encrypted storage on next refresh.
 */
export function decryptQbToken(storedValue: string): string {
  if (!storedValue) return storedValue;
  if (!storedValue.startsWith(TOKEN_ENC_PREFIX)) {
    return storedValue;
  }
  const payload = storedValue.slice(TOKEN_ENC_PREFIX.length);
  const parts = payload.split(':');
  if (parts.length !== 3) return storedValue;
  const [ivHex, tagHex, encHex] = parts;
  const key = getTokenEncryptionKey();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encHex, 'hex')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}

/**
 * Verifies authenticated HMAC-signed session and RBAC role for QuickBooks endpoints.
 */
export async function verifyQuickBooksAccess(
  allowedRoles: string[] = ['SUPER_ADMIN', 'ADMIN']
): Promise<{ authorized: boolean; authenticated: boolean; user?: SessionUser }> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('hyco_session');
    if (!sessionCookie?.value) {
      return { authorized: false, authenticated: false };
    }
    const session: SessionUser = JSON.parse(sessionCookie.value);
    if (!isSessionValid(session)) {
      return { authorized: false, authenticated: false };
    }
    if (!allowedRoles.includes(session.role)) {
      return { authorized: false, authenticated: true, user: session };
    }
    return { authorized: true, authenticated: true, user: session };
  } catch {
    return { authorized: false, authenticated: false };
  }
}

export interface QuickBooksTokenData {
  accessToken: string;
  realmId: string;
}

export interface QuickBooksItem {
  Id: string;
  Name: string;
  Description?: string;
  Active: boolean;
  Type: 'Service' | 'Inventory' | 'NonInventory' | 'Category';
  UnitPrice?: number;
  PurchaseCost?: number;
  IncomeAccountRef?: {
    value: string;
    name: string;
  };
  ParentRef?: {
    value: string;
    name: string;
  };
  SubItem?: boolean;
  Level?: number;
}

export interface GroupedCategory {
  categoryId: string;
  categoryName: string;
  items: QuickBooksItem[];
}

/**
 * Resolves the Intuit QBO Base API URL based on environment.
 */
export function getQuickBooksBaseUrl(): string {
  const env = (process.env.QB_ENVIRONMENT || 'production').toLowerCase().trim();
  return env === 'sandbox'
    ? 'https://sandbox-quickbooks.api.intuit.com'
    : 'https://quickbooks.api.intuit.com';
}

/**
 * Checks if QB Client ID and Client Secret are configured in environment variables.
 */
export function isEnvironmentConfigured(): boolean {
  return Boolean(
    process.env.QB_CLIENT_ID?.trim() && process.env.QB_CLIENT_SECRET?.trim()
  );
}

/**
 * Internal helper: executes token refresh safely under a PostgreSQL advisory lock
 * so multiple workers, restarts, or concurrent requests can never race on token rotation.
 */
async function executeLockedRefresh(options: {
  marginMs: number;
  force?: boolean;
}): Promise<{
  status: 'refreshed' | 'valid' | 'disconnected' | 'skipped';
  accessToken?: string;
  realmId?: string;
  tokenExpiresAt?: string;
}> {
  const pool = getDbPool();
  const client = await pool.connect();

  try {
    await client.query('SELECT pg_advisory_lock($1)', [QB_ADVISORY_LOCK_KEY]);

    const res = await client.query(
      `SELECT id, is_connected, realm_id, access_token, refresh_token, token_expires_at, updated_at
       FROM settings_integrations
       WHERE provider = 'quickbooks'
       LIMIT 1`
    );

    const row = res.rows[0];
    if (!row || !row.is_connected || !row.refresh_token) {
      return { status: 'disconnected' };
    }

    const now = Date.now();
    const tokenExpiresAtMs = row.token_expires_at ? new Date(row.token_expires_at).getTime() : 0;
    const isEncryptedAlready =
      typeof row.access_token === 'string' &&
      row.access_token.startsWith(TOKEN_ENC_PREFIX) &&
      typeof row.refresh_token === 'string' &&
      row.refresh_token.startsWith(TOKEN_ENC_PREFIX);

    // If token is still fresh beyond margin (and already encrypted), no Intuit call needed
    if (!options.force && isEncryptedAlready && tokenExpiresAtMs - now > options.marginMs) {
      return {
        status: 'valid',
        accessToken: decryptQbToken(row.access_token),
        realmId: row.realm_id,
        tokenExpiresAt: new Date(tokenExpiresAtMs).toISOString(),
      };
    }

    // Security Guard: Prevent accidental refresh in local dev unless explicitly enabled
    if (
      process.env.NODE_ENV === 'development' &&
      process.env.ENABLE_LOCAL_QB_REFRESH !== 'true'
    ) {
      if (tokenExpiresAtMs - now > 0 && row.access_token) {
        return {
          status: 'valid',
          accessToken: decryptQbToken(row.access_token),
          realmId: row.realm_id,
          tokenExpiresAt: new Date(tokenExpiresAtMs).toISOString(),
        };
      }
      throw new Error(
        'Local QB token refresh blocked: ENABLE_LOCAL_QB_REFRESH is not true. This guard prevents invalidating production tokens.'
      );
    }

    const plainRefreshToken = decryptQbToken(row.refresh_token);
    const refreshed = await callIntuitTokenRefreshWithRetry(plainRefreshToken, row.realm_id, client);

    return {
      status: 'refreshed',
      accessToken: refreshed.accessToken,
      realmId: refreshed.realmId,
      tokenExpiresAt: refreshed.tokenExpiresAt,
    };
  } finally {
    try {
      await client.query('SELECT pg_advisory_unlock($1)', [QB_ADVISORY_LOCK_KEY]);
    } catch {
      // Ignore unlock error if connection dropped
    }
    client.release();
  }
}

/**
 * Calls Intuit OAuth2 token endpoint with transient retry/backoff and persists AES-256-GCM tokens.
 * NEVER disconnects on transient network/5xx errors; only marks disconnected on confirmed invalid_grant.
 */
async function callIntuitTokenRefreshWithRetry(
  storedRefreshToken: string,
  realmId: string,
  client: PoolClient
): Promise<QuickBooksTokenData & { tokenExpiresAt: string }> {
  const clientId = process.env.QB_CLIENT_ID?.trim();
  const clientSecret = process.env.QB_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    throw new Error('Missing QB_CLIENT_ID or QB_CLIENT_SECRET environment variables.');
  }

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const params = new URLSearchParams();
  params.append('grant_type', 'refresh_token');
  params.append('refresh_token', storedRefreshToken);

  const MAX_ATTEMPTS = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: params.toString(),
      });

      // Retry transient upstream errors (5xx / 429) without disconnecting
      if ((response.status >= 500 || response.status === 429) && attempt < MAX_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
        continue;
      }

      const data = await response.json();

      if (!response.ok || data.error) {
        if (data.error === 'invalid_grant') {
          // Confirmed revoked/expired refresh token while holding DB advisory lock
          await client.query(
            `UPDATE settings_integrations
             SET is_connected = FALSE, updated_at = NOW()
             WHERE provider = 'quickbooks'`
          );
        }
        throw new Error(
          `QuickBooks refresh token error: ${data.error_description || data.error || `HTTP ${response.status}`}`
        );
      }

      const newAccessToken: string = data.access_token;
      // Preserve existing refresh_token if Intuit omits it in a response
      const newRefreshToken: string = data.refresh_token || storedRefreshToken;
      const expiresInSec = Number(data.expires_in) || 3600;
      const newExpiresAt = new Date(Date.now() + expiresInSec * 1000);

      await client.query(
        `UPDATE settings_integrations
         SET access_token = $1,
             refresh_token = $2,
             token_expires_at = $3,
             is_connected = TRUE,
             updated_at = NOW()
         WHERE provider = 'quickbooks'`,
        [encryptQbToken(newAccessToken), encryptQbToken(newRefreshToken), newExpiresAt]
      );

      return {
        accessToken: newAccessToken,
        realmId,
        tokenExpiresAt: newExpiresAt.toISOString(),
      };
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // Do not retry confirmed OAuth errors (e.g. invalid_grant / invalid_client)
      if (lastError.message.includes('QuickBooks refresh token error')) {
        throw lastError;
      }
      if (attempt < MAX_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
        continue;
      }
    }
  }

  throw lastError || new Error('QuickBooks token refresh failed after retries');
}

/**
 * Proactive keep-alive renewal used by internal server instrumentation (every 45m)
 * and manual SUPER_ADMIN verification.
 */
export async function keepAliveQuickBooksToken(options?: { force?: boolean }): Promise<{
  status: 'refreshed' | 'valid' | 'disconnected' | 'skipped';
  realmId?: string;
  tokenExpiresAt?: string;
}> {
  if (!isEnvironmentConfigured()) {
    return { status: 'skipped' };
  }

  const PROACTIVE_MARGIN_MS = 15 * 60 * 1000; // Refresh if within 15 minutes of expiry
  const result = await executeLockedRefresh({
    marginMs: PROACTIVE_MARGIN_MS,
    force: Boolean(options?.force),
  });

  return {
    status: result.status,
    realmId: result.realmId,
    tokenExpiresAt: result.tokenExpiresAt,
  };
}

/**
 * Retrieves valid access token and realmId. Automatically refreshes token if within 10-minute expiry window.
 * Employs both an in-memory mutex and a PostgreSQL advisory lock to prevent 'invalid_grant' on token rotation.
 */
export async function getValidTokens(): Promise<QuickBooksTokenData> {
  const pool = getDbPool();

  const res = await pool.query(
    `SELECT id, is_connected, realm_id, access_token, refresh_token, token_expires_at, updated_at
     FROM settings_integrations
     WHERE provider = 'quickbooks'
     LIMIT 1`
  );
  const integration = res.rows[0];

  if (!integration || !integration.is_connected || !integration.access_token) {
    throw new Error('QuickBooks Online is not connected. Please connect your account first.');
  }

  const now = Date.now();
  const tokenExpiresAt = integration.token_expires_at ? new Date(integration.token_expires_at).getTime() : 0;
  const MARGIN_MS = 10 * 60 * 1000; // 10 minutes safety margin
  const isEncryptedAlready =
    typeof integration.access_token === 'string' &&
    integration.access_token.startsWith(TOKEN_ENC_PREFIX);

  // Fast path: Token is still valid and already encrypted
  if (isEncryptedAlready && tokenExpiresAt - now > MARGIN_MS) {
    return {
      accessToken: decryptQbToken(integration.access_token),
      realmId: integration.realm_id,
    };
  }

  // Token is expired, expiring soon, or needs encryption upgrade — serialize via mutex + DB advisory lock
  if (activeRefreshPromise) {
    const shared = await activeRefreshPromise;
    return { accessToken: shared.accessToken, realmId: shared.realmId };
  }

  activeRefreshPromise = (async () => {
    try {
      const result = await executeLockedRefresh({ marginMs: MARGIN_MS, force: false });
      if (!result.accessToken || !result.realmId) {
        throw new Error('QuickBooks Online is not connected. Please connect your account first.');
      }
      return {
        accessToken: result.accessToken,
        realmId: result.realmId,
        tokenExpiresAt: result.tokenExpiresAt,
      };
    } finally {
      activeRefreshPromise = null;
    }
  })();

  const resolved = await activeRefreshPromise;
  return { accessToken: resolved.accessToken, realmId: resolved.realmId };
}

/**
 * Calls Intuit OAuth2 token endpoint to rotate refresh_token and obtain a new access_token.
 * Kept exported for compatibility; delegates to locked refresh.
 */
export async function refreshQuickBooksToken(): Promise<QuickBooksTokenData> {
  const result = await executeLockedRefresh({ marginMs: 0, force: true });
  if (!result.accessToken || !result.realmId) {
    throw new Error('QuickBooks Online is not connected.');
  }
  return { accessToken: result.accessToken, realmId: result.realmId };
}

/**
 * Exchanges authorization code received in callback for initial access & refresh tokens
 * and stores them encrypted with AES-256-GCM in PostgreSQL.
 */
export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string,
  realmId: string
): Promise<QuickBooksTokenData> {
  const pool = getDbPool();
  const clientId = process.env.QB_CLIENT_ID?.trim();
  const clientSecret = process.env.QB_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    throw new Error('Missing QB_CLIENT_ID or QB_CLIENT_SECRET environment variables.');
  }

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('code', code);
  params.append('redirect_uri', redirectUri);

  const response = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: params.toString(),
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    throw new Error(`QuickBooks token exchange error: ${data.error_description || data.error || 'Unknown error'}`);
  }

  const accessToken = data.access_token;
  const refreshToken = data.refresh_token;
  const expiresInSec = Number(data.expires_in) || 3600;
  const expiresAt = new Date(Date.now() + expiresInSec * 1000);

  await pool.query(
    `INSERT INTO settings_integrations 
      (provider, is_connected, realm_id, access_token, refresh_token, token_expires_at, updated_at)
     VALUES ('quickbooks', TRUE, $1, $2, $3, $4, NOW())
     ON CONFLICT (provider) DO UPDATE SET
       is_connected = TRUE,
       realm_id = EXCLUDED.realm_id,
       access_token = EXCLUDED.access_token,
       refresh_token = EXCLUDED.refresh_token,
       token_expires_at = EXCLUDED.token_expires_at,
       updated_at = NOW()`,
    [realmId, encryptQbToken(accessToken), encryptQbToken(refreshToken), expiresAt]
  );

  return {
    accessToken,
    realmId,
  };
}

/**
 * Fetches all active items from QuickBooks Online and groups them by category.
 */
export async function fetchQuickBooksItems(tokens: QuickBooksTokenData): Promise<{
  groupedCategories: GroupedCategory[];
  rawItems: QuickBooksItem[];
}> {
  const baseUrl = getQuickBooksBaseUrl();
  const query = 'SELECT * FROM Item WHERE Active = true MAXRESULTS 1000';
  const url = `${baseUrl}/v3/company/${tokens.realmId}/query?query=${encodeURIComponent(query)}&minorversion=65`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${tokens.accessToken}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch items from QuickBooks API: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const rawItems: QuickBooksItem[] = data.QueryResponse?.Item || [];

  // Group by category
  const categoriesMap = new Map<string, GroupedCategory>();
  const uncategorizedItems: QuickBooksItem[] = [];

  // 1. Identify category items
  for (const item of rawItems) {
    if (item.Type === 'Category') {
      categoriesMap.set(item.Id, {
        categoryId: item.Id,
        categoryName: item.Name,
        items: [],
      });
    }
  }

  // 2. Assign items to categories
  for (const item of rawItems) {
    if (item.Type === 'Category') continue;

    if (item.ParentRef?.value && categoriesMap.has(item.ParentRef.value)) {
      categoriesMap.get(item.ParentRef.value)!.items.push(item);
    } else {
      uncategorizedItems.push(item);
    }
  }

  const groupedCategories: GroupedCategory[] = Array.from(categoriesMap.values());
  if (uncategorizedItems.length > 0) {
    groupedCategories.push({
      categoryId: 'uncategorized',
      categoryName: 'General / Uncategorized',
      items: uncategorizedItems,
    });
  }

  return {
    groupedCategories,
    rawItems,
  };
}

// ==============================================================================
//   PHASE 1: REVENUE (A/R) WORKFLOW — PLATFORM -> QUICKBOOKS ONLINE (API v3)
//   Customers, Invoices (Create / Update / Void / Delete), and Payments
// ==============================================================================

export interface QboInvoicePayload {
  invoiceNumber: string;
  tenantName: string;
  tenantEmail?: string;
  suiteReference: string;
  baseRent: number;
  camAmount: number;
  dueDate: string; // YYYY-MM-DD
  notes?: string;
}

export interface QboInvoiceResult {
  qboInvoiceId: string;
  syncToken: string;
  qboCustomerId: string;
  docNumber: string;
  totalAmt: number;
}

export interface QboPaymentResult {
  qboPaymentId: string;
  syncToken: string;
  totalAmt: number;
}

interface QboServiceConfigMap {
  [key: string]: { qb_id?: string; qb_name?: string } | undefined;
}

function escapeQboQueryValue(value: string): string {
  return value.replace(/'/g, "\\'");
}

/**
 * Checks whether a stored qbo_invoice_id is a real numeric QuickBooks Online Entity ID
 * (as opposed to a legacy placeholder like 'REC-10492').
 */
export function isRealQboEntityId(id?: string | null): boolean {
  if (!id) return false;
  return /^\d+$/.test(String(id).trim());
}

/**
 * Helper to execute authenticated QuickBooks Online v3 API requests with structured error parsing.
 */
async function qboApiRequest<T = Record<string, unknown>>(
  tokens: QuickBooksTokenData,
  path: string,
  options: { method?: 'GET' | 'POST'; body?: unknown } = {}
): Promise<T> {
  const baseUrl = getQuickBooksBaseUrl();
  const separator = path.includes('?') ? '&' : '?';
  const url = `${baseUrl}/v3/company/${tokens.realmId}${path}${separator}minorversion=65`;

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });

  const text = await response.text();
  let json: Record<string, unknown> = {};
  try {
    json = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    // Non-JSON response
  }

  if (!response.ok) {
    const fault = json.Fault as { Error?: Array<{ Message?: string; Detail?: string }> } | undefined;
    const faultDetail =
      fault?.Error?.[0]?.Detail || fault?.Error?.[0]?.Message || text || `HTTP ${response.status}`;
    throw new Error(`QuickBooks API error (${response.status}): ${faultDetail}`);
  }

  return json as T;
}

/**
 * Finds an existing QuickBooks Customer by DisplayName or creates one automatically.
 */
export async function ensureQuickBooksCustomer(
  tokens: QuickBooksTokenData,
  displayName: string,
  email?: string
): Promise<{ id: string; displayName: string }> {
  const cleanName = displayName.trim().slice(0, 100);
  const queryStr = `SELECT Id, DisplayName FROM Customer WHERE DisplayName = '${escapeQboQueryValue(
    cleanName
  )}' MAXRESULTS 1`;

  const searchRes = await qboApiRequest<{
    QueryResponse?: { Customer?: Array<{ Id: string; DisplayName: string }> };
  }>(tokens, `/query?query=${encodeURIComponent(queryStr)}`);

  const existing = searchRes.QueryResponse?.Customer?.[0];
  if (existing?.Id) {
    return { id: existing.Id, displayName: existing.DisplayName };
  }

  const createPayload: Record<string, unknown> = {
    DisplayName: cleanName,
    CompanyName: cleanName,
  };
  if (email && email.includes('@')) {
    createPayload.PrimaryEmailAddr = { Address: email.trim() };
  }

  const createRes = await qboApiRequest<{
    Customer?: { Id: string; DisplayName: string };
  }>(tokens, '/customer', {
    method: 'POST',
    body: createPayload,
  });

  if (!createRes.Customer?.Id) {
    throw new Error('QuickBooks did not return a Customer ID.');
  }

  return {
    id: createRes.Customer.Id,
    displayName: createRes.Customer.DisplayName,
  };
}

/**
 * Resolves QBO Service Item references from saved service_config mappings,
 * falling back cleanly to the first active Service/NonInventory item in QBO.
 */
async function resolveQboInvoiceItemRefs(tokens: QuickBooksTokenData): Promise<{
  baseRentItem: { value: string; name: string };
  camItem: { value: string; name: string };
}> {
  const pool = getDbPool();
  let config: QboServiceConfigMap = {};
  try {
    const res = await pool.query(
      `SELECT service_config FROM settings_integrations WHERE provider = 'quickbooks' LIMIT 1`
    );
    config = (res.rows[0]?.service_config || {}) as QboServiceConfigMap;
  } catch {
    // Fallback to live lookup
  }

  const mappedBase = config.base_commercial_rent;
  const mappedCam = config.cam_operating_recovery;

  if (mappedBase?.qb_id && mappedCam?.qb_id) {
    return {
      baseRentItem: { value: mappedBase.qb_id, name: mappedBase.qb_name || 'Base Commercial Rent' },
      camItem: { value: mappedCam.qb_id, name: mappedCam.qb_name || 'CAM Operating Recovery' },
    };
  }

  // Query active billable items in QBO so Sandbox works out-of-the-box even before manual mapping
  const { rawItems } = await fetchQuickBooksItems(tokens);
  const billableItems = rawItems.filter(
    (item) => item.Active && (item.Type === 'Service' || item.Type === 'NonInventory')
  );

  const fallbackFirst = billableItems[0];
  if (!fallbackFirst && !mappedBase?.qb_id) {
    throw new Error(
      'No active Service items found in QuickBooks Online. Please create at least one Service item in QBO.'
    );
  }

  const baseRef = mappedBase?.qb_id
    ? { value: mappedBase.qb_id, name: mappedBase.qb_name || 'Base Commercial Rent' }
    : { value: fallbackFirst.Id, name: fallbackFirst.Name };

  const camRef = mappedCam?.qb_id
    ? { value: mappedCam.qb_id, name: mappedCam.qb_name || 'CAM Operating Recovery' }
    : billableItems[1]
    ? { value: billableItems[1].Id, name: billableItems[1].Name }
    : baseRef;

  return { baseRentItem: baseRef, camItem: camRef };
}

function buildQboInvoiceLines(
  input: QboInvoicePayload,
  refs: { baseRentItem: { value: string; name: string }; camItem: { value: string; name: string } }
): Array<Record<string, unknown>> {
  const lines: Array<Record<string, unknown>> = [];
  const baseAmt = Number(input.baseRent) || 0;
  const camAmt = Number(input.camAmount) || 0;

  if (baseAmt > 0) {
    lines.push({
      Amount: Number(baseAmt.toFixed(2)),
      DetailType: 'SalesItemLineDetail',
      Description: `Base Commercial Rent — ${input.suiteReference}`,
      SalesItemLineDetail: {
        ItemRef: refs.baseRentItem,
        Qty: 1,
        UnitPrice: Number(baseAmt.toFixed(2)),
      },
    });
  }

  if (camAmt > 0) {
    lines.push({
      Amount: Number(camAmt.toFixed(2)),
      DetailType: 'SalesItemLineDetail',
      Description: `CAM Operating Recovery — ${input.suiteReference}`,
      SalesItemLineDetail: {
        ItemRef: refs.camItem,
        Qty: 1,
        UnitPrice: Number(camAmt.toFixed(2)),
      },
    });
  }

  if (lines.length === 0) {
    throw new Error('Invoice must have a positive Base Rent or CAM amount.');
  }

  return lines;
}

/**
 * Creates a live Invoice in QuickBooks Online (auto-creating the Customer if needed).
 */
export async function createQuickBooksInvoice(input: QboInvoicePayload): Promise<QboInvoiceResult> {
  const tokens = await getValidTokens();
  const customer = await ensureQuickBooksCustomer(tokens, input.tenantName, input.tenantEmail);
  const itemRefs = await resolveQboInvoiceItemRefs(tokens);
  const lines = buildQboInvoiceLines(input, itemRefs);

  const today = new Date().toISOString().split('T')[0];
  const payload = {
    DocNumber: input.invoiceNumber.slice(0, 21),
    TxnDate: today,
    DueDate: input.dueDate,
    CustomerRef: { value: customer.id, name: customer.displayName },
    PrivateNote: input.notes
      ? `${input.suiteReference} | ${input.notes}`
      : `HYCO Property Management — ${input.suiteReference}`,
    Line: lines,
  };

  const res = await qboApiRequest<{
    Invoice?: { Id: string; SyncToken: string; DocNumber?: string; TotalAmt?: number };
  }>(tokens, '/invoice', {
    method: 'POST',
    body: payload,
  });

  if (!res.Invoice?.Id) {
    throw new Error('QuickBooks did not return an Invoice ID.');
  }

  return {
    qboInvoiceId: res.Invoice.Id,
    syncToken: res.Invoice.SyncToken || '0',
    qboCustomerId: customer.id,
    docNumber: res.Invoice.DocNumber || input.invoiceNumber,
    totalAmt: Number(res.Invoice.TotalAmt ?? input.baseRent + input.camAmount),
  };
}

/**
 * Fetches current SyncToken from QuickBooks and updates an existing live Invoice.
 */
export async function updateQuickBooksInvoice(
  qboInvoiceId: string,
  input: QboInvoicePayload
): Promise<QboInvoiceResult> {
  const tokens = await getValidTokens();

  // Always read latest SyncToken from QBO to prevent Error 5010 (Stale Object)
  const existingRes = await qboApiRequest<{
    Invoice?: {
      Id: string;
      SyncToken: string;
      CustomerRef?: { value: string; name?: string };
      TxnDate?: string;
    };
  }>(tokens, `/invoice/${encodeURIComponent(qboInvoiceId)}`);

  const existing = existingRes.Invoice;
  if (!existing?.Id) {
    throw new Error(`QuickBooks Invoice #${qboInvoiceId} not found.`);
  }

  const customer = await ensureQuickBooksCustomer(tokens, input.tenantName, input.tenantEmail);
  const itemRefs = await resolveQboInvoiceItemRefs(tokens);
  const lines = buildQboInvoiceLines(input, itemRefs);

  const updatePayload = {
    Id: existing.Id,
    SyncToken: existing.SyncToken,
    sparse: true,
    DocNumber: input.invoiceNumber.slice(0, 21),
    DueDate: input.dueDate,
    CustomerRef: { value: customer.id, name: customer.displayName },
    PrivateNote: input.notes
      ? `${input.suiteReference} | ${input.notes}`
      : `HYCO Property Management — ${input.suiteReference}`,
    Line: lines,
  };

  const updatedRes = await qboApiRequest<{
    Invoice?: { Id: string; SyncToken: string; DocNumber?: string; TotalAmt?: number };
  }>(tokens, '/invoice', {
    method: 'POST',
    body: updatePayload,
  });

  if (!updatedRes.Invoice?.Id) {
    throw new Error('QuickBooks update did not return an Invoice.');
  }

  return {
    qboInvoiceId: updatedRes.Invoice.Id,
    syncToken: updatedRes.Invoice.SyncToken || existing.SyncToken,
    qboCustomerId: customer.id,
    docNumber: updatedRes.Invoice.DocNumber || input.invoiceNumber,
    totalAmt: Number(updatedRes.Invoice.TotalAmt ?? input.baseRent + input.camAmount),
  };
}

/**
 * Voids (sets balance to $0, preserves audit trail) or permanently deletes an Invoice in QBO.
 */
export async function voidOrDeleteQuickBooksInvoice(
  qboInvoiceId: string,
  mode: 'void' | 'delete' = 'void'
): Promise<{ qboInvoiceId: string; mode: 'void' | 'delete' }> {
  const tokens = await getValidTokens();

  // Fetch latest SyncToken first
  const existingRes = await qboApiRequest<{
    Invoice?: { Id: string; SyncToken: string };
  }>(tokens, `/invoice/${encodeURIComponent(qboInvoiceId)}`);

  const existing = existingRes.Invoice;
  if (!existing?.Id) {
    throw new Error(`QuickBooks Invoice #${qboInvoiceId} not found.`);
  }

  await qboApiRequest(tokens, `/invoice?operation=${mode}`, {
    method: 'POST',
    body: {
      Id: existing.Id,
      SyncToken: existing.SyncToken,
    },
  });

  return { qboInvoiceId: existing.Id, mode };
}

/**
 * Records a Customer Payment in QuickBooks Online linked directly to a QBO Invoice.
 */
export async function recordQuickBooksPayment(input: {
  qboCustomerId: string;
  qboInvoiceId: string;
  amount: number;
  txnDate?: string;
  paymentRefNum?: string;
}): Promise<QboPaymentResult> {
  const tokens = await getValidTokens();
  const txnDate = input.txnDate || new Date().toISOString().split('T')[0];
  const totalAmt = Number(Number(input.amount).toFixed(2));

  const payload = {
    CustomerRef: { value: input.qboCustomerId },
    TotalAmt: totalAmt,
    TxnDate: txnDate,
    ...(input.paymentRefNum ? { PaymentRefNum: input.paymentRefNum.slice(0, 21) } : {}),
    Line: [
      {
        Amount: totalAmt,
        LinkedTxn: [
          {
            TxnId: input.qboInvoiceId,
            TxnType: 'Invoice',
          },
        ],
      },
    ],
  };

  const res = await qboApiRequest<{
    Payment?: { Id: string; SyncToken: string; TotalAmt?: number };
  }>(tokens, '/payment', {
    method: 'POST',
    body: payload,
  });

  if (!res.Payment?.Id) {
    throw new Error('QuickBooks did not return a Payment ID.');
  }

  return {
    qboPaymentId: res.Payment.Id,
    syncToken: res.Payment.SyncToken || '0',
    totalAmt: Number(res.Payment.TotalAmt ?? totalAmt),
  };
}

/**
 * Resilient fallback sample products/services for preview/offline mode
 */
export const SAMPLE_QBO_REAL_ESTATE_ITEMS: QuickBooksItem[] = [
  {
    Id: '101',
    Name: 'Commercial Suite Rent (Base)',
    Description: 'Base monthly commercial suite rental charges',
    Active: true,
    Type: 'Service',
    UnitPrice: 3600.0,
    IncomeAccountRef: { value: '401', name: 'Rental Income: Commercial' },
  },
  {
    Id: '102',
    Name: 'CAM Monthly Recovery Fee',
    Description: 'Common Area Maintenance pro-rata operational recovery fee',
    Active: true,
    Type: 'Service',
    UnitPrice: 320.0,
    IncomeAccountRef: { value: '402', name: 'CAM Recovery Revenue' },
  },
  {
    Id: '103',
    Name: 'CAM Annual True-Up Adjustment',
    Description: 'Year-end reconciliation settlement invoice / adjustment credit',
    Active: true,
    Type: 'Service',
    UnitPrice: 0.0,
    IncomeAccountRef: { value: '402', name: 'CAM Recovery Revenue' },
  },
  {
    Id: '104',
    Name: 'Real Estate Property Taxes Pass-Through',
    Description: 'Tenant pro-rata Marion County property tax allocation',
    Active: true,
    Type: 'Service',
    UnitPrice: 185.0,
    IncomeAccountRef: { value: '403', name: 'Tax Pass-Through Recovery' },
  },
  {
    Id: '105',
    Name: 'Building Hazard & Liability Insurance',
    Description: 'Commercial complex insurance surcharge recovery',
    Active: true,
    Type: 'Service',
    UnitPrice: 95.0,
    IncomeAccountRef: { value: '404', name: 'Insurance Recovery Revenue' },
  },
  {
    Id: '106',
    Name: 'Utility & Waste Metered Surcharge',
    Description: 'Metered water, electrical and dumpster disposal chargeback',
    Active: true,
    Type: 'Service',
    UnitPrice: 140.0,
    IncomeAccountRef: { value: '405', name: 'Utility Recovery Revenue' },
  },
  {
    Id: '107',
    Name: 'Commercial Late Payment Penalty',
    Description: 'Contractual late fee for rent received after the 5th calendar day',
    Active: true,
    Type: 'Service',
    UnitPrice: 150.0,
    IncomeAccountRef: { value: '406', name: 'Late Fee & Penalty Income' },
  },
  {
    Id: '108',
    Name: 'Security Deposit (Tenant Escrow)',
    Description: 'Refundable commercial lease security deposit liability',
    Active: true,
    Type: 'NonInventory',
    UnitPrice: 7200.0,
    IncomeAccountRef: { value: '201', name: 'Security Deposits Held (Liability)' },
  },
  {
    Id: '109',
    Name: 'Dedicated Suite Maintenance Chargeback',
    Description: 'Direct tenant-requested internal repair or lock replacement',
    Active: true,
    Type: 'Service',
    UnitPrice: 250.0,
    IncomeAccountRef: { value: '407', name: 'Maintenance Service Income' },
  },
];
