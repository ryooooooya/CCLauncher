#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const { version } = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
const args = process.argv.slice(2);
if (args.length === 1 && ['--version', '-v'].includes(args[0])) {
  console.log(version);
} else if (args.length === 0 || (args.length === 1 && ['--help', '-h'].includes(args[0]))) {
  console.log('CCLauncher ' + version + '\nUsage: cclauncher [--version | --help]\nDistribution skeleton. init, recipe, context and doctor arrive in Phase 3.');
} else {
  console.error('Unsupported command. Run cclauncher --help.');
  process.exitCode = 1;
}
