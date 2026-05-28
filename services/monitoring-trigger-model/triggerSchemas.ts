import type { MonitoringTrigger, MonitoringTriggerError, RuntimeObservationSnapshot } from "@/types/monitoring-trigger-model";
import { createTriggerError } from "./triggerErrors";

const TRIGGER_TYPES = new Set<MonitoringTrigger["triggerType"]>([
  "drift",
  "risk",
  "replay",
  "governance",
  "runtime",
  "confidence",
]);

export function validateMonitoringTrigger(trigger: MonitoringTrigger): readonly MonitoringTriggerError[] {
  const errors: MonitoringTriggerError[] = [];
  if (!TRIGGER_TYPES.has(trigger.triggerType)) {
    errors.push(createTriggerError("TRIGGER_TYPE_INVALID", "Unknown trigger type is unsafe.", "triggerType"));
  }
  if (!Number.isFinite(trigger.confidenceScore) || trigger.confidenceScore < 0 || trigger.confidenceScore > 1) {
    errors.push(createTriggerError("TRIGGER_CONFIDENCE_INVALID", "Confidence score must remain within 0..1.", "confidenceScore"));
  }
  return Object.freeze(errors);
}

export function validateRuntimeObservation(observation?: RuntimeObservationSnapshot): readonly MonitoringTriggerError[] {
  const errors: MonitoringTriggerError[] = [];
  if (!observation) {
    return Object.freeze(errors);
  }
  if (!Number.isFinite(observation.queueDepth) || observation.queueDepth < 0) {
    errors.push(createTriggerError("TRIGGER_CONFIDENCE_INVALID", "Queue depth must be finite and non-negative.", "queueDepth"));
  }
  if (!Number.isFinite(observation.retryRate) || observation.retryRate < 0) {
    errors.push(createTriggerError("TRIGGER_CONFIDENCE_INVALID", "Retry rate must be finite and non-negative.", "retryRate"));
  }
  return Object.freeze(errors);
}
