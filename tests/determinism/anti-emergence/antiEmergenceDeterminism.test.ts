import { describe, expect, it } from "vitest";
import { buildAntiEmergenceFixture } from "@/tests/integration/anti-emergence/helpers";

describe("anti-emergence containment determinism", () => {
  it("produces identical evidence and lineage for identical inputs", () => {
    const first = buildAntiEmergenceFixture();
    const second = buildAntiEmergenceFixture();

    expect(first.result.evidence.evidenceHash).toBe(second.result.evidence.evidenceHash);
    expect(first.result.lineage.lineageHash).toBe(second.result.lineage.lineageHash);
  });
});
