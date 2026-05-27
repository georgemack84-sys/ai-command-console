export function evaluateSurvivabilityConstraints(input: {
  constitutionalIntegrity?: number;
  governanceContinuity?: number;
  auditPreservationConfidence?: number;
  disputed?: boolean;
  freezeActive?: boolean;
}) {
  const blockedReasons = [
    ...(typeof input.constitutionalIntegrity === "number" ? [] : ["constitutional_integrity_missing"]),
    ...(typeof input.governanceContinuity === "number" ? [] : ["governance_continuity_missing"]),
    ...(typeof input.auditPreservationConfidence === "number" ? [] : ["audit_preservation_missing"]),
    ...(input.disputed ? ["disputed_truth_requires_freeze"] : []),
    ...(input.freezeActive ? ["constitutional_freeze_active"] : []),
  ];

  return {
    allowed: blockedReasons.length === 0,
    blockedReasons,
  };
}
