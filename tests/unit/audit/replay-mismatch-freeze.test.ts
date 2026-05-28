import { describe, expect, it } from "vitest";

import { validateConstitutionalReplay } from "@/services/audit/replayValidation";

describe("replay mismatch freeze", () => {
  it("freezes on replay mismatch", () => {
    const result = validateConstitutionalReplay({
      record: {
        auditId: "audit:a",
        governanceAction: "DENY",
        constitutionalState: "DISPUTED",
        evidence: ["evidence:a"],
        reasoningChain: ["reason:a"],
        approvals: [],
        escalationChain: [],
        coordinationChain: [],
        coordinationSystems: [],
        relatedExecutionIds: [],
        relatedGovernanceIds: [],
        relatedCoordinationIds: [],
        containmentActive: true,
        coordinationConflictDetected: false,
        operatorVisibility: true,
        immutableHash: "bad-hash",
        replayable: true,
        exported: false,
        timestamp: "2026-05-09T00:00:00.000Z",
      },
    });

    expect(result.blocked).toBe(true);
    expect(result.blockedReasons).toContain("replay_hash_mismatch");
  });
});
