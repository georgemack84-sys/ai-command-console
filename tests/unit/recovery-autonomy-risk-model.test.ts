import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { scoreRecoveryAutonomyRisk } = require("../../services/recoveryAutonomyRiskModel.js");

describe("recovery autonomy risk model", () => {
  it("defaults to OFF level and deterministic low risk for safe supervised resume", () => {
    const result = scoreRecoveryAutonomyRisk({
      recoveryRequest: {
        recoveryMode: "resume",
        status: "AWAITING_APPROVAL",
        preview: { replayCandidates: [{ classification: "SAFE_REPLAY" }] },
      },
      advisory: { recommendation: { confidence: 0.97 } },
      preview: { blocked: false },
      policy: { action: "auto_approve" },
    });

    expect(result).toEqual({
      riskLevel: "LOW",
      score: expect.any(Number),
      reasons: expect.arrayContaining(["safe_replay_candidate"]),
    });
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(1);
  });

  it("marks corrupted as critical and unknown as unknown", () => {
    expect(
      scoreRecoveryAutonomyRisk({
        recoveryRequest: {
          recoveryMode: "resume",
          preview: { replayCandidates: [{ classification: "CORRUPTED" }] },
        },
        advisory: null,
        preview: null,
        policy: { action: "block" },
      }),
    ).toEqual({
      riskLevel: "CRITICAL",
      score: 1,
      reasons: ["corrupted_recovery_candidate"],
    });

    expect(
      scoreRecoveryAutonomyRisk({
        recoveryRequest: {
          recoveryMode: "resume",
          preview: { replayCandidates: [{ classification: "UNKNOWN" }] },
        },
        advisory: null,
        preview: null,
        policy: { action: "block" },
      }),
    ).toEqual({
      riskLevel: "UNKNOWN",
      score: 1,
      reasons: ["unknown_recovery_evidence"],
    });
  });
});
