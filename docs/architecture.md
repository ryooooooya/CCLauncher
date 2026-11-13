# CCLauncher architecture

This document defines the package boundaries. This is a maintainer document; it is not copied into consumer projects.

## Sources and responsibilities

| Path | Owns | Does not own |
|---|---|---|
| `standards/` | Framework-independent principles: security, dependencies, testing, privacy, workflow | Tool setup, project-specific decisions |
| `recipes/` | Technology-specific guidance, examples and verification references | Always-loaded instructions, copies of standards |
| `templates/` | Minimal files generated in a consumer: project docs, tests, scripts, CI | Bundles of generic guidance |
| `adapters/` | Agent/tool-specific configuration and entry points | A second copy of core policy or model selection |
| `src/cli/` | Deterministic init, recipe, context and doctor commands | LLM execution, summarization or routing |
| `manifest.json` | Explicit inventory for versioned package content | Discovery from mutable network sources |
| `docs/` | Maintainer architecture, migration and distribution decisions | Consumer product or security specifications |

Directory README files are maintainer navigation, not recipes or generated consumer files. The migration record lists former paths and their current replacements.

## Runtime boundary

Core policy describes responsibilities as Planner, Implementer, Reviewer and Verifier. It never selects a model or assumes a particular agent runtime. External runners assign actual implementations to those roles. Verification runs commands and tests; an agent's self-assessment cannot substitute for their results.

Generic core consists of standards, recipes, templates and CLI code. Provider-specific agent instructions belong in adapters. Technology names in recipes describe the application stack, not an agent requirement.

A consumer uses AGENTS.md as a small shared index, and owns its PRODUCT.md, ARCHITECTURE.md and SECURITY.md. Those project documents record service-specific decisions. Generic guidance remains inside the installed package and is loaded only for relevant tasks. An adapter points to the common index instead of generating or copying its rules.

For task decisions, follow the current user instruction and project-specific documents, then AGENTS.md and relevant package guidance. Report conflicts that would weaken a security boundary rather than silently applying them. When project documents and existing code disagree on a choice the task requires, the agent stops and asks (or, unattended, finishes as incomplete with the disagreement listed) rather than picking a side or rewriting existing code; neither source is assumed to be the stale one. These are project conventions, not overrides of the host runtime's instruction hierarchy.

## Distribution and ownership

The CLI, manifest-selected standards/recipes, adapters and
webapp templates are bundled into a versioned tarball. Maintainer indexes remain
repository navigation. Build validates metadata, section references and content hashes.

Legacy root guides and their distribution mechanism have been removed. Existing
consumer projects are unaffected; package updates never rewrite their local decisions.
See [migration](migration.md) for the historical inventory and [CLI](cli.md) for behavior.

CCLauncher uses the [MIT license](../LICENSE), with a retained notice in generated
scaffolding. Version 0.1.0 is published on npm; see [distribution](distribution.md).
