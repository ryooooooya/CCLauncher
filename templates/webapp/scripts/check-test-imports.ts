import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";

// Keep test declarations on the guarded API; assertions and type imports are fine.
export function checkTestImports(
  directory: string,
  guard = resolve(directory, "required-test.ts"),
) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      checkTestImports(path, guard);
      continue;
    }
    if (path === guard || !/\.[cm]?[jt]sx?$/.test(path)) continue;
    const source = ts.createSourceFile(
      path,
      readFileSync(path, "utf8"),
      ts.ScriptTarget.Latest,
      true,
    );
    function visit(node: ts.Node) {
      if (
        ts.isStringLiteral(node) &&
        ["@playwright/test", "playwright/test"].includes(node.text)
      ) {
        const parent = node.parent;
        const clause = ts.isImportDeclaration(parent)
          ? parent.importClause
          : undefined;
        const bindings = clause?.namedBindings;
        const safe =
          clause?.isTypeOnly ||
          (clause &&
            !clause.name &&
            bindings &&
            ts.isNamedImports(bindings) &&
            bindings.elements.every(
              (item) =>
                item.isTypeOnly ||
                ["expect", "request"].includes(
                  (item.propertyName || item.name).text,
                ),
            ));
        if (!safe)
          throw new Error(
            `${path}: import test from tests/required-test instead of the unguarded Playwright API`,
          );
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
}
