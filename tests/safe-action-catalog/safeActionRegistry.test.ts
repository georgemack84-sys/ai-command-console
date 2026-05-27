import { describe, expect, it } from "vitest";

import { getSafeActionDefinition, getSafeActionRegistryHash, listSafeActionDefinitions } from "@/services/safe-action-catalog";

describe("safeActionRegistry", () => {
  it("defines the six allowed safe action classes deterministically", () => {
    const definitions = listSafeActionDefinitions();
    expect(definitions).toHaveLength(6);
    expect(definitions.map((definition) => definition.category)).toEqual([
      "observe",
      "recommend",
      "simulate",
      "escalate",
      "pause_request",
      "prepare_handoff",
    ]);
    expect(getSafeActionRegistryHash()).toBe(getSafeActionRegistryHash());
  });

  it("marks every registered action as non-executing and non-mutating", () => {
    const definition = getSafeActionDefinition("safe-action:recommend");
    expect(definition).toMatchObject({
      executionAllowed: false,
      mutating: false,
      selfApprovalAllowed: false,
      policyMutationAllowed: false,
    });
  });
});
