import { describe, expect, it } from "vitest";

import { buildCoordinationAuditRecord } from "@/services/coordination/coordinationAudit";

describe("buildCoordinationAuditRecord", () => {
  it("emits append-ready coordination audit payloads", () => {
    const record = buildCoordinationAuditRecord({
      coordinationRecord: {
        coordinationId: "coordination:a",
        coordinationState: "BLOCKED",
        participatingSystems: ["GOVERNANCE"],
        coordinationReasoning: ["runtime_enforcement_precedence"],
        dependencyOrdering: ["GOVERNANCE"],
        containmentRequired: true,
        constitutionalSafe: false,
        approvalRequired: true,
        enforcementReferences: ["enforcement:a"],
        containmentReferences: ["containment:a"],
        supervisionReferences: ["supervision:a"],
        sovereigntyReferences: ["sovereignty:a"],
        auditReferences: ["audit:a"],
        immutableLineageHash: "hash",
        timestamp: "2026-05-09T00:00:00.000Z",
      },
    });

    expect(record.auditRef).toBe("coordination:coordination:a");
  });
});
