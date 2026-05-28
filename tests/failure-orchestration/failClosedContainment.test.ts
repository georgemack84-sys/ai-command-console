import { describe, expect, it } from "vitest";
import { FAILURE_ORCHESTRATION_CODES } from "@/services/failure-orchestration";
import {
  buildFailureOrchestrationFixture,
  evaluateFailureFixture,
} from "@/tests/failure-orchestration/helpers";

describe("failure orchestration fail-closed", () => {
  it("denies execution when trust is unknown", () => {
    const result = evaluateFailureFixture({
      trustedSnapshotAdmission: {
        ok: false,
        code: "REGISTRY_TRUST_FAILURE",
        reason: "unknown trust",
        snapshotId: "snapshot-1",
        registrySnapshotHash: "hash-1",
        blockingCode: "EXECUTION_BLOCKED_UNTRUSTED_REGISTRY",
      },
    });

    expect(result.allowed).toBe(false);
    expect(result.runtimeMode).toBe("FULL_CONTAINMENT");
    expect(result.signals.some((signal) => signal.code === FAILURE_ORCHESTRATION_CODES.FAILURE_SNAPSHOT_UNCERTAIN)).toBe(true);
  });

  it("denies replay on replay mismatch", () => {
    const fixture = buildFailureOrchestrationFixture();
    const result = evaluateFailureFixture({
      replayRequested: true,
      runtimeValidation: {
        ...fixture.runtimeValidation,
        allowed: false,
        attestation: {
          ...fixture.runtimeValidation.attestation,
          valid: false,
        },
      },
    });

    expect(result.allowed).toBe(false);
    expect(result.runtimeMode).toBe("FULL_CONTAINMENT");
    expect(result.signals.some((signal) => signal.code === FAILURE_ORCHESTRATION_CODES.FAILURE_REPLAY_MISMATCH)).toBe(true);
  });

  it("denies on governance mismatch", () => {
    const fixture = buildFailureOrchestrationFixture();
    const result = evaluateFailureFixture({
      runtimeValidation: {
        ...fixture.runtimeValidation,
        allowed: false,
        failures: [
          ...fixture.runtimeValidation.failures,
          {
            code: "RUNTIME_GOVERNANCE_DRIFT",
            message: "governance drift detected",
            path: "runtimeValidation.governance",
          },
        ],
      },
    });

    expect(result.allowed).toBe(false);
    expect(result.runtimeMode).toBe("FULL_CONTAINMENT");
    expect(result.signals.some((signal) => signal.code === FAILURE_ORCHESTRATION_CODES.FAILURE_GOVERNANCE_MISMATCH)).toBe(true);
  });

  it("denies when snapshot certainty is missing", () => {
    const fixture = buildFailureOrchestrationFixture();
    const result = evaluateFailureFixture({
      additionalSignals: [
        {
          domain: "registry",
          type: "STATE_UNCERTAIN",
          code: FAILURE_ORCHESTRATION_CODES.FAILURE_SNAPSHOT_UNCERTAIN,
          message: "snapshot certainty missing",
        },
      ],
      snapshot: {
        ...fixture.snapshot,
        manifest: {
          ...fixture.snapshot.manifest,
          registrySnapshotHash: "",
        },
      },
    });

    expect(result.allowed).toBe(false);
    expect(result.runtimeMode).toBe("FULL_CONTAINMENT");
  });
});
