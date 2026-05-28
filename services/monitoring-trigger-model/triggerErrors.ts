import type { MonitoringTriggerError, MonitoringTriggerErrorCode } from "@/types/monitoring-trigger-model";

export function createTriggerError(
  code: MonitoringTriggerErrorCode,
  message: string,
  path?: string,
): MonitoringTriggerError {
  return Object.freeze({ code, message, path });
}
