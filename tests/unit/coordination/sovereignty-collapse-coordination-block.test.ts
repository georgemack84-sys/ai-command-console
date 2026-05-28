import { describe, expect, it } from "vitest";

import { coordinateSystems } from "@/services/coordination/multiSystemCoordinator";

describe("sovereignty collapse coordination block", () => {
  it("blocks unsafe coordination during collapse", () => {
    const result = coordinateSystems({
      participatingSystems: ["GOVERNANCE", "CONTAINMENT"],
      dependencies: {},
      enforcement: {
        executable: false,
        enforcementState: "CONTAINMENT_ACTIVE",
        auditRecord: { auditRef: "enforcement:a" },
      },
      supervision: {
        supervisionState: "FROZEN",
        auditRecord: { auditRef: "supervision:a" },
      },
      sovereignty: { sovereigntyState: "COLLAPSING" },
      approvalRequired: true,
      approvalVerified: false,
      disputedTruthPresent: false,
      replayMismatch: false,
      raceDetected: false,
      timestamp: "2026-05-09T00:00:00.000Z",
    });

    expect(result.record.coordinationState).toBe("CONTAINED");
  });
});
