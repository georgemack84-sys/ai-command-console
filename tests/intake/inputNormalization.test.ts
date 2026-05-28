import { describe, expect, it } from "vitest";

import { inspectIntakeSafety, normalizeInput } from "@/services/intake/inputNormalization";

describe("normalizeInput", () => {
  it("normalizes whitespace and line endings deterministically", () => {
    const first = normalizeInput(" hello  \r\nworld \r\n");
    const second = normalizeInput(" hello  \r\nworld \r\n");

    expect(first).toEqual(second);
    expect(first.normalizedInput.text).toBe("hello\nworld");
  });

  it("sorts structured payload keys without mutating raw input", () => {
    const raw = { b: " two ", a: " one " };
    const result = normalizeInput(raw);

    expect(raw).toEqual({ b: " two ", a: " one " });
    expect(result.normalizedInput.structuredPayload).toEqual({ a: "one", b: "two" });
  });
});

describe("inspectIntakeSafety", () => {
  it("detects shell content", () => {
    expect(inspectIntakeSafety("please run rm -rf /tmp").containsShellContent).toBe(true);
  });
});
