import type {
  DeterministicConfidenceError,
  DeterministicConfidenceInput,
} from "./types/confidenceTypes";

export function validateConfidenceEvidence(
  input: DeterministicConfidenceInput,
): readonly DeterministicConfidenceError[] {
  const errors: DeterministicConfidenceError[] = [];
  const evidence = input.proposalIntegrityResult.evidence;

  if (evidence.evidenceRefs.length === 0) {
    errors.push({
      code: "DETERMINISTIC_CONFIDENCE_EVIDENCE_SNAPSHOT_MISSING",
      message: "Confidence scoring requires immutable evidence references.",
      path: "proposalIntegrityResult.evidence.evidenceRefs",
    });
  }

  return Object.freeze(errors);
}
