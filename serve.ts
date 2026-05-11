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

// Lazy-load the SSR handler (avoids import-time side effects at top level)
const { default: handler } = await import('./dist/server/index.js');

Bun.serve({
  port,
  hostname: host,
  fetch: async (req: Request): Promise<Response> => {
    const url = new URL(req.url);

    // Serve static files from dist/client/
    const filePath = join(clientDir, url.pathname);
    if (filePath.startsWith(clientDir)) {
      const file = Bun.file(filePath);
      if (await file.exists()) {
        return new Response(file);
      }
    }

    // Fall through to TanStack Start / Cloudflare Worker SSR handler
    return handler.fetch(req, process.env, {
      waitUntil: () => {},
      passThroughOnException: () => {},
    });
  },
});

console.log(`ZeroDay server running at http://${host}:${port}`);
