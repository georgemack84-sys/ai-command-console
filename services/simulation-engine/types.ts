export type SimulationType =
  | "BRANCH_REPLAY"
  | "OUTCOME_PROJECTION"
  | "ALTERNATE_PATH_ANALYSIS";

export interface SimulationBoundaryContract {
  simulationId: string;
  tenantId: string;
  missionId?: string;
  simulationType: SimulationType;
  approvedScope: string[];
  branchLimit: number;
  replayReferenceIds: string[];
  evidenceReferences: string[];
  riskCertificationReference: string;
  approvalReference: string;
  operatorId: string;
  governanceVersion: string;
  createdAt: string;
  contractVersion: string;
  immutableHash: string;
  executionAuthorized: false;
  runtimeMutationAllowed: false;
  schedulingAllowed: false;
  authorityMutationAllowed: false;
  persistenceAllowed: false;
}

export type SimulationBoundaryStatus = "SEALED" | "FREEZE" | "ESCALATE";

export type SimulationBoundaryReasonCode =
  | "SCHEMA_VALID"
  | "SCHEMA_INVALID"
  | "GOVERNANCE_VALID"
  | "GOVERNANCE_INVALID"
  | "RISK_CERTIFICATION_VALID"
  | "RISK_CERTIFICATION_MISSING"
  | "RISK_CERTIFICATION_MISMATCH"
  | "RISK_CERTIFICATION_NOT_PASSING"
  | "APPROVAL_REFERENCE_MISSING"
  | "EXECUTION_AUTHORITY_BLOCKED"
  | "RUNTIME_MUTATION_BLOCKED"
  | "SCHEDULING_BLOCKED"
  | "AUTHORITY_MUTATION_BLOCKED"
  | "PERSISTENCE_BLOCKED"
  | "BRANCH_LIMIT_INVALID"
  | "BRANCH_DEPTH_EXCEEDED"
  | "BRANCH_COUNT_EXCEEDED"
  | "NESTED_SIMULATION_BLOCKED"
  | "RECURSIVE_SIMULATION_BLOCKED"
  | "SELF_GENERATED_BRANCH_BLOCKED"
  | "BOUNDARY_ENFORCED"
  | "IMMUTABLE_HASH_GENERATED"
  | "SIMULATION_IS_NOT_EXECUTION";

export type SimulationBoundaryReplayStatus = "REPLAYABLE" | "FREEZE_REPLAY" | "ESCALATE_REPLAY";

export type SimulationBranchDefinition = Readonly<{
  branchId: string;
  parentBranchId?: string;
  depth: number;
  generatedBySimulation: boolean;
  nestedSimulation: boolean;
}>;

export type SimulationRiskCertificationEvidence = Readonly<{
  certificationState: "PASS" | "CONDITIONAL_PASS" | "FAIL";
  certificationHash: string;
  certificationLineageHash: string;
  replayValidation: boolean;
  containmentState: string;
}>;

export type SimulationBoundaryContractInput = Readonly<{
  simulationId: string;
  tenantId: string;
  missionId?: string;
  simulationType: SimulationType;
  approvedScope: readonly string[];
  branchLimit: number;
  replayReferenceIds: readonly string[];
  evidenceReferences: readonly string[];
  riskCertificationReference: string;
  approvalReference: string;
  operatorId: string;
  governanceVersion: string;
  createdAt: string;
  contractVersion: string;
  branches?: readonly SimulationBranchDefinition[];
  riskCertificationEvidence?: SimulationRiskCertificationEvidence;
  executionAuthorized?: boolean;
  runtimeMutationAllowed?: boolean;
  schedulingAllowed?: boolean;
  authorityMutationAllowed?: boolean;
  persistenceAllowed?: boolean;
}>;

export type SimulationBoundaryValidationResult = Readonly<{
  status: SimulationBoundaryStatus;
  reasonCodes: readonly SimulationBoundaryReasonCode[];
  immutableHash: string;
  replayStatus: SimulationBoundaryReplayStatus;
  escalationState: "NONE" | "ESCALATE" | "FREEZE";
  branchCount: number;
  deterministic: true;
  readOnly: true;
  authorityBounded: boolean;
  executionImpossible: boolean;
}>;

export type SimulationBoundaryReplayRecord = Readonly<{
  simulationId: string;
  tenantId: string;
  contractHash: string;
  replayStatus: SimulationBoundaryReplayStatus;
  replayReferenceIds: readonly string[];
  riskCertificationReference: string;
  governanceVersion: string;
  branchCount: number;
  replayHash: string;
  replayMode: "READ_ONLY";
  executionAuthorized: false;
  runtimeMutationAllowed: false;
}>;

export type SimulationBoundaryObservability = Readonly<{
  simulationId: string;
  simulationType: SimulationType;
  contractVersion: string;
  branchCount: number;
  governanceVersion: string;
  immutableHash: string;
  replayStatus: SimulationBoundaryReplayStatus;
  escalationState: "NONE" | "ESCALATE" | "FREEZE";
}>;

export type SealedSimulationBoundaryRecord = Readonly<{
  contract: Readonly<SimulationBoundaryContract>;
  validation: SimulationBoundaryValidationResult;
  replay: SimulationBoundaryReplayRecord;
  observability: SimulationBoundaryObservability;
  sealed: true;
  readOnly: true;
  advisoryOnly: true;
  executionAuthorized: false;
  runtimeMutationAllowed: false;
  schedulingAllowed: false;
  authorityMutationAllowed: false;
  persistenceAllowed: false;
}>;
