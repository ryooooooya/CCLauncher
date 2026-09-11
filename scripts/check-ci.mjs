import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export function requiredCI(runs, jobs, sha) {
  const run = runs[0];
  if (!run || run.head_sha !== sha || run.event !== 'push' || run.head_branch !== 'main' || run.status !== 'completed' || run.conclusion !== 'success') throw new Error('Latest main CI must succeed for the publish SHA');
  for (const name of ['verify', 'webapp-example']) {
    const matches = jobs.filter(job => job.name === name);
    if (matches.length !== 1 || matches[0].head_sha !== sha || matches[0].status !== 'completed' || matches[0].conclusion !== 'success') throw new Error(`Missing successful ${name} for the publish SHA`);
  }
}
async function main() {
  const sha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  const repo = process.env.GITHUB_REPOSITORY;
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo || '') || !process.env.GITHUB_TOKEN) throw new Error('GitHub CI verification credentials required');
  async function get(path) {
    const response = await fetch(`https://api.github.com/repos/${repo}/${path}`, { headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' }, signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`GitHub CI verification failed: ${response.status}`);
    return response.json();
  }
  const branch = await get('branches/main');
  if (branch.protected !== true) throw new Error('Main must be protected before publication; verify required review/check settings separately');
  const { workflow_runs: runs } = await get(`actions/workflows/ci.yml/runs?head_sha=${sha}&branch=main&event=push&per_page=1`);
  const jobs = [];
  if (runs[0]) for (let page = 1; ; page++) {
    const result = await get(`actions/runs/${runs[0].id}/attempts/${runs[0].run_attempt}/jobs?per_page=100&page=${page}`);
    jobs.push(...result.jobs);
    if (result.jobs.length < 100) break;
  }
  requiredCI(runs, jobs, sha);
  console.log(`Required main CI succeeded for ${sha}`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
