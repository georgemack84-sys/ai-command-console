import {
  calculateDeploymentTimeSignals,
  classifyDeploymentFailure,
  deriveDeploymentOverrunState,
  isDeploymentActive,
} from "./deploymentOverrunClassifier";
import { buildContainmentDecision, buildOperatorActionPolicy } from "./deploymentOverrunContainment";
import { buildDeploymentOverrunEvidence } from "./deploymentOverrunEvidence";
import { buildDeploymentOverrunTelemetry } from "./deploymentOverrunTelemetry";
import type { DeploymentOverrunEvaluation, DeploymentOverrunSnapshot } from "./types";

function hasMissingLogs(snapshot: DeploymentOverrunSnapshot) {
  return !snapshot.logs || snapshot.logs.length === 0;
}

function hasReplayDispute(snapshot: DeploymentOverrunSnapshot) {
  return Boolean(
    snapshot.replay?.runtimeHash &&
      snapshot.replay?.replayHash &&
      snapshot.replay.runtimeHash !== snapshot.replay.replayHash,
  );
}

function collectEvidenceReasons(snapshot: DeploymentOverrunSnapshot) {
  const reasons: string[] = [];

  if (hasMissingLogs(snapshot)) reasons.push("LOG_EVIDENCE_MISSING");
  if (!snapshot.heartbeatAt) reasons.push("HEARTBEAT_MISSING");
  if (!snapshot.approvalLineage || snapshot.approvalLineage.length === 0) {
    reasons.push("APPROVAL_LINEAGE_MISSING");
  }
  if (!snapshot.replay?.replayBundlePresent) reasons.push("REPLAY_EVIDENCE_MISSING");
  if (hasReplayDispute(snapshot)) reasons.push("RUNTIME_REPLAY_MISMATCH");
  if (snapshot.certification && snapshot.certification.commitSha !== snapshot.commitSha) {
    reasons.push("CERTIFICATION_COMMIT_MISMATCH");
  }
  if (snapshot.certification && snapshot.certification.governanceStatus !== "PASSED") {
    reasons.push("CERTIFICATION_GOVERNANCE_NOT_PASSED");
  }
  if (snapshot.certification && snapshot.certification.residueResult !== "CLEAN") {
    reasons.push("CERTIFICATION_RESIDUE_NOT_CLEAN");
  }

  return reasons;
}

function collectOperatorReasons(snapshot: DeploymentOverrunSnapshot, reasons: string[]) {
  if (snapshot.releaseGatePassed !== true) {
    reasons.push("RELEASE_GATE_NOT_PASSED");
  }
  if (
    snapshot.operatorAction === "START_DEPLOY" &&
    snapshot.activeDeployment &&
    isDeploymentActive(snapshot.activeDeployment.state)
  ) {
    reasons.push("DUPLICATE_DEPLOYMENT_ATTEMPT");
  }
  if (
    snapshot.operatorAction === "RETRY" &&
    (!snapshot.failureClassification || snapshot.failureClassification === "UNKNOWN_FAILURE")
  ) {
    reasons.push("RETRY_REQUIRES_CLASSIFICATION");
  }
}

function collectCancellationReasons(snapshot: DeploymentOverrunSnapshot, state: string, reasons: string[]) {
  const signals = calculateDeploymentTimeSignals(snapshot);
  const unsafe =
    state === "STALLED" ||
    state === "TIMEOUT_FAILURE" ||
    state === "DISPUTED" ||
    state === "FAILED" ||
    state === "POSSIBLY_STUCK" ||
    signals.noProgressMinutes >= 30;

  if (snapshot.operatorAction === "CANCEL" && !unsafe) {
    reasons.push("CANCELLATION_REQUIRES_STUCK_FAILED_OR_UNSAFE_EVIDENCE");
  }
}

function evidenceStatus(reasons: readonly string[]) {
  if (reasons.some((reason) => reason.includes("MISMATCH") || reason.includes("DISPUTE"))) {
    return "DISPUTED" as const;
  }
  if (reasons.some((reason) => reason.includes("MISSING"))) {
    return "MISSING" as const;
  }
  return "PRESENT" as const;
}

export function evaluateDeploymentOverrun(snapshot: DeploymentOverrunSnapshot): DeploymentOverrunEvaluation {
  const reasons = collectEvidenceReasons(snapshot);
  collectOperatorReasons(snapshot, reasons);
  const classification = classifyDeploymentFailure(snapshot, reasons);
  let state = deriveDeploymentOverrunState({ snapshot, reasons, classification });
  collectCancellationReasons(snapshot, state, reasons);
  state = deriveDeploymentOverrunState({ snapshot, reasons, classification });

  const containment = buildContainmentDecision({ state, classification });
  const telemetry = buildDeploymentOverrunTelemetry({
    snapshot,
    state,
    classification,
    evidenceStatus: evidenceStatus(reasons),
  });
  const operatorActions = buildOperatorActionPolicy({
    snapshot,
    state,
    classification,
    containment,
    reasons,
  });
  const { evidence, evidenceLedgerEntry } = buildDeploymentOverrunEvidence({
    snapshot,
    state,
    classification,
    containment,
    reasons,
    telemetry,
  });
  const ok =
    reasons.length === 0 &&
    !containment.frozen &&
    state !== "FAILED" &&
    state !== "BLOCKED" &&
    state !== "DISPUTED" &&
    state !== "TIMEOUT_FAILURE";

  return Object.freeze({
    ok,
    state,
    classification,
    reasons: Object.freeze([...new Set(reasons)]),
    telemetry,
    containment,
    operatorActions,
    evidence,
    evidenceLedgerEntry,
  });
}
