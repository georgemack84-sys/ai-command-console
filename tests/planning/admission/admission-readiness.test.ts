import { describe, expect, it } from "vitest";

import { buildAdmissionReadiness } from "@/services/planning/admission";
import { buildAdmissionFixture } from "@/tests/planning/admission/helpers";

describe("admission readiness", () => {
  it("returns deterministic decision and hash for identical input", () => {
    const fixture = buildAdmissionFixture();
    expect(buildAdmissionReadiness(fixture)).toEqual(buildAdmissionReadiness(fixture));
  });

  it("revalidates on governance epoch mismatch", () => {
    const fixture = buildAdmissionFixture();
    (fixture.runtimeMetadata as { governanceEpoch?: string }).governanceEpoch = "epoch-2";
    const readiness = buildAdmissionReadiness(fixture);
    expect(readiness.result.decision).toBe("REVALIDATION_REQUIRED");
  });
});
