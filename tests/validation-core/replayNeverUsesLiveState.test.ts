import { describe, expect, it } from "vitest";
import { validateReplay } from "@/services/validation-core";
import { buildExecutionTreatyFixture } from "@/tests/execution-treaty/helpers";
import { buildValidationFixture } from "./helpers";

describe("replay never uses live state", () => {
  it("denies instead of falling back to current registry/governance/runtime state", () => {
    const treaty = buildExecutionTreatyFixture().treaty;
    const fixture = buildValidationFixture({
      treaty: {
        ...treaty,
        manifest: {
          ...treaty.manifest,
          replaySnapshotHash: "",
        },
      },
    });
    const result = validateReplay(fixture.context);

    expect(result.result.passed).toBe(false);
    expect(result.failures[0]?.code).toBe("VALIDATION_REPLAY_INVALID");
  });
});
