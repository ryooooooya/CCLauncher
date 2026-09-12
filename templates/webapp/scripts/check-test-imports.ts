import { readdirSync, readFileSync, realpathSync } from "node:fs";
import { builtinModules } from "node:module";
import { dirname, resolve } from "node:path";
import ts from "typescript";

// Follow local test dependencies, including helpers outside tests/ and tsconfig aliases.
// Installed packages and the exact required-test entry point are trusted dependencies.
export function checkTestImports(
  directory: string,
  guard = resolve(directory, "required-test.ts"),
) {
  const visited = new Set<string>();
  const trustedGuard = realpathSync(guard);
  const optionsCache = new Map<string, ts.CompilerOptions>();
  function optionsFor(path: string) {
    const config = ts.findConfigFile(dirname(path), ts.sys.fileExists);
    if (!config)
      return {
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        allowJs: true,
      };
    let options = optionsCache.get(config);
    if (!options) {
      const read = ts.readConfigFile(config, ts.sys.readFile);
      if (read.error)
        throw new Error(`Cannot read test dependency configuration: ${config}`);
      options = ts.parseJsonConfigFileContent(
        read.config,
        ts.sys,
        dirname(config),
      ).options;
      optionsCache.set(config, options);
    }
    return options;
  }
  function inspect(file: string) {
    const path = realpathSync(file);
    if (path === trustedGuard || visited.has(path)) return;
    visited.add(path);
    const source = ts.createSourceFile(
      path,
      readFileSync(path, "utf8"),
      ts.ScriptTarget.Latest,
      true,
    );
    function dependency(specifier: ts.Expression, safePlaywright = false) {
      if (!ts.isStringLiteralLike(specifier))
        throw new Error(
          `${path}: test dependencies require literal module specifiers; computed import/require cannot be checked`,
        );
      const name = specifier.text;
      if (/^(?:@playwright\/test|playwright\/test)(?:\/|$)/.test(name)) {
        if (!safePlaywright)
          throw new Error(
            `${path}: import test from tests/required-test instead of the unguarded Playwright API`,
          );
        return;
      }
      if (name.startsWith("node:") || builtinModules.includes(name)) return;
      const result = ts.resolveModuleName(
        name,
        path,
        optionsFor(path),
        ts.sys,
      ).resolvedModule;
      if (!result)
        throw new Error(`${path}: cannot resolve test dependency ${name}`);
      // Third-party package internals are outside the project's declaration guard.
      if (result.isExternalLibraryImport) return;
      if (/\.d\.[cm]?ts$/.test(result.resolvedFileName))
        throw new Error(
          `${path}: local runtime dependency resolves only to declarations: ${name}`,
        );
      inspect(result.resolvedFileName);
    }
    function visit(node: ts.Node) {
      if (ts.isImportDeclaration(node)) {
        const clause = node.importClause;
        if (clause?.isTypeOnly) return;
        const bindings = clause?.namedBindings;
        if (
          bindings &&
          ts.isNamedImports(bindings) &&
          bindings.elements.length &&
          bindings.elements.every((item) => item.isTypeOnly)
        )
          return;
        const safe = !!(
          clause &&
          !clause.name &&
          bindings &&
          ts.isNamedImports(bindings) &&
          bindings.elements.every(
            (item) =>
              item.isTypeOnly ||
              ["expect", "request"].includes(
                (item.propertyName || item.name).text,
              ),
          )
        );
        dependency(node.moduleSpecifier, safe);
      } else if (
        ts.isExportDeclaration(node) &&
        node.moduleSpecifier &&
        !node.isTypeOnly
      ) {
        dependency(node.moduleSpecifier);
      } else if (
        ts.isImportEqualsDeclaration(node) &&
        !node.isTypeOnly &&
        ts.isExternalModuleReference(node.moduleReference) &&
        node.moduleReference.expression
      ) {
        dependency(node.moduleReference.expression);
      } else if (
        ts.isCallExpression(node) &&
        (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
          (ts.isIdentifier(node.expression) &&
            node.expression.text === "require"))
      ) {
        if (!node.arguments[0])
          throw new Error(`${path}: missing test dependency specifier`);
        dependency(node.arguments[0]);
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
  function walk(path: string) {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      const file = resolve(path, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (/\.[cm]?[jt]sx?$/.test(file)) inspect(file);
    }
  }
  walk(resolve(directory));
}
