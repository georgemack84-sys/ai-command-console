#!/usr/bin/env node
const { currentSummary } = require('./dirty-tree-intelligence.cjs');
const report = currentSummary();
console.log('WORKING TREE');
console.log(`Entries: ${report.total}`);
console.log(`Source entries: ${report.sourceChanges}`);
for (const [owner, entries] of [...report.groups.entries()].sort(([a], [b]) => a.localeCompare(b))) console.log(`${owner}: ${entries.length}`);
console.log('RISK');
console.log(`Classification closure: ${report.risk}`);
console.log(`Unknown changes: ${report.unknown}`);
