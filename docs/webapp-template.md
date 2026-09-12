# Webapp template and verification example

The baseline uses one lint tool (Biome), TypeScript, Vitest and Playwright.
AGENTS.md remains a small maintained index; project decisions belong in docs/.
Generic standards/recipes stay inside the package.

## Existing application

Run init using your installed exact CCLauncher version. The template adds
verification scripts/configs and HTTP security tests. Existing package.json is
preserved; reconcile its scripts/dependencies with the packaged template manually.
Other conflicting files are never overwritten. Implement/adapt the actual endpoint
contract in tests/security/target.ts and describe its matrix in docs/SECURITY.md.

For an empty generic target, init also supplies package.json and a frozen pnpm
lockfile. Build/start deliberately fail until connected to an application; no
framework/auth implementation is silently selected by generic initialization.

## Runnable Next.js + Supabase example

Use the built CLI from the repository or an installed tarball to create an empty
target directory:

```sh
node /absolute/path/to/CCLauncher/dist/cli/index.js init --yes \
  --auth supabase --database supabase --example nextjs-supabase --dir ./my-app
cd my-app
pnpm install --frozen-lockfile --ignore-scripts
pnpm exec playwright install chromium
pnpm exec supabase start
pnpm fixtures
pnpm verify
```

Node.js 24, pnpm 11.19.0 and Docker are required. No Supabase cloud login, linked
project or production secret is needed. The fixture script reads local CLI status,
rejects non-local URLs, creates synthetic accounts, and writes ignored .env.local
and .env.test files without printing credentials. It refuses to overwrite unrelated
environment files. Stop the disposable stack with `pnpm exec supabase stop --no-backup`.

The example includes sign-in/out and owner-scoped document CRUD endpoints. It is
an opt-in verification target, not a complete production service. Password
recovery, abuse controls, CSP, immediate revocation policy, deployment configuration
and feature-specific boundaries still require product decisions. Configuration
flags do not automatically implement billing, uploads, webhooks or admin features.

The application never uses a service-role key. Provider-managed identity and
session cookies are verified on HTTP requests; Postgres grants and RLS independently
limit access through the Data API. There is no self-built signing/password system.

Install the exact CCLauncher package/tarball as a dev dependency if you also want
`pnpm cc` and local-install doctor checks in the generated example. npm publication
of CCLauncher remains deferred; the example lockfile pins its application tools.

## Verification layers

| Layer | Actual execution |
|---|---|
| lint / types | Biome check; Next route types and TypeScript |
| unit | 9 input validation checks in Vitest |
| HTTP security | managed sign-in/cookies, guest, owner, other user and admin-fixture deny matrix |
| browser | real sign-in, reload with cookies and sign-out in Chromium |
| database | 24 pgTAP assertions for grants, RLS, CRUD allow/deny and owner transfer |

The admin fixture is an ordinary third user with no bypass, not a privileged
administration feature. A and B must have distinct identities. Owner success and
post-denial persistent state checks prevent broken fixtures from passing all-deny
tests. DB tests switch actual roles/claims and roll back fixture changes.

`pnpm verify` fails on missing commands, test files, services and nonzero test exits.
It builds before HTTP/browser tests so they exercise `next start`. Both production
consumer CI and the repository example job provision local Supabase and Chromium,
run verify, audit dependencies and stop services. No coverage percentage is used as
security evidence. Independent review remains required for high-risk changes.

Tool versions and lockfiles were resolved from the npm registry on 2026-09-09.
The generated pnpm workspace explicitly records version-specific release-age
exceptions emitted during resolution; review these with dependency updates.
No runtime dependency is added to the CCLauncher CLI itself.

## Primary references

- [Supabase SSR client](https://supabase.com/docs/guides/auth/server-side/creating-a-client?queryGroups=framework&framework=nextjs)
- [Supabase database testing](https://supabase.com/docs/guides/database/testing)
- [Supabase local configuration](https://supabase.com/docs/guides/local-development/cli/config)
- [Playwright API testing](https://playwright.dev/docs/api-testing)


## Security review follow-up

See [review follow-up](security-review-followup.md) for the September 2026 findings,
regressions and remaining deployment/release prerequisites. The example now restricts
Data API writes by column and configures HttpOnly cookies with Secure on HTTPS origins.
CI uses an isolated loopback TLS proxy to exercise browser cookie behavior; it is not a
production server. Existing consumers must review and apply the additional column-grant
migration and updated verifier/reporters themselves; package updates do not rewrite them.

Playwright declarations use `tests/required-test.ts`, including custom fixtures via `test.extend`.
Empty describe groups fail during collection even alongside passing tests. The config rejects
unguarded Playwright test imports under tests/. Keep these guards when adapting the template.

The example defaults to HTTPS cookies. Local HTTP requires explicit
`CCLAUNCHER_LOCAL_HTTP=true` and a loopback APP_ORIGIN; fixtures set this only for HTTP mode.
This is an operator assertion of isolation, not a check for public network exposure.
Never enable the exception for a deployment, tunnel or public reverse proxy.

The Playwright import check follows local imports/reexports outside tests/ and tsconfig
path aliases, with cycle detection and canonical paths. Dynamic import/require accepts
only literal specifiers (including backtick literals without interpolation); computed
module names and unresolved dependencies fail collection. Use explicit local imports
for test fixtures. Installed package internals and the exact required-test entry point
are trusted, as are the runner/config/verifier: this is not arbitrary-code isolation.
