import { describe, expect, it } from "vitest";

import { buildSurvivabilityAuditRecord } from "@/services/survivability/survivabilityAudit";

describe("audit survivability", () => {
  it("creates append-ready audit records only", () => {
    const record = buildSurvivabilityAuditRecord({
      survivabilityState: "CONTAINED",
      recommendedAction: "CONTAIN",
      isolatedDomains: ["replay"],
      blockedReasons: ["audit_lineage_degraded"],
      timestamp: "2026-05-09T00:00:00.000Z",
    });

    expect(record.auditRef).toContain("survivability:");
    expect(record.blockedReasons).toContain("audit_lineage_degraded");
  });
});
