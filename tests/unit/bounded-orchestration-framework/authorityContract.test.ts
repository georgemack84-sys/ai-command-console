import { describe, expect, it } from "vitest";

import {
  buildBoundedOrchestrationAuthorityContract,
  enforceBoundedOrchestrationBoundary,
} from "@/services/bounded-orchestration-framework";

describe("bounded orchestration authority contract", () => {
  it("keeps all authority flags permanently false", () => {
    expect(buildBoundedOrchestrationAuthorityContract()).toEqual({
      executionAuthority: false,
      orchestrationAuthority: false,
      dispatchAuthority: false,
      schedulingAuthority: false,
      runtimeMutationAuthority: false,
      governanceMutationAuthority: false,
      approvalInheritance: false,
      authorityInheritance: false,
      autonomousIntervention: false,
      workflowContinuation: false,
    });
  });

  it("rejects orchestration-adjacent metadata markers", () => {
    const errors = enforceBoundedOrchestrationBoundary({
      authorityContract: buildBoundedOrchestrationAuthorityContract(),
      metadata: Object.freeze({ mode: "generated_workflow dispatch repairReplay" }),
    });
    expect(errors.map((error) => error.code)).toEqual(expect.arrayContaining([
      "ORCHESTRATION_BOUNDARY_HIDDEN_ORCHESTRATION",
      "ORCHESTRATION_BOUNDARY_REPLAY_AMBIGUITY",
    ]));
  });
});
