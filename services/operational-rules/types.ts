export type OperationalRuleSeverity = "WARNING" | "BLOCKING" | "CRITICAL";

export type OperationalEnforcementPoint =
  | "Preflight"
  | "Planner"
  | "Governance"
  | "Execution"
  | "Recovery"
  | "Deployment"
  | "Retry Logic"
  | "Replay"
  | "Monitoring"
  | "Certification";

export type OperationalState =
  | "RUNNING"
  | "WAITING"
  | "BLOCKED"
  | "FAILED"
  | "DISPUTED"
  | "PASSED"
  | "UNKNOWN";

export type FailureClassificationValue =
  | "INFRA_FAILURE"
  | "CODE_FAILURE"
  | "TEST_FAILURE"
  | "ENV_FAILURE"
  | "GOVERNANCE_FAILURE"
  | "UNKNOWN_FAILURE";

export type FailureClassification = {
  classification: FailureClassificationValue;
};

export type OperationalRuleId =
  | "UNKNOWN_UNSAFE"
  | "DISPUTED_NON_DEPLOYABLE"
  | "RETRY_REQUIRES_CLASSIFICATION"
  | "RELEASE_GATE_REQUIRED"
  | "NO_HIDDEN_STATE_MUTATION"
  | "REPLAY_REMAINS_AUTHORITATIVE";

export type OperationalRule = {
  id: OperationalRuleId;
  version: string;
  description: string;
  enforcementPoint: readonly OperationalEnforcementPoint[];
  severity: OperationalRuleSeverity;
  enabled: boolean;
};

export type ViolationEvent = {
  violationId: string;
  ruleId: string;
  workflowId: string;
  actor: string;
  stateBefore: string;
  stateAfter: string;
  timestamp: string;
  evidenceHash: string;
};

export type OperationalReplayEvidence = {
  runtimeHash?: string;
  replayHash?: string;
  replayBundlePresent?: boolean;
};

export type OperationalMutationEvidence = {
  attempted?: boolean;
  visible?: boolean;
  reason?: string;
};

export type OperationalRuleEvaluationInput = {
  workflowId: string;
  actor: string;
  enforcementPoint: OperationalEnforcementPoint;
  stateBefore: OperationalState;
  stateAfter: OperationalState;
  timestamp: string;
  failureClassification?: FailureClassificationValue;
  deployRequested?: boolean;
  retryRequested?: boolean;
  recoveryRequested?: boolean;
  releaseGatePassed?: boolean;
  replay?: OperationalReplayEvidence;
  mutation?: OperationalMutationEvidence;
};

export type OperationalRuleEvaluation = {
  ok: boolean;
  authorityState: OperationalState;
  deployable: boolean;
  retryAllowed: boolean;
  violations: readonly ViolationEvent[];
  evidenceHash: string;
};
