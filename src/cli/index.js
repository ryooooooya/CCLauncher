#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { readConfig, choices, featureKeys } from './config.js';
import { context, recipe } from './knowledge.js';
import { initConfig, initialize } from './init.js';
import { doctor } from './doctor.js';

const dist = fileURLToPath(new URL('../', import.meta.url));
const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
const help = `CCLauncher ${pkg.version}
Usage:
  cclauncher init [--yes] [--dir PATH] [configuration options]
  cclauncher recipe <id>
  cclauncher context <topic> [--dir PATH]
  cclauncher doctor [--dir PATH]
  cclauncher --version | --help

init defaults: scope=production, framework=nextjs, auth=none, database=none,
all features=false. Interactive init asks for each value; --yes accepts defaults.
Options: --scope production|prototype --framework nextjs|none
  --auth none|supabase|authjs --database none|supabase|postgres
  --uploads --billing --admin --pii --webhooks --external-api: each takes true|false.
init creates project docs and verification scaffolding, never overwrites files,
never installs dependencies and never copies generic knowledge into the project.
Configure application checks after init; missing checks fail deliberately.
Topics: auth database dependencies upload webhook billing admin privacy deployment
  testing framework accessibility ui ux performance seo debugging observability operations incident
`;
try {
  const args = process.argv.slice(2);
  if (!args.length || (args.length === 1 && ['--help', '-h'].includes(args[0]))) process.stdout.write(help);
  else if (args.length === 1 && ['--version', '-v'].includes(args[0])) console.log(pkg.version);
  else {
    const command = args.shift();
    if (!['init', 'recipe', 'context', 'doctor'].includes(command)) throw new Error('Unknown command. Run cclauncher --help.');
    const positional = [], options = {};
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (!arg.startsWith('-')) { positional.push(arg); continue; }
      const key = arg === '--external-api' ? 'externalApi' : arg.slice(2);
      const allowed = command === 'init' ? ['yes', 'dir', ...Object.keys(choices), ...featureKeys] : command === 'recipe' ? [] : ['dir'];
      if (!arg.startsWith('--') || !allowed.includes(key) || Object.hasOwn(options, key)) throw new Error(`Unknown or duplicate option: ${arg}`);
      if (key === 'yes') options[key] = true;
      else {
        if (!args[i + 1] || args[i + 1].startsWith('-')) throw new Error(`Missing value: ${arg}`);
        options[key] = args[++i];
      }
    }
    if (positional.length !== (['recipe', 'context'].includes(command) ? 1 : 0)) throw new Error('Incorrect arguments. Run cclauncher --help.');
    const manifest = JSON.parse(readFileSync(resolve(dist, 'manifest.json'), 'utf8'));
    if (manifest.schemaVersion !== 1 || manifest.packageVersion !== pkg.version || manifest.packageName !== pkg.name) throw new Error('Package manifest/version mismatch.');
    const dir = resolve(options.dir ?? process.cwd());
    if (command === 'recipe') process.stdout.write(recipe(dist, manifest, positional[0]));
    if (command === 'context') process.stdout.write(context(dist, manifest, readConfig(dir), positional[0]));
    if (command === 'init') {
      const files = initialize(dist, manifest, dir, await initConfig(options));
      console.log(`Created ${files.length} files in ${dir}:\n${files.join('\n')}\n\nNext: install the exact CCLauncher version, configure application checks and run sh scripts/verify.sh.\nSecurity tests and application setup are not implemented by init.`);
    }
    if (command === 'doctor') {
      const report = doctor(dist, manifest, dir);
      console.log(report.checks.map(c => `${c.status} ${c.label}: ${c.detail}`).join('\n'));
      console.log('Doctor inspects configuration; it does not execute tests or certify security.');
      if (report.failed) process.exitCode = 1;
    }
  }
} catch (error) {
  console.error(`CCLauncher: ${error.message}`);
  process.exitCode = 1;
}
