import { describe, expect, it } from "vitest";

import { classifySemanticIntent } from "@/services/intent/semanticClassifier";

describe("semanticClassifier", () => {
  it("classifies filesystem operations consistently", () => {
    const result = classifySemanticIntent("read file src/app.ts");
    expect(result.category).toBe("filesystem");
    expect(result.action).toBe("read");
  });
});
