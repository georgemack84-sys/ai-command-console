import { describe, expect, it } from "vitest";
import { buildConstitutionalRuntimeSimulationFixture } from "@/tests/integration/constitutional-runtime-simulation/helpers";
import { buildRuntimeAdmissibilityFixture } from "@/tests/integration/runtime-admissibility/helpers";

describe("constitutional runtime simulation governance", () => {
  it("requires immutable governance bindings", () => {
    const runtime = buildRuntimeAdmissibilityFixture({
      runtimeTopology: Object.freeze({
        runtimeId: "runtime-1",
        governanceSnapshotId: "governance-detached",
        topologyHash: "runtime-topology-governance-drift",
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
    }).result;
    const fixture = buildConstitutionalRuntimeSimulationFixture({
      runtimeAdmissibilityResult: runtime,
    });

    expect(fixture.result.errors.some((error) => error.code === "CONSTITUTIONAL_RUNTIME_SIMULATION_GOVERNANCE_MISMATCH")).toBe(true);
    expect(fixture.result.report.outcome).toBe("FAILED_CLOSED");
  });
});
