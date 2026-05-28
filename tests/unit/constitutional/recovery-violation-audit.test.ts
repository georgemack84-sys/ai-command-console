import { describe, expect, it } from "vitest";

import { buildRecoveryViolationAudit } from "@/services/constitutional/recoveryViolationAudit";

describe("buildRecoveryViolationAudit", () => {
  it("builds immutable audit-ready violation records", () => {
    const record = buildRecoveryViolationAudit({
      executionId: "exec_1",
      constitutionalAction: "FREEZE",
      violations: ["operator_freeze_enforced"],
      reasons: ["operator_freeze_enforced"],
      evidence: ["audit_1"],
      generatedAt: "2026-05-09T00:00:00.000Z",
    });

    expect(record.eventType).toBe("constitution.freeze_enforced");
    expect(record.evidence).toContain("audit_1");
  });
});
