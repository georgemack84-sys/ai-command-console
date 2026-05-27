import { describe, expect, it } from "vitest";
import { buildHumanSupremacyEnforcementFixture } from "@/tests/integration/human-supremacy-enforcement/helpers";

describe("human supremacy enforcement determinism", () => {
  it("produces identical hashes for identical intervention history", () => {
    const first = buildHumanSupremacyEnforcementFixture();
    const second = buildHumanSupremacyEnforcementFixture();

    expect(first.result.lineage.lineageHash).toBe(second.result.lineage.lineageHash);
    expect(first.result.evidence.evidenceHash).toBe(second.result.evidence.evidenceHash);
  });
});
