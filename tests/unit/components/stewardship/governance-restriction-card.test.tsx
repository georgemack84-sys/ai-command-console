import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GovernanceRestrictionCard } from "@/components/stewardship/GovernanceRestrictionCard";
import type { RecoveryDecisionIntelligenceResult } from "@/services/decision/recoveryDecisionTypes";

const decision: RecoveryDecisionIntelligenceResult = {
  decisionId: "decision_1",
  executionId: "exec_1",
  recommendedAction: "FREEZE",
  constitutionalAction: "DENY",
  constitutionallyAllowed: false,
  requiresApproval: true,
  requiresEscalation: true,
  requiresContainment: true,
  decisionConfidence: 0.2,
  governanceRisk: 0.9,
  continuityImpact: 0.8,
  riskScore: 0.92,
  uncertaintyLevel: "CRITICAL",
  reasons: ["governance_dispute_present"],
  blockedReasons: ["disputed_truth_blocks_recovery"],
  constitutionalViolations: ["disputed_truth_blocks_recovery"],
  forecastLineageIds: ["lineage_1"],
  mutable: false,
  generatedAt: "2026-05-09T00:00:00.000Z",
};

describe("GovernanceRestrictionCard", () => {
  it("shows governance restrictions without controls", () => {
    render(<GovernanceRestrictionCard decision={decision} />);

    expect(screen.getByText(/governance restrictions/i)).toBeInTheDocument();
    expect(screen.getByText(/approval: required/i)).toBeInTheDocument();
    expect(screen.getByText(/risk: 92%/i)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
