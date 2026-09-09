# Security

Status: initial decisions; complete TODOs before public deployment.
Scope: {{scope}}

## Authentication

Provider: {{auth}}
Session mechanism: TODO; specify expiry, logout and revocation behavior.
If provider is none, do not expose private resources until authentication is designed.

## Authorization

Boundary: TODO; name the server/data access enforcement points.
Ownership model: TODO
Roles: TODO

## Data access matrix

| Resource | guest | owner | other user | admin |
|---|---|---|---|---|
| TODO: private resource | deny | specified operations only | deny | explicitly specified only |

Replace this example with the service's actual resource matrix.

## Data

Public data: TODO
Private data: TODO
Database: {{database}}

## Sensitive operations

Billing enabled: {{billing}}
Admin enabled: {{admin}}
Account deletion, email change and other sensitive operations: TODO

## Secrets

Server-only secrets: TODO; record names and purpose, never secret values.

## Uploads

Enabled: {{uploads}}
Allowed file types, size, storage and download boundary: TODO if enabled.

## External webhooks and APIs

Webhooks enabled: {{webhooks}}
Other external APIs enabled: {{externalApi}}
Providers, signature verification, replay/idempotency policy: TODO if applicable.

## PII

Enabled: {{pii}}
Stored fields, purpose, retention and deletion: TODO if enabled.
Logging and external telemetry restrictions: TODO

## Security verification

Application tests: tests/security/ (must be implemented against actual routes/data).
Command: sh scripts/security-check.sh
CI: .github/workflows/cclauncher-verify.yml when generated for production.
Database policy verification: add Supabase pgTAP tests when Supabase is selected.
Initialization is not a passing security review or a working authentication system.
