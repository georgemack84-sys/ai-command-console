import type {
  DeploymentFailureClassification,
  DeploymentOverrunSnapshot,
  DeploymentOverrunState,
} from "./types";

const ACTIVE_STATES = new Set(["RUNNING", "ACTIVE_SLOW", "OBSERVE_ONLY", "POSSIBLE_STUCK", "POSSIBLY_STUCK"]);
const ALLOWED_STATES = new Set([
  "RUNNING",
  "ACTIVE_SLOW",
  "OBSERVE_ONLY",
  "POSSIBLE_STUCK",
  "STALLED",
  "TIMEOUT_FAILURE",
  "POSSIBLY_STUCK",
  "FAILED",
  "DISPUTED",
  "PASSED",
  "BLOCKED",
]);

function minutesBetween(start: string, end: string) {
  return Math.max(0, Math.floor((Date.parse(end) - Date.parse(start)) / 60_000));
}

export function calculateDeploymentTimeSignals(snapshot: DeploymentOverrunSnapshot) {
  const elapsedMinutes = minutesBetween(snapshot.startedAt, snapshot.observedAt);
  const heartbeatAge = snapshot.heartbeatAt ? minutesBetween(snapshot.heartbeatAt, snapshot.observedAt) : null;
  const progressAnchor = snapshot.lastProgressAt || snapshot.updatedAt;
  const noProgressMinutes = minutesBetween(progressAnchor, snapshot.observedAt);

  return {
    elapsedMinutes,
    heartbeatAge,
    noProgressMinutes,
    progressFresh: noProgressMinutes < 10,
  } as const;
}

function classifyFromSignal(snapshot: DeploymentOverrunSnapshot): DeploymentFailureClassification | undefined {
  const raw = `${snapshot.sourceStatus || ""} ${snapshot.failureSignal || ""}`.toLowerCase();
  if (!raw.trim()) return undefined;
  if (raw.includes("cancel")) return "OPERATOR_INTERRUPTED";
  if (raw.includes("timeout") || raw.includes("timed_out")) return "TIMEOUT_FAILURE";
  if (raw.includes("network") || raw.includes("econnreset") || raw.includes("scp") || raw.includes("ssh")) {
    return "INFRA_FAILURE";
  }
  if (raw.includes("assert") || raw.includes("test failed")) return "TEST_FAILURE";
  if (raw.includes("governance")) return "GOVERNANCE_FAILURE";
  if (raw.includes("env") || raw.includes("secret") || raw.includes("config")) return "ENV_FAILURE";
  if (raw.includes("fail")) return "UNKNOWN_FAILURE";
  return undefined;
}

export function classifyDeploymentFailure(snapshot: DeploymentOverrunSnapshot, reasons: string[]) {
  const inferred = classifyFromSignal(snapshot);
  const provided = snapshot.failureClassification;

  if (provided && inferred && provided !== inferred) {
    reasons.push("CLASSIFICATION_MISMATCH");
    return "UNKNOWN_FAILURE" as const;
  }

  return provided || inferred;
}

export function deriveDeploymentOverrunState(input: {
  snapshot: DeploymentOverrunSnapshot;
  reasons: readonly string[];
  classification?: DeploymentFailureClassification;
}) : DeploymentOverrunState {
  const { snapshot, reasons, classification } = input;
  const signals = calculateDeploymentTimeSignals(snapshot);

  if (snapshot.state && !ALLOWED_STATES.has(snapshot.state)) return "DISPUTED";
  if (reasons.includes("LOG_EVIDENCE_MISSING")) return "DISPUTED";
  if (reasons.includes("HEARTBEAT_MISSING")) return "DISPUTED";
  if (reasons.includes("REPLAY_EVIDENCE_MISSING")) return "DISPUTED";
  if (reasons.includes("RUNTIME_REPLAY_MISMATCH")) return "DISPUTED";
  if (reasons.includes("CLASSIFICATION_MISMATCH")) return "DISPUTED";
  if (classification === "UNKNOWN_FAILURE") return "DISPUTED";
  if (reasons.includes("DUPLICATE_DEPLOYMENT_ATTEMPT")) return "BLOCKED";
  if (reasons.includes("RELEASE_GATE_NOT_PASSED")) return "BLOCKED";
  if (reasons.includes("CANCELLATION_REQUIRES_STUCK_FAILED_OR_UNSAFE_EVIDENCE")) return "BLOCKED";
  if (classification === "TIMEOUT_FAILURE") return "TIMEOUT_FAILURE";
  if (classification) return "FAILED";
  if (signals.noProgressMinutes >= 30) return "STALLED";
  if (signals.elapsedMinutes >= 105) return signals.progressFresh ? "ACTIVE_SLOW" : "POSSIBLY_STUCK";
  if (signals.elapsedMinutes >= 90) return signals.progressFresh ? "ACTIVE_SLOW" : "POSSIBLE_STUCK";
  if (signals.elapsedMinutes >= 75) return "OBSERVE_ONLY";
  return "RUNNING";
}

export function isDeploymentActive(state: DeploymentOverrunState) {
  return ACTIVE_STATES.has(state);
}
