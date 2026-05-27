import type { TimelineProjection } from "@/types/step-trace-viewer";
import type { ValidationPipelineOutput } from "@/services/validation-core";
import { hashTraceViewerValue } from "./traceViewHasher";

function errorCodeForEvent(validation: ValidationPipelineOutput, eventType: string, validator?: string): string | undefined {
  if (!validator || !eventType.endsWith(".failed")) {
    return undefined;
  }
  return validation.result.validators[validator as keyof typeof validation.result.validators]?.failureCode;
}

export function projectTimeline(
  validation: ValidationPipelineOutput,
): TimelineProjection {
  const eventById = new Map(validation.events.map((event) => [event.eventId, event]));
  const events = validation.timeline.events
    .map((eventId) => eventById.get(eventId))
    .filter((event): event is NonNullable<typeof event> => Boolean(event))
    .map((event) => Object.freeze({
      eventId: event.eventId,
      eventType: event.eventType,
      timestamp: event.timestamp,
      monotonicSequence: event.monotonicSequence,
      validator: event.validator,
      parentEventId: event.parentEventId,
      rootEventId: event.rootEventId,
      severity: event.severity,
      evidenceHash: event.payloadHash,
      errorCode: errorCodeForEvent(validation, event.eventType, event.validator),
    }));

  return Object.freeze({
    timelineId: validation.timeline.timelineId,
    rootEventId: validation.timeline.rootEventId,
    events: Object.freeze(events),
    deterministic: validation.timeline.deterministic,
    visibleEventCount: events.length,
    timelineHash: hashTraceViewerValue("trace-timeline-projection", {
      timelineId: validation.timeline.timelineId,
      events,
      reconstructedStateHash: validation.timeline.reconstructedStateHash,
    }),
  });
}
