import { lstatSync, mkdirSync, writeFileSync, openSync, closeSync, unlinkSync, rmdirSync, readdirSync } from 'node:fs';
import { resolve, dirname, parse, relative } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { defaults, choices, featureKeys, validateConfig } from './config.js';
import { readPackaged } from './knowledge.js';

export async function initConfig(options, input = process.stdin, output = process.stdout) {
  const config = defaults();
  for (const key of Object.keys(choices)) if (options[key] !== undefined) config[key] = options[key];
  for (const key of featureKeys) if (options[key] !== undefined) {
    if (!['true', 'false'].includes(options[key])) throw new Error(`${key} must be true or false.`);
    config.features[key] = options[key] === 'true';
  }
  validateConfig(config);
  if (!options.yes) {
    if (!input.isTTY) throw new Error('Non-interactive init requires --yes and explicit options as needed. See --help for defaults.');
    const rl = createInterface({ input, output });
    try {
      for (const [key, values] of Object.entries(choices)) {
        if (options[key] !== undefined) continue;
        const answer = (await rl.question(`${key} (${values.join('/')}) [${config[key]}]: `)).trim();
        if (answer) config[key] = answer;
      }
      for (const key of featureKeys) {
        if (options[key] !== undefined) continue;
        const answer = (await rl.question(`${key} (true/false) [false]: `)).trim();
        if (answer && !['true', 'false'].includes(answer)) throw new Error(`${key} must be true or false.`);
        if (answer) config.features[key] = answer === 'true';
      }
    } finally { rl.close(); }
  }
  return validateConfig(config);
}
function stat(path) {
  try { return lstatSync(path); } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}
function checkParents(path) {
  const parent = dirname(path);
  if (parent !== path) checkParents(parent);
  const info = stat(path);
  if (info && (!info.isDirectory() || info.isSymbolicLink())) throw new Error(`Not a regular directory: ${path}`);
}
export function initialize(dist, manifest, dir, config, example, adapter = 'generic', method) {
  if (!['generic', 'claude', 'codex'].includes(adapter)) throw new Error('Unknown adapter.');
  if (method !== undefined && method !== 'blueprint-printer') throw new Error('Unknown method.');
  dir = resolve(dir);
  checkParents(dir);
  if (example !== undefined) {
    if (example !== 'nextjs-supabase') throw new Error('Unknown example.');
    if (config.framework !== 'nextjs' || config.auth !== 'supabase' || config.database !== 'supabase') throw new Error('Example requires nextjs + supabase auth/database.');
    if (stat(dir) && readdirSync(dir).length) throw new Error('Example requires an empty target directory.');
  }
  const existingPackage = stat(resolve(dir, 'package.json'));
  const values = { ...config, ...config.features, version: manifest.packageVersion };
  const prefixes = ['templates/webapp/'];
  if (example) prefixes.push('templates/examples/nextjs-supabase/');
  const files = new Map();
  for (const prefix of prefixes) {
    for (const path of Object.keys(manifest.files).filter(path => path.startsWith(prefix)).sort()) {
      const target = path.slice(prefix.length).replace(/\.tmpl$/, '');
      if (config.scope !== 'production' && target.startsWith('.github/')) continue;
      if (existingPackage && ['package.json', 'pnpm-lock.yaml'].includes(target)) continue;
      const text = readPackaged(dist, manifest, path).replace(/\{\{([a-zA-Z]+)\}\}/g, (_, key) => {
        if (!Object.hasOwn(values, key) || typeof values[key] === 'object') throw new Error(`Unknown template field: ${key}`);
        return String(values[key]);
      });
      files.set(target, text);
    }
  }
  if (!files.size) throw new Error('No packaged templates found.');
  if (method) {
    const prefix = `methods/${method}/`;
    const mapping = JSON.parse(readPackaged(dist, manifest, `${prefix}scaffold.json`));
    for (const [source, target] of Object.entries(mapping)) {
      if (typeof target !== 'string' || !/^(docs|src)\/[a-zA-Z0-9_./-]+$/.test(target) || target.split('/').includes('..') || files.has(target)) throw new Error('Invalid method target.');
      files.set(target, readPackaged(dist, manifest, prefix + source).replaceAll('{{version}}', manifest.packageVersion));
    }
  }
  if (adapter === 'claude') files.set('CLAUDE.md', readPackaged(dist, manifest, 'adapters/claude/CLAUDE.md'));
  files.set('LICENSE.cclauncher', `CCLauncher scaffolding notice\n\nThis notice applies to material supplied by CCLauncher ${manifest.packageVersion},\nincluding selected adapters, example and method scaffolding. It does not license\nthe rest of this application or third-party dependencies. Retain this notice\nwith copies or substantial portions of the CCLauncher material.\n\n${readPackaged(dist, manifest, 'LICENSE')}`);
  files.set('.cclauncher.json', JSON.stringify(config, null, 2) + '\n');
  if (config.database === 'supabase') files.set('supabase/tests/database/README.md', '# Database security tests\n\nAdd pgTAP SQL tests for grants and RLS under this directory.\nRun against a disposable local database with migrations applied:\n\n    pnpm exec supabase test db\n\nUse anon / authenticated user A / user B and test allow and deny for every exposed table operation.\nThis README is not an executable test.\n');
  // Preflight every path before the first write. No force/overwrite option.
  for (const name of files.keys()) {
    const path = resolve(dir, name);
    if (relative(dir, path).startsWith('..')) throw new Error('Invalid template target.');
    checkParents(dirname(path));
    if (stat(path)) throw new Error(`Refusing to overwrite: ${path}`);
  }
  const createdFiles = [], createdDirs = [];
  function ensureDir(path) {
    if (stat(path)) { checkParents(path); return; }
    if (parse(path).root !== path) ensureDir(dirname(path));
    mkdirSync(path);
    createdDirs.push(path);
  }
  try {
    for (const [name, content] of files) {
      const path = resolve(dir, name);
      ensureDir(dirname(path));
      const fd = openSync(path, 'wx', name.endsWith('.sh') ? 0o755 : 0o644);
      createdFiles.push(path);
      try { writeFileSync(fd, content); } finally { closeSync(fd); }
    }
  } catch (error) {
    const remaining = [];
    for (const [paths, remove] of [[createdFiles, unlinkSync], [createdDirs, rmdirSync]]) {
      for (const path of paths.reverse()) {
        try { remove(path); }
        catch (cleanupError) {
          if (cleanupError.code !== 'ENOENT') remaining.push(`${path} (${cleanupError.code || 'cleanup failed'})`);
        }
      }
    }
    if (remaining.length) throw new Error(`${error.message}\nCleanup incomplete; paths could not be removed:\n${remaining.map(path => `- ${path}`).join('\n')}\nInspect these paths and remove only failed initialization output before retrying; existing project files must be preserved.`, { cause: error });
    throw error;
  }
  return [...files.keys()].sort();
}
