import { describe, expect, it } from "vitest";

import { certifyRecoveryTruth } from "../../../../services/recovery/verification/recoveryCertificationEngine";

describe("recovery certification engine", () => {
  it("certifies fully reconciled recovery truth", () => {
    const result = certifyRecoveryTruth({
      reconciliationState: "RECONCILED",
      replayConsistent: true,
      governanceConsistent: true,
      continuityConsistent: true,
      immutableEvidenceValid: true,
      disputed: false,
      divergenceDetected: false,
      warnings: [],
    });

    expect(result.decision).toBe("CERTIFIED");
  });

  it("rejects governance denial and replay divergence", () => {
    const result = certifyRecoveryTruth({
      reconciliationState: "DIVERGED",
      replayConsistent: false,
      governanceConsistent: false,
      continuityConsistent: false,
      immutableEvidenceValid: true,
      disputed: true,
      divergenceDetected: true,
      warnings: [],
    });

    expect(["QUARANTINED", "REJECTED"]).toContain(result.decision);
  });
});
