import type { ConstitutionalEscalationBinding } from "@/types/constitutional-coordination";

export function assembleEscalationLineage(binding: ConstitutionalEscalationBinding): Readonly<{
  escalationLineageId: string;
  escalationSnapshotId: string;
}> {
  return Object.freeze({
    escalationLineageId: binding.escalationLineageId,
    escalationSnapshotId: binding.escalationSnapshotId,
  });
}
