import { describe, expect, it } from "vitest";

import { hashExecutionCompatibilityContract } from "@/services/planning/execution-compatibility";
import { assessGovernanceMigrationImpact } from "@/services/planning/versioning";
import { buildVersioningFixture } from "./helpers";

describe("governance migration validator", () => {
  it("governance-sensitive expansion is blocked", () => {
    const fixture = buildVersioningFixture();
    const source = structuredClone(fixture.executionCompatibilityContract);
    const target = structuredClone(fixture.executionCompatibilityContract);
    target.approvalContracts[0]!.scope.environmentScope.push("production");
    (target as { executionCompatibilityHash: string }).executionCompatibilityHash = hashExecutionCompatibilityContract({
      executionTruthHash: target.executionTruthHash,
      approvalContracts: target.approvalContracts,
      rollbackContracts: target.rollbackContracts,
      compensationContracts: target.compensationContracts,
      authorityGraph: target.authorityGraph,
      escalationGraph: target.escalationGraph,
      compatibilitySnapshot: target.compatibilitySnapshot,
    });
    const result = assessGovernanceMigrationImpact(source, target);
    expect(result.failures.some((failure) => failure.code === "GOVERNANCE_MIGRATION_BLOCKED")).toBe(true);
  });

  it("approval invalidates when execution semantics change", () => {
    const fixture = buildVersioningFixture();
    const source = structuredClone(fixture.executionCompatibilityContract);
    const target = structuredClone(fixture.executionCompatibilityContract);
    target.approvalContracts[0]!.required = !target.approvalContracts[0]!.required;
    (target as { executionCompatibilityHash: string }).executionCompatibilityHash = hashExecutionCompatibilityContract({
      executionTruthHash: target.executionTruthHash,
      approvalContracts: target.approvalContracts,
      rollbackContracts: target.rollbackContracts,
      compensationContracts: target.compensationContracts,
      authorityGraph: target.authorityGraph,
      escalationGraph: target.escalationGraph,
      compatibilitySnapshot: target.compatibilitySnapshot,
    });
    const result = assessGovernanceMigrationImpact(source, target);
    expect(result.failures.some((failure) => failure.code === "APPROVAL_INVALIDATED")).toBe(true);
  });
});
