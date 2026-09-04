import { describe, expect, it } from "vitest";

import { ConflictResolutionDecisionService, ConflictResolutionExecutor, ConflictWorkflowService, DeterministicConflictResolutionPlanner, InMemoryProvenanceLedger, ProvenanceQueryService } from "@/services/learning-constitution";
import type { ConflictDimensionComparisons, ConflictRecord, DurableProvenancedKnowledge } from "@/types/learning-constitution";

const human = { actorId: "user:owner", actorType: "HUMAN" as const };
const agent = { actorId: "agent:noesis", actorType: "AGENT" as const };
const projectScope = { type: "PROJECT", id: "noesis" } as const;
const dimensions: ConflictDimensionComparisons = {
  scope: { existing: "project", candidate: "project", outcome: "EQUIVALENT", rationaleCode: "SAME_SCOPE" },
  authority: { existing: "human", candidate: "human", outcome: "EQUIVALENT", rationaleCode: "HUMAN_DECISION" },
  evidence: { existing: "source", candidate: "correction", outcome: "CANDIDATE_STRONGER", rationaleCode: "NEW_CORRECTION" },
  confidence: { existing: "0.9", candidate: "0.9", outcome: "EQUIVALENT", rationaleCode: "EQUAL" },
  temporal: { existing: "before", candidate: "after", outcome: "CANDIDATE_STRONGER", rationaleCode: "LATER" },
  persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false,
};
const durable = (id: string, statement: string, classification: DurableProvenancedKnowledge["classification"] = "PRINCIPLE", scope = projectScope): DurableProvenancedKnowledge => ({ id, recordType: "DURABLE_KNOWLEDGE", statement, classification, scope, authority: "HUMAN_DIRECTIVE", candidateId: `CP-${id}`, approvalId: `HA-${id}`, evidenceRefs: [], status: "ACTIVE", createdAt: "2026-08-23T00:00:00.000Z", immutable: true });
const conflict = (id: string, existingKnowledgeId: string, candidateKnowledgeId: string, type: ConflictRecord["type"]): ConflictRecord => ({ id, recordType: "CONFLICT", existingKnowledgeId, candidateKnowledgeId, type, scope: projectScope, authorityComparison: dimensions.authority, evidenceComparison: dimensions.evidence, confidenceComparison: dimensions.confidence, provenanceRefs: [], resolutionReasoning: type, status: "AWAITING_APPROVAL", createdAt: "2026-08-23T00:00:00.000Z", immutable: true });

describe("Phase 8 acceptance scenarios", () => {
  it("A: preserves correction lineage through a human-approved supersession", async () => {
    const ledger = new InMemoryProvenanceLedger(); const prior = durable("R-10", "Use port 8000."); const successor = durable("R-11", "Use port 8080."); const item = conflict("CF-correction", prior.id, successor.id, "CORRECTION_CONFLICT");
    await ledger.append(prior); await ledger.append(successor); await ledger.append(item);
    const proposal = new DeterministicConflictResolutionPlanner(() => "RP-correction", () => "2026-08-23T01:00:00.000Z").plan(item, dimensions, agent); await ledger.append(proposal);
    const decision = await new ConflictResolutionDecisionService(ledger, () => "CRD-correction", (part) => `decision:${part}`, () => "2026-08-23T01:00:00.000Z").decide({ conflictId: item.id, proposalId: proposal.id, acceptedOutcome: "SUPERSEDE", decisionMaker: human, decisionAuthority: "HUMAN_CORRECTION", decisionReason: "Port corrected." });
    const executed = await new ConflictResolutionExecutor(ledger, () => "CR-correction", (part) => `execution:${part}`, () => "2026-08-23T01:00:00.000Z").execute(decision!.id);
    expect(executed).toMatchObject({ status: "EXECUTED", resolution: { resolutionType: "SUPERSEDE" } });
    expect((await new ProvenanceQueryService(ledger).getKnowledgeState(prior.id))?.current).toBe(false);
  });

  it("C: creates a bounded exception without altering the general rule", async () => {
    const ledger = new InMemoryProvenanceLedger(); const rule = durable("R-delete", "Always request approval before deletion."); const exception = durable("EXC-cache", "Temporary caches may be automatically cleared.", "EXCEPTION"); const item = conflict("CF-exception", rule.id, exception.id, "EXCEPTION_CONFLICT");
    await ledger.append(rule); await ledger.append(exception); await ledger.append(item);
    const proposal = new DeterministicConflictResolutionPlanner(() => "RP-exception").plan(item, dimensions, agent); await ledger.append(proposal);
    const decision = await new ConflictResolutionDecisionService(ledger, () => "CRD-exception", (part) => `decision:${part}`).decide({ conflictId: item.id, proposalId: proposal.id, acceptedOutcome: "CREATE_EXCEPTION", decisionMaker: human, decisionAuthority: "HUMAN_DECISION", decisionReason: "Bounded cache exception.", executionPlan: { exceptionApplicabilityCondition: "Only temporary caches." } });
    expect(await new ConflictResolutionExecutor(ledger, () => "CR-exception", (part) => `execution:${part}`).execute(decision!.id)).toMatchObject({ status: "EXECUTED", resolution: { resolutionType: "CREATE_EXCEPTION" } });
    expect((await ledger.getRelationships(exception.id)).some((link) => link.type === "EXCEPTION_OF" && link.toId === rule.id)).toBe(true);
    expect((await new ProvenanceQueryService(ledger).getKnowledgeState(rule.id))?.current).toBe(true);
  });

  it("F: preserves uncertainty by escalating an evidence conflict rather than inventing a winner", async () => {
    const ledger = new InMemoryProvenanceLedger(); const item = conflict("CF-evidence", "F-march", "F-april", "EVIDENCE_COLLISION"); await ledger.append(item);
    const escalation = await new ConflictWorkflowService(ledger, () => "CE-evidence", (part) => `workflow:${part}`).escalate({ conflictId: item.id, reason: "Two credible sources disagree.", targetAuthority: "HUMAN_OWNER", escalatedBy: agent });
    expect(escalation).toMatchObject({ recordType: "CONFLICT_ESCALATION", conflictId: item.id });
    expect(await ledger.get(item.id)).toEqual(item);
  });
});
