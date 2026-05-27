import { describe, expect, it } from "vitest";

import { buildExecutionSafetyContract } from "@/services/planning/execution-safety";

import { buildExecutionSafetyFixture } from "./helpers";

describe("execution safety contract builder", () => {
  it("creates a stable execution safety contract from execution truth", () => {
    const fixture = buildExecutionSafetyFixture();
    const first = buildExecutionSafetyContract(fixture);
    const second = buildExecutionSafetyContract(fixture);

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(first.contract).toEqual(second.contract);
    expect(first.contract.executionTruthHash).toBe(fixture.executionTruthPackage.executionTruthHash);
  });
});
