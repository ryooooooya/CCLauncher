# Versioned distribution

The package is `@ryooooooya/cclauncher` at `0.1.0`. The personal scope avoids assuming ownership of the proposed `@cclauncher` organization. npm scope ownership and the initial publication have **not** been configured or verified. The owner approved a future MIT release on 2026-09-09. npm publication is deferred while the harness is developed and used locally. Before applying MIT, review existing documents and code excerpts for third-party licensing and attribution requirements; preserve required notices and exclude or replace incompatible material. Until that review is complete, retain `UNLICENSED` and do not add an MIT license grant.

The [2026-09-11 provenance inventory](licensing/README.md) records the inspected source/package snapshot and an unresolved withAI origin question for the retained Blueprint/Printer material. MIT application remains pending that clarification; the inventory does not certify ownership.

## Reproducibility

Node 24 and pnpm 11.19.0 are the development baseline. There are no external build or runtime dependencies in the CLI. The CLI is plain ESM JavaScript. Its build checks syntax and package structure; behavioral tests verify the CLI. The generated webapp separately runs TypeScript checks.

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm verify
npm pack
```

`dist/` is regenerated from source. The emitted manifest records the package version and SHA-256 of every CLI module, selected knowledge file and scaffold template. It is an inventory, not an independent trust anchor. Package integrity comes from the consumer lockfile and release provenance. Knowledge entries, metadata validation and context selection are explicit. See [architecture](architecture.md) and [CLI](cli.md).

The package allowlist excludes legacy documents, source, tests and maintainer files. There is no network access or installation hook in the CLI. The CLI implements init / recipe / context / doctor. Init generates project scaffolding and supports an explicit runnable Next.js/Supabase example.

After a reviewed release is actually published:

```sh
pnpm add -D --save-exact @ryooooooya/cclauncher@0.1.0
pnpm exec cclauncher --version
pnpm install --frozen-lockfile --ignore-scripts
```

Commit both package.json and pnpm-lock.yaml. Never use a branch, `latest`, `^` or `~` as the consumer version policy. Updates are explicit PRs changing the exact version and lockfile, reviewing changed guidance and running consumer verification. They never overwrite project documents automatically.

Until npm publication, use `npm pack` from a reviewed checkout and install the resulting tarball with `pnpm add -D --save-exact /absolute/path/to/ryooooooya-cclauncher-0.1.0.tgz`. This records tarball integrity but is a local smoke-test route, not a portable registry dependency.

## Release policy

Use SemVer. Every distributed content change, including guidance-only changes, requires a new version. Never move or reuse an existing release tag. For pre-1.0 releases, breaking behavior increments the minor version; compatible fixes increment patch. Publish stable releases only through `v<package.version>` tags on commits reachable from main.

Public npm publication is a separate milestone. Keep `NPM_PUBLISH_ENABLED` unset or false until publication is requested and the prerequisites below are complete.

Before the first public release, the owner must:
- Confirm npm scope ownership.
- Complete the third-party content review, add the approved MIT license and required attribution, and update package metadata.
- Set up the initial package and npm Trusted Publisher for owner `ryooooooya`, repo `CCLauncher`, workflow `release.yml`, environment `npm`.
- Protect the GitHub `npm` environment with required review and release-tag restrictions.
- Enable the repository variable `NPM_PUBLISH_ENABLED=true` only after configuration is complete.
- Protect main: require PRs, independent approval, passing `verify` and `webapp-example` checks, resolved conversations; block force pushes/deletion and restrict bypasses.
- Protect `v*` tags from updates/deletion and restrict their creation to release maintainers.

Repository administration settings are external prerequisites, not enforced merely by this document. Main was unprotected when Phase 1 was prepared.

Merge reviewed changes, create the matching protected tag, then publish its GitHub Release. The workflow verifies the tagged commit and reruns package tests before publishing with OIDC/provenance. It uses no stored npm token. Initial package registration may require an owner-operated authenticated first publish; never paste credentials into issues or source.

Official references (checked 2026-09-09): [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/), [pnpm frozen installs](https://pnpm.io/cli/install).

## Consumer migration

Legacy root guides have been removed after consolidation. Their names are retained
only in the historical [migration record](migration.md). Existing consumer files
are not automatically rewritten or deleted. Preserve project-specific decisions,
install a fixed package, and review any template changes before applying them.
