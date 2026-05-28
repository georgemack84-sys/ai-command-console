import type { BoundedOrchestrationRecord } from "@/types/bounded-orchestration-framework";
import type { OrchestrationBoundaryInspection } from "@/types/coordination-boundary-enforcement";
import { hashCoordinationReplayValue } from "@/services/coordination-replay/replayHashEngine";

export function inspectOrchestrationBoundary(
  orchestration: BoundedOrchestrationRecord,
): OrchestrationBoundaryInspection {
  const base = Object.freeze({
    orchestrationId: orchestration.orchestrationId,
    topologyHash: orchestration.deterministicHash,
    isolationHash: hashCoordinationReplayValue("coordination-boundary-isolation-hash", orchestration.isolation),
    containmentState: orchestration.containment.inheritedState,
    ceiling: orchestration.ceiling,
  });
  return Object.freeze({
    ...base,
    inspectionHash: hashCoordinationReplayValue("coordination-boundary-orchestration-inspection", base),
  });
}
