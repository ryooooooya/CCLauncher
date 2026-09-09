# Architecture

Framework: {{framework}}
Authentication: {{auth}}
Database: {{database}}

## Boundaries

TODO: identify entry points, data access layer, external services and deployment.
Record project-specific decisions here and in docs/decisions/.

## Verification setup

Define package scripts: lint, typecheck, test, build and test:security.
Add actual application boundary tests under tests/security/.
Run sh scripts/verify.sh; missing checks fail deliberately.
CCLauncher initialization does not install a framework or implement application routes.

Use pnpm with an exact packageManager version and a committed pnpm-lock.yaml.
The initial CI uses Node.js 24.19.0 and pnpm 11.19.0; review these pins
against the application's declared runtime before enabling CI.
