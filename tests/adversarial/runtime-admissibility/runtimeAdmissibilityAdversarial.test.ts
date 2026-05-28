import { describe, expect, it } from "vitest";
import { buildRuntimeAdmissibilityFixture } from "@/tests/integration/runtime-admissibility/helpers";

describe("runtime admissibility adversarial", () => {
  it("rejects hidden orchestration and runtime-created runtimes", () => {
    const fixture = buildRuntimeAdmissibilityFixture({
      runtimeTopology: Object.freeze({
        runtimeId: "runtime-1",
        governanceSnapshotId: "governance-snapshot-1",
        topologyHash: "runtime-topology-adversarial",
        declaredEdges: Object.freeze(["runtime->runtime"]),
        hiddenOrchestrationDetected: true,
        recursiveCoordinationDetected: false,
        invisibleSchedulingDetected: false,
        hiddenRetryDetected: false,
        authorityExpansionDetected: false,
        runtimeCreatedRuntimesDetected: true,
        synthesizedOrchestrationDetected: true,
        executionMarkersDetected: false,
      }),
    });

    expect(fixture.result.errors.some((error) => error.code === "RUNTIME_ADMISSIBILITY_HIDDEN_ORCHESTRATION")).toBe(true);
    expect(fixture.result.errors.some((error) => error.code === "RUNTIME_ADMISSIBILITY_RUNTIME_CREATED_RUNTIME")).toBe(true);
  });
});
