import { describe, expect, it } from "vitest";

import { buildStructuredIntent } from "@/services/intent/intentStabilizer";
import { resolveSemanticIntent } from "@/services/intent/semanticResolver";
import { applyContextualIntentResolution } from "@/services/intent/contextualIntentResolver";

describe("contextualResolution", () => {
  it("applies policy-approved safe defaults only", () => {
    const structured = buildStructuredIntent({
      intentId: "context-resolution",
      rawInput: "check memory",
      createdAt: 0,
    });

    const canonical = applyContextualIntentResolution({
      intent: structured,
      canonicalIntent: resolveSemanticIntent(structured),
    });

    expect(canonical.action).toBe("system.memory.inspect");
    expect(canonical.target).toBe("localhost");
    expect(canonical.clarificationRequired).toBe(false);
  });

  it("blocks when operational context is insufficient", () => {
    const structured = buildStructuredIntent({
      intentId: "context-insufficient",
      rawInput: "restart the service",
      createdAt: 0,
    });

    const canonical = applyContextualIntentResolution({
      intent: structured,
      canonicalIntent: resolveSemanticIntent(structured),
    });

    expect(canonical.clarificationRequired).toBe(true);
    expect(canonical.ambiguities.some((reason) => reason.includes("INTENT_CONTEXT_INSUFFICIENT"))).toBe(true);
  });
});
