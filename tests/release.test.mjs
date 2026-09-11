import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

test('release requires matching tag, checkout and main ancestry', () => {
  const temp = mkdtempSync(resolve(tmpdir(), 'cclauncher-release-'));
  const git = (...args) => execFileSync('git', args, { cwd: temp, stdio: 'pipe' });
  try {
    mkdirSync(resolve(temp, 'scripts'));
    copyFileSync(new URL('../scripts/check-release.mjs', import.meta.url), resolve(temp, 'scripts/check-release.mjs'));
    writeFileSync(resolve(temp, 'package.json'), JSON.stringify({ version: '0.1.0' }));
    git('init', '-b', 'main');
    git('config', 'user.name', 'Test');
    git('config', 'user.email', 'test@example.invalid');
    git('add', '.');
    git('commit', '-m', 'fixture');
    git('update-ref', 'refs/remotes/origin/main', 'HEAD');
    git('tag', 'v0.1.0');
    const check = tag => spawnSync(process.execPath, ['scripts/check-release.mjs'], {
      cwd: temp, env: { ...process.env, RELEASE_TAG: tag }
    }).status;
    assert.equal(check('v0.1.0'), 0);
    assert.notEqual(check('v0.2.0'), 0);
    git('commit', '--allow-empty', '-m', 'not on origin/main');
    assert.notEqual(check('v0.1.0'), 0);
    git('tag', '-f', 'v0.1.0');
    assert.notEqual(check('v0.1.0'), 0);
  } finally { rmSync(temp, { recursive: true, force: true }); }
});


test('publish gate requires both successful jobs on the exact main commit', async () => {
  const { requiredCI } = await import('../scripts/check-ci.mjs');
  const sha = 'a'.repeat(40);
  const run = { head_sha: sha, event: 'push', head_branch: 'main', status: 'completed', conclusion: 'success' };
  const jobs = ['verify', 'webapp-example'].map(name => ({ name, head_sha: sha, status: 'completed', conclusion: 'success' }));
  assert.doesNotThrow(() => requiredCI([run], jobs, sha));
  assert.throws(() => requiredCI([], [], sha));
  assert.throws(() => requiredCI([run], jobs.slice(0, 1), sha));
  for (const conclusion of ['failure', 'skipped', 'cancelled', null]) {
    assert.throws(() => requiredCI([{ ...run, conclusion }], jobs, sha));
    assert.throws(() => requiredCI([run], [jobs[0], { ...jobs[1], conclusion }], sha));
  }
  assert.throws(() => requiredCI([{ ...run, head_sha: 'b'.repeat(40) }], jobs, sha));
  assert.throws(() => requiredCI([run], [jobs[0], { ...jobs[1], head_sha: 'b'.repeat(40) }], sha));
  assert.throws(() => requiredCI([{ ...run, event: 'pull_request' }], jobs, sha));
});
