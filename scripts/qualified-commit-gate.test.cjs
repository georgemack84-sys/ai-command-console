const test=require('node:test'); const assert=require('node:assert/strict'); const {evaluate}=require('./qualified-commit-gate.cjs');
test('fails closed for contamination, pending checks, and secret safety',()=>{const result=evaluate({unexpected:['x'],unknown:[],pendingCommands:['test']},false);assert.equal(result.qualified,false);assert.equal(result.reasons.length,3);});
