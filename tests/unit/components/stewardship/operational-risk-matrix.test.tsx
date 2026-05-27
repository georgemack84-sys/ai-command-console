import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OperationalRiskMatrix } from "@/components/stewardship/OperationalRiskMatrix";
import { ConstitutionalResilienceState } from "@/services/resilience/resilienceTypes";

describe("OperationalRiskMatrix", () => {
  it("renders deterministic risk explanations", () => {
    render(
      <OperationalRiskMatrix
        prioritization={{
          prioritizationApproved: true,
          deterministicOrderingVerified: true,
          governanceReviewRequired: true,
          containmentPriorityRequired: false,
          survivabilityPriorityRequired: true,
          recoveryQueue: ["exec_1"],
          blockedRecoveries: [],
          disputedRecoveries: [],
          prioritizationConfidence: 0.72,
          prioritizationReasons: [],
          starvationWarnings: [],
          assessments: [{
            executionId: "exec_1",
            prioritizationScore: 0.88,
            category: "SURVIVABILITY_CRITICAL",
            state: "ESCALATED",
            deterministicRank: 1,
            governanceReviewRequired: true,
            prioritizationReasons: ["survivability_impact_elevated"],
            prioritizationWarnings: [],
          }],
          timestamp: "2026-05-09T00:00:00.000Z",
        }}
        resilience={{
          resilienceState: ConstitutionalResilienceState.CRITICAL,
          survivabilityScore: 0.3,
          constitutionalIntegrityScore: 0.5,
          operationalRiskScore: 0.78,
          collapseProbability: 0.66,
          degradationVelocity: 0.52,
          governanceIntegrity: 0.5,
          continuityIntegrity: 0.44,
          escalationPressure: 0.62,
          stabilizationConfidence: 0.41,
          requiresContainment: true,
          requiresFreeze: false,
          requiresEscalation: true,
          requiresOperatorIntervention: true,
          disputedConditions: [],
          resilienceViolations: [],
          affectedSubsystems: [],
          generatedAt: "2026-05-09T00:00:00.000Z",
        }}
      />,
    );

    expect(screen.getByText(/priority category: survivability_critical/i)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
