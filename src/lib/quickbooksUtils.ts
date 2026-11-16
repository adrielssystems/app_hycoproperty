import { getDbPool } from './db';

/**
 * QuickBooks Online (QBO) OAuth 2.0 & Accounting API Utilities
 * Enterprise-grade token management with Mutex lock, auto-refresh and security guards.
 */

// Mutex in-memory to prevent race conditions during OAuth token rotation
let activeRefreshPromise: Promise<{ accessToken: string; realmId: string }> | null = null;

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
 * Retrieves valid access token and realmId. Automatically refreshes token if within 5-minute expiry window.
 * Employs a mutex lock to prevent concurrent refresh calls from triggering 'invalid_grant' on token rotation.
 */
export async function getValidTokens(): Promise<QuickBooksTokenData> {
  const pool = getDbPool();

  const queryIntegration = async () => {
    const res = await pool.query(
      `SELECT id, is_connected, realm_id, access_token, refresh_token, token_expires_at, updated_at
       FROM settings_integrations
       WHERE provider = 'quickbooks'
       LIMIT 1`
    );
    return res.rows[0];
  };

  const integration = await queryIntegration();

  if (!integration || !integration.is_connected || !integration.access_token) {
    throw new Error('QuickBooks Online is not connected. Please connect your account first.');
  }

  const now = Date.now();
  const tokenExpiresAt = integration.token_expires_at ? new Date(integration.token_expires_at).getTime() : 0;
  const MARGIN_MS = 5 * 60 * 1000; // 5 minutes margin

  // Token is still valid
  if (tokenExpiresAt - now > MARGIN_MS) {
    return {
      accessToken: integration.access_token,
      realmId: integration.realm_id,
    };
  }

  // Token is expired or expiring soon - execute refresh with Mutex
  if (activeRefreshPromise) {
    return activeRefreshPromise;
  }

  activeRefreshPromise = (async () => {
    try {
      // Re-query database: another process/worker might have refreshed it milliseconds ago
      const freshRow = await queryIntegration();
      if (freshRow && freshRow.is_connected && freshRow.token_expires_at) {
        const freshExpiry = new Date(freshRow.token_expires_at).getTime();
        if (freshExpiry - Date.now() > MARGIN_MS) {
          return {
            accessToken: freshRow.access_token,
            realmId: freshRow.realm_id,
          };
        }
      }

      // Security Guard: Prevent accidental refresh in development unless explicitly authorized
      if (
        process.env.NODE_ENV === 'development' &&
        process.env.ENABLE_LOCAL_QB_REFRESH !== 'true'
      ) {
        throw new Error(
          'Local QB token refresh blocked: ENABLE_LOCAL_QB_REFRESH is not true. This guard prevents invalidating production tokens.'
        );
      }

      const refreshed = await refreshQuickBooksToken(
        integration.refresh_token,
        integration.realm_id
      );

      return refreshed;
    } finally {
      activeRefreshPromise = null;
    }
  })();

  return activeRefreshPromise;
}

/**
 * Calls Intuit OAuth2 token endpoint to rotate refresh_token and obtain a new access_token.
 */
export async function refreshQuickBooksToken(
  storedRefreshToken: string,
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
  params.append('grant_type', 'refresh_token');
  params.append('refresh_token', storedRefreshToken);

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
    if (data.error === 'invalid_grant') {
      // Check if another process updated the record in the last 30 seconds
      const checkRes = await pool.query(
        `SELECT updated_at FROM settings_integrations WHERE provider = 'quickbooks'`
      );
      const lastUpdated = checkRes.rows[0]?.updated_at;
      const isRecentlyUpdated = lastUpdated && Date.now() - new Date(lastUpdated).getTime() < 30 * 1000;

      if (!isRecentlyUpdated) {
        await pool.query(
          `UPDATE settings_integrations 
           SET is_connected = FALSE, updated_at = NOW() 
           WHERE provider = 'quickbooks'`
        );
      }
    }
    throw new Error(`QuickBooks refresh token error: ${data.error_description || data.error || 'Unknown error'}`);
  }

  const newAccessToken = data.access_token;
  const newRefreshToken = data.refresh_token;
  const expiresInSec = data.expires_in || 3600;
  const newExpiresAt = new Date(Date.now() + expiresInSec * 1000);

  await pool.query(
    `UPDATE settings_integrations 
     SET access_token = $1,
         refresh_token = $2,
         token_expires_at = $3,
         updated_at = NOW()
     WHERE provider = 'quickbooks'`,
    [newAccessToken, newRefreshToken, newExpiresAt]
  );

  return {
    accessToken: newAccessToken,
    realmId,
  };
}

/**
 * Exchanges authorization code received in callback for initial access & refresh tokens.
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
  const expiresInSec = data.expires_in || 3600;
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
    [realmId, accessToken, refreshToken, expiresAt]
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
