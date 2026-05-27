import { describe, expect, it } from "vitest";
import { verifyReplayHistory } from "@/services/replay";
import { buildReplayBundle } from "@/tests/replay/helpers";

describe("replay runtime presence", () => {
  it("fails closed when historical runtime state is missing", () => {
    const bundle = buildReplayBundle();
    const failures = verifyReplayHistory(
      bundle.manifest!,
      {
        ...bundle.snapshot!,
        runtimeValidation: undefined as never,
      },
      bundle.ledger,
    ).failures;

    expect(failures.some((failure) => failure.code === "REPLAY_RUNTIME_STATE_MISSING")).toBe(true);
  });
});
