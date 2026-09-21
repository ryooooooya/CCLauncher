# Automation decisions

Prefer automated verification of concrete failure modes with an owner and a response path.
The package CI checks distribution and a real webapp boundary; consumer CI must be
adapted to the service's actual dependencies, data and deployment environment.

Dependency update PRs, secret scanning, service availability checks, budget alerts and
backup/restore drills are candidates based on actual project risk. Evaluate current
provider capabilities and costs when adopting them. Do not add maintenance traffic
merely to evade service plan restrictions or describe build success as security coverage.

Use [dependencies](../../standards/dependencies.md), [operations](../../recipes/operations.md)
and [workflow](../../standards/workflow.md) as the shared sources. Record ownership,
alert destination, remediation and verification in project runbooks. Automated merges
and publication still require the project's review and release policy.

## Template dependency review

The owner reviews the **Template dependency review** workflow every week in
[GitHub Actions](https://github.com/ryooooooya/CCLauncher/actions/workflows/dependency-review.yml).
It runs on Mondays at 00:23 UTC (09:23 JST), and supports **Run workflow** for an
immediate check after merging its first configuration or when investigating an update.
Scheduled runs may be delayed; a missing run is not evidence of current dependencies.

| Target | Update discovery |
|---|---|
| Repository GitHub Actions and root npm manifest | Existing weekly Dependabot configuration |
| `templates/webapp` | Weekly/manual pnpm candidate report |
| `templates/examples/nextjs-supabase` | Weekly/manual pnpm candidate report |

As checked on 2026-09-21, GitHub's [Dependabot support table](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference#package-ecosystem)
lists pnpm through v10. These templates pin pnpm 11.19.0, so nested Dependabot
configuration alone is not treated as working update coverage. The workflow uses
the pinned pnpm version, frozen installs with dependency lifecycle scripts disabled,
and [pnpm outdated](https://pnpm.io/cli/outdated) for both templates. It needs only
read access to repository contents, with no publishing credentials or repository writes.

Open each job's summary/log to see current, wanted and latest versions and deprecation
flags. Valid candidates leave the job green; green means discovery succeeded, not
that all dependencies are current or safe. A failed install, registry lookup, malformed
report or timeout fails the job; fix that failure and rerun before concluding the check.
The report covers direct dependencies, not a complete transitive vulnerability audit.
Existing example CI continues to run `pnpm audit --audit-level=high`.

For a local check from the repository root (Node 24 and pnpm 11.19.0):

```sh
pnpm --dir templates/webapp install --frozen-lockfile --ignore-scripts
node scripts/check-template-dependencies.mjs templates/webapp
pnpm --dir templates/examples/nextjs-supabase install --frozen-lockfile --ignore-scripts
node scripts/check-template-dependencies.mjs templates/examples/nextjs-supabase
```

Handle candidates in small reviewed PRs:

1. Read official release/migration notes. Prioritize security fixes; do not blindly
   adopt the newest major version (for example, Node type definitions should match
   the supported runtime). Consider React/React DOM and their types together.
2. Update exact versions and the corresponding pnpm lockfile with the pinned pnpm.
   Check both templates when they share a tool; document intentional differences.
   Review version-specific exceptions in pnpm-workspace.yaml instead of broadening them.
3. Confirm frozen installation in each changed template, run repository `pnpm verify`,
   and require both `verify` and `webapp-example` CI checks. The latter exercises the
   generated example and its runner guards, DB and HTTPS browser tests. It does not
   independently exercise every version in the generic template: if a shared runner
   differs, test its guards with that template's installed tools as well.
4. Obtain independent review for security-sensitive behavior changes, then merge
   and follow the [release policy](../distribution.md#release-policy) separately.
   Existing consumer projects adopt new versions and template changes explicitly.

This workflow does not upgrade packages, open PRs, merge or publish. Node/pnpm pins,
embedded consumer workflow action pins, and changes to guidance still require
maintainer review; the registry report does not refresh recipe verification dates.
Reassess Dependabot's pnpm support before replacing these reports with automatic
template update PRs, and verify a real manifest/lockfile update through CI first.

## Monthly knowledge review

Use the [monthly review procedure](knowledge-review.md) and the **Monthly knowledge
review** issue template to review official sources, project feedback and verification
dates. This is a manual monthly review, separate from the automated weekly dependency
report. Record evidence and follow-up PRs; do not advance dates just to clear warnings.
