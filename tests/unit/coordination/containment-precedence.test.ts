import { describe, expect, it } from "vitest";

import { coordinateSystems } from "@/services/coordination/multiSystemCoordinator";

describe("containment precedence", () => {
  it("containment beats stabilization", () => {
    const result = coordinateSystems({
      participatingSystems: ["CONTAINMENT", "STABILIZATION"],
      dependencies: {},
      enforcement: {
        executable: true,
        enforcementState: "EXECUTION_ALLOWED",
        auditRecord: { auditRef: "enforcement:a" },
      },
      supervision: {
        supervisionState: "STABILIZING",
        auditRecord: { auditRef: "supervision:a" },
      },
      sovereignty: { sovereigntyState: "CONTAINMENT_ACTIVE" },
      approvalRequired: false,
      approvalVerified: true,
      disputedTruthPresent: false,
      replayMismatch: false,
      raceDetected: false,
      timestamp: "2026-05-09T00:00:00.000Z",
    });

    expect(result.record.coordinationState).toBe("CONTAINED");
  });
});
