const DB_ERROR_MAP: Array<[RegExp, string]> = [
  [/duplicate key value violates unique constraint/i, 'A record with this information already exists.'],
  [/violates foreign key constraint/i, 'This record is linked to other data and cannot be modified.'],
  [/violates not-null constraint/i, 'A required field is missing.'],
  [/violates check constraint/i, 'The provided value is not valid for this field.'],
  [/permission denied/i, "You don't have permission to perform this action."],
  [/invalid input syntax/i, 'Invalid data format. Please check your input.'],
  [/value too long/i, 'One of the fields exceeds the maximum allowed length.'],
  [/JWT expired|invalid JWT|invalid token/i, 'Your session has expired. Please sign in again.'],
  [/Failed to fetch|NetworkError|network request failed/i, 'Unable to connect. Please check your connection and try again.'],
];

/**
 * Maps raw Supabase/PostgREST error messages to user-friendly strings.
 * Falls back to a generic message so DB internals are never shown to users.
 */
export function sanitizeError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  for (const [pattern, friendly] of DB_ERROR_MAP) {
    if (pattern.test(raw)) return friendly;
  }
  return 'Something went wrong. Please try again.';
}
