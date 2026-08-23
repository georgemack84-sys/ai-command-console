import { describe, expect, it } from "vitest";

import { ConflictMetricsService, InMemoryProvenanceLedger } from "@/services/learning-constitution";

const scope = { type: "PROJECT", id: "noesis" } as const;
const axis = { existing: "", candidate: "", outcome: "UNKNOWN" as const, rationaleCode: "test" };

describe("ConflictMetricsService", () => {
  it("derives counts from immutable conflict artifacts rather than mutable counters", async () => {
    const ledger = new InMemoryProvenanceLedger();
    await ledger.append({ id: "CF-open", recordType: "CONFLICT", existingKnowledgeId: "P-1", candidateKnowledgeId: "CP-1", type: "AMBIGUOUS_CONFLICT", scope, authorityComparison: axis, evidenceComparison: axis, confidenceComparison: axis, provenanceRefs: [], resolutionReasoning: "uncertain", status: "AWAITING_CLARIFICATION", createdAt: "2026-08-23T00:00:00.000Z", immutable: true });
    await ledger.append({ id: "CF-done", recordType: "CONFLICT", existingKnowledgeId: "P-2", candidateKnowledgeId: "CP-2", type: "CORRECTION_CONFLICT", scope, authorityComparison: axis, evidenceComparison: axis, confidenceComparison: axis, provenanceRefs: [], resolutionReasoning: "correction", status: "AWAITING_APPROVAL", createdAt: "2026-08-23T00:00:00.000Z", immutable: true });
    await ledger.append({ id: "CR-1", recordType: "CONFLICT_RESOLUTION", conflictId: "CF-done", decisionId: "CRD-1", resolutionType: "SUPERSEDE", affectedKnowledgeIds: ["P-2"], resultingKnowledgeIds: ["P-3"], executedBy: { actorId: "user:owner", actorType: "HUMAN" }, executedAt: "2026-08-23T01:00:00.000Z", immutable: true });
    await ledger.append({ id: "CE-1", recordType: "CONFLICT_ESCALATION", conflictId: "CF-open", reason: "Need owner.", targetAuthority: "HUMAN_OWNER", escalatedBy: { actorId: "agent:noesis", actorType: "AGENT" }, createdAt: "2026-08-23T01:00:00.000Z", immutable: true });
    expect(await new ConflictMetricsService(ledger).measure()).toMatchObject({ conflictsDetected: 2, conflictsResolved: 1, conflictsPending: 1, conflictsEscalated: 1, itemsSuperseded: 1, humanResolutions: 1, persistenceEffect: "NONE" });
  });
});
