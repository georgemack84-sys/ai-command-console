import { hashReplayValue } from "@/services/recommendation-replay/replayHashEngine";
import type { RecommendationReplayInput, RecommendationReplayResult } from "@/services/recommendation-replay/types/recommendationReplayTypes";
import type { RecommendationLedgerEvent } from "./types/immutableRecommendationLedgerTypes";

type ReplayDerivedEvent = Readonly<{
  eventType: RecommendationLedgerEvent["eventType"];
  timestamp: string;
  actorType: RecommendationLedgerEvent["actorType"];
  payload: Record<string, unknown>;
  parentLineageHash?: string;
}>;

export function deriveLedgerEventsFromReplay(args: {
  replayInput: RecommendationReplayInput;
  replayResult: RecommendationReplayResult;
}): readonly ReplayDerivedEvent[] {
  const input = args.replayInput;
  const envelope = input.recommendationSynthesisResult.recommendations.find((item) => item.recommendation.recommendationId === input.recommendationId);
  const constrained = input.recommendationConstraintResult.constrainedRecommendations.find((item) => item.constrainedRecommendation.recommendationId === input.recommendationId);
  const confidence = input.confidenceScoringResult.confidenceScores.find((item) => item.recommendationId === input.recommendationId);
  const priority = input.recommendationPrioritizationResult.result.priorities.find((item) => item.recommendationId === input.recommendationId);
  const episode = args.replayResult.episodes.find((item) => item.recommendationId === input.recommendationId);

  return Object.freeze([
    Object.freeze({
      eventType: "recommendation.generated" as const,
      timestamp: input.recommendationSynthesisInput.createdAt,
      actorType: "system" as const,
      payload: {
        recommendationHash: envelope?.envelopeHash ?? "",
        rationaleHash: envelope?.rationaleRecord.rationaleHash ?? "",
        category: envelope?.recommendation.category ?? "",
        recommendationType: envelope?.recommendation.recommendationType ?? "",
      },
    }),
    Object.freeze({
      eventType: "recommendation.constrained" as const,
      timestamp: input.recommendationConstraintInput.constrainedAt,
      actorType: "system" as const,
      payload: {
        constraintHash: constrained?.constraintHash ?? "",
        sanitizationHash: constrained?.sanitizationRecord.sanitizationHash ?? "",
        auditIds: constrained?.constraintAuditIds ?? [],
      },
      parentLineageHash: envelope?.lineageRecord.lineageHash,
    }),
    Object.freeze({
      eventType: "recommendation.scored" as const,
      timestamp: input.confidenceScoringInput.createdAt,
      actorType: "system" as const,
      payload: {
        confidenceId: confidence?.confidenceId ?? "",
        overallConfidence: confidence?.overallConfidence ?? 0,
        confidenceLevel: confidence?.confidenceLevel ?? "very_low",
        uncertaintyLevel: confidence?.uncertaintyLevel ?? "critical",
      },
      parentLineageHash: constrained?.constraintHash,
    }),
    Object.freeze({
      eventType: "recommendation.prioritized" as const,
      timestamp: input.recommendationPrioritizationInput.createdAt,
      actorType: "system" as const,
      payload: {
        prioritizationId: priority?.prioritizationId ?? "",
        priorityTier: priority?.priorityTier ?? "INFORMATIONAL",
        priorityScore: priority?.priorityScore ?? 0,
        orderingRank: priority?.orderingRank ?? 0,
        prioritizationHash: priority?.prioritizationHash ?? "",
      },
      parentLineageHash: confidence?.lineage.lineageHash,
    }),
    Object.freeze({
      eventType: "recommendation.replayed" as const,
      timestamp: input.replayTimestamp,
      actorType: "replay-engine" as const,
      payload: {
        replayId: episode?.replayId ?? "",
        replayHash: episode?.replayHash ?? "",
        deterministicReplayVerified: episode?.validation.deterministicReplayVerified ?? false,
        lineageIntegrityVerified: episode?.validation.lineageIntegrityVerified ?? false,
        governanceConsistencyVerified: episode?.validation.governanceConsistencyVerified ?? false,
      },
      parentLineageHash: priority?.prioritizationHash,
    }),
  ]);
}

export function deriveEvidenceBundleId(input: RecommendationReplayInput): string {
  return input.evidenceAggregationResult.session.aggregationSessionId
    || hashReplayValue("immutable-recommendation-ledger-evidence-bundle", input.evidenceAggregationResult.evidenceReferences.map((item) => item.evidenceId));
}
