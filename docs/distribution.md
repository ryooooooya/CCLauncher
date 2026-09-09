# Versioned distribution

Phase 1 introduces the package `@ryooooooya/cclauncher` at `0.1.0`. The personal scope avoids assuming ownership of the proposed `@cclauncher` organization. npm scope ownership and the initial publication have **not** been configured or verified. This repository has no license grant; `UNLICENSED` preserves that status pending the owner's license decision.

## Reproducibility

Node 24 and pnpm 11.19.0 are the development baseline. There are no external build or runtime dependencies in this skeleton. The CLI is plain ESM JavaScript; `tsconfig.json` prepares module settings for later TypeScript work, but Phase 1 does not claim TypeScript type checking.

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm verify
npm pack
```

`dist/` is regenerated from source. The emitted manifest records the package version and SHA-256 of the CLI. It is an inventory, not an independent trust anchor. Package integrity comes from the consumer lockfile and release provenance. Source manifest entries remain empty until knowledge packaging is implemented in Phase 2; the build rejects nonempty entries to prevent silently omitting assets.

The package allowlist excludes legacy documents, source, tests and maintainer files. There is no network access or installation hook in the CLI. Phase 1 implements only help/version; it cannot initialize a webapp yet.

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

Before the first public release, the owner must:
- Confirm npm scope ownership and choose a license.
- Set up the initial package and npm Trusted Publisher for owner `ryooooooya`, repo `CCLauncher`, workflow `release.yml`, environment `npm`.
- Protect the GitHub `npm` environment with required review and release-tag restrictions.
- Enable the repository variable `NPM_PUBLISH_ENABLED=true` only after configuration is complete.
- Protect main: require PRs, independent approval, passing `verify` check, resolved conversations; block force pushes/deletion and restrict bypasses.
- Protect `v*` tags from updates/deletion and restrict their creation to release maintainers.

Repository administration settings are external prerequisites, not enforced merely by this document. Main was unprotected when Phase 1 was prepared.

Merge reviewed changes, create the matching protected tag, then publish its GitHub Release. The workflow verifies the tagged commit and reruns package tests before publishing with OIDC/provenance. It uses no stored npm token. Initial package registration may require an owner-operated authenticated first publish; never paste credentials into issues or source.

Official references (checked 2026-09-09): [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/), [pnpm frozen installs](https://pnpm.io/cli/install).

## Migration boundary

Legacy `base_*`, framework and Blueprint/Printer documents remain in Git for existing projects. Their automatic generation and raw-main retrieval rules apply only to that legacy system and are not the new package architecture. Do not bootstrap new projects from those raw-main instructions. Later issues migrate knowledge, implement CLI commands and templates, then remove the legacy distribution.
