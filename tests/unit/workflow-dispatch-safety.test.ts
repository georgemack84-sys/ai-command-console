import { describe, expect, it } from "vitest";
import { resolveWorkflowDispatchReadiness } from "@/src/config/env";

describe("workflow dispatch safety", () => {
  it("fails closed when no dispatch mode is configured", () => {
    expect(resolveWorkflowDispatchReadiness({})).toEqual({
      mode: "disabled",
      sandboxUrl: null,
      dispatchEnabled: false,
      reason: "Outbound workflow dispatch is disabled by policy.",
    });
  });

  it("does not enable egress merely because a sandbox URL exists", () => {
    const readiness = resolveWorkflowDispatchReadiness({ mode: "sandbox", sandboxUrl: "https://sandbox.example.test" });
    expect(readiness.dispatchEnabled).toBe(false);
    expect(readiness.sandboxUrl).toBe("https://sandbox.example.test");
    expect(readiness.reason).toContain("remains disabled");
  });

  it("explains the missing sandbox endpoint without permitting dispatch", () => {
    const readiness = resolveWorkflowDispatchReadiness({ mode: "sandbox" });
    expect(readiness.dispatchEnabled).toBe(false);
    expect(readiness.reason).toContain("WORKFLOW_SANDBOX_BASE_URL");
  });
});
