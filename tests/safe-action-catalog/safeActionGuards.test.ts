import { describe, expect, it } from "vitest";

import { assertSafeActionSourceIsReadOnly } from "@/services/safe-action-catalog";

describe("safeActionGuards", () => {
  it("flags forbidden runtime capabilities in source text", () => {
    expect(assertSafeActionSourceIsReadOnly("const x = spawn('cmd')")).toEqual([
      "Forbidden runtime capability detected: spawn(",
    ]);
  });
});
