import { describe, expect, it } from "vitest";

import { InMemoryProvenanceLedger, ProvenanceReevaluationInputProvider } from "@/services/learning-constitution";

const scope = { type: "PROJECT", id: "noesis" } as const;
const provenance = { observationId: "teaching:teaching-1", sourceId: "teaching-1", sourceType: "OPERATOR_STATEMENT" as const, originatingActorId: "user:owner", observedAt: "2026-08-31T00:00:00.000Z" };

describe("ProvenanceReevaluationInputProvider", () => {
  it("fails closed when the deferred candidate cannot be traced to a teaching event", async () => {
    const ledger = new InMemoryProvenanceLedger();
    await ledger.append({ id: "candidate-orphan", recordType: "CANDIDATE_KNOWLEDGE", statement: "Untraceable.", classification: "FACT", scope, authority: "VERIFIED_EXTERNAL_INFORMATION", extractionRefs: [], evidenceRefs: [], status: "VALIDATING", createdAt: provenance.observedAt, immutable: true });
    const provider = new ProvenanceReevaluationInputProvider({
      ledger,
      classifier: { classify: async () => { throw new Error("must not classify"); } },
      scopeResolver: { resolve: async () => { throw new Error("must not resolve scope"); } },
      authorityEvaluator: async () => { throw new Error("must not evaluate authority"); },
      conflictEvaluator: async () => { throw new Error("must not evaluate conflict"); },
      validator: { validate: async () => { throw new Error("must not validate"); } },
      decisionEngine: { decide: async () => { throw new Error("must not decide"); } },
      resolveIntent: () => "UNKNOWN",
      versions: { gateVersion: "9", constitutionVersion: "1", taxonomyVersion: "1", authorityPolicyVersion: "1", validationPolicyVersion: "1", conflictEngineVersion: "8" },
      registryVersion: async () => "381",
    });

    await expect(provider.build({ candidate: { deferredCandidateId: "deferred:candidate-orphan", candidateId: "candidate-orphan", lastEvaluationId: "evaluation-1", reasonCodes: ["PROVENANCE_MISSING"], status: "PENDING", createdAt: provenance.observedAt, updatedAt: provenance.observedAt }, resolution: { eventId: "resolution-orphan", candidateId: "candidate-orphan", kind: "EVIDENCE", actorId: "user:manager", summary: "Added a source.", evidenceRefs: [], occurredAt: provenance.observedAt } })).rejects.toThrow("source provenance is unavailable");
  });

  it("reconstructs a gate request from immutable candidate, extraction, and teaching-event lineage", async () => {
    const ledger = new InMemoryProvenanceLedger();
    await ledger.append({ id: "teaching-1", recordType: "TEACHING_EVENT", sourceType: "HUMAN_ENTRY", sourceActor: { actorId: "user:owner", actorType: "HUMAN" }, originalContent: "Use PostgreSQL.", receivedAt: provenance.observedAt, scopeHint: scope, immutable: true });
    await ledger.append({ id: "extraction-1", recordType: "EXTRACTION", sourceRefs: ["teaching-1"], interpretedBy: { actorId: "agent:noesis", actorType: "AGENT" }, classification: "PROJECT_DECISION", scope, interpretation: "Noesis uses PostgreSQL.", confidence: 1, createdAt: provenance.observedAt, immutable: true });
    await ledger.append({ id: "candidate-1", recordType: "CANDIDATE_KNOWLEDGE", statement: "Noesis uses PostgreSQL.", classification: "PROJECT_DECISION", scope, authority: "HUMAN_DECISION", extractionRefs: ["extraction-1"], evidenceRefs: [], status: "AWAITING_APPROVAL", createdAt: provenance.observedAt, immutable: true });
    const provider = new ProvenanceReevaluationInputProvider({
      ledger,
      classifier: { classify: async () => ({ classification: "PROJECT_DECISION", confidence: 1, status: "CLASSIFIED", proposedDurability: "DURABLE_CANDIDATE", requiresValidation: true, provenance, reasoningMetadata: { rationaleCode: "TEST", matchedSignals: [], classifierId: "test", classifierVersion: "1" }, relationshipHints: { supersedesKnowledgeIds: [], exceptionToKnowledgeIds: [] }, persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false }) },
      scopeResolver: { resolve: async () => ({ scope, confidence: 1, status: "RESOLVED", source: "EXPLICIT", provenance, reasoningMetadata: { rationaleCode: "TEST", matchedScopeIds: ["PROJECT:noesis"], resolverId: "test", resolverVersion: "1" }, requiresClarification: false, promotionRequested: false, persistenceEffect: "NONE", authorityEffect: "UNCHANGED" }) },
      authorityEvaluator: async () => ({ decision: "ALLOW", reasonCode: "AUTHORITY_ACCEPTED", persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false }),
      conflictEvaluator: async () => ({ candidateId: "candidate-1", existingKnowledgeId: "none", relationship: "UNRELATED", confidence: 1, status: "ASSESSED", scopeCompatibility: { outcome: "COMPATIBLE", reason: "EXACT_SCOPE_MATCH" }, provenance: { candidate: provenance, existingKnowledge: provenance }, reasoningMetadata: { rationaleCode: "TEST", matchedFields: [], detectorId: "test", detectorVersion: "1" }, requiresValidation: false, requiresClarification: false, requiresApproval: false, persistenceEffect: "NONE", authorityEffect: "UNCHANGED" }),
      validator: { validate: async () => ({ candidateId: "candidate-1", outcome: "VALID", reasonCode: "VALIDATED", applicableRules: [], evidenceIds: [], provenance, persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false }) },
      decisionEngine: { decide: async () => ({ candidateId: "candidate-1", disposition: "ACCEPT", reasonCode: "ACCEPTED_FOR_ADMISSION", decisionStatus: "FINAL", policyVersion: "1", constitutionVersion: "1", provenance, durableAdmissionEligible: true, persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false }) },
      resolveIntent: () => "EXPLICIT",
      versions: { gateVersion: "9", constitutionVersion: "1", taxonomyVersion: "1", authorityPolicyVersion: "1", validationPolicyVersion: "1", conflictEngineVersion: "8" },
      registryVersion: async () => "381",
    });

    const result = await provider.build({ candidate: { deferredCandidateId: "deferred:candidate-1", candidateId: "candidate-1", lastEvaluationId: "evaluation-1", reasonCodes: ["APPROVAL_REQUIRED"], status: "PENDING", createdAt: provenance.observedAt, updatedAt: provenance.observedAt }, resolution: { eventId: "resolution-1", candidateId: "candidate-1", kind: "CLARIFICATION", actorId: "user:manager", summary: "Confirmed project scope.", evidenceRefs: [], occurredAt: provenance.observedAt } });

    expect(result.gateRequest).toMatchObject({ candidate: { candidateId: "candidate-1", provenance }, context: { registryVersion: "381", learningIntent: "EXPLICIT" } });
    expect(result.admission.candidate.content).toBe("Noesis uses PostgreSQL.");
  });
});
