# Templates

Consumer-owned project docs, security tests, verification scripts and CI.
Generic standards/recipes stay in the package. Init uses deterministic templates
and preflights collisions before writing; existing project decisions are preserved.

The webapp baseline uses Biome, TypeScript, Vitest and Playwright. Its verification
fails until real application commands, tests and required services are configured.
The explicit examples/nextjs-supabase variant provides a runnable owner-scoped
resource boundary, local synthetic fixtures, grants/RLS/pgTAP and CI.

See [webapp guide](../docs/webapp-template.md) and [CLI](../docs/cli.md).
Adapters and methodologies are optional. This index is not copied to consumers.
