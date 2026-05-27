import { describe, expect, it } from "vitest";
import { buildHiddenExecutionFixture } from "@/tests/integration/hidden-execution-detection/helpers";

describe("hidden execution detection anti-emergence", () => {
  it("does not mutate input artifacts", () => {
    const artifact = Object.freeze({ summary: "Purely advisory recommendation." });
    const fixture = buildHiddenExecutionFixture({ artifact });
    expect(fixture.input.artifact).toBe(artifact);
    expect((fixture.input.artifact as { summary: string }).summary).toBe("Purely advisory recommendation.");
  });

  it("does not execute, schedule, retry, or repair when detecting violations", () => {
    const fixture = buildHiddenExecutionFixture({
      artifact: Object.freeze({ summary: "retry until successful and schedule this later" }),
    });
    expect(fixture.result.report.blocked).toBe(true);
    expect(fixture.result.report.executionAuthorized).toBe(false);
  });
});
