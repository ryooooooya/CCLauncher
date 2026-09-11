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
