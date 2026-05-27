import type { AuditInterpretation, RecommendationLineage } from "@/types/autonomy-audit-episode-model";
import type { MonitoringTriggerModel } from "@/services/monitoring-trigger-model";
import { hashAuditEpisodeValue } from "./auditEpisodeHasher";

export function buildRecommendationLineage(input: {
  interpretation: AuditInterpretation;
  monitoringModel: MonitoringTriggerModel;
  createdAt: string;
}): readonly RecommendationLineage[] {
  const recommendations: RecommendationLineage[] = [];
  const type =
    input.monitoringModel.cautionState === "frozen-recommended"
      ? "preserve_freeze_recommendation"
      : input.monitoringModel.cautionState === "escalated"
        ? "escalate_review"
        : input.monitoringModel.cautionState === "restricted"
          ? "prepare_handoff_review"
          : "maintain_observation";

  recommendations.push(Object.freeze({
    recommendationId: hashAuditEpisodeValue("autonomy-audit-recommendation-id", {
      interpretationId: input.interpretation.interpretationId,
      type,
      createdAt: input.createdAt,
    }),
    recommendationType: type,
    summary: input.interpretation.summary,
    confidenceScore: input.monitoringModel.confidenceEscalation.currentConfidenceScore,
    evidenceHashes: Object.freeze(input.monitoringModel.triggers.flatMap((trigger) => trigger.evidenceHashes).sort((left, right) => left.localeCompare(right))),
    governanceHashes: Object.freeze([
      input.monitoringModel.replayBinding.governanceSnapshotHash,
      ...input.monitoringModel.triggers.flatMap((trigger) => trigger.governanceBindings),
    ]),
    createdAt: input.createdAt,
  }));

  return Object.freeze(recommendations);
}
