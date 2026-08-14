const requirePattern = (errors, source, pattern, message) => {
  if (!pattern.test(source)) errors.push(message);
};

export function validateWeek2Qualification({
  packageJson,
  repositoryCommands,
  browserQualification,
  qualificationRecord,
  accessibilityEvidence,
  accessibilityExceptions,
  dependencies,
}) {
  const errors = [];

  for (const script of [
    'validate:ui-foundation',
    'validate:components',
    'validate:shell',
    'validate:overlays',
    'validate:route-states',
  ]) {
    requirePattern(
      errors,
      packageJson,
      new RegExp(`"${script.replace(':', '\\:')}"`),
      `missing inherited ${script} gate`,
    );
  }
  requirePattern(
    errors,
    packageJson,
    /"validate:week-2"/,
    'missing aggregate validate:week-2 gate',
  );
  requirePattern(
    errors,
    repositoryCommands,
    /validate week-2/,
    'missing canonical validate week-2 command',
  );

  for (const evidence of [
    ['320', '320px qualification evidence is missing'],
    ['200%', '200% text-scale qualification evidence is missing'],
    ['1024', 'breakpoint-transition qualification evidence is missing'],
    ['portal', 'portal-cleanup qualification evidence is missing'],
    ['pageerror', 'browser error-hygiene qualification evidence is missing'],
    ['focus-visible', 'focus-visibility qualification evidence is missing'],
  ]) {
    requirePattern(
      errors,
      browserQualification,
      new RegExp(evidence[0], 'i'),
      evidence[1],
    );
  }

  for (const section of [
    'Qualification result',
    'Responsive matrix',
    'Keyboard matrix',
    'Dependency inventory',
    'CI evidence',
    'Manual attestation',
    'Popover',
  ]) {
    requirePattern(
      errors,
      qualificationRecord,
      new RegExp(`## ${section}`, 'i'),
      `qualification record is missing the ${section} section`,
    );
  }
  requirePattern(
    errors,
    qualificationRecord,
    /CONDITIONALLY_QUALIFIED/,
    'qualification record must not overstate the current result',
  );
  requirePattern(
    errors,
    accessibilityEvidence,
    /2026-08-14/,
    'accessibility evidence is not dated for GP-24',
  );
  requirePattern(
    errors,
    accessibilityExceptions,
    /W2-A11Y-002[\s\S]*2026-08-05[\s\S]*Expired/i,
    'expired human-review exception must remain visible and unresolved',
  );

  const disallowed = [
    '@mui/',
    '@chakra-ui/',
    'styled-components',
    '@emotion/react',
  ];
  for (const dependency of disallowed) {
    if (dependencies.includes(dependency)) {
      errors.push(`unapproved parallel UI dependency detected: ${dependency}`);
    }
  }

  return errors;
}
