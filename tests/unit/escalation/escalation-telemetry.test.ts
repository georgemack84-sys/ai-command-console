import { describe, expect, it } from "vitest";

import { buildEscalationTelemetry } from "@/services/escalation/escalationTelemetry";

describe("buildEscalationTelemetry", () => {
  it("emits deterministic telemetry events", () => {
    const events = buildEscalationTelemetry({
      escalationId: "esc_1",
      escalationType: "containment",
      escalationState: "CONTAINED",
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
    });

    expect(events.map((entry) => entry.eventType)).toContain("escalation.contained");
  });
});
