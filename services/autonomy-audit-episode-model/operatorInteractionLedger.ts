import type { OperatorInteraction } from "@/types/autonomy-audit-episode-model";
import type { OverrideContractRecord } from "@/services/human-override-contract";
import { hashAuditEpisodeValue } from "./auditEpisodeHasher";

export function recordOperatorInteractions(input: {
  overrideContract: OverrideContractRecord;
  createdAt: string;
}): readonly OperatorInteraction[] {
  return Object.freeze(
    input.overrideContract.lineage.entries.map((entry) =>
      Object.freeze({
        interactionId: hashAuditEpisodeValue("autonomy-audit-operator-interaction-id", {
          overrideId: entry.override.overrideId,
          createdAt: input.createdAt,
        }),
        operatorId: entry.override.operatorId,
        operatorRole: entry.override.operatorRole,
        interactionType: entry.override.overrideType,
        targetType: entry.override.targetType,
        targetId: entry.override.targetId,
        reasonCode: entry.override.reasonCode,
        createdAt: entry.override.createdAt,
      })),
  );
}
