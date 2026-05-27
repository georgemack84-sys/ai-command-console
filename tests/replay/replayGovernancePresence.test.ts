import { describe, expect, it } from "vitest";
import { verifyReplayHistory } from "@/services/replay";
import { buildReplayBundle } from "@/tests/replay/helpers";

describe("replay governance presence", () => {
  it("fails closed when historical governance state is missing", () => {
    const bundle = buildReplayBundle();
    const failures = verifyReplayHistory(
      bundle.manifest!,
      {
        ...bundle.snapshot!,
        governance: undefined as never,
      },
      bundle.ledger,
    ).failures;

    expect(failures.some((failure) => failure.code === "REPLAY_GOVERNANCE_STATE_MISSING")).toBe(true);
  });
});
