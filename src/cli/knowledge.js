import { readFileSync, realpathSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, relative, isAbsolute } from 'node:path';

export const digest = bytes => createHash('sha256').update(bytes).digest('hex');
export function packagedPath(dist, path) {
  if (typeof path !== 'string' || !/^[a-zA-Z0-9_.\/\[\]-]+$/.test(path) || path.split('/').some(x => !x || x === '.' || x === '..') || isAbsolute(path)) throw new Error('Invalid packaged path.');
  const file = realpathSync(resolve(dist, path));
  const rel = relative(realpathSync(dist), file);
  if (rel.startsWith('..') || isAbsolute(rel)) throw new Error('Packaged path escapes package.');
  return file;
}
export function readPackaged(dist, manifest, path) {
  const bytes = readFileSync(packagedPath(dist, path));
  if (manifest.files[path] !== digest(bytes)) throw new Error(`Package integrity mismatch: ${path}`);
  return bytes.toString('utf8');
}
export function sectionsOf(source, wanted) {
  if (!wanted) return source;
  // Only top-level H2 headings outside fenced blocks are section boundaries.
  const lines = source.split('\n');
  let fence = null;
  const starts = [];
  for (let i = 0; i < lines.length; i++) {
    const f = lines[i].match(/^(`{3,}|~{3,})/);
    if (f) {
      if (!fence) fence = f[1];
      else if (f[1][0] === fence[0] && f[1].length >= fence.length) fence = null;
      continue;
    }
    if (!fence && lines[i].startsWith('## ')) starts.push({ index: i, heading: lines[i].slice(3).trim() });
  }
  for (const heading of wanted) {
    if (starts.filter(s => s.heading === heading).length !== 1) throw new Error(`Missing or ambiguous section: ${heading}`);
  }
  const result = [];
  for (let i = 0; i < starts.length; i++) {
    if (wanted.includes(starts[i].heading)) result.push(lines.slice(starts[i].index, starts[i + 1]?.index ?? lines.length).join('\n').trimEnd());
  }
  return result.join('\n\n') + '\n';
}
export function recipe(dist, manifest, id) {
  const entry = manifest.entries.find(e => e.kind === 'recipe' && e.id === id);
  if (!entry) throw new Error(`Unknown recipe: ${id}`);
  return readPackaged(dist, manifest, entry.path);
}
export function context(dist, manifest, config, topic) {
  if (!Object.hasOwn(manifest.contexts, topic)) throw new Error(`Unknown topic: ${topic}`);
  const rules = manifest.contexts[topic].filter(rule => Object.entries(rule.when ?? {}).every(([key, values]) => values.includes(config[key])));
  const output = [`# CCLauncher ${manifest.packageVersion}: context ${topic}\n\nProject-specific docs and the current user instruction take precedence. These are packaged references, not verification results.\n`];
  const seen = new Set();
  for (const rule of rules) {
    const entry = manifest.entries.find(e => e.id === rule.id);
    if (!entry) throw new Error(`Invalid context entry: ${rule.id}`);
    const key = JSON.stringify([entry.id, rule.sections]);
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(`Source: ${entry.path} (verified ${entry.verified})\n\n` + sectionsOf(readPackaged(dist, manifest, entry.path), rule.sections));
  }
  if (seen.size === 0) output.push('No applicable knowledge for the configured stack.\n');
  return output.join('\n---\n\n');
}
