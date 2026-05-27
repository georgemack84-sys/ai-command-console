import type { ConstitutionalReadinessInput, ReadinessEvidence } from "@/types/constitutional-readiness";
import { hashReadinessValue } from "./readinessHashEngine";

export function buildReadinessEvidence(input: {
  readinessInput: ConstitutionalReadinessInput;
  evidenceRefs: readonly string[];
  reasons: readonly string[];
}): ReadinessEvidence {
  const evidenceRefs = Object.freeze([...input.evidenceRefs].sort());
  const reasons = Object.freeze([...input.reasons].sort());
  return Object.freeze({
    evidenceId: hashReadinessValue("constitutional-readiness-evidence-id", {
      readinessId: input.readinessInput.readinessId,
      evidenceRefs,
    }),
    readinessId: input.readinessInput.readinessId,
    telemetryEvidenceId: input.readinessInput.adversarialTelemetryResult.evidence.evidenceId,
    forensicEvidenceId: input.readinessInput.adversarialTelemetryResult.events[0]?.forensicHash
      ?? input.readinessInput.adversarialTelemetryResult.evidence.evidenceHash,
    evidenceRefs,
    reasons,
    evidenceHash: hashReadinessValue("constitutional-readiness-evidence", {
      readinessId: input.readinessInput.readinessId,
      evidenceRefs,
      reasons,
    }),
  });
}
