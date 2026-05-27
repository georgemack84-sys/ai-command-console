import { describe, expect, it } from "vitest";

import { validateLineageIntegrity } from "@/services/constitutional-validation/lineageIntegrityValidator";

describe("constitutional coordination lineage corruption rejection", () => {
  it("rejects missing lineage ids", () => {
    const errors = validateLineageIntegrity({
      governanceBinding: {
        governanceSnapshotId: "g",
        governanceSnapshotHash: "h",
        governanceLineageId: "",
        readinessHash: "r",
        valid: true,
        createdAt: "2026-05-17T11:00:00.000Z",
        bindingHash: "b",
      },
      replayBinding: {
        replaySnapshotId: "r",
        replaySnapshotHash: "rh",
        replayLineageId: "",
        lifecycleHash: "l",
        containmentReplayHash: "c",
        valid: true,
        deterministic: true,
        createdAt: "2026-05-17T11:00:00.000Z",
        bindingHash: "rb",
      },
    });
    expect(errors.length).toBeGreaterThan(0);
  });
});
