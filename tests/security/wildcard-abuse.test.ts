import { describe, expect, it } from "vitest";

import { validateIntentParameters } from "@/services/intent/parameterSafetyValidator";

describe("wildcardAbuse", () => {
  it("blocks wildcard abuse when registry policy disallows it", () => {
    const result = validateIntentParameters({
      canonicalIntent: {
        intentId: "wildcard",
        action: "filesystem.read.file",
        target: "src/*.ts",
        parameters: { path: "src/*.ts" },
        semanticMeaning: "read wildcard path",
        confidence: 0.95,
        source: "deterministic",
        ambiguities: [],
        clarificationRequired: false,
        governanceRisk: "safe",
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
      registryEntry: {
        toolId: "read_file",
        name: "Read File",
        version: "1",
        enabled: true,
        owner: "platform",
        description: "read",
        capabilities: ["filesystem.read.file"],
        plannerEligible: true,
        riskClass: "read_only",
        requiresApprovalDefault: false,
        allowedTargets: ["filesystem"],
        deniedTargets: [],
        parameterConstraints: {
          allowWildcards: false,
        },
        governanceRestrictions: {
          blockedInFreeze: true,
          blockedInReplayDrift: true,
          blockedWithoutApproval: false,
        },
      },
    });

    expect(result.valid).toBe(false);
    expect(result.blockedReasons).toContain("UNSAFE_PARAMETERS");
  });
});
