import type { GovernanceConflictInspection } from "@/types/approval-conflict";
import { hashApprovalConflictValue } from "@/services/approval-conflict/deterministicApprovalConflictHasher";

export function inspectGovernanceConflictRecord(input: {
  governanceSnapshotId: string;
  governanceLinked: boolean;
}): GovernanceConflictInspection {
  return Object.freeze({
    ...input,
    inspectionHash: hashApprovalConflictValue("governance-conflict-record-inspection", input),
  });
}

export const inspectGovernanceConflict = inspectGovernanceConflictRecord;
