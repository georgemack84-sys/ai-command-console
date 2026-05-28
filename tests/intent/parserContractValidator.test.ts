import { describe, expect, it } from "vitest";

import { validateIntentParserResult, validateStructuredIntentContract } from "@/services/intent/parserContractValidator";
import { buildStructuredIntent } from "@/services/intent/intentStabilizer";

describe("parserContractValidator", () => {
  it("validates well-formed parser and structured intent output", () => {
    const structured = buildStructuredIntent({
      intentId: "intent-contract",
      rawInput: "read file src/app.ts",
      createdAt: 0,
    });

    const parserResult = validateIntentParserResult({
      intent: structured.intent,
      confidence: structured.confidence,
      source: structured.source,
      ambiguities: structured.ambiguities,
      clarificationRequired: structured.clarificationRequired,
      warnings: structured.warnings,
      lifecycleState: structured.lifecycleState,
      replayHash: structured.replayHash,
      immutableHash: structured.immutableHash,
      lineageId: structured.lineageId,
      semanticIntegrityVerified: structured.semanticIntegrityVerified,
    });

    expect(parserResult.valid).toBe(true);
    expect(validateStructuredIntentContract(structured).valid).toBe(true);
  });
});
