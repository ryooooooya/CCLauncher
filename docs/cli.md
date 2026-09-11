# CLI

Issue #5 implements offline knowledge lookup and deterministic project initialization.
The package is still unpublished; use a locally built tarball as described in
[distribution](distribution.md). Install it as a development dependency before use.

## Commands

```sh
pnpm exec cclauncher init --yes --auth supabase --database supabase --pii true
pnpm exec cclauncher recipe supabase
pnpm exec cclauncher context auth
pnpm exec cclauncher doctor
```

For a repository checkout, run `node scripts/build.mjs` and invoke
`node /absolute/path/to/CCLauncher/dist/cli/index.js` in the consumer directory.
The runtime does not require access to the source checkout after packaging.
A consumer may add `"cc": "cclauncher"` to package scripts for `pnpm cc context auth`.

## Initialization

Interactive `init` asks for scope, framework, authentication, database, PII,
uploads, billing, webhooks, admin and other external APIs. Noninteractive use
requires `--yes`. All enum and boolean inputs are validated before writing.

Defaults: webapp profile, production scope, Next.js, no auth/database, all
features disabled. These defaults describe an unconfigured scaffold, not a
production-ready app. Select authentication before exposing private resources.

Options:

| Option | Values |
|---|---|
| `--dir` | Target directory; defaults to current working directory |
| `--scope` | production / prototype |
| `--example` | nextjs-supabase (matching stack and empty target only) |
| `--framework` | nextjs / none |
| `--auth` | none / supabase / authjs |
| `--database` | none / supabase / postgres |
| `--uploads`, `--billing`, `--admin`, `--pii`, `--webhooks`, `--external-api` | true / false |

Generated files: AGENTS.md, .cclauncher.json, PRODUCT / ARCHITECTURE / SECURITY
under docs/, tests/security/README.md, verify.sh, security-check.sh and their
shared Node runner under scripts/. Production also gets a verification workflow;
Supabase database selection adds supabase/tests/database/README.md.

Existing package.json is preserved; its dependency lockfile is not generated or replaced.
Empty targets receive a maintained package.json and lockfile. Other existing project files are preserved. Any generated-path
collision fails before writing. Existing symlink parents and leaf targets are
rejected, and files use exclusive creation. Use a locally controlled workspace;
initialization is not an OS sandbox against hostile concurrent filesystem changes.
There is no force option, network fetch, install hook, model assignment or
recipe/standard copy into the consumer. No agent-specific adapter is installed.

### Completing the scaffold

Define actual `lint`, `typecheck`, `test`, `test:security`, `test:e2e`, `build` package scripts,
install their tools and implement executable application tests in tests/security/.
Then run `sh scripts/verify.sh`. Missing scripts/tests fail before any checks run;
runner failure stops subsequent commands. Supabase projects additionally need
SQL tests and an available disposable local database for `pnpm exec supabase test db`.

The generated workflow is an initial gate. Review the Node/pnpm pins and provision
required test services before enabling it. Issue #6 supplies HTTP security tests and an optional runnable Next.js/Supabase
example with provider fixtures and CI; see [webapp guide](webapp-template.md).
Placeholder READMEs do not count as tests. CCLauncher does not execute arbitrary project scripts during init
or doctor. Prototype omits production CI but does not silently bypass verification.

## Knowledge and determinism

`recipe <id>` writes the exact packaged Markdown bytes including metadata.
It works without config, a network connection or source files. Unknown IDs fail
with exit code 1; input is looked up by ID and never used as a filesystem path.

`context <topic>` reads .cclauncher.json, validates its schema and applies the
explicit rules in manifest.json. Rules select whole files or named H2 sections
in source order. Fenced example headings are ignored. No LLM or external source
is consulted. Output depends only on the package content/version and normalized
config, not dates, current directory names or JSON key order. File hash failures
are detected before any context is written to stdout.

The required topics are auth, database, dependencies, upload, webhook, billing,
admin, privacy, deployment and testing. Additional UI/operations topics are listed
in `--help`. Feature flags record scope; explicitly requested guidance is still
available for a currently disabled feature. Technology selection follows the
framework/auth/database rules, not a heuristic match against metadata text.

Schema version 1 accepts only the documented stack values and boolean features.
The earlier config shape without scope or externalApi is accepted with defaults
production/false. Unknown fields, including model assignments, fail validation.

## Doctor

Doctor reports PASS / WARN / FAIL without executing checks or fixing files. FAIL
causes exit code 1; WARN alone does not. It checks package version/inventory hashes,
local installation, config, required docs/scripts, pnpm lockfile presence, declared
application commands, actual test-file presence and selected Supabase SQL tests.
A declared version must be exact; a local `.tgz` dependency is also accepted for
unpublished development. Lockfile existence is not a lockfile integrity audit.

Knowledge dates older than 180 days or in the future produce a warning. Installed
Next.js major versions are compared with the verified recipe range (16); missing
or unverified versions warn rather than asserting a known runtime failure. The
manifest's compatibility rules can expand when further combinations are verified.
Project TODOs and CI setup also remain visible. Doctor does not prove that tests
are meaningful or passing; run the project verifier and obtain required review.

## Agent entry points

`init --adapter generic|claude|codex` selects an entry point without saving tool or model choices in config. Generic is the default; Claude adds only `@AGENTS.md` in CLAUDE.md. Existing files are never overwritten. `context workflow` loads the shared role/risk standard. See [adapter guide](agent-adapters.md).

## Optional methodology

`init --method blueprint-printer` adds the selected method’s templates and asset rules. It is omitted by default and does not install Storybook or other dependencies. Existing files are preflighted together with baseline files; unknown methods fail before writes. See [method guide](../methods/blueprint-printer/README.md).
