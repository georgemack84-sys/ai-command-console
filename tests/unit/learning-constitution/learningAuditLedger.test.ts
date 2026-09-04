import { describe, expect, it } from "vitest";

import { AuditLedgerVerifier, InMemoryLearningAuditLedger } from "@/services/learning-constitution";
import type { LearningAuditEvent } from "@/types/learning-constitution";

const event = (id: string, knowledgeId = "knowledge:1"): LearningAuditEvent => ({
  eventId: id, eventType: "DURABLE_KNOWLEDGE_COMMITTED", workspaceId: "workspace:1", occurredAt: "2026-08-31T00:00:00.000Z",
  actor: { actorId: "user:owner", actorType: "HUMAN" }, correlationId: "pipeline:1", schemaVersion: "10.0",
  references: { knowledgeIds: [knowledgeId], gateEvaluationId: "evaluation:1", provenanceIds: ["candidate:1"] }, payload: { result: "COMMITTED" },
});

describe("Phase 10 LearningAuditLedger", () => {
  it("appends immutable, causally attributable events in a workspace chain", async () => {
    const ledger = new InMemoryLearningAuditLedger();
    const first = await ledger.append(event("audit:1"));
    const second = await ledger.append({ ...event("audit:2"), causationId: "audit:1" });
    expect(second).toMatchObject({ sequence: 2, previousHash: first.eventHash });
    await expect(ledger.findByKnowledgeId("workspace:1", "knowledge:1")).resolves.toHaveLength(2);
  });

  it("is idempotent for the same immutable event and rejects an identity collision", async () => {
    const ledger = new InMemoryLearningAuditLedger();
    await ledger.append(event("audit:1"));
    await expect(ledger.append(event("audit:1"))).resolves.toMatchObject({ sequence: 1 });
    await expect(ledger.append({ ...event("audit:1"), payload: { result: "TAMPERED" } })).rejects.toThrow("collision");
  });

  it("independently detects a broken hash chain and malformed actor identity", async () => {
    const ledger = new InMemoryLearningAuditLedger();
    const first = await ledger.append(event("audit:1"));
    const invalidHash = await new AuditLedgerVerifier({ list: async () => [{ ...first, eventHash: "tampered" }] }).verify("workspace:1");
    const invalidActor = await new AuditLedgerVerifier({ list: async () => [{ ...first, event: { ...first.event, actor: { ...first.event.actor, actorId: "" } } }] }).verify("workspace:1");
    expect(invalidHash).toMatchObject({ status: "INVALID", violations: ["EVENT_HASH_MISMATCH"] });
    expect(invalidActor).toMatchObject({ status: "INVALID", violations: expect.arrayContaining(["REQUIRED_IDENTITY_MISSING", "EVENT_HASH_MISMATCH"]) });
  });

  it("accepts a persisted-ledger-compatible workspace chain", async () => {
    const ledger = new InMemoryLearningAuditLedger();
    await ledger.append(event("audit:1"));
    await ledger.append({ ...event("audit:2"), eventType: "LEARNING_GATE_EVALUATED", causationId: "audit:1" });
    await expect(new AuditLedgerVerifier(ledger).verify("workspace:1")).resolves.toMatchObject({ status: "VALID", verifiedEntryCount: 2 });
  });
});
