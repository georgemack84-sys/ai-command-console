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

export type BranchReplayType =
  | "HISTORICAL_REPLAY"
  | "COMPARATIVE_REPLAY"
  | "LINEAGE_REPLAY";

export type BranchReplayStatus =
  | "PASS"
  | "LIMIT_SCOPE"
  | "ESCALATE"
  | "FREEZE";

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

export interface ReplayRequest {
  simulationId: string;
  contractId: string;
  replayReferenceIds: readonly string[];
  replayDepth: number;
  branchIds: readonly string[];
  riskCertificationReference: string;
  replayType: BranchReplayType;
}

export interface ReplayResult {
  replayId: string;
  simulationId: string;
  replayType: BranchReplayType;
  replayStatus: BranchReplayStatus;
  replayHash: string;
  deterministicHash: string;
  reconstructedBranches: readonly string[];
  replayLineageHash: string;
  branchCount: number;
  replayDepth: number;
  escalationReason?: string;
}

export type BranchReplayReasonCode =
  | "SEALED_CONTRACT_VALID"
  | "SEALED_CONTRACT_MISSING"
  | "CONTRACT_EXECUTION_AUTHORITY_BLOCKED"
  | "CONTRACT_RUNTIME_MUTATION_BLOCKED"
  | "RISK_CERTIFICATION_VALID"
  | "RISK_CERTIFICATION_MISSING"
  | "RISK_CERTIFICATION_MISMATCH"
  | "REPLAY_DEPTH_LIMITED"
  | "BRANCH_COUNT_LIMITED"
  | "CROSS_TENANT_REPLAY_BLOCKED"
  | "BRANCH_SCOPE_VALID"
  | "BRANCH_SCOPE_INVALID"
  | "RECURSIVE_REPLAY_BLOCKED"
  | "NESTED_REPLAY_BLOCKED"
  | "BRANCH_GENERATION_BLOCKED"
  | "REPLAY_GROWTH_BLOCKED"
  | "LINEAGE_REFERENCE_MISSING"
  | "REPLAY_IS_NOT_EXECUTION"
  | "AUTHORITY_BOUNDARY_PRESERVED";

export type BranchReplayInput = Readonly<{
  request: ReplayRequest;
  sealedContract?: SealedSimulationBoundaryRecord;
  tenantId: string;
  lineageReferenceIds: readonly string[];
  nestedReplay?: boolean;
  recursiveReplay?: boolean;
  generatedBranchIds?: readonly string[];
}>;

export type BranchReplayValidation = Readonly<{
  replayStatus: BranchReplayStatus;
  reasonCodes: readonly BranchReplayReasonCode[];
  branchCount: number;
  replayDepth: number;
  escalationState: "NONE" | "ESCALATE" | "FREEZE" | "LIMIT_SCOPE";
  deterministic: true;
  readOnly: true;
  authorityBounded: boolean;
  executionImpossible: boolean;
}>;

export type BranchReplayObservability = Readonly<{
  replayId: string;
  replayType: BranchReplayType;
  replayDepth: number;
  branchCount: number;
  replayHash: string;
  replayStatus: BranchReplayStatus;
  escalationState: "NONE" | "ESCALATE" | "FREEZE" | "LIMIT_SCOPE";
}>;

export type SealedBranchReplayRecord = Readonly<{
  result: Readonly<ReplayResult>;
  validation: BranchReplayValidation;
  observability: BranchReplayObservability;
  sealed: true;
  readOnly: true;
  advisoryOnly: true;
  executionAuthorized: false;
  runtimeMutationAllowed: false;
  schedulingAllowed: false;
  authorityMutationAllowed: false;
  persistenceAllowed: false;
  branchGenerationAllowed: false;
}>;
