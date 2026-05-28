import { describe, expect, it } from "vitest";
import { ISOLATION_FAILURE_CODES } from "@/services/isolation-boundary-engine";
import { buildReplayRequestFromEvaluation, evaluateZoneFixture } from "@/tests/isolation-boundary-engine/helpers";

describe("adversarial isolation", () => {
  it("blocks privilege escalation attempts", () => {
    const result = evaluateZoneFixture({ privilegeEscalationAttempted: true, requestedZone: "privileged" });
    expect(result.allowed).toBe(false);
    expect(result.violations.some((item) => item.code === ISOLATION_FAILURE_CODES.TOOL_PRIVILEGE_ESCALATION_ATTEMPT)).toBe(true);
  });

  it("blocks forged sandbox identity during replay", () => {
    const baseline = evaluateZoneFixture();
    expect(baseline.allowed).toBe(true);
    const result = evaluateZoneFixture({
      replayRequest: {
        ...buildReplayRequestFromEvaluation(baseline),
        originalSandboxHash: "sha256-forged-sandbox",
      },
    });
    expect(result.allowed).toBe(false);
    expect(result.violations.some((item) => item.code === ISOLATION_FAILURE_CODES.DYNAMIC_TRUST_ESCALATION_FORBIDDEN)).toBe(true);
  });

  it("blocks network tunneling into private networks", () => {
    const result = evaluateZoneFixture({ requestedDomain: "10.0.0.8" });
    expect(result.allowed).toBe(false);
    expect(result.violations.some((item) => item.code === ISOLATION_FAILURE_CODES.TOOL_NETWORK_POLICY_VIOLATION)).toBe(true);
  });

  it("blocks filesystem access to orchestration internals", () => {
    const result = evaluateZoneFixture({ requestedFilesystemPath: "services/orchestration/root-state.json" });
    expect(result.allowed).toBe(false);
    expect(result.violations.some((item) => item.code === ISOLATION_FAILURE_CODES.TOOL_FILESYSTEM_BOUNDARY_VIOLATION)).toBe(true);
  });

  it("blocks runtime isolation policy mutation", () => {
    const result = evaluateZoneFixture({ runtimePolicyMutationAttempted: true });
    expect(result.allowed).toBe(false);
    expect(result.violations.some((item) => item.code === ISOLATION_FAILURE_CODES.TOOL_RUNTIME_POLICY_MUTATION)).toBe(true);
  });
});

