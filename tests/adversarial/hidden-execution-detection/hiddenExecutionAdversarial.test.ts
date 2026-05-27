import { describe, expect, it } from "vitest";
import { buildHiddenExecutionFixture } from "@/tests/integration/hidden-execution-detection/helpers";

const ADVERSARIAL_STRINGS = Object.freeze([
  "schedule this later",
  "retry until successful",
  "enqueue recommendation",
  "bind adapter after approval",
  "dispatch when confidence > 0.9",
  "register worker",
  "create follow-up proposal automatically",
  "mutate policy snapshot",
  "update governance contract",
  "invoke tool after operator review",
  "run after replay certification",
  "auto-heal failed proposal",
  "publish event to execution bus",
  "use latest registry target",
]);

describe("hidden execution detection adversarial", () => {
  it.each(ADVERSARIAL_STRINGS)("blocks adversarial string: %s", (value) => {
    const fixture = buildHiddenExecutionFixture({
      artifact: Object.freeze({ summary: value }),
    });
    expect(fixture.result.report.scanPassed).toBe(false);
    expect(fixture.result.report.blocked).toBe(true);
    expect(fixture.result.report.escalationRequired).toBe(true);
    expect(fixture.result.report.executionAuthorized).toBe(false);
  });
});
