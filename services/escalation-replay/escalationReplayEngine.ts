import type { CoordinationReplayInput, EscalationReplayView } from "@/types/coordination-replay";

export function replayEscalationState(input: CoordinationReplayInput): EscalationReplayView {
  const binding = input.coordinationRecord.escalationBinding;
  return Object.freeze({
    escalationSnapshotId: binding?.escalationSnapshotId,
    escalationLineageId: binding?.escalationLineageId,
    escalationSnapshotHash: binding?.escalationSnapshotHash,
    replaySafe: binding?.replaySafe ?? true,
    bindingHash: binding?.bindingHash,
  });
}
