import type { AutonomyReadinessProfile } from "@/types/autonomy-readiness";
import type {
  SafeActionDefinition,
  SafeActionError,
  SafeActionGovernanceEvidence,
  SafeActionReplayEvidence,
  SafeActionRiskClass,
  SafeActionScope,
} from "@/types/safe-action-catalog";

export function validateSafeActionProfile(input: {
  readinessProfile: AutonomyReadinessProfile;
  definition?: SafeActionDefinition;
  riskClass: SafeActionRiskClass;
  scope?: SafeActionScope;
  governanceBinding?: SafeActionGovernanceEvidence;
  replayBinding?: SafeActionReplayEvidence;
  metadata?: Readonly<Record<string, unknown>>;
}): readonly SafeActionError[] {
  const errors: SafeActionError[] = [];

  if (!input.definition) {
    errors.push({
      code: "SAFE_ACTION_UNDEFINED",
      message: "Action capability is undefined and therefore forbidden.",
      path: "actionId",
    });
    return Object.freeze(errors);
  }

  if (input.riskClass === "forbidden") {
    errors.push({
      code: "SAFE_ACTION_RISK_UNKNOWN",
      message: "Unknown or forbidden risk classifications fail closed.",
      path: "riskClass",
    });
  }
  if (!input.governanceBinding?.valid) {
    errors.push({
      code: "SAFE_ACTION_GOVERNANCE_UNBOUND",
      message: "Safe actions require undisputed governance bindings.",
      path: "governanceBinding",
    });
  }
  if (!input.replayBinding?.valid) {
    errors.push({
      code: "SAFE_ACTION_REPLAY_UNBOUND",
      message: "Safe actions require valid replay bindings.",
      path: "replayBinding",
    });
  }
  if (!input.scope || input.scope.snapshotLineageHashes.length === 0) {
    errors.push({
      code: "SAFE_ACTION_SNAPSHOT_UNBOUND",
      message: "Safe actions require immutable snapshot lineage.",
      path: "snapshotLineageHashes",
    });
  }
  if (input.readinessProfile.derivedState === "disputed") {
    errors.push({
      code: "SAFE_ACTION_DISPUTED",
      message: "Disputed readiness may not degrade into safe action authority.",
      path: "derivedState",
    });
  }
  if (input.readinessProfile.derivedState === "forbidden") {
    errors.push({
      code: "SAFE_ACTION_FORBIDDEN",
      message: "Forbidden readiness states may not produce safe actions.",
      path: "derivedState",
    });
  }
  if (!input.scope?.withinAuthorityCeiling) {
    errors.push({
      code: "SAFE_ACTION_AUTHORITY_CEILING_EXCEEDED",
      message: "Safe action scope exceeds the immutable authority ceiling.",
      path: "authorityCeiling",
    });
  }
  if (input.scope && ["denied", "disputed"].includes(input.scope.state)) {
    errors.push({
      code: "SAFE_ACTION_SCOPE_DENIED",
      message: "Safe action scope is denied by constitutional constraints.",
      path: "scope",
    });
  }
  if (input.definition.executionAllowed) {
    errors.push({
      code: "SAFE_ACTION_EXECUTION_FORBIDDEN",
      message: "Execution authority is not available in the safe action catalog.",
      path: "executionAllowed",
    });
  }
  if (input.definition.selfApprovalAllowed) {
    errors.push({
      code: "SAFE_ACTION_SELF_APPROVAL_FORBIDDEN",
      message: "Self-approval is constitutionally forbidden.",
      path: "selfApprovalAllowed",
    });
  }
  if (input.definition.policyMutationAllowed) {
    errors.push({
      code: "SAFE_ACTION_POLICY_MUTATION_FORBIDDEN",
      message: "Policy mutation is forbidden in the safe action catalog.",
      path: "policyMutationAllowed",
    });
  }
  if (input.definition.mutating) {
    errors.push({
      code: "SAFE_ACTION_MUTATION_FORBIDDEN",
      message: "Mutating actions are outside the safe action catalog.",
      path: "mutating",
    });
  }
  if (input.readinessProfile.capabilityDriftDetected) {
    errors.push({
      code: "SAFE_ACTION_CAPABILITY_DRIFT",
      message: "Capability drift invalidates safe action readiness.",
      path: "capabilityDriftDetected",
    });
  }
  if (!input.readinessProfile.replayBinding.deterministic) {
    errors.push({
      code: "SAFE_ACTION_REPLAY_DRIFT",
      message: "Replay determinism is required for safe action derivation.",
      path: "replayBinding",
    });
  }

  const metadata = input.metadata ?? {};
  if ("execute" in metadata || "dispatch" in metadata) {
    errors.push({
      code: "SAFE_ACTION_HIDDEN_EXECUTION_FORBIDDEN",
      message: "Metadata may not smuggle execution or dispatch semantics.",
      path: "metadata",
    });
  }
  if ("pauseAuthority" in metadata) {
    errors.push({
      code: "SAFE_ACTION_FAKE_PAUSE_AUTHORITY",
      message: "Pause request semantics do not imply pause authority.",
      path: "metadata.pauseAuthority",
    });
  }
  if ("approvalGranted" in metadata) {
    errors.push({
      code: "SAFE_ACTION_APPROVAL_MASQUERADE",
      message: "Recommendations and handoffs may not masquerade as approvals.",
      path: "metadata.approvalGranted",
    });
  }

  return Object.freeze(errors);
}
