import type {
  DeploymentContainmentDecision,
  DeploymentFailureClassification,
  DeploymentOperatorActionPolicy,
  DeploymentOverrunState,
  DeploymentOverrunSnapshot,
} from "./types";

function requiresContainment(state: DeploymentOverrunState, classification?: DeploymentFailureClassification) {
  return (
    state === "POSSIBLY_STUCK" ||
    state === "STALLED" ||
    state === "TIMEOUT_FAILURE" ||
    state === "DISPUTED" ||
    classification === "UNKNOWN_FAILURE"
  );
}

export function buildContainmentDecision(input: {
  state: DeploymentOverrunState;
  classification?: DeploymentFailureClassification;
}): DeploymentContainmentDecision {
  const frozen = requiresContainment(input.state, input.classification);
  return Object.freeze({
    frozen,
    blockRetries: frozen,
    blockNewDeploys: frozen || input.state !== "PASSED",
    blockForcePushAutomation: frozen,
    preserveLogs: frozen,
    preserveArtifacts: frozen,
    preserveCertificationLineage: frozen,
  });
}

export function buildOperatorActionPolicy(input: {
  snapshot: DeploymentOverrunSnapshot;
  state: DeploymentOverrunState;
  classification?: DeploymentFailureClassification;
  containment: DeploymentContainmentDecision;
  reasons: readonly string[];
}): DeploymentOperatorActionPolicy {
  const retryClassified = Boolean(input.classification && input.classification !== "UNKNOWN_FAILURE");
  const unsafeEvidence = input.containment.frozen || input.state === "FAILED" || input.state === "BLOCKED";
  const cancelRequested = input.snapshot.operatorAction === "CANCEL";

  return Object.freeze({
    retryAllowed:
      input.snapshot.operatorAction === "RETRY" &&
      retryClassified &&
      !input.containment.blockRetries &&
      input.reasons.length === 0,
    newDeployAllowed:
      input.snapshot.operatorAction === "START_DEPLOY" &&
      input.state === "PASSED" &&
      !input.containment.blockNewDeploys &&
      input.reasons.length === 0,
    cancelAllowed: cancelRequested && unsafeEvidence && !input.reasons.includes("CANCELLATION_REQUIRES_STUCK_FAILED_OR_UNSAFE_EVIDENCE"),
    forcePushAutomationAllowed:
      input.snapshot.operatorAction === "FORCE_PUSH_AUTOMATION" &&
      !input.containment.blockForcePushAutomation &&
      input.reasons.length === 0,
  });
}
