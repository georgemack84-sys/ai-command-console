import { describe, expect, it } from "vitest";

import { normalizeApprovalContract } from "@/services/planning/execution-compatibility";
import { buildExecutionCompatibilityFixture } from "./helpers";

describe("approval contract normalizer", () => {
  it("fails closed when approval contract is missing", () => {
    const fixture = buildExecutionCompatibilityFixture();
    delete fixture.normalizedPlan.steps[0]!.inputs.compatibility;

    expect(normalizeApprovalContract(fixture.normalizedPlan.steps[0]!)).toBeNull();
  });
});
