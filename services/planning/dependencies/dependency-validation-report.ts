import type { DependencyValidationReport, SequentialDependencyValidationResult } from "./dependency-types";

function deepFreeze<T>(value: T): Readonly<T> {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    if (Array.isArray(value)) {
      for (const entry of value) {
        deepFreeze(entry);
      }
    } else {
      for (const nested of Object.values(value)) {
        deepFreeze(nested);
      }
    }
  }
  return value as Readonly<T>;
}

export function createDependencyValidationReport(
  result: SequentialDependencyValidationResult,
): DependencyValidationReport {
  return deepFreeze(result) as DependencyValidationReport;
}
