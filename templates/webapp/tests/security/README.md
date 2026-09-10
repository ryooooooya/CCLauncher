# Application security tests

The Playwright tests call actual local HTTP endpoints. tests/security/target.ts
is the application contract: adapt endpoint paths and fixture login to your app,
then preserve the owner-success and cross-user-deny assertions.

Expected default contract:

- POST /api/session: email/password -> 200 and managed session cookies
- GET /api/session: authenticated user ID, or 401 for guest
- DELETE /api/session: logout
- POST /api/documents: {body} -> 201 {id,body}
- GET /api/documents: current user's array of documents
- GET/PATCH/DELETE /api/documents/:id: owner-only operations; inaccessible ID -> 404
- Anonymous resource access -> 401; forged editable fields -> 400
- Mutation requests require the configured Origin; invalid Origin -> 403

Provide synthetic SECURITY_OWNER/OTHER/ADMIN_EMAIL and _PASSWORD in ignored
.env.test or environment variables. They must identify three distinct users.
The admin fixture has no automatic elevated privileges; define and test any real
admin role in the service-specific access matrix. This template alone does not
claim that administrative privileges have been implemented or verified.

The optional nextjs-supabase example implements this contract with real Supabase
Auth and Postgres. Other applications must adapt the contract and docs/SECURITY.md.
Missing application, credentials or test services fail; there are no passing mocks
or skipped placeholders. Tests create, update and delete synthetic local data.
