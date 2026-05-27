import { describe, expect, it } from "vitest";

import { resolveEscalationConflicts } from "@/services/escalation/escalationConflictResolver";

describe("resolveEscalationConflicts", () => {
  it("freezes conflicting escalation chains", () => {
    const result = resolveEscalationConflicts({
      requestedType: "recovery",
      existingEscalations: [{
        escalationId: "esc_1",
        escalationType: "containment",
        escalationState: "ACTIVE",
        escalationSeverity: "CRITICAL",
        escalationSource: "stability.engine",
        escalationReason: "replay risk",
        evidence: ["event_1"],
        escalationLineageId: "lineage_1",
        conflictingEscalations: [],
        requiresContainment: true,
        requiresOperatorVisibility: true,
        frozen: false,
        blocked: false,
        recommendedActions: [],
        confidence: 0.7,
        timestamp: "2026-05-09T00:00:00.000Z",
      }],
    });

    expect(result.frozen).toBe(true);
    expect(result.conflictingEscalations).toContain("esc_1");
  });
});
