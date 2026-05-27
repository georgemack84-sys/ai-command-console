import { ClarificationSeverity, type ClarificationResolution } from "@/types/clarificationResolution";
import { generateClarificationQuestions } from "./clarificationQuestionGenerator";

export function orchestrateIntentClarification(input: {
  missingContext: string[];
  conflictingContext: string[];
  unsafeAssumptions: string[];
  ambiguityDetected: boolean;
  protectedTargetDetected: boolean;
}) : ClarificationResolution {
  const blockingReasons = Array.from(new Set([
    ...input.missingContext.map((field) => `MISSING_CONTEXT:${field}`),
    ...input.conflictingContext,
    ...input.unsafeAssumptions,
    ...(input.ambiguityDetected ? ["SEMANTIC_AMBIGUITY_DETECTED"] : []),
    ...(input.protectedTargetDetected ? ["PROTECTED_TARGET_ESCALATION_REQUIRED"] : []),
  ]));

  const generatedQuestions = generateClarificationQuestions({
    missingContext: input.missingContext,
    conflictingContext: input.conflictingContext,
    unsafeAssumptions: input.unsafeAssumptions,
    protectedTargetDetected: input.protectedTargetDetected,
  });

  const severity =
    input.protectedTargetDetected || input.unsafeAssumptions.length > 0 ? ClarificationSeverity.CRITICAL
    : input.conflictingContext.length > 0 ? ClarificationSeverity.HIGH
    : input.missingContext.length > 1 ? ClarificationSeverity.MODERATE
    : ClarificationSeverity.LOW;

  return {
    clarificationRequired: blockingReasons.length > 0,
    generatedQuestions,
    blockingReasons,
    severity,
  };
}
