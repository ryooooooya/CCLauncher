# License and provenance review

Status: historical inventory recorded; owner clarification received and [MIT applied](../../LICENSE).
Reviewed source: `1c39d777ee35dfcbdc85f8f896dfca190eeb40cd` (2026-09-11).
The license grant is in root LICENSE. npm publication remains deferred.

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
The snapshot intentionally predates the review documents, license and implementation changes
added by this PR. Its hashes, counts and pending assessments are historical evidence,
not an inventory or current assessment of the final licensed tree. The owner clarification
below resolves the recorded method-origin question; the snapshot is retained unchanged.

## Findings by source group

| Group | Evidence and current assessment |
|---|---|
| CLI, build/release scripts and regression tests | Introduced during the package migration; repository implementation history is traceable. No vendored runtime dependency in the tarball. |
| standards / recipes | Migration PRs describe newly written summaries with primary reference links. References are retained. A link or verified date is not a license grant over the linked documentation. |
| Webapp templates | Project-specific sample implementation and provider API integration from PR #17. Third-party packages are referenced by exact versions; their source implementations are not bundled. |
| adapters | Short project-authored entry points and runtime notes from the migration. |
| Blueprint / Printer | Substantial retained pre-migration material. The withAI concept was clarified by the owner as original; see the limited scope of that statement below. |
| generated locks / config | Package-manager output and configuration; not a substitute for a downstream dependency license audit. |

## Owner clarification: withAI

Commit [ecb5a2f](https://github.com/ryooooooya/CCLauncher/commit/ecb5a2fb6b06ae39d548e272393ad1d7b00b3a28)
is titled “integrate withAI 3-layer structure (Blueprint/Printer) into setup” and
introduces the original Blueprint rules and Printer files. Subsequent commits
[06e470b](https://github.com/ryooooooya/CCLauncher/commit/06e470b) and
[c4a0b01](https://github.com/ryooooooya/CCLauncher/commit/c4a0b01) add print/deck
material and rewrite token conventions. PR #19 moves these into the packaged method.

The initial history inspection did not establish what withAI referred to. On
2026-09-11, when asked about that origin, the owner described it as an original
thought/concept (「あー、まぁオリジナルな思想かな。」). We record that as clarification
of the concept's origin, not a statement that every retained sentence or example
has undergone an external-source audit. Together with the previously approved MIT
direction, this resolves the concrete origin question raised during this review.
The copyright notice uses the repository owner's public handle, ryooooooya.

No separate upstream withAI project or required upstream notice was identified by
this inspection. If external material is subsequently identified, record its source
and terms and retain required notices, obtain permission, replace it or explicitly
exclude it as appropriate. Do not infer ownership solely from Git authorship.

The token-rule history explicitly mentions consulting Tailwind and shadcn theming
references. Review any actual copied passages/examples against their specific source
if such copying is identified; use of an API or variable name alone is not
proof that code was copied. No copying or license infringement is established here.

## Direct dependency declarations

| Declared license | Exact dependencies |
|---|---|
| MIT | next 16.3.4; react / react-dom 19.3.0; @supabase/ssr 0.12.7; @supabase/supabase-js 2.116.0; supabase 2.117.0; vitest 5.0.0; @types/node 22.20.2; @types/react / @types/react-dom 19.3.0 |
| Apache-2.0 | @playwright/test 1.63.0; typescript 5.9.3 |
| MIT OR Apache-2.0 | @biomejs/biome 2.5.12 |

These are declarations in the installed versions' package.json files, not an assertion
that all transitive dependencies use the same license. They remain third-party packages;
the CCLauncher MIT grant does not relicense them. Before distributing a built consumer
application, inspect that application's actual dependency/binary distribution and notices.
Do not label this table a full third-party notices file.

## License application and notice retention

- Root LICENSE contains the standard MIT text with `Copyright (c) 2026 ryooooooya`;
  package metadata declares MIT. This covers CCLauncher material, not linked third-party
  documentation or separately installed dependencies.
- Build copies the root license to dist/LICENSE and includes its hash in the manifest.
  Both license copies are included and checked in the actual npm tarball test.
- Init writes LICENSE.cclauncher with the complete notice and an explicit scope note.
  This covers supplied baseline, adapter, example and method scaffolding. The consumer's
  own LICENSE and package license field remain intact. A notice-path conflict aborts
  before any scaffolding is written, using the normal init preflight.
- Keep the notice when copying substantial CCLauncher material, including when moving
  template files to another repository. This is not a license grant over the consumer's
  independently authored application code.
- npm publication, account setup and independent security review remain separate work;
  see the [distribution policy](../distribution.md). The review records targeted evidence,
  not a guarantee that no unknown third-party input exists.

Primary references consulted on 2026-09-11:

- [OSI MIT license](https://opensource.org/license/mit): standard text and notice retention condition.
- [GitHub licensing guidance](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository): licensing a repository and including a license file.
