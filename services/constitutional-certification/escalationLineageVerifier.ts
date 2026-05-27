import type {
  ConstitutionalCertificationError,
  ConstitutionalCertificationInput,
} from "./certificationStateTypes";

export function verifyEscalationLineage(
  input: ConstitutionalCertificationInput,
): readonly ConstitutionalCertificationError[] {
  return input.escalationDeterminismResult.lineage.entries.length > 0
    ? Object.freeze([])
    : Object.freeze([{
      code: "CONSTITUTIONAL_CERTIFICATION_LINEAGE_GAP",
      message: "Escalation lineage is incomplete.",
      path: "escalationDeterminismResult.lineage",
    }]);
}
