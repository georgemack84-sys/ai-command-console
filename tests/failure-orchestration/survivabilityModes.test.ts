import { describe, expect, it } from "vitest";
import { evaluateFailureFixture } from "@/tests/failure-orchestration/helpers";

describe("runtime survivability", () => {
  it("preserves telemetry, audit, and recovery tooling during containment", () => {
    const result = evaluateFailureFixture({
      freezeBypassAttempted: true,
    });

    expect(result.allowed).toBe(false);
    expect(result.survivability.telemetryOperational).toBe(true);
    expect(result.survivability.auditOperational).toBe(true);
    expect(result.survivability.recoveryOperational).toBe(true);
    expect(result.survivability.operatorVisibilityOperational).toBe(true);
    expect(result.survivability.immutableEvidenceOperational).toBe(true);
  });
});

