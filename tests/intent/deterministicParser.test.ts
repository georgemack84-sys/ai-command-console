import { describe, expect, it } from "vitest";

import { parseIntentDeterministically } from "@/services/intent/deterministicParser";

describe("deterministicParser", () => {
  it("parses exact filesystem requests with stable output", () => {
    const result = parseIntentDeterministically("read file src/app.ts");

    expect(result.source).toBe("deterministic");
    expect(result.intent.action).toBe("read");
    expect(result.intent.target).toBe("filesystem");
    expect(result.intent.parameters.path).toBe("src/app.ts");
  });
});
