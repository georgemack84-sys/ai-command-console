import { describe, expect, it } from "vitest";
import { buildDecisionIntentBoundaryFixture } from "@/tests/integration/decision-intent-boundary/helpers";

describe("decision intent boundary adversarial", () => {
  it.each([
    "recommend and execute",
    "safe to auto-run",
    "proposal ready for dispatch",
    "begin orchestration",
    "queue this task",
    "invoke automatically",
    "trusted workflow",
    "retry until success",
    "approved implicitly",
    "run after review timeout",
  ])("rejects red-team phrase: %s", (summary) => {
    const fixture = buildDecisionIntentBoundaryFixture({ summary });
    expect(fixture.result.errors.length).toBeGreaterThan(0);
  });
});
