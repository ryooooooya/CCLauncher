# Blueprint / Printer

This project explicitly adopts the optional method from CCLauncher {{version}}.
Its source is the installed package's dist/methods/blueprint-printer/ directory.
Read its README.md and print.md only when doing this method's work.

Project product/security/architecture decisions remain authoritative. Keep docs/PRODUCT.md
as the product entry point and link completed deck/content-list/stories from it;
do not maintain conflicting copies of the same decision. Method rules apply to
method artifacts and do not remove required baseline project docs or security gates.

Write a deck after the interview using docs/product/_deck-template.md. Create real
stories with docs/product/stories/_template.md; keep slug/new/modify/adopted choices
in those stories. Review adoption as a product decision. Store design overrides
in docs/design/_override.md. Assets copied at init are versioned method scaffolding;
package updates never overwrite them automatically.

Load `cclauncher recipe storybook` before configuring Storybook. Install compatible,
exact dependencies and a test command explicitly. Include src/prototypes stories in
its discovery configuration. Init creates no Storybook runtime, UI components or tokens.
Use synthetic props/args and keep prototype data access disconnected.

To print, ask your agent to follow the installed method's print.md for a specific
slug and optional pattern count. This is a task instruction, not a CLI subcommand.
After adopting a design, copy it into production code, connect data with authorization,
and run project verification. Keep original prototypes as the decision record.
