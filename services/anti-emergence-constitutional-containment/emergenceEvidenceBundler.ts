import type { AntiEmergenceInput, EmergenceEvidence } from "./antiEmergenceStateTypes";
import { hashEmergenceValue } from "./emergenceHashingEngine";

export function bundleEmergenceEvidence(input: {
  containmentInput: AntiEmergenceInput;
  reasons: readonly string[];
}): EmergenceEvidence {
  const replay = input.containmentInput.constitutionalReplayResult;
  const supremacy = input.containmentInput.humanSupremacyResult;
  const escalation = input.containmentInput.escalationDeterminismResult;
  const evidenceRefs = Object.freeze([
    replay.evidence.evidenceId,
    supremacy.evidence.evidenceId,
    escalation.evidence.evidenceId,
    replay.lineage.lineageHash,
    supremacy.lineage.lineageHash,
    escalation.lineage.lineageHash,
  ].sort());
  const reasons = Object.freeze([...input.reasons].sort());
  return Object.freeze({
    evidenceId: hashEmergenceValue("anti-emergence-evidence-id", input.containmentInput.containmentId),
    containmentId: input.containmentInput.containmentId,
    replayEvidenceId: replay.evidence.evidenceId,
    supremacyEvidenceId: supremacy.evidence.evidenceId,
    escalationEvidenceHash: escalation.evidence.evidenceHash,
    evidenceRefs,
    reasons,
    evidenceHash: hashEmergenceValue("anti-emergence-evidence", {
      containmentId: input.containmentInput.containmentId,
      evidenceRefs,
      reasons,
    }),
  });
}
