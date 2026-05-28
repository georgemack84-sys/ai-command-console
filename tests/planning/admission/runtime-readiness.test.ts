import { describe, expect, it } from "vitest";

import { evaluateRuntimeReadiness } from "@/services/planning/admission";
import { buildAdmissionFixture } from "@/tests/planning/admission/helpers";

describe("runtime readiness", () => {
  it("pauses admission when runtime drift is present", () => {
    const fixture = buildAdmissionFixture();
    (fixture.runtimeMetadata as { stale?: boolean }).stale = true;

    const readiness = evaluateRuntimeReadiness(fixture);
    expect(readiness.shouldPause).toBe(true);
    expect(readiness.failures.some((failure) => failure.code === "PHASE42L_RUNTIME_DRIFT")).toBe(true);
  });

  it("blocks mutation attempts during runtime evaluation", () => {
    const fixture = buildAdmissionFixture();
    (fixture.runtimeMetadata as { mutationAttempted?: boolean }).mutationAttempted = true;

    const readiness = evaluateRuntimeReadiness(fixture);
    expect(readiness.failures.some((failure) => failure.code === "PHASE42L_MUTATION_ATTEMPT_BLOCKED")).toBe(true);
  });
});
