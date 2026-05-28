import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { canAutoApproveRecovery } = require("../../services/recoveryAutonomyGate.js");

describe("recovery autonomy gate", () => {
  it("blocks unless all gate conditions are satisfied", () => {
    expect(
      canAutoApproveRecovery({
        recoveryRequest: { status: "PREVIEWED", recoveryMode: "resume" },
        autonomyPolicy: { action: "auto_approve" },
        riskScore: { riskLevel: "LOW" },
        modes: { autonomyAllowlist: ["resume"] },
      }),
    ).toEqual({
      allowed: false,
      reason: "request_not_awaiting_approval",
      gateCode: "BLOCK_REQUEST_STATE",
    });
  });

  it("allows low-risk supervised approval for allowlisted modes", () => {
    expect(
      canAutoApproveRecovery({
        recoveryRequest: {
          status: "AWAITING_APPROVAL",
          recoveryMode: "resume",
          preview: { replayCandidates: [{ classification: "SAFE_REPLAY" }] },
        },
        autonomyPolicy: { action: "auto_approve" },
        riskScore: { riskLevel: "LOW" },
        modes: { autonomyAllowlist: ["resume", "retry_safe_steps"], autonomyLevel: "SUPERVISED_APPROVAL" },
      }),
    ).toEqual({
      allowed: true,
      reason: "autonomy_gate_passed",
      gateCode: "ALLOW_AUTO_APPROVAL",
    });
  });
});
