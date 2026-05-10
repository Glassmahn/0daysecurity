import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  checkRateLimit,
  recordAttempt,
  clearRateLimit,
  formatRetryAfter,
} from './rate-limiter';

const CFG = { maxAttempts: 3, windowMs: 60_000 };
const KEY = 'test:user@example.com';

// jsdom doesn't always expose localStorage as a top-level global — use a real Map-backed mock.
const storage = new Map<string, string>();
const localStorageMock: Storage = {
  getItem: (k) => storage.get(k) ?? null,
  setItem: (k, v) => { storage.set(k, v); },
  removeItem: (k) => { storage.delete(k); },
  clear: () => storage.clear(),
  key: (i) => [...storage.keys()][i] ?? null,
  get length() { return storage.size; },
};
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });

beforeEach(() => {
  storage.clear();
  vi.useRealTimers();
});

describe('checkRateLimit', () => {
  it('allows attempts when no history exists', () => {
    const result = checkRateLimit(KEY, CFG);
    expect(result.allowed).toBe(true);
    expect(result.retryAfterMs).toBe(0);
  });

  it('allows attempts below the max within the window', () => {
    recordAttempt(KEY, CFG);
    recordAttempt(KEY, CFG);
    const result = checkRateLimit(KEY, CFG);
    expect(result.allowed).toBe(true);
    expect(result.remainingAttempts).toBe(0);
  });

  it('blocks when max attempts are reached within the window', () => {
    recordAttempt(KEY, CFG);
    recordAttempt(KEY, CFG);
    recordAttempt(KEY, CFG);
    const result = checkRateLimit(KEY, CFG);
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeGreaterThan(0);
    expect(result.remainingAttempts).toBe(0);
  });

  it('resets and allows after the window expires', () => {
    vi.useFakeTimers();
    recordAttempt(KEY, CFG);
    recordAttempt(KEY, CFG);
    recordAttempt(KEY, CFG);
    expect(checkRateLimit(KEY, CFG).allowed).toBe(false);

    vi.advanceTimersByTime(CFG.windowMs + 1);

    const result = checkRateLimit(KEY, CFG);
    expect(result.allowed).toBe(true);
  });

  it('reports correct retryAfterMs when blocked', () => {
    vi.useFakeTimers();
    recordAttempt(KEY, CFG);
    recordAttempt(KEY, CFG);
    recordAttempt(KEY, CFG);
    vi.advanceTimersByTime(10_000);
    const result = checkRateLimit(KEY, CFG);
    expect(result.retryAfterMs).toBeCloseTo(CFG.windowMs - 10_000, -2);
  });
});

describe('recordAttempt', () => {
  it('increments count on each call within the window', () => {
    recordAttempt(KEY, CFG);
    recordAttempt(KEY, CFG);
    // Two attempts used, one remaining
    expect(checkRateLimit(KEY, CFG).remainingAttempts).toBe(0);
  });

  it('resets count when called after the window expires', () => {
    vi.useFakeTimers();
    recordAttempt(KEY, CFG);
    recordAttempt(KEY, CFG);
    recordAttempt(KEY, CFG);

    vi.advanceTimersByTime(CFG.windowMs + 1);
    recordAttempt(KEY, CFG); // first attempt in new window
    const result = checkRateLimit(KEY, CFG);
    expect(result.allowed).toBe(true);
    expect(result.remainingAttempts).toBe(1);
  });
});

describe('clearRateLimit', () => {
  it('removes the stored state so attempts are allowed again', () => {
    recordAttempt(KEY, CFG);
    recordAttempt(KEY, CFG);
    recordAttempt(KEY, CFG);
    expect(checkRateLimit(KEY, CFG).allowed).toBe(false);

    clearRateLimit(KEY);

    expect(checkRateLimit(KEY, CFG).allowed).toBe(true);
  });
});

describe('formatRetryAfter', () => {
  it('formats seconds for values under 60 seconds', () => {
    expect(formatRetryAfter(30_000)).toBe('30 seconds');
    expect(formatRetryAfter(1_000)).toBe('1 second');
  });

  it('formats minutes for values of 60 seconds or more', () => {
    expect(formatRetryAfter(60_000)).toBe('1 minute');
    expect(formatRetryAfter(120_000)).toBe('2 minutes');
    expect(formatRetryAfter(900_000)).toBe('15 minutes');
  });

  it('rounds up partial minutes', () => {
    expect(formatRetryAfter(61_000)).toBe('2 minutes');
    expect(formatRetryAfter(59_000)).toBe('59 seconds');
  });
});
