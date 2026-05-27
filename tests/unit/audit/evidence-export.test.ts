import { describe, expect, it } from "vitest";

import { exportEvidenceBundleAsJson, exportEvidenceBundleAsMarkdown } from "@/services/audit/evidenceExport";

const record = {
  auditId: "audit:a",
  governanceAction: "FREEZE" as const,
  constitutionalState: "FROZEN" as const,
  evidence: ["evidence:a"],
  reasoningChain: ["reason:a"],
  approvals: ["approval:a"],
  escalationChain: ["escalation:a"],
  coordinationChain: ["coordination:a"],
  coordinationSystems: ["GOVERNANCE"],
  relatedExecutionIds: [],
  relatedGovernanceIds: [],
  relatedCoordinationIds: [],
  containmentActive: true,
  coordinationConflictDetected: true,
  operatorVisibility: true,
  immutableHash: "hash",
  replayable: true,
  exported: false,
  timestamp: "2026-05-09T00:00:00.000Z",
};

describe("evidenceExport", () => {
  it("includes disputes in exports", () => {
    const json = exportEvidenceBundleAsJson({
      record,
      disputes: ["dispute:a"],
      replayState: "FROZEN",
    });
    const markdown = exportEvidenceBundleAsMarkdown({
      record,
      disputes: ["dispute:a"],
      replayState: "FROZEN",
    });

    expect(json).toContain("dispute:a");
    expect(markdown).toContain("Disputes: dispute:a");
  });
});
