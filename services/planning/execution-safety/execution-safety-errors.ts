import type { ExecutionSafetyViolation } from "./execution-safety-types";

export function createExecutionSafetyViolation(
  code: ExecutionSafetyViolation["code"],
  message: string,
  path?: string[],
): ExecutionSafetyViolation {
  return {
    code,
    message,
    path,
  };
}
