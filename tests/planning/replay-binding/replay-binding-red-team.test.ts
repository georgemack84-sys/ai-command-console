import { describe, expect, it } from "vitest";

import { buildReplayBindingReadiness } from "@/services/planning/replay-binding";
import { buildReplayBindingFixture } from "@/tests/planning/replay-binding/helpers";

describe("replay binding red team", () => {
  it("blocks forged replaySnapshotHash", () => {
    const fixture = buildReplayBindingFixture();
    (fixture.admissionInput.versionedReplayArtifact.replayAuditResult as { replaySnapshotHash?: string }).replaySnapshotHash = "forged";
    const readiness = buildReplayBindingReadiness(fixture);
    expect(readiness.failures.some((failure) => failure.code === "IMMUTABLE_LINEAGE_VIOLATION")).toBe(true);
  });

  it("blocks forged executionTruthHash", () => {
    const fixture = buildReplayBindingFixture();
    (fixture.admissionReadiness.context.lineage as { executionTruthHash: string }).executionTruthHash = "forged";
    const readiness = buildReplayBindingReadiness(fixture);
    expect(readiness.failures.some((failure) => failure.code === "IMMUTABLE_LINEAGE_VIOLATION")).toBe(true);
  });

  it("blocks substituted derivedSimulationHash", () => {
    const fixture = buildReplayBindingFixture({
      expectedDerivedSimulationHash: "substituted",
    });
    const readiness = buildReplayBindingReadiness(fixture);
    expect(readiness.failures.some((failure) => failure.code === "DERIVED_EVIDENCE_MISMATCH")).toBe(true);
  });

  it("blocks replay package attempting to replace truth anchors", () => {
    const fixture = buildReplayBindingFixture();
    (fixture.admissionInput.versionedReplayArtifact.replayAuditResult as { executionCompatibilityHash?: string }).executionCompatibilityHash = "replaced";
    const readiness = buildReplayBindingReadiness(fixture);
    expect(readiness.failures.some((failure) => failure.code === "IMMUTABLE_LINEAGE_VIOLATION")).toBe(true);
  });

  it("blocks mutation attempt after certification", () => {
    const fixture = buildReplayBindingFixture();
    (fixture.admissionInput.runtimeMetadata as { mutationAttempted?: boolean }).mutationAttempted = true;
    const readiness = buildReplayBindingReadiness(fixture);
    expect(readiness.failures.some((failure) => failure.code === "RUNTIME_BINDING_DIVERGENCE")).toBe(true);
  });
});
