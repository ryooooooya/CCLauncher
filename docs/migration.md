# Migration record

The staged migration tracked in Issues #1–#9 replaces the legacy document-distribution
system. This table is a historical inventory of removed/moved sources; source names
are not active paths or bootstrap instructions. Destinations below are implemented,
except REMOVE entries which deliberately have no replacement mechanism.

PRs: #10 (foundation), #13 (architecture), #14 (standards), #15 (recipes),
#16 (CLI), #17 (webapp), #18 (adapters), #19 (methodology). Issue #9 removes the
remaining root guides and finalizes current documentation. Git history retains originals.

| Legacy source | Destination / disposition | Issue | Migration action |
|---|---|---|---|
| `base_security_code.md` | `standards/web-security.md`; `recipes/nextjs.md (quality)` | #3 / #4 | Split security boundaries from code quality; remove generic self-built auth examples. |
| `base_security_code_guide.md` | `standards/web-security.md` | #3 / #9 | Merge useful rationale once, then remove the duplicate guide. |
| `base_security_env.md` | `adapters/claude/security.md`; `standards/web-security.md` | #7 / #3 | Separate tool permissions from shared secret/security principles. |
| `base_security_env_setup.md` | `adapters/claude/security.md`; `adapters/codex/README.md`; `templates/webapp/.github/workflows/` | #7 / #6 | Split runtime-specific setup and consumer CI. |
| `base_security_env_guide.md` | `adapters/claude/security.md`; `adapters/codex/README.md` | #7 / #9 | Consolidate rationale with adapter instructions. |
| `base_security_supabase.md` | `recipes/supabase.md` | #4 | Reverify provider guidance; link database tests to the template. |
| `base_security_npm.md` | `standards/dependencies.md`; `recipes/npm-security.md` | #3 / #4 | Separate principles from npm-specific procedure. |
| `base_security_npm_setup.md` | `recipes/npm-security.md`; `templates/webapp/.github/workflows/` | #4 / #6 | Separate guidance and executable CI. |
| `base_security_npm_incident.md` | `recipes/npm-security.md` | #4 / #9 | Consolidate incident procedure without a second policy copy. |
| `base_testing.md` | `standards/testing.md` | #3 | Define unit/integration/E2E/security responsibilities. |
| `base_dev_pipeline.md` | `standards/workflow.md`; `adapters/` | #7 | Use role names in workflow; isolate tool execution settings. |
| `base_codex_review.md` | `adapters/codex/README.md` | #7 | Keep tool-specific review integration outside core. |
| `base_agents_md.md` | `REMOVE`; `replacement: templates/webapp/AGENTS.md` | #7 / #6 / #9 | Retire extraction/inline generation; introduce a maintained shared index. |
| `base_harness.md` | `recipes/nextjs.md`; `templates/webapp/` | #4 / #6 | Separate framework guidance and executable baseline; simplify lint stack. |
| `base_preflight.md` | `src/cli/init.js`; `templates/webapp/docs/SECURITY.md` | #5 / #6 / #9 | Absorb project questions and initial security decisions; omit model selection. |
| `framework_nextjs.md` | `recipes/nextjs.md` | #4 | Reverify framework-specific instructions. |
| `project_bootstrap_guide_nextjs.md` | `REMOVE`; `replacement: src/cli/init.js`; `templates/webapp/` | #5 / #6 / #9 | Replace generated bootstrap prose with deterministic initialization. |
| `base_a11y.md` | `recipes/accessibility.md` | #4 | On-demand accessibility guidance. |
| `base_storybook.md` | `recipes/storybook.md` | #4 | Optional setup, not a mandatory webapp dependency. |
| `base_ui_motion.md` | `recipes/ui-motion.md` | #4 | On-demand UI motion guidance. |
| `base_chrome_devtools.md` | `recipes/browser-debugging.md`; `adapters/` | #4 / #7 | Debugging guidance in recipe; agent-specific tool wiring in adapters. |
| `base_seo.md` | `recipes/seo.md` | #4 | On-demand SEO guidance. |
| `base_performance.md` | `recipes/performance.md` | #4 | Performance budgets and verification. |
| `base_sentry_setup.md` | `recipes/sentry.md` | #4 | Optional monitoring setup. |
| `base_privacy_guide.md` | `standards/privacy.md` | #3 | Shared data-handling principles; verify jurisdiction-specific claims. |
| `base_ops_incident.md` | `recipes/operations.md` | #4 | Operational incident guidance. |
| `base_automation_roadmap.md` | `docs/maintainers/automation.md` | #9 | Maintainer reference, excluded from consumer distribution. |
| `base_claude_md_knowledge.md` | `adapters/claude/security.md` | #7 | Tool-specific instruction loading; point to shared index. |
| `base_skill_md_prompt.md` | `adapters/claude/README.md` | #7 | Retain tool-specific skill authoring as optional integration. |
| `base_ux_audit.md` | `recipes/ux-audit.md`; `adapters/` | #4 / #7 | Generic audit procedure; tool-command installation in adapters. |
| `base_ux_checklist_critical.md` | `recipes/ux-audit.md` | #4 | Consolidate severity sections; do not make all UI guidance always-loaded. |
| `base_ux_checklist_high.md` | `recipes/ux-audit.md` | #4 | Merge into the same on-demand audit reference. |
| `base_ux_checklist_medium.md` | `recipes/ux-audit.md` | #4 | Merge into the same on-demand audit reference. |
| `ui_ux_skills_setup_guide.md` | `recipes/ui-ux-tooling.md`; `adapters/` | #4 / #7 / #9 | Separate tooling options from agent-specific installation; retire legacy guide. |
| `blueprint_docs_rules.md` | `REMOVE` | #8 | Moved in #8; removed with the Blueprint/Printer method (see below). |
| `blueprint_deck_template.md` | `REMOVE` | #8 | Moved in #8; removed with the Blueprint/Printer method (see below). |
| `blueprint_stories_rules.md` | `REMOVE` | #8 | Moved in #8; removed with the Blueprint/Printer method (see below). |
| `blueprint_stories_template.md` | `REMOVE` | #8 | Moved in #8; removed with the Blueprint/Printer method (see below). |
| `printer/README.md` | `REMOVE` | #8 | Moved in #8; removed with the Blueprint/Printer method (see below). |
| `printer/design_rules.md` | `REMOVE` | #8 | Moved in #8; removed with the Blueprint/Printer method (see below). |
| `printer/tokens_rules.md` | `REMOVE` | #8 | Moved in #8; removed with the Blueprint/Printer method (see below). |
| `printer/ui/_template.md` | `REMOVE` | #8 | Moved in #8; removed with the Blueprint/Printer method (see below). |
| `printer/layout/_template.md` | `REMOVE` | #8 | Moved in #8; removed with the Blueprint/Printer method (see below). |
| `base_print.md` | `REMOVE` | #8 / #7 | Moved in #8; removed with the Blueprint/Printer method (see below). |
| `docs/philosophy.md` | `docs/architecture.md` | #2 / #8 / #9 | Architecture contract established in #2; methodology rationale moved in #8 and later removed with the method; obsolete role assumptions removed. |
| `README.md` | `README.md` | #2 / #9 | Add new architecture navigation now; remove legacy-only reference sections last. |


## Removal rationale

- Shared security, privacy, dependency and test policy is consolidated in standards.
- Technical setup lives in recipes; current executable scaffolds and the Supabase
  example live in templates. Old full/summary/setup/incident copies are removed.
- Runtime-specific permissions and task entry points belong to adapters. The old
  AI extraction of shared instructions is retired; AGENTS.md is directly maintained.
- Blueprint/Printer assets were first moved together into `methods/blueprint-printer/`
  as an explicit `init --method` opt-in, then removed (see below).
- Old installation prompts and automatic tool/plugin setup are retired. Tool-specific
  extensions are reviewed using their runtime documentation; they are not core requirements.
- The automation roadmap is reduced to a maintainer decision note, without obsolete
  service prices, quotas or unsupported claims about security coverage.

## Blueprint / Printer removal

`methods/blueprint-printer/`, the `methods/` directory and `init --method` were removed.
The method was optional, unused in practice and outside the harness's scope: design
comparison and per-project development flows are assembled outside CCLauncher.
`init --method` now fails as an unknown option before writing. Projects that already
adopted the method keep their generated docs/product, docs/design and src/prototypes
files; package updates do not touch them. The original files remain in Git history.
The [licensing inventory](licensing/README.md) is a historical snapshot and still
lists the removed paths.

Existing consumers are not modified by this repository cleanup. For their migration,
review project-specific decisions first, use the adapter guide and install a pinned
package; do not delete local rules merely because their old upstream names disappeared.

## Release status

All implemented package flows are covered by CLI/distribution and webapp CI. This does
not certify every recipe integration or replace independent security review.
The [provenance inventory and owner clarification](licensing/README.md) are recorded
and the approved MIT license is applied, including notices in copied scaffolding.
The inventory is not a full dependency legal audit. Version 0.1.0 was published on
npm on 2026-09-21. See the [publication record](distribution.md#publication-record)
for the released commit, administration evidence and pending OIDC execution check.
External protections must remain configured; source documentation alone is not
proof that those settings are enabled. Publication does not approve a consumer's
production deployment.
