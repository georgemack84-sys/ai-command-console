import type { MonitoringTriggerModel } from "@/services/monitoring-trigger-model";
import type { RiskAnalysis } from "@/types/autonomy-audit-episode-model";
import { hashAuditEpisodeValue } from "./auditEpisodeHasher";

export function reconstructRiskAnalysis(input: {
  monitoringModel: MonitoringTriggerModel;
  createdAt: string;
}): RiskAnalysis {
  const severity = input.monitoringModel.triggers.some((trigger) => trigger.severity === "critical")
    ? "critical"
    : input.monitoringModel.triggers.some((trigger) => trigger.severity === "high")
      ? "high"
      : input.monitoringModel.triggers.some((trigger) => trigger.severity === "moderate")
        ? "moderate"
        : "low";

  const rationale =
    severity === "critical"
      ? "Correlated or high-impact evidence indicates critical constitutional risk."
      : severity === "high"
        ? "Evidence indicates elevated constitutional risk requiring review."
        : severity === "moderate"
          ? "Evidence indicates moderate caution with bounded review needs."
          : "Evidence remains within observational risk bounds.";

  return Object.freeze({
    riskId: hashAuditEpisodeValue("autonomy-audit-risk-id", {
      triggerHash: input.monitoringModel.triggerHash,
      severity,
      createdAt: input.createdAt,
    }),
    severity,
    cautionState: input.monitoringModel.cautionState,
    rationale,
    triggerIds: Object.freeze(input.monitoringModel.triggers.map((trigger) => trigger.triggerId)),
    evidenceHashes: Object.freeze(input.monitoringModel.triggers.flatMap((trigger) => trigger.evidenceHashes).sort((left, right) => left.localeCompare(right))),
    createdAt: input.createdAt,
  });
}
