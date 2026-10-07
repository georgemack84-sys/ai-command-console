#!/usr/bin/env node
const { execFileSync } = require('node:child_process');
const { loadChangeSets } = require('./change-set-policy.cjs');

const { records } = loadChangeSets();
const requested = process.argv[2];
const record = requested ? records.find(({ value }) => value.id === requested) : records.find(({ value }) => value.status === 'ACTIVE');
if (!record) throw new Error(`No change set found${requested ? ` for ${requested}` : ' with ACTIVE status'}.`);
const changed = execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim().split(/\r?\n/).filter(Boolean);
console.log(`CHANGE SET ${record.value.id}`);
console.log(`Status: ${record.value.status}`);
console.log(`Purpose: ${record.value.purpose}`);
console.log(`Expected areas: ${record.value.expectedAreas.join(', ')}`);
console.log(`Working-tree entries: ${changed.length}`);
for (const entry of changed) console.log(`  ${entry}`);
