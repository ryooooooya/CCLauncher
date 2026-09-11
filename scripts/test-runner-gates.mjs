// Run against the generated application's actual pinned runners, not mock reporters.
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const app = resolve(process.argv[2]);
const fixture = mkdtempSync(resolve(app, '.cc-runner-gate-'));
try {
  writeFileSync(resolve(fixture, 'package.json'), '{"type":"module"}');
  for (const runner of ['vitest', 'playwright']) {
    const reporter = resolve(app, `scripts/${runner}-reporter.mjs`);
    const config = resolve(fixture, `${runner}.config.ts`);
    writeFileSync(config, runner === 'vitest'
      ? `export default { test: { include: ['probe.test.ts'], passWithNoTests: false, allowOnly: false, reporters: [${JSON.stringify(reporter)}] } };`
      : `import { checkTestImports } from ${JSON.stringify(resolve(app, 'scripts/check-test-imports.ts'))}; checkTestImports(${JSON.stringify(fixture)}); export default { testDir: '.', testMatch: 'probe.test.ts', forbidOnly: true, retries: 0, workers: 1, reporter: [[${JSON.stringify(reporter)}]] };`);
    const binary = resolve(app, runner === 'vitest' ? 'node_modules/vitest/vitest.mjs' : 'node_modules/@playwright/test/cli.js');
    const importLine = runner === 'vitest' ? 'import { test, expect, describe } from "vitest";' : 'import { expect } from "@playwright/test";';
    const guardedImport = runner === 'playwright' ? `import { test } from ${JSON.stringify(resolve(app, 'tests/required-test.ts'))};` : '';
    const pass = 'test("executed", () => expect(1).toBe(1));';
    const skipped = 'test.skip("required deny", () => {});';
    const dynamic = runner === 'vitest' ? 'test("conditional", context => context.skip());' : 'test("conditional", () => test.skip(true, "probe"));';
    const todo = runner === 'vitest' ? 'test.todo("required deny");' : 'test.fixme("required deny", () => {});';
    const describe = runner === 'vitest' ? 'describe' : 'test.describe';
    const emptySuite = `${describe}("empty boundary", () => {});`;
    const nestedEmpty = `${describe}("outer", () => { ${emptySuite} });`;
    const nestedPass = `${describe}("outer", () => { ${describe}("inner", () => { ${pass} }); });`;
    for (const [name, source, success] of [['pass', pass, true], ['skip', skipped, false], ['mixed', pass + skipped, false], ['dynamic', pass + dynamic, false], ['todo', pass + todo, false], ['empty', '', false], ['mixed-empty-suite', pass + emptySuite, false], ['nested-empty-suite', pass + nestedEmpty, false], ['nested-pass', nestedPass, true], ['conditional-empty', pass + `${describe}("conditional empty", () => { for (const value of []) { test(String(value), () => {}); } });`, false]]) {
      writeFileSync(resolve(fixture, 'probe.test.ts'), importLine + guardedImport + '\n' + source);
      const report = resolve(fixture, `${runner}-${name}.json`);
      const result = spawnSync(process.execPath, [binary, runner === 'vitest' ? 'run' : 'test', '--config', config], { cwd: fixture, encoding: 'utf8', env: { ...process.env, CCLAUNCHER_TEST_REPORT: report }, timeout: 60000 });
      assert.equal(result.status === 0, success, `${runner} ${name}: ${result.stdout}\n${result.stderr}`);
      if (runner === 'playwright' && name.includes('empty') && name !== 'empty') assert.match(result.stdout + result.stderr, /Required test suite is empty/);
      if (success) assert.deepEqual(JSON.parse(readFileSync(report)).states, ['passed']);
      console.log(`${runner}: ${name} correctly ${success ? 'accepted' : 'rejected'}`);
    }
    if (runner === 'playwright') {
      for (const [source, success] of [
        ['const custom = test.extend({}); custom.describe.serial("serial", () => custom("extended", () => {}));', true],
        ['test.describe.configure({ mode: "parallel" }); test.describe.parallel("parallel", () => test("registered", () => {}));', true],
        [pass + 'test.describe.skip("empty skipped", () => {});', false],
        [pass + 'const custom = test.extend({}); custom.describe("empty extended", () => {});', false],
      ]) {
        writeFileSync(resolve(fixture, 'probe.test.ts'), importLine + guardedImport + source);
        const result = spawnSync(process.execPath, [binary, 'test', '--config', config], { cwd: fixture, encoding: 'utf8' });
        assert.equal(result.status === 0, success, result.stdout + result.stderr);
        if (!success) assert.match(result.stdout + result.stderr, /Required test suite is empty/);
      }
      console.log('playwright: four describe/extend cases correctly handled');
      for (const source of [
        'import { test } from "@playwright/test"; test("raw", () => {});',
        'import * as pw from "@playwright/test"; pw.test("raw", () => {});',
        'const { test } = require("@playwright/test"); test("raw", () => {});',
      ]) {
        writeFileSync(resolve(fixture, 'probe.test.ts'), source);
        const result = spawnSync(process.execPath, [binary, 'test', '--config', config], { cwd: fixture, encoding: 'utf8' });
        assert.notEqual(result.status, 0);
        assert.match(result.stdout + result.stderr, /unguarded Playwright API/);
      }
      console.log('playwright: three unguarded imports correctly rejected');
    }
  }
} finally { rmSync(fixture, { recursive: true, force: true }); }
