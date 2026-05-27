import { describe, expect, it } from "vitest";

import { validateRuntimeCertification } from "@/services/runtime-validation";
import { buildRuntimeValidationFixture } from "./helpers";

describe("runtime certification validation", () => {
  it("accepts certified runtime state", () => {
    const result = validateRuntimeCertification(buildRuntimeValidationFixture());
    expect(result.valid).toBe(true);
    expect(result.trustState).toBe("certified");
  });

  it("fails closed on uncertified runtime", () => {
    const fixture = buildRuntimeValidationFixture();
    const result = validateRuntimeCertification({
      ...fixture,
      activeRuntime: {
        ...fixture.activeRuntime,
        certification: {
          ...fixture.activeRuntime.certification,
          certified: false,
        },
      },
    });
    expect(result.valid).toBe(false);
    expect(result.trustState).toBe("uncertified");
    expect(result.failures.some((failure) => failure.code === "RUNTIME_UNCERTIFIED")).toBe(true);
  });

  it("fails closed on invalid provenance", () => {
    const fixture = buildRuntimeValidationFixture();
    const result = validateRuntimeCertification({
      ...fixture,
      activeRuntime: {
        ...fixture.activeRuntime,
        certification: {
          ...fixture.activeRuntime.certification,
          provenanceValid: false,
        },
      },
    });
    expect(result.valid).toBe(false);
    expect(result.failures.some((failure) => failure.code === "RUNTIME_PROVENANCE_INVALID")).toBe(true);
  });
});
