import assert from 'node:assert/strict';

import { validateWeek2Qualification } from './week-2-qualification-policy.mjs';

const valid = {
  packageJson:
    '"validate:ui-foundation" "validate:components" "validate:shell" "validate:overlays" "validate:route-states" "validate:week-2"',
  repositoryCommands: 'validate week-2',
  browserQualification: '320px 200% 1024 portal pageerror focus-visible',
  qualificationRecord:
    '## Qualification result CONDITIONALLY_QUALIFIED\n## Responsive matrix\n## Keyboard matrix\n## Dependency inventory\n## CI evidence\n## Manual attestation\n## Popover',
  accessibilityEvidence: 'GP-24 2026-08-14',
  accessibilityExceptions: 'W2-A11Y-002 human review 2026-08-05 Expired',
  dependencies: '@radix-ui/react-dialog',
};
const fixtures = [
  [
    'missing inherited gate',
    { packageJson: valid.packageJson.replace('"validate:overlays"', '') },
    'missing inherited validate:overlays',
  ],
  [
    'missing scale evidence',
    { browserQualification: valid.browserQualification.replace('200%', '') },
    '200% text-scale',
  ],
  [
    'untruthful qualification',
    {
      qualificationRecord: valid.qualificationRecord.replace(
        'CONDITIONALLY_QUALIFIED',
        'QUALIFIED',
      ),
    },
    'must not overstate',
  ],
  [
    'hidden expired exception',
    { accessibilityExceptions: 'W2-A11Y-002 renewed' },
    'expired human-review exception',
  ],
  [
    'parallel UI dependency',
    { dependencies: '@radix-ui/react-dialog styled-components' },
    'parallel UI dependency',
  ],
];

for (const [name, change, expected] of fixtures) {
  const errors = validateWeek2Qualification({ ...valid, ...change });
  assert.ok(
    errors.some((error) => error.includes(expected)),
    `${name} did not fail with ${expected}: ${errors.join('; ')}`,
  );
}
console.log(
  `Week 2 controlled failures: PASS (${fixtures.length} rejected fixtures)`,
);
