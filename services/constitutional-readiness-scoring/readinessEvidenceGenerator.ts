import type {
  ConstitutionalReadinessEvidence,
  ConstitutionalReadinessInput,
} from "./readinessStateTypes";
import { hashReadinessValue } from "./readinessTraceHasher";

export function createReadinessEvidence(input: {
  readinessInput: ConstitutionalReadinessInput;
  reasons: readonly string[];
}): ConstitutionalReadinessEvidence {
  const evidenceRefs = Object.freeze([
    input.readinessInput.constitutionalAuthorityBoundaryResult.evidence.evidenceId,
    input.readinessInput.constitutionalReplayResult.evidence.evidenceId,
    input.readinessInput.humanSupremacyResult.evidence.evidenceId,
    input.readinessInput.escalationDeterminismResult.evidence.evidenceId,
    input.readinessInput.antiEmergenceResult.evidence.evidenceId,
    input.readinessInput.runtimeAdmissibilityResult.evidence.evidenceId,
    input.readinessInput.constitutionalTelemetryResult.evidence.evidenceId,
    input.readinessInput.constitutionalRuntimeSimulationResult.evidence.evidenceId,
  ]);

  return Object.freeze({
    evidenceId: hashReadinessValue("constitutional-readiness-evidence-id", {
      readinessId: input.readinessInput.readinessId,
      evidenceRefs,
    }),
    readinessId: input.readinessInput.readinessId,
    evidenceRefs,
    reasons: input.reasons,
    evidenceHash: hashReadinessValue("constitutional-readiness-evidence", {
      readinessId: input.readinessInput.readinessId,
      evidenceRefs,
      reasons: input.reasons,
    }),
  });
}
