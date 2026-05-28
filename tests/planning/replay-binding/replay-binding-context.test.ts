import { describe, expect, it } from "vitest";

import { buildReplayBindingContext, hashReplayBindingContext } from "@/services/planning/replay-binding";
import { buildReplayBindingFixture } from "@/tests/planning/replay-binding/helpers";

describe("replay binding context", () => {
  it("builds a deterministic replay binding context", () => {
    const fixture = buildReplayBindingFixture();
    expect(buildReplayBindingContext(fixture)).toEqual(buildReplayBindingContext(fixture));
  });

  it("preserves upstream hashes", () => {
    const fixture = buildReplayBindingFixture();
    const context = buildReplayBindingContext(fixture);
    expect(context.executionTruthHash).toBe(fixture.admissionReadiness.context.lineage.executionTruthHash);
    expect(context.executionCompatibilityHash).toBe(fixture.admissionReadiness.context.lineage.executionCompatibilityHash);
    expect(context.replaySnapshotHash).toBe(fixture.admissionReadiness.context.lineage.replaySnapshotHash);
    expect(context.derivedSimulationHash).toBe(fixture.admissionReadiness.context.lineage.derivedSimulationHash);
  });

  it("is key-order independent when hashed", () => {
    const fixture = buildReplayBindingFixture();
    const context = buildReplayBindingContext(fixture);
    expect(hashReplayBindingContext(context)).toBe(hashReplayBindingContext({
      requestedAt: context.requestedAt,
      admissionDecision: context.admissionDecision,
      trustZoneId: context.trustZoneId,
      runtimeFingerprintHash: context.runtimeFingerprintHash,
      dependencyHash: context.dependencyHash,
      governanceHash: context.governanceHash,
      ...(context.derivedSimulationHash ? { derivedSimulationHash: context.derivedSimulationHash } : {}),
      replaySnapshotHash: context.replaySnapshotHash,
      executionCompatibilityHash: context.executionCompatibilityHash,
      executionTruthHash: context.executionTruthHash,
      planHash: context.planHash,
    }));
  });
});
