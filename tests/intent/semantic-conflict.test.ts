import { describe, expect, it } from "vitest";

import { evaluateSemanticGovernance } from "@/services/governance/semanticGovernanceEngine";

describe("semantic conflicts", () => {
  it("blocks contradictory destructive meaning", () => {
    const result = evaluateSemanticGovernance({
      canonicalIntent: {
        intentId: "semantic-conflict",
        action: "filesystem.delete",
        target: "C:\\temp\\important.txt",
        parameters: { recursive: false, permanent: true },
        semanticMeaning: "delete safely but permanently",
        confidence: 0.98,
        source: "deterministic",
        ambiguities: [],
        clarificationRequired: false,
        governanceRisk: "blocked",
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
      registryEntry: null,
      frozen: false,
      replayDrift: false,
      plannerEligibilityPreconditions: {
        capabilityMatch: false,
        plannerEligible: false,
      },
    });

    expect(result.valid).toBe(false);
    expect(result.semanticConflicts).toContain("SEMANTIC_CONFLICT_DETECTED");
    expect(["BLOCK", "FREEZE"]).toContain(result.nextState);
  });
});
