# Security — private document example

This is a local verification example, not a complete production service.
Scope: {{scope}}

## Authentication

Supabase Auth owns password verification and sessions. Route handlers use
@supabase/ssr cookie storage and getClaims() for verified identity. They can
refresh/write cookies in their response; there are no authenticated Server Components.
Logout clears the caller's cookies and requests provider sign-out. Captured access
JWTs can remain valid until expiry; immediate revocation requires a separate policy.
Add password recovery, login abuse controls and sensitive-operation reauthentication
before deploying a real service. No password hashing or JWT signing is implemented here.

## Authorization

Resource: public.documents, with owner_id referencing auth.users.
Boundary: each API handler verifies identity, filters by owner_id, and uses the
user-scoped client. Postgres grants plus RLS apply independently to Data API access.
Owner assignment is server-side; update input cannot contain owner_id.

| Operation on A's document | guest | A | B | admin fixture |
|---|---|---|---|---|
| read / update / delete | deny | allow | deny | deny |
| list / direct ID | deny | own data only | no A data | no A data |
| insert as A | deny | allow | deny | deny |

The admin fixture is a distinct ordinary authenticated account, not an implemented
admin role. Admin access is deliberately absent; implement explicit privileges and
revise tests if the product requires it. Feature flags are declared requirements,
not evidence that billing, uploads or admin functions have been implemented.

## Public and private data

Public: sign-in page. Private: document contents and session identity.
Responses use private/no-store. Unknown or inaccessible document IDs return 404
for authenticated users without revealing existence. Anonymous access returns 401.

## Sensitive operations and secrets

All mutation endpoints require the configured APP_ORIGIN exactly, including login.
Application configuration contains only Supabase URL and publishable/anon key.
The service-role key is used only by the local fixture script and is not persisted
in application config, bundled or sent to the app server.
Configure HTTPS, cookies, CSP, rate limits and service-specific logging for deployment.

## Uploads, webhooks, billing and external APIs

None implemented by this example. Add boundaries and tests with each feature.
Do not treat enabling a config flag as enabling a protected implementation.

## PII

Fixture emails and document bodies are synthetic. No production credentials/data
are used. Local fixture configuration is ignored by git; test traces are disabled.
Define retention, deletion and telemetry rules before storing real user data.

## Verification

- tests/security/: actual HTTP sign-in/cookies and owner/other/guest/admin-deny cases
- tests/e2e/session.spec.ts: browser sign-in, cookie persistence and logout
- tests/unit/input.test.ts: validation and non-editable owner field
- supabase/tests/database/documents.test.sql: grants and RLS, 24 pgTAP assertions
- pnpm verify: lint, typecheck, unit/integration, build, HTTP/browser and DB tests
- CI provisions disposable local Supabase; no remote Supabase secret is required

Run against the local fixture only. Tests create, update and delete synthetic data.
The database fixture rolls back; the disposable Supabase stack owns auth fixtures.
