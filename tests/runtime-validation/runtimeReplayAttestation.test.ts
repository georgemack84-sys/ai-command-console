import { describe, expect, it } from "vitest";

import { validateReplayRuntimeAttestation } from "@/services/runtime-validation";
import { buildRuntimeValidationFixture } from "./helpers";

describe("runtime replay attestation", () => {
  it("accepts replay under identical certified runtime state", () => {
    const result = validateReplayRuntimeAttestation(buildRuntimeValidationFixture());
    expect(result.valid).toBe(true);
    expect(result.trustState).toBe("certified");
  });

  it("fails closed under replay containment substitution", () => {
    const fixture = buildRuntimeValidationFixture();
    const result = validateReplayRuntimeAttestation({
      ...fixture,
      activeRuntime: {
        ...fixture.activeRuntime,
        governance: {
          ...fixture.activeRuntime.governance,
          evidenceBundle: {
            ...fixture.activeRuntime.governance.evidenceBundle,
            replayContainmentHash: "forged",
          },
        },
      },
    });
    expect(result.valid).toBe(false);
    expect(result.failures.some((failure) => failure.code === "RUNTIME_REPLAY_CONTAINMENT_DRIFT")).toBe(true);
  });

  it("fails closed under uncertified runtime", () => {
    const fixture = buildRuntimeValidationFixture();
    const result = validateReplayRuntimeAttestation({
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
    expect(result.failures.some((failure) => failure.code === "RUNTIME_UNCERTIFIED")).toBe(true);
  });
});
