import { describe, expect, it } from "vitest";

import { buildStructuredIntent } from "@/services/intent/intentStabilizer";

describe("semanticRegression", () => {
  it("produces stable hashes for identical intent inputs", () => {
    const left = buildStructuredIntent({
      intentId: "semantic-1",
      rawInput: "read file src/app.ts",
      createdAt: 0,
    });
    const right = buildStructuredIntent({
      intentId: "semantic-1",
      rawInput: "read file src/app.ts",
      createdAt: 0,
    });

    expect(left.replayHash).toBe(right.replayHash);
    expect(left.immutableHash).toBe(right.immutableHash);
  });
});
