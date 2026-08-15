const requirePattern = (errors, source, pattern, message) => {
  if (!pattern.test(source)) errors.push(message);
};

function parseAttestation(errors, source) {
  try {
    return JSON.parse(source);
  } catch {
    errors.push('accessibility attestation must be valid JSON');
    return null;
  }
}

function accessibilityException(source) {
  const row = source
    .split(/\r?\n/)
    .find((line) => /^\|\s*W2-A11Y-002\s*\|/i.test(line));
  if (!row) return null;
  const cells = row
    .split('|')
    .slice(1, -1)
    .map((cell) => cell.trim());
  return { expiry: cells[5], approval: cells[6] };
}

function isIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value ?? '');
}

export function validateWeek2Qualification({
  packageJson,
  repositoryCommands,
  browserQualification,
  qualificationRecord,
  accessibilityEvidence,
  accessibilityExceptions,
  accessibilityAttestation,
  dependencies,
  today = new Date().toISOString().slice(0, 10),
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
    accessibilityEvidence,
    /2026-08-14/,
    'accessibility evidence is not dated for GP-24',
  );
  const attestation = parseAttestation(errors, accessibilityAttestation);
  const exception = accessibilityException(accessibilityExceptions);
  if (attestation) {
    const checks = attestation.checks ?? {};
    const complete = attestation.status === 'completed';
    if (!['pending_human_review', 'completed'].includes(attestation.status))
      errors.push('accessibility attestation has an unknown status');

    if (complete) {
      for (const [field, value] of Object.entries({
        reviewer: attestation.reviewer,
        reviewDate: attestation.reviewDate,
        platform: attestation.platform,
        browser: attestation.browser,
        assistiveTechnology: attestation.assistiveTechnology,
      })) {
        if (typeof value !== 'string' || value.trim() === '')
          errors.push(
            `completed accessibility attestation is missing ${field}`,
          );
      }
      if (!isIsoDate(attestation.reviewDate))
        errors.push(
          'completed accessibility attestation reviewDate must be YYYY-MM-DD',
        );
      if (
        !Array.isArray(attestation.testedSurfaces) ||
        attestation.testedSurfaces.length === 0
      )
        errors.push(
          'completed accessibility attestation must name tested surfaces',
        );
      for (const check of [
        'screenReader',
        'nativeZoom200Percent',
        'visualContrast',
      ]) {
        if (checks[check] !== 'passed')
          errors.push(`completed accessibility attestation must pass ${check}`);
      }
      if (exception)
        errors.push(
          'resolved accessibility attestation must remove W2-A11Y-002',
        );
      requirePattern(
        errors,
        qualificationRecord,
        /## Qualification result[\s\S]*`QUALIFIED`/i,
        'completed human review requires a QUALIFIED result',
      );
    } else {
      if (!exception) errors.push('pending human review requires W2-A11Y-002');
      if (exception && !isIsoDate(exception.expiry))
        errors.push('W2-A11Y-002 expiry must be YYYY-MM-DD');
      const expired =
        exception && isIsoDate(exception.expiry) && exception.expiry < today;
      const expected = expired ? 'BLOCKED' : 'CONDITIONALLY_QUALIFIED';
      requirePattern(
        errors,
        qualificationRecord,
        new RegExp(`## Qualification result[\\s\\S]*${expected}`, 'i'),
        `pending human review with ${expired ? 'an expired' : 'an active'} exception requires a ${expected} result`,
      );
    }
  }

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
