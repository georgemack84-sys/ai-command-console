const { spawnSync } = require('node:child_process');
const { classifyPath } = require('./project-ownership-policy.cjs');

function parsePorcelain(output) {
  return output.split(/\r?\n/).filter(Boolean).map((line) => ({ status: line.slice(0, 2), path: line.slice(3).replace(/^.* -> /, '') }));
}

function summarize(entries) {
  const groups = new Map();
  for (const entry of entries) {
    const owner = classifyPath(entry.path);
    groups.set(owner, [...(groups.get(owner) ?? []), entry]);
  }
  const unknown = groups.get('UNKNOWN')?.length ?? 0;
  const sourceChanges = [...groups.entries()].filter(([owner]) => !['GENERATED', 'TEMPORARY'].includes(owner)).reduce((count, [, files]) => count + files.length, 0);
  return { groups, total: entries.length, sourceChanges, unknown, risk: unknown ? 'WARN' : 'PASS' };
}

function currentSummary() {
  const result = spawnSync('git', ['status', '--porcelain'], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr || 'Unable to read Git status.');
  return summarize(parsePorcelain(result.stdout));
}

module.exports = { currentSummary, parsePorcelain, summarize };
