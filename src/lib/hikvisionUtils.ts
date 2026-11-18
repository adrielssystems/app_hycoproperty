import crypto from 'crypto';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';

export interface DvrChannelInfo {
  id: number;
  name: string;
  enabled: boolean;
  resolution: string;
  videoFormat: string;
}

export interface DvrDeviceInfo {
  deviceName: string;
  model: string;
  serialNumber: string;
  firmwareVersion: string;
}

export interface DvrConnectionConfig {
  host: string;
  port: string;
  user: string;
  pass: string;
  source?: 'database' | 'env';
}

function getEncryptionKey(): Buffer {
  const secret = process.env.SESSION_SECRET || 'hyco-property-cctv-default-secret-2026';
  return crypto.createHash('sha256').update(secret).digest();
}

export function encryptDvrPassword(plainText: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptDvrPassword(cipherText: string): string {
  const parts = cipherText.split(':');
  if (parts.length !== 3) return cipherText;
  const [ivHex, tagHex, encHex] = parts;
  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encHex, 'hex')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}

export function getDvrConfig(): DvrConnectionConfig {
  return {
    host: process.env.CCTV_DVR_HOST || 'hyco34.dvrcam.info',
    port: process.env.CCTV_DVR_PORT || '80',
    user: process.env.CCTV_DVR_USER || 'test',
    pass: process.env.CCTV_DVR_PASS || 'Hh342026',
    source: 'env',
  };
}

export async function getDvrConfigForProperty(
  propertyId?: number | string
): Promise<DvrConnectionConfig | null> {
  if (!propertyId || propertyId === 'test' || propertyId === 0 || propertyId === '0') {
    return getDvrConfig();
  }

  const numericId = typeof propertyId === 'string' ? parseInt(propertyId, 10) : propertyId;
  if (!isNaN(numericId) && numericId > 0) {
    try {
      const rows = await query(
        `SELECT host, port, username, password_encrypted
         FROM property_dvr_configs
         WHERE property_id = $1 AND is_active = TRUE
         LIMIT 1`,
        [numericId]
      );
      if (rows && rows.length > 0) {
        return {
          host: rows[0].host,
          port: rows[0].port || '80',
          user: rows[0].username,
          pass: decryptDvrPassword(rows[0].password_encrypted),
          source: 'database',
        };
      }
      return null;
    } catch (err) {
      console.error('Failed to read property_dvr_configs:', err);
      return null;
    }
  }
  return null;
}

export async function verifyCctvAccess(): Promise<{ authorized: boolean; role?: string }> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('hyco_session');
    if (!sessionCookie?.value) return { authorized: false };
    const user = JSON.parse(sessionCookie.value);
    const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'EMPLOYEE'];
    if (allowedRoles.includes(user.role)) {
      return { authorized: true, role: user.role };
    }
    return { authorized: false, role: user.role };
  } catch {
    return { authorized: false };
  }
}

export async function verifySuperAdminAccess(): Promise<{ authorized: boolean; role?: string }> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('hyco_session');
    if (!sessionCookie?.value) return { authorized: false };
    const user = JSON.parse(sessionCookie.value);
    if (user.role === 'SUPER_ADMIN') {
      return { authorized: true, role: user.role };
    }
    return { authorized: false, role: user.role };
  } catch {
    return { authorized: false };
  }
}

function md5(str: string): string {
  return crypto.createHash('md5').update(str).digest('hex');
}

function parseDigestHeader(header: string): Record<string, string> {
  const params: Record<string, string> = {};
  const regex = /(\w+)=(?:"([^"]+)"|([^,\s]+))/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(header)) !== null) {
    params[match[1]] = match[2] ?? match[3];
  }
  return params;
}

/**
 * Performs an HTTP GET against a Hikvision ISAPI endpoint using HTTP Digest Authentication.
 */
export async function fetchHikvisionIsapi(
  path: string,
  config: DvrConnectionConfig,
  timeoutMs = 8000
): Promise<Response> {
  const { host, port, user, pass } = config;
  const baseUrl = `http://${host}${port && port !== '80' ? `:${port}` : ''}`;
  const url = `${baseUrl}${path}`;

  const controller1 = new AbortController();
  const timer1 = setTimeout(() => controller1.abort(), timeoutMs);

  let initialRes: Response;
  try {
    initialRes = await fetch(url, {
      method: 'GET',
      signal: controller1.signal,
      cache: 'no-store',
    });
  } finally {
    clearTimeout(timer1);
  }

  if (initialRes.status !== 401) {
    return initialRes;
  }

  const wwwAuth = initialRes.headers.get('www-authenticate') || '';
  if (!wwwAuth.toLowerCase().startsWith('digest')) {
    const basicToken = Buffer.from(`${user}:${pass}`).toString('base64');
    return fetch(url, {
      method: 'GET',
      headers: { Authorization: `Basic ${basicToken}` },
      cache: 'no-store',
    });
  }

  const challenge = parseDigestHeader(wwwAuth);
  const realm = challenge.realm || '';
  const nonce = challenge.nonce || '';
  const qop = challenge.qop ? challenge.qop.split(',')[0].trim() : '';
  const nc = '00000001';
  const cnonce = crypto.randomBytes(8).toString('hex');

  const ha1 = md5(`${user}:${realm}:${pass}`);
  const ha2 = md5(`GET:${path}`);
  const responseHash = qop
    ? md5(`${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}`)
    : md5(`${ha1}:${nonce}:${ha2}`);

  const authParts = [
    `username="${user}"`,
    `realm="${realm}"`,
    `nonce="${nonce}"`,
    `uri="${path}"`,
    `response="${responseHash}"`,
  ];
  if (qop) {
    authParts.push(`qop=${qop}`, `nc=${nc}`, `cnonce="${cnonce}"`);
  }
  if (challenge.opaque) {
    authParts.push(`opaque="${challenge.opaque}"`);
  }

  const controller2 = new AbortController();
  const timer2 = setTimeout(() => controller2.abort(), timeoutMs);

  try {
    return await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Digest ${authParts.join(', ')}`,
      },
      signal: controller2.signal,
      cache: 'no-store',
    });
  } finally {
    clearTimeout(timer2);
  }
}

function extractXmlTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i'));
  return match ? match[1].trim() : '';
}

export async function getDvrStatusAndChannels(
  propertyId?: number | string,
  configOverride?: DvrConnectionConfig
): Promise<{
  device: DvrDeviceInfo | null;
  channels: DvrChannelInfo[];
  source: string;
  notConfigured?: boolean;
}> {
  const config = configOverride || (await getDvrConfigForProperty(propertyId));
  if (!config) {
    return { device: null, channels: [], source: 'none', notConfigured: true };
  }

  const [devRes, chanRes] = await Promise.all([
    fetchHikvisionIsapi('/ISAPI/System/deviceInfo', config),
    fetchHikvisionIsapi('/ISAPI/System/Video/inputs/channels', config),
  ]);

  let device: DvrDeviceInfo | null = null;
  if (devRes.ok) {
    const devXml = await devRes.text();
    device = {
      deviceName: extractXmlTag(devXml, 'deviceName') || 'Hikvision DVR',
      model: extractXmlTag(devXml, 'model') || 'DS-7208HUHI-K2',
      serialNumber: extractXmlTag(devXml, 'serialNumber') || '',
      firmwareVersion: extractXmlTag(devXml, 'firmwareVersion') || '',
    };
  }

  const channels: DvrChannelInfo[] = [];
  if (chanRes.ok) {
    const chanXml = await chanRes.text();
    const blocks = chanXml.match(/<VideoInputChannel[\s\S]*?<\/VideoInputChannel>/gi) || [];
    for (const block of blocks) {
      const id = parseInt(extractXmlTag(block, 'id') || extractXmlTag(block, 'inputPort'), 10);
      if (!isNaN(id)) {
        channels.push({
          id,
          name: extractXmlTag(block, 'name') || `Camera 0${id}`,
          enabled: extractXmlTag(block, 'videoInputEnabled').toLowerCase() === 'true',
          resolution: extractXmlTag(block, 'resDesc') || '1080P30',
          videoFormat: extractXmlTag(block, 'videoFormat') || 'NTSC',
        });
      }
    }
  }

  return { device, channels, source: config.source || 'env' };
}

export async function fetchDvrSnapshot(
  channelId: number,
  hd = false,
  propertyId?: number | string
): Promise<{ buffer: ArrayBuffer; contentType: string } | null> {
  const config = await getDvrConfigForProperty(propertyId);
  if (!config) return null;
  const streamSuffix = hd ? '01' : '02';
  const path = `/ISAPI/Streaming/channels/${channelId}${streamSuffix}/picture`;
  const res = await fetchHikvisionIsapi(path, config, 8000);
  if (!res.ok) return null;
  const buffer = await res.arrayBuffer();
  const contentType = res.headers.get('content-type') || 'image/jpeg';
  return { buffer, contentType };
}
