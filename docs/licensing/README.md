# License and provenance review

Status: inventory complete for the recorded snapshot; MIT application is **pending**.
Reviewed source: `1c39d777ee35dfcbdc85f8f896dfca190eeb40cd` (2026-09-11).
No license grant or npm publication is made by this review.

## Evidence collected

- [Source inventory](source-inventory.json): all 120 tracked source files, SHA-256,
  first traceable commit using `git log --follow`, reference URLs and provenance status.
  Also records the 95 files selected by `npm pack --ignore-scripts --json --dry-run`,
  their hashes and source mapping. The emitted manifest is generated from source.
- [Dependency metadata](dependency-metadata.json): all 13 direct dependencies from
  the generated Next.js/Supabase example (including the baseline tool dependencies),
  matching installed versions, declared license and package metadata hash.
- Git history records one author identity and AI co-author trailers in older commits.
  A commit author or AI co-author trailer does not establish underlying ownership,
  exclude external copying or grant permission to relicense.
- No node_modules or third-party library binaries are selected for the CCLauncher
  tarball. Dependency declarations/lockfiles are bundled; the dependency implementations
  are installed separately by consumers. Browser/DB images are fetched separately by CI.

This is a source/history/package inventory with targeted provenance inspection, not
an exhaustive similarity search, full dependency legal audit or certification of ownership.
The snapshot intentionally does not include the review documents added by this PR.

## Findings by source group

| Group | Evidence and current assessment |
|---|---|
| CLI, build/release scripts and regression tests | Introduced during the package migration; repository implementation history is traceable. No vendored runtime dependency in the tarball. |
| standards / recipes | Migration PRs describe newly written summaries with primary reference links. References are retained. A link or verified date is not a license grant over the linked documentation. |
| Webapp templates | Project-specific sample implementation and provider API integration from PR #17. Third-party packages are referenced by exact versions; their source implementations are not bundled. |
| adapters | Short project-authored entry points and runtime notes from the migration. |
| Blueprint / Printer | Substantial retained pre-migration material. The withAI origin below requires owner clarification before applying a repository-wide MIT grant. |
| generated locks / config | Package-manager output and configuration; not a substitute for a downstream dependency license audit. |

## Blocking origin question: withAI

Commit [ecb5a2f](https://github.com/ryooooooya/CCLauncher/commit/ecb5a2fb6b06ae39d548e272393ad1d7b00b3a28)
is titled “integrate withAI 3-layer structure (Blueprint/Printer) into setup” and
introduces the original Blueprint rules and Printer files. Subsequent commits
[06e470b](https://github.com/ryooooooya/CCLauncher/commit/06e470b) and
[c4a0b01](https://github.com/ryooooooya/CCLauncher/commit/c4a0b01) add print/deck
material and rewrite token conventions. PR #19 moves these into the packaged method.

The record does not identify what withAI is, a source URL, an upstream license or
whether it is the owner's own project. Public search did not establish a reliable
source. Do not infer ownership from the fact that the current Git author is the owner.

Owner clarification needed: identify withAI and whether the retained text/templates
were authored for this project or brought from another project/person/organization.
If external material was used, record its URL/version and applicable terms, then
retain required notices, obtain permission, replace the material, or exclude it
from the proposed grant as appropriate. Do not silently remove the optional method
merely to clear this question.

The token-rule history explicitly mentions consulting Tailwind and shadcn theming
references. Review any actual copied passages/examples against their specific source
before declaring the method cleared; use of an API or variable name alone is not
proof that code was copied. No copying or license infringement is established here.

## Direct dependency declarations

| Declared license | Exact dependencies |
|---|---|
| MIT | next 16.3.4; react / react-dom 19.3.0; @supabase/ssr 0.12.7; @supabase/supabase-js 2.116.0; supabase 2.117.0; vitest 5.0.0; @types/node 22.20.2; @types/react / @types/react-dom 19.3.0 |
| Apache-2.0 | @playwright/test 1.63.0; typescript 5.9.3 |
| MIT OR Apache-2.0 | @biomejs/biome 2.5.12 |

These are declarations in the installed versions' package.json files, not an assertion
that all transitive dependencies use the same license. They remain third-party packages;
a CCLauncher MIT grant would not relicense them. Before distributing a built consumer
application, inspect that application's actual dependency/binary distribution and notices.
Do not label this table a full third-party notices file.

## Concrete MIT follow-up

1. Resolve and record the method origin, any other known external inputs and the
   copyright holder authorized to grant the license. Preserve source-specific notices.
2. Add the unmodified MIT text in root LICENSE for material the owner may license;
   state any exceptions clearly. Update package metadata from UNLICENSED only then.
3. Ensure LICENSE and any required notices are present in the actual npm tarball.
4. For templates intended to be copied into consumers, define how required notices
   travel with those files without replacing the consumer's own application license.
5. Run package tests, inspect the final tarball and review the licensing PR. npm
   publication remains a separate action after security review and account setup.

MIT direction was already approved; that preference does not answer the source-origin
question. Until resolved, retain the existing UNLICENSED setting. This follows the
repository's [distribution policy](../distribution.md).

Primary references consulted on 2026-09-11:

- [OSI MIT license](https://opensource.org/license/mit): standard text and notice retention condition.
- [GitHub licensing guidance](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository): licensing a repository and including a license file.
