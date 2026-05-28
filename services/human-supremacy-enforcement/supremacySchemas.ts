import type {
  HumanSupremacyEnforcementInput,
  HumanSupremacyError,
} from "./supremacyStateTypes";

export function normalizeSupremacyMetadata(metadata: Readonly<Record<string, unknown>> | undefined): string {
  return JSON.stringify(metadata ?? {}).toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function validateSupremacyInput(input: HumanSupremacyEnforcementInput): readonly HumanSupremacyError[] {
  const errors: HumanSupremacyError[] = [];
  if (!input.constitutionalReplayResult.derivedOnly) {
    errors.push(Object.freeze({
      code: "HUMAN_SUPREMACY_VALIDATOR_MISMATCH",
      message: "Human supremacy enforcement requires a derived-only constitutional replay result.",
      path: "constitutionalReplayResult.derivedOnly",
    }));
  }
  if (!input.operatorId) {
    errors.push(Object.freeze({
      code: "HUMAN_SUPREMACY_VALIDATOR_MISMATCH",
      message: "Human supremacy enforcement requires an operator identity.",
      path: "operatorId",
    }));
  }
  if (!input.reason) {
    errors.push(Object.freeze({
      code: "HUMAN_SUPREMACY_VALIDATOR_MISMATCH",
      message: "Human supremacy enforcement requires an immutable intervention reason.",
      path: "reason",
    }));
  }
  return Object.freeze(errors);
}
