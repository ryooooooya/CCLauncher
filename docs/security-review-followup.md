# Independent security review follow-up

Received 2026-09-11: independent review of
`1c39d777ee35dfcbdc85f8f896dfca190eeb40cd` (tree
`7d366a02e46e1dbbe07e1c8ba930e1fc276b4471`). Findings below are responses to that
review, not a new independent approval of these changes. The license/provenance PR
postdates that baseline; see [licensing](licensing/README.md).

| Finding | Implementation response | Regression evidence / remaining limit |
|---|---|---|
| F1 High: local files enter tarball | Reviewed exact source list plus private-file rejection; independent tarball expectations; clean-checkout release policy | Synthetic .env.local, .env.test, key and unapproved document make build and normal pack fail. No evidence of an actual historical credential leak was reported. |
| F2 Medium: skipped tests pass | Required Vitest/Playwright reporters and verifier requiring fresh structured results | Actual pinned runners exercise pass, all-skip, mixed, dynamic skip, todo/fixme and empty suites. Missing report also fails. This guards accidental omissions, not malicious edits to the verifier/reporters themselves. |
| F3 Medium: malformed config bypasses DB verification | Same CLI validator copied by build, used before any command in both modes | Invalid object/array/enum/missing field/version fail without dispatch; valid Supabase config requires SQL and propagates DB failure. |
| F4 Medium: possible ID existence oracle | Follow-up migration revokes table INSERT/UPDATE and grants only writable columns | pgTAP and direct PostgREST with real A/B JWTs require identical 42501 denial for existing/unused explicit IDs and retain normal own CRUD. The old behavior was a review hypothesis; do not call it independently reproduced by these post-fix tests. |
| F5 Medium: production cookie configuration | Explicit HttpOnly, SameSite=Lax, path /, host-only; Secure for HTTPS; non-loopback HTTP origin rejected | CI uses real browser over loopback TLS for flags, JS non-readability, provider refresh and deletion. Refresh uses expired storage metadata with a real refresh token, not an expired signed JWT. |
| F6 Medium: release validation / external protections | Release checks the latest main push CI for the exact checkout SHA and both required jobs, and rejects unprotected main | Package-only, absent/failed/skipped/cancelled sample and different-SHA results fail. Full branch/review/tag/npm-environment administration remains owner work, not completed by code. |
| F7 Low: partial init write remains | Register exclusive-opened file before writing, then close and roll back on failure | Synthetic partial writes after zero/one/three successful writes leave existing files intact and permit a retry. Existing-target conflicts remain rejected. |

## Validation scope

Repository tests cover packaging, config dispatch, release result selection and filesystem
fault injection. Runner probes use actual pinned Vitest/Playwright packages and synthetic
test cases; those fixtures are not evidence about application authorization. Webapp CI
runs the installed tarball's example with real disposable Supabase/Auth/PostgREST, pgTAP,
HTTP requests and Chromium. CI must pass on the final PR SHA; inspect its run rather than
reusing success from the original reviewed commit.

The original review's test-gap table also motivated both users' HTTP CRUD/list positives,
forged-owner rejection and guest creation denial with unchanged data checks. The remaining
items below are not silently treated as verified.

## Remaining work before deployment / publication

- Obtain independent review of these fixes. This follow-up is the implementer's response.
- Confirm required PR approval/checks and bypass restrictions on main, protected release
  tags, npm environment approval/tag restrictions, scope ownership and Trusted Publisher.
  The available integration does not establish these administration settings. Keep
  NPM_PUBLISH_ENABLED unset/false; no publish or tag is part of this change.
- Before production deployment, specify abuse/rate controls, recovery, reauthentication,
  token expiry/revocation policy, CSP/cache behavior, data retention, logging and recovery.
- Extend regression coverage for structurally valid JWT signature/sub/role tampering,
  real signed-token expiry and invalid/revoked refresh, all mutation Origin permutations,
  HTTP payload boundaries and the actual CDN/cache deployment path.
- DB pgTAP execution still uses the Supabase runner's result; the new structured skip
  rejection applies to Vitest/Playwright, not to an arbitrary SQL TAP reporter.

Technical references checked during the response: [Vitest reporter API](https://vitest.dev/api/advanced/reporters),
[Playwright reporter API](https://playwright.dev/docs/api/class-reporter),
[PostgreSQL column grants](https://www.postgresql.org/docs/17/sql-grant.html),
[Supabase SSR session architecture](https://supabase.com/docs/guides/auth/server-side/advanced-guide).

## Second review response

The supplied summary reviewed `6afb1916b21d75d64ea4985f9829629a7cb0ce2b`:
F1/F3 resolved, F2/F4–F7 partially resolved, development conditionally usable,
production/npm publication on hold. Only the summary was supplied for this round.

- F2: reproduced passing test + empty Playwright describe succeeding. Playwright
  removes empty groups before reporter onBegin, so reporter inspection alone cannot
  enforce this. The guarded test API counts declarations, including nested and
  dynamically empty groups; config import checks prevent accidental raw API use.
  Existing skipped/todo/failed-result checks remain. This is not a sandbox against
  intentional edits to configuration, guards or verifier code.
- F7: failed rollback reports the original write error, remaining paths and removal
  error codes. Fault injection verifies existing data is retained and retry succeeds
  after deliberate removal of failed output. Permission errors cannot be repaired
  automatically or guarantee a clean directory.
- Cookie exception: HTTP now requires explicit CCLAUNCHER_LOCAL_HTTP=true as well
  as a loopback origin. Default policy requires HTTPS. This mitigates accidental
  insecure configuration; it does not discover the real deployment topology.

Local verification: 24 repository tests, 27 actual pinned-runner cases (10 Vitest,
17 Playwright including describe variants/custom fixtures/import rejection), 13
application unit tests, lint, typecheck and build passed. CI results must be assessed
on the new commit. The reviewer's
lack of real DB/HTTPS execution is not retroactively converted into independent
validation by implementer CI. No complete closure of F4–F7 is claimed.
Main protection and the remaining publication/deployment prerequisites above remain open.
