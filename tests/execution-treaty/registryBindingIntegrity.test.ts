import { describe, expect, it } from "vitest";
import { bindRegistryTreatyEvidence } from "@/services/execution-treaty";
import { buildExecutionTreatyFixture } from "./helpers";

describe("registry binding integrity", () => {
  it("fails on registry snapshot substitution", () => {
    const { input } = buildExecutionTreatyFixture();
    const result = bindRegistryTreatyEvidence({
      snapshot: input.snapshot,
      currentRegistrySnapshotHash: "sha256:substituted",
    });

    expect(result.failures.some((failure) => failure.code === "HANDOFF_HASH_MISMATCH")).toBe(true);
  });
});
