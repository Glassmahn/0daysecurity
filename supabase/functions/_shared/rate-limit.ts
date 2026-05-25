export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const store = new Map<string, { count: number; resetAt: number }>();

const DEFAULT_CONFIG: RateLimitConfig = { windowMs: 60_000, maxRequests: 30 };

export function checkRateLimit(
  key: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + config.windowMs };
  }

  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: config.maxRequests - entry.count, resetAt: entry.resetAt };
}

export function createRateLimitGuard(config?: RateLimitConfig) {
  return (req: Request): Response | null => {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'anon';
    const result = checkRateLimit(ip, config);
    if (!result.allowed) {
      return new Response(JSON.stringify({
        error: 'Too many requests. Please try again later.',
        code: 'TOO_MANY_REQUESTS',
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
    return null;
  };
}
