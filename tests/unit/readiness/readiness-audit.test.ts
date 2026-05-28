import { describe, expect, it } from "vitest";

import { buildReadinessAuditRecord } from "@/services/readiness/readinessAudit";

describe("buildReadinessAuditRecord", () => {
  it("builds append-ready but non-mutating audit records", () => {
    const record = buildReadinessAuditRecord({
      readinessState: "LIMITED_READINESS",
      readinessScore: 67,
      blockedReasons: ["simulation_trust_below_threshold"],
      evidenceRefs: ["audit_1", "lineage_1"],
      timestamp: "2026-05-09T00:00:00.000Z",
    });

    expect(record.eventType).toBe("AUTONOMOUS_RECOVERY_READINESS_EVALUATED");
    expect(record.advisoryOnly).toBe(true);
    expect(record.liveAutonomyEnabled).toBe(false);
  });
});
