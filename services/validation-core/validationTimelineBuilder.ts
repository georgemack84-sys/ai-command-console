import type { ValidationDebugEvent, ValidationTimeline } from "@/types/validation-core";
import type { ValidationFailure } from "./validationTypes";
import { hashValidationCoreValue } from "./validationCoreHasher";

export function buildValidationTimeline(input: {
  validationId: string;
  events: readonly ValidationDebugEvent[];
  generatedAt: string;
  reconstructedStateHash: string;
}): { timeline?: ValidationTimeline; failures: readonly ValidationFailure[] } {
  const failures: ValidationFailure[] = [];
  const sorted = [...input.events].sort((left, right) => {
    if (left.monotonicSequence !== right.monotonicSequence) {
      return left.monotonicSequence - right.monotonicSequence;
    }
    if (left.timestamp !== right.timestamp) {
      return left.timestamp.localeCompare(right.timestamp);
    }
    return left.eventId.localeCompare(right.eventId);
  });

  for (let index = 0; index < sorted.length; index += 1) {
    const expected = index + 1;
    if (index > 0 && sorted[index - 1].monotonicSequence === sorted[index].monotonicSequence) {
      failures.push({
        code: "VALIDATION_SEQUENCE_COLLISION",
        message: "duplicate monotonic sequence detected",
        path: sorted[index].eventId,
        expected: sorted[index - 1].eventId,
        actual: sorted[index].eventId,
      });
    }
    if (sorted[index].monotonicSequence !== expected) {
      failures.push({
        code: "VALIDATION_TIMELINE_GAP",
        message: "missing event sequence detected",
        path: sorted[index].eventId,
        expected,
        actual: sorted[index].monotonicSequence,
      });
      break;
    }
  }

  if (sorted.length === 0) {
    failures.push({
      code: "VALIDATION_TIMELINE_GAP",
      message: "no event history available",
      path: "events",
    });
  }

  const rootEventId = sorted[0]?.rootEventId ?? sorted[0]?.eventId;
  if (!rootEventId) {
    failures.push({
      code: "VALIDATION_EVENT_AMBIGUITY",
      message: "root event is ambiguous",
      path: "events.root",
    });
  }

  if (failures.length > 0) {
    return { failures };
  }

  const timelineId = hashValidationCoreValue("validation-timeline-id", {
    validationId: input.validationId,
    rootEventId,
  });
  const timeline: ValidationTimeline = Object.freeze({
    timelineId,
    validationId: input.validationId,
    rootEventId,
    events: Object.freeze(sorted.map((event) => event.eventId)),
    reconstructedStateHash: input.reconstructedStateHash,
    deterministic: true,
    generatedAt: input.generatedAt,
    timelineHash: hashValidationCoreValue("validation-timeline", {
      timelineId,
      validationId: input.validationId,
      rootEventId,
      events: sorted.map((event) => event.eventId),
      reconstructedStateHash: input.reconstructedStateHash,
    }),
  });

  return { timeline, failures: [] };
}
