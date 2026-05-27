import { describe, expect, it } from "vitest";

import { buildImmutableReplayBinding, certifyReplayReadiness } from "@/services/planning/replay-binding";
import { buildReplayBindingFixture } from "@/tests/planning/replay-binding/helpers";

describe("replay certification engine", () => {
  it("certifies valid replay binding deterministically", () => {
    const fixture = buildReplayBindingFixture();
    const binding = buildImmutableReplayBinding(fixture);
    const first = certifyReplayReadiness({
      buildInput: fixture,
      binding,
      runtimeValid: true,
      trustZoneValid: true,
    });
    const second = certifyReplayReadiness({
      buildInput: fixture,
      binding,
      runtimeValid: true,
      trustZoneValid: true,
    });
    expect(first).toEqual(second);
    expect(first.certification.certificationStatus).toBe("CERTIFIED");
  });

  it("fails closed on replay corruption", () => {
    const fixture = buildReplayBindingFixture();
    (fixture.admissionInput.versionedReplayArtifact.replayAuditResult.artifacts!.replayProof as { structuralEquality: boolean }).structuralEquality = false;
    const binding = buildImmutableReplayBinding(fixture);
    const certification = certifyReplayReadiness({
      buildInput: fixture,
      binding,
      runtimeValid: true,
      trustZoneValid: true,
    });
    expect(certification.failures.some((failure) => failure.code === "REPLAY_RECONSTRUCTION_UNSTABLE")).toBe(true);
  });
});
