import { describe, expect, it } from "vitest";

import { evaluateUnifiedExecutionEnforcement } from "@/services/execution-enforcement";
import { buildEnforcementFixture } from "./helpers";

describe("replay containment", () => {
  it("reconstructs identical sandbox and trust boundaries", () => {
    const result = evaluateUnifiedExecutionEnforcement(buildEnforcementFixture());
    expect(result.decision.allowed).toBe(true);
    expect(result.envelope?.sandboxProfileHash).toBe(buildEnforcementFixture().replayBinding?.sandboxProfileHash);
    expect(result.envelope?.derivedBoundaryHash).toBe(buildEnforcementFixture().replayBinding?.trustBoundaryHash);
  });

  it("fails closed on containment mismatch", () => {
    const result = evaluateUnifiedExecutionEnforcement(buildEnforcementFixture({
      replayBinding: {
        ...buildEnforcementFixture().replayBinding!,
        sandboxProfileHash: "forged",
      },
    }));

    expect(result.decision.allowed).toBe(false);
    expect(result.decision.violations.some((violation) => violation.reasonCode === "EXECUTION_REPLAY_CONTAINMENT_MISMATCH")).toBe(true);
  });
});
