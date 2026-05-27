import { describe, expect, it } from "vitest";
import { assertFreshnessSourcesAreReadOnly } from "@/services/freshness/freshnessGuards";
import { loadFreshnessSources } from "./helpers";

describe("freshness read-only guarantee", () => {
  it("contains no runtime control capabilities", () => {
    const violations = loadFreshnessSources().flatMap((source) =>
      source.path.endsWith("freshnessGuards.ts")
        ? []
        : assertFreshnessSourcesAreReadOnly(source.content).map((message) => `${source.path}: ${message}`));
    expect(violations).toEqual([]);
  });
});
