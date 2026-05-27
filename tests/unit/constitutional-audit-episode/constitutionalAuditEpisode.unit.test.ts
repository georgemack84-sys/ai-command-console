import { describe, expect, it } from "vitest";
import { buildConstitutionalAuditEpisodeFixture } from "@/tests/integration/constitutional-audit-episode/helpers";

describe("constitutional audit episode unit", () => {
  it("is deterministic for identical inputs", () => {
    const first = buildConstitutionalAuditEpisodeFixture();
    const second = buildConstitutionalAuditEpisodeFixture();

    expect(first.result.hashes.finalResultHash).toBe(second.result.hashes.finalResultHash);
    expect(first.result.hashes.constitutionalStateHash).toBe(second.result.hashes.constitutionalStateHash);
    expect(first.result.lineage.lineageHash).toBe(second.result.lineage.lineageHash);
  });

  it("remains advisory-only and non-authoritative", () => {
    const fixture = buildConstitutionalAuditEpisodeFixture();

    expect(fixture.result.authorityContract.executionAuthority).toBe(false);
    expect(fixture.result.authorityContract.orchestrationAuthority).toBe(false);
    expect(fixture.result.authorityContract.runtimeMutationAuthority).toBe(false);
  });
});
