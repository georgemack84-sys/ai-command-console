import type { StructuredIntent } from "@/types/intentContracts";
import type { CanonicalIntent } from "@/types/semanticResolution";
import { IntentResolutionState } from "@/types/contextualResolution";
import { detectContextualConflicts } from "./contextualConflictDetector";
import { resolveIntentContextRequirements } from "./intentContextRequirements";
import { detectUnsafeAssumptions } from "./unsafeAssumptionDetector";

export function resolveIntentAmbiguity(input: {
  structuredIntent: StructuredIntent;
  canonicalIntent: CanonicalIntent;
}) {
  const contextRequirements = resolveIntentContextRequirements(input);
  const conflicts = detectContextualConflicts(input);
  const unsafe = detectUnsafeAssumptions(input);
  const ambiguityDetected =
    input.canonicalIntent.clarificationRequired
    || input.canonicalIntent.ambiguities.length > 0
    || contextRequirements.missingContext.length > 0
    || conflicts.conflictingContext.length > 0
    || unsafe.unsafeAssumptions.length > 0;

  const state =
    unsafe.unsafeAssumptions.length > 0 ? IntentResolutionState.REQUIRES_ESCALATION
    : conflicts.conflictingContext.length > 0 ? IntentResolutionState.AMBIGUOUS
    : contextRequirements.contextSufficient ? IntentResolutionState.RESOLVED
    : IntentResolutionState.CONTEXT_INSUFFICIENT;

  return {
    ambiguityDetected,
    state,
    missingContext: contextRequirements.missingContext,
    conflictingContext: conflicts.conflictingContext,
    unsafeAssumptions: unsafe.unsafeAssumptions,
    contextSufficient: contextRequirements.contextSufficient,
  };
}
