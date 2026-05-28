import { describe, expect, it } from "vitest";

import { deriveEscalationGovernanceModel } from "@/services/intent-coordination-governance-core/escalationGovernanceModel";
import { validateEscalationContainment } from "@/services/intent-coordination-governance-core/escalationContainmentValidator";
import { buildIntentCoordinationGovernanceFixture } from "./helpers";

describe("escalation containment validator", () => {
  it("keeps escalation recommendation-only", () => {
    const { input } = buildIntentCoordinationGovernanceFixture();
    const model = deriveEscalationGovernanceModel({
      escalation: input.escalation,
      boundaryContract: input.boundaryContract,
      createdAt: input.createdAt,
    });
    const result = validateEscalationContainment({
      escalationGovernance: model,
      escalation: input.escalation,
    });
    expect(result).toEqual([]);
    expect(model.executionAuthority).toBe(false);
  });
});
