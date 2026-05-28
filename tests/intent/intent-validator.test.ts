import { describe, expect, it } from "vitest";

import { buildStructuredIntent } from "@/services/intent/intentStabilizer";
import { resolveSemanticIntent } from "@/services/intent/semanticResolver";
import { validateCanonicalizedIntent } from "@/services/intent/intentValidator";

describe("intentValidator", () => {
  it("accepts semantically coherent canonical intent", () => {
    const structured = buildStructuredIntent({
      intentId: "validator-ok",
      rawInput: "read file src/app.ts",
      createdAt: 0,
    });

    const result = validateCanonicalizedIntent({
      structuredIntent: structured,
      canonicalIntent: resolveSemanticIntent(structured),
    });

    expect(result.valid).toBe(true);
    expect(result.canonicalIntent.action).toBe("filesystem.read.file");
  });

  it("rejects semantic mismatches", () => {
    const structured = buildStructuredIntent({
      intentId: "validator-bad",
      rawInput: "read file src/app.ts",
      createdAt: 0,
    });

    const result = validateCanonicalizedIntent({
      structuredIntent: structured,
      canonicalIntent: {
        ...resolveSemanticIntent(structured),
        action: "filesystem.delete",
        target: "localhost",
      },
    });

    expect(result.valid).toBe(false);
    expect(result.blockedReasons).toContain("INTENT_SEMANTIC_INVALID");
  });
});
