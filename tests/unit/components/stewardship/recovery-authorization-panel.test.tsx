import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RecoveryAuthorizationPanel } from "@/components/stewardship/RecoveryAuthorizationPanel";
import type { RecoveryDecisionIntelligenceResult } from "@/services/decision/recoveryDecisionTypes";

const decision: RecoveryDecisionIntelligenceResult = {
  decisionId: "decision_1",
  executionId: "exec_1",
  recommendedAction: "GOVERNANCE_REVIEW",
  constitutionalAction: "REQUIRE_APPROVAL",
  constitutionallyAllowed: false,
  requiresApproval: true,
  requiresEscalation: false,
  requiresContainment: false,
  decisionConfidence: 0.48,
  governanceRisk: 0.66,
  continuityImpact: 0.44,
  riskScore: 0.61,
  uncertaintyLevel: "HIGH",
  reasons: ["forecast_governance_instability_high"],
  blockedReasons: ["approval_required"],
  constitutionalViolations: [],
  forecastLineageIds: ["lineage_1"],
  mutable: false,
  generatedAt: "2026-05-09T00:00:00.000Z",
};

describe("RecoveryAuthorizationPanel", () => {
  it("renders authorization state as advisory only", () => {
    render(<RecoveryAuthorizationPanel decision={decision} />);

    expect(screen.getByText(/recovery authorization/i)).toBeInTheDocument();
    expect(screen.getByText("GOVERNANCE_REVIEW")).toBeInTheDocument();
    expect(screen.getByText(/mutable: no/i)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
