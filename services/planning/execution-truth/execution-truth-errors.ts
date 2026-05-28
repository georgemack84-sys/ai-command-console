import type { ExecutionTruthError, ExecutionTruthErrorCode } from "./execution-truth-types";

export function createExecutionTruthError(
  code: ExecutionTruthErrorCode,
  message: string,
  details?: Record<string, unknown>,
): ExecutionTruthError {
  return {
    code,
    message,
    details,
  };
}
