import { describe, expect, it } from "vitest";

import { ConflictImpactAnalyzer, ConflictSetService, InMemoryProvenanceLedger } from "@/services/learning-constitution";
import type { ConflictRecord } from "@/types/learning-constitution";

const conflict = (id: string, existingKnowledgeId: string, candidateKnowledgeId: string): ConflictRecord => ({ id, recordType: "CONFLICT", existingKnowledgeId, candidateKnowledgeId, type: "DIRECT_CONTRADICTION", scope: { type: "PROJECT", id: "noesis" }, authorityComparison: { existing: "", candidate: "", outcome: "UNKNOWN", rationaleCode: "test" }, evidenceComparison: { existing: "", candidate: "", outcome: "UNKNOWN", rationaleCode: "test" }, confidenceComparison: { existing: "", candidate: "", outcome: "UNKNOWN", rationaleCode: "test" }, provenanceRefs: [], resolutionReasoning: "test", status: "ESCALATED", createdAt: "2026-08-23T00:00:00.000Z", immutable: true });

describe("conflict sets and impact analysis", () => {
  it("groups related conflicts and identifies unresolved cascade risk without mutation", async () => {
    const ledger = new InMemoryProvenanceLedger();
    await ledger.append(conflict("CF-1", "P-1", "CP-1"));
    await ledger.append(conflict("CF-2", "P-1", "CP-2"));
    const set = await new ConflictSetService(ledger, () => "CS-1", (id) => `relationship:${id}`, () => "2026-08-23T01:00:00.000Z").create({ conflictIds: ["CF-1", "CF-2"], rationale: "A shared rule is affected.", actor: { actorId: "agent:noesis", actorType: "AGENT" } });
    const impact = await new ConflictImpactAnalyzer(ledger).analyze("CF-1", "SUPERSEDE");
    expect(set).toMatchObject({ status: "CREATED", conflictSet: { id: "CS-1", status: "OPEN" } });
    expect(impact).toMatchObject({ relatedConflictIds: ["CF-2"], blockingConflictIds: ["CF-2"], requiresHumanReview: true, executionPermissionGranted: false });
  });
});
