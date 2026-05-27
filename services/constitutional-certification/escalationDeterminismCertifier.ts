import type {
  ConstitutionalCertificationError,
  ConstitutionalCertificationInput,
  EscalationCertificationRecord,
} from "./certificationStateTypes";
import { hashCertificationValue } from "./certificationTraceHasher";

export function certifyEscalationDeterminism(input: ConstitutionalCertificationInput): {
  record: EscalationCertificationRecord;
  errors: readonly ConstitutionalCertificationError[];
} {
  const deterministic =
    input.constitutionalReadinessResult.escalationCorrectness.deterministic
    && input.escalationDeterminismResult.integrityReport.deterministic;
  const oversightIncreasePreserved =
    input.escalationDeterminismResult.record.oversightState !== "revoked"
    && input.escalationDeterminismResult.record.oversightState !== "disputed";
  const score = deterministic && oversightIncreasePreserved ? 1 : 0.15;
  const errors: ConstitutionalCertificationError[] = [];
  if (!deterministic || !oversightIncreasePreserved) {
    errors.push({
      code: "CONSTITUTIONAL_CERTIFICATION_ESCALATION_INSTABILITY",
      message: "Escalation determinism or oversight amplification could not be certified.",
      path: "escalationDeterminismResult",
    });
  }
  return Object.freeze({
    record: Object.freeze({
      escalationId: input.constitutionalReadinessResult.record.escalationId,
      deterministic,
      oversightIncreasePreserved,
      score,
      deterministicHash: hashCertificationValue("constitutional-certification-escalation", {
        escalationId: input.constitutionalReadinessResult.record.escalationId,
        deterministic,
        oversightIncreasePreserved,
        score,
      }),
    }),
    errors: Object.freeze(errors),
  });
}
