import { describe, expect, it } from "vitest";

import { hashExecutionCompatibilityContract, validateExecutionCompatibility } from "@/services/planning/execution-compatibility";
import { buildExecutionCompatibilityFixture } from "./helpers";

describe("execution compatibility hasher", () => {
  it("confirms 4.2G does not execute tools or mutate runtime", () => {
    const fixture = buildExecutionCompatibilityFixture();
    const inputClone = JSON.stringify(fixture.normalizedPlan);

    const result = validateExecutionCompatibility({
      executionTruthHash: fixture.executionTruthPackage.executionTruthHash,
      normalizedPlan: fixture.normalizedPlan,
      executionTruth: fixture.executionTruthPackage,
      dependencyValidation: fixture.dependencyValidation,
    });

    expect(JSON.stringify(fixture.normalizedPlan)).toBe(inputClone);
    expect(result.contract?.executionCompatibilityHash).toBeTruthy();
  });

  it("produces stable compatibility hash from the same contract", () => {
    const fixture = buildExecutionCompatibilityFixture();
    const result = validateExecutionCompatibility({
      executionTruthHash: fixture.executionTruthPackage.executionTruthHash,
      normalizedPlan: fixture.normalizedPlan,
      executionTruth: fixture.executionTruthPackage,
      dependencyValidation: fixture.dependencyValidation,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    const hash = hashExecutionCompatibilityContract({
      executionTruthHash: result.contract.executionTruthHash,
      approvalContracts: result.contract.approvalContracts,
      rollbackContracts: result.contract.rollbackContracts,
      compensationContracts: result.contract.compensationContracts,
      authorityGraph: result.contract.authorityGraph,
      escalationGraph: result.contract.escalationGraph,
      compatibilitySnapshot: result.contract.compatibilitySnapshot,
    });

    expect(hash).toBe(result.contract.executionCompatibilityHash);
  });
});
