import { describe, expect, it } from "vitest";
import { validateTreatyReplayBindings } from "@/services/execution-treaty";
import { buildExecutionTreatyFixture } from "./helpers";

describe("replay binding integrity", () => {
  it("fails closed on replay snapshot or binding substitution", () => {
    const { input } = buildExecutionTreatyFixture();
    const result = validateTreatyReplayBindings({
      readiness: input.readiness,
      replaySnapshotHash: input.replaySnapshotHash,
      replayBindingHash: input.replayBindingHash,
      currentReplaySnapshotHash: "sha256:substituted",
      currentReplayBindingHash: "sha256:substituted",
    });

    expect(result.valid).toBe(false);
    expect(result.failures.some((failure) => failure.code === "HANDOFF_HASH_MISMATCH")).toBe(true);
  });
});
