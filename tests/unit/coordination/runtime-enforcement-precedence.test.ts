import { describe, expect, it } from "vitest";

import { coordinateSystems } from "@/services/coordination/multiSystemCoordinator";

describe("runtime enforcement precedence", () => {
  it("does not let coordination override enforcement", () => {
    const result = coordinateSystems({
      participatingSystems: ["GOVERNANCE", "SUPERVISION"],
      dependencies: {},
      enforcement: {
        executable: false,
        enforcementState: "EXECUTION_SUPPRESSED",
        auditRecord: { auditRef: "enforcement:a" },
      },
      supervision: {
        supervisionState: "SUPERVISING",
        auditRecord: { auditRef: "supervision:a" },
      },
      sovereignty: { sovereigntyState: "UNSTABLE" },
      approvalRequired: false,
      approvalVerified: true,
      disputedTruthPresent: false,
      replayMismatch: false,
      raceDetected: false,
      timestamp: "2026-05-09T00:00:00.000Z",
    });

    expect(result.record.constitutionalSafe).toBe(false);
  });
});
