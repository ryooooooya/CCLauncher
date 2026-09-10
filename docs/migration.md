# Legacy migration map

Every document tracked before the package migration has an entry below. Destinations are planned paths, not links to completed files. Rows remain pending except the architecture contract and README navigation from #2 and the standard/recipe portions listed in the progress sections below. Legacy removal remains #9.

When completing a row, record its implementation PR and update its status here. A multi-destination row requires splitting responsibilities, not copying the same text to each destination. REMOVE means removal only after the replacement is verified in #9.

| Legacy source | Destination / disposition | Issue | Migration action |
|---|---|---|---|
| `base_security_code.md` | `standards/web-security.md`; `recipes/nextjs.md (quality)` | #3 / #4 | Split security boundaries from code quality; remove generic self-built auth examples. |
| `base_security_code_guide.md` | `standards/web-security.md` | #3 / #9 | Merge useful rationale once, then remove the duplicate guide. |
| `base_security_env.md` | `adapters/claude/security.md`; `standards/web-security.md` | #7 / #3 | Separate tool permissions from shared secret/security principles. |
| `base_security_env_setup.md` | `adapters/claude/security.md`; `adapters/codex/security.md`; `templates/webapp/.github/workflows/` | #7 / #6 | Split runtime-specific setup and consumer CI. |
| `base_security_env_guide.md` | `adapters/claude/security.md`; `adapters/codex/security.md` | #7 / #9 | Consolidate rationale with adapter instructions. |
| `base_security_supabase.md` | `recipes/supabase.md` | #4 | Reverify provider guidance; link database tests to the template. |
| `base_security_npm.md` | `standards/dependencies.md`; `recipes/npm-security.md` | #3 / #4 | Separate principles from npm-specific procedure. |
| `base_security_npm_setup.md` | `recipes/npm-security.md`; `templates/webapp/.github/workflows/` | #4 / #6 | Separate guidance and executable CI. |
| `base_security_npm_incident.md` | `recipes/npm-security.md` | #4 / #9 | Consolidate incident procedure without a second policy copy. |
| `base_testing.md` | `standards/testing.md` | #3 | Define unit/integration/E2E/security responsibilities. |
| `base_dev_pipeline.md` | `standards/workflow.md`; `adapters/` | #7 | Use role names in workflow; isolate tool execution settings. |
| `base_codex_review.md` | `adapters/codex/review.md` | #7 | Keep tool-specific review integration outside core. |
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
| `base_claude_md_knowledge.md` | `adapters/claude/instructions.md` | #7 | Tool-specific instruction loading; point to shared index. |
| `base_skill_md_prompt.md` | `adapters/claude/skills.md` | #7 | Retain tool-specific skill authoring as optional integration. |
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

## Package foundation retained

Files introduced by #10 keep their current paths: package.json, pnpm-lock.yaml, .npmrc, .gitignore, tsconfig.json, manifest.json, src/cli/index.js, scripts/, tests/, .github/ and docs/distribution.md. They are the new package foundation, not legacy documents.

The new directory indexes and this migration map are maintainer documentation. They are not entries in the package manifest or consumer templates. Issue #5 replaces the original empty-entry guard with explicit content and selector validation.

The new core does not inherit the legacy rules requiring generated AGENTS.md, full rule inlining, named-model assignment or mutable raw-main retrieval. Existing consumer projects remain untouched during this migration; package updates do not rewrite their decisions.

MIT is the approved future license direction. Content migrations should record provenance and retain required third-party attribution before formal MIT application. npm publication is deferred and does not block these migrations.

## Issue #3 progress

| Source scope | New standard | Remaining work |
|---|---|---|
| base_security_code.md + base_security_code_guide.md: generic security | standards/web-security.md | Framework/quality material in #4; legacy removal #9 |
| base_security_npm.md: generic dependency policy | standards/dependencies.md | npm procedures and incident recipe #4; CI template #6 |
| base_testing.md: test strategy | standards/testing.md | Runner setup in #4 and executable consumer tests #6 |
| base_privacy_guide.md: data-handling principles | standards/privacy.md | Service-specific legal decisions stay in consumer docs; legacy removal #9 |

The four standards are newly written concise policies, with primary references checked on 2026-09-09. They contain no copied third-party code samples. This does not complete the repository-wide provenance/license review. Legacy standalone files remain frozen migration references and carry pointers to their replacements; rules are not synchronized back into them or generated bootstrap documents.

Removed from new generic security: self-built JWT/password examples, mandatory sanitizer for ordinary text rendering, tool-specific review commands, naming/lint/type conventions and unsupported vulnerability statistics. Framework-specific quality/setup content remains assigned to #4; it is not silently treated as migrated. No legal-compliance guarantee is made by the privacy standard.

## Issue #4 progress

| Source scope | New recipe | Remaining work |
|---|---|---|
| framework_nextjs + base_harness + security_code quality | nextjs | Executable webapp harness #6 |
| base_security_supabase | supabase | Runnable consumer DB fixtures/tests #6 |
| New provider alternative | authjs | Provider-specific consumer integration when selected |
| base_security_npm + setup + incident: procedures | npm-security | Consumer CI #6 |
| base_a11y + base_testing: tool-specific verification | accessibility + nextjs + storybook | Executable consumer tests #6 |
| base_storybook / base_ui_motion / base_chrome_devtools | storybook / ui-motion / browser-debugging | Agent tool wiring #7 |
| base_seo / base_performance / base_sentry_setup / base_ops_incident | seo / performance / sentry / operations | Project-specific budgets, credentials and runbooks |
| base_ux_audit + three UX checklists | ux-audit | Agent command wiring #7 |
| ui_ux_skills_setup_guide: tool selection | ui-ux-tooling | Agent integration #7; obsolete installation guide removal #9 |

Implementation: PR #15, branch `codex/issue-4-technology-recipes`. Fourteen concise recipes now have id / verified / applies / topics metadata and primary-source references checked on 2026-09-09. This date records documentation verification, not runtime execution of every integration. Supabase grants/RLS/DB tests, identity APIs, current Next.js lint invocation and reduced lint scope replace the legacy setup assumptions.

Legacy source files stay in place with migration pointers until #9. They are frozen references, not instructions for new consumers. Shared standards remain canonical. Removed from new recipes: unconditional latest-version installers, named-agent commands, default third-party design plugin installation, automatic universal telemetry sampling values, fixed lint stacks and blanket rule-copying. Source references identify provenance; third-party code samples and checklist text were not copied. Repository-wide license review and npm publication remain deferred.

Recipe package inclusion, explicit config/topic mapping, deterministic offline lookup and freshness diagnostics remain #5. This PR does not change package artifacts or manifest entries. Consumer executable integrations remain #6; adapters #7. Guidance is not reported as passing security tests.

## Issue #5 progress

The four CLI commands and explicit package inventory are implemented. Init deterministically renders project docs from maintained templates, preserves existing files, and includes verification scaffolding with fail-on-missing checks. It does not copy generic knowledge or initialize a working framework/auth provider. Recipe returns exact offline content; context selects explicit entries/H2 sections from validated config; doctor reports setup and freshness issues without running or modifying the project.

The preflight questions and initial project-specific security fields now belong to init. Security test runners, application/provider fixtures and full CI setup remain #6; agent adapters and workflow #7; legacy guide removal #9. Tests verify offline installed-tarball operation, deterministic output, input/path safety, preservation, diagnostics and verifier failure propagation. See [CLI guide](cli.md). PR #15 is the stacked dependency until merged.

## Issue #6 progress

PR #17 adds the Biome/TypeScript/Vitest/Playwright harness, actual HTTP security test templates, and the explicit nextjs-supabase example. The example includes managed cookie auth, owner-scoped document operations, migration grants/RLS and pgTAP, local-only synthetic fixtures and full consumer/repository CI. Default initialization preserves existing package manifests; example initialization requires matching stack and an empty directory. CLAUDE.md/agent adapters remain #7. See [webapp template](webapp-template.md).

## Issue #7 implementation

`standards/workflow.md`, packaged adapters and optional init entry points are implemented.
AGENTS.md remains directly maintained after deterministic initialization. The extraction specification is removed; old workflow/review/bootstrap/instruction guides are retired pointers, not active policies. Remaining legacy removal follows in #9.
