import { describe, expect, it } from "vitest";

import { validateAdmissionLineage } from "@/services/planning/admission";
import { buildAdmissionFixture } from "@/tests/planning/admission/helpers";

describe("admission lineage validator", () => {
  it("fails closed when lineage is missing", () => {
    const fixture = buildAdmissionFixture();
    fixture.executionTruthPackage.executionTruthHash = "";
    const validation = validateAdmissionLineage(fixture);
    expect(validation.ok).toBe(false);
    expect(validation.failures.some((failure) => failure.code === "PHASE42L_LINEAGE_MISSING")).toBe(true);
  });

  it("fails closed on lineage drift", () => {
    const fixture = buildAdmissionFixture();
    fixture.versionedReplayArtifact.immutableReplayIdentityRoot.executionCompatibilityHash = "drift";
    const validation = validateAdmissionLineage(fixture);
    expect(validation.ok).toBe(false);
    expect(validation.failures.some((failure) => failure.code === "PHASE42L_LINEAGE_DRIFT")).toBe(true);
  });
});
