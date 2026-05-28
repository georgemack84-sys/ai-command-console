import { describe, expect, it } from "vitest";

import { validateProposalLifecycle } from "@/services/proposal-lifecycle-engine";
import { buildProposalFixture } from "./helpers";

describe("proposalLifecycleValidator", () => {
  it("fails closed on missing lineage and metadata bridge injection", () => {
    const { input } = buildProposalFixture({
      metadata: Object.freeze({ runtimeBridge: true }),
    });
    const errors = validateProposalLifecycle({
      proposal: input,
      governanceValid: false,
      replayValid: false,
      snapshotValid: false,
      safeActionValid: false,
      futureBound: false,
      forbidden: false,
      metadata: input.metadata,
    });
    expect(errors.map((error) => error.code)).toContain("PROPOSAL_GOVERNANCE_BINDING_MISSING");
    expect(errors.map((error) => error.code)).toContain("PROPOSAL_RUNTIME_BRIDGE_FORBIDDEN");
  });
});
