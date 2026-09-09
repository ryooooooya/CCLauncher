# Project

Read docs/PRODUCT.md for product scope and acceptance criteria.
This index is maintained directly; do not generate it from agent instructions.

## Architecture

- src/app: routes and entry points
- src/features: feature behavior
- src/lib: auth, database and validation boundaries
- tests: behavior and boundary verification
- docs/specs: feature specifications

## Sources of truth

- Product: docs/PRODUCT.md
- Architecture: docs/ARCHITECTURE.md
- Security boundaries: docs/SECURITY.md
- Feature specs: docs/specs/

## Commands

- sh scripts/verify.sh
- sh scripts/security-check.sh
- pnpm run test
- pnpm run build

## CCLauncher

This project uses CCLauncher {{version}}.
Install the exact package version and commit its lockfile before using it.
Load generic guidance only when relevant:

    pnpm exec cclauncher context <topic>

Generic guidance remains in the installed package.
Do not copy recipes or standards into this project.
Project decisions take precedence over generic recipes.
Report conflicts that would weaken a security boundary.

## Security-sensitive changes

Authentication, authorization, billing, admin access, file uploads,
webhooks, PII, database permissions and secrets are high-risk.

Before changing these areas:

1. Read docs/SECURITY.md.
2. Load the relevant CCLauncher context.
3. Add or update tests against the actual boundary.
4. Run verification and obtain independent review.

Never weaken tests or controls merely to make CI pass.

## Done

- lint passes
- typecheck passes
- tests pass
- build passes
- relevant security tests pass
- required external services were available during verification

Initialization alone does not satisfy these conditions.
Unimplemented checks must fail rather than silently skip.
