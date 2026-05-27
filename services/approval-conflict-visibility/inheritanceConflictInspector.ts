import type { InheritanceConflictInspection } from "@/types/approval-conflict";
import { hashApprovalConflictValue } from "@/services/approval-conflict/deterministicApprovalConflictHasher";

export function inspectInheritanceConflict(input: {
  inheritanceBlocked: boolean;
  scopeIsolated: boolean;
}): InheritanceConflictInspection {
  return Object.freeze({
    ...input,
    inspectionHash: hashApprovalConflictValue("inheritance-conflict-inspection", input),
  });
}
