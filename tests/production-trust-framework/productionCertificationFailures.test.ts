import { describe, expect, it } from "vitest";
import {
  buildProductionSnapshotWithoutGovernance,
  buildProductionTrustFixture,
  buildRuntimeUnsupportedValidation,
  evaluateProductionFixture,
} from "./helpers";

describe("production certification failure paths", () => {
  it("fails if adversarial validation did not fully certify trust", () => {
    const result = evaluateProductionFixture({
      trustCertification: {
        certified: false,
        certificationEligible: false,
        errorCode: "CERTIFICATION_BLOCKED",
        resultHash: "sha256:blocked",
        failedScenarioIds: ["identity-duplicate-id"],
      },
    });

    expect(result.certified).toBe(false);
    expect(result.errors.some((error) => error.code === "REGISTRY_CERTIFICATION_FAILED")).toBe(true);
  });

  it("fails on replay mismatch, registry integrity mismatch, missing governance metadata, ambiguous resolution, and unsupported runtime", () => {
    const fixture = buildProductionTrustFixture();
    const result = evaluateProductionFixture({
      currentRegistryHash: "sha256:drifted",
      currentReplayHash: "sha256:replay-drifted",
      currentGovernanceHash: "sha256:governance-drifted",
      currentIntegrityHash: "sha256:integrity-drifted",
      snapshot: buildProductionSnapshotWithoutGovernance(fixture.input.snapshot),
      runtimeValidation: buildRuntimeUnsupportedValidation(fixture.input.runtimeValidation),
    });

    expect(result.certified).toBe(false);
    expect(result.errors.some((error) => error.code === "REPLAY_REGISTRY_MISMATCH")).toBe(true);
    expect(result.errors.some((error) => error.code === "REGISTRY_INTEGRITY_FAILURE")).toBe(true);
    expect(result.errors.some((error) => error.code === "TOOL_GOVERNANCE_METADATA_MISSING")).toBe(true);
    expect(result.errors.some((error) => error.code === "TOOL_RUNTIME_UNSUPPORTED")).toBe(true);
    expect(result.errors.some((error) => error.code === "TOOL_RESOLUTION_AMBIGUOUS")).toBe(true);
  });
});
