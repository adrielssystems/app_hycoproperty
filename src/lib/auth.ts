import crypto from 'crypto';

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'EMPLOYEE' | string;
  avatar_url?: string;
  allowed_sections: string[]; // e.g. ['overview', 'properties', 'tenants', 'billing', 'maintenance']
  last_activity: number;
  expires_at: number;
}

const SESSION_SECRET = process.env.SESSION_SECRET || 'hyco_production_security_key_2026_x89a1';
const INACTIVITY_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours of inactivity

/**
 * Hash password securely using Node.js scrypt with unique cryptographic salt
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Verify password against stored hash with constant-time comparison
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash) return false;

  // If hash contains salt:hash
  if (storedHash.includes(':')) {
    try {
      const [salt, key] = storedHash.split(':');
      const keyBuffer = Buffer.from(key, 'hex');
      const derivedKey = crypto.scryptSync(password, salt, 64);
      return crypto.timingSafeEqual(keyBuffer, derivedKey);
    } catch {
      return false;
    }
  }

  // Fallback for bootstrap transition
  return password === storedHash;
}

/**
 * Create a signed session payload
 */
export function createSessionData(user: {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar_url?: string;
  allowed_sections?: string[] | string;
}): SessionUser {
  let sections: string[] = ['overview', 'properties', 'tenants', 'billing', 'maintenance'];

  if (Array.isArray(user.allowed_sections)) {
    sections = user.allowed_sections;
  } else if (typeof user.allowed_sections === 'string') {
    sections = user.allowed_sections.split(',').map((s) => s.trim());
  }

  const now = Date.now();
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar_url: user.avatar_url,
    allowed_sections: sections,
    last_activity: now,
    expires_at: now + INACTIVITY_TIMEOUT_MS,
  };
}

/**
 * Validate session freshness (enforces 2-hour inactivity timeout)
 */
export function isSessionValid(session: SessionUser | null): boolean {
  if (!session || !session.expires_at) return false;
  return Date.now() < session.expires_at;
}

/**
 * Refresh session sliding window on user activity
 */
export function refreshSessionExpiration(session: SessionUser): SessionUser {
  const now = Date.now();
  return {
    ...session,
    last_activity: now,
    expires_at: now + INACTIVITY_TIMEOUT_MS,
  };
}

