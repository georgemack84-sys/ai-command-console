import { spawnSync } from 'node:child_process';
const fixtures = [
  'direct-fetch.ts',
  'window-fetch.ts',
  'xhr.ts',
  'send-beacon.ts',
  'axios-import.ts',
  'dynamic-import.ts',
];
for (const fixture of fixtures) {
  const path = `tests/architecture/fixtures/transport-failing/${fixture}`;
  const result = spawnSync(
    process.execPath,
    ['scripts/validate-transport-boundary.mjs', `--path=${path}`],
    { encoding: 'utf8' },
  );
  if (result.status === 0) {
    console.error(`Expected ${path} to fail transport governance.`);
    process.exit(1);
  }
}
console.log('Expected transport-boundary violations were detected.');
