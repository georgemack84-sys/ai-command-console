import { describe, expect, it } from "vitest";

import { getToolRegistry } from "@/services/registry/toolRegistry";
import { evaluateSemanticGovernance } from "@/services/governance/semanticGovernanceEngine";

describe("protected target isolation", () => {
  it("escalates protected system targets", () => {
    const registryEntry = getToolRegistry().find((entry) => entry.toolId === "read_file") ?? null;
    const result = evaluateSemanticGovernance({
      canonicalIntent: {
        intentId: "protected-target",
        action: "filesystem.read.file",
        target: "C:\\Windows\\System32\\drivers\\etc\\hosts",
        parameters: { path: "C:\\Windows\\System32\\drivers\\etc\\hosts" },
        semanticMeaning: "read a protected system file",
        confidence: 0.97,
        source: "deterministic",
        ambiguities: [],
        clarificationRequired: false,
        governanceRisk: "review",
        supported: true,
        normalized: true,
        validation: {
          schemaValid: true,
          semanticValid: true,
          governanceValid: true,
          toolCompatible: true,
        },
        warnings: [],
        createdAt: 0,
      },
      registryEntry,
      frozen: false,
      replayDrift: false,
      plannerEligibilityPreconditions: {
        capabilityMatch: true,
        plannerEligible: true,
      },
    });

    expect(result.protectedTargetDetected).toBe(true);
    expect(result.escalationRequired).toBe(true);
    expect(result.plannerAdmissible).toBe(false);
  });
});
