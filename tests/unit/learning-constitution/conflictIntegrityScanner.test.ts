import { describe, expect, it } from "vitest";

import { ConflictIntegrityScanner, InMemoryProvenanceLedger } from "@/services/learning-constitution";
import type { ConflictRecord } from "@/types/learning-constitution";

const scope = { type: "PROJECT", id: "noesis" } as const;
const axis = { existing: "", candidate: "", outcome: "UNKNOWN" as const, rationaleCode: "test" };

describe("ConflictIntegrityScanner", () => {
  it("reports unresolved conflicts without changing the ledger", async () => {
    const ledger = new InMemoryProvenanceLedger();
    const conflict: ConflictRecord = { id: "CF-open", recordType: "CONFLICT", existingKnowledgeId: "P-1", candidateKnowledgeId: "CP-1", type: "DIRECT_CONTRADICTION", scope, authorityComparison: axis, evidenceComparison: axis, confidenceComparison: axis, provenanceRefs: [], resolutionReasoning: "contradiction", status: "AWAITING_APPROVAL", createdAt: "2026-08-23T00:00:00.000Z", immutable: true };
    await ledger.append(conflict);
    const report = await new ConflictIntegrityScanner(ledger, () => "2026-08-23T02:00:00.000Z").scan();
    expect(report).toMatchObject({ valid: false, persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false });
    expect(report.findings).toContainEqual(expect.objectContaining({ code: "CONFLICT_MISSING_FINAL_RESOLUTION", conflictId: "CF-open" }));
    expect((await ledger.getAll())).toHaveLength(1);
  });

  it("detects superseded knowledge incorrectly retained as active", async () => {
    const ledger = new InMemoryProvenanceLedger();
    const durable = (id: string) => ({ id, recordType: "DURABLE_KNOWLEDGE" as const, statement: id, classification: "PRINCIPLE" as const, scope, authority: "HUMAN", candidateId: `CP-${id}`, approvalId: `HA-${id}`, evidenceRefs: [], status: "ACTIVE" as const, createdAt: "2026-08-23T00:00:00.000Z", immutable: true as const });
    await ledger.append(durable("P-old")); await ledger.append(durable("P-new"));
    await ledger.relate({ id: "superseded", fromId: "P-old", toId: "P-new", type: "SUPERSEDED_BY", actor: { actorId: "user:owner", actorType: "HUMAN" }, createdAt: "2026-08-23T00:00:00.000Z", immutable: true });
    const report = await new ConflictIntegrityScanner(ledger).scan();
    expect(report.findings).toContainEqual(expect.objectContaining({ code: "SUPERSEDED_KNOWLEDGE_STILL_CURRENT", knowledgeId: "P-old" }));
  });
});
