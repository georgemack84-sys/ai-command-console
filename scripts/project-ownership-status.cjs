#!/usr/bin/env node

const { spawnSync } = require('node:child_process');
const { classifyPath } = require('./project-ownership-policy.cjs');

const result = spawnSync('git', ['status', '--porcelain'], { encoding: 'utf8' });
if (result.status !== 0) process.exit(result.status ?? 1);
const entries = result.stdout.split(/\r?\n/).filter(Boolean).map((line) => line.slice(3));
if (!entries.length) {
  console.log('Project ownership status: working tree clean');
  process.exit(0);
}
const groups = new Map();
for (const path of entries) {
  const owner = classifyPath(path);
  groups.set(owner, [...(groups.get(owner) ?? []), path]);
}
for (const [owner, paths] of [...groups.entries()].sort(([left], [right]) => left.localeCompare(right))) {
  console.log(`${owner}: ${paths.length}`);
  for (const path of paths) console.log(`  ${path}`);
}
