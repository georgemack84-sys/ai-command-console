import type { AntiEmergenceError, AntiEmergenceInput } from "./antiEmergenceStateTypes";

export function normalizeAntiEmergenceMetadata(metadata: Readonly<Record<string, unknown>> | undefined): string {
  return JSON.stringify(metadata ?? {}).toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function validateAntiEmergenceInput(input: AntiEmergenceInput): readonly AntiEmergenceError[] {
  const errors: AntiEmergenceError[] = [];
  if (!input.constitutionalAuthorityBoundaryResult.derivedOnly) {
    errors.push(Object.freeze({
      code: "ANTI_EMERGENCE_VALIDATOR_MISMATCH",
      message: "Anti-emergence containment requires a derived-only authority boundary result.",
      path: "constitutionalAuthorityBoundaryResult.derivedOnly",
    }));
  }
  if (!input.constitutionalReplayResult.derivedOnly) {
    errors.push(Object.freeze({
      code: "ANTI_EMERGENCE_VALIDATOR_MISMATCH",
      message: "Anti-emergence containment requires a derived-only replay result.",
      path: "constitutionalReplayResult.derivedOnly",
    }));
  }
  if (!input.humanSupremacyResult.derivedOnly || !input.escalationDeterminismResult.derivedOnly) {
    errors.push(Object.freeze({
      code: "ANTI_EMERGENCE_VALIDATOR_MISMATCH",
      message: "Anti-emergence containment requires derived-only supremacy and escalation results.",
      path: "humanSupremacyResult.derivedOnly",
    }));
  }
  return Object.freeze(errors);
}
