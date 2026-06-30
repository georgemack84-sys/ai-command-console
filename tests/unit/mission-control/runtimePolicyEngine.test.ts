import { describe, expect, it } from "vitest";
import {
  buildTruthRuntimePolicyEngineRequest,
  sealTruthRuntimePolicyEngine,
} from "@/services/mission-control";
import type { TruthRuntimePolicyEngineInput } from "@/services/mission-control";

function baseRuntimeInput(overrides: Partial<TruthRuntimePolicyEngineInput> = {}): TruthRuntimePolicyEngineInput {
  return {
    request: buildTruthRuntimePolicyEngineRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-24T18:00:00.000Z",
    }),
    actionId: "action-alpha",
    missionId: "mission-alpha",
    agentId: "agent-alpha",
    requestedAction: "CAPABILITY_ACTION",
    authorityState: "AUTHORIZED",
    governanceState: "COMPLIANT",
    policyState: "COMPLIANT",
    trustState: "TRUSTED",
    certificationState: "VALID",
    containmentState: "NOT_REQUIRED",
    replayReferences: ["runtime-replay-alpha"],
    accessTenantId: "tenant-alpha",
    authenticated: true,
    ...overrides,
  };
}

describe("runtimePolicyEngine", () => {
  it("allows a fully authorized runtime action deterministically", () => {
    const first = sealTruthRuntimePolicyEngine(baseRuntimeInput());
    const second = sealTruthRuntimePolicyEngine(baseRuntimeInput());

    expect(first).toEqual(second);
    expect(first.certification).toBe("PASS");
    expect(first.evaluation.evaluation_result).toBe("ALLOW");
    expect(first.replay.replayResult).toBe("REPRODUCED");
  });

  it("denies unknown or insufficient authority and escalates scope violation", () => {
    const unknown = sealTruthRuntimePolicyEngine(baseRuntimeInput({ authorityState: "UNKNOWN" }));
    const insufficient = sealTruthRuntimePolicyEngine(baseRuntimeInput({ authorityState: "INSUFFICIENT" }));
    const scope = sealTruthRuntimePolicyEngine(baseRuntimeInput({ authorityState: "SCOPE_VIOLATION" }));

    expect(unknown.evaluation.evaluation_result).toBe("DENY");
    expect(unknown.certification).toBe("PASS");
    expect(insufficient.evaluation.evaluation_result).toBe("DENY");
    expect(scope.evaluation.evaluation_result).toBe("ESCALATE");
  });

  it("denies governance violation and contains constitutional violation", () => {
    const governance = sealTruthRuntimePolicyEngine(baseRuntimeInput({ governanceState: "VIOLATION" }));
    const constitutional = sealTruthRuntimePolicyEngine(baseRuntimeInput({ governanceState: "CONSTITUTIONAL_VIOLATION" }));

    expect(governance.evaluation.evaluation_result).toBe("DENY");
    expect(governance.certification).toBe("PASS");
    expect(constitutional.evaluation.evaluation_result).toBe("CONTAIN");
    expect(constitutional.certification).toBe("PASS");
  });

  it("denies policy violation and policy bypass", () => {
    const violation = sealTruthRuntimePolicyEngine(baseRuntimeInput({ policyState: "VIOLATION" }));
    const bypass = sealTruthRuntimePolicyEngine(baseRuntimeInput({ policyState: "BYPASSED", policyBypassDetected: true }));

    expect(violation.evaluation.evaluation_result).toBe("DENY");
    expect(violation.certification).toBe("PASS");
    expect(bypass.evaluation.evaluation_result).toBe("DENY");
    expect(bypass.certification).toBe("PASS");
  });

  it("denies untrusted action and escalates restricted trust", () => {
    const untrusted = sealTruthRuntimePolicyEngine(baseRuntimeInput({ trustState: "UNTRUSTED" }));
    const restricted = sealTruthRuntimePolicyEngine(baseRuntimeInput({ trustState: "RESTRICTED" }));

    expect(untrusted.evaluation.evaluation_result).toBe("DENY");
    expect(untrusted.certification).toBe("PASS");
    expect(restricted.evaluation.evaluation_result).toBe("ESCALATE");
  });

  it("denies missing and expired certification", () => {
    const missing = sealTruthRuntimePolicyEngine(baseRuntimeInput({ certificationState: "MISSING" }));
    const expired = sealTruthRuntimePolicyEngine(baseRuntimeInput({ certificationState: "EXPIRED" }));

    expect(missing.evaluation.evaluation_result).toBe("DENY");
    expect(missing.certification).toBe("PASS");
    expect(expired.evaluation.evaluation_result).toBe("DENY");
  });

  it("contains triggered containment and fails containment failure", () => {
    const contained = sealTruthRuntimePolicyEngine(baseRuntimeInput({ containmentState: "TRIGGERED" }));
    const failed = sealTruthRuntimePolicyEngine(baseRuntimeInput({ containmentState: "FAILED" }));

    expect(contained.evaluation.evaluation_result).toBe("CONTAIN");
    expect(contained.certification).toBe("PASS");
    expect(failed.certification).toBe("FAIL");
    expect(failed.validation.containmentValid).toBe(false);
  });

  it("blocks cross-tenant action execution and evaluation access", () => {
    const result = sealTruthRuntimePolicyEngine(baseRuntimeInput({
      crossTenantActionExecutionDetected: true,
      crossTenantEvaluationAccessDetected: true,
    }));

    expect(result.evaluation.evaluation_result).toBe("DENY");
    expect(result.certification).toBe("FAIL");
    expect(result.validation.tenantIsolationValid).toBe(false);
  });

  it("fails runtime replay mismatch", () => {
    const result = sealTruthRuntimePolicyEngine(baseRuntimeInput({ replayMismatchDetected: true }));

    expect(result.certification).toBe("FAIL");
    expect(result.replay.replayResult).toBe("MISMATCH");
    expect(result.validation.reasonCodes).toContain("REPLAY_MISMATCH");
  });

  it("fails unauthenticated or unknown action intake", () => {
    const result = sealTruthRuntimePolicyEngine(baseRuntimeInput({
      authenticated: false,
      unknownActionDetected: true,
    }));

    expect(result.certification).toBe("FAIL");
    expect(result.validation.actionIntakeValid).toBe(false);
  });

  it("allows conditional pass for documented observability gaps", () => {
    const result = sealTruthRuntimePolicyEngine(baseRuntimeInput({
      observabilityGapDetected: true,
      reportingLimitationDetected: true,
      remediationDocumented: true,
    }));

    expect(result.certification).toBe("CONDITIONAL_PASS");
    expect(result.validation.valid).toBe(true);
  });

  it("fails closed when control behavior is requested", () => {
    const result = sealTruthRuntimePolicyEngine(baseRuntimeInput({
      executionRequested: true,
      authorityExpansionDetected: true,
    }));

    expect(result.certification).toBe("FAIL");
    expect(result.validation.executionImpossible).toBe(false);
    expect(result.validation.authorityBounded).toBe(false);
    expect(result.executionAuthorized).toBe(false);
    expect(result.authorityMutationAllowed).toBe(false);
  });
});
