# Agent adapters and maintained instructions

AGENTS.md is an ordinary source file maintained with the project. Init renders a
fixed template once; it does not ask an AI to summarize instructions. Later edits
are made directly and reviewed in git. Never regenerate it from agent-specific files.

## Initialize

```sh
cclauncher init --yes --adapter claude
cclauncher context workflow
```

Use the installed exact package version. `--adapter claude` adds only a root
CLAUDE.md containing `@AGENTS.md`. The default `generic` and explicit `codex` use
AGENTS.md directly and add no agent-specific file. Adapter selection does not enter
.cclauncher.json. No model is selected, downloaded or saved.

All adapters ship inside `dist/adapters/` in the package. Their explanatory docs
remain there. CLI help names supported adapters; unknown values fail before writing.
An existing CLAUDE.md is never overwritten by the Claude adapter: init preflights
all files and fails before writing. Existing projects should migrate manually.

## Existing project migration

1. Read existing project instructions and record project decisions in docs/PRODUCT.md,
   docs/ARCHITECTURE.md and docs/SECURITY.md. Preserve service-specific boundaries.
2. Review a short AGENTS.md index with sources, commands, high-risk gates and Done.
   The packaged template is a starting point, not a policy extraction mechanism.
3. Replace duplicated shared Claude instructions with `@AGENTS.md`; preserve only
   reviewed tool-specific additions. Codex/generic agents read AGENTS.md directly.
4. Retire the old generation command and duplicated rules after checking references.
   Do not flatten rules into AGENTS.md or synchronize shared policy with AI summaries.
5. Run project verification and obtain independent review for security-boundary changes.

The legacy generation specification is removed. Retired root guides are migration
pointers until #9 removes legacy paths; they no longer instruct generation.
Blueprint/Printer behavior migrates separately in #8.

## Roles and evidence

`context workflow` returns the packaged model-independent standard offline.
Planner defines scope/risk; Implementer changes code; Verifier runs commands;
Reviewer diagnoses and reviews from a separate context/instance when required.
Two failures on the same problem should trigger diagnosis, not weaker tests.
No agent runtime, model routing or approval configuration is installed.

High-risk includes auth, authorization, billing, admin, uploads, webhooks, PII,
database permissions, security configuration and secrets. Its independent review
is a gate, not a claim that an agent's own checks constitute another review.
