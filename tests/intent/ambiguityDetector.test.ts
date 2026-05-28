import { describe, expect, it } from "vitest";

import { detectIntentAmbiguities } from "@/services/intent/ambiguityDetector";

describe("ambiguityDetector", () => {
  it("flags dangerous ambiguous references", () => {
    const ambiguities = detectIntentAmbiguities({
      normalizedInput: "check it and maybe everything",
      action: "inspect",
      target: "unknown",
    });

    expect(ambiguities).toContain("target_unresolved");
    expect(ambiguities).toContain("dangerous_scope_ambiguity");
  });
});
