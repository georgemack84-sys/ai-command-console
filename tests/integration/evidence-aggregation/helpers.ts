import { aggregateEvidence } from "@/services/evidence-aggregation/evidenceAggregationEngine";
import type {
  EvidenceAggregationAuditLedgerEntry,
  EvidenceAggregationInput,
  EvidenceAggregationLineageLedger,
} from "@/services/evidence-aggregation/types/evidenceAggregationTypes";
import { buildRecommendationSynthesisFixture } from "@/tests/integration/recommendation-synthesis/helpers";

export function buildEvidenceAggregationFixture(
  overrides: Partial<EvidenceAggregationInput> = {},
) {
  const synthesisFixture = buildRecommendationSynthesisFixture();
  const baseInput = {
    aggregationSessionId: "evidence-aggregation-session-1",
    startedAt: "2026-05-20T19:00:00.000Z",
    completedAt: "2026-05-20T19:00:01.000Z",
    deterministicOrderingVersion: "evidence-ordering-v1",
    recommendationSynthesisInput: synthesisFixture.input,
    recommendationSynthesisResult: synthesisFixture.result,
  } satisfies EvidenceAggregationInput;

  const input = Object.freeze({
    ...baseInput,
    ...overrides,
  }) as EvidenceAggregationInput;

  return Object.freeze({
    input,
    result: aggregateEvidence({
      ...input,
      existingLineage: overrides.existingLineage as EvidenceAggregationLineageLedger | undefined,
      existingAuditLedger: overrides.existingAuditLedger as readonly EvidenceAggregationAuditLedgerEntry[] | undefined,
    }),
  });
}
