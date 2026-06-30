import { isNonEmptyString } from "../../../core";

const blockedOwnerIds = new Set(["anonymous", "unknown", "system-inherited"]);

export function validateOwnerId(ownerId: unknown): { status: "VALID" | "REJECTED"; reasons: string[] } {
  const reasons: string[] = [];

  if (!isNonEmptyString(ownerId)) {
    reasons.push("owner_id is required");
  } else if (blockedOwnerIds.has(ownerId.trim().toLowerCase())) {
    reasons.push("owner_id must be explicit");
  }

  return { status: reasons.length === 0 ? "VALID" : "REJECTED", reasons };
}
