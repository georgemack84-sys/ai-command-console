import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { explainAutomationDecision } = require("../../services/recoveryAutomationExplainer.js");

describe("recovery automation explainer", () => {
  it("explains automation decisions deterministically", () => {
    const result = explainAutomationDecision({
      advisory: { executionId: "exec_1", recommendation: { recommendation: "resume" } },
      policy: { action: "create_request", reason: "safe_resume", policyCode: "ALLOW_CREATE_REQUEST" },
      throttle: { throttled: false, reason: "eligible", nextEligibleAt: null },
    });

    expect(result).toEqual({
      summary: expect.stringContaining("exec_1"),
      actionTaken: "create_request",
      reason: "safe_resume",
      safetyNotes: expect.any(Array),
    });
  });
});
