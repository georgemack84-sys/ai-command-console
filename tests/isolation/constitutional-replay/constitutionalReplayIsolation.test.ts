import { describe, expect, it } from "vitest";
import { buildConstitutionalReplayFixture } from "@/tests/integration/constitutional-replay/helpers";

describe("constitutional replay isolation", () => {
  it("fails closed on execution import attempts", () => {
    const result = buildConstitutionalReplayFixture({
      metadata: Object.freeze({ executionImport: "child_process" }),
      scenarioCategory: "EXECUTION_IMPORT",
    }).result;

    expect(result.errors.some((item) => item.code === "CONSTITUTIONAL_REPLAY_ISOLATION_VIOLATION")).toBe(true);
  });
});
