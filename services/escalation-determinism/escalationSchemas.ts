import type {
  EscalationDeterminismError,
  EscalationDeterminismInput,
} from "./escalationStateTypes";

export function normalizeEscalationMetadata(metadata: Readonly<Record<string, unknown>> | undefined): string {
  return JSON.stringify(metadata ?? {}).toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function validateEscalationDeterminismInput(input: EscalationDeterminismInput): readonly EscalationDeterminismError[] {
  const errors: EscalationDeterminismError[] = [];
  if (!input.constitutionalReplayResult.derivedOnly) {
    errors.push(Object.freeze({
      code: "ESCALATION_DETERMINISM_VALIDATOR_MISMATCH",
      message: "Escalation determinism requires a derived-only constitutional replay result.",
      path: "constitutionalReplayResult.derivedOnly",
    }));
  }
  if (!input.humanSupremacyResult.derivedOnly) {
    errors.push(Object.freeze({
      code: "ESCALATION_DETERMINISM_VALIDATOR_MISMATCH",
      message: "Escalation determinism requires a derived-only human supremacy result.",
      path: "humanSupremacyResult.derivedOnly",
    }));
  }
  if (!input.constitutionalAuthorityBoundaryResult.derivedOnly) {
    errors.push(Object.freeze({
      code: "ESCALATION_DETERMINISM_VALIDATOR_MISMATCH",
      message: "Escalation determinism requires a derived-only authority boundary result.",
      path: "constitutionalAuthorityBoundaryResult.derivedOnly",
    }));
  }
  return Object.freeze(errors);
}
