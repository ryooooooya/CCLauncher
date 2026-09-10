# CCLauncher architecture

Issue #2 defines the boundaries of the new package. This is a maintainer document; it is not copied into consumer projects.

## Sources and responsibilities

| Path | Owns | Does not own |
|---|---|---|
| `standards/` | Framework-independent principles: security, dependencies, testing, privacy, workflow | Tool setup, project-specific decisions |
| `recipes/` | Technology-specific guidance, examples and verification references | Always-loaded instructions, copies of standards |
| `templates/` | Minimal files generated in a consumer: project docs, tests, scripts, CI | Bundles of generic guidance |
| `adapters/` | Agent/tool-specific configuration and entry points | A second copy of core policy or model selection |
| `methods/` | Optional development methodologies and their assets | Required webapp baseline |
| `src/cli/` | Deterministic init, recipe, context and doctor commands | LLM execution, summarization or routing |
| `manifest.json` | Explicit inventory for versioned package content | Discovery from mutable network sources |
| `docs/` | Maintainer architecture, migration and distribution decisions | Consumer product or security specifications |

Directory README files are maintainer navigation, not recipes or generated consumer files. The migration map assigns future paths; a destination in that map does not imply that its content is implemented.

## Runtime boundary

Core policy describes responsibilities as Planner, Implementer, Reviewer and Verifier. It never selects a model or assumes a particular agent runtime. External runners assign actual implementations to those roles. Verification runs commands and tests; an agent's self-assessment cannot substitute for their results.

Generic core consists of standards, recipes, templates and CLI code. Provider-specific agent instructions belong in adapters; optional methods use role names and link to adapters for tool integration. Technology names in recipes describe the application stack, not an agent requirement.

A consumer uses AGENTS.md as a small shared index, and owns its PRODUCT.md, ARCHITECTURE.md and SECURITY.md. Those project documents record service-specific decisions. Generic guidance remains inside the installed package and is loaded only for relevant tasks. An adapter points to the common index instead of generating or copying its rules.

For task decisions, follow the current user instruction and project-specific documents, then AGENTS.md and relevant package guidance. Report conflicts that would weaken a security boundary rather than silently applying them. These are project conventions, not overrides of the host runtime's instruction hierarchy.

## Blueprint / Printer

The destination is `methods/blueprint-printer/`, with `blueprint/` and `printer/` subdirectories. Blueprint describes product intent; Printer holds reusable design assets and the print method. Projects opt into this methodology. Default webapp initialization will not install it or require Storybook because it exists in the package.

Issue #8 migrates these files together and updates internal references. Domain logic is preserved where possible; model assignments and execution-tool configuration move to adapters.

## Staged coexistence

- Legacy root documents and `printer/` remain migration sources until their replacement is reviewed. Do not copy their full content into the new directories merely to populate them.
- New architecture and [distribution policy](distribution.md) govern the new package. Legacy generation and raw-main retrieval instructions do not govern its implementation.
- Each content migration updates references and the [migration map](migration.md); avoid maintaining two normative copies. Issue #9 removes obsolete files after replacement verification.
- Issue #2 adds directory contracts and the migration map only. Standards, recipes, template generation, adapters and methods are implemented in Issues #3–#8.
- Issue #5 implements knowledge packaging with explicit manifest entries and context selectors. The build validates metadata and section references; unknown or malformed entries fail.
- Tarballs contain the CLI modules, emitted inventory, selected standards/recipes, agent adapters and webapp scaffold templates, plus package metadata and root README. Maintainer indexes and legacy knowledge files are excluded. See [CLI behavior](cli.md).
- npm publication remains deferred. Future MIT application follows the third-party-content review agreed in the distribution policy.
