# Blueprint / Printer

Optional methodology for turning product intent into reviewable UI alternatives.
Blueprint owns what to build; Printer owns reusable design assets. The shared harness
supplies workflow, security and verification. This method does not replace those gates.

## Opt in

Run `cclauncher init --yes --method blueprint-printer` using the installed exact package.
The ordinary init does not create product stories, design specs or src/prototypes.
The optional flag adds only the explicit files in scaffold.json, preflighting all
collisions. It does not install dependencies or generate product decisions.
For existing projects, initialize a temporary directory with the same profile and
review the method files before bringing them into your project. Do not overwrite decisions.

The package includes this directory offline under dist/methods/blueprint-printer/.
Read docs/BLUEPRINT-PRINTER.md in the initialized project for the adoption record and steps.
Generic standards/recipes remain in the package. The copied files are the explicitly
selected method's working templates and asset rules; they are not an always-on baseline.

## Sources

- [Document rules](blueprint/docs-rules.md): ownership and reference direction.
- [Deck template](blueprint/deck-template.md): product interview and priorities.
- [Story rules](blueprint/stories-rules.md) and [template](blueprint/stories-template.md): context, behavior, new/modify, slug and adoption.
- [Printer](printer/README.md): tokens, UI and layout asset specifications and overrides.
- [Print](print.md): multiple real-component alternatives, adopted-file protection and promotion by copying.

Storybook setup and testing belong to `cclauncher recipe storybook`. UX, accessibility,
motion and performance use their corresponding recipes only when needed. Agent-specific
entry points belong to adapters; print.md is an agent-independent task instruction.

No component implementations or complete Storybook application are included. Original
methodology logic is retained; tool-specific commands and mutable URL distribution are retired.
