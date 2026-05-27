import { emitStructuredLogEvent } from "../observability/structuredLogger";
import { redactConfig } from "./redactConfig";
import { recordStartupEvent } from "./startupTelemetry";

export function recordStartupObservation({
  type,
  status,
  durationMs,
  details,
}: {
  type: string;
  status: "passed" | "failed";
  durationMs: number;
  details?: Record<string, unknown>;
}) {
  const safeDetails = redactConfig(details || {});
  recordStartupEvent({ type, status, durationMs, details: safeDetails });
  emitStructuredLogEvent({
    level: status === "failed" ? "ERROR" : "INFO",
    category: "health",
    message: `startup.${type}.${status}`,
    source: "startup-governor",
    metadata: safeDetails,
  });
}
