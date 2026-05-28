import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EscalationPressureCard } from "@/components/continuity/EscalationPressureCard";

describe("EscalationPressureCard", () => {
  it("renders escalation pressure and review action", () => {
    render(
      <EscalationPressureCard
        stability={{
          operationalState: "UNSTABLE",
          survivabilityScore: 0.34,
          degradationRate: 0.58,
          recoveryPressure: 0.61,
          escalationPressure: 0.66,
          continuityConfidence: 0.39,
          unstableSubsystems: ["replay"],
          stabilizationRequired: true,
          containmentRecommended: true,
          lockdownRecommended: false,
          replayInstabilityScore: 0.72,
          staleExecutionSpread: 0.44,
          dependencyInstabilityScore: 0.3,
          operatorInterventionPressure: 0.22,
          recoverySuccessConfidence: 0.21,
          trend: "DECLINING",
          confidence: 0.41,
          reasons: ["replay_divergence_detected"],
          disputed: false,
          timestamp: "2026-05-09T00:00:00.000Z",
        }}
        escalation={{
          escalationId: "esc_1",
          escalationType: "recovery",
          escalationState: "CONTAINED",
          escalationSeverity: "CRITICAL",
          escalationLineageId: "lineage_1",
          conflictingEscalations: [],
          requiresContainment: true,
          requiresOperatorVisibility: true,
          frozen: false,
          blocked: false,
          recommendedActions: ["PRIORITIZED_REVIEW"],
          confidence: 0.63,
          evidenceCount: 4,
          reason: "replay instability",
          source: "operational.stability",
          timestamp: "2026-05-09T00:00:00.000Z",
        }}
      />,
    );

    expect(screen.getByText(/pressure: 66%/i)).toBeInTheDocument();
    expect(screen.getByText(/recommended review: PRIORITIZED_REVIEW/i)).toBeInTheDocument();
  });
});
