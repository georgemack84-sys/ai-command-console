export type DeploymentState =
  | "RUNNING"
  | "PROGRESSING"
  | "WAITING"
  | "STALLED"
  | "BLOCKED"
  | "DISPUTED"
  | "PASSED"
  | "FAILED";

export type DeploymentFailureClass =
  | "INFRA_FAILURE"
  | "CODE_FAILURE"
  | "TEST_FAILURE"
  | "GOVERNANCE_FAILURE"
  | "ENV_FAILURE"
  | "TIMEOUT_FAILURE"
  | "UNKNOWN_FAILURE";

export type DeploymentCertificateStatus = "VALID" | "INVALID" | "MISSING" | "UNKNOWN";

export type DeploymentResidueStatus = "CLEAN" | "DIRTY" | "UNKNOWN";

export type DeploymentGovernanceStatus = "PASSED" | "FAILED" | "DISPUTED" | "UNKNOWN";

export type DeploymentOperatorAction =
  | "NONE"
  | "START_DEPLOY"
  | "RETRY"
  | "RESUME"
  | "ROLLBACK"
  | "CANCEL";

export type DeploymentCertificate = Readonly<{
  commitSHA: string;
  workflowRunId: string;
  testHash: string;
  residueStatus: DeploymentResidueStatus;
  governanceStatus: DeploymentGovernanceStatus;
  approvalLineage: readonly string[];
  timestamp: string;
  certificateHash: string;
}>;

export type DeploymentCertificateInput = Readonly<Omit<DeploymentCertificate, "certificateHash">>;

export type DeploymentCertificateResult =
  | Readonly<{ ok: true; certificate: DeploymentCertificate }>
  | Readonly<{ ok: false; reasons: readonly string[] }>;

export type DeploymentCheckpoint = Readonly<{
  deploymentId: string;
  commitSHA: string;
  lockfileHash: string;
  environmentHash: string;
  certificateHash: string;
  lastCompletedPartition: string;
  timestamp: string;
}>;

export type DeploymentCheckpointDecision = Readonly<{
  status: "VALID" | "INVALID" | "MISSING" | "NOT_REQUESTED";
  reasons: readonly string[];
  resumePartition?: string;
}>;

export type DeploymentLogEntry = Readonly<{
  at: string;
  message: string;
}>;

export type DeploymentArtifact = Readonly<{
  name: string;
  hash: string;
}>;

export type DeploymentReplayBinding = Readonly<{
  runtimeHash?: string;
  replayHash?: string;
  replayBundlePresent?: boolean;
}>;

export type ActiveDeployment = Readonly<{
  deploymentId: string;
  state: DeploymentState;
}>;

export type DeploymentSnapshot = Readonly<{
  workflowId: string;
  deploymentId: string;
  workflowRunId: string;
  commitSHA: string;
  currentStep: string;
  currentPartition: string;
  lastCompletedPartition: string;
  startedAt: string;
  updatedAt: string;
  observedAt: string;
  heartbeatAt?: string;
  lastProgressAt?: string;
  attemptCount: number;
  lockfileHash: string;
  environmentHash: string;
  state?: string;
  failureSignal?: string;
  failureClass?: DeploymentFailureClass;
  operatorAction?: DeploymentOperatorAction;
  activeDeployment?: ActiveDeployment;
  certificateStatus: DeploymentCertificateStatus;
  certificate?: DeploymentCertificate;
  checkpoint?: DeploymentCheckpoint;
  logs: readonly DeploymentLogEntry[];
  artifacts: readonly DeploymentArtifact[];
  replay?: DeploymentReplayBinding;
}>;

export type DeploymentTelemetry = Readonly<{
  workflowId: string;
  deploymentId: string;
  currentStep: string;
  currentPartition: string;
  lastCompletedPartition: string;
  elapsedTime: number;
  heartbeatAt?: string;
  failureClass?: DeploymentFailureClass;
  certificateStatus: DeploymentCertificateStatus;
  attemptCount: number;
}>;

export type DeploymentContainment = Readonly<{
  frozen: boolean;
  preserveEvidence: boolean;
  blockRetries: boolean;
  blockNewDeploys: boolean;
  blockCancellation: boolean;
}>;

export type DeploymentOperatorPolicy = Readonly<{
  deployAllowed: boolean;
  retryAllowed: boolean;
  resumeAllowed: boolean;
  rollbackAllowed: boolean;
  cancelAllowed: boolean;
}>;

export type DeploymentStateTransition = Readonly<{
  from: string;
  to: DeploymentState;
  at: string;
  reason: string;
}>;

export type DeploymentEvidenceBundle = Readonly<{
  evidenceVersion: "1.0";
  deploymentId: string;
  workflowId: string;
  workflowRunId: string;
  commitSHA: string;
  state: DeploymentState;
  failureClass?: DeploymentFailureClass;
  telemetry: DeploymentTelemetry;
  certificate?: DeploymentCertificate;
  checkpoint: DeploymentCheckpointDecision;
  logs: readonly DeploymentLogEntry[];
  artifacts: readonly DeploymentArtifact[];
  stateTransitions: readonly DeploymentStateTransition[];
  reasons: readonly string[];
  evidenceHash: string;
}>;

export type DeploymentHardeningEvaluation = Readonly<{
  ok: boolean;
  state: DeploymentState;
  failureClass?: DeploymentFailureClass;
  reasons: readonly string[];
  telemetry: DeploymentTelemetry;
  checkpoint: DeploymentCheckpointDecision;
  containment: DeploymentContainment;
  operatorActions: DeploymentOperatorPolicy;
  evidence: DeploymentEvidenceBundle;
}>;

export type DeploymentEvidenceReplayResult = Readonly<{
  ok: boolean;
  status: "REPLAYABLE" | "NOT_REPLAYABLE" | "DISPUTED";
  missingEvidence: readonly string[];
  hashMismatches: readonly string[];
  evidenceHash: string;
}>;
