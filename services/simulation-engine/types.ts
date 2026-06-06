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

export type SimulationSandboxLifecycleStep =
  | "CREATE_SANDBOX"
  | "VALIDATE_CONTRACT"
  | "VALIDATE_REPLAY"
  | "ISOLATE_CONTEXT"
  | "GENERATE_HASH"
  | "SEAL_SANDBOX"
  | "ALLOW_SIMULATION";

export type SimulationSandboxStatus = "ACTIVE" | "LIMITED" | "FROZEN";

export type SandboxResultStatus =
  | "PASS"
  | "LIMIT_SCOPE"
  | "ESCALATE"
  | "FREEZE";

export interface SimulationSandboxContext {
  sandboxId: string;
  simulationId: string;
  tenantId: string;
  contractId: string;
  replayId: string;
  sandboxStatus: SimulationSandboxStatus;
  isolationLevel: "STRICT" | "HIGH";
  permittedResources: readonly string[];
  createdAt: string;
  immutableHash: string;
  runtimeAccessAllowed: false;
  persistenceAllowed: false;
  networkAccessAllowed: false;
  authorityMutationAllowed: false;
  schedulerAccessAllowed: false;
}

export interface SandboxResult {
  sandboxId: string;
  simulationId: string;
  sandboxStatus: SandboxResultStatus;
  isolationHash: string;
  replayIntegrity: boolean;
  containmentState: string;
  resourceUsageSummary: object;
}

export type SimulationSandboxReasonCode =
  | "CONTRACT_VALID"
  | "CONTRACT_INVALID"
  | "REPLAY_VALID"
  | "REPLAY_INTEGRITY_FAILED"
  | "RUNTIME_ACCESS_BLOCKED"
  | "PERSISTENCE_BLOCKED"
  | "NETWORK_ACCESS_BLOCKED"
  | "SCHEDULER_ACCESS_BLOCKED"
  | "AUTHORITY_MUTATION_BLOCKED"
  | "CROSS_TENANT_ACCESS_BLOCKED"
  | "TENANT_CONTEXT_IMMUTABLE"
  | "PERMISSIONS_IMMUTABLE"
  | "RESOURCE_SCOPE_LIMITED"
  | "REPLAY_CONTEXT_LIMITED"
  | "SANDBOX_DURATION_LIMITED"
  | "WORKERS_BLOCKED"
  | "WRITES_BLOCKED"
  | "SANDBOX_ESCAPE_BLOCKED"
  | "SANDBOX_IS_NOT_EXECUTION"
  | "AUTHORITY_BOUNDARY_PRESERVED";

export type SimulationSandboxRequest = Readonly<{
  sandboxId: string;
  tenantId: string;
  contractId: string;
  sealedContract: SealedSimulationBoundaryRecord;
  branchReplay: SealedBranchReplayRecord;
  permittedResources: readonly string[];
  createdAt: string;
  isolationLevel: "STRICT" | "HIGH";
  requestedDurationSeconds?: number;
  replayContextIds?: readonly string[];
  runtimeAccessAllowed?: boolean;
  persistenceAllowed?: boolean;
  networkAccessAllowed?: boolean;
  authorityMutationAllowed?: boolean;
  schedulerAccessAllowed?: boolean;
  workerAccessAllowed?: boolean;
  writeAccessAllowed?: boolean;
  sandboxPermissionsMutated?: boolean;
}>;

export type SimulationSandboxValidation = Readonly<{
  sandboxStatus: SandboxResultStatus;
  reasonCodes: readonly SimulationSandboxReasonCode[];
  lifecycle: readonly SimulationSandboxLifecycleStep[];
  replayIntegrity: boolean;
  containmentState: "CONTAINED" | "LIMITED" | "ESCALATED" | "FROZEN";
  resourceUsageSummary: Readonly<{
    permittedResourceCount: number;
    replayContextCount: number;
    requestedDurationSeconds: number;
    maxSandboxDuration: number;
    maxReplayContexts: number;
    maxResourceScope: number;
  }>;
  deterministic: true;
  readOnly: true;
  authorityBounded: boolean;
  runtimeInaccessible: boolean;
  networkInaccessible: boolean;
  stateProtected: boolean;
}>;

export type SimulationSandboxObservability = Readonly<{
  sandboxId: string;
  sandboxStatus: SandboxResultStatus;
  isolationLevel: "STRICT" | "HIGH";
  replayIntegrity: boolean;
  containmentState: string;
  isolationHash: string;
}>;

export type SealedSimulationSandboxRecord = Readonly<{
  context: Readonly<SimulationSandboxContext>;
  validation: SimulationSandboxValidation;
  result: Readonly<SandboxResult>;
  observability: SimulationSandboxObservability;
  sealed: true;
  readOnly: true;
  advisoryOnly: true;
  runtimeAccessAllowed: false;
  persistenceAllowed: false;
  networkAccessAllowed: false;
  authorityMutationAllowed: false;
  schedulerAccessAllowed: false;
  workerAccessAllowed: false;
  writeAccessAllowed: false;
}>;

export type GovernanceForecastType =
  | "ESCALATION_FORECAST"
  | "APPROVAL_PRESSURE"
  | "CONTAINMENT_FORECAST"
  | "POLICY_ALIGNMENT";

export type GovernanceForecastStatus =
  | "PASS"
  | "LIMIT_SCOPE"
  | "ESCALATE"
  | "FREEZE";

export interface GovernanceForecastRequest {
  simulationId: string;
  sandboxId: string;
  replayId: string;
  contractId: string;
  riskCertificationReference: string;
  governanceVersion: string;
  forecastType: GovernanceForecastType;
  lineageReferences: readonly string[];
}

export interface GovernanceForecastResult {
  forecastId: string;
  simulationId: string;
  forecastType: GovernanceForecastType;
  forecastStatus: GovernanceForecastStatus;
  governancePressure: number;
  forecastHash: string;
  lineageHash: string;
  replayIntegrity: boolean;
  containmentIntegrity: boolean;
  escalationReason?: string;
}

export type GovernanceForecastReasonCode =
  | "CONTRACT_VALID"
  | "CONTRACT_INVALID"
  | "REPLAY_VALID"
  | "REPLAY_INTEGRITY_FAILED"
  | "SANDBOX_VALID"
  | "SANDBOX_CONTAINMENT_FAILED"
  | "CERTIFICATION_VALID"
  | "CERTIFICATION_INVALID"
  | "GOVERNANCE_VERSION_PRESENT"
  | "GOVERNANCE_VERSION_MISSING"
  | "LINEAGE_PRESENT"
  | "LINEAGE_MISSING"
  | "CROSS_TENANT_INPUTS_BLOCKED"
  | "FORECAST_REFERENCES_SEALED_ARTIFACTS"
  | "FORECAST_REFERENCES_UNSEALED_ARTIFACTS"
  | "POLICY_CONFLICT_SURFACED"
  | "FORECAST_IS_NOT_APPROVAL"
  | "AUTHORITY_BOUNDARY_PRESERVED";

export type GovernanceForecastInput = Readonly<{
  request: GovernanceForecastRequest;
  sealedContract: SealedSimulationBoundaryRecord;
  branchReplay: SealedBranchReplayRecord;
  sandbox: SealedSimulationSandboxRecord;
  tenantId: string;
  policyConflict?: boolean;
  approvalComplexity?: number;
  containmentStress?: number;
}>;

export type GovernanceForecastValidation = Readonly<{
  forecastStatus: GovernanceForecastStatus;
  reasonCodes: readonly GovernanceForecastReasonCode[];
  replayIntegrity: boolean;
  containmentIntegrity: boolean;
  governancePressure: number;
  deterministic: true;
  readOnly: true;
  authorityBounded: boolean;
  governanceAuthoritative: true;
}>;

export type GovernanceForecastObservability = Readonly<{
  forecastId: string;
  forecastType: GovernanceForecastType;
  forecastStatus: GovernanceForecastStatus;
  governancePressure: number;
  forecastHash: string;
  replayIntegrity: boolean;
  containmentIntegrity: boolean;
}>;

export type SealedGovernanceForecastRecord = Readonly<{
  result: Readonly<GovernanceForecastResult>;
  validation: GovernanceForecastValidation;
  observability: GovernanceForecastObservability;
  sealed: true;
  readOnly: true;
  advisoryOnly: true;
  approvalAuthorized: false;
  rejectionAuthorized: false;
  policyMutationAllowed: false;
  executionAuthorized: false;
  authorityMutationAllowed: false;
}>;

export type AlternatePathAnalysisType =
  | "TRADEOFF_ANALYSIS"
  | "PATH_COMPARISON"
  | "CONSTRAINT_ANALYSIS"
  | "OUTCOME_DIFFERENTIATION";

export type AlternatePathAnalysisStatus =
  | "PASS"
  | "LIMIT_SCOPE"
  | "ESCALATE"
  | "FREEZE";

export interface AlternatePathRequest {
  simulationId: string;
  contractId: string;
  replayIds: readonly string[];
  sandboxIds: readonly string[];
  forecastIds: readonly string[];
  pathIds: readonly string[];
  analysisType: AlternatePathAnalysisType;
  lineageReferences: readonly string[];
}

export interface AlternatePathResult {
  analysisId: string;
  simulationId: string;
  analysisType: AlternatePathAnalysisType;
  analysisStatus: AlternatePathAnalysisStatus;
  comparedPathCount: number;
  analysisHash: string;
  lineageHash: string;
  governancePressureDelta: number;
  containmentDelta: number;
  replayIntegrity: boolean;
  containmentIntegrity: boolean;
  escalationReason?: string;
}

export type AlternatePathReasonCode =
  | "CONTRACT_VALID"
  | "CONTRACT_INVALID"
  | "REPLAY_OUTPUTS_VALID"
  | "REPLAY_INTEGRITY_FAILED"
  | "SANDBOX_OUTPUTS_VALID"
  | "CONTAINMENT_INTEGRITY_FAILED"
  | "FORECAST_OUTPUTS_VALID"
  | "INVALID_FORECAST"
  | "APPROVED_PATHS_VALID"
  | "UNAPPROVED_PATH_DETECTED"
  | "GENERATED_PATH_BLOCKED"
  | "RECURSIVE_ANALYSIS_BLOCKED"
  | "NESTED_ANALYSIS_BLOCKED"
  | "PATH_COUNT_INVALID"
  | "PATH_COUNT_LIMITED"
  | "ANALYSIS_DEPTH_LIMITED"
  | "CROSS_TENANT_PATHS_BLOCKED"
  | "LINEAGE_PRESENT"
  | "LINEAGE_MISSING"
  | "ANALYSIS_REFERENCES_SEALED_ARTIFACTS"
  | "ANALYSIS_REFERENCES_UNSEALED_ARTIFACTS"
  | "ANALYSIS_IS_NOT_DECISION"
  | "AUTHORITY_BOUNDARY_PRESERVED";

export type AlternatePathAnalysisInput = Readonly<{
  request: AlternatePathRequest;
  sealedContract: SealedSimulationBoundaryRecord;
  branchReplays: readonly SealedBranchReplayRecord[];
  sandboxes: readonly SealedSimulationSandboxRecord[];
  forecasts: readonly SealedGovernanceForecastRecord[];
  tenantId: string;
  analysisDepth?: number;
  generatedPathIds?: readonly string[];
  nestedAnalysis?: boolean;
  recursiveAnalysis?: boolean;
}>;

export type AlternatePathValidation = Readonly<{
  analysisStatus: AlternatePathAnalysisStatus;
  reasonCodes: readonly AlternatePathReasonCode[];
  comparedPathCount: number;
  replayIntegrity: boolean;
  containmentIntegrity: boolean;
  deterministic: true;
  readOnly: true;
  authorityBounded: boolean;
  governanceAuthoritative: true;
}>;

export type AlternatePathObservability = Readonly<{
  analysisId: string;
  analysisType: AlternatePathAnalysisType;
  comparedPathCount: number;
  analysisStatus: AlternatePathAnalysisStatus;
  governancePressureDelta: number;
  containmentDelta: number;
  analysisHash: string;
}>;

export type SealedAlternatePathAnalysisRecord = Readonly<{
  result: Readonly<AlternatePathResult>;
  validation: AlternatePathValidation;
  observability: AlternatePathObservability;
  sealed: true;
  readOnly: true;
  advisoryOnly: true;
  pathSelectionAuthorized: false;
  executionRecommended: false;
  optimizationAllowed: false;
  pathGenerationAllowed: false;
  workflowMutationAllowed: false;
  authorityMutationAllowed: false;
}>;

export interface SimulationReplayLedgerEntry {
  ledgerId: string;
  simulationId: string;
  tenantId: string;
  contractHash: string;
  replayHash: string;
  sandboxHash: string;
  forecastHash: string;
  analysisHash: string;
  lineageHash: string;
  governanceVersion: string;
  replayOrder: number;
  createdAt: string;
  immutableHash: string;
  sealed: true;
}

export interface SimulationReplayBundle {
  bundleId: string;
  simulationId: string;
  ledgerEntries: string[];
  reconstructionHash: string;
  replayable: boolean;
  lineageIntegrity: boolean;
  bundleStatus:
    | "PASS"
    | "LIMIT_SCOPE"
    | "ESCALATE"
    | "FREEZE";
}

export type SimulationReplayLedgerReasonCode =
  | "CONTRACT_ARTIFACT_SEALED"
  | "CONTRACT_ARTIFACT_UNSEALED"
  | "REPLAY_ARTIFACTS_SEALED"
  | "REPLAY_ARTIFACT_UNSEALED"
  | "SANDBOX_ARTIFACTS_SEALED"
  | "SANDBOX_ARTIFACT_UNSEALED"
  | "FORECAST_ARTIFACTS_SEALED"
  | "FORECAST_ARTIFACT_UNSEALED"
  | "ANALYSIS_ARTIFACTS_SEALED"
  | "ANALYSIS_ARTIFACT_UNSEALED"
  | "LINEAGE_INTEGRITY_VALID"
  | "LINEAGE_INTEGRITY_FAILED"
  | "TENANT_BOUNDARY_PRESERVED"
  | "CROSS_TENANT_ARTIFACTS_BLOCKED"
  | "REPLAY_ORDER_VALID"
  | "REPLAY_ORDER_INVALID"
  | "GOVERNANCE_VERSION_PRESENT"
  | "GOVERNANCE_VERSION_MISSING"
  | "RECONSTRUCTION_HASH_VALID"
  | "RECONSTRUCTION_HASH_MISMATCH"
  | "LEDGER_IS_NOT_EXECUTION"
  | "AUTHORITY_BOUNDARY_PRESERVED";

export type SimulationReplayLedgerInput = Readonly<{
  simulationId: string;
  tenantId: string;
  createdAt: string;
  sealedContract: SealedSimulationBoundaryRecord;
  branchReplays: readonly SealedBranchReplayRecord[];
  sandboxes: readonly SealedSimulationSandboxRecord[];
  forecasts: readonly SealedGovernanceForecastRecord[];
  analyses: readonly SealedAlternatePathAnalysisRecord[];
  replayOrder?: readonly string[];
  expectedReconstructionHash?: string;
}>;

export type SimulationReplayLedgerValidation = Readonly<{
  bundleStatus: SimulationReplayBundle["bundleStatus"];
  reasonCodes: readonly SimulationReplayLedgerReasonCode[];
  lineageIntegrity: boolean;
  tenantBoundaryPreserved: boolean;
  replayOrderValid: boolean;
  reconstructionHashValid: boolean;
  deterministic: true;
  readOnly: true;
  authorityBounded: true;
  governanceAuthoritative: true;
}>;

export type SimulationReplayLedgerObservability = Readonly<{
  ledgerId: string;
  simulationId: string;
  replayOrder: number;
  reconstructionHash: string;
  lineageIntegrity: boolean;
  bundleStatus: SimulationReplayBundle["bundleStatus"];
}>;

export type SealedSimulationReplayLedgerRecord = Readonly<{
  entries: readonly Readonly<SimulationReplayLedgerEntry>[];
  bundle: Readonly<SimulationReplayBundle>;
  validation: SimulationReplayLedgerValidation;
  observability: SimulationReplayLedgerObservability;
  sealed: true;
  readOnly: true;
  advisoryOnly: true;
  executionAuthorized: false;
  workflowMutationAllowed: false;
  authorityMutationAllowed: false;
  persistenceAllowed: false;
  schedulingAllowed: false;
}>;

export interface SimulationResultModel {
  resultId: string;
  simulationId: string;
  tenantId: string;
  contractHash: string;
  replayHash: string;
  sandboxHash: string;
  forecastHash: string;
  analysisHash: string;
  reconstructionHash: string;
  lineageHash: string;
  governanceVersion: string;
  resultVersion: string;
  replayable: boolean;
  lineageIntegrity: boolean;
  resultStatus:
    | "PASS"
    | "LIMIT_SCOPE"
    | "ESCALATE"
    | "FREEZE";
  evidenceReferences: string[];
  createdAt: string;
  immutableHash: string;
}

export type SimulationResultModelReasonCode =
  | "CONTRACT_ARTIFACT_SEALED"
  | "CONTRACT_ARTIFACT_UNSEALED"
  | "REPLAY_ARTIFACTS_SEALED"
  | "REPLAY_ARTIFACT_UNSEALED"
  | "SANDBOX_ARTIFACTS_SEALED"
  | "SANDBOX_ARTIFACT_UNSEALED"
  | "FORECAST_ARTIFACTS_SEALED"
  | "FORECAST_ARTIFACT_UNSEALED"
  | "ANALYSIS_ARTIFACTS_SEALED"
  | "ANALYSIS_ARTIFACT_UNSEALED"
  | "LEDGER_ARTIFACT_SEALED"
  | "LEDGER_ARTIFACT_UNSEALED"
  | "LINEAGE_INTEGRITY_VALID"
  | "LINEAGE_INTEGRITY_FAILED"
  | "REPLAYABLE"
  | "REPLAYABLE_FALSE"
  | "TENANT_BOUNDARY_PRESERVED"
  | "CROSS_TENANT_ARTIFACTS_BLOCKED"
  | "RECONSTRUCTION_HASH_PRESENT"
  | "RECONSTRUCTION_HASH_MISSING"
  | "GOVERNANCE_VERSION_PRESENT"
  | "GOVERNANCE_VERSION_MISSING"
  | "EVIDENCE_REFERENCES_PRESENT"
  | "EVIDENCE_REFERENCES_MISSING"
  | "RESULT_IS_NOT_DECISION"
  | "AUTHORITY_BOUNDARY_PRESERVED";

export type SimulationResultModelInput = Readonly<{
  simulationId: string;
  tenantId: string;
  createdAt: string;
  resultVersion: string;
  sealedContract: SealedSimulationBoundaryRecord;
  branchReplays: readonly SealedBranchReplayRecord[];
  sandboxes: readonly SealedSimulationSandboxRecord[];
  forecasts: readonly SealedGovernanceForecastRecord[];
  analyses: readonly SealedAlternatePathAnalysisRecord[];
  replayLedger: SealedSimulationReplayLedgerRecord;
  evidenceReferences?: readonly string[];
}>;

export type SimulationResultModelValidation = Readonly<{
  resultStatus: SimulationResultModel["resultStatus"];
  reasonCodes: readonly SimulationResultModelReasonCode[];
  lineageIntegrity: boolean;
  replayable: boolean;
  tenantBoundaryPreserved: boolean;
  evidenceReferencesPreserved: boolean;
  deterministic: true;
  readOnly: true;
  authorityBounded: true;
  governanceAuthoritative: true;
}>;

export type SimulationResultModelObservability = Readonly<{
  resultId: string;
  simulationId: string;
  resultStatus: SimulationResultModel["resultStatus"];
  replayable: boolean;
  lineageIntegrity: boolean;
  immutableHash: string;
}>;

export type SealedSimulationResultModelRecord = Readonly<{
  result: Readonly<SimulationResultModel>;
  validation: SimulationResultModelValidation;
  observability: SimulationResultModelObservability;
  sealed: true;
  readOnly: true;
  advisoryOnly: true;
  decisionAuthorized: false;
  recommendationAllowed: false;
  rankingAllowed: false;
  executionAuthorized: false;
  workflowMutationAllowed: false;
  authorityMutationAllowed: false;
  evidenceMutationAllowed: false;
  persistenceAllowed: false;
  schedulingAllowed: false;
}>;

export interface SimulationCertificationRequest {
  simulationId: string;
  tenantId: string;
  contractHash: string;
  replayHash: string;
  sandboxHash: string;
  forecastHash: string;
  analysisHash: string;
  reconstructionHash: string;
  resultHash: string;
  lineageReferences: string[];
  governanceVersion: string;
}

export interface SimulationCertificationResult {
  certificationId: string;
  simulationId: string;
  certificationStatus:
    | "PASS"
    | "CONDITIONAL_PASS"
    | "FAIL";
  deterministicReplay: boolean;
  containmentVerified: boolean;
  governanceVerified: boolean;
  lineageIntegrity: boolean;
  tenantIsolationVerified: boolean;
  authorityBounded: boolean;
  certificationHash: string;
  escalationReason?: string;
}

export type IntentSimulationCertificationReasonCode =
  | "ARTIFACTS_SEALED"
  | "ARTIFACT_UNSEALED"
  | "ARTIFACT_HASHES_MATCH"
  | "ARTIFACT_HASH_MISMATCH"
  | "DETERMINISTIC_REPLAY_VERIFIED"
  | "DETERMINISTIC_REPLAY_FAILED"
  | "CONTAINMENT_VERIFIED"
  | "CONTAINMENT_FAILED"
  | "GOVERNANCE_VERIFIED"
  | "GOVERNANCE_VERSION_MISSING"
  | "GOVERNANCE_VIOLATION"
  | "LINEAGE_INTEGRITY_VALID"
  | "LINEAGE_INTEGRITY_FAILED"
  | "LINEAGE_REFERENCES_PRESENT"
  | "LINEAGE_REFERENCES_MISSING"
  | "TENANT_ISOLATION_VERIFIED"
  | "CROSS_TENANT_LEAKAGE"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "CERTIFICATION_IS_NOT_CONTROL"
  | "NO_REMEDIATION_AUTHORITY";

export type IntentSimulationCertificationInput = Readonly<{
  request: SimulationCertificationRequest;
  sealedContract: SealedSimulationBoundaryRecord;
  branchReplays: readonly SealedBranchReplayRecord[];
  sandboxes: readonly SealedSimulationSandboxRecord[];
  forecasts: readonly SealedGovernanceForecastRecord[];
  analyses: readonly SealedAlternatePathAnalysisRecord[];
  replayLedger: SealedSimulationReplayLedgerRecord;
  resultModel: SealedSimulationResultModelRecord;
}>;

export type IntentSimulationCertificationValidation = Readonly<{
  certificationStatus: SimulationCertificationResult["certificationStatus"];
  reasonCodes: readonly IntentSimulationCertificationReasonCode[];
  deterministicReplay: boolean;
  containmentVerified: boolean;
  governanceVerified: boolean;
  lineageIntegrity: boolean;
  tenantIsolationVerified: boolean;
  authorityBounded: boolean;
  deterministic: true;
  readOnly: true;
  certificationOnly: true;
}>;

export type IntentSimulationCertificationObservability = Readonly<{
  certificationId: string;
  certificationStatus: SimulationCertificationResult["certificationStatus"];
  deterministicReplay: boolean;
  containmentVerified: boolean;
  governanceVerified: boolean;
  authorityBounded: boolean;
  certificationHash: string;
}>;

export type SealedIntentSimulationCertificationRecord = Readonly<{
  result: Readonly<SimulationCertificationResult>;
  validation: IntentSimulationCertificationValidation;
  observability: IntentSimulationCertificationObservability;
  sealed: true;
  readOnly: true;
  certificationOnly: true;
  executionAuthorized: false;
  repairAuthorized: false;
  approvalAuthorized: false;
  remediationAllowed: false;
  workflowMutationAllowed: false;
  governanceMutationAllowed: false;
  authorityMutationAllowed: false;
  persistenceAllowed: false;
  schedulingAllowed: false;
}>;

export interface CertificationReplayRequest {
  certificationId: string;
  simulationId: string;
  tenantId: string;
  certificationHash: string;
  reconstructionMode:
    | "FULL_REPLAY"
    | "LINEAGE_REPLAY"
    | "HASH_REPLAY";
  lineageReferences: string[];
}

export interface CertificationReplayResult {
  replayId: string;
  certificationId: string;
  replayStatus:
    | "PASS"
    | "LIMIT_SCOPE"
    | "ESCALATE"
    | "FAIL";
  reconstructedHash: string;
  lineageIntegrity: boolean;
  reconstructionDeterministic: boolean;
  replayable: boolean;
  escalationReason?: string;
}

export type CertificationReplayReasonCode =
  | "CERTIFICATION_ARTIFACT_SEALED"
  | "CERTIFICATION_ARTIFACT_UNSEALED"
  | "LEDGER_ARTIFACT_SEALED"
  | "LEDGER_ARTIFACT_UNSEALED"
  | "RESULT_MODEL_ARTIFACT_SEALED"
  | "RESULT_MODEL_ARTIFACT_UNSEALED"
  | "CERTIFICATION_HASH_PRESENT"
  | "CERTIFICATION_HASH_MISSING"
  | "REPLAY_EVIDENCE_PRESENT"
  | "REPLAY_EVIDENCE_MISSING"
  | "LINEAGE_INTEGRITY_VALID"
  | "LINEAGE_INTEGRITY_FAILED"
  | "TENANT_BOUNDARY_PRESERVED"
  | "CROSS_TENANT_REFERENCES_BLOCKED"
  | "RECONSTRUCTED_HASH_VALID"
  | "RECONSTRUCTED_HASH_MISMATCH"
  | "REPLAY_REFERENCES_IMMUTABLE"
  | "REPLAY_REFERENCES_MUTATED"
  | "REPLAY_IS_NOT_RECERTIFICATION"
  | "AUTHORITY_BOUNDARY_PRESERVED";

export type CertificationReplayInput = Readonly<{
  request: CertificationReplayRequest;
  certification: SealedIntentSimulationCertificationRecord;
  replayLedger: SealedSimulationReplayLedgerRecord;
  resultModel: SealedSimulationResultModelRecord;
}>;

export type CertificationReplayValidation = Readonly<{
  replayStatus: CertificationReplayResult["replayStatus"];
  reasonCodes: readonly CertificationReplayReasonCode[];
  lineageIntegrity: boolean;
  reconstructionDeterministic: boolean;
  replayable: boolean;
  tenantBoundaryPreserved: boolean;
  deterministic: true;
  readOnly: true;
  replayOnly: true;
}>;

export type CertificationReplayObservability = Readonly<{
  replayId: string;
  certificationId: string;
  replayStatus: CertificationReplayResult["replayStatus"];
  replayable: boolean;
  lineageIntegrity: boolean;
  reconstructedHash: string;
}>;

export type SealedCertificationReplayRecord = Readonly<{
  result: Readonly<CertificationReplayResult>;
  validation: CertificationReplayValidation;
  observability: CertificationReplayObservability;
  sealed: true;
  readOnly: true;
  replayOnly: true;
  recertificationAllowed: false;
  artifactMutationAllowed: false;
  lineageMutationAllowed: false;
  executionAuthorized: false;
  workflowMutationAllowed: false;
  governanceMutationAllowed: false;
  authorityMutationAllowed: false;
  remediationAllowed: false;
  persistenceAllowed: false;
  schedulingAllowed: false;
}>;

export interface SimulationObservabilityRequest {
  simulationId: string;
  tenantId: string;
  visibilityScope:
    | "HEALTH"
    | "LINEAGE"
    | "CERTIFICATION"
    | "CONTAINMENT"
    | "FULL";
  artifactReferences: string[];
}

export interface SimulationObservabilityResult {
  observabilityId: string;
  simulationId: string;
  observabilityState:
    | "HEALTHY"
    | "DEGRADED"
    | "LIMITED"
    | "ESCALATED"
    | "FROZEN";
  replayVisible: boolean;
  lineageVisible: boolean;
  certificationVisible: boolean;
  containmentVisible: boolean;
  reconstructionVisible: boolean;
  lineageIntegrity: boolean;
  observabilityHash: string;
}

export type SimulationObservabilityReasonCode =
  | "ARTIFACTS_SEALED"
  | "ARTIFACT_UNSEALED"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_ARTIFACTS_BLOCKED"
  | "VISIBILITY_SCOPE_VALID"
  | "VISIBILITY_SCOPE_INVALID"
  | "ARTIFACT_REFERENCES_PRESENT"
  | "ARTIFACT_REFERENCES_MISSING"
  | "REPLAY_VISIBLE"
  | "REPLAY_NOT_VISIBLE"
  | "LINEAGE_VISIBLE"
  | "LINEAGE_NOT_VISIBLE"
  | "CERTIFICATION_VISIBLE"
  | "CERTIFICATION_NOT_VISIBLE"
  | "CONTAINMENT_VISIBLE"
  | "CONTAINMENT_NOT_VISIBLE"
  | "RECONSTRUCTION_VISIBLE"
  | "RECONSTRUCTION_NOT_VISIBLE"
  | "LINEAGE_INTEGRITY_VALID"
  | "LINEAGE_INTEGRITY_FAILED"
  | "CONTAINMENT_HEALTHY"
  | "CONTAINMENT_FAILURE"
  | "CERTIFICATION_HEALTHY"
  | "CERTIFICATION_FAILURE"
  | "OBSERVABILITY_IS_NOT_CONTROL"
  | "AUTHORITY_BOUNDARY_PRESERVED";

export type SimulationObservabilityInput = Readonly<{
  request: SimulationObservabilityRequest;
  sealedContract: SealedSimulationBoundaryRecord;
  branchReplays: readonly SealedBranchReplayRecord[];
  sandboxes: readonly SealedSimulationSandboxRecord[];
  forecasts: readonly SealedGovernanceForecastRecord[];
  analyses: readonly SealedAlternatePathAnalysisRecord[];
  replayLedger: SealedSimulationReplayLedgerRecord;
  resultModel: SealedSimulationResultModelRecord;
  certification: SealedIntentSimulationCertificationRecord;
  certificationReplay: SealedCertificationReplayRecord;
}>;

export type SimulationObservabilityValidation = Readonly<{
  observabilityState: SimulationObservabilityResult["observabilityState"];
  reasonCodes: readonly SimulationObservabilityReasonCode[];
  replayVisible: boolean;
  lineageVisible: boolean;
  certificationVisible: boolean;
  containmentVisible: boolean;
  reconstructionVisible: boolean;
  lineageIntegrity: boolean;
  deterministic: true;
  readOnly: true;
  visibilityOnly: true;
  authorityBounded: true;
}>;

export type SealedSimulationObservabilityRecord = Readonly<{
  result: Readonly<SimulationObservabilityResult>;
  validation: SimulationObservabilityValidation;
  sealed: true;
  readOnly: true;
  visibilityOnly: true;
  executionAuthorized: false;
  workflowMutationAllowed: false;
  governanceMutationAllowed: false;
  authorityMutationAllowed: false;
  artifactMutationAllowed: false;
  remediationAllowed: false;
  persistenceAllowed: false;
  schedulingAllowed: false;
}>;

export interface SimulationBoundaryVerificationRequest {
  verificationId: string;
  simulationId: string;
  tenantId: string;
  verificationScope:
    | "EXECUTION_BOUNDARY"
    | "MUTATION_BOUNDARY"
    | "AUTHORITY_BOUNDARY"
    | "GOVERNANCE_BOUNDARY"
    | "OBSERVABILITY_BOUNDARY"
    | "FULL";
  artifactReferences: string[];
  lineageReferences: string[];
}

export interface SimulationBoundaryVerificationResult {
  verificationId: string;
  simulationId: string;
  verificationStatus:
    | "PASS"
    | "BLOCK"
    | "FREEZE"
    | "ESCALATE"
    | "AUDIT";
  executionBoundaryVerified: boolean;
  mutationBoundaryVerified: boolean;
  authorityBoundaryVerified: boolean;
  governanceBoundaryVerified: boolean;
  observabilityBoundaryVerified: boolean;
  lineageIntegrity: boolean;
  verificationHash: string;
  escalationReason?: string;
}

export type SimulationBoundaryVerificationReasonCode =
  | "ARTIFACTS_SEALED"
  | "ARTIFACT_UNSEALED"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_ARTIFACTS_BLOCKED"
  | "LINEAGE_INTEGRITY_VALID"
  | "LINEAGE_INTEGRITY_FAILED"
  | "ARTIFACT_REFERENCES_PRESENT"
  | "ARTIFACT_REFERENCES_MISSING"
  | "LINEAGE_REFERENCES_PRESENT"
  | "LINEAGE_REFERENCES_MISSING"
  | "VERIFICATION_SCOPE_VALID"
  | "VERIFICATION_SCOPE_INVALID"
  | "EXECUTION_BOUNDARY_VERIFIED"
  | "EXECUTION_PATH_DETECTED"
  | "MUTATION_BOUNDARY_VERIFIED"
  | "MUTATION_PATH_DETECTED"
  | "AUTHORITY_BOUNDARY_VERIFIED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "GOVERNANCE_BOUNDARY_VERIFIED"
  | "GOVERNANCE_BOUNDARY_VIOLATION"
  | "OBSERVABILITY_BOUNDARY_VERIFIED"
  | "OBSERVABILITY_CONTROL_DETECTED"
  | "VERIFICATION_IS_NOT_AUTHORITY";

export type SimulationBoundaryVerificationInput = Readonly<{
  request: SimulationBoundaryVerificationRequest;
  sealedContract: SealedSimulationBoundaryRecord;
  branchReplays: readonly SealedBranchReplayRecord[];
  sandboxes: readonly SealedSimulationSandboxRecord[];
  forecasts: readonly SealedGovernanceForecastRecord[];
  analyses: readonly SealedAlternatePathAnalysisRecord[];
  replayLedger: SealedSimulationReplayLedgerRecord;
  resultModel: SealedSimulationResultModelRecord;
  certification: SealedIntentSimulationCertificationRecord;
  certificationReplay: SealedCertificationReplayRecord;
  observability: SealedSimulationObservabilityRecord;
}>;

export type SimulationBoundaryVerificationValidation = Readonly<{
  verificationStatus: SimulationBoundaryVerificationResult["verificationStatus"];
  reasonCodes: readonly SimulationBoundaryVerificationReasonCode[];
  executionBoundaryVerified: boolean;
  mutationBoundaryVerified: boolean;
  authorityBoundaryVerified: boolean;
  governanceBoundaryVerified: boolean;
  observabilityBoundaryVerified: boolean;
  lineageIntegrity: boolean;
  deterministic: true;
  readOnly: true;
  verificationOnly: true;
}>;

export type SealedSimulationBoundaryVerificationRecord = Readonly<{
  result: Readonly<SimulationBoundaryVerificationResult>;
  validation: SimulationBoundaryVerificationValidation;
  sealed: true;
  readOnly: true;
  verificationOnly: true;
  executionAuthorized: false;
  workflowMutationAllowed: false;
  artifactMutationAllowed: false;
  governanceMutationAllowed: false;
  authorityMutationAllowed: false;
  approvalAuthorized: false;
  remediationAllowed: false;
  persistenceAllowed: false;
  schedulingAllowed: false;
}>;
