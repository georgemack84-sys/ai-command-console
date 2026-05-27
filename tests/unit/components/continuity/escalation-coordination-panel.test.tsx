import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EscalationCoordinationPanel } from "@/components/continuity/EscalationCoordinationPanel";

describe("EscalationCoordinationPanel", () => {
  it("renders active escalation state and severity", () => {
    render(
      <EscalationCoordinationPanel
        escalation={{
          escalationId: "esc_1",
          escalationType: "governance",
          escalationState: "ESCALATED",
          escalationSeverity: "HIGH",
          escalationLineageId: "lineage_1",
          conflictingEscalations: [],
          requiresContainment: false,
          requiresOperatorVisibility: true,
          frozen: false,
          blocked: false,
          recommendedActions: ["PRIORITIZED_REVIEW"],
          confidence: 0.72,
          evidenceCount: 3,
          reason: "pressure rising",
          source: "operational.stability",
          timestamp: "2026-05-09T00:00:00.000Z",
        }}
      />,
    );

    expect(screen.getByText(/escalated/i)).toBeInTheDocument();
    expect(screen.getByText(/severity: high/i)).toBeInTheDocument();
  });
});
