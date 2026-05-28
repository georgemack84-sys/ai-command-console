import { describe, expect, it } from "vitest";
import { buildConstitutionalTelemetryFixture } from "@/tests/integration/constitutional-telemetry/helpers";
import { buildRuntimeAdmissibilityFixture } from "@/tests/integration/runtime-admissibility/helpers";

describe("constitutional telemetry adversarial", () => {
  it("detects hidden orchestration and topology mutation", () => {
    const runtime = buildRuntimeAdmissibilityFixture({
      runtimeTopology: Object.freeze({
        runtimeId: "runtime-1",
        governanceSnapshotId: "governance-snapshot-1",
        topologyHash: "runtime-topology-adversarial",
        declaredEdges: Object.freeze(["runtime->runtime"]),
        hiddenOrchestrationDetected: true,
        recursiveCoordinationDetected: true,
        invisibleSchedulingDetected: false,
        hiddenRetryDetected: false,
        authorityExpansionDetected: false,
        runtimeCreatedRuntimesDetected: false,
        synthesizedOrchestrationDetected: true,
        executionMarkersDetected: false,
      }),
    }).result;
    const fixture = buildConstitutionalTelemetryFixture({
      runtimeAdmissibilityResult: runtime,
    });

    expect(fixture.result.errors.some((error) => error.code === "CONSTITUTIONAL_TELEMETRY_HIDDEN_ORCHESTRATION")).toBe(true);
    expect(fixture.result.errors.some((error) => error.code === "CONSTITUTIONAL_TELEMETRY_RECURSIVE_COORDINATION")).toBe(true);
  });
});
