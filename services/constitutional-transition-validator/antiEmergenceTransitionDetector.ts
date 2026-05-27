import type { ConstitutionalTransitionInput, ConstitutionalTransitionError } from "./types/constitutionalTransitionTypes";
import { ConstitutionalTransitionErrorCode } from "./types/constitutionalTransitionTypes";

function hasRecursiveSignal(input: ConstitutionalTransitionInput): boolean {
  return input.sourceState === input.targetState
    || input.transitionReason.toLowerCase().includes("recursive")
    || input.metadata?.recursiveTransitionChain === true
    || input.metadata?.recursiveReplayLoop === true;
}

function hasSynthesisSignal(input: ConstitutionalTransitionInput): boolean {
  return input.metadata?.syntheticReplay === true
    || input.metadata?.transitionSynthesis === true
    || input.transitionReason.toLowerCase().includes("synth");
}

function hasHiddenTransitionSignal(input: ConstitutionalTransitionInput): boolean {
  return input.hiddenExecutionDetectionResult.report.blocked
    || input.hiddenExecutionDetectionResult.report.detectedVectors.length > 0
    || input.metadata?.hiddenLifecycleMutation === true
    || input.metadata?.undeclaredBranching === true;
}

function hasAuthorityEscalationSignal(input: ConstitutionalTransitionInput): boolean {
  return input.metadata?.authorityEscalation === true
    || input.transitionReason.toLowerCase().includes("elevat")
    || input.hiddenExecutionDetectionResult.report.detectedVectors.includes("authority_expansion_path");
}

export function detectTransitionAntiEmergence(
  input: ConstitutionalTransitionInput,
): readonly ConstitutionalTransitionError[] {
  const errors: ConstitutionalTransitionError[] = [];
  if (hasHiddenTransitionSignal(input)) {
    errors.push({
      code: ConstitutionalTransitionErrorCode.HIDDEN_TRANSITION_DETECTED,
      message: "Hidden lifecycle mutation or execution-linked transition semantics were detected.",
      path: "hiddenExecutionDetectionResult.report",
    });
  }
  if (hasSynthesisSignal(input)) {
    errors.push({
      code: ConstitutionalTransitionErrorCode.TRANSITION_SYNTHESIS_DETECTED,
      message: "Synthetic transition reconstruction is forbidden.",
      path: "metadata.transitionSynthesis",
    });
  }
  if (hasAuthorityEscalationSignal(input)) {
    errors.push({
      code: ConstitutionalTransitionErrorCode.AUTHORITY_ESCALATION_DETECTED,
      message: "Authority escalation semantics are constitutionally forbidden in transition validation.",
      path: "metadata.authorityEscalation",
    });
  }
  if (hasRecursiveSignal(input)) {
    errors.push({
      code: ConstitutionalTransitionErrorCode.RECURSIVE_TRANSITION_CHAIN,
      message: "Recursive transition chain detected.",
      path: "transitionReason",
    });
  }
  return Object.freeze(errors);
}
