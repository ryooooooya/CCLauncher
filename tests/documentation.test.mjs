import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
function markdown(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(item => {
    const path = resolve(dir, item.name);
    return item.isDirectory() ? markdown(path) : path.endsWith('.md') ? [path] : [];
  });
}
test('current documentation has local targets and no legacy distribution dependencies', () => {
  const removed = /^(?:base_.*|framework_nextjs|project_bootstrap_guide_nextjs|ui_ux_skills_setup_guide)\.md$/;
  assert.deepEqual(readdirSync(root).filter(name => removed.test(name)), []);
  const files = [resolve(root, 'README.md'), ...['docs', 'standards', 'recipes', 'adapters', 'methods'].flatMap(dir => markdown(resolve(root, dir)))];
  for (const path of files) {
    const source = readFileSync(path, 'utf8');
    let fence = null;
    const prose = source.split('\n').filter(line => {
      const marker = line.match(/^\s*(`{3,}|~{3,})/);
      if (marker) {
        if (!fence) fence = marker[1];
        else if (marker[1][0] === fence[0] && marker[1].length >= fence.length) fence = null;
        return false;
      }
      return !fence;
    }).join('\n');
    for (const match of prose.matchAll(/\[[^\]\n]*\]\(([^)\s]+)\)/g)) {
      const target = match[1];
      if (/^(?:[a-z]+:|#)/i.test(target)) continue;
      assert.ok(existsSync(resolve(dirname(path), target.split(/[?#]/)[0])), `${path}: missing ${target}`);
    }
    if (path === resolve(root, 'docs/migration.md')) continue;
    assert.doesNotMatch(source, /\.claude\/docs\/|raw\.githubusercontent\.com\/[^\s]+\/main\/|\bbase_[a-z_]+\.md|\/agents-md|\bnext lint\b/, path);
  }
});
