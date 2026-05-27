import type { EscalationConflictInspection } from "@/types/approval-conflict";
import { hashApprovalConflictValue } from "@/services/approval-conflict/deterministicApprovalConflictHasher";

export function inspectEscalationConflict(input: {
  escalationId: string;
  escalationState: string;
  escalationLineageId: string;
}): EscalationConflictInspection {
  return Object.freeze({
    ...input,
    inspectionHash: hashApprovalConflictValue("escalation-conflict-inspection", input),
  });
}
