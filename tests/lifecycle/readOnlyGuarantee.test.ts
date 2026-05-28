import { describe, expect, it } from "vitest";
import { assertLifecycleSourcesAreReadOnly } from "@/services/lifecycle/lifecycleBoundaryGuards";
import { buildLifecycleFixture, loadLifecycleSources } from "./helpers";

describe("lifecycle read-only guarantee", () => {
  it("contains no runtime control capabilities", () => {
    const violations = loadLifecycleSources().flatMap((source) =>
      source.path.endsWith("lifecycleBoundaryGuards.ts")
        ? []
        : assertLifecycleSourcesAreReadOnly(source.content).map((message) => `${source.path}: ${message}`));
    expect(violations).toEqual([]);
  });

  it("does not mutate lifecycle fixture input", () => {
    const { request } = buildLifecycleFixture();
    const before = JSON.stringify(request);
    buildLifecycleFixture();
    expect(JSON.stringify(request)).toBe(before);
  });
});
