import type { GovernanceAwareEscalationRecord } from "@/types/escalation";
import type { ConstitutionalEscalationBinding } from "@/types/constitutional-coordination";
import { hashContainmentValue } from "@/services/coordination-containment/containmentHasher";

export function bindEscalationLineage(escalationRecord: GovernanceAwareEscalationRecord): ConstitutionalEscalationBinding {
  const binding: ConstitutionalEscalationBinding = Object.freeze({
    escalationSnapshotId: hashContainmentValue("constitutional-escalation-snapshot-id", {
      escalationId: escalationRecord.decision.escalationId,
      escalationHash: escalationRecord.escalationHash,
    }),
    escalationSnapshotHash: escalationRecord.escalationHash,
    escalationLineageId: escalationRecord.lineage.ledgerId,
    replaySafe: escalationRecord.decision.replaySafe,
    createdAt: escalationRecord.decision.createdAt,
    bindingHash: "",
  });
  return Object.freeze({
    ...binding,
    bindingHash: hashContainmentValue("constitutional-escalation-binding", binding),
  });
}
