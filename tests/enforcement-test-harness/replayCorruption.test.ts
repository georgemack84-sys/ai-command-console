import { describe, expect, it } from "vitest";
import { ENFORCEMENT_HARNESS_ERROR_CODES, runReplayCorruptionHarness } from "@/services/enforcement-test-harness";
import { buildEnforcementHarnessFixture } from "./helpers";

describe("replay corruption harness", () => {
  it("rejects replay drift, policy mismatch, and hash tampering", () => {
    const results = runReplayCorruptionHarness(buildEnforcementHarnessFixture());

    expect(results).toHaveLength(3);
    expect(results.every((result) => result.actualOutcome === "REPLAY_REJECTED")).toBe(true);
    expect(results.map((result) => result.errorCode)).toEqual([
      ENFORCEMENT_HARNESS_ERROR_CODES.REPLAY_REGISTRY_DRIFT,
      ENFORCEMENT_HARNESS_ERROR_CODES.REPLAY_POLICY_MISMATCH,
      ENFORCEMENT_HARNESS_ERROR_CODES.REPLAY_HASH_INVALID,
    ]);
  });
});
