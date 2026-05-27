import type {
  AutonomySafetyBoundary,
  ContainmentZone,
  GovernanceSafetyContract,
  RollbackInvariant,
  RollbackSafetyContract,
} from "./execution-safety-types";

const containmentOrder: Record<ContainmentZone, number> = {
  LOCAL_ONLY: 0,
  SANDBOX: 1,
  READ_ONLY: 2,
  NON_PRODUCTION: 3,
  PRODUCTION_RESTRICTED: 4,
  CROSS_TENANT_FORBIDDEN: 5,
};

const autonomyOrder: Record<AutonomySafetyBoundary["maxAutonomyLevel"], number> = {
  none: 0,
  manual_only: 1,
  approval_required: 2,
  supervised: 3,
  bounded_autonomous: 4,
};

export function validateRollbackGovernanceInheritance(
  forwardGovernance: GovernanceSafetyContract,
  rollbackGovernance: GovernanceSafetyContract,
  forwardAutonomy: AutonomySafetyBoundary,
  rollbackAutonomy: AutonomySafetyBoundary,
): {
  governanceInherited: boolean;
  invariants: RollbackInvariant[];
} {
  const invariants: RollbackInvariant[] = [
    {
      code: "ROLLBACK_GOVERNANCE_INHERITED",
      satisfied: rollbackGovernance.requiredApprovals.length >= forwardGovernance.requiredApprovals.length,
      reason: "Rollback approvals must be equal to or stronger than forward approvals.",
    },
    {
      code: "ROLLBACK_CONTAINMENT_PRESERVED",
      satisfied: containmentOrder[rollbackGovernance.containmentZone] >= containmentOrder[forwardGovernance.containmentZone],
      reason: "Rollback containment zone must be equal to or stricter than forward containment.",
    },
    {
      code: "ROLLBACK_AUTONOMY_NOT_ELEVATED",
      satisfied: autonomyOrder[rollbackAutonomy.maxAutonomyLevel] <= autonomyOrder[forwardAutonomy.maxAutonomyLevel],
      reason: "Rollback autonomy cannot exceed forward autonomy permissions.",
    },
  ];

  return {
    governanceInherited: invariants.every((invariant) => invariant.satisfied),
    invariants,
  };
}
