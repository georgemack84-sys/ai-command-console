import { describe, expect, it } from "vitest";

import { computeReplayConfidence } from "../../../services/replay/replayConfidenceEngine";

describe("replay confidence engine", () => {
  it("degrades confidence for missing evidence and divergence", () => {
    const result = computeReplayConfidence({
      deterministic: false,
      missingEvidence: ["ledger:missing"],
      divergences: [
        { category: "STATE_DIVERGENCE", severity: "CRITICAL", requiresEscalation: true },
      ],
      continuityRiskScore: 85,
      staleLeaseDetected: true,
      verifiedEvidence: ["audit:present"],
    });

    expect(result.score).toBeLessThan(40);
    expect(result.confidenceLevel).toBe("UNTRUSTED");
    expect(result.riskFactors).toContain("STATE_DIVERGENCE");
  });
});
