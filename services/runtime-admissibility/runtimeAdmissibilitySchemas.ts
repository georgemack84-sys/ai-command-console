import type {
  RuntimeAdmissibilityError,
  RuntimeAdmissibilityInput,
} from "./runtimeAdmissibilityStateTypes";

export function normalizeRuntimeAdmissibilityMetadata(
  metadata: Readonly<Record<string, unknown>> | undefined,
): string {
  return JSON.stringify(metadata ?? {}).toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function validateRuntimeAdmissibilityInput(
  input: RuntimeAdmissibilityInput,
): readonly RuntimeAdmissibilityError[] {
  const errors: RuntimeAdmissibilityError[] = [];
  if (!input.constitutionalAuthorityBoundaryResult.derivedOnly) {
    errors.push(Object.freeze({
      code: "RUNTIME_ADMISSIBILITY_VALIDATOR_MISMATCH",
      message: "Runtime admissibility requires a derived-only authority boundary result.",
      path: "constitutionalAuthorityBoundaryResult.derivedOnly",
    }));
  }
  if (!input.constitutionalReplayResult.derivedOnly
    || !input.humanSupremacyResult.derivedOnly
    || !input.escalationDeterminismResult.derivedOnly
    || !input.antiEmergenceResult.derivedOnly) {
    errors.push(Object.freeze({
      code: "RUNTIME_ADMISSIBILITY_VALIDATOR_MISMATCH",
      message: "Runtime admissibility requires derived-only replay, supremacy, escalation, and anti-emergence results.",
      path: "constitutionalReplayResult.derivedOnly",
    }));
  }
  return Object.freeze(errors);
}
