import { describe, expect, it } from "vitest";
import { buildConstitutionalTelemetryFixture } from "@/tests/integration/constitutional-telemetry/helpers";
import { buildRuntimeAdmissibilityFixture } from "@/tests/integration/runtime-admissibility/helpers";

describe("constitutional telemetry governance", () => {
  it("rejects governance detachment", () => {
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
    const fixture = buildConstitutionalTelemetryFixture({
      runtimeAdmissibilityResult: runtime,
    });

    expect(fixture.result.errors.some((error) => error.code === "CONSTITUTIONAL_TELEMETRY_GOVERNANCE_DETACHED")).toBe(true);
    expect(fixture.result.record.telemetryState).toBe("invalid");
  });
});
