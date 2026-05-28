import { describe, expect, it } from "vitest";
import { evaluateFailureFixture } from "@/tests/failure-orchestration/helpers";

describe("recovery reactivation", () => {
  it("enforces staged reactivation", () => {
    const result = evaluateFailureFixture({
      currentMode: "FULL_CONTAINMENT",
      requestedRecoveryMode: "NORMAL",
      governanceReapproved: true,
    });

    expect(result.recovery.allowed).toBe(false);
    expect(result.recovery.reasonCode).toBe("FAILURE_RECOVERY_STAGE_INVALID");
  });

  it("denies reactivation with compromised trust", () => {
    const result = evaluateFailureFixture({
      currentMode: "FULL_CONTAINMENT",
      requestedRecoveryMode: "RECOVERY_ONLY",
      governanceReapproved: true,
      additionalSignals: [
        {
          domain: "registry",
          type: "RECOVERY_TRUST_INVALID",
          code: "FAILURE_RECOVERY_TRUST_INVALID",
          message: "compromised trust",
        },
      ],
    });

    expect(result.recovery.allowed).toBe(false);
    expect(result.recovery.reasonCode).toBe("FAILURE_RECOVERY_TRUST_INVALID");
  });

  it("requires governance reapproval before staged recovery", () => {
    const result = evaluateFailureFixture({
      currentMode: "RECOVERY_ONLY",
      requestedRecoveryMode: "OBSERVATION_ONLY",
      governanceReapproved: false,
    });

    expect(result.recovery.allowed).toBe(false);
    expect(result.recovery.governanceReapprovalRequired).toBe(true);
  });
});

