import { buildViolationEvent, hashOperationalEvidence } from "./operationalEvidence";
import type {
  OperationalRuleEvaluation,
  OperationalRuleEvaluationInput,
  OperationalRuleId,
  OperationalState,
  ViolationEvent,
} from "./types";

function hasReplayMismatch(input: OperationalRuleEvaluationInput) {
  return Boolean(
    input.replay?.runtimeHash &&
      input.replay?.replayHash &&
      input.replay.runtimeHash !== input.replay.replayHash,
  );
}

function hasReplayAbsenceForDeployment(input: OperationalRuleEvaluationInput) {
  if (!input.deployRequested) {
    return false;
  }
  return (
    input.replay?.replayBundlePresent !== true ||
    !input.replay.runtimeHash ||
    !input.replay.replayHash
  );
}

function hasHiddenMutation(input: OperationalRuleEvaluationInput) {
  return input.mutation?.attempted === true && input.mutation.visible !== true;
}

function hasUnclassifiedRetry(input: OperationalRuleEvaluationInput) {
  return (
    input.retryRequested === true &&
    (!input.failureClassification || input.failureClassification === "UNKNOWN_FAILURE")
  );
}

function hasUnsafeRecovery(input: OperationalRuleEvaluationInput) {
  return (
    input.recoveryRequested === true &&
    (input.stateBefore === "DISPUTED" ||
      input.stateBefore === "UNKNOWN" ||
      !input.failureClassification ||
      input.failureClassification === "UNKNOWN_FAILURE")
  );
}

function deriveAuthorityState(input: OperationalRuleEvaluationInput, violations: ViolationEvent[]): OperationalState {
  if (
    input.stateBefore === "UNKNOWN" ||
    input.stateAfter === "UNKNOWN" ||
    input.failureClassification === "UNKNOWN_FAILURE" ||
    hasReplayMismatch(input)
  ) {
    return "DISPUTED";
  }
  if (input.stateBefore === "DISPUTED" || input.stateAfter === "DISPUTED") {
    return "DISPUTED";
  }
  if (violations.length > 0) {
    return "BLOCKED";
  }
  return input.stateAfter;
}

function addViolation(
  violations: ViolationEvent[],
  input: OperationalRuleEvaluationInput,
  ruleId: OperationalRuleId,
  ruleEvidence: Record<string, unknown>,
) {
  violations.push(
    buildViolationEvent({
      request: input,
      ruleEvidence,
      ruleId,
    }),
  );
}

export function evaluateOperationalRules(
  input: OperationalRuleEvaluationInput,
): OperationalRuleEvaluation {
  const violations: ViolationEvent[] = [];

  if (input.stateBefore === "UNKNOWN" || input.stateAfter === "UNKNOWN") {
    addViolation(violations, input, "UNKNOWN_UNSAFE", {
      stateAfter: input.stateAfter,
      stateBefore: input.stateBefore,
    });
  }

  if (
    (input.deployRequested === true || hasUnsafeRecovery(input)) &&
    (input.stateBefore === "DISPUTED" ||
      input.stateAfter === "DISPUTED" ||
      input.stateBefore === "UNKNOWN" ||
      input.stateAfter === "UNKNOWN")
  ) {
    addViolation(violations, input, "DISPUTED_NON_DEPLOYABLE", {
      deployRequested: input.deployRequested === true,
      recoveryRequested: input.recoveryRequested === true,
      stateAfter: input.stateAfter,
      stateBefore: input.stateBefore,
    });
  }

  if (hasUnclassifiedRetry(input)) {
    addViolation(violations, input, "RETRY_REQUIRES_CLASSIFICATION", {
      failureClassification: input.failureClassification ?? null,
      retryRequested: input.retryRequested === true,
    });
  }

  if (input.deployRequested === true && input.releaseGatePassed !== true) {
    addViolation(violations, input, "RELEASE_GATE_REQUIRED", {
      releaseGatePassed: input.releaseGatePassed ?? null,
    });
  }

  if (hasHiddenMutation(input)) {
    addViolation(violations, input, "NO_HIDDEN_STATE_MUTATION", {
      mutation: input.mutation,
    });
  }

  if (hasReplayMismatch(input) || hasReplayAbsenceForDeployment(input)) {
    addViolation(violations, input, "REPLAY_REMAINS_AUTHORITATIVE", {
      replay: input.replay ?? null,
    });
  }

  const authorityState = deriveAuthorityState(input, violations);
  const deployable =
    input.deployRequested === true &&
    violations.length === 0 &&
    authorityState === "PASSED" &&
    input.releaseGatePassed === true;
  const retryAllowed =
    input.retryRequested === true &&
    violations.length === 0 &&
    Boolean(input.failureClassification) &&
    input.failureClassification !== "UNKNOWN_FAILURE";
  const evidenceHash = hashOperationalEvidence({
    authorityState,
    deployable,
    retryAllowed,
    violations,
    workflowId: input.workflowId,
  });

  return Object.freeze({
    ok: violations.length === 0,
    authorityState,
    deployable,
    retryAllowed,
    violations: Object.freeze([...violations]),
    evidenceHash,
  });
}
