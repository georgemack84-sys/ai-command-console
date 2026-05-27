import type {
  DependencyValidationError,
  DependencyValidationWarning,
  SequentialDependencyErrorCode,
} from "./dependency-types";

export function createDependencyError(
  code: SequentialDependencyErrorCode,
  message: string,
  stepId?: string,
  path?: string[],
): DependencyValidationError {
  return {
    code,
    message,
    stepId,
    path,
  };
}

export function createDependencyWarning(
  code: string,
  message: string,
  stepId?: string,
  path?: string[],
): DependencyValidationWarning {
  return {
    code,
    message,
    stepId,
    path,
  };
}
