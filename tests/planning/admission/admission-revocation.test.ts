import { describe, expect, it } from "vitest";

import { buildAdmissionRevocation } from "@/services/planning/admission";
import { buildAdmissionFixture } from "@/tests/planning/admission/helpers";

describe("admission revocation", () => {
  it("does not mutate lineage", () => {
    const fixture = buildAdmissionFixture();
    const original = JSON.stringify(fixture.versionedReplayArtifact.immutableReplayIdentityRoot);
    const revocation = buildAdmissionRevocation({
      buildInput: fixture,
      decision: "DENIED",
      reasons: ["blocked"],
    });
    expect(revocation.decision).toBe("REVOKED");
    expect(JSON.stringify(fixture.versionedReplayArtifact.immutableReplayIdentityRoot)).toBe(original);
  });
});
