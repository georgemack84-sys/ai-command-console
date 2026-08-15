import assert from 'node:assert/strict';

import { validateWeek2Qualification } from './week-2-qualification-policy.mjs';

const valid = {
  packageJson:
    '"validate:ui-foundation" "validate:components" "validate:shell" "validate:overlays" "validate:route-states" "validate:week-2"',
  repositoryCommands: 'validate week-2',
  browserQualification: '320px 200% 1024 portal pageerror focus-visible',
  qualificationRecord:
    '## Qualification result `BLOCKED`\n## Responsive matrix\n## Keyboard matrix\n## Dependency inventory\n## CI evidence\n## Manual attestation\n## Popover',
  accessibilityEvidence: 'GP-24 2026-08-14',
  accessibilityExceptions:
    '| W2-A11Y-002 | review | impact | mitigation | owner | 2026-08-05 | Expired |',
  accessibilityAttestation: JSON.stringify({
    status: 'pending_human_review',
    checks: {
      screenReader: 'pending',
      nativeZoom200Percent: 'pending',
      visualContrast: 'pending',
    },
  }),
  dependencies: '@radix-ui/react-dialog',
  today: '2026-08-14',
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
        'BLOCKED',
        'QUALIFIED',
      ),
    },
    'requires a BLOCKED result',
  ],
  [
    'missing pending exception',
    { accessibilityExceptions: '' },
    'pending human review requires W2-A11Y-002',
  ],
  [
    'completed review missing reviewer',
    {
      accessibilityAttestation: JSON.stringify({
        status: 'completed',
        reviewDate: '2026-08-14',
        platform: 'Windows',
        browser: 'Chrome',
        assistiveTechnology: 'NVDA',
        testedSurfaces: ['/login'],
        checks: {
          screenReader: 'passed',
          nativeZoom200Percent: 'passed',
          visualContrast: 'passed',
        },
      }),
      accessibilityExceptions: '',
      qualificationRecord: valid.qualificationRecord.replace(
        'BLOCKED',
        'QUALIFIED',
      ),
    },
    'missing reviewer',
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
