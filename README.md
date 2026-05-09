# ZeroDay Harmony

A GRC (Governance, Risk & Compliance) platform for continuous compliance monitoring and audit readiness. Supports SOC 2, ISO 27001, HIPAA, GDPR, PCI DSS, NIST, HITRUST, and 25+ other frameworks.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TanStack Router, TanStack Start (SSR) |
| Backend | Supabase (Postgres + Auth + RLS) |
| Auth | Supabase Auth + Google OAuth via Lovable Cloud |
| Styling | Tailwind CSS v4, Radix UI, shadcn/ui |
| Hosting | Cloudflare Workers |
| Package Manager | Bun |

## Prerequisites

- [Bun](https://bun.sh) 1.2+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for Docker-based dev)
- A [Supabase](https://supabase.com) project (or access to the shared Lovable Cloud instance)

## Local Development

### Option A — Bun (no Docker)

```bash
git clone https://github.com/coreaxelai/zeroday-harmony.git
cd zeroday-harmony

cp .env.example .env
# Fill in your Supabase URL and anon key in .env

bun install
bun run dev
```

App runs at **http://localhost:3000**

### Option B — Docker (recommended for team consistency)

```bash
cp .env.example .env
# Fill in your Supabase keys

docker compose up --build
```

App runs at **http://localhost:8080**. Source files are bind-mounted so Vite hot-reloads on save.

See [DOCKER.md](DOCKER.md) for full Docker instructions including production builds.

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key |
| `SUPABASE_URL` | Same as above (used server-side) |
| `SUPABASE_PUBLISHABLE_KEY` | Same as above (used server-side) |
| `VITE_SUPABASE_PROJECT_ID` | Supabase project ID (ref) |

The anon key is safe to use client-side — it is restricted by Row-Level Security policies. Never commit a service role key.

## Available Scripts

```bash
bun run dev        # Start dev server with hot reload
bun run build      # Production build
bun run preview    # Preview production build locally
bun run lint       # Run ESLint
```

## Project Structure

```
src/
├── components/        # UI components (shadcn/ui + feature components)
│   ├── ui/            # Base shadcn primitives (53 components)
│   ├── dashboard/     # Dashboard widgets
│   ├── crud/          # Reusable table/form/pagination components
│   └── guards/        # Role-based access guards
├── routes/            # File-based routes (TanStack Router)
├── hooks/             # React hooks (auth, CRUD, roles, data fetching)
├── lib/               # Utilities, framework catalog, mock data
└── integrations/
    └── supabase/      # Auto-generated Supabase client and types
supabase/
└── migrations/        # Postgres migration files
```

## Authentication & Roles

Sign in via email/password or Google OAuth. New users are assigned the `viewer` role by default.

| Role | Permissions |
|------|-------------|
| `admin` | Full access including user management, settings, audit logs |
| `analyst` | Read/write on all compliance data |
| `auditor` | Read-only access to all data |
| `viewer` | Read-only access to dashboard and reports |

## Deployment

The app deploys to Cloudflare Workers via TanStack Start's SSR output.

```bash
bun run build
bunx wrangler deploy
```

Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are set at build time — Vite inlines them into the bundle.

## Database Migrations

Migrations live in `supabase/migrations/` and are managed via the Supabase CLI or Lovable Cloud dashboard. All tables have Row-Level Security enabled.

## Security

See [SECURITY.md](SECURITY.md) for the full security architecture, RLS policy details, known findings, and review checklist.

## License

Private — all rights reserved.
