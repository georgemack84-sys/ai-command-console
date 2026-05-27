import { describe, expect, it } from "vitest";

import { buildAdmissionReadiness } from "@/services/planning/admission";
import { buildAdmissionFixture } from "@/tests/planning/admission/helpers";

describe("admission red team", () => {
  it("blocks forged approval hash", () => {
    const fixture = buildAdmissionFixture();
    (fixture.governanceMetadata as { approvalChainHash: string }).approvalChainHash = "";
    const readiness = buildAdmissionReadiness(fixture);
    expect(readiness.result.decision).toBe("DENIED");
  });

  it("blocks substituted derived simulation hash", () => {
    const fixture = buildAdmissionFixture();
    (fixture as { expectedLineage?: Record<string, unknown> }).expectedLineage = {
      ...fixture.expectedLineage,
      derivedSimulationHash: "substituted",
    };
    const readiness = buildAdmissionReadiness(fixture);
    expect(readiness.result.decision).toBe("DENIED");
  });

  it("blocks replay anchor corruption", () => {
    const fixture = buildAdmissionFixture();
    fixture.versionedReplayArtifact.immutableReplayIdentityRoot.initialReplaySnapshotHash = "corrupted";
    const readiness = buildAdmissionReadiness(fixture);
    expect(readiness.result.decision).toBe("DENIED");
  });

  it("quarantines cross-zone privilege escalation", () => {
    const fixture = buildAdmissionFixture({
      requestedTrustZone: "STRATEGIC",
    });
    const readiness = buildAdmissionReadiness(fixture);
    expect(readiness.result.decision).toBe("QUARANTINED");
  });

  it("cannot self-authorize escalation attempts", () => {
    const fixture = buildAdmissionFixture({
      requestedTrustZone: "ELEVATED",
    });
    (fixture.governanceMetadata as { allowedTrustZones?: string[] }).allowedTrustZones = ["STANDARD", "ELEVATED"];
    (fixture.governanceMetadata as { currentTrustZone?: string }).currentTrustZone = "STANDARD";
    const readiness = buildAdmissionReadiness(fixture);
    expect(readiness.result.decision).toBe("REVALIDATION_REQUIRED");
  });
});
