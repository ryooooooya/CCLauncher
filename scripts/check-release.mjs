import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const tag = process.env.RELEASE_TAG;
if (!/^\d+\.\d+\.\d+$/.test(version) || tag !== 'v' + version) {
  throw new Error('Release tag must exactly match stable package version');
}
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const commit = git('rev-parse', '--verify', 'refs/tags/' + tag + '^{commit}');
if (commit !== git('rev-parse', 'HEAD')) throw new Error('Checkout must match release tag');
git('merge-base', '--is-ancestor', commit, 'origin/main');
