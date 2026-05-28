import { buildRecommendationIntegritySimulation } from "@/services/recommendation-integrity";
import type {
  RecommendationIntegrityInput,
  RecommendationLineage,
  RecommendationReplayLedgerEntry,
} from "@/types/recommendation-integrity";
import { buildConstitutionalAttackFixture } from "@/tests/integration/constitutional-attack-engine/helpers";

export function buildRecommendationIntegrityFixture(overrides: Partial<{
  createdAt: string;
  deterministicSeed: string;
  metadata: Readonly<Record<string, unknown>>;
  existingLineage: RecommendationLineage;
  existingReplayLedger: readonly RecommendationReplayLedgerEntry[];
}> = {}) {
  const attackFixture = buildConstitutionalAttackFixture({
    createdAt: overrides.createdAt,
    deterministicSeed: overrides.deterministicSeed,
    metadata: overrides.metadata,
  });

  const input: RecommendationIntegrityInput = Object.freeze({
    recommendationId: `recommendation-${attackFixture.input.attackId}`,
    attackResult: attackFixture.result,
    deterministicSeed: overrides.deterministicSeed ?? "seed-4.8b",
    createdAt: overrides.createdAt ?? "2026-05-17T19:00:00.000Z",
    existingLineage: overrides.existingLineage,
    existingReplayLedger: overrides.existingReplayLedger,
    metadata: overrides.metadata,
  });

  return {
    attackFixture,
    input,
    result: buildRecommendationIntegritySimulation(input),
  };
}
