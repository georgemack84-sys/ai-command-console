import { describe, expect, it } from "vitest";

import { coordinateSystems } from "@/services/coordination/multiSystemCoordinator";

describe("coordinateSystems", () => {
  it("runtime enforcement beats coordination", () => {
    const result = coordinateSystems({
      participatingSystems: ["GOVERNANCE", "CONTAINMENT", "SUPERVISION"],
      dependencies: {},
      enforcement: {
        executable: false,
        enforcementState: "CONSTITUTIONAL_DENIAL",
        auditRecord: { auditRef: "enforcement:a" },
      },
      supervision: {
        supervisionState: "BLOCKED",
        auditRecord: { auditRef: "supervision:a" },
      },
      sovereignty: {
        sovereigntyState: "CRITICAL",
      },
      approvalRequired: true,
      approvalVerified: false,
      disputedTruthPresent: true,
      replayMismatch: false,
      raceDetected: false,
      timestamp: "2026-05-09T00:00:00.000Z",
    });

    expect(result.record.coordinationState).toBe("DISPUTED");
    expect(result.record.constitutionalSafe).toBe(false);
  });
});
