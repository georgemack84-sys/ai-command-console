import { describe, expect, it } from "vitest";

import { blockRuntimeMutation } from "@/services/coordination-containment/runtimeMutationBlocker";

describe("blockRuntimeMutation", () => {
  it("rejects runtime mutation markers", () => {
    expect(blockRuntimeMutation({ runtimeMutation: true }).length).toBeGreaterThan(0);
  });
});
