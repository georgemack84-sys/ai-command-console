import type { ConstitutionalReplayStabilityError, ConstitutionalReplayStabilityInput } from "./replayStateTypes";

export function normalizeReplayStabilityMetadata(metadata: Readonly<Record<string, unknown>> | undefined): string {
  return JSON.stringify(metadata ?? {}).toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function validateReplayStabilityInput(input: ConstitutionalReplayStabilityInput): readonly ConstitutionalReplayStabilityError[] {
  const errors: ConstitutionalReplayStabilityError[] = [];
  if (!input.constitutionalAuthorityBoundaryResult.derivedOnly) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_REPLAY_STABILITY_VALIDATOR_MISMATCH",
      message: "Replay stability requires a derived-only authority boundary result.",
      path: "constitutionalAuthorityBoundaryResult.derivedOnly",
    }));
  }
  return Object.freeze(errors);
}
