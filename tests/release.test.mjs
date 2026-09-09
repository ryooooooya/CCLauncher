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
