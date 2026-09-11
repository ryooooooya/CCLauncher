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
| `blueprint_docs_rules.md` | `methods/blueprint-printer/blueprint/docs-rules.md` | #8 | Preserve methodology rules; update references as one migration. |
| `blueprint_deck_template.md` | `methods/blueprint-printer/blueprint/deck-template.md` | #8 | Retain product interview/template. |
| `blueprint_stories_rules.md` | `methods/blueprint-printer/blueprint/stories-rules.md` | #8 | Retain story ownership and lifecycle. |
| `blueprint_stories_template.md` | `methods/blueprint-printer/blueprint/stories-template.md` | #8 | Retain story template. |
| `printer/README.md` | `methods/blueprint-printer/printer/README.md` | #8 | Retain asset ownership and contribution guidance. |
| `printer/design_rules.md` | `methods/blueprint-printer/printer/design-rules.md` | #8 | Preserve design-asset boundaries. |
| `printer/tokens_rules.md` | `methods/blueprint-printer/printer/tokens-rules.md` | #8 | Preserve CSS source-of-truth principle. |
| `printer/ui/_template.md` | `methods/blueprint-printer/printer/ui/_template.md` | #8 | Retain UI specification template. |
| `printer/layout/_template.md` | `methods/blueprint-printer/printer/layout/_template.md` | #8 | Retain layout specification template. |
| `base_print.md` | `methods/blueprint-printer/print.md`; `adapters/` | #8 / #7 | Method inputs/outputs here; tool-specific command entry in adapters. |
| `docs/philosophy.md` | `docs/architecture.md`; `methods/blueprint-printer/README.md` | #2 / #8 / #9 | Architecture contract established in #2; migrate methodology rationale in #8, remove obsolete role assumptions. |
| `README.md` | `README.md` | #2 / #9 | Add new architecture navigation now; remove legacy-only reference sections last. |


## Removal rationale

- Shared security, privacy, dependency and test policy is consolidated in standards.
- Technical setup lives in recipes; current executable scaffolds and the Supabase
  example live in templates. Old full/summary/setup/incident copies are removed.
- Runtime-specific permissions and task entry points belong to adapters. The old
  AI extraction of shared instructions is retired; AGENTS.md is directly maintained.
- Blueprint/Printer assets were moved together, preserving product/design ownership
  and adoption history. Method adoption is explicit and optional.
- Old installation prompts and automatic tool/plugin setup are retired. Tool-specific
  extensions are reviewed using their runtime documentation; they are not core requirements.
- The automation roadmap is reduced to a maintainer decision note, without obsolete
  service prices, quotas or unsupported claims about security coverage.

Existing consumers are not modified by this repository cleanup. For their migration,
review project-specific decisions first, use the adapter guide and install a pinned
package; do not delete local rules merely because their old upstream names disappeared.

## Remaining release work

All implemented package flows are covered by CLI/distribution and webapp CI. This does
not certify every recipe integration or replace independent security review.
The [provenance inventory and owner clarification](licensing/README.md) are recorded
and the approved MIT license is applied, including notices in copied scaffolding.
The inventory is not a full dependency legal audit. npm publication remains pending.
External branch/tag/environment protections must be verified by the repository owner;
source documentation is not proof that those settings are enabled. See [distribution](distribution.md).
