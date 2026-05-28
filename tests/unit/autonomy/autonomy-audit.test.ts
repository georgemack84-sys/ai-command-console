import { describe, expect, it } from "vitest";

import { buildAutonomyAuditRecord } from "@/services/autonomy/autonomyAudit";

describe("buildAutonomyAuditRecord", () => {
  it("emits deterministic append-ready supervision audit payloads", () => {
    const record = buildAutonomyAuditRecord({
      supervisionState: "BLOCKED",
      stabilizationRecommended: false,
      escalationRequired: true,
      containmentRequired: true,
      operationalRisk: 0.88,
      supervisionConfidence: 0.12,
      blockedReasons: ["approval_bypass_blocked"],
      timestamp: "2026-05-09T00:00:00.000Z",
    });

    expect(record.auditRef).toBe("autonomy:blocked:2026-05-09T00:00:00.000Z");
  });
});
