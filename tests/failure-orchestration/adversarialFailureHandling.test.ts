import { describe, expect, it } from "vitest";
import { FAILURE_ORCHESTRATION_CODES } from "@/services/failure-orchestration";
import { evaluateFailureFixture } from "@/tests/failure-orchestration/helpers";

describe("adversarial failure handling", () => {
  it("blocks freeze bypass attempts", () => {
    const result = evaluateFailureFixture({ freezeBypassAttempted: true });
    expect(result.allowed).toBe(false);
    expect(result.signals.some((signal) => signal.code === FAILURE_ORCHESTRATION_CODES.FAILURE_BYPASS_ATTEMPT)).toBe(true);
  });

  it("blocks recovery escalation attempts", () => {
    const result = evaluateFailureFixture({ recoveryEscalationAttempted: true });
    expect(result.allowed).toBe(false);
    expect(result.signals.some((signal) => signal.code === FAILURE_ORCHESTRATION_CODES.FAILURE_RECOVERY_TRUST_INVALID)).toBe(true);
  });

  it("blocks containment escape attempts", () => {
    const result = evaluateFailureFixture({ containmentEscapeAttempted: true });
    expect(result.allowed).toBe(false);
    expect(result.signals.some((signal) => signal.code === FAILURE_ORCHESTRATION_CODES.FAILURE_BYPASS_ATTEMPT)).toBe(true);
  });

  it("blocks forged recovery manifests", () => {
    const result = evaluateFailureFixture({
      forgedRecoveryManifest: true,
      recoveryManifestHash: "manifest-a",
      expectedRecoveryManifestHash: "manifest-b",
    });
    expect(result.allowed).toBe(false);
    expect(result.signals.some((signal) => signal.code === FAILURE_ORCHESTRATION_CODES.FAILURE_FORGED_RECOVERY_MANIFEST)).toBe(true);
  });

  it("blocks replay recovery tampering", () => {
    const result = evaluateFailureFixture({ replayRecoveryTampered: true });
    expect(result.allowed).toBe(false);
    expect(result.signals.some((signal) => signal.code === FAILURE_ORCHESTRATION_CODES.FAILURE_FORGED_RECOVERY_MANIFEST)).toBe(true);
  });
});

