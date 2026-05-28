import { describe, expect, it } from "vitest";

import { buildStructuredIntent } from "@/services/intent/intentStabilizer";
import { applyContextualIntentResolution } from "@/services/intent/contextualIntentResolver";
import { resolveSemanticIntent } from "@/services/intent/semanticResolver";
import { detectUnsafeAssumptions } from "@/services/intent/unsafeAssumptionDetector";

describe("unsafe assumption detection", () => {
  it("blocks hidden scope escalation assumptions", () => {
    const structured = buildStructuredIntent({
      intentId: "unsafe-assumption",
      rawInput: "deploy latest everywhere",
      createdAt: 0,
    });

    const canonical = applyContextualIntentResolution({
      intent: structured,
      canonicalIntent: resolveSemanticIntent(structured),
    });
    const result = detectUnsafeAssumptions({
      structuredIntent: structured,
      canonicalIntent: canonical,
    });

    expect(result.unsafeAssumptions).toContain("UNSAFE_LATEST_ARTIFACT_INFERENCE");
    expect(result.unsafeAssumptions).toContain("UNSAFE_GLOBAL_SCOPE_INFERENCE");
  });
});
