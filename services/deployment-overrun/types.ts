import type { FailureClassificationValue } from "../operational-rules";
import type { ImmutableAuditLedgerEntry } from "../audit/immutableAuditLedger";

export type DeploymentOverrunState =
  | "RUNNING"
  | "ACTIVE_SLOW"
  | "OBSERVE_ONLY"
  | "POSSIBLE_STUCK"
  | "STALLED"
  | "TIMEOUT_FAILURE"
  | "POSSIBLY_STUCK"
  | "FAILED"
  | "DISPUTED"
  | "PASSED"
  | "BLOCKED";

export type DeploymentFailureClassification =
  | FailureClassificationValue
  | "TIMEOUT_FAILURE"
  | "OPERATOR_INTERRUPTED";

export type DeploymentOperatorAction =
  | "NONE"
  | "START_DEPLOY"
  | "RETRY"
  | "CANCEL"
  | "FORCE_PUSH_AUTOMATION";

export type DeploymentLogEvidence = Readonly<{
  at: string;
  message: string;
}>;

export type DeploymentArtifactEvidence = Readonly<{
  name: string;
  hash: string;
}>;

export type DeploymentCertificationEvidence = Readonly<{
  certificateHash: string;
  releaseId: string;
  governanceStatus: "PASSED" | "FAILED" | "DISPUTED" | "UNKNOWN";
  residueResult: "CLEAN" | "DIRTY" | "UNKNOWN";
  artifactHash: string;
  commitSha: string;
}>;

export type DeploymentReplayEvidence = Readonly<{
  runtimeHash?: string;
  replayHash?: string;
  replayBundlePresent?: boolean;
}>;

export type ActiveDeploymentEvidence = Readonly<{
  runId: string;
  state: DeploymentOverrunState;
}>;

export type DeploymentOverrunSnapshot = Readonly<{
  workflowId: string;
  workflowName: string;
  runId: string;
  commitSha: string;
  startedAt: string;
  updatedAt: string;
  observedAt: string;
  lastProgressAt?: string;
  heartbeatAt?: string;
  activeJob?: string;
  activeStep?: string;
  state?: string;
  sourceStatus?: string;
  failureSignal?: string;
  failureClassification?: DeploymentFailureClassification;
  operatorAction?: DeploymentOperatorAction;
  releaseGatePassed: boolean;
  activeDeployment?: ActiveDeploymentEvidence;
  approvalLineage: readonly string[];
  logs: readonly DeploymentLogEvidence[];
  artifacts: readonly DeploymentArtifactEvidence[];
  smokeResults?: unknown;
  certification?: DeploymentCertificationEvidence;
  replay?: DeploymentReplayEvidence;
}>;

export type DeploymentOverrunTelemetry = Readonly<{
  workflow_id: string;
  run_id: string;
  started_at: string;
  updated_at: string;
  state: DeploymentOverrunState;
  classification?: DeploymentFailureClassification;
  heartbeat_age: number | null;
  evidence_status: "PRESENT" | "MISSING" | "DISPUTED";
  active_job?: string;
  active_step?: string;
  elapsedMinutes: number;
  lastProgressTimestamp?: string;
  latestLogs: readonly DeploymentLogEvidence[];
}>;

export type DeploymentContainmentDecision = Readonly<{
  frozen: boolean;
  blockRetries: boolean;
  blockNewDeploys: boolean;
  blockForcePushAutomation: boolean;
  preserveLogs: boolean;
  preserveArtifacts: boolean;
  preserveCertificationLineage: boolean;
}>;

export type DeploymentOperatorActionPolicy = Readonly<{
  retryAllowed: boolean;
  newDeployAllowed: boolean;
  cancelAllowed: boolean;
  forcePushAutomationAllowed: boolean;
}>;

export type DeploymentOverrunEvidence = Readonly<{
  evidenceVersion: "1.0";
  workflowId: string;
  workflowName: string;
  runId: string;
  commitSha: string;
  state: DeploymentOverrunState;
  classification?: DeploymentFailureClassification;
  startedAt: string;
  updatedAt: string;
  observedAt: string;
  lastProgressAt?: string;
  heartbeatAt?: string;
  approvalLineage: readonly string[];
  logs: readonly DeploymentLogEvidence[];
  artifacts: readonly DeploymentArtifactEvidence[];
  smokeResults?: unknown;
  certification?: DeploymentCertificationEvidence;
  reasons: readonly string[];
  telemetry: DeploymentOverrunTelemetry;
  containment: DeploymentContainmentDecision;
  evidenceHash: string;
}>;

export type DeploymentOverrunEvaluation = Readonly<{
  ok: boolean;
  state: DeploymentOverrunState;
  classification?: DeploymentFailureClassification;
  reasons: readonly string[];
  telemetry: DeploymentOverrunTelemetry;
  containment: DeploymentContainmentDecision;
  operatorActions: DeploymentOperatorActionPolicy;
  evidence: DeploymentOverrunEvidence;
  evidenceLedgerEntry: ImmutableAuditLedgerEntry<DeploymentOverrunEvidence>;
}>;

export type DeploymentOverrunReplayVerification = Readonly<{
  ok: boolean;
  status: "REPLAYABLE" | "NOT_REPLAYABLE" | "DISPUTED";
  missingEvidence: readonly string[];
  hashMismatches: readonly string[];
  evidenceHash: string;
}>;
