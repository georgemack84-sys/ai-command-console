import { describe, expect, it } from "vitest";

import { validateToolResolution } from "@/services/validation/toolResolutionValidator";

describe("validateToolResolution", () => {
  it("resolves known tools canonically", () => {
    const result = validateToolResolution({
      steps: [{ id: "s1", type: "tool", tool: "read_file", input: {}, safety: { riskLevel: "low", requiresApproval: false } }],
    });

    expect(result.valid).toBe(true);
    expect(result.resolvedTools).toEqual(["read_file"]);
  });

  it("blocks unknown and disabled tools", () => {
    const result = validateToolResolution({
      steps: [
        { id: "s1", type: "tool", tool: "unknown_tool", input: {}, safety: { riskLevel: "low", requiresApproval: false } },
        { id: "s2", type: "tool", tool: "run_plugin", input: {}, safety: { riskLevel: "critical", requiresApproval: true } },
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.blockedReasons).toContain("TOOL_NOT_FOUND");
    expect(result.blockedReasons).toContain("TOOL_DISABLED");
  });
});
