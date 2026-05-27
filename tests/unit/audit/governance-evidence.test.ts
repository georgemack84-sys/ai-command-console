import { describe, expect, it } from "vitest";

import { buildGovernanceEvidenceBundle } from "@/services/audit/governanceEvidence";

describe("buildGovernanceEvidenceBundle", () => {
  it("rejects governance without evidence", () => {
    expect(() => buildGovernanceEvidenceBundle({
      evidenceRefs: {},
      scope: "governance",
    })).toThrow("governance_evidence_missing");
  });

  it("preserves evidence references deterministically", () => {
    const bundle = buildGovernanceEvidenceBundle({
      evidenceRefs: {
        CONSTITUTIONAL_DECISION: ["decision:b", "decision:a"],
        APPROVAL_RECORD: ["approval:a"],
      },
      scope: "governance",
    });

    expect(bundle.evidenceRefs).toEqual(["approval:a", "decision:a", "decision:b"]);
  });
});
