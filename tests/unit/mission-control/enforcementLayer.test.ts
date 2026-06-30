import { describe, expect, it } from "vitest";
import {
  buildTruthEnforcementLayerRequest,
  buildTruthRuntimePolicyEngineRequest,
  sealTruthEnforcementLayer,
  sealTruthRuntimePolicyEngine,
} from "@/services/mission-control";
import type { TruthEnforcementLayerInput, TruthRuntimePolicyEngineInput } from "@/services/mission-control";

function runtime(overrides: Partial<TruthRuntimePolicyEngineInput> = {}) {
  return sealTruthRuntimePolicyEngine({
    request: buildTruthRuntimePolicyEngineRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-24T19:00:00.000Z",
    }),
    actionId: "action-alpha",
    missionId: "mission-alpha",
    agentId: "agent-alpha",
    requestedAction: "RUNTIME_ACTION",
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
  });
}

function enforcementInput(overrides: Partial<TruthEnforcementLayerInput> = {}): TruthEnforcementLayerInput {
  return {
    request: buildTruthEnforcementLayerRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-24T19:01:00.000Z",
    }),
    runtimeEvaluation: runtime(),
    targetType: "RUNTIME_ACTION",
    targetId: "runtime-target-alpha",
    replayReferences: ["enforcement-replay-alpha"],
    accessTenantId: "tenant-alpha",
    ...overrides,
  };
}

describe("enforcementLayer", () => {
  it("enforces ALLOW deterministically", () => {
    const first = sealTruthEnforcementLayer(enforcementInput());
    const second = sealTruthEnforcementLayer(enforcementInput());

    expect(first).toEqual(second);
    expect(first.certification).toBe("PASS");
    expect(first.enforcement.enforcement_action).toBe("ALLOW");
    expect(first.visibility.target_state).toBe("ALLOWED");
  });

  it("enforces filesystem DENY and fails when filesystem violation executes", () => {
    const deniedRuntime = runtime({ policyState: "VIOLATION", requestedAction: "FILESYSTEM_ACTION" });
    const enforced = sealTruthEnforcementLayer(enforcementInput({
      runtimeEvaluation: deniedRuntime,
      targetType: "FILESYSTEM",
      targetId: "/system/config.yaml",
    }));
    const failed = sealTruthEnforcementLayer(enforcementInput({
      runtimeEvaluation: deniedRuntime,
      targetType: "FILESYSTEM",
      targetId: "/system/config.yaml",
      filesystemViolationExecuted: true,
    }));

    expect(enforced.certification).toBe("PASS");
    expect(enforced.enforcement.enforcement_action).toBe("DENY");
    expect(enforced.visibility.target_state).toBe("BLOCKED");
    expect(failed.certification).toBe("FAIL");
    expect(failed.validation.filesystemEnforcementValid).toBe(false);
  });

  it("enforces network DENY and fails when blocked traffic executes", () => {
    const deniedRuntime = runtime({ policyState: "VIOLATION", requestedAction: "NETWORK_ACTION" });
    const enforced = sealTruthEnforcementLayer(enforcementInput({
      runtimeEvaluation: deniedRuntime,
      targetType: "NETWORK",
      targetId: "blocked.example.com",
    }));
    const failed = sealTruthEnforcementLayer(enforcementInput({
      runtimeEvaluation: deniedRuntime,
      targetType: "NETWORK",
      targetId: "blocked.example.com",
      networkViolationExecuted: true,
    }));

    expect(enforced.certification).toBe("PASS");
    expect(enforced.visibility.target_state).toBe("BLOCKED");
    expect(failed.certification).toBe("FAIL");
    expect(failed.validation.networkEnforcementValid).toBe(false);
  });

  it("blocks restricted tools and capabilities", () => {
    const toolRuntime = runtime({ policyState: "VIOLATION", requestedAction: "TOOL_ACTION" });
    const capabilityRuntime = runtime({ policyState: "VIOLATION", requestedAction: "CAPABILITY_ACTION" });
    const tool = sealTruthEnforcementLayer(enforcementInput({
      runtimeEvaluation: toolRuntime,
      targetType: "TOOL",
      targetId: "restricted-tool",
    }));
    const capability = sealTruthEnforcementLayer(enforcementInput({
      runtimeEvaluation: capabilityRuntime,
      targetType: "CAPABILITY",
      targetId: "EXECUTE",
    }));

    expect(tool.certification).toBe("PASS");
    expect(tool.visibility.target_state).toBe("BLOCKED");
    expect(capability.certification).toBe("PASS");
    expect(capability.visibility.target_state).toBe("BLOCKED");
  });

  it("fails when restricted tool or capability executes", () => {
    const toolRuntime = runtime({ policyState: "VIOLATION", requestedAction: "TOOL_ACTION" });
    const capabilityRuntime = runtime({ policyState: "VIOLATION", requestedAction: "CAPABILITY_ACTION" });
    const tool = sealTruthEnforcementLayer(enforcementInput({
      runtimeEvaluation: toolRuntime,
      targetType: "TOOL",
      targetId: "restricted-tool",
      toolViolationExecuted: true,
    }));
    const capability = sealTruthEnforcementLayer(enforcementInput({
      runtimeEvaluation: capabilityRuntime,
      targetType: "CAPABILITY",
      targetId: "EXECUTE",
      capabilityViolationExecuted: true,
    }));

    expect(tool.certification).toBe("FAIL");
    expect(capability.certification).toBe("FAIL");
  });

  it("blocks restricted federation route and runtime action", () => {
    const routeRuntime = runtime({ policyState: "VIOLATION", requestedAction: "FEDERATION_ACTION" });
    const runtimeAction = runtime({ policyState: "VIOLATION", requestedAction: "RUNTIME_ACTION" });
    const route = sealTruthEnforcementLayer(enforcementInput({
      runtimeEvaluation: routeRuntime,
      targetType: "FEDERATION_ROUTE",
      targetId: "federation-route-alpha",
    }));
    const action = sealTruthEnforcementLayer(enforcementInput({
      runtimeEvaluation: runtimeAction,
      targetType: "RUNTIME_ACTION",
      targetId: "runtime-action-alpha",
    }));

    expect(route.certification).toBe("PASS");
    expect(route.visibility.target_state).toBe("BLOCKED");
    expect(action.certification).toBe("PASS");
    expect(action.visibility.target_state).toBe("BLOCKED");
  });

  it("enforces containment and fails containment failure", () => {
    const containedRuntime = runtime({ governanceState: "CONSTITUTIONAL_VIOLATION" });
    const contained = sealTruthEnforcementLayer(enforcementInput({
      runtimeEvaluation: containedRuntime,
      targetType: "RUNTIME_ACTION",
    }));
    const failed = sealTruthEnforcementLayer(enforcementInput({
      runtimeEvaluation: containedRuntime,
      targetType: "RUNTIME_ACTION",
      containmentFailureDetected: true,
    }));

    expect(contained.certification).toBe("PASS");
    expect(contained.visibility.target_state).toBe("CONTAINED");
    expect(failed.certification).toBe("FAIL");
    expect(failed.validation.containmentEnforcementValid).toBe(false);
  });

  it("enforces escalation", () => {
    const escalatedRuntime = runtime({ authorityState: "SCOPE_VIOLATION" });
    const result = sealTruthEnforcementLayer(enforcementInput({
      runtimeEvaluation: escalatedRuntime,
      targetType: "RUNTIME_ACTION",
    }));

    expect(result.certification).toBe("PASS");
    expect(result.enforcement.enforcement_action).toBe("ESCALATE");
    expect(result.visibility.target_state).toBe("ESCALATED");
  });

  it("fails enforcement replay mismatch", () => {
    const result = sealTruthEnforcementLayer(enforcementInput({ replayMismatchDetected: true }));

    expect(result.certification).toBe("FAIL");
    expect(result.replay.replayResult).toBe("MISMATCH");
    expect(result.validation.reasonCodes).toContain("REPLAY_MISMATCH");
  });

  it("blocks cross-tenant enforcement", () => {
    const result = sealTruthEnforcementLayer(enforcementInput({ crossTenantEnforcementDetected: true }));

    expect(result.certification).toBe("FAIL");
    expect(result.validation.tenantIsolationValid).toBe(false);
    expect(result.visibility.tenantScoped).toBe(false);
  });

  it("allows conditional pass for documented observability gaps", () => {
    const result = sealTruthEnforcementLayer(enforcementInput({
      observabilityGapDetected: true,
      reportingLimitationDetected: true,
      remediationDocumented: true,
    }));

    expect(result.certification).toBe("CONDITIONAL_PASS");
    expect(result.validation.valid).toBe(true);
  });

  it("fails closed when control behavior is requested", () => {
    const result = sealTruthEnforcementLayer(enforcementInput({
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
