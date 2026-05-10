import * as Sentry from '@sentry/react';

let initialised = false;

export function initMonitoring(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn || initialised) return;
  initialised = true;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    // Only send in production — keeps local dev noise-free
    enabled: import.meta.env.MODE === 'production',
    integrations: [Sentry.browserTracingIntegration()],
    // Low sample rate for perf tracing; errors are always captured
    tracesSampleRate: 0.05,
    // Strip PII from URLs before sending
    beforeSend(event) {
      if (event.request?.url) {
        try {
          const u = new URL(event.request.url);
          u.search = '';
          event.request.url = u.toString();
        } catch {
          // non-parseable URL — leave as-is
        }
      }
      return event;
    },
  });
}

/**
 * Report an error to Sentry. Safe to call even if Sentry is not initialised
 * (becomes a no-op). Always pass the original error before any sanitization
 * so production debugging has full context.
 */
export function captureError(err: unknown, context?: Record<string, unknown>): void {
  if (err instanceof Error) {
    Sentry.captureException(err, { extra: context });
  } else {
    Sentry.captureMessage(String(err), 'error');
  }
}

/** Associate subsequent Sentry events with an authenticated user. */
export function setUserContext(userId: string, email?: string | null): void {
  Sentry.setUser({ id: userId, email: email ?? undefined });
}

/** Clear user context on sign-out. */
export function clearUserContext(): void {
  Sentry.setUser(null);
}
