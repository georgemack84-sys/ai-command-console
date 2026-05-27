import type {
  ConstitutionalReadinessError,
  ConstitutionalReadinessInput,
  ContainmentCertificationRecord,
} from "./readinessStateTypes";
import { hashReadinessValue } from "./readinessTraceHasher";

export function certifyContainment(input: ConstitutionalReadinessInput): {
  record: ContainmentCertificationRecord;
  errors: readonly ConstitutionalReadinessError[];
} {
  const contained =
    input.antiEmergenceResult.record.classification === "contained"
    && !input.antiEmergenceResult.containmentState.freezeRequired
    && input.runtimeAdmissibilityResult.compatibility.containmentCompatible;
  const failClosed =
    input.antiEmergenceResult.record.failClosed
    || input.runtimeAdmissibilityResult.record.failClosed
    || input.constitutionalRuntimeSimulationResult.report.outcome === "FAILED_CLOSED";
  const score = contained && !failClosed ? 1 : contained ? 0.5 : 0.15;

  const errors: ConstitutionalReadinessError[] = [];
  if (!contained) {
    errors.push({
      code: "CONSTITUTIONAL_READINESS_CONTAINMENT_WEAKENED",
      message: "Containment readiness weakened below constitutional minimums.",
      path: "antiEmergenceResult",
    });
  }

  return Object.freeze({
    record: Object.freeze({
      containmentId: input.antiEmergenceResult.record.containmentId,
      contained,
      failClosed,
      score,
      deterministicHash: hashReadinessValue("constitutional-readiness-containment-certification", {
        containmentId: input.antiEmergenceResult.record.containmentId,
        contained,
        failClosed,
        score,
      }),
    }),
    errors: Object.freeze(errors),
  });
}
