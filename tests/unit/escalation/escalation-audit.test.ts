import { describe, expect, it } from "vitest";

import { buildEscalationAuditRecord } from "@/services/escalation/escalationAudit";

describe("buildEscalationAuditRecord", () => {
  it("builds deterministic immutable audit output", () => {
    const record = buildEscalationAuditRecord({
      escalationId: "esc_1",
      escalationType: "governance",
      escalationState: "ESCALATED",
      escalationSeverity: "HIGH",
      escalationSource: "stability.engine",
      escalationReason: "pressure rising",
      evidence: ["event_1"],
      escalationLineageId: "lineage_1",
      conflictingEscalations: [],
      requiresContainment: false,
      requiresOperatorVisibility: true,
      frozen: false,
      blocked: false,
      recommendedActions: [],
      confidence: 0.7,
      timestamp: "2026-05-09T00:00:00.000Z",
    });

    expect(record.auditId).toBe("audit_esc_1");
    expect(record.eventType).toBe("escalation.created");
  });
});
