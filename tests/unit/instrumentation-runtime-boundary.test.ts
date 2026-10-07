import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("instrumentation runtime boundary", () => {
  it("does not pull the Node-only Sentry SDK into the Edge-compiled entry point", () => {
    const source = readFileSync("src/instrumentation.ts", "utf8");

    expect(source).not.toContain("@sentry/node");
    expect(source).not.toContain("observability/sentry");
  });
});
