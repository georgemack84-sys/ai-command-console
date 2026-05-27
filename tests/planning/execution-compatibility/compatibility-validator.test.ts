import { describe, expect, it } from "vitest";

import { hashExecutionCompatibilityContract, validateExecutionCompatibility } from "@/services/planning/execution-compatibility";
import { buildExecutionCompatibilityFixture } from "./helpers";

describe("execution compatibility validator", () => {
  it("builds stable compatibility contract from valid input", () => {
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
    expect(result.contract.compatible).toBe(true);
    expect(result.contract.executionTruthHash).toBe(fixture.executionTruthPackage.executionTruthHash);
  });

  it("preserves executionTruthHash", () => {
    const fixture = buildExecutionCompatibilityFixture();
    const result = validateExecutionCompatibility({
      executionTruthHash: fixture.executionTruthPackage.executionTruthHash,
      normalizedPlan: fixture.normalizedPlan,
      executionTruth: fixture.executionTruthPackage,
      dependencyValidation: fixture.dependencyValidation,
    });

    expect(result.contract?.executionTruthHash).toBe(fixture.executionTruthPackage.executionTruthHash);
  });

  it("produces deterministic executionCompatibilityHash", () => {
    const fixture = buildExecutionCompatibilityFixture();
    const left = validateExecutionCompatibility({
      executionTruthHash: fixture.executionTruthPackage.executionTruthHash,
      normalizedPlan: fixture.normalizedPlan,
      executionTruth: fixture.executionTruthPackage,
      dependencyValidation: fixture.dependencyValidation,
    });
    const right = validateExecutionCompatibility({
      executionTruthHash: fixture.executionTruthPackage.executionTruthHash,
      normalizedPlan: JSON.parse(JSON.stringify(fixture.normalizedPlan)),
      executionTruth: JSON.parse(JSON.stringify(fixture.executionTruthPackage)),
      dependencyValidation: JSON.parse(JSON.stringify(fixture.dependencyValidation)),
    });

    expect(left.ok).toBe(true);
    expect(right.ok).toBe(true);
    expect(left.contract?.executionCompatibilityHash).toBe(right.contract?.executionCompatibilityHash);
  });

  it("detects compatibility hash drift", () => {
    const fixture = buildExecutionCompatibilityFixture();
    const valid = validateExecutionCompatibility({
      executionTruthHash: fixture.executionTruthPackage.executionTruthHash,
      normalizedPlan: fixture.normalizedPlan,
      executionTruth: fixture.executionTruthPackage,
      dependencyValidation: fixture.dependencyValidation,
    });
    expect(valid.ok).toBe(true);
    if (!valid.ok) {
      return;
    }

    const drifted = validateExecutionCompatibility({
      executionTruthHash: fixture.executionTruthPackage.executionTruthHash,
      normalizedPlan: fixture.normalizedPlan,
      executionTruth: fixture.executionTruthPackage,
      dependencyValidation: fixture.dependencyValidation,
      expectedCompatibilityHash: `${valid.contract.executionCompatibilityHash}-drift`,
    });

    expect(drifted.ok).toBe(false);
    expect(drifted.violations.some((violation) => violation.code === "PLAN_COMPATIBILITY_HASH_MISMATCH")).toBe(true);
  });

  it("confirms output is consumable by 4.2F without duplicating enforcement", () => {
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

    expect(result.contract).not.toHaveProperty("executionSafetyState");
    expect(hashExecutionCompatibilityContract({
      executionTruthHash: result.contract.executionTruthHash,
      approvalContracts: result.contract.approvalContracts,
      rollbackContracts: result.contract.rollbackContracts,
      compensationContracts: result.contract.compensationContracts,
      authorityGraph: result.contract.authorityGraph,
      escalationGraph: result.contract.escalationGraph,
      compatibilitySnapshot: result.contract.compatibilitySnapshot,
    })).toBe(result.contract.executionCompatibilityHash);
  });
});
