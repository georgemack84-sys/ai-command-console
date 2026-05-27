import type { CompatibilityViolation, ExecutionCompatibilityErrorCode } from "./execution-compatibility-types";

export function createCompatibilityViolation(
  code: ExecutionCompatibilityErrorCode,
  message: string,
  path?: string,
  severity: CompatibilityViolation["severity"] = "BLOCKING",
): CompatibilityViolation {
  return { code, message, path, severity };
}
