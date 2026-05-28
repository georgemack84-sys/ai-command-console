import { IntentResolutionState } from "@/types/contextualResolution";
import { evaluatePlannerAdmissionFirewall } from "./plannerAdmissionFirewall";

export function resolvePlannerAdmission(input: {
  semanticValid: boolean;
  governanceApproved: boolean;
  ambiguityDetected: boolean;
  clarificationRequired: boolean;
  protectedTargetDetected: boolean;
  replayDriftDetected: boolean;
  freezeActive: boolean;
  capabilityMatch: boolean;
  plannerEligible: boolean;
  semanticConflicts: string[];
  contextSufficient: boolean;
  conflictingContext: string[];
  unsafeAssumptions: string[];
}) {
  const firewall = evaluatePlannerAdmissionFirewall({
    semanticValid: input.semanticValid,
    governanceApproved: input.governanceApproved,
    ambiguityDetected: input.ambiguityDetected,
    clarificationRequired: input.clarificationRequired,
    protectedTargetDetected: input.protectedTargetDetected,
    replayDriftDetected: input.replayDriftDetected,
    freezeActive: input.freezeActive,
    capabilityMatch: input.capabilityMatch,
    plannerEligible: input.plannerEligible,
    semanticConflicts: input.semanticConflicts,
    contextSufficient: input.contextSufficient,
    conflictingContext: input.conflictingContext,
    unsafeAssumptions: input.unsafeAssumptions,
  });

  const denialReasons = firewall.plannerBlockReasons;
  const escalationRequired = input.protectedTargetDetected || input.unsafeAssumptions.length > 0;
  const state =
    input.freezeActive ? IntentResolutionState.FREEZE_BLOCKED
    : input.replayDriftDetected ? IntentResolutionState.REPLAY_BLOCKED
    : escalationRequired ? IntentResolutionState.REQUIRES_ESCALATION
    : input.clarificationRequired ? IntentResolutionState.REQUIRES_CLARIFICATION
    : !input.contextSufficient ? IntentResolutionState.CONTEXT_INSUFFICIENT
    : firewall.plannerAdmissible ? IntentResolutionState.RESOLVED
    : IntentResolutionState.INVALID;

  return {
    admissible: firewall.plannerAdmissible,
    denialReasons,
    escalationRequired,
    state,
  };
}
