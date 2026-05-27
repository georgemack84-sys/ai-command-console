import { describe, expect, it } from "vitest";

import { evaluateRuntimeEnforcementPolicies } from "@/services/enforcement/runtimeEnforcementPolicies";

describe("evaluateRuntimeEnforcementPolicies", () => {
  it("fails closed on ambiguous governance and missing escalation lineage", () => {
    const result = evaluateRuntimeEnforcementPolicies({
      governanceAllowed: false,
      governanceConfidence: 0.32,
      constitutionalState: "DISPUTED",
      disputedTruthPresent: true,
      containmentRequired: true,
      escalationRequired: true,
      escalationLineagePresent: false,
      emergencyLockActive: false,
      sovereigntyState: "CRITICAL",
      immutableAuditAvailable: true,
      supervisionState: "BLOCKED",
    });

    expect(result.blockedReasons).toContain("disputed_truth_blocks_execution");
    expect(result.blockedReasons).toContain("missing_escalation_lineage");
  });
});
