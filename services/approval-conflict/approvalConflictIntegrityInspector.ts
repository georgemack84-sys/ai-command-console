import type { ApprovalConflictInspection } from "@/types/approval-conflict";
import { hashApprovalConflictValue } from "./deterministicApprovalConflictHasher";

export function inspectApprovalConflictIntegrity(input: {
  conflictId: string;
  coordinationId: string;
  approvalConflictState: string;
}): ApprovalConflictInspection {
  return Object.freeze({
    conflictId: input.conflictId,
    coordinationId: input.coordinationId,
    approvalConflictState: input.approvalConflictState,
    inspectionHash: hashApprovalConflictValue("integrity-inspection", input),
  });
}
