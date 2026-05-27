import type {
  BoundedOrchestrationError,
  BoundedOrchestrationInput,
  BoundedOrchestrationTopology,
  BoundedOrchestrationValidation,
  OrchestrationDelegationAnalysis,
  OrchestrationIsolationAssessment,
} from "@/types/bounded-orchestration-framework";

function createError(
  code: BoundedOrchestrationError["code"],
  message: string,
  path?: string,
): BoundedOrchestrationError {
  return Object.freeze({ code, message, path });
}

export function validateBoundedOrchestration(input: {
  orchestrationInput: BoundedOrchestrationInput;
  topology: BoundedOrchestrationTopology;
  topologyErrors: readonly string[];
  boundaryErrors: readonly BoundedOrchestrationError[];
  governanceErrors: readonly BoundedOrchestrationError[];
  transitionErrors: readonly string[];
  delegation: OrchestrationDelegationAnalysis;
  isolation: OrchestrationIsolationAssessment;
}): BoundedOrchestrationValidation {
  const errors: BoundedOrchestrationError[] = [
    ...input.boundaryErrors,
    ...input.governanceErrors,
  ];
  for (const path of input.topologyErrors) {
    errors.push(createError(
      "ORCHESTRATION_BOUNDARY_DYNAMIC_GENERATION",
      "Orchestration topology exceeded constitutional ceilings.",
      path,
    ));
  }
  for (const path of input.transitionErrors) {
    errors.push(createError(
      "ORCHESTRATION_BOUNDARY_HIDDEN_ORCHESTRATION",
      "Execution-like or continuation-like routing markers were detected.",
      path,
    ));
  }
  if (input.delegation.recursive) {
    errors.push(createError(
      "ORCHESTRATION_BOUNDARY_RECURSIVE_DELEGATION",
      "Recursive delegation evidence was detected.",
      "delegation",
    ));
  }
  if (!input.isolation.isolated) {
    errors.push(createError(
      "ORCHESTRATION_BOUNDARY_ISOLATION_LEAKAGE",
      "Cross-boundary orchestration leakage was detected.",
      "isolation",
    ));
  }
  if (!input.orchestrationInput.coordinationRecord.validation.valid) {
    errors.push(createError(
      "ORCHESTRATION_BOUNDARY_GOVERNANCE_MISMATCH",
      "Coordination record was not constitutionally valid upstream.",
      "coordination.validation",
    ));
  }
  if (input.orchestrationInput.containmentValidation.failClosed) {
    errors.push(createError(
      "ORCHESTRATION_BOUNDARY_CONTAINMENT_BYPASS",
      "Containment already failed closed and orchestration cannot elevate above it.",
      "containment.failClosed",
    ));
  }
  if (
    input.orchestrationInput.coordinationRecord.replaySnapshotId !==
    input.orchestrationInput.routingResult.replaySnapshotId
  ) {
    errors.push(createError(
      "ORCHESTRATION_BOUNDARY_REPLAY_AMBIGUITY",
      "Replay snapshot mismatch prevents reconstructive orchestration replay.",
      "replaySnapshotId",
    ));
  }

  const blockedReasons = Object.freeze(errors.map((error) => error.code).sort());
  const failClosed = errors.length > 0 || input.orchestrationInput.containmentValidation.containmentState === "fail_closed";
  return Object.freeze({
    valid: errors.length === 0,
    failClosed,
    replaySafe: errors.every((error) => error.code !== "ORCHESTRATION_BOUNDARY_REPLAY_AMBIGUITY"),
    governanceBound: errors.every((error) => error.code !== "ORCHESTRATION_BOUNDARY_GOVERNANCE_MISMATCH"),
    containmentInherited: input.orchestrationInput.containmentValidation.containmentState,
    recursiveDelegation: input.delegation,
    isolation: input.isolation,
    blockedReasons,
    errors: Object.freeze(errors),
  });
}
