import type {
  PlanNormalizationError,
  PlanNormalizationErrorCode,
} from "./normalization-types";

export function createNormalizationError(
  code: PlanNormalizationErrorCode,
  message: string,
  details?: Record<string, unknown>,
): PlanNormalizationError {
  return {
    code,
    message,
    details,
  };
}
