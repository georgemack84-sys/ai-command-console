import { describe, expect, it } from "vitest";

import { ConflictCandidateSearchService, InMemoryProvenanceLedger } from "@/services/learning-constitution";
import type { CandidateKnowledgeRecord, DurableProvenancedKnowledge } from "@/types/learning-constitution";

const scope = { type: "PROJECT", id: "noesis" } as const;
const durable = (id: string, statement: string): DurableProvenancedKnowledge => ({ id, recordType: "DURABLE_KNOWLEDGE", statement, classification: "PRINCIPLE", scope, authority: "HUMAN_DECISION", candidateId: `candidate:${id}`, approvalId: `approval:${id}`, evidenceRefs: [], status: "ACTIVE", createdAt: "2026-08-23T00:00:00.000Z", immutable: true });
const candidate: CandidateKnowledgeRecord = { id: "CP-42", recordType: "CANDIDATE_KNOWLEDGE", statement: "Use SQLite.", classification: "PRINCIPLE", scope, authority: "AGENT_INFERRED", extractionRefs: [], evidenceRefs: [], status: "CONFLICTED", createdAt: "2026-08-23T00:01:00.000Z", immutable: true };

describe("ConflictCandidateSearchService", () => {
  it("returns exact-scope active durable candidates without causing a side effect", async () => {
    const ledger = new InMemoryProvenanceLedger();
    await ledger.append(durable("P-17", "Use PostgreSQL."));
    await ledger.append(durable("P-other", "Use MySQL."));
    const result = await new ConflictCandidateSearchService(ledger).analyze({ candidate, semanticKey: "database", value: "sqlite" });
    expect(result).toMatchObject({ candidateId: "CP-42", searchedKnowledgeIds: ["P-17", "P-other"], persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false });
    expect(result.analyses).toHaveLength(2);
    expect(result.analyses[0]).toMatchObject({ relationship: "UNCERTAIN", requiresClarification: true });
  });
});
