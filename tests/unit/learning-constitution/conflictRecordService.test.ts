import { describe, expect, it } from "vitest";

import { ConflictRecordService, InMemoryProvenanceLedger } from "@/services/learning-constitution";
import type { KnowledgeComparisonSubject } from "@/types/learning-constitution";

const scope = { type: "PROJECT", id: "noesis" } as const;
const provenance = (sourceId: string) => ({ observationId: `observation:${sourceId}`, sourceId, sourceType: "CONVERSATION" as const, originatingActorId: "user:owner", observedAt: "2026-08-23T00:00:00.000Z" });
const subject = (knowledgeId: string, value: string): KnowledgeComparisonSubject => ({ knowledgeId, content: value, classification: "PRINCIPLE", scope, provenance: provenance(knowledgeId), semanticKey: "database", value });
const durable = (id: string) => ({ id, recordType: "DURABLE_KNOWLEDGE" as const, statement: id, classification: "PRINCIPLE" as const, scope, authority: "HUMAN_DECISION", candidateId: `candidate:${id}`, approvalId: `approval:${id}`, evidenceRefs: [], status: "ACTIVE" as const, createdAt: "2026-08-23T00:00:00.000Z", immutable: true as const });
const candidate = (id: string) => ({ id, recordType: "CANDIDATE_KNOWLEDGE" as const, statement: id, classification: "PRINCIPLE" as const, scope, authority: "AGENT_INFERRED", extractionRefs: [], evidenceRefs: [], status: "CONFLICTED" as const, createdAt: "2026-08-23T00:00:00.000Z", immutable: true as const });

describe("ConflictRecordService", () => {
  it("records a contradiction immutably without resolving or mutating knowledge", async () => {
    const ledger = new InMemoryProvenanceLedger();
    await ledger.append(durable("P-17"));
    await ledger.append(candidate("CP-42"));
    const service = new ConflictRecordService({ ledger, createConflictId: () => "CF-218", createRelationshipId: (suffix) => `relationship:${suffix}`, now: () => "2026-08-23T01:00:00.000Z" });
    const result = await service.record({ candidate: subject("CP-42", "sqlite"), existingKnowledge: subject("P-17", "postgres") }, { actorId: "agent:noesis", actorType: "AGENT" });
    expect(result).toMatchObject({ status: "RECORDED", conflict: { id: "CF-218", type: "DIRECT_CONTRADICTION", proposedOutcome: "ESCALATE", status: "RESOLUTION_PROPOSED" }, authorityEffect: "UNCHANGED", executionPermissionGranted: false });
    expect((await ledger.get("P-17"))?.recordType).toBe("DURABLE_KNOWLEDGE");
    expect(await ledger.getRelationships("CF-218")).toHaveLength(2);
  });
});
