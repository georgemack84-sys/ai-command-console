import { describe, expect, it } from "vitest";

import { replayConstitutionalAuditRecord } from "@/services/audit/constitutionalReplay";

describe("replayConstitutionalAuditRecord", () => {
  it("replays read-only and blocks on mismatch", () => {
    const result = replayConstitutionalAuditRecord({
      record: {
        auditId: "audit:a",
        governanceAction: "DENY",
        constitutionalState: "DISPUTED",
        evidence: ["evidence:a"],
        reasoningChain: ["reason:a"],
        approvals: [],
        escalationChain: ["escalation:a"],
        coordinationChain: ["coordination:a"],
        coordinationSystems: ["GOVERNANCE"],
        relatedExecutionIds: [],
        relatedGovernanceIds: [],
        relatedCoordinationIds: [],
        containmentActive: true,
        coordinationConflictDetected: false,
        operatorVisibility: true,
        immutableHash: "forged",
        replayable: true,
        exported: false,
        timestamp: "2026-05-09T00:00:00.000Z",
      },
    });

    expect(result.replayable).toBe(false);
    expect(result.replayState).toBe("FROZEN");
  });
});
