import { describe, expect, it } from "vitest";

import { AuditIntegrityVerifier, InMemoryKnowledgeAuditLedger } from "@/services/learning-constitution";
import type { AuditIntegrityEntry, KnowledgeAdmittedAuditEvent, KnowledgeAuditEvent, KnowledgeAuditLedger } from "@/types/learning-constitution";

const provenance = {
  observationId: "observation-001", sourceId: "interaction-001", sourceType: "OPERATOR_STATEMENT" as const,
  originatingActorId: "operator-001", observedAt: "2026-08-01T00:00:00.000Z",
};
const admitted = (eventId: string): KnowledgeAdmittedAuditEvent => ({
  eventId, eventType: "KNOWLEDGE_ADMITTED", knowledgeId: "knowledge-001", candidateId: "candidate-001", occurredAt: "2026-08-01T00:00:00.000Z",
  decisionReasonCode: "ACCEPTED_FOR_ADMISSION", policyVersion: "1.0.0", constitutionVersion: "1.0.0", provenance,
});

const ledgerWith = (events: readonly KnowledgeAuditEvent[], entries: readonly AuditIntegrityEntry[]): KnowledgeAuditLedger => ({
  append: async <T extends KnowledgeAuditEvent>(event: T) => event,
  findByKnowledgeId: async () => events,
  findAll: async () => events,
  findIntegrityEntries: async () => entries,
});

describe("audit integrity verification", () => {
  it("validates an append-only deterministic chain without mutating audit history", async () => {
    const ledger = new InMemoryKnowledgeAuditLedger();
    await ledger.append(admitted("event-001"));
    await ledger.append({ ...admitted("event-002"), occurredAt: "2026-08-02T00:00:00.000Z" });
    const verifier = new AuditIntegrityVerifier(ledger);
    const result = await verifier.verify({ auditKey: "knowledge-001" });
    expect(result).toMatchObject({ status: "VALID", verifiedEntryCount: 2, persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false });
    expect((await ledger.findIntegrityEntries("knowledge-001"))).toHaveLength(2);
  });

  it("detects hash mismatch, missing events, and broken predecessor chains", async () => {
    const original = new InMemoryKnowledgeAuditLedger();
    await original.append(admitted("event-001"));
    const [entry] = await original.findIntegrityEntries("knowledge-001");
    const event = admitted("event-001");
    const mismatch = await new AuditIntegrityVerifier(ledgerWith([{ ...event, candidateId: "tampered" }], [entry])).verify({ auditKey: "knowledge-001" });
    const missing = await new AuditIntegrityVerifier(ledgerWith([], [entry])).verify({ auditKey: "knowledge-001" });
    const broken = await new AuditIntegrityVerifier(ledgerWith([event], [{ ...entry, previousHash: "not-the-root" }])).verify({ auditKey: "knowledge-001" });
    expect(mismatch).toMatchObject({ status: "HASH_MISMATCH", brokenEventId: "event-001" });
    expect(missing).toMatchObject({ status: "EVENT_MISSING", brokenEventId: "event-001" });
    expect(broken).toMatchObject({ status: "CHAIN_BROKEN", brokenEventId: "event-001" });
  });

  it("keeps unrelated audit keys in independent chains and reports empty history", async () => {
    const ledger = new InMemoryKnowledgeAuditLedger();
    await ledger.append(admitted("event-001"));
    await ledger.append({ ...admitted("event-policy"), knowledgeId: "knowledge-002" });
    const verifier = new AuditIntegrityVerifier(ledger);
    expect(await verifier.verify({ auditKey: "knowledge-002" })).toMatchObject({ status: "VALID", verifiedEntryCount: 1 });
    expect(await verifier.verify({ auditKey: "missing" })).toMatchObject({ status: "INSUFFICIENT_HISTORY", verifiedEntryCount: 0 });
  });
});
