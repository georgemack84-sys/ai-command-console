import { describe, expect, it } from "vitest";

import { bindProposalSafeAction } from "@/services/proposal-lifecycle-engine";
import { buildSafeActionFixture } from "@/tests/safe-action-catalog/helpers";

describe("proposalSafeActionBinder", () => {
  it("binds lawful safe actions without reinterpreting legality", () => {
    const { safeActionProfile } = buildSafeActionFixture({ actionId: "safe-action:recommend" });
    const binding = bindProposalSafeAction(safeActionProfile);
    expect(binding.valid).toBe(true);
    expect(binding.category).toBe("recommend");
  });

  it("denies future-bound escalation", () => {
    const { safeActionProfile } = buildSafeActionFixture({
      actionId: "safe-action:simulate",
      autonomyLevel: "A3",
    });
    const binding = bindProposalSafeAction(safeActionProfile);
    expect(binding.futureBound).toBe(true);
    expect(binding.valid).toBe(false);
  });
});
