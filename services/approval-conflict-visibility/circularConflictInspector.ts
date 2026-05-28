import type { CircularConflictInspection } from "@/types/approval-conflict";
import { hashApprovalConflictValue } from "@/services/approval-conflict/deterministicApprovalConflictHasher";

export function inspectCircularConflict(input: {
  recursiveDetected: boolean;
  graphHash: string;
}): CircularConflictInspection {
  return Object.freeze({
    ...input,
    inspectionHash: hashApprovalConflictValue("circular-conflict-inspection", input),
  });
}
