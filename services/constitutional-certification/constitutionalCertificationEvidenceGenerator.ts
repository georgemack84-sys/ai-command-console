import type {
  CertificationEvidence,
  ConstitutionalCertificationInput,
} from "./certificationStateTypes";
import { hashCertificationValue } from "./certificationTraceHasher";

export function generateCertificationEvidence(input: {
  certificationInput: ConstitutionalCertificationInput;
  reasons: readonly string[];
}): CertificationEvidence {
  const evidenceRefs = Object.freeze([
    input.certificationInput.constitutionalReadinessResult.evidence.evidenceId,
    input.certificationInput.constitutionalAuthorityBoundaryResult.evidence.evidenceId,
    input.certificationInput.constitutionalReplayResult.evidence.evidenceId,
    input.certificationInput.humanSupremacyResult.evidence.evidenceId,
    input.certificationInput.escalationDeterminismResult.evidence.evidenceId,
    input.certificationInput.antiEmergenceResult.evidence.evidenceId,
    input.certificationInput.runtimeAdmissibilityResult.evidence.evidenceId,
    input.certificationInput.constitutionalTelemetryResult.evidence.evidenceId,
    input.certificationInput.constitutionalRuntimeSimulationResult.evidence.evidenceId,
  ]);
  return Object.freeze({
    evidenceId: hashCertificationValue("constitutional-certification-evidence-id", {
      certificationId: input.certificationInput.certificationId,
      evidenceRefs,
    }),
    certificationId: input.certificationInput.certificationId,
    evidenceRefs,
    reasons: input.reasons,
    evidenceHash: hashCertificationValue("constitutional-certification-evidence", {
      certificationId: input.certificationInput.certificationId,
      evidenceRefs,
      reasons: input.reasons,
    }),
  });
}
