import type { ExecutionTruthPackage } from "./execution-truth-types";

function deepFreeze<T>(value: T): Readonly<T> {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    if (Array.isArray(value)) {
      for (const item of value) {
        deepFreeze(item);
      }
    } else {
      for (const nested of Object.values(value)) {
        deepFreeze(nested);
      }
    }
  }
  return value as Readonly<T>;
}

export function freezeExecutionTruthPackage<T extends ExecutionTruthPackage>(value: T): Readonly<T> {
  return deepFreeze(value);
}
