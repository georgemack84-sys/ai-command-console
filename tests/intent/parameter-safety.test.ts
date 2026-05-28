import { describe, expect, it } from "vitest";

import { validateIntentParameters } from "@/services/intent/parameterSafetyValidator";
import { getToolRegistry } from "@/services/registry/toolRegistry";

describe("parameterSafety", () => {
  it("blocks injection-style parameters", () => {
    const registryEntry = getToolRegistry().find((entry) => entry.toolId === "read_file") ?? null;
    const result = validateIntentParameters({
      canonicalIntent: {
        intentId: "parameter-safety",
        action: "filesystem.read.file",
        target: "src/app.ts",
        parameters: {
          path: "powershell -c evil.ts",
        },
        semanticMeaning: "read a file",
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
      registryEntry,
    });

    expect(result.valid).toBe(false);
    expect(result.blockedReasons).toContain("UNSAFE_PARAMETERS");
  });
});
