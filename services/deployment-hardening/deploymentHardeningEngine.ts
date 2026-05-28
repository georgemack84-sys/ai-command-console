import { evaluateDeploymentOverrun } from "../deployment-overrun";
import { freezeDeploymentEvidence } from "./deploymentEvidence";
import { validateDeploymentCertificate } from "./deploymentCertificate";
import { verifyDeploymentCheckpoint } from "./deploymentCheckpoint";
import { buildDeploymentTelemetry, minutesSince } from "./deploymentTelemetry";
import type {
  DeploymentContainment,
  DeploymentFailureClass,
  DeploymentHardeningEvaluation,
  DeploymentOperatorPolicy,
  DeploymentSnapshot,
  DeploymentState,
} from "./types";

const LEGAL_STATES = new Set(["RUNNING", "PROGRESSING", "WAITING", "STALLED", "BLOCKED", "DISPUTED", "PASSED", "FAILED"]);
const ACTIVE_STATES = new Set(["RUNNING", "PROGRESSING", "WAITING", "STALLED"]);

function classifyFailure(snapshot: DeploymentSnapshot, reasons: string[]): DeploymentFailureClass | undefined {
  const raw = `${snapshot.failureSignal || ""}`.toLowerCase();
  let inferred: DeploymentFailureClass | undefined;
  if (raw.includes("timeout")) inferred = "TIMEOUT_FAILURE";
  else if (raw.includes("network") || raw.includes("ssh") || raw.includes("scp") || raw.includes("econnreset")) {
    inferred = "INFRA_FAILURE";
  } else if (raw.includes("assert") || raw.includes("test failed")) inferred = "TEST_FAILURE";
  else if (raw.includes("governance")) inferred = "GOVERNANCE_FAILURE";
  else if (raw.includes("env") || raw.includes("secret") || raw.includes("config")) inferred = "ENV_FAILURE";
  else if (raw.includes("code") || raw.includes("compile")) inferred = "CODE_FAILURE";
  else if (raw.trim()) inferred = "UNKNOWN_FAILURE";

  if (snapshot.failureClass && inferred && snapshot.failureClass !== inferred) {
    reasons.push("FAILURE_CLASS_MISMATCH");
    return "UNKNOWN_FAILURE";
  }

  return snapshot.failureClass || inferred;
}

function collectReasons(snapshot: DeploymentSnapshot, failureClass?: DeploymentFailureClass) {
  const reasons: string[] = [];

  if (snapshot.state && !LEGAL_STATES.has(snapshot.state)) reasons.push("UNKNOWN_DEPLOYMENT_STATE");
  if (!snapshot.heartbeatAt) reasons.push("HEARTBEAT_MISSING");
  if (!snapshot.logs || snapshot.logs.length === 0) reasons.push("LOG_EVIDENCE_MISSING");
  if (!snapshot.replay?.replayBundlePresent) reasons.push("REPLAY_EVIDENCE_MISSING");
  if (snapshot.replay?.runtimeHash && snapshot.replay?.replayHash && snapshot.replay.runtimeHash !== snapshot.replay.replayHash) {
    reasons.push("RUNTIME_REPLAY_MISMATCH");
  }
  const certificateReasons = validateDeploymentCertificate(snapshot.certificate);
  reasons.push(...certificateReasons);
  if (snapshot.certificate && certificateReasons.length > 0) {
    reasons.push("CERTIFICATE_INVALID");
  }
  if (snapshot.certificate && snapshot.certificate.commitSHA !== snapshot.commitSHA) {
    reasons.push("CERTIFICATE_COMMIT_MISMATCH");
  }
  if (snapshot.certificate && snapshot.certificate.workflowRunId !== snapshot.workflowRunId) {
    reasons.push("CERTIFICATE_WORKFLOW_RUN_MISMATCH");
  }
  if (snapshot.operatorAction === "START_DEPLOY" && snapshot.activeDeployment && ACTIVE_STATES.has(snapshot.activeDeployment.state)) {
    reasons.push("ACTIVE_DEPLOYMENT_EXISTS");
  }
  if (snapshot.operatorAction === "RETRY" && (!failureClass || failureClass === "UNKNOWN_FAILURE")) {
    reasons.push("RETRY_REQUIRES_CLASSIFICATION");
  }
  if (snapshot.operatorAction === "ROLLBACK" && (!snapshot.certificate || !snapshot.logs || snapshot.logs.length === 0)) {
    reasons.push("ROLLBACK_REQUIRES_CERTIFICATE_AND_EVIDENCE");
  }

  const noProgressMinutes = minutesSince(snapshot.lastProgressAt || snapshot.updatedAt, snapshot.observedAt);
  if (noProgressMinutes !== null && noProgressMinutes >= 30) {
    reasons.push("NO_PROGRESS_CONTAINMENT_CANDIDATE");
  } else if (noProgressMinutes !== null && noProgressMinutes >= 20) {
    reasons.push("NO_PROGRESS_ESCALATE");
  } else if (noProgressMinutes !== null && noProgressMinutes >= 10) {
    reasons.push("NO_PROGRESS_WARNING");
  }

  return [...new Set(reasons)];
}

function deriveState(input: {
  snapshot: DeploymentSnapshot;
  failureClass?: DeploymentFailureClass;
  reasons: readonly string[];
  checkpointStatus: string;
}): DeploymentState {
  if (input.reasons.includes("UNKNOWN_DEPLOYMENT_STATE")) return "DISPUTED";
  if (input.reasons.includes("RUNTIME_REPLAY_MISMATCH")) return "DISPUTED";
  if (input.reasons.includes("FAILURE_CLASS_MISMATCH")) return "DISPUTED";
  if (input.failureClass === "UNKNOWN_FAILURE") return "DISPUTED";
  if (input.reasons.includes("CERTIFICATE_MISSING") || input.reasons.includes("CERTIFICATE_INVALID")) return "BLOCKED";
  if (input.reasons.includes("ACTIVE_DEPLOYMENT_EXISTS")) return "BLOCKED";
  if (input.checkpointStatus === "INVALID" || input.checkpointStatus === "MISSING") return "BLOCKED";
  if (input.snapshot.operatorAction === "ROLLBACK" && input.reasons.length > 0) return "BLOCKED";
  if (input.failureClass) return "FAILED";
  if (input.reasons.includes("NO_PROGRESS_CONTAINMENT_CANDIDATE")) return "STALLED";
  if (input.reasons.some((reason) => reason.endsWith("_MISSING") || reason.includes("NOT_PASSED") || reason.includes("NOT_CLEAN"))) {
    return "DISPUTED";
  }
  if (input.snapshot.state === "PASSED") return "PASSED";
  if (input.snapshot.currentStep || input.snapshot.currentPartition) return "PROGRESSING";
  return "RUNNING";
}

function buildContainment(state: DeploymentState, failureClass?: DeploymentFailureClass): DeploymentContainment {
  const frozen = state === "STALLED" || state === "DISPUTED" || failureClass === "UNKNOWN_FAILURE";
  return Object.freeze({
    frozen,
    preserveEvidence: frozen || state === "FAILED" || state === "BLOCKED",
    blockRetries: frozen,
    blockNewDeploys: frozen || state !== "PASSED",
    blockCancellation: state !== "STALLED" && state !== "FAILED" && state !== "DISPUTED",
  });
}

function buildOperatorPolicy(input: {
  snapshot: DeploymentSnapshot;
  state: DeploymentState;
  failureClass?: DeploymentFailureClass;
  checkpointStatus: string;
  reasons: readonly string[];
  containment: DeploymentContainment;
}): DeploymentOperatorPolicy {
  return Object.freeze({
    deployAllowed:
      input.snapshot.operatorAction === "START_DEPLOY" &&
      input.state === "PASSED" &&
      input.reasons.length === 0,
    retryAllowed:
      input.snapshot.operatorAction === "RETRY" &&
      Boolean(input.failureClass && input.failureClass !== "UNKNOWN_FAILURE") &&
      !input.containment.blockRetries &&
      input.reasons.length === 0,
    resumeAllowed:
      input.snapshot.operatorAction === "RESUME" &&
      input.checkpointStatus === "VALID" &&
      input.reasons.length === 0,
    rollbackAllowed:
      input.snapshot.operatorAction === "ROLLBACK" &&
      Boolean(input.snapshot.certificate) &&
      input.snapshot.logs.length > 0 &&
      input.reasons.length === 0,
    cancelAllowed:
      input.snapshot.operatorAction === "CANCEL" &&
      !input.containment.blockCancellation &&
      input.reasons.length === 0,
  });
}

export function evaluateDeploymentHardening(snapshot: DeploymentSnapshot): DeploymentHardeningEvaluation {
  const classificationReasons: string[] = [];
  const failureClass = classifyFailure(snapshot, classificationReasons);
  const checkpoint = verifyDeploymentCheckpoint(snapshot);
  const reasons = [...new Set([...classificationReasons, ...collectReasons(snapshot, failureClass), ...checkpoint.reasons])];
  let state = deriveState({ snapshot, failureClass, reasons, checkpointStatus: checkpoint.status });

  const overrun = evaluateDeploymentOverrun({
    workflowId: snapshot.workflowId,
    workflowName: snapshot.workflowId,
    runId: snapshot.workflowRunId,
    commitSha: snapshot.commitSHA,
    startedAt: snapshot.startedAt,
    updatedAt: snapshot.updatedAt,
    observedAt: snapshot.observedAt,
    lastProgressAt: snapshot.lastProgressAt,
    heartbeatAt: snapshot.heartbeatAt,
    activeJob: snapshot.currentPartition,
    activeStep: snapshot.currentStep,
    releaseGatePassed: snapshot.certificateStatus === "VALID",
    approvalLineage: snapshot.certificate?.approvalLineage || [],
    logs: snapshot.logs,
    artifacts: snapshot.artifacts,
    certification: snapshot.certificate
      ? {
          certificateHash: snapshot.certificate.certificateHash,
          releaseId: snapshot.deploymentId,
          governanceStatus: snapshot.certificate.governanceStatus,
          residueResult: snapshot.certificate.residueStatus,
          artifactHash: snapshot.artifacts[0]?.hash || "",
          commitSha: snapshot.certificate.commitSHA,
        }
      : undefined,
    replay: snapshot.replay,
    sourceStatus: failureClass ? "failure" : undefined,
    failureSignal: snapshot.failureSignal,
    failureClassification: failureClass === "TIMEOUT_FAILURE" ? "TIMEOUT_FAILURE" : failureClass,
  });
  if (overrun.state === "STALLED") state = "STALLED";

  const containment = buildContainment(state, failureClass);
  const telemetry = buildDeploymentTelemetry({ snapshot, failureClass });
  const operatorActions = buildOperatorPolicy({
    snapshot,
    state,
    failureClass,
    checkpointStatus: checkpoint.status,
    reasons,
    containment,
  });
  const stateTransitions = Object.freeze([
    Object.freeze({
      from: snapshot.state || "RUNNING",
      to: state,
      at: snapshot.observedAt,
      reason: reasons[0] || "DEPLOYMENT_HARDENING_EVALUATED",
    }),
  ]);
  const evidence = freezeDeploymentEvidence({
    evidenceVersion: "1.0",
    deploymentId: snapshot.deploymentId,
    workflowId: snapshot.workflowId,
    workflowRunId: snapshot.workflowRunId,
    commitSHA: snapshot.commitSHA,
    state,
    failureClass,
    telemetry,
    certificate: snapshot.certificate,
    checkpoint,
    logs: [...snapshot.logs],
    artifacts: [...snapshot.artifacts],
    stateTransitions,
    reasons,
  });
  const ok =
    reasons.length === 0 &&
    state !== "STALLED" &&
    state !== "BLOCKED" &&
    state !== "DISPUTED" &&
    state !== "FAILED";

  return Object.freeze({
    ok,
    state,
    failureClass,
    reasons: Object.freeze(reasons),
    telemetry,
    checkpoint,
    containment,
    operatorActions,
    evidence,
  });
}
