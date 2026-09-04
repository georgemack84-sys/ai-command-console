import { describe, expect, it, vi } from "vitest";

import { DurableLearningPromotionService, InMemoryLearningAuditLedger } from "@/services/learning-constitution";
import type { DurableLearningGateRequest, GateDecision, KnowledgeAdmissionRequest } from "@/types/learning-constitution";

const provenance = { observationId: "obs-1", sourceId: "source-1", sourceType: "OPERATOR_STATEMENT" as const, originatingActorId: "user:owner", observedAt: "2026-08-31T00:00:00.000Z" };
const gateRequest = { evaluationId: "evaluation-1", candidate: { candidateId: "candidate-1", content: "Noesis uses PostgreSQL.", classification: "PROJECT_DECISION" as const, provenance }, classification: { classification: "PROJECT_DECISION" as const, confidence: 1, status: "CLASSIFIED" as const, proposedDurability: "DURABLE_CANDIDATE" as const, requiresValidation: true, provenance, reasoningMetadata: { rationaleCode: "TEST", matchedSignals: [], classifierId: "test", classifierVersion: "1" }, relationshipHints: { supersedesKnowledgeIds: [], exceptionToKnowledgeIds: [] }, persistenceEffect: "NONE" as const, authorityEffect: "UNCHANGED" as const, executionPermissionGranted: false as const }, scope: { scope: { type: "PROJECT" as const, id: "noesis" }, confidence: 1, status: "RESOLVED" as const, source: "EXPLICIT" as const, provenance, reasoningMetadata: { rationaleCode: "TEST", matchedScopeIds: [], resolverId: "test", resolverVersion: "1" }, requiresClarification: false, promotionRequested: true, persistenceEffect: "NONE" as const, authorityEffect: "UNCHANGED" as const }, authority: { decision: "ALLOW" as const, reasonCode: "AUTHORITY_ACCEPTED" as const, persistenceEffect: "NONE" as const, authorityEffect: "UNCHANGED" as const, executionPermissionGranted: false as const }, conflict: { decision: "ALLOW" as const, blockingConflictIds: [], reasonCode: "NO_BLOCKING_CONFLICT" as const, persistenceEffect: "NONE" as const, authorityEffect: "UNCHANGED" as const, executionPermissionGranted: false as const }, validation: { candidateId: "candidate-1", outcome: "VALID" as const, reasonCode: "VALIDATED" as const, applicableRules: [], evidenceIds: [], provenance, persistenceEffect: "NONE" as const, authorityEffect: "UNCHANGED" as const, executionPermissionGranted: false as const }, constitution: { disposition: "ACCEPT" as const, reason: "READY_FOR_DURABLE_ADMISSION" as const, durableAdmissionEligible: true, authorityEffect: "UNCHANGED" as const }, context: { gateVersion: "9.0.0", constitutionVersion: "1", taxonomyVersion: "1", authorityPolicyVersion: "1", validationPolicyVersion: "1", conflictEngineVersion: "8", registryVersion: "381", learningIntent: "EXPLICIT" as const, decisionActorId: "user:owner" } } satisfies DurableLearningGateRequest;
const admission = { candidate: gateRequest.candidate, classification: gateRequest.classification, scopeResolution: gateRequest.scope, conflictDetection: { candidateId: "candidate-1", existingKnowledgeId: "knowledge-1", relationship: "UNRELATED" as const, confidence: 1, status: "ASSESSED" as const, scopeCompatibility: { outcome: "COMPATIBLE" as const, reason: "EXACT_SCOPE_MATCH" as const }, provenance: { candidate: provenance, existingKnowledge: provenance }, reasoningMetadata: { rationaleCode: "TEST", matchedFields: [], detectorId: "test", detectorVersion: "1" }, requiresValidation: false, requiresClarification: false, requiresApproval: false, persistenceEffect: "NONE" as const, authorityEffect: "UNCHANGED" as const }, validation: gateRequest.validation, decision: { candidateId: "candidate-1", disposition: "ACCEPT" as const, reasonCode: "ACCEPTED_FOR_ADMISSION" as const, decisionStatus: "FINAL" as const, policyVersion: "1", constitutionVersion: "1", provenance, durableAdmissionEligible: true, persistenceEffect: "NONE" as const, authorityEffect: "UNCHANGED" as const, executionPermissionGranted: false as const } } satisfies KnowledgeAdmissionRequest;
const deferredDecision: GateDecision = { evaluationId: "evaluation-1", candidateId: "candidate-1", outcome: "DEFER", reasonCodes: ["INTENT_NOT_ESTABLISHED"], checks: [], inputFingerprint: "fingerprint", context: gateRequest.context, authorityEffect: "UNCHANGED", executionPermissionGranted: false };

describe("DurableLearningPromotionService", () => {
  it("never invokes the registry writer until the gate accepts", async () => {
    const defer = vi.fn();
    const service = new DurableLearningPromotionService({ gate: { evaluate: async () => deferredDecision }, registryWriter: { commit: async () => { throw new Error("writer must not be called"); } } as never, deferredCandidates: { defer } });
    await expect(service.promote({ gateRequest, admission })).resolves.toMatchObject({ status: "DEFERRED", persistenceEffect: "NONE" });
    expect(defer).toHaveBeenCalledWith(deferredDecision);
  });

  it("hands an accepted decision to the controlled writer", async () => {
    const accepted: GateDecision = { ...deferredDecision, outcome: "ACCEPT", reasonCodes: [], commitAuthorization: { authorizationId: "commit:evaluation-1", evaluationId: "evaluation-1", candidateId: "candidate-1", candidateFingerprint: "fingerprint", classification: "PROJECT_DECISION", scope: gateRequest.scope.scope, registryVersion: "381", gateVersion: "9.0.0" } };
    const service = new DurableLearningPromotionService({ gate: { evaluate: async () => accepted }, registryWriter: { commit: async () => ({ status: "COMMITTED", reasonCode: "DURABLE_KNOWLEDGE_COMMITTED", persistenceEffect: "CREATED", authorityEffect: "UNCHANGED", executionPermissionGranted: false }) } as never });
    await expect(service.promote({ gateRequest, admission })).resolves.toMatchObject({ status: "COMMITTED", persistenceEffect: "CREATED" });
  });

  it("fails closed before commit when the required Phase 10 gate audit cannot append", async () => {
    const writer = vi.fn();
    const service = new DurableLearningPromotionService({ gate: { evaluate: async () => ({ ...deferredDecision, outcome: "ACCEPT", commitAuthorization: { authorizationId: "commit:evaluation-1", evaluationId: "evaluation-1", candidateId: "candidate-1", candidateFingerprint: "fingerprint", classification: "PROJECT_DECISION", scope: gateRequest.scope.scope!, registryVersion: "381", gateVersion: "9.0.0" } }) }, registryWriter: { commit: writer } as never, phase10Audit: { workspaceId: "workspace-1", ledger: { append: async () => { throw new Error("offline"); }, list: async () => [], findByKnowledgeId: async () => [] } } });
    await expect(service.promote({ gateRequest, admission })).resolves.toMatchObject({ status: "DEFERRED", persistenceEffect: "NONE" });
    expect(writer).not.toHaveBeenCalled();
  });

  it("records the gate decision in the canonical Phase 10 ledger", async () => {
    const audit = new InMemoryLearningAuditLedger();
    const service = new DurableLearningPromotionService({ gate: { evaluate: async () => deferredDecision }, registryWriter: { commit: async () => { throw new Error("must not write"); } } as never, phase10Audit: { workspaceId: "workspace-1", ledger: audit } });
    await service.promote({ gateRequest, admission });
    await expect(audit.list("workspace-1")).resolves.toMatchObject([{ event: { eventType: "LEARNING_GATE_EVALUATED", references: { gateEvaluationId: "evaluation-1" }, payload: { outcome: "DEFER" } } }]);
  });
});
