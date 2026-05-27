import { describe, expect, it } from "vitest";

import { observeRuntimeDrift } from "@/services/planning/replay-binding";
import { buildReplayBindingFixture } from "@/tests/planning/replay-binding/helpers";

describe("runtime drift observer", () => {
  it("fails closed on runtime fingerprint drift", () => {
    const fixture = buildReplayBindingFixture({
      expectedRuntimeFingerprintHash: "expected",
      runtimeFingerprintHash: "actual",
    });
    const result = observeRuntimeDrift(fixture);
    expect(result.valid).toBe(false);
    expect(result.failures.some((failure) => failure.code === "RUNTIME_BINDING_DIVERGENCE")).toBe(true);
  });

  it("does not mutate runtime metadata", () => {
    const fixture = buildReplayBindingFixture();
    const before = JSON.stringify(fixture.admissionInput.runtimeMetadata);
    observeRuntimeDrift(fixture);
    expect(JSON.stringify(fixture.admissionInput.runtimeMetadata)).toBe(before);
  });
});
