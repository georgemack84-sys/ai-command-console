import { ConstitutionalValidationSeverity, ConstitutionalValidationState, type ConstitutionalValidationResult } from "./constitutionalOperationalValidation";

export function validateSovereigntySurvivability(input: {
  survivabilityConfidence: number;
  governanceReliability: number;
  containmentIntegrity: number;
  operationalStability: number;
  disputedSystems: string[];
  immutableAuditVerified: boolean;
  createdAt: number;
}) : ConstitutionalValidationResult {
  const failures = [
    ...(input.immutableAuditVerified ? [] : ["immutable_audit_verification_failed"]),
    ...(input.disputedSystems.length > 0 ? ["disputed_systems_present"] : []),
    ...(input.survivabilityConfidence < 0.55 ? ["survivability_confidence_below_threshold"] : []),
  ];
  return {
    validationId: `survivability-validation:${input.createdAt}`,
    validationState: failures.length > 0 ? ConstitutionalValidationState.FAILED : ConstitutionalValidationState.PASSED,
    severity: input.survivabilityConfidence < 0.4 ? ConstitutionalValidationSeverity.CRITICAL : ConstitutionalValidationSeverity.MODERATE,
    constitutionalSafe: failures.length === 0,
    survivabilitySafe: input.survivabilityConfidence >= 0.55 && input.containmentIntegrity >= 0.55,
    autonomySafe: true,
    governanceIntegrity: input.governanceReliability,
    containmentIntegrity: input.containmentIntegrity,
    operationalStability: input.operationalStability,
    failures,
    warnings: [],
    disputedSystems: input.disputedSystems,
    rollbackRequired: false,
    containmentRequired: input.containmentIntegrity < 0.55 || input.disputedSystems.length > 0,
    escalationRequired: input.governanceReliability < 0.55,
    immutableAuditVerified: input.immutableAuditVerified,
  };
}
