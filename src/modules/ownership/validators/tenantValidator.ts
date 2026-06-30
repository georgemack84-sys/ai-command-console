import { isNonEmptyString } from "../../../core";

const blockedTenantIds = new Set(["shared", "global", "unknown"]);

export function validateTenantId(tenantId: unknown): { status: "VALID" | "REJECTED"; reasons: string[] } {
  const reasons: string[] = [];

  if (!isNonEmptyString(tenantId)) {
    reasons.push("tenant_id is required");
  } else if (blockedTenantIds.has(tenantId.trim().toLowerCase())) {
    reasons.push("tenant_id must be explicit");
  }

  return { status: reasons.length === 0 ? "VALID" : "REJECTED", reasons };
}
