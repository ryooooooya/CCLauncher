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
    const config = resolve(fixture, `${runner}.config.mjs`);
    writeFileSync(config, runner === 'vitest'
      ? `export default { test: { include: ['probe.test.ts'], passWithNoTests: false, allowOnly: false, reporters: [${JSON.stringify(reporter)}] } };`
      : `export default { testDir: '.', testMatch: 'probe.test.ts', forbidOnly: true, retries: 0, workers: 1, reporter: [[${JSON.stringify(reporter)}]] };`);
    const binary = resolve(app, runner === 'vitest' ? 'node_modules/vitest/vitest.mjs' : 'node_modules/@playwright/test/cli.js');
    const importLine = runner === 'vitest' ? 'import { test, expect } from "vitest";' : 'import { test, expect } from "@playwright/test";';
    const pass = 'test("executed", () => expect(1).toBe(1));';
    const skipped = 'test.skip("required deny", () => {});';
    const dynamic = runner === 'vitest' ? 'test("conditional", context => context.skip());' : 'test("conditional", () => test.skip(true, "probe"));';
    const todo = runner === 'vitest' ? 'test.todo("required deny");' : 'test.fixme("required deny", () => {});';
    for (const [name, source, success] of [['pass', pass, true], ['skip', skipped, false], ['mixed', pass + skipped, false], ['dynamic', pass + dynamic, false], ['todo', pass + todo, false], ['empty', '', false]]) {
      writeFileSync(resolve(fixture, 'probe.test.ts'), importLine + '\n' + source);
      const report = resolve(fixture, `${runner}-${name}.json`);
      const result = spawnSync(process.execPath, [binary, runner === 'vitest' ? 'run' : 'test', '--config', config], { cwd: fixture, encoding: 'utf8', env: { ...process.env, CCLAUNCHER_TEST_REPORT: report }, timeout: 60000 });
      assert.equal(result.status === 0, success, `${runner} ${name}: ${result.stdout}\n${result.stderr}`);
      if (success) assert.deepEqual(JSON.parse(readFileSync(report)).states, ['passed']);
      console.log(`${runner}: ${name} correctly ${success ? 'accepted' : 'rejected'}`);
    }
  }
} finally { rmSync(fixture, { recursive: true, force: true }); }
