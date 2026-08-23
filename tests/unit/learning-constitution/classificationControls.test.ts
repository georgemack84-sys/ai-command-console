import { describe, expect, it } from "vitest";

import { classifyCanonicalInputWithContextConservatively } from "@/services/learning-constitution";

const source = (sourceType: "OPERATOR_STATEMENT" | "AGENT_OUTPUT") => ({ observationId: "observation-1", sourceId: "source-1", sourceType, originatingActorId: "actor-1", observedAt: "2026-08-21T00:00:00.000Z" });
const request = (content: string, sourceType: "OPERATOR_STATEMENT" | "AGENT_OUTPUT" = "OPERATOR_STATEMENT") => ({ source: source(sourceType), content, contextFrames: [], maximumContextFrames: 0 });

describe("classification controls", () => {
  it("records an explicit user category as review-only metadata", () => {
    const result = classifyCanonicalInputWithContextConservatively({ ...request("This may be useful."), explicitUserCategory: "RULE" });
    expect(result.controls).toMatchObject({ userCategoryClaim: { category: "RULE", status: "RECORDED_FOR_REVIEW" }, handling: "SILENT_CONSERVATIVE", persistenceEffect: "NONE" });
    expect(result.classification.classifications[0]).not.toHaveProperty("category");
  });

  it("records non-learning intent and rejects user-category claims from non-user sources", () => {
    expect(classifyCanonicalInputWithContextConservatively(request("Do not learn this example.")).controls).toMatchObject({ learningIntent: "EXPLICIT_NON_LEARNING" });
    expect(() => classifyCanonicalInputWithContextConservatively({ ...request("A queue could help.", "AGENT_OUTPUT"), explicitUserCategory: "IDEA" })).toThrow();
  });
});
