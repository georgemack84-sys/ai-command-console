import type {
  ApprovalConflictLineage,
  ApprovalConflictLineageEntry,
} from "@/types/approval-conflict";
import { hashApprovalConflictValue } from "./deterministicApprovalConflictHasher";

export function appendApprovalConflictLineage(input: {
  existing?: ApprovalConflictLineage;
  entry: ApprovalConflictLineageEntry;
}): ApprovalConflictLineage {
  const entries = Object.freeze([
    ...(input.existing?.entries ?? []),
    input.entry,
  ].sort((left, right) => {
    if (left.createdAt !== right.createdAt) {
      return left.createdAt.localeCompare(right.createdAt);
    }
    return left.entryId.localeCompare(right.entryId);
  }));
  return Object.freeze({
    lineageId: input.existing?.lineageId
      ?? hashApprovalConflictValue("lineage-id", entries[0]?.entryId ?? "empty"),
    entries,
    lineageHash: hashApprovalConflictValue("lineage", entries),
  });
}
