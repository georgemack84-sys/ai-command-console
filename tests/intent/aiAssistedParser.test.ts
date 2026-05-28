import { describe, expect, it } from "vitest";

import { parseIntentWithAssistance } from "@/services/intent/aiAssistedParser";

describe("aiAssistedParser", () => {
  it("uses deterministic governed inference without inventing unsafe targets", () => {
    const result = parseIntentWithAssistance("take a look at runtime status");

    expect(result.source).toBe("ai");
    expect(result.intent.action).toBe("inspect");
    expect(result.intent.target).toBe("runtime");
    expect(result.dangerous).toBe(false);
  });
});
