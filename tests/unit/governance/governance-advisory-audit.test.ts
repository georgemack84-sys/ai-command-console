import { describe, expect, it } from "vitest";

import { buildGovernanceAdvisoryAuditRecord } from "@/services/governance/governanceAdvisoryAudit";

describe("buildGovernanceAdvisoryAuditRecord", () => {
  it("produces append-ready deterministic audit objects", () => {
    const record = buildGovernanceAdvisoryAuditRecord({
      eventType: "governance.recommendation.created",
      recommendationIds: ["govrec:test"],
      blockedRecommendations: [],
      evidenceRefs: ["evidence:a"],
      timestamp: "2026-05-09T00:00:00.000Z",
    });

    expect(record.auditRef).toBe("governance-audit:governance.recommendation.created:2026-05-09T00:00:00.000Z");
    expect(record.recommendationIds).toEqual(["govrec:test"]);
  });
});
