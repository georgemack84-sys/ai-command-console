import { describe, expect, it } from "vitest";

import { FailClosedDurableLearningGate, GateReplayService, InMemoryGateAuditLedger } from "@/services/learning-constitution";
import type { DurableLearningGateRequest } from "@/types/learning-constitution";

const provenance = { observationId: "obs-1", sourceId: "source-1", sourceType: "OPERATOR_STATEMENT" as const, originatingActorId: "user:owner", observedAt: "2026-08-31T00:00:00.000Z" };
const request: DurableLearningGateRequest = { evaluationId: "evaluation-1", candidate: { candidateId: "candidate-1", content: "Noesis uses PostgreSQL.", classification: "PROJECT_DECISION", provenance }, classification: { classification: "PROJECT_DECISION", confidence: 1, status: "CLASSIFIED", proposedDurability: "DURABLE_CANDIDATE", requiresValidation: true, provenance, reasoningMetadata: { rationaleCode: "TEST", matchedSignals: [], classifierId: "test", classifierVersion: "1" }, relationshipHints: { supersedesKnowledgeIds: [], exceptionToKnowledgeIds: [] }, persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false }, scope: { scope: { type: "PROJECT", id: "noesis" }, confidence: 1, status: "RESOLVED", source: "EXPLICIT", provenance, reasoningMetadata: { rationaleCode: "TEST", matchedScopeIds: [], resolverId: "test", resolverVersion: "1" }, requiresClarification: false, promotionRequested: false, persistenceEffect: "NONE", authorityEffect: "UNCHANGED" }, authority: { decision: "ALLOW", reasonCode: "AUTHORITY_ACCEPTED", persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false }, conflict: { decision: "ALLOW", blockingConflictIds: [], reasonCode: "NO_BLOCKING_CONFLICT", persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false }, validation: { candidateId: "candidate-1", outcome: "VALID", reasonCode: "VALIDATED", applicableRules: [], evidenceIds: [], provenance, persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false }, constitution: { disposition: "ACCEPT", reason: "READY_FOR_DURABLE_ADMISSION", durableAdmissionEligible: true, authorityEffect: "UNCHANGED" }, context: { gateVersion: "9", constitutionVersion: "1", taxonomyVersion: "1", authorityPolicyVersion: "1", validationPolicyVersion: "1", conflictEngineVersion: "8", registryVersion: "1", learningIntent: "EXPLICIT", decisionActorId: "user:owner" } };

describe("GateReplayService", () => {
  it("reproduces a recorded evaluation using its captured request", async () => {
    const auditLedger = new InMemoryGateAuditLedger();
    const gate = new FailClosedDurableLearningGate({ auditLedger });
    await gate.evaluate(request);
    await expect(new GateReplayService({ auditLedger, gate }).replay("candidate-1", "evaluation-1")).resolves.toMatchObject({ status: "REPRODUCIBLE", differences: [] });
  });
});
