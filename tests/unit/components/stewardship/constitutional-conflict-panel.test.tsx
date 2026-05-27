import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ConstitutionalConflictPanel } from "@/components/stewardship/ConstitutionalConflictPanel";
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
  forecastLineageIds: ["lineage_1", "lineage_2"],
  mutable: false,
  generatedAt: "2026-05-09T00:00:00.000Z",
};

describe("ConstitutionalConflictPanel", () => {
  it("shows blocked reasons and lineage", () => {
    render(<ConstitutionalConflictPanel decision={decision} />);

    expect(screen.getByText(/constitutional conflict/i)).toBeInTheDocument();
    expect(screen.getByText(/blocked reasons: disputed_truth_blocks_recovery/i)).toBeInTheDocument();
    expect(screen.getByText(/forecast lineage: lineage_1, lineage_2/i)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
