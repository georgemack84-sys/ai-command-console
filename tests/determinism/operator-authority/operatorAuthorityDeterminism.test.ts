import { describe, expect, it } from "vitest";
import { buildOperatorAuthorityFixture } from "@/tests/integration/operator-authority/helpers";

describe("operator authority determinism", () => {
  it("produces identical hashes for identical suppression inputs", () => {
    const first = buildOperatorAuthorityFixture();
    const second = buildOperatorAuthorityFixture();
    expect(first.result.action.replayHash).toBe(second.result.action.replayHash);
    expect(first.result.action.auditHash).toBe(second.result.action.auditHash);
    expect(first.result.deterministicHash).toBe(second.result.deterministicHash);
    expect(first.result.lineage.lineageHash).toBe(second.result.lineage.lineageHash);
  });
});
