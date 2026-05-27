export type EnforcementState =
  | "EXECUTION_ALLOWED"
  | "EXECUTION_SUPPRESSED"
  | "CONSTITUTIONAL_DENIAL"
  | "GOVERNANCE_RESTRICTED"
  | "CONTAINMENT_ACTIVE"
  | "ESCALATION_LOCKED"
  | "EMERGENCY_LOCK_ACTIVE"
  | "DISPUTE_BLOCKED"
  | "AMBIGUOUS_GOVERNANCE"
  | "UNSAFE_AUTONOMY_BLOCKED"
  | "RUNTIME_BOUNDARY_VIOLATION"
  | "FAIL_CLOSED";

export function suppressExecution(input: {
  blockedReasons: string[];
  containmentApplied: boolean;
  escalationTriggered: boolean;
  emergencyLockActive: boolean;
  executableCandidate: boolean;
}) {
  const blockedReasons = Array.from(new Set(input.blockedReasons)).sort();
  let enforcementState: EnforcementState = "EXECUTION_ALLOWED";

  if (input.emergencyLockActive) {
    enforcementState = "EMERGENCY_LOCK_ACTIVE";
  } else if (blockedReasons.includes("disputed_truth_blocks_execution")) {
    enforcementState = "DISPUTE_BLOCKED";
  } else if (blockedReasons.includes("constitutional_denial_active")) {
    enforcementState = "CONSTITUTIONAL_DENIAL";
  } else if (blockedReasons.includes("ambiguous_or_locked_governance")) {
    enforcementState = "AMBIGUOUS_GOVERNANCE";
  } else if (blockedReasons.includes("supervision_state_blocks_execution")) {
    enforcementState = "UNSAFE_AUTONOMY_BLOCKED";
  } else if (input.containmentApplied) {
    enforcementState = "CONTAINMENT_ACTIVE";
  } else if (blockedReasons.includes("missing_escalation_lineage")) {
    enforcementState = "ESCALATION_LOCKED";
  } else if (blockedReasons.length > 0) {
    enforcementState = "EXECUTION_SUPPRESSED";
  }

  if (blockedReasons.includes("immutable_audit_unavailable")) {
    enforcementState = "FAIL_CLOSED";
  }

  const executable = input.executableCandidate
    && blockedReasons.length === 0
    && input.containmentApplied === false
    && input.emergencyLockActive === false;

  return {
    executable,
    enforcementState,
    blockedReasons,
    suppressed: executable === false,
  };
}
