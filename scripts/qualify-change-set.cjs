#!/usr/bin/env node
const { loadCandidate } = require('./qualification-candidate.cjs');
const id = process.argv[2];
if (!id) throw new Error('Usage: npm run qualify:change-set -- NURU-CS-####');
const report = loadCandidate(id);
console.log(`QUALIFICATION CANDIDATE\nChange Set: ${report.id}\nFiles: ${report.paths.length}\nExpected files: ${report.expected.length}\nShared or unexpected changes: ${report.unexpected.length}\nUnknown changes: ${report.unknown.length}\nContamination: ${report.contamination}\nPending commands: ${report.pendingCommands.join(', ') || 'none'}\n${report.ready ? 'READY FOR COMMIT' : 'NOT READY FOR COMMIT'}`);
