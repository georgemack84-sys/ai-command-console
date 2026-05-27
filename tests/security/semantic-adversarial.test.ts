import { describe, expect, it } from "vitest";

import { evaluateSemanticGovernance } from "@/services/governance/semanticGovernanceEngine";
import { getToolRegistry } from "@/services/registry/toolRegistry";

describe("semantic adversarial resistance", () => {
  it("blocks semantically adversarial scope escalation", () => {
    const registryEntry = getToolRegistry().find((entry) => entry.toolId === "scan_ports") ?? null;
    const result = evaluateSemanticGovernance({
      canonicalIntent: {
        intentId: "semantic-adversarial",
        action: "network.scan.ports",
        target: "localhost and all external networks",
        parameters: {},
        semanticMeaning: "scan localhost and all external networks",
        confidence: 0.91,
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

    expect(result.plannerAdmissible).toBe(false);
    expect(result.semanticConflicts).toContain("SEMANTIC_SCOPE_CONFLICT");
  });
});
