import type {
  RuntimeAdmissibilityInput,
  RuntimeCertificationEvidence,
} from "./runtimeAdmissibilityStateTypes";
import { hashRuntimeCertificationValue } from "./runtimeCertificationHashingEngine";

export function bundleRuntimeCertificationEvidence(input: {
  admissibilityInput: RuntimeAdmissibilityInput;
  reasons: readonly string[];
}): RuntimeCertificationEvidence {
  const replay = input.admissibilityInput.constitutionalReplayResult;
  const supremacy = input.admissibilityInput.humanSupremacyResult;
  const escalation = input.admissibilityInput.escalationDeterminismResult;
  const emergence = input.admissibilityInput.antiEmergenceResult;
  const evidenceRefs = Object.freeze([
    replay.evidence.evidenceId,
    supremacy.evidence.evidenceId,
    escalation.evidence.evidenceId,
    emergence.evidence.evidenceId,
    input.admissibilityInput.rollbackSnapshot.rollbackHash,
    input.admissibilityInput.observabilitySnapshot.observabilityHash,
    input.admissibilityInput.runtimeTopology.topologyHash,
  ].sort());
  const reasons = Object.freeze([...input.reasons].sort());
  return Object.freeze({
    evidenceId: hashRuntimeCertificationValue("runtime-admissibility-evidence-id", input.admissibilityInput.admissibilityId),
    admissibilityId: input.admissibilityInput.admissibilityId,
    replayEvidenceId: replay.evidence.evidenceId,
    supremacyEvidenceId: supremacy.evidence.evidenceId,
    escalationEvidenceId: escalation.evidence.evidenceId,
    emergenceEvidenceId: emergence.evidence.evidenceId,
    evidenceRefs,
    reasons,
    evidenceHash: hashRuntimeCertificationValue("runtime-admissibility-evidence", {
      admissibilityId: input.admissibilityInput.admissibilityId,
      evidenceRefs,
      reasons,
    }),
  });
}
