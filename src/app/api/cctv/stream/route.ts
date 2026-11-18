import { fetchDvrSnapshot, verifyCctvAccess } from '@/lib/hikvisionUtils';

export async function GET(req: Request) {
  const { authorized } = await verifyCctvAccess();
  if (!authorized) {
    return new Response('Unauthorized CCTV access', { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const channel = parseInt(searchParams.get('channel') || '1', 10);
  const hd = searchParams.get('hd') === '1';
  const propertyId = searchParams.get('propertyId') || 'test';
  const requestedFps = parseInt(searchParams.get('fps') || '5', 10);
  const fps = Math.min(Math.max(isNaN(requestedFps) ? 5 : requestedFps, 1), 6);
  const delayMs = Math.round(1000 / fps);

  if (isNaN(channel) || channel < 1 || channel > 32) {
    return new Response('Invalid channel ID', { status: 400 });
  }

  const boundary = 'hycoframe';
  const encoder = new TextEncoder();
  let isClosed = false;

  req.signal.addEventListener('abort', () => {
    isClosed = true;
  });

  const stream = new ReadableStream({
    async start(controller) {
      while (!isClosed && !req.signal.aborted) {
        try {
          const snap = await fetchDvrSnapshot(channel, hd, propertyId);
          if (snap && snap.buffer.byteLength > 0 && !isClosed) {
            const header =
              `--${boundary}\r\n` +
              `Content-Type: image/jpeg\r\n` +
              `Content-Length: ${snap.buffer.byteLength}\r\n\r\n`;

            controller.enqueue(encoder.encode(header));
            controller.enqueue(new Uint8Array(snap.buffer));
            controller.enqueue(encoder.encode('\r\n'));
          }
        } catch {
          await new Promise((r) => setTimeout(r, 500));
        }

        await new Promise((r) => setTimeout(r, delayMs));
      }

      try {
        controller.close();
      } catch {
        // Ignore if already closed
      }
    },
    cancel() {
      isClosed = true;
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': `multipart/x-mixed-replace; boundary=${boundary}`,
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Connection: 'keep-alive',
      Pragma: 'no-cache',
    },
  });
}
