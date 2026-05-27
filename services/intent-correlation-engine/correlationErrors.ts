import type { CorrelationErrorCode, IntentCorrelationError } from "@/types/intent-correlation-engine";

export function createCorrelationError(
  code: CorrelationErrorCode,
  message: string,
  path?: string,
): IntentCorrelationError {
  return Object.freeze({ code, message, path });
}
