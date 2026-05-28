import type { MissionGraphSnapshot } from "@/types/mission-graph";
import type { RationaleInspection } from "@/types/human-supremacy";
import { hashInterventionValue } from "@/services/human-supremacy/interventionHasher";

export function inspectRationale(input: {
  coordinationId: string;
  operatorReason: string;
  missionGraph: MissionGraphSnapshot;
}): RationaleInspection {
  return Object.freeze({
    rationaleSnapshotId: hashInterventionValue("rationale-inspection-id", {
      coordinationId: input.coordinationId,
      operatorReason: input.operatorReason,
    }),
    coordinationId: input.coordinationId,
    operatorReason: input.operatorReason,
    warnings: Object.freeze(input.missionGraph.warnings),
    rationaleHash: hashInterventionValue("rationale-inspection", {
      coordinationId: input.coordinationId,
      operatorReason: input.operatorReason,
      warnings: input.missionGraph.warnings,
    }),
  });
}
