/**
 * Next.js Server Instrumentation — Internal QuickBooks Online Keep-Alive Scheduler
 * Runs exclusively inside the Node.js server process (zero public HTTP attack surface).
 * Proactively renews QBO OAuth tokens every 45 minutes so neither the 60-minute access_token
 * nor Intuit's 100-day rolling refresh_token ever expires due to inactivity.
 */

const KEEP_ALIVE_INTERVAL_MS = 45 * 60 * 1000; // 45 minutes
const INITIAL_BOOT_DELAY_MS = 90 * 1000; // 90 seconds after container start

declare global {
  var __hycoQbKeepAliveStarted: boolean | undefined;
}

export async function register() {
  // Only execute in Node.js server runtime, never in Edge or during Docker/Next build
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  if (process.env.DOCKER_BUILD === '1' || process.env.NEXT_PHASE === 'phase-production-build') {
    return;
  }

  // Prevent duplicate intervals on HMR / worker reload
  if (globalThis.__hycoQbKeepAliveStarted) return;
  globalThis.__hycoQbKeepAliveStarted = true;

  // In local development, respect ENABLE_LOCAL_QB_REFRESH guard
  if (
    process.env.NODE_ENV === 'development' &&
    process.env.ENABLE_LOCAL_QB_REFRESH !== 'true'
  ) {
    return;
  }

  const runKeepAlive = async () => {
    try {
      const { keepAliveQuickBooksToken } = await import('@/lib/quickbooksUtils');
      const result = await keepAliveQuickBooksToken({ force: false });
      if (result.status === 'refreshed') {
        console.log(
          `[QBO Keep-Alive] Token auto-renewed cleanly. Next expiry: ${result.tokenExpiresAt}`
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[QBO Keep-Alive] Auto-renewal check warning:', msg);
    }
  };

  // Initial check after DB/container settles
  const bootTimer = setTimeout(() => {
    void runKeepAlive();
  }, INITIAL_BOOT_DELAY_MS);
  bootTimer.unref?.();

  // Recurring 45-minute keep-alive
  const intervalTimer = setInterval(() => {
    void runKeepAlive();
  }, KEEP_ALIVE_INTERVAL_MS);
  intervalTimer.unref?.();
}
