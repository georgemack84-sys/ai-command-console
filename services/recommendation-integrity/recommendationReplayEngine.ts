import type { RecommendationIntegrityInput, RecommendationReplayInspection } from "@/types/recommendation-integrity";
import { assessReplayDeterminism } from "@/services/replay/replayDeterminism";
import { hashRecommendationIntegrityValue } from "./deterministicRecommendationHasher";

export function buildRecommendationReplayInspection(
  input: RecommendationIntegrityInput,
): RecommendationReplayInspection {
  const determinism = assessReplayDeterminism({
    ledgerEvents: input.attackResult.replayLedger.map((entry, index) => ({
      ledgerIndex: index,
      entryId: entry.ledgerId,
      createdAt: input.createdAt,
    })),
    continuitySnapshots: [{ replaySnapshotId: input.attackResult.record.replaySnapshotId }],
    auditEvents: [{ auditId: input.attackResult.attackInspection.attackId, evidenceHash: input.attackResult.evidence.evidenceHash }],
  });
  const base = Object.freeze({
    replayId: input.attackResult.record.attackId,
    replayDeterministic: determinism.deterministic,
    replayState: input.attackResult.record.attackState,
    replayLedgerId: input.attackResult.replayLedger[0]?.ledgerId ?? "empty",
  });
  return Object.freeze({
    ...base,
    inspectionHash: hashRecommendationIntegrityValue("replay-inspection", base),
  });
}
