import { describe, expect, it } from "vitest";

import { buildStructuredIntent } from "@/services/intent/intentStabilizer";
import { applyContextualIntentResolution } from "@/services/intent/contextualIntentResolver";
import { resolveSemanticIntent } from "@/services/intent/semanticResolver";
import { resolveIntentAmbiguity } from "@/services/intent/ambiguityResolutionEngine";

describe("ambiguity resolution", () => {
  it("detects cross-environment ambiguity", () => {
    const structured = buildStructuredIntent({
      intentId: "ambiguity-restart-production",
      rawInput: "restart production",
      createdAt: 0,
    });

    const canonical = applyContextualIntentResolution({
      intent: structured,
      canonicalIntent: resolveSemanticIntent(structured),
    });
    const result = resolveIntentAmbiguity({
      structuredIntent: structured,
      canonicalIntent: canonical,
    });

    expect(result.ambiguityDetected).toBe(true);
    expect(result.conflictingContext).toContain("SEMANTIC_SCOPE_CONFLICT");
  });
});
