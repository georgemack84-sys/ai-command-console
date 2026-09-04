import { describe, expect, it } from "vitest";
import { CanonicalAuditExplanationService, InMemoryLearningAuditLedger, LearningAuditQueryService } from "@/services/learning-constitution";
import type { LearningAuditEvent } from "@/types/learning-constitution";

const event: LearningAuditEvent = { eventId: "commit:1", eventType: "DURABLE_KNOWLEDGE_COMMITTED", workspaceId: "workspace:1", occurredAt: "2026-09-01T00:00:00.000Z", actor: { actorId: "user:owner", actorType: "HUMAN" }, correlationId: "evaluation:1", schemaVersion: "10.0", references: { knowledgeIds: ["knowledge:1"], gateEvaluationId: "evaluation:1", provenanceIds: ["candidate:1"], conflictIds: ["conflict:1"], authorityIds: ["authority:1"] }, payload: {} };

describe("Phase 10 audit query and explanation", () => {
  it("returns evidence-backed knowledge history and explanation", async () => {
    const ledger = new InMemoryLearningAuditLedger(); await ledger.append(event);
    const query = new LearningAuditQueryService(ledger);
    await expect(query.history("workspace:1", "knowledge:1")).resolves.toMatchObject({ entries: [{ event: { eventId: "commit:1" } }] });
    await expect(new CanonicalAuditExplanationService(query).explain("workspace:1", "knowledge:1")).resolves.toMatchObject({ status: "COMPLETE", actorId: "user:owner", gateEvaluationId: "evaluation:1", provenanceIds: ["candidate:1"] });
  });
  it("returns explicit incompleteness instead of fabricating missing history", async () => {
    const query = new LearningAuditQueryService(new InMemoryLearningAuditLedger());
    await expect(new CanonicalAuditExplanationService(query).explain("workspace:1", "unknown")).resolves.toMatchObject({ status: "NOT_FOUND", missing: ["AUDIT_HISTORY"] });
  });
});
