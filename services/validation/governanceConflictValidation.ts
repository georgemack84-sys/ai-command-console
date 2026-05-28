import { ConstitutionalValidationSeverity, ConstitutionalValidationState, type ConstitutionalValidationResult } from "./constitutionalOperationalValidation";

export function validateGovernanceConflict(input: {
  governanceDeadlock: boolean;
  freezeConflict: boolean;
  approvalBypassAttempt: boolean;
  disputedOperations: string[];
  immutableAuditVerified: boolean;
  createdAt: number;
}) : ConstitutionalValidationResult {
  const failures = [
    ...(input.governanceDeadlock ? ["governance_deadlock_detected"] : []),
    ...(input.freezeConflict ? ["freeze_conflict_detected"] : []),
    ...(input.approvalBypassAttempt ? ["approval_bypass_attempted"] : []),
    ...(input.immutableAuditVerified ? [] : ["immutable_audit_verification_failed"]),
  ];
  const disputedSystems = input.disputedOperations;
  return {
    validationId: `governance-conflict:${input.createdAt}`,
    validationState: input.governanceDeadlock || disputedSystems.length > 0 ? ConstitutionalValidationState.DISPUTED : ConstitutionalValidationState.PASSED,
    severity: failures.length > 0 ? ConstitutionalValidationSeverity.CRITICAL : ConstitutionalValidationSeverity.LOW,
    constitutionalSafe: failures.length === 0 && disputedSystems.length === 0,
    survivabilitySafe: failures.length === 0,
    autonomySafe: !input.approvalBypassAttempt,
    governanceIntegrity: failures.length > 0 ? 0.35 : 0.82,
    containmentIntegrity: input.freezeConflict ? 0.42 : 0.78,
    operationalStability: input.governanceDeadlock ? 0.4 : 0.76,
    failures,
    warnings: [],
    disputedSystems,
    rollbackRequired: input.freezeConflict,
    containmentRequired: input.freezeConflict || input.governanceDeadlock,
    escalationRequired: input.governanceDeadlock || input.approvalBypassAttempt,
    immutableAuditVerified: input.immutableAuditVerified,
  };
}
