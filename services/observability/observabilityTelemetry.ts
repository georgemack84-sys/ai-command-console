import type { StructuredLogEvent } from "./observabilityTypes";

type ObservabilityTelemetryState = {
  logs: StructuredLogEvent[];
};

const state: ObservabilityTelemetryState = {
  logs: [],
};

export function resetObservabilityTelemetry() {
  state.logs = [];
}

export function recordObservabilityLogEvent(event: StructuredLogEvent) {
  state.logs.push({ ...event });
}

export function getObservabilityTelemetrySnapshot() {
  return {
    logs: [...state.logs],
  };
}
