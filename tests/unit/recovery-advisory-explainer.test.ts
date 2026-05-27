import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { explainRecoveryAdvisory } = require("../../services/recoveryAdvisoryExplainer.js");

describe("recovery advisory explainer", () => {
  it("produces deterministic operator-facing advisory output", () => {
    const result = explainRecoveryAdvisory({
      candidate: {
        executionId: "exec_1",
        signalType: "EXPIRED_LEASE",
        evidence: { executionStatus: "running" },
      },
      signal: {
        signalType: "EXPIRED_LEASE",
        severity: "HIGH",
        confidence: 0.9,
        evidence: { executionStatus: "running" },
        reason: "execution_lease_expired",
      },
      recommendation: {
        recommendation: "resume",
        confidence: 0.9,
        requiresOperator: true,
        reason: "execution_lease_expired",
      },
    });

    expect(result).toEqual({
      ok: true,
      data: expect.objectContaining({
        summary: expect.stringContaining("advisory only"),
        evidenceSummary: expect.stringContaining("EXPIRED_LEASE"),
        recommendedAction: "resume",
        operatorWarning: expect.stringContaining("D-7"),
        safetyNotes: expect.any(Array),
      }),
    });
  });
});
