import { createId } from "@/lib/civitas/eventBus";
import type { CivitasEvent, ProvingEvidence, TelemetryRecord } from "@/lib/civitas/types";

const evidence: ProvingEvidence[] = [];
const telemetry: TelemetryRecord[] = [];

export function recordEvidence(workflow: string, event: CivitasEvent, payload: Record<string, unknown> = {}) {
  const item: ProvingEvidence = {
    id: createId("evidence"),
    workflow,
    eventId: event.id,
    replayId: event.replayId,
    qualificationId: createId("qual"),
    timestamp: new Date().toISOString(),
    payload,
  };
  evidence.unshift(item);
  evidence.splice(100);
  return item;
}

export async function withTelemetry<T>(
  component: string,
  operation: string,
  correlationId: string,
  replayId: string,
  qualificationId: string,
  action: () => Promise<T>,
) {
  const started = Date.now();
  try {
    const result = await action();
    telemetry.unshift({
      component,
      operation,
      durationMs: Date.now() - started,
      success: true,
      timestamp: new Date().toISOString(),
      correlationId,
      replayId,
      qualificationId,
    });
    telemetry.splice(100);
    return result;
  } catch (error) {
    telemetry.unshift({
      component,
      operation,
      durationMs: Date.now() - started,
      success: false,
      failure: error instanceof Error ? error.message : "Unknown failure",
      timestamp: new Date().toISOString(),
      correlationId,
      replayId,
      qualificationId,
    });
    telemetry.splice(100);
    throw error;
  }
}

export function listEvidence() {
  return [...evidence];
}

export function listTelemetry() {
  return [...telemetry];
}
