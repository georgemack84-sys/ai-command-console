import { describe, expect, it } from "vitest";
import { buildRuntimeAdmissibilityFixture } from "@/tests/integration/runtime-admissibility/helpers";

describe("runtime admissibility governance", () => {
  it("rejects governance detachment", () => {
    const fixture = buildRuntimeAdmissibilityFixture({
      runtimeTopology: Object.freeze({
        runtimeId: "runtime-1",
        governanceSnapshotId: "governance-detached",
        topologyHash: "runtime-topology-hash-2",
        declaredEdges: Object.freeze(["governance->runtime"]),
        hiddenOrchestrationDetected: false,
        recursiveCoordinationDetected: false,
        invisibleSchedulingDetected: false,
        hiddenRetryDetected: false,
        authorityExpansionDetected: false,
        runtimeCreatedRuntimesDetected: false,
        synthesizedOrchestrationDetected: false,
        executionMarkersDetected: false,
      }),
    });

    expect(fixture.result.errors.some((error) => error.code === "RUNTIME_ADMISSIBILITY_GOVERNANCE_DETACHED")).toBe(true);
    expect(fixture.result.record.classification).toBe("invalid");
  });
});
