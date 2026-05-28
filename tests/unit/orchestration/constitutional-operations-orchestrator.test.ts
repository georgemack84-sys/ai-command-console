import { describe, expect, it } from "vitest";

import { runConstitutionalOperationsOrchestrator } from "@/services/orchestration/constitutionalOperationsOrchestrator";

describe("runConstitutionalOperationsOrchestrator", () => {
  it("freezes disputed truth and blocks orchestration", () => {
    const result = runConstitutionalOperationsOrchestrator({
      requestType: "recovery.review",
      constitutionalAction: "DENY",
      constitutionalViolations: ["disputed_truth_blocks_recovery"],
      validation: {
        valid: false,
        freezeActivated: true,
        containmentActivated: true,
        operatorReviewRequired: true,
        blockedReasons: ["validation_freeze_required"],
      },
      readiness: {
        readinessState: "CONSTITUTIONALLY_BLOCKED",
        readinessScore: 18,
        requiresOperatorApproval: true,
        advisoryOnly: true,
        liveAutonomyEnabled: false,
      },
      escalationCoordination: {
        frozen: true,
        blocked: true,
        conflictingEscalations: ["esc_2"],
        escalationLineageId: "lineage_1",
        requiresOperatorVisibility: true,
        confidence: 0.3,
      },
      timestamp: "2026-05-09T00:00:00.000Z",
    });

    expect(result.allowed).toBe(false);
    expect(result.constitutionalState).toBe("DENIED");
    expect(result.orchestrationAuthorized).toBe(false);
    expect(result.auditRecords.some((record) => record.eventType === "orchestration.denied")).toBe(true);
  });
});
