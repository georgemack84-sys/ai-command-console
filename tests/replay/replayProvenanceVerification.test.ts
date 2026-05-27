import { describe, expect, it } from "vitest";
import { verifyReplayProvenance } from "@/services/replay";
import { buildReplayBundle } from "@/tests/replay/helpers";

describe("replay provenance verification", () => {
  it("verifies intact historical replay provenance", () => {
    const bundle = buildReplayBundle();
    expect(verifyReplayProvenance(bundle.snapshot!)).toEqual([]);
  });

  it("fails closed when provenance is mutated", () => {
    const bundle = buildReplayBundle();
    const failures = verifyReplayProvenance({
      ...bundle.snapshot!,
      provenanceHash: `mutated-${bundle.snapshot!.provenanceHash}`,
    });

    expect(failures.some((failure) => failure.code === "REPLAY_PROVENANCE_INVALID")).toBe(true);
  });
});
