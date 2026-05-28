import type {
  TelemetryCorrelationRecord,
  TelemetryEvent,
} from "./telemetryStateTypes";
import { hashConstitutionalTelemetryValue } from "./telemetryHashingEngine";

export function correlateTelemetryEvents(input: {
  telemetryId: string;
  events: readonly TelemetryEvent[];
}): TelemetryCorrelationRecord {
  const triggeredEvents = input.events.filter((event) => event.triggered);
  const eventHashes = Object.freeze(triggeredEvents.map((event) => event.deterministicHash).sort());
  const correlatedDomains = Object.freeze(triggeredEvents.map((event) => event.domain).sort());
  return Object.freeze({
    correlationId: hashConstitutionalTelemetryValue("constitutional-telemetry-correlation-id", input.telemetryId),
    telemetryId: input.telemetryId,
    eventHashes,
    correlatedDomains,
    correlationHash: hashConstitutionalTelemetryValue("constitutional-telemetry-correlation", {
      telemetryId: input.telemetryId,
      eventHashes,
      correlatedDomains,
    }),
  });
}
