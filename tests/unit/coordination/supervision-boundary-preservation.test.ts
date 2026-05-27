import { describe, expect, it } from "vitest";

import { coordinateSystems } from "@/services/coordination/multiSystemCoordinator";

describe("supervision boundary preservation", () => {
  it("supervision cannot elevate authority", () => {
    const result = coordinateSystems({
      participatingSystems: ["SUPERVISION", "GOVERNANCE"],
      dependencies: {},
      enforcement: {
        executable: true,
        enforcementState: "EXECUTION_ALLOWED",
        auditRecord: { auditRef: "enforcement:a" },
      },
      supervision: {
        supervisionState: "BLOCKED",
        auditRecord: { auditRef: "supervision:a" },
      },
      sovereignty: { sovereigntyState: "STABLE" },
      approvalRequired: false,
      approvalVerified: true,
      disputedTruthPresent: false,
      replayMismatch: false,
      raceDetected: false,
      timestamp: "2026-05-09T00:00:00.000Z",
    });

    expect(result.record.coordinationState).toBe("BLOCKED");
  });
});
