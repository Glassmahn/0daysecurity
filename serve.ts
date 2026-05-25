/**
 * Production HTTP server wrapper for Docker deployment.
 *
 * TanStack Start builds for Cloudflare Workers (no static file serving built-in).
 * This wrapper adds static file serving from dist/client/ before falling through
 * to the SSR handler.
 */
import { resolve, join } from 'node:path';

const clientDir = resolve(import.meta.dir, 'dist/client');
const port = parseInt(process.env.PORT ?? '8080');
const host = process.env.HOST ?? '0.0.0.0';

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:8080', 'http://localhost:3000'];

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://meueuzgxtjnjyqjhbuql.supabase.co",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://meueuzgxtjnjyqjhbuql.supabase.co",
  "font-src 'self' data:",
  "connect-src 'self' https://meueuzgxtjnjyqjhbuql.supabase.co https://api.github.com ws://localhost:*",
  "frame-src 'none'",
  "object-src 'none'",
].join('; ');

const HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

function securityHeaders(res: Response): Response {
  const h = new Headers(res.headers);
  for (const [key, val] of Object.entries(HEADERS)) {
    if (!h.has(key)) h.set(key, val);
  }
  h.set('Content-Security-Policy', CSP);
  const origin = h.get('access-control-allow-origin');
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    h.delete('access-control-allow-origin');
  }
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
}

// Lazy-load the SSR handler (avoids import-time side effects at top level)
const { default: handler } = await import('./dist/server/index.js');

Bun.serve({
  port,
  hostname: host,
  fetch: async (req: Request): Promise<Response> => {
    const url = new URL(req.url);

    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', uptime: process.uptime() }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const filePath = join(clientDir, url.pathname);
    if (filePath.startsWith(clientDir)) {
      const file = Bun.file(filePath);
      if (await file.exists()) {
        const ext = filePath.split('.').pop()?.toLowerCase();
        const mime: Record<string, string> = {
          js: 'application/javascript',
          css: 'text/css',
          html: 'text/html',
          svg: 'image/svg+xml',
          png: 'image/png',
          ico: 'image/x-icon',
          json: 'application/json',
          woff2: 'font/woff2',
        };
        const blob = await file.bytes();
        return securityHeaders(new Response(blob, {
          headers: {
            'Content-Type': mime[ext ?? ''] ?? 'application/octet-stream',
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        }));
      }
    }

    const ssrRes = await handler.fetch(req, {
      ...process.env,
      ALLOWED_ORIGINS: undefined,
    }, {
      waitUntil: () => {},
      passThroughOnException: () => {},
    });

    return securityHeaders(ssrRes);
  },
});

console.log(`ZeroDay server running at http://${host}:${port}`);
