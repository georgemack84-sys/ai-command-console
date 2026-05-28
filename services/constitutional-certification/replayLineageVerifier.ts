import type {
  ConstitutionalCertificationError,
  ConstitutionalCertificationInput,
} from "./certificationStateTypes";

export function verifyReplayLineage(
  input: ConstitutionalCertificationInput,
): readonly ConstitutionalCertificationError[] {
  const complete =
    input.constitutionalReplayResult.lineage.entries.length > 0
    && input.constitutionalReadinessResult.lineage.entries.length > 0;
  return complete ? Object.freeze([]) : Object.freeze([{
    code: "CONSTITUTIONAL_CERTIFICATION_LINEAGE_GAP",
    message: "Replay lineage is incomplete.",
    path: "constitutionalReplayResult.lineage",
  }]);
}
