# Claude integration

Use [the thin CLAUDE entry point](CLAUDE.md) and [runtime security notes](security.md).
Shared project policy belongs in AGENTS.md; task-specific knowledge stays in the package.

Optional commands, skills and tool integrations belong to the host runtime. Consult
its current authoring instructions and review extension permissions before installing.
Keep the entry point short and refer to task-specific detail only when needed.
Do not auto-install third-party plugins, duplicate generic security policy in extensions,
or make the core workflow depend on an extension. The old universal skill-generation
prompt is retired; the package does not provide a skill generator or model router.
