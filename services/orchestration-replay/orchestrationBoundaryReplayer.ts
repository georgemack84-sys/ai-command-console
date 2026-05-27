import type { CoordinationReplayInput, OrchestrationReplayView } from "@/types/coordination-replay";
import { hashCoordinationReplayValue } from "@/services/coordination-replay/replayHashEngine";

export function replayOrchestrationBoundary(input: CoordinationReplayInput): OrchestrationReplayView {
  const record = input.orchestrationRecord;
  return Object.freeze({
    orchestrationId: record.orchestrationId,
    orchestrationState: record.orchestrationState,
    ceiling: record.ceiling,
    containmentState: record.containment.inheritedState,
    topologyHash: hashCoordinationReplayValue("orchestration-topology", record.topology),
    isolationHash: hashCoordinationReplayValue("orchestration-isolation", record.isolation),
    deterministicHash: record.deterministicHash,
  });
}
