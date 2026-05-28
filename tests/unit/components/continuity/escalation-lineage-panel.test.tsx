import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EscalationLineagePanel } from "@/components/continuity/EscalationLineagePanel";

describe("EscalationLineagePanel", () => {
  it("renders lineage visibility", () => {
    render(
      <EscalationLineagePanel
        escalation={{
          escalationId: "esc_1",
          escalationType: "containment",
          escalationState: "FROZEN",
          escalationSeverity: "CRITICAL",
          escalationLineageId: "lineage_1",
          parentEscalationId: "esc_0",
          conflictingEscalations: ["esc_2"],
          requiresContainment: true,
          requiresOperatorVisibility: true,
          frozen: true,
          blocked: false,
          recommendedActions: ["RETAIN_CONTAINMENT"],
          confidence: 0.55,
          evidenceCount: 4,
          reason: "conflict detected",
          source: "operational.stability",
          timestamp: "2026-05-09T00:00:00.000Z",
        }}
      />,
    );

    expect(screen.getByText(/lineage_1/i)).toBeInTheDocument();
    expect(screen.getByText(/parent: esc_0/i)).toBeInTheDocument();
  });
});
