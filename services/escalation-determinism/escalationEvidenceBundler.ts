import type {
  EscalationDeterminismInput,
  EscalationEvidence,
} from "./escalationStateTypes";
import { hashEscalationValue } from "./escalationHashingEngine";

export function bundleEscalationEvidence(input: {
  escalationInput: EscalationDeterminismInput;
  reasons: readonly string[];
}): EscalationEvidence {
  const replay = input.escalationInput.constitutionalReplayResult;
  const supremacy = input.escalationInput.humanSupremacyResult;
  const evidenceRefs = Object.freeze([
    replay.evidence.evidenceId,
    supremacy.evidence.evidenceId,
    replay.lineage.lineageHash,
    supremacy.lineage.lineageHash,
  ].sort());
  const reasons = Object.freeze([...input.reasons].sort());
  return Object.freeze({
    evidenceId: hashEscalationValue("escalation-determinism-evidence-id", input.escalationInput.escalationId),
    escalationId: input.escalationInput.escalationId,
    replayEvidenceId: replay.evidence.evidenceId,
    supremacyEvidenceId: supremacy.evidence.evidenceId,
    evidenceRefs,
    reasons,
    evidenceHash: hashEscalationValue("escalation-determinism-evidence", {
      escalationId: input.escalationInput.escalationId,
      evidenceRefs,
      reasons,
    }),
  });
}
