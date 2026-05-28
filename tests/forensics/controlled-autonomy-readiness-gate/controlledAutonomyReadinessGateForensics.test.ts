import { describe, expect, it } from "vitest";
import { buildControlledAutonomyReadinessGateFixture } from "@/tests/integration/controlled-autonomy-readiness-gate/helpers";

describe("controlled autonomy readiness gate forensics", () => {
  it("produces stable gate evidence and lineage hashes", () => {
    const first = buildControlledAutonomyReadinessGateFixture();
    const second = buildControlledAutonomyReadinessGateFixture();

    expect(first.result.evidence.evidenceHash).toBe(second.result.evidence.evidenceHash);
    expect(first.result.lineage.lineageHash).toBe(second.result.lineage.lineageHash);
  });
});
