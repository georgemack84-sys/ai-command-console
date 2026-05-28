import { describe, expect, it } from "vitest";

import { evaluateVerificationDisputes } from "../../services/recoveryVerification/verificationDisputeEngine";

describe("verification dispute engine", () => {
  it("blocks on replay and governance disputes", () => {
    const result = evaluateVerificationDisputes({
      replayIntegrity: { valid: false, evidence: ["timeline:disputed"] },
      governanceIntegrity: { valid: false, evidence: ["approval:audit_missing"] },
      continuityState: { replayDivergenceDetected: true },
      reconciliationEvidence: ["execution:status_mismatch"],
    });

    expect(result.blocking).toBe(true);
    expect(result.disputes.map((entry) => entry.code)).toEqual(
      expect.arrayContaining([
        "replay_divergence",
        "governance_integrity_failed",
        "continuity_replay_divergence",
        "truth_reconciliation_dispute",
      ]),
    );
  });
});
