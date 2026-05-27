import { sanitizeStartupError } from "./logSanitizer";

type StartupEvent = {
  type: string;
  status: "passed" | "failed";
  durationMs: number;
  details?: Record<string, unknown>;
  timestamp: string;
};

const events: StartupEvent[] = [];

export function resetStartupTelemetry() {
  events.splice(0, events.length);
}

export function recordStartupEvent(input: Omit<StartupEvent, "timestamp">) {
  events.push({
    ...input,
    details: sanitizeStartupError({ context: input.details }).context,
    timestamp: new Date().toISOString(),
  });
}

export function getStartupTelemetrySnapshot() {
  return {
    totalAttempts: events.length,
    failedAttempts: events.filter((event) => event.status === "failed").length,
    passedAttempts: events.filter((event) => event.status === "passed").length,
    events: [...events],
  };
}
