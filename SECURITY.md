# Security Review Guide — ZeroDay Security Platform

## Overview

GRC (Governance, Risk & Compliance) platform built with TanStack Start (React 19), Supabase (Postgres + Auth + RLS), and Tailwind CSS v4.

## Architecture

| Layer | Technology |
|-------|-----------|
| Frontend | TanStack Start v1 (SSR), React 19, Vite 7 |
| Backend | Supabase (Postgres, Auth, Edge Functions) |
| Auth | Supabase Auth + Lovable Cloud OAuth (Google) |
| Hosting | Cloudflare Workers (SSR) |
| Styling | Tailwind CSS v4 |

## Authentication Flow

- Email/password via `supabase.auth.signInWithPassword()`
- Google OAuth via `lovable.auth.signInWithOAuth('google')`
- Password reset flow: `/forgot-password` → email link → `/reset-password`
- Session managed via `onAuthStateChange` listener in `src/hooks/use-auth.ts`

## Authorization (RBAC)

- Roles: `admin`, `analyst`, `auditor`, `viewer` (enum `app_role`)
- Roles stored in `public.user_roles` table (NOT on profiles)
- `has_role()` — `SECURITY DEFINER` function for RLS policy checks
- New users default to `viewer` role via `handle_new_user()` trigger

## Database Security (RLS)

All tables have Row-Level Security enabled. Key patterns:
- Read access: varies by table (some authenticated-only, some role-restricted)
- Write access: restricted to `admin`/`analyst` roles via `has_role()`
- `user_roles`: users can read own roles; only admins can insert/update/delete

### Known Findings (from automated scan)

| Severity | Finding | Table | Status |
|----------|---------|-------|--------|
| ~~ERROR~~ | Sensitive data (contact_email, contract_value) readable by all authenticated | `vendors` | Fixed — migration `20260411180000` |
| ~~ERROR~~ | IP addresses and locations readable by all authenticated | `assets` | Fixed — migration `20260509000000` |
| ~~WARN~~ | Audit logs readable by all authenticated users | `audit_logs` | Fixed — migration `20260411180000` |
| WARN | Extension installed in `public` schema | — | Open — move to dedicated schema |

## Key Files for Review

### Authentication & Authorization
- `src/hooks/use-auth.ts` — Auth state management
- `src/hooks/use-user-role.ts` — Role fetching
- `src/hooks/use-role-context.tsx` — Role context provider
- `src/components/guards/RoleGuards.tsx` — UI-level role guards
- `src/integrations/supabase/auth-middleware.ts` — Server-side auth middleware

### Database Access
- `src/hooks/use-supabase-crud.ts` — Generic CRUD hook
- `src/hooks/use-supabase-data.ts` — Data fetching hook
- `src/integrations/supabase/client.ts` — Browser Supabase client (auto-generated, do not edit)
- `src/integrations/supabase/client.server.ts` — Server admin client

### Routes (check auth guards)
- `src/routes/login.tsx` — Login page
- `src/routes/signup.tsx` — Signup page
- `src/routes/forgot-password.tsx` — Password reset request
- `src/routes/reset-password.tsx` — Password reset form
- `src/routes/settings.index.tsx` — Settings (admin features)

### Sensitive Data Handling
- `src/lib/user-management.functions.ts` — User management server functions
- `src/lib/audit-logger.ts` — Audit trail logging
- `src/lib/export-csv.ts` — Data export (check for data leakage)

## Environment Variables

| Variable | Type | Location |
|----------|------|----------|
| `VITE_SUPABASE_URL` | Public | `.env` (auto-managed) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public | `.env` (auto-managed) |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | Server-only (`process.env`) |

## Review Checklist

- [ ] RLS policies on all tables enforce proper role-based access
- [ ] No service role key exposed to client-side code
- [ ] Auth middleware applied to all server functions accessing user data
- [ ] Input validation on all server functions and API routes
- [ ] No SQL injection vectors in custom queries
- [ ] Password reset flow properly validates recovery tokens
- [ ] Role escalation not possible via client-side manipulation
- [ ] CSV export respects role-based access controls
- [ ] Audit logs capture security-relevant events
- [ ] No sensitive data in console.log or error messages sent to client
