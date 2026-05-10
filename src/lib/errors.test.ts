import { describe, it, expect } from 'vitest';
import { sanitizeError } from './errors';

describe('sanitizeError', () => {
  it('returns generic fallback for unknown error messages', () => {
    expect(sanitizeError(new Error('some obscure db internals'))).toBe(
      'Something went wrong. Please try again.'
    );
  });

  it('returns generic fallback for plain unknown strings', () => {
    expect(sanitizeError('unexpected thing happened')).toBe(
      'Something went wrong. Please try again.'
    );
  });

  it('handles non-Error, non-string values gracefully', () => {
    expect(sanitizeError(42)).toBe('Something went wrong. Please try again.');
    expect(sanitizeError(null)).toBe('Something went wrong. Please try again.');
    expect(sanitizeError(undefined)).toBe('Something went wrong. Please try again.');
    expect(sanitizeError({ message: 'oops' })).toBe('Something went wrong. Please try again.');
  });

  describe('DB constraint patterns', () => {
    it('maps duplicate key violations', () => {
      expect(
        sanitizeError(new Error('duplicate key value violates unique constraint "users_email_key"'))
      ).toBe('A record with this information already exists.');
    });

    it('maps foreign key violations', () => {
      expect(
        sanitizeError(new Error('insert or update on table "evidence" violates foreign key constraint'))
      ).toBe('This record is linked to other data and cannot be modified.');
    });

    it('maps not-null violations', () => {
      expect(
        sanitizeError(new Error('null value in column "title" violates not-null constraint'))
      ).toBe('A required field is missing.');
    });

    it('maps check constraint violations', () => {
      expect(
        sanitizeError(new Error('new row for relation "risks" violates check constraint "risks_status_check"'))
      ).toBe('The provided value is not valid for this field.');
    });

    it('maps permission denied errors', () => {
      expect(sanitizeError(new Error('permission denied for table audit_logs'))).toBe(
        "You don't have permission to perform this action."
      );
    });

    it('maps invalid input syntax errors', () => {
      expect(sanitizeError(new Error('invalid input syntax for type uuid: "not-a-uuid"'))).toBe(
        'Invalid data format. Please check your input.'
      );
    });

    it('maps value too long errors', () => {
      expect(sanitizeError(new Error('value too long for type character varying(255)'))).toBe(
        'One of the fields exceeds the maximum allowed length.'
      );
    });
  });

  describe('auth / session patterns', () => {
    it('maps JWT expired', () => {
      expect(sanitizeError(new Error('JWT expired'))).toBe(
        'Your session has expired. Please sign in again.'
      );
    });

    it('maps invalid JWT', () => {
      expect(sanitizeError(new Error('invalid JWT'))).toBe(
        'Your session has expired. Please sign in again.'
      );
    });

    it('maps invalid token', () => {
      expect(sanitizeError(new Error('invalid token signature'))).toBe(
        'Your session has expired. Please sign in again.'
      );
    });
  });

  describe('network patterns', () => {
    it('maps Failed to fetch', () => {
      expect(sanitizeError(new Error('Failed to fetch'))).toBe(
        'Unable to connect. Please check your connection and try again.'
      );
    });

    it('maps NetworkError', () => {
      expect(sanitizeError(new Error('NetworkError when attempting to fetch resource'))).toBe(
        'Unable to connect. Please check your connection and try again.'
      );
    });

    it('maps network request failed', () => {
      expect(sanitizeError(new Error('network request failed'))).toBe(
        'Unable to connect. Please check your connection and try again.'
      );
    });
  });

  it('is case-insensitive for pattern matching', () => {
    expect(sanitizeError(new Error('PERMISSION DENIED for schema public'))).toBe(
      "You don't have permission to perform this action."
    );
    expect(sanitizeError(new Error('DUPLICATE KEY VALUE violates unique constraint'))).toBe(
      'A record with this information already exists.'
    );
  });
});
