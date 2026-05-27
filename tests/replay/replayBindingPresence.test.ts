import { describe, expect, it } from "vitest";
import { verifyReplayHistory } from "@/services/replay";
import { buildReplayBundle } from "@/tests/replay/helpers";

describe("replay binding presence", () => {
  it("fails closed when historical binding is missing", () => {
    const bundle = buildReplayBundle();
    const failures = verifyReplayHistory(
      bundle.manifest!,
      {
        ...bundle.snapshot!,
        binding: undefined as never,
      },
      bundle.ledger,
    ).failures;

    expect(failures.some((failure) => failure.code === "REPLAY_BINDING_MISSING")).toBe(true);
  });
});
