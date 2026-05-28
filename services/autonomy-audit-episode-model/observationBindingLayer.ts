import type { AuditObservation } from "@/types/autonomy-audit-episode-model";
import type { MonitoringTriggerModel } from "@/services/monitoring-trigger-model";
import { hashAuditEpisodeValue } from "./auditEpisodeHasher";

export function bindAuditObservation(input: {
  monitoringModel: MonitoringTriggerModel;
  createdAt: string;
}): AuditObservation {
  return Object.freeze({
    observationId: hashAuditEpisodeValue("autonomy-audit-observation-id", {
      triggerHash: input.monitoringModel.triggerHash,
      createdAt: input.createdAt,
    }),
    triggerIds: Object.freeze(input.monitoringModel.triggers.map((trigger) => trigger.triggerId)),
    evidenceHashes: Object.freeze(input.monitoringModel.triggers.flatMap((trigger) => trigger.evidenceHashes).sort((left, right) => left.localeCompare(right))),
    confidenceScore: input.monitoringModel.confidenceEscalation.currentConfidenceScore,
    cautionState: input.monitoringModel.cautionState,
    createdAt: input.createdAt,
  });
}
