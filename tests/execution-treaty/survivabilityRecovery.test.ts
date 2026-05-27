import { describe, expect, it } from "vitest";
import { certifyProductionSurvivability } from "@/services/production-trust-framework";
import { bindTreatySurvivability } from "@/services/execution-treaty";
import { buildExecutionTreatyFixture } from "./helpers";

describe("survivability recovery bindings", () => {
  it("fails when survivability certification is no longer valid", () => {
    const { input } = buildExecutionTreatyFixture();
    const invalid = certifyProductionSurvivability({
      failureState: {
        ...input.failureState,
        rehydration: {
          ...input.failureState.rehydration,
          allowed: true,
        },
      },
      trustCertification: input.trustCertification,
    });
    const result = bindTreatySurvivability({
      failureState: input.failureState,
      survivabilityCertification: invalid,
    });

    expect(result.failures.some((failure) => failure.code === "HANDOFF_REVALIDATION_REQUIRED")).toBe(true);
  });
});
