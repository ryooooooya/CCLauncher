import { spawnSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const directories = ['templates/webapp', 'templates/examples/nextjs-supabase'];

// pnpm uses exit 1 for both valid outdated results and execution failures.
// Only accept the pinned command's complete JSON shape and matching exit status.
export function parseOutdated(result, manifest) {
  if (result.error || result.signal || ![0, 1].includes(result.status)) {
    throw new Error('pnpm outdated could not complete', { cause: result.error });
  }
  const report = JSON.parse(result.stdout);
  if (!report || typeof report !== 'object' || Array.isArray(report)) throw new Error('Invalid outdated report');
  const entries = Object.entries(report);
  if (result.status !== (entries.length ? 1 : 0)) throw new Error('Unexpected outdated exit status');
  for (const [name, entry] of entries) {
    if (!entry || !['dependencies', 'devDependencies', 'optionalDependencies'].includes(entry.dependencyType)
      || !Object.hasOwn(manifest[entry.dependencyType] ?? {}, name)
      || ['current', 'wanted', 'latest'].some(key => typeof entry[key] !== 'string' || !entry[key].trim())
      || typeof entry.isDeprecated !== 'boolean') {
      throw new Error(`Incomplete outdated result for ${name}; check frozen installation and registry access`);
    }
  }
  return report;
}

function main() {
  const directory = process.argv[2];
  if (process.argv.length !== 3 || !directories.includes(directory)) throw new Error('Choose a maintained template directory');
  const cwd = fileURLToPath(new URL(`../${directory}/`, import.meta.url));
  const manifest = JSON.parse(readFileSync(new URL(`../${directory}/package.json`, import.meta.url), 'utf8'));
  const result = spawnSync('pnpm', ['outdated', '--format', 'json', '--no-color'], {
    cwd, encoding: 'utf8', timeout: 180000, maxBuffer: 1024 * 1024,
  });
  if (result.stderr) process.stderr.write(result.stderr);
  const report = parseOutdated(result, manifest);
  const count = Object.keys(report).length;
  // Escape Markdown/HTML delimiters in registry-supplied strings for the summary.
  const json = JSON.stringify(report, null, 2).replaceAll('`', '\\u0060').replaceAll('<', '\\u003c').replaceAll('>', '\\u003e');
  const summary = `## ${directory}\n\n${count} package(s) need review (outdated or deprecated).\n\n`
    + 'This is a candidate report, not a vulnerability audit or approval to upgrade.\n\n'
    + '```json\n' + json + '\n```\n';
  console.log(summary);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
