import type {
  HumanSupremacyEnforcementInput,
  SupremacyEvidence,
} from "./supremacyStateTypes";
import { hashSupremacyValue } from "./supremacyHashingEngine";

export function bundleSupremacyEvidence(input: {
  supremacyInput: HumanSupremacyEnforcementInput;
  reasons: readonly string[];
}): SupremacyEvidence {
  const replay = input.supremacyInput.constitutionalReplayResult;
  const evidenceRefs = Object.freeze([
    replay.evidence.evidenceId,
    replay.record.replayId,
    replay.record.boundaryId,
    replay.lineage.lineageHash,
  ].sort());
  const reasons = Object.freeze([...input.reasons].sort());
  return Object.freeze({
    evidenceId: hashSupremacyValue("human-supremacy-evidence-id", input.supremacyInput.supremacyId),
    supremacyId: input.supremacyInput.supremacyId,
    replayEvidenceId: replay.evidence.evidenceId,
    evidenceRefs,
    reasons,
    evidenceHash: hashSupremacyValue("human-supremacy-evidence", {
      supremacyId: input.supremacyInput.supremacyId,
      evidenceRefs,
      reasons,
    }),
  });
}
