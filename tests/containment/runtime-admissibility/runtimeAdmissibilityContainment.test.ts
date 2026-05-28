import { describe, expect, it } from "vitest";
import { buildRuntimeAdmissibilityFixture } from "@/tests/integration/runtime-admissibility/helpers";

describe("runtime admissibility containment", () => {
  it("rejects hidden retries and scheduling semantics", () => {
    const fixture = buildRuntimeAdmissibilityFixture({
      runtimeTopology: Object.freeze({
        runtimeId: "runtime-1",
        governanceSnapshotId: "governance-snapshot-1",
        topologyHash: "runtime-topology-containment",
        declaredEdges: Object.freeze(["runtime->scheduler"]),
        hiddenOrchestrationDetected: false,
        recursiveCoordinationDetected: false,
        invisibleSchedulingDetected: true,
        hiddenRetryDetected: true,
        authorityExpansionDetected: false,
        runtimeCreatedRuntimesDetected: false,
        synthesizedOrchestrationDetected: false,
        executionMarkersDetected: false,
      }),
    });

    expect(fixture.result.errors.some((error) => error.code === "RUNTIME_ADMISSIBILITY_INVISIBLE_SCHEDULING")).toBe(true);
    expect(fixture.result.errors.some((error) => error.code === "RUNTIME_ADMISSIBILITY_HIDDEN_RETRY")).toBe(true);
  });
});
