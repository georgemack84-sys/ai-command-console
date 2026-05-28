import { resolveValidationCausality, type ValidationPipelineOutput } from "@/services/validation-core";
import type { ForensicProjection, TraceViewerError } from "@/types/step-trace-viewer";

export function projectForensics(
  validation: ValidationPipelineOutput,
): { projection?: ForensicProjection; errors: readonly TraceViewerError[] } {
  if (!validation.forensics) {
    return {
      errors: Object.freeze([{
        code: "TRACE_FORENSICS_UNAVAILABLE",
        message: "forensic explanation is unavailable",
        path: "validation.forensics",
      }]),
    };
  }

  const causality = resolveValidationCausality(validation.events);
  const failedEvent = validation.events.find((event) => event.eventType.endsWith(".failed"));
  const chain = failedEvent
    ? [failedEvent.rootEventId ?? failedEvent.eventId, failedEvent.parentEventId, failedEvent.eventId].filter((value): value is string => Boolean(value))
    : [...causality.roots];

  return {
    projection: Object.freeze({
      rootFailure: validation.forensics.summary,
      failingValidator: validation.forensics.failedValidator,
      failureCategory: validation.forensics.failureCode,
      causalityChain: Object.freeze(chain),
      status: validation.result.status,
      explanationHash: validation.forensics.explanationHash,
    }),
    errors: Object.freeze([]),
  };
}
