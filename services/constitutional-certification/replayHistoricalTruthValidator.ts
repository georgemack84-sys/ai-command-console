import type {
  ConstitutionalCertificationError,
  ConstitutionalCertificationInput,
} from "./certificationStateTypes";

function hasMarker(input: ConstitutionalCertificationInput, key: string): boolean {
  return input.metadata?.[key] === true;
}

export function validateReplayHistoricalTruth(
  input: ConstitutionalCertificationInput,
): readonly ConstitutionalCertificationError[] {
  if (
    hasMarker(input, "presentStateSubstitution")
    || hasMarker(input, "replayRepair")
    || hasMarker(input, "syntheticLineage")
  ) {
    return Object.freeze([{
      code: "CONSTITUTIONAL_CERTIFICATION_REPLAY_MISMATCH",
      message: "Replay historical truth was compromised by present-state or synthetic markers.",
      path: "metadata",
    }]);
  }
  return Object.freeze([]);
}
