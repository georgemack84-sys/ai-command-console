import type { ApprovalConflictInspection } from "@/types/approval-conflict";
import { hashApprovalConflictValue } from "@/services/approval-conflict/deterministicApprovalConflictHasher";

export function inspectApprovalConflictRecord(input: {
  conflictId: string;
  coordinationId: string;
  approvalConflictState: string;
}): ApprovalConflictInspection {
  return Object.freeze({
    ...input,
    inspectionHash: hashApprovalConflictValue("approval-conflict-record-inspection", input),
  });
}

export const inspectApprovalConflict = inspectApprovalConflictRecord;
