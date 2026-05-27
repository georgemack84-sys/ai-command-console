import type {
  RuntimeAdmissibilityError,
  RuntimeAdmissibilityInput,
} from "./runtimeAdmissibilityStateTypes";
import { normalizeRuntimeAdmissibilityMetadata } from "./runtimeAdmissibilitySchemas";

export function enforceRuntimeAdmissibilityBoundary(
  input: RuntimeAdmissibilityInput,
): readonly RuntimeAdmissibilityError[] {
  const metadata = normalizeRuntimeAdmissibilityMetadata(input.metadata);
  const runtimeBoundaryBreached = [
    "selfcertification",
    "hiddencoordination",
    "topologyrepair",
    "runtimepower",
    "autonomousrecovery",
    "dynamicauthority",
  ].some((marker) => metadata.includes(marker));
  if (!runtimeBoundaryBreached) {
    return Object.freeze([]);
  }
  return Object.freeze([Object.freeze({
    code: "RUNTIME_ADMISSIBILITY_BOUNDARY_VIOLATION",
    message: "Runtime admissibility crossed from compatibility verification into forbidden runtime power semantics.",
    path: "metadata",
  })]);
}
