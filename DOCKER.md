# Local Development with Docker + Cursor

Run the ZeroDay GRC platform locally in Docker so you can edit in Cursor with hot reload.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine + Compose)
- [Cursor](https://cursor.com/) (or VS Code)
- The project cloned locally (via the GitHub integration in Lovable)

## 1. Configure environment

The Lovable Cloud connection details are required. Create a `.env` file at the project root:

```bash
cp .env.example .env  # if you have an example, otherwise create manually
```

Minimum contents (these are the publishable keys already used by the app — safe to commit-exclude but not secret):

```
VITE_SUPABASE_URL="https://meueuzgxtjnjyqjhbuql.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="<anon key from Lovable Cloud>"
VITE_SUPABASE_PROJECT_ID="meueuzgxtjnjyqjhbuql"
SUPABASE_URL="https://meueuzgxtjnjyqjhbuql.supabase.co"
SUPABASE_PUBLISHABLE_KEY="<anon key from Lovable Cloud>"
```

> The anon/publishable key is visible in `src/integrations/supabase/client.ts` defaults and in your Lovable Cloud dashboard.

## 2. Start the container

```bash
docker compose up --build
```

The first build installs dependencies (~1-2 min). Subsequent starts are fast.

App will be available at: **http://localhost:8080**

## 3. Develop in Cursor

- Open the project folder in Cursor.
- Edit any file under `src/` — the bind mount in `docker-compose.yml` syncs changes to the container, and Vite hot-reloads automatically.
- The `.cursorrules` file already provides Cursor with project context (stack, conventions, security focus).

## 4. Useful commands

```bash
# Stop
docker compose down

# Rebuild after dependency changes (package.json edits)
docker compose up --build

# Tail logs
docker compose logs -f app

# Shell inside the container
docker compose exec app sh

# Run lint inside the container
docker compose exec app bun run lint
```

## 5. Notes

- **Hot reload**: source files are bind-mounted; `node_modules` lives in the container to avoid OS mismatch (e.g. macOS host ↔ Linux container).
- **Backend**: the app continues to talk to your Lovable Cloud (Supabase) project remotely — no local database is run. Migrations and edge functions are still managed via Lovable.
- **Auth callbacks**: OAuth/SSO redirects expect `http://localhost:8080` to be in the Supabase allowed redirect URLs. Add it via Lovable Cloud → Auth Settings if you'll test those flows locally.
- **Production build** (optional): `docker compose exec app bun run build` produces output in `.output/` for inspection.
