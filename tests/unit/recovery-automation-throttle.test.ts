import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { shouldThrottleAutomation } = require("../../services/recoveryAutomationThrottle.js");

describe("recovery automation throttle", () => {
  it("suppresses duplicate advisories during cooldown", () => {
    const now = Date.parse("2026-01-01T00:10:00.000Z");
    const result = shouldThrottleAutomation({
      executionId: "exec_1",
      signalType: "FAILED_EXECUTION",
      recommendation: "retry_safe_steps",
      history: [
        {
          type: "RECOVERY_AUTOMATION_REQUEST_OPENED",
          payload: {
            executionId: "exec_1",
            signalType: "FAILED_EXECUTION",
            recommendation: "retry_safe_steps",
          },
          timestamp: "2026-01-01T00:09:00.000Z",
        },
      ],
      now,
    });

    expect(result).toEqual({
      throttled: true,
      reason: "cooldown_active",
      nextEligibleAt: "2026-01-01T00:14:00.000Z",
    });
  });

  it("allows automation when no duplicate history exists", () => {
    const result = shouldThrottleAutomation({
      executionId: "exec_1",
      signalType: "FAILED_EXECUTION",
      recommendation: "retry_safe_steps",
      history: [],
      now: Date.parse("2026-01-01T00:10:00.000Z"),
    });

    expect(result).toEqual({
      throttled: false,
      reason: "eligible",
      nextEligibleAt: null,
    });
  });
});
