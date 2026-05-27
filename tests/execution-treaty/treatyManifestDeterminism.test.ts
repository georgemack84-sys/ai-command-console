import { describe, expect, it } from "vitest";
import { buildExecutionTreatyFixture } from "./helpers";

describe("execution treaty manifest determinism", () => {
  it("builds identical manifests for identical inputs", () => {
    const first = buildExecutionTreatyFixture().treaty;
    const second = buildExecutionTreatyFixture().treaty;

    expect(first.manifest).toEqual(second.manifest);
    expect(first.hashes.manifestHash).toBe(second.hashes.manifestHash);
  });
});
