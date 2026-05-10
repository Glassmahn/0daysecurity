const PREFIX = 'zd_rl_';

interface State {
  count: number;
  windowStart: number;
}

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  retryAfterMs: number;
}

function load(key: string): State {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as State) : { count: 0, windowStart: Date.now() };
  } catch {
    return { count: 0, windowStart: Date.now() };
  }
}

function save(key: string, state: State): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(state));
  } catch {
    // Storage unavailable — fail open
  }
}

/** Check whether a new attempt is permitted without recording it. */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const state = load(key);
  const elapsed = now - state.windowStart;

  if (elapsed >= config.windowMs) {
    return { allowed: true, remainingAttempts: config.maxAttempts - 1, retryAfterMs: 0 };
  }

  const remaining = config.maxAttempts - state.count;
  if (remaining > 0) {
    return { allowed: true, remainingAttempts: remaining - 1, retryAfterMs: 0 };
  }

  return {
    allowed: false,
    remainingAttempts: 0,
    retryAfterMs: config.windowMs - elapsed,
  };
}

/** Record a failed attempt. Call this only after a failure, not on success. */
export function recordAttempt(key: string, config: RateLimitConfig): void {
  const now = Date.now();
  const state = load(key);
  const elapsed = now - state.windowStart;

  if (elapsed >= config.windowMs) {
    save(key, { count: 1, windowStart: now });
  } else {
    save(key, { count: state.count + 1, windowStart: state.windowStart });
  }
}

/** Clear the rate limit for a key (e.g. on successful auth). */
export function clearRateLimit(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    // ignore
  }
}

/** Format a retryAfterMs value into a human-readable string. */
export function formatRetryAfter(ms: number): string {
  const secs = Math.ceil(ms / 1000);
  if (secs < 60) return `${secs} second${secs !== 1 ? 's' : ''}`;
  const mins = Math.ceil(secs / 60);
  return `${mins} minute${mins !== 1 ? 's' : ''}`;
}
