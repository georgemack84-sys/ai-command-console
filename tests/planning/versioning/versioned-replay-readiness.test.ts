import { describe, expect, it } from "vitest";

import { buildVersionedReplayReadiness } from "@/services/planning/versioning";
import { buildVersioningFixture } from "./helpers";

describe("versioned replay readiness", () => {
  it("identical artifact + identical migration chain produces identical output", () => {
    const fixture = buildVersioningFixture();
    const left = buildVersionedReplayReadiness(fixture);
    const right = buildVersionedReplayReadiness(structuredClone(fixture));
    expect(left).toEqual(right);
  });

  it("migration proof hash is stable", () => {
    const fixture = buildVersioningFixture();
    const left = buildVersionedReplayReadiness(fixture);
    const right = buildVersionedReplayReadiness(structuredClone(fixture));
    expect(left.migrationProof?.proofHash).toBe(right.migrationProof?.proofHash);
  });

  it("migration audit events are deterministic", () => {
    const fixture = buildVersioningFixture();
    const result = buildVersionedReplayReadiness(fixture);
    expect(result.ok).toBe(true);
    expect(result.auditEvents?.length).toBe(3);
    expect(result.auditEvents?.[0]?.eventHash).toBeTruthy();
  });
});
