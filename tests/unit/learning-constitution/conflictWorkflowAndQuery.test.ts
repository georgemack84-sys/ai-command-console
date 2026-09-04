import { describe, expect, it } from "vitest";

import { ConflictQueryService, ConflictWorkflowService, InMemoryProvenanceLedger } from "@/services/learning-constitution";
import type { ConflictRecord } from "@/types/learning-constitution";

const conflict: ConflictRecord = { id: "CF-1", recordType: "CONFLICT", existingKnowledgeId: "P-1", candidateKnowledgeId: "CP-1", type: "AMBIGUOUS_CONFLICT", scope: { type: "PROJECT", id: "noesis" }, authorityComparison: { existing: "", candidate: "", outcome: "UNKNOWN", rationaleCode: "test" }, evidenceComparison: { existing: "", candidate: "", outcome: "UNKNOWN", rationaleCode: "test" }, confidenceComparison: { existing: "", candidate: "", outcome: "UNKNOWN", rationaleCode: "test" }, provenanceRefs: [], resolutionReasoning: "test", status: "AWAITING_CLARIFICATION", createdAt: "2026-08-23T00:00:00.000Z", immutable: true };

describe("conflict clarification, escalation, and query", () => {
  it("preserves clarification and escalation as separate immutable workflow records", async () => {
    const ledger = new InMemoryProvenanceLedger(); await ledger.append(conflict);
    const workflow = new ConflictWorkflowService(ledger, (prefix) => `${prefix}-1`, (prefix) => `relationship:${prefix}`, () => "2026-08-23T01:00:00.000Z");
    const clarification = await workflow.requestClarification({ conflictId: "CF-1", question: "Should this be an exception or replacement?", candidateOutcomes: ["CREATE_EXCEPTION", "SUPERSEDE"], requiredAuthority: "HUMAN_DECISION", requestedBy: { actorId: "agent:noesis", actorType: "AGENT" } });
    const escalation = await workflow.escalate({ conflictId: "CF-1", reason: "Authority is unresolved.", targetAuthority: "HUMAN_OWNER", escalatedBy: { actorId: "agent:noesis", actorType: "AGENT" } });
    const result = await new ConflictQueryService(ledger).get("CF-1");
    expect(clarification?.recordType).toBe("CONFLICT_CLARIFICATION_REQUEST");
    expect(escalation?.recordType).toBe("CONFLICT_ESCALATION");
    expect(result?.relationships).toHaveLength(2);
  });
});
