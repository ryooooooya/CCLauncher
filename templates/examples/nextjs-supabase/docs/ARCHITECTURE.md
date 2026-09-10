# Architecture

Next.js 16 App Router with Node route handlers, Supabase Auth and Postgres.
The example has a sign-in/out page and a private document CRUD API.
It is intentionally small so the actual security boundary can be tested.

- src/lib/supabase.ts: request-scoped SSR client and verified identity
- src/lib/input.ts: editable document input and ID validation
- src/app/api/session: managed login, identity lookup and logout
- src/app/api/documents: owner-scoped operations with no privileged DB key
- supabase/migrations: table, grants and policies in one migration
- tests/security and supabase/tests/database: independent HTTP and DB assertions

Run pnpm install --frozen-lockfile --ignore-scripts, pnpm exec playwright install chromium,
pnpm exec supabase start, pnpm fixtures, then pnpm verify.
Docker is required for local Supabase. No Supabase cloud project/login is needed.
Stop the local stack with pnpm exec supabase stop --no-backup when finished.

Adapt docs/SECURITY.md and tests to actual product decisions before deployment.
Build/start/security scripts are real commands; missing services fail verification.
