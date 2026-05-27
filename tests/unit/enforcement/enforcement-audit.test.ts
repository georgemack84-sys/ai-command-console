import { describe, expect, it } from "vitest";

import { buildEnforcementAuditRecord } from "@/services/enforcement/enforcementAudit";

describe("buildEnforcementAuditRecord", () => {
  it("builds immutable append-ready enforcement audit payloads", () => {
    const record = buildEnforcementAuditRecord({
      enforcementState: "EMERGENCY_LOCK_ACTIVE",
      blockedReasons: ["emergency_lock_active"],
      containmentApplied: true,
      escalationTriggered: true,
      emergencyLockActive: true,
      enforcementConfidence: 0.21,
      sourceLineage: ["governance:LOCKED"],
      timestamp: "2026-05-09T00:00:00.000Z",
    });

    expect(record.auditRef).toBe("enforcement:emergency_lock_active:2026-05-09T00:00:00.000Z");
    expect(record.blockedReasons).toEqual(["emergency_lock_active"]);
  });
});
