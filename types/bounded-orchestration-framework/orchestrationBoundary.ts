export interface BoundedOrchestrationAuthorityContract {
  readonly executionAuthority: false;
  readonly orchestrationAuthority: false;
  readonly dispatchAuthority: false;
  readonly schedulingAuthority: false;
  readonly runtimeMutationAuthority: false;
  readonly governanceMutationAuthority: false;
  readonly approvalInheritance: false;
  readonly authorityInheritance: false;
  readonly autonomousIntervention: false;
  readonly workflowContinuation: false;
}

export type BoundedOrchestrationErrorCode =
  | "ORCHESTRATION_AUTHORITY_EXPANSION"
  | "ORCHESTRATION_BOUNDARY_AUTHORITY_EXPANSION"
  | "ORCHESTRATION_BOUNDARY_HIDDEN_ORCHESTRATION"
  | "ORCHESTRATION_BOUNDARY_RUNTIME_MUTATION"
  | "ORCHESTRATION_BOUNDARY_DYNAMIC_GENERATION"
  | "ORCHESTRATION_BOUNDARY_CONTAINMENT_BYPASS"
  | "ORCHESTRATION_BOUNDARY_REPLAY_AMBIGUITY"
  | "ORCHESTRATION_BOUNDARY_RECURSIVE_DELEGATION"
  | "ORCHESTRATION_BOUNDARY_GOVERNANCE_MISMATCH"
  | "ORCHESTRATION_BOUNDARY_ISOLATION_LEAKAGE"
  | "ORCHESTRATION_BOUNDARY_UNKNOWN_STATE";

export type BoundedOrchestrationError = Readonly<{
  code: BoundedOrchestrationErrorCode;
  message: string;
  path?: string;
}>;
