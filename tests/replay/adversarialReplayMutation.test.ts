import { describe, expect, it } from "vitest";
import { verifyReplayHistory } from "@/services/replay";
import { buildReplayBundle } from "@/tests/replay/helpers";

describe("adversarial replay mutation", () => {
  it("rejects replay under altered sandbox, lineage, evidence, and event stream mutations", () => {
    const bundle = buildReplayBundle();
    const failures = verifyReplayHistory(
      bundle.manifest!,
      {
        ...bundle.snapshot!,
        sandboxProfileHash: `mutated-${bundle.snapshot!.sandboxProfileHash}`,
        lineageHash: `mutated-${bundle.snapshot!.lineageHash}`,
        evidenceHash: `mutated-${bundle.snapshot!.evidenceHash}`,
        eventStreamHash: `mutated-${bundle.snapshot!.eventStreamHash}`,
      },
      bundle.ledger,
    ).failures;

    expect(failures.some((failure) => failure.code === "REPLAY_HASH_MISMATCH")).toBe(true);
    expect(failures.some((failure) => failure.code === "REPLAY_PROVENANCE_INVALID" || failure.code === "REPLAY_CONTAINMENT_RESTORATION_FAILED")).toBe(true);
  });
});
