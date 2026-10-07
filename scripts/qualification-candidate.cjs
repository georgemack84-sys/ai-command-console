const { spawnSync } = require('node:child_process');
const { loadChangeSets } = require('./change-set-policy.cjs');
const { classifyPath, normalize } = require('./project-ownership-policy.cjs');

function matches(path, pattern) {
  const source = `^${pattern.replace(/[|\\{}()[\]^$+?.]/g, '\\$&').replaceAll('**', '\u0000').replaceAll('*', '[^/]*').replaceAll('\u0000', '.*')}$`;
  return new RegExp(source).test(path);
}
function workingPaths() {
  const result = spawnSync('git', ['status', '--porcelain'], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr || 'Unable to inspect Git status.');
  return result.stdout.split(/\r?\n/).filter(Boolean).map((line) => normalize(line.slice(3).replace(/^.* -> /, '')));
}
function candidate(record, paths) {
  const expected = new Set(); const unexpected = []; const unknown = [];
  for (const path of paths) {
    if (record.expectedPaths.some((pattern) => matches(path, pattern))) expected.add(path); else unexpected.push(path);
    if (classifyPath(path) === 'UNKNOWN') unknown.push(path);
  }
  const contamination = unexpected.length + unknown.length;
  const pendingCommands = record.requiredCommands.filter((command) => record.verification?.[command] !== 'PASS');
  return { id: record.id, paths, expected: [...expected], unexpected, unknown, contamination, requiredCommands: record.requiredCommands, pendingCommands, ready: contamination === 0 && pendingCommands.length === 0 };
}
function loadCandidate(id, paths = workingPaths()) {
  const { records } = loadChangeSets(); const record = records.find(({ value }) => value.id === id)?.value;
  if (!record) throw new Error(`Unknown change set: ${id}`);
  return candidate(record, paths);
}
module.exports = { candidate, loadCandidate, matches };
