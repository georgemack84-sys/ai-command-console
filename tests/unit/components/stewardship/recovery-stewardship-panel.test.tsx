import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RecoveryStewardshipPanel } from "@/components/stewardship/RecoveryStewardshipPanel";
import { ConstitutionalResilienceState } from "@/services/resilience/resilienceTypes";

describe("RecoveryStewardshipPanel", () => {
  it("renders frozen and disputed recovery visibility", () => {
    render(
      <RecoveryStewardshipPanel
        recoveryStewardship={{
          supervisedRecoveries: ["exec_1"],
          blockedRecoveries: ["exec_2"],
          frozenRecoveryChains: ["chain_1"],
          disputedOperations: ["exec_3"],
          activeStabilizationOperations: ["stabilize_runtime"],
          recoveryPriorityOrder: ["exec_1", "exec_2"],
        }}
        resilience={{
          resilienceState: ConstitutionalResilienceState.CONSTITUTIONALLY_FROZEN,
          survivabilityScore: 0.2,
          constitutionalIntegrityScore: 0.3,
          operationalRiskScore: 0.8,
          collapseProbability: 0.7,
          degradationVelocity: 0.5,
          governanceIntegrity: 0.4,
          continuityIntegrity: 0.3,
          escalationPressure: 0.6,
          stabilizationConfidence: 0.4,
          requiresContainment: true,
          requiresFreeze: true,
          requiresEscalation: true,
          requiresOperatorIntervention: true,
          disputedConditions: [],
          resilienceViolations: [],
          affectedSubsystems: [],
          generatedAt: "2026-05-09T00:00:00.000Z",
        }}
      />,
    );

    expect(screen.getByText(/frozen chains: 1/i)).toBeInTheDocument();
  });
});
