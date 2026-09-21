# Versioned distribution

The package is [`@ryooooooya/cclauncher@0.1.0`](https://www.npmjs.com/package/@ryooooooya/cclauncher/v/0.1.0), published on npm on 2026-09-21. It uses the owner's personal npm scope. The owner approved MIT on 2026-09-09 and clarified the withAI concept as original on 2026-09-11. CCLauncher is provided under the [MIT license](../LICENSE).

The [2026-09-11 provenance inventory](licensing/README.md) records the inspected historical source/package snapshot and subsequent owner clarification. It is not a certification of ownership or a full transitive dependency audit. Preserve existing references and review any newly identified external material against its own terms.

The npm tarball includes root LICENSE and a build-generated, hash-inventoried dist/LICENSE. Init reads that packaged license and writes LICENSE.cclauncher alongside all selected scaffolding. This retains the notice for CCLauncher material without changing the consumer application's own LICENSE or package license field. Third-party dependencies retain their own terms; keep required notices when redistributing them.

## Publication record

- First version: `0.1.0`, published by the owner from an authenticated local npm session.
- Source commit and protected [`v0.1.0` tag](https://github.com/ryooooooya/CCLauncher/tree/v0.1.0): `d8d58850c86fc852224fe720abe7ae68652da148`.
- [Main CI](https://github.com/ryooooooya/CCLauncher/actions/runs/34661219694) succeeded on that exact commit. The published tarball's SHA-512 integrity matched the prepared artifact:
  `sha512-UixIRxmxCJAavmjSLZhKBRf3cQXutZ658dPmZIogme0flKizY5+JyatIoBbjuLhkAnDeZqHQ+/wFFKpCSKdVPw==`.
- GitHub API checks confirmed protected main with required `verify` and `webapp-example` checks, and active `v*` tag rules: creation restricted to repository admins; updates/deletion prohibited with no bypass actors.
- Owner setup screenshots confirmed the `npm` environment reviewer, self-review allowed for the single maintainer, administrator bypass disabled, and deployment limited to `v*` tags. The owner confirmed saving the environment settings.
- The npm settings screenshot confirmed Trusted Publisher for `ryooooooya/CCLauncher`, `release.yml`, environment `npm`, with direct `npm publish` permission. The owner reported setting the repository variable `NPM_PUBLISH_ENABLED=true`.

These observations record setup on 2026-09-21, not continuous monitoring of external
settings. **GitHub Actions OIDC/provenance publication has not yet been exercised**;
verify it on the next version. The initial local publication did not use that path.
Do not rerun publication of 0.1.0 to test it. npm publication is separate from
approval of a consumer application's production security boundaries and deployment.

## Reproducibility

Node 24 and pnpm 11.19.0 are the development baseline. There are no external build or runtime dependencies in the CLI. The CLI is plain ESM JavaScript. Its build checks syntax and package structure; behavioral tests verify the CLI. The generated webapp separately runs TypeScript checks.

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm verify
npm pack
```

`dist/` is regenerated from source. The emitted manifest records the package version and SHA-256 of every CLI module, selected knowledge file and scaffold template. It is an inventory, not an independent trust anchor. Package integrity comes from the consumer lockfile and release provenance. Knowledge entries, metadata validation and context selection are explicit. See [architecture](architecture.md) and [CLI](cli.md).

The reviewed `distribution-files.json` lists exact distribution sources. Build rejects
unknown files found in collected directories and additionally rejects real environment
files, key files and logs, even if mistakenly listed. `.env.example` is permitted.
Known tool caches are excluded. The final tarball test derives its expected paths from
this reviewed source list, independently of the generated manifest. Build never updates
the source list itself. Changes to that list require review.

Always build release artifacts in a fresh checkout or clean archive of the reviewed
commit. Do not package a directory used for running a sample or storing credentials.
Do not bypass prepack or reuse a stale dist for release. The package excludes legacy
and maintainer documentation and repository regression tests. There is no network access or installation hook in the CLI. The CLI implements init / recipe / context / doctor. Init generates project scaffolding and supports an explicit runnable Next.js/Supabase example.

Install the published version in a consumer project:

```sh
pnpm add -D --save-exact @ryooooooya/cclauncher@0.1.0
pnpm exec cclauncher --version
pnpm install --frozen-lockfile --ignore-scripts
```

Commit both package.json and pnpm-lock.yaml. Never use a branch, `latest`, `^` or `~` as the consumer version policy. Updates are explicit PRs changing the exact version and lockfile, reviewing changed guidance and running consumer verification. They never overwrite project documents automatically.

For local development, use `npm pack` from a reviewed checkout and install the resulting tarball with `pnpm add -D --save-exact /absolute/path/to/ryooooooya-cclauncher-0.1.0.tgz` (adjust the filename for the checkout's version). This records tarball integrity but is a local smoke-test route, not a portable registry dependency.

## Release policy

Use SemVer. Every distributed content change, including guidance-only changes, requires a new version. Never move or reuse an existing release tag. For pre-1.0 releases, breaking behavior increments the minor version; compatible fixes increment patch. Publish stable releases only through `v<package.version>` tags on commits reachable from main.

Future releases use the GitHub Actions workflow. `NPM_PUBLISH_ENABLED=true` enables
its publish job; it does not publish by itself. Keep the variable unset or false
when publication is not intended or the configuration below is incomplete.

Before each public release, the owner must:
- Confirm access to the npm package under the owner's scope.
- Review changes since the recorded provenance snapshot and any known external inputs; retain the MIT license and all applicable source-specific notices in the release artifact.
- Maintain npm Trusted Publisher for owner `ryooooooya`, repo `CCLauncher`, workflow `release.yml`, environment `npm`, with direct `npm publish` allowed.
- Protect the GitHub `npm` environment with required review and release-tag restrictions.
- Enable the repository variable `NPM_PUBLISH_ENABLED=true` only after configuration is complete.
- Protect main: require PRs, passing `verify` and `webapp-example` checks on up-to-date branches; block force pushes/deletion and restrict bypasses. The current single-maintainer setup does not require a GitHub approval count. High-risk changes still require independent review in a separate context and resolution of review findings before the owner's merge.
- Protect `v*` tags from updates/deletion and restrict their creation to release maintainers.

Repository administration settings are external prerequisites, not enforced merely by this document. See the publication record above for the observed setup and its evidence limits.

Merge reviewed changes, create the matching protected tag, then publish its GitHub Release. The workflow verifies the tagged commit, requires protected main and successful
`verify` / `webapp-example` jobs from the latest main push CI run for exactly that SHA,
and reruns package tests before publishing with OIDC/provenance. Missing, failed,
skipped, cancelled or different-SHA sample results stop publication. The API check is
read-only and fails closed when GitHub evidence cannot be retrieved. Branch protection's
boolean alone does not prove required reviews, tag restrictions or environment settings;
the owner must still configure and verify those controls. It uses no stored npm token.
The owner-operated first publication is complete; subsequent releases must increment
the package version and use a new matching tag. Never paste credentials into issues or source.

Official references (checked 2026-09-09): [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/), [pnpm frozen installs](https://pnpm.io/cli/install).

## Consumer migration

Legacy root guides have been removed after consolidation. Their names are retained
only in the historical [migration record](migration.md). Existing consumer files
are not automatically rewritten or deleted. Preserve project-specific decisions,
install a fixed package, and review any template changes before applying them.
