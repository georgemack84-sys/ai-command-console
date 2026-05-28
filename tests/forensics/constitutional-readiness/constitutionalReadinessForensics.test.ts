import { describe, expect, it } from "vitest";
import { buildConstitutionalReadinessFixture } from "@/tests/integration/constitutional-readiness/helpers";

describe("constitutional readiness forensics", () => {
  it("produces stable evidence and lineage hashes", () => {
    const first = buildConstitutionalReadinessFixture();
    const second = buildConstitutionalReadinessFixture();

    expect(first.result.evidence.evidenceHash).toBe(second.result.evidence.evidenceHash);
    expect(first.result.lineage.lineageHash).toBe(second.result.lineage.lineageHash);
  });
});
