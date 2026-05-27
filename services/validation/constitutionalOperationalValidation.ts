export enum ConstitutionalValidationState {
  PENDING = "PENDING",
  VALIDATING = "VALIDATING",
  PASSED = "PASSED",
  WARNING = "WARNING",
  FAILED = "FAILED",
  CONTAINED = "CONTAINED",
  ESCALATED = "ESCALATED",
  DISPUTED = "DISPUTED",
}

export enum ConstitutionalValidationSeverity {
  LOW = "LOW",
  MODERATE = "MODERATE",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
  EXISTENTIAL = "EXISTENTIAL",
}

export type ConstitutionalValidationResult = {
  validationId: string;
  validationState: string;
  severity: string;
  constitutionalSafe: boolean;
  survivabilitySafe: boolean;
  autonomySafe: boolean;
  governanceIntegrity: number;
  containmentIntegrity: number;
  operationalStability: number;
  failures: string[];
  warnings: string[];
  disputedSystems: string[];
  rollbackRequired: boolean;
  containmentRequired: boolean;
  escalationRequired: boolean;
  immutableAuditVerified: boolean;
};

function clamp(value: number) {
  return Number(Math.max(0.05, Math.min(1, value)).toFixed(4));
}

export function validateConstitutionalOperation(input: {
  sovereigntyState: string;
  constitutionalIntegrity: number;
  governanceReliability: number;
  containmentIntegrity: number;
  operationalStability: number;
  immutableAuditVerified: boolean;
  autonomyRisk: number;
  disputedSystems: string[];
  createdAt: number;
}) : ConstitutionalValidationResult {
  const failures = [
    ...(input.immutableAuditVerified ? [] : ["immutable_audit_verification_failed"]),
    ...(input.constitutionalIntegrity < 0.55 ? ["constitutional_integrity_below_threshold"] : []),
    ...(input.containmentIntegrity < 0.55 ? ["containment_integrity_below_threshold"] : []),
    ...(input.disputedSystems.length > 0 ? ["disputed_systems_present"] : []),
  ];
  const warnings = [
    ...(input.governanceReliability < 0.7 ? ["governance_reliability_declining"] : []),
    ...(input.operationalStability < 0.7 ? ["operational_stability_declining"] : []),
  ];
  const containmentRequired = failures.length > 0 || ["EMERGENCY_CONTAINMENT", "CIVILIZATION_LOCKDOWN"].includes(input.sovereigntyState);
  const severity =
    input.autonomyRisk >= 0.85 || input.sovereigntyState === "CIVILIZATION_LOCKDOWN" ? ConstitutionalValidationSeverity.EXISTENTIAL
    : containmentRequired ? ConstitutionalValidationSeverity.CRITICAL
    : warnings.length > 0 ? ConstitutionalValidationSeverity.MODERATE
    : ConstitutionalValidationSeverity.LOW;
  const validationState =
    input.disputedSystems.length > 0 ? ConstitutionalValidationState.DISPUTED
    : containmentRequired ? ConstitutionalValidationState.FAILED
    : warnings.length > 0 ? ConstitutionalValidationState.WARNING
    : ConstitutionalValidationState.PASSED;

  return {
    validationId: `constitutional-validation:${input.createdAt}`,
    validationState,
    severity,
    constitutionalSafe: failures.length === 0,
    survivabilitySafe: clamp((input.constitutionalIntegrity * 0.5) + (input.operationalStability * 0.5)) >= 0.6,
    autonomySafe: input.autonomyRisk < 0.7,
    governanceIntegrity: clamp(input.governanceReliability),
    containmentIntegrity: clamp(input.containmentIntegrity),
    operationalStability: clamp(input.operationalStability),
    failures,
    warnings,
    disputedSystems: input.disputedSystems,
    rollbackRequired: containmentRequired,
    containmentRequired,
    escalationRequired: containmentRequired || input.governanceReliability < 0.55,
    immutableAuditVerified: input.immutableAuditVerified,
  };
}
