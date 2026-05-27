import { describe, expect, it } from "vitest";

import { classifyCumulativeRisk } from "@/services/validation/cumulativeRisk";

describe("cumulativeRisk", () => {
  it("escalates multiple medium-risk mutation steps to high", () => {
    const registry = {
      mutate_a: {
        canonicalToolId: "mutate_a",
        enabled: true,
        riskLevel: "medium",
        requiresApproval: false,
        destructive: false,
        externalMutation: true,
        privileged: false,
        inputSchema: "record",
        owner: "test",
        version: "1",
      },
      mutate_b: {
        canonicalToolId: "mutate_b",
        enabled: true,
        riskLevel: "medium",
        requiresApproval: false,
        destructive: false,
        externalMutation: true,
        privileged: false,
        inputSchema: "record",
        owner: "test",
        version: "1",
      },
    } as const;

    const risk = classifyCumulativeRisk({
      steps: [
        { id: "s1", type: "tool", tool: "mutate_a", input: {}, safety: { riskLevel: "medium", requiresApproval: false } },
        { id: "s2", type: "tool", tool: "mutate_b", input: {}, safety: { riskLevel: "medium", requiresApproval: false } },
      ],
      registry,
      baseRisk: "medium",
      governanceUncertain: false,
      approvalRequired: false,
    });

    expect(risk).toBe("high");
  });

  it("escalates destructive external mutation to critical", () => {
    const registry = {
      destroy: {
        canonicalToolId: "destroy",
        enabled: true,
        riskLevel: "high",
        requiresApproval: true,
        destructive: true,
        externalMutation: true,
        privileged: true,
        inputSchema: "record",
        owner: "test",
        version: "1",
      },
    } as const;

    const risk = classifyCumulativeRisk({
      steps: [
        { id: "s1", type: "tool", tool: "destroy", input: {}, safety: { riskLevel: "high", requiresApproval: true } },
      ],
      registry,
      baseRisk: "high",
      governanceUncertain: false,
      approvalRequired: true,
    });

    expect(risk).toBe("critical");
  });
});
