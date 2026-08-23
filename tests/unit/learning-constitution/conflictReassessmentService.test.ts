import { describe, expect, it } from "vitest";

import { ConflictReassessmentService, InMemoryProvenanceLedger } from "@/services/learning-constitution";
import type { ConflictRecord } from "@/types/learning-constitution";

const scope = { type: "PROJECT", id: "noesis" } as const;
const axis = { existing: "", candidate: "", outcome: "UNKNOWN" as const, rationaleCode: "test" };
const conflict: ConflictRecord = { id: "CF-1", recordType: "CONFLICT", existingKnowledgeId: "P-1", candidateKnowledgeId: "CP-1", type: "EVIDENCE_COLLISION", scope, authorityComparison: axis, evidenceComparison: axis, confidenceComparison: axis, provenanceRefs: [], resolutionReasoning: "Evidence disagrees.", status: "ESCALATED", createdAt: "2026-08-23T00:00:00.000Z", immutable: true };

describe("ConflictReassessmentService", () => {
  it("records new evidence for reconsideration without altering the original conflict", async () => {
    const ledger = new InMemoryProvenanceLedger();
    await ledger.append(conflict);
    await ledger.append({ id: "EV-1", recordType: "EVIDENCE_SET", evidenceRefs: [], collectedBy: { actorId: "user:owner", actorType: "HUMAN" }, createdAt: "2026-08-23T00:00:00.000Z", immutable: true });
    const result = await new ConflictReassessmentService(ledger, () => "CRT-1", (suffix) => `relationship:${suffix}`, () => "2026-08-23T01:00:00.000Z").trigger({ conflictId: conflict.id, triggerType: "NEW_EVIDENCE", evidenceRef: "EV-1", rationale: "A new primary source is available.", triggeredBy: { actorId: "agent:noesis", actorType: "AGENT" } });
    expect(result).toMatchObject({ status: "RECORDED", trigger: { conflictId: "CF-1", triggerType: "NEW_EVIDENCE" }, persistenceEffect: "CREATED", executionPermissionGranted: false });
    expect(await ledger.get(conflict.id)).toEqual(conflict);
    expect(result.relationships.map((relationship) => relationship.type)).toEqual(["REASSESSMENT_TRIGGER_FOR", "REASSESSMENT_EVIDENCE"]);
  });
});
