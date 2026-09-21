import test from 'node:test';
import assert from 'node:assert/strict';
import { parseOutdated } from '../scripts/check-template-dependencies.mjs';

const manifest = { devDependencies: { vitest: '5.0.0' } };
const candidate = { vitest: { current: '5.0.0', wanted: '5.0.0', latest: '5.0.1', isDeprecated: false, dependencyType: 'devDependencies' } };
const result = (status, report) => ({ status, stdout: JSON.stringify(report) });

test('dependency review accepts complete candidates without treating exit 1 as an execution error', () => {
  assert.deepEqual(parseOutdated(result(1, candidate), manifest), candidate);
  assert.deepEqual(parseOutdated(result(0, {}), manifest), {});
});

test('dependency review rejects registry/command failures, incomplete installation and contradictory status', () => {
  for (const failure of [
    result(1, {}), result(0, candidate), result(2, candidate),
    { ...result(1, candidate), error: new Error('spawn ENOENT') },
    { ...result(1, candidate), signal: 'SIGTERM' },
    { status: 1, stdout: 'registry unavailable' },
    result(1, { error: { code: 'ERR_PNPM_FETCH_500' } }),
    result(1, []), result(0, null),
    result(1, { vitest: { ...candidate.vitest, current: undefined } }),
    result(1, { vitest: { ...candidate.vitest, latest: undefined } }),
    result(1, { unknown: candidate.vitest }),
  ]) assert.throws(() => parseOutdated(failure, manifest));
});
