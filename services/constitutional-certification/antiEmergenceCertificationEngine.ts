import type {
  AntiEmergenceCertificationRecord,
  ConstitutionalCertificationError,
  ConstitutionalCertificationInput,
} from "./certificationStateTypes";
import { hashCertificationValue } from "./certificationTraceHasher";

export function certifyAntiEmergence(input: ConstitutionalCertificationInput): {
  record: AntiEmergenceCertificationRecord;
  errors: readonly ConstitutionalCertificationError[];
} {
  const hiddenExecutionDetected = input.antiEmergenceResult.signals.some((signal) =>
    signal.domain === "hidden_orchestration" && signal.triggered);
  const recursiveCoordinationDetected = input.antiEmergenceResult.signals.some((signal) =>
    signal.domain === "recursive_coordination" && signal.triggered);
  const authorityExpansionDetected = input.antiEmergenceResult.signals.some((signal) =>
    signal.domain === "authority_expansion" && signal.triggered);
  const score = hiddenExecutionDetected || recursiveCoordinationDetected || authorityExpansionDetected ? 0.05 : 1;
  const errors: ConstitutionalCertificationError[] = [];
  if (hiddenExecutionDetected) {
    errors.push({
      code: "CONSTITUTIONAL_CERTIFICATION_HIDDEN_EXECUTION",
      message: "Hidden execution/orchestration risk was detected.",
      path: "antiEmergenceResult.signals",
    });
  }
  if (recursiveCoordinationDetected) {
    errors.push({
      code: "CONSTITUTIONAL_CERTIFICATION_RECURSIVE_COORDINATION",
      message: "Recursive coordination risk was detected.",
      path: "antiEmergenceResult.signals",
    });
  }
  if (authorityExpansionDetected) {
    errors.push({
      code: "CONSTITUTIONAL_CERTIFICATION_AUTHORITY_DRIFT",
      message: "Authority expansion risk was detected.",
      path: "antiEmergenceResult.signals",
    });
  }
  return Object.freeze({
    record: Object.freeze({
      containmentId: input.constitutionalReadinessResult.record.containmentId,
      hiddenExecutionDetected,
      recursiveCoordinationDetected,
      authorityExpansionDetected,
      score,
      deterministicHash: hashCertificationValue("constitutional-certification-anti-emergence", {
        containmentId: input.constitutionalReadinessResult.record.containmentId,
        hiddenExecutionDetected,
        recursiveCoordinationDetected,
        authorityExpansionDetected,
        score,
      }),
    }),
    errors: Object.freeze(errors),
  });
}
