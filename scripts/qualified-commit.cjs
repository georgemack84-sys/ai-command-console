#!/usr/bin/env node
const { qualify } = require('./qualified-commit-gate.cjs');
const id = process.argv[2]; if (!id) throw new Error('Usage: npm run qualify:commit -- NURU-CS-####');
const result = qualify(id);
console.log(`${result.qualified ? 'QUALIFIED FOR COMMIT' : 'NOT QUALIFIED FOR COMMIT'}\nChange Set: ${id}`);
if (result.reasons.length) console.log(`Reasons: ${result.reasons.join(', ')}`);
process.exitCode = result.qualified ? 0 : 1;
