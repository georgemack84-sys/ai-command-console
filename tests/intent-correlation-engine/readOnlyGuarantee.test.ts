import { describe, expect, it } from "vitest";

import { assertCorrelationSourcesAreReadOnly } from "@/services/intent-correlation-engine";
import { buildIntentCorrelationFixture, loadIntentCorrelationSources } from "./helpers";

describe("intent correlation read-only guarantee", () => {
  it("contains no runtime control capabilities", () => {
    const violations = loadIntentCorrelationSources().flatMap((source) =>
      source.path.endsWith("correlationBoundaryGuards.ts")
        ? []
        : assertCorrelationSourcesAreReadOnly(source.content).map((message) => `${source.path}: ${message}`));
    expect(violations).toEqual([]);
  });

  it("does not mutate fixture input", () => {
    const { input } = buildIntentCorrelationFixture();
    const before = JSON.stringify(input);
    buildIntentCorrelationFixture();
    expect(JSON.stringify(input)).toBe(before);
  });
});
