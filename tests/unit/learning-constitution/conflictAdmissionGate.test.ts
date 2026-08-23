import { describe, expect, it } from "vitest";

import { ConflictAdmissionGate, HumanApprovalService, InMemoryProvenanceLedger } from "@/services/learning-constitution";

const scope = { type: "PROJECT", id: "noesis" } as const;
const candidate = { id: "CP-1", recordType: "CANDIDATE_KNOWLEDGE" as const, statement: "Use SQLite.", classification: "PRINCIPLE" as const, scope, authority: "AGENT_INFERRED", extractionRefs: [], evidenceRefs: [], status: "CONFLICTED" as const, createdAt: "2026-08-23T00:00:00.000Z", immutable: true as const };
const conflict = { id: "CF-1", recordType: "CONFLICT" as const, existingKnowledgeId: "P-1", candidateKnowledgeId: "CP-1", type: "DIRECT_CONTRADICTION" as const, scope, authorityComparison: { existing: "human", candidate: "agent", outcome: "EXISTING_STRONGER" as const, rationaleCode: "test" }, evidenceComparison: { existing: "", candidate: "", outcome: "UNKNOWN" as const, rationaleCode: "test" }, confidenceComparison: { existing: "", candidate: "", outcome: "UNKNOWN" as const, rationaleCode: "test" }, provenanceRefs: [], resolutionReasoning: "test", status: "AWAITING_APPROVAL" as const, createdAt: "2026-08-23T00:00:00.000Z", immutable: true as const };

describe("ConflictAdmissionGate", () => {
  it("blocks approval while a material conflict is unresolved", async () => {
    const ledger = new InMemoryProvenanceLedger(); await ledger.append(candidate); await ledger.append(conflict);
    expect(await new ConflictAdmissionGate(ledger).evaluate("CP-1")).toMatchObject({ decision: "BLOCK", blockingConflictIds: ["CF-1"] });
    const approval = await new HumanApprovalService({ ledger }).decide({ candidateId: "CP-1", decision: "APPROVED", approvedStatement: candidate.statement, actor: { actorId: "user:owner", actorType: "HUMAN" } });
    expect(approval).toMatchObject({ status: "REJECTED", reasonCode: "BLOCKING_CONFLICT_UNRESOLVED", persistenceEffect: "NONE" });
  });
});
