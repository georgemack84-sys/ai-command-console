import type { RecoveryDashboardReadModel } from "../recovery/verification/recoveryVerificationTypes";

export function validateConstitutionalResilience(dashboard: RecoveryDashboardReadModel) {
  const violations = [
    ...(dashboard.stewardship?.governanceBlocked ? ["governance_enforcement_unverified"] : []),
    ...(dashboard.replayVerificationState === "UNVERIFIABLE" ? ["replay_verification_unverifiable"] : []),
    ...(dashboard.continuityConvergence?.state === "FAILED" ? ["continuity_convergence_failed"] : []),
    ...(dashboard.escalationCoordination?.blocked ? ["escalation_blocked"] : []),
  ];

  return {
    valid: violations.length === 0,
    violations,
  };
}
