import type {
  ConstitutionalTelemetryInput,
  TelemetryCorrelationRecord,
  ConstitutionalTimelineRecord,
} from "./telemetryStateTypes";
import { correlateTelemetryEvents } from "./telemetryCorrelationEngine";
import { rebuildConstitutionalTimeline } from "./constitutionalTimelineRebuilder";

export function buildAutonomyForensics(input: {
  telemetryInput: ConstitutionalTelemetryInput;
  events: Parameters<typeof correlateTelemetryEvents>[0]["events"];
}): Readonly<{
  correlation: TelemetryCorrelationRecord;
  timeline: ConstitutionalTimelineRecord;
}> {
  return Object.freeze({
    correlation: correlateTelemetryEvents({
      telemetryId: input.telemetryInput.telemetryId,
      events: input.events,
    }),
    timeline: rebuildConstitutionalTimeline(input.telemetryInput),
  });
}
