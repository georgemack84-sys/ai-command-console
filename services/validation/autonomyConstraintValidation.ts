import { ConstitutionalValidationSeverity, ConstitutionalValidationState, type ConstitutionalValidationResult } from "./constitutionalOperationalValidation";

export function validateAutonomyConstraints(input: {
  autonomyPromotionAllowed: boolean;
  advisoryOnly: boolean;
  approvalRequired: boolean;
  containmentRequired: boolean;
  disputed: boolean;
  createdAt: number;
}) : ConstitutionalValidationResult {
  const warnings = [
    ...(input.autonomyPromotionAllowed ? [] : ["autonomy_promotion_blocked"]),
    ...(input.advisoryOnly ? [] : ["advisory_posture_lost"]),
  ];
  const failures = [
    ...(input.advisoryOnly ? [] : ["autonomy_not_advisory_only"]),
    ...(input.approvalRequired ? ["operator_approval_required"] : []),
    ...(input.disputed ? ["disputed_autonomy_request"] : []),
  ];
  return {
    validationId: `autonomy-constraints:${input.createdAt}`,
    validationState: failures.length > 0 ? ConstitutionalValidationState.FAILED : ConstitutionalValidationState.PASSED,
    severity: failures.length > 0 ? ConstitutionalValidationSeverity.HIGH : ConstitutionalValidationSeverity.LOW,
    constitutionalSafe: failures.length === 0,
    survivabilitySafe: !input.containmentRequired,
    autonomySafe: input.autonomyPromotionAllowed === false && input.advisoryOnly,
    governanceIntegrity: input.approvalRequired ? 0.62 : 0.8,
    containmentIntegrity: input.containmentRequired ? 0.55 : 0.8,
    operationalStability: input.disputed ? 0.44 : 0.78,
    failures,
    warnings,
    disputedSystems: input.disputed ? ["autonomy"] : [],
    rollbackRequired: false,
    containmentRequired: input.containmentRequired,
    escalationRequired: input.disputed,
    immutableAuditVerified: true,
  };
}
