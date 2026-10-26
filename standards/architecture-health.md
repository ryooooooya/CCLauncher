# Architecture health

Use this standard when adding a feature, changing data flow, refactoring, or fixing a bug that crosses module boundaries. The goal is to prevent locally correct changes from accumulating into a globally complicated system.

## Core rule

Prefer the smallest change that fits the existing architecture. Before introducing a new abstraction, dependency, state store, service, helper, or parallel path, find the existing owner of that responsibility and reuse or deliberately replace it.

Do not optimize for fewer lines alone. Optimize for clear ownership, explicit data flow, low coupling, and changes that remain easy to make.

## Before changing code

1. Read the project architecture and the relevant feature specification.
2. Trace the existing path for the behavior: entry point, state/data owner, business logic, persistence or external boundary, and tests.
3. Identify the authoritative implementation for each responsibility. Search for similar behavior before creating another.
4. State the intended boundary of the change and the behavior that must remain unchanged.

For small copy or styling changes, do not perform an expensive architecture investigation unless the diff reveals a boundary change.

## During implementation

- Keep one clear owner for each piece of business logic and each source of truth.
- Follow the nearest established pattern when it is sound; do not create a second pattern for convenience.
- Keep UI/presentation, domain rules, persistence, and external-service access separated according to the existing project architecture.
- Avoid duplicate state, duplicate transformations, parallel API paths, and wrappers that merely forward calls without enforcing a meaningful policy.
- Do not add a dependency or a general-purpose abstraction for a single local need unless it materially reduces complexity or risk.
- Prefer deleting obsolete paths over keeping old and new implementations alive indefinitely.
- Do not broaden the change just to make the code look uniform. Refactor adjacent code only when needed for correctness or to remove a concrete source of complexity.

## Change-impact review

After implementation, review the diff in the context of the surrounding system, not only the new code.

Ask:

1. Did this create a second place that owns the same rule, state, or data?
2. Did it bypass an established boundary or make dependencies flow in the wrong direction?
3. Did it add a new concept, configuration, dependency, or execution path? What concrete need justifies each one?
4. Did it make a common change require editing more modules, or create hidden coupling between features?
5. Are errors, loading states, authorization, and persistence still handled by the same clear owners?
6. Can the implementation be simpler without making responsibilities ambiguous?
7. Do architecture docs or decision records need updating because a lasting boundary or trade-off changed?

If the answer reveals a real issue, fix it in the current change when the fix is small and safe. Otherwise, report it as a separate follow-up with impact and rationale; do not silently expand scope.

## Verification

- Run the project's normal verification command and the tests relevant to the changed boundary.
- Add regression tests for a bug or behavior that was previously unprotected.
- Prefer enforceable checks (types, lint rules, dependency-boundary tests, schema validation, automated tests) over prose-only instructions where the check is reliable and proportionate.
- A passing test suite is evidence for tested behavior, not proof that the architecture is healthy.
- Do not add brittle complexity metrics or arbitrary file/line limits as a proxy for design quality.

## When to record a decision

Update `docs/ARCHITECTURE.md` when a stable responsibility, dependency direction, or major data flow changes. Add a short decision record only when a choice has meaningful alternatives or future consequences. Do not document every implementation detail or duplicate generic standards in project docs.

## Review output

Report only actionable findings, ordered by impact:

- **Finding:** concrete duplication, boundary leak, coupling, or unnecessary concept.
- **Evidence:** affected files and how the current change causes or worsens it.
- **Impact:** what future change becomes harder or what behavior is at risk.
- **Recommendation:** smallest reasonable correction.
- **Disposition:** fixed now, deferred with rationale, or no finding.

Do not invent findings to fill a checklist. If no actionable issue is found, say so briefly and identify the verification actually run.
