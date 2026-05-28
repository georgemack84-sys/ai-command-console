import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { evaluateRecoveryPolicy } = require("../../services/recoveryPolicyEngine.js");

function buildPreview(classification: string) {
  return {
    blocked: ["CORRUPTED", "UNSAFE_REPLAY", "REQUIRES_OPERATOR"].includes(classification),
    replayCandidates: [
      {
        stepId: "step_1",
        classification,
        reason: classification.toLowerCase(),
      },
    ],
  };
}

describe("recovery policy engine", () => {
  it("allows safe replay without approval", () => {
    const result = evaluateRecoveryPolicy({
      plan: { executionId: "exec_1" },
      preview: buildPreview("SAFE_REPLAY"),
      modes: {},
      requestedBy: "operator_1",
    });

    expect(result).toEqual({
      allowed: true,
      requiresApproval: false,
      reason: "safe_replay",
      policyCode: "SAFE_REPLAY",
    });
  });

  it("allows idempotent replay without approval", () => {
    const result = evaluateRecoveryPolicy({
      plan: { executionId: "exec_1" },
      preview: buildPreview("IDEMPOTENT_REPLAY"),
      modes: {},
      requestedBy: "operator_1",
    });

    expect(result).toEqual({
      allowed: true,
      requiresApproval: false,
      reason: "idempotent_replay",
      policyCode: "IDEMPOTENT_REPLAY",
    });
  });

  it("requires approval for operator-guided recovery classes", () => {
    for (const classification of ["REQUIRES_OPERATOR", "UNSAFE_REPLAY", "CORRUPTED"]) {
      const result = evaluateRecoveryPolicy({
        plan: { executionId: "exec_1" },
        preview: buildPreview(classification),
        modes: {},
        requestedBy: "operator_1",
      });

      expect(result).toEqual({
        allowed: true,
        requiresApproval: true,
        reason: classification.toLowerCase(),
        policyCode: classification,
      });
    }
  });

  it("blocks unknown classification fail-closed", () => {
    const result = evaluateRecoveryPolicy({
      plan: { executionId: "exec_1" },
      preview: buildPreview("MYSTERY"),
      modes: {},
      requestedBy: "operator_1",
    });

    expect(result).toEqual({
      allowed: false,
      requiresApproval: false,
      reason: "unknown_classification",
      policyCode: "BLOCKED_UNSAFE_RECOVERY",
    });
  });
});
