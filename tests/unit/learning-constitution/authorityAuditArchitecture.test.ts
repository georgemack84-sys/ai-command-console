import { describe, expect, it } from "vitest";
import { InMemoryAuthorityLedger, LedgerBackedAuthorityExplanationService } from "../../../services/learning-constitution";
import type { AuthorityLedgerEvent, AuthorityRecord } from "../../../types/learning-constitution";

const authority: AuthorityRecord = { authorityId: "authority-2", authorityType: "HUMAN_CORRECTION", authoritySource: "message:2", sourceIdentity: "user:georg", scope: { type: "PROJECT", id: "axiom" }, establishedAt: "2026-08-23T00:00:00.000Z", effectiveFrom: "2026-08-23T00:00:00.000Z", supersedes: ["authority-1"], constraints: [], provenance: { observationId: "observation-2", sourceId: "message:2", sourceType: "CONVERSATION", originatingActorId: "user:georg", observedAt: "2026-08-23T00:00:00.000Z" } };

describe("Phase 6 authority audit architecture", () => {
  it("takes immutable ledger snapshots instead of retaining caller-owned event objects", async () => {
    const ledger = new InMemoryAuthorityLedger();
    const event: AuthorityLedgerEvent = { eventId: "event-1", eventType: "AUTHORITY_ASSIGNED", authorityId: "authority-2", occurredAt: "2026-08-23T00:00:00.000Z", reason: "correction", authorityRecord: authority };
    await ledger.append(event);
    (authority.supersedes as string[]).push("mutated-after-append");
    expect((await ledger.findAll())[0].authorityRecord?.supersedes).toEqual(["authority-1"]);
    (authority.supersedes as string[]).pop();
  });
  it("explains authority, confidence, evidence, provenance, supersession, and event history read-only", async () => {
    const ledger = new InMemoryAuthorityLedger();
    await ledger.append({ eventId: "event-2", eventType: "KNOWLEDGE_SUPERSEDED", authorityId: "authority-2", relatedAuthorityId: "authority-1", occurredAt: "2026-08-23T00:00:00.000Z", reason: "correction", authorityRecord: authority });
    const explanation = await new LedgerBackedAuthorityExplanationService(ledger).explain({ authority, profile: { authority: { state: "RECORDED", record: authority }, confidence: { score: 0.72, basis: ["direct statement"] }, evidence: { items: [{ evidenceId: "evidence-1", type: "OPERATOR_STATEMENT", sourceReference: "message:2", observedAt: "2026-08-23T00:00:00.000Z", provenance: authority.provenance, supportsCandidate: true }] } } });
    expect(explanation).toMatchObject({ authority: { authorityType: "HUMAN_CORRECTION" }, confidence: { score: 0.72 }, evidenceIds: ["evidence-1"], supersedes: ["authority-1"], events: [{ eventType: "KNOWLEDGE_SUPERSEDED" }], authorityEffect: "UNCHANGED" });
  });
});
