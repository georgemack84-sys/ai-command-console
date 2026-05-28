import { describe, expect, it } from "vitest";

import { createConstitutionalAuditRecord, createExpandedConstitutionalAuditRecord } from "@/services/audit/constitutionalAuditSystem";
import { buildGovernanceReasoning } from "@/services/audit/governanceReasoning";

describe("constitutionalAuditSystem", () => {
  it("creates append-ready immutable audit records", () => {
    const record = createConstitutionalAuditRecord({
      governanceAction: "DENY",
      constitutionalState: "DISPUTED",
      evidence: ["evidence:a"],
      approvals: ["approval:a"],
      escalationChain: ["escalation:a"],
      operatorVisibility: true,
      timestamp: "2026-05-09T00:00:00.000Z",
    });
    const reasoning = buildGovernanceReasoning({
      governanceAction: "DENY",
      constitutionalRules: ["rule:a"],
      evaluatedConstraints: ["constraint:a"],
      approvalsRequired: true,
      escalationRequired: true,
      denialReason: "disputed truth",
      governanceConfidence: 0.2,
      explanation: ["disputed truth blocks operation"],
    });
    const expanded = createExpandedConstitutionalAuditRecord({
      record: {
        ...record,
        governanceAction: "DENY",
        constitutionalState: "DISPUTED",
        reasoningChain: reasoning.explanation,
        coordinationChain: [],
        coordinationSystems: [],
        relatedExecutionIds: [],
        relatedGovernanceIds: [],
        relatedCoordinationIds: [],
        containmentActive: true,
        coordinationConflictDetected: false,
        replayable: true,
        exported: false,
      },
      reasoning,
    });

    expect(expanded.immutableHash).toHaveLength(64);
  });
});
