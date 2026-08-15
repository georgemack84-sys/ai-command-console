import { spawnSync } from 'node:child_process';

const environment = {
  ...process.env,
  GP30_SECRET_SENTINEL: 'must-never-appear-in-validation-output',
  NEXT_PUBLIC_APP_NAME: '',
  NEXT_PUBLIC_APP_VERSION: '1.0.0',
  NEXT_PUBLIC_API_BASE_URL: 'https://api.example.test',
  NEXT_PUBLIC_ENVIRONMENT: 'test',
};
const run = spawnSync(
  process.execPath,
  ['--import', 'tsx', 'scripts/validate-environment.mjs'],
  { encoding: 'utf8', env: environment },
);
const output = `${run.stdout}\n${run.stderr}`;
if (
  run.status === 0 ||
  !output.includes('Public environment validation failed') ||
  !output.includes('NEXT_PUBLIC_APP_NAME') ||
  output.includes(environment.GP30_SECRET_SENTINEL)
) {
  console.error(output);
  throw new Error('Invalid configuration did not prevent a production build.');
}
console.log(
  'Invalid configuration prevented the production build as expected.',
);
