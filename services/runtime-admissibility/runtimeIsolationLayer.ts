import type {
  RuntimeAdmissibilityError,
  RuntimeAdmissibilityInput,
} from "./runtimeAdmissibilityStateTypes";
import { normalizeRuntimeAdmissibilityMetadata } from "./runtimeAdmissibilitySchemas";

export function validateRuntimeIsolation(
  input: RuntimeAdmissibilityInput,
): readonly RuntimeAdmissibilityError[] {
  const metadata = normalizeRuntimeAdmissibilityMetadata(input.metadata);
  const violations = [
    "execution",
    "orchestration",
    "scheduler",
    "runtimeactivation",
    "runtimemutation",
    "taskqueue",
  ].filter((marker) => metadata.includes(marker));
  if (violations.length === 0) {
    return Object.freeze([]);
  }
  return Object.freeze([Object.freeze({
    code: "RUNTIME_ADMISSIBILITY_ISOLATION_VIOLATION",
    message: `Runtime admissibility remains isolated only when runtime-facing markers are absent. Found: ${violations.join(", ")}.`,
    path: "metadata",
  })]);
}
