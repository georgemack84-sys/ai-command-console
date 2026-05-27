import { describe, expect, it } from "vitest";

import { buildStructuredIntent } from "@/services/intent/intentStabilizer";
import { resolveSemanticIntent } from "@/services/intent/semanticResolver";

describe("semanticResolution", () => {
  it("resolves known operational aliases canonically", () => {
    const structured = buildStructuredIntent({
      intentId: "semantic-resolution",
      rawInput: "scan ports",
      createdAt: 0,
    });

    const canonical = resolveSemanticIntent(structured);
    expect(canonical.action).toBe("network.scan.ports");
    expect(canonical.target).toBe("localhost");
  });
});
