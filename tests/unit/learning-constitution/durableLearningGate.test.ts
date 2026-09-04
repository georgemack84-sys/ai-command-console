import { describe, expect, it } from "vitest";

import { ControlledRegistryWriter, FailClosedDurableLearningGate, InMemoryGateAuditLedger } from "@/services/learning-constitution";
import type { DurableLearningGateRequest, KnowledgeAdmissionRequest } from "@/types/learning-constitution";

const provenance = { observationId: "obs-1", sourceId: "source-1", sourceType: "OPERATOR_STATEMENT" as const, originatingActorId: "user:owner", observedAt: "2026-08-31T00:00:00.000Z" };
const context = { gateVersion: "9.0.0", constitutionVersion: "1.0.0", taxonomyVersion: "1.0.0", authorityPolicyVersion: "1.0.0", validationPolicyVersion: "1.0.0", conflictEngineVersion: "8.0.0", registryVersion: "381", learningIntent: "EXPLICIT" as const, decisionActorId: "user:owner" };

const request = (overrides: Partial<DurableLearningGateRequest> = {}): DurableLearningGateRequest => ({
  evaluationId: "evaluation-1",
  candidate: { candidateId: "candidate-1", content: "Noesis uses PostgreSQL.", classification: "PROJECT_DECISION", provenance },
  classification: { classification: "PROJECT_DECISION", confidence: 1, status: "CLASSIFIED", proposedDurability: "DURABLE_CANDIDATE", requiresValidation: true, provenance, reasoningMetadata: { rationaleCode: "TEST", matchedSignals: [], classifierId: "test", classifierVersion: "1" }, relationshipHints: { supersedesKnowledgeIds: [], exceptionToKnowledgeIds: [] }, persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false },
  scope: { scope: { type: "PROJECT", id: "noesis" }, confidence: 1, status: "RESOLVED", source: "EXPLICIT", provenance, reasoningMetadata: { rationaleCode: "TEST", matchedScopeIds: ["PROJECT:noesis"], resolverId: "test", resolverVersion: "1" }, requiresClarification: false, promotionRequested: true, persistenceEffect: "NONE", authorityEffect: "UNCHANGED" },
  authority: { decision: "ALLOW", reasonCode: "AUTHORITY_ACCEPTED", persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false },
  conflict: { decision: "ALLOW", blockingConflictIds: [], reasonCode: "NO_BLOCKING_CONFLICT", persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false },
  validation: { candidateId: "candidate-1", outcome: "VALID", reasonCode: "VALIDATED", applicableRules: [], evidenceIds: ["evidence-1"], provenance, persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false },
  constitution: { disposition: "ACCEPT", reason: "READY_FOR_DURABLE_ADMISSION", durableAdmissionEligible: true, authorityEffect: "UNCHANGED" },
  context,
  ...overrides,
});

describe("Durable Learning Gate", () => {
  it("authorizes only a fully evaluated candidate and records an auditable decision", async () => {
    const auditLedger = new InMemoryGateAuditLedger();
    const decision = await new FailClosedDurableLearningGate({ auditLedger, now: () => "2026-08-31T00:01:00.000Z" }).evaluate(request());

    expect(decision).toMatchObject({ outcome: "ACCEPT", candidateId: "candidate-1", authorityEffect: "UNCHANGED", executionPermissionGranted: false, commitAuthorization: { candidateId: "candidate-1", registryVersion: "381", classification: "PROJECT_DECISION" } });
    expect(decision.commitAuthorization?.candidateFingerprint).toBe(decision.inputFingerprint);
    expect(await auditLedger.findByCandidateId("candidate-1")).toHaveLength(1);
  });

  it.each([
    ["missing learning intent", request({ context: { ...context, learningIntent: "UNKNOWN" } }), "DEFER", "INTENT_NOT_ESTABLISHED"],
    ["authority denial", request({ authority: { decision: "DENY", reasonCode: "AMBIGUOUS_SOURCE", persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false } }), "REJECT", "AUTHORITY_INSUFFICIENT"],
    ["unresolved conflict", request({ conflict: { decision: "BLOCK", blockingConflictIds: ["conflict-1"], reasonCode: "UNRESOLVED_MATERIAL_CONFLICT", persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false } }), "DEFER", "CONFLICT_UNRESOLVED"],
    ["constitutional veto", request({ constitution: { disposition: "REJECT", reason: "CONSTITUTIONAL_CONFLICT", durableAdmissionEligible: false, authorityEffect: "UNCHANGED" } }), "REJECT", "CONSTITUTIONAL_VETO"],
  ] as const)("fails closed for %s", async (_name, input, outcome, reason) => {
    const decision = await new FailClosedDurableLearningGate({ auditLedger: new InMemoryGateAuditLedger() }).evaluate(input);
    expect(decision.outcome).toBe(outcome);
    expect(decision.reasonCodes).toContain(reason);
    expect(decision.commitAuthorization).toBeUndefined();
  });

  it("defers when an audit decision cannot be persisted", async () => {
    const decision = await new FailClosedDurableLearningGate({ auditLedger: { append: async () => { throw new Error("offline"); }, findByCandidateId: async () => [] } }).evaluate(request());
    expect(decision).toMatchObject({ outcome: "DEFER", reasonCodes: expect.arrayContaining(["AUDIT_PERSISTENCE_FAILED"]) });
    expect(decision.commitAuthorization).toBeUndefined();
  });

  it("requires passing teach-back evidence when policy marks the lesson significant", async () => {
    const gate = new FailClosedDurableLearningGate({ auditLedger: new InMemoryGateAuditLedger() });
    await expect(gate.evaluate(request({ context: { ...context, teachBack: { requirement: "REQUIRED" } } }))).resolves.toMatchObject({ outcome: "DEFER", reasonCodes: expect.arrayContaining(["TEACH_BACK_REQUIRED"]) });
    await expect(gate.evaluate(request({ evaluationId: "evaluation-teach-back", context: { ...context, teachBack: { requirement: "REQUIRED", outcome: "PASS" } } }))).resolves.toMatchObject({ outcome: "ACCEPT" });
  });

  it("rejects a commit authorization if the registry changed after evaluation", async () => {
    const gateRequest = request();
    const decision = await new FailClosedDurableLearningGate({ auditLedger: new InMemoryGateAuditLedger() }).evaluate(gateRequest);
    const admission = {
      candidate: gateRequest.candidate,
      classification: gateRequest.classification,
      scopeResolution: gateRequest.scope,
      conflictDetection: { candidateId: "candidate-1", existingKnowledgeId: "knowledge-1", relationship: "UNRELATED", confidence: 1, status: "ASSESSED", scopeCompatibility: { outcome: "COMPATIBLE", reason: "EXACT_SCOPE_MATCH" }, provenance: { candidate: provenance, existingKnowledge: provenance }, reasoningMetadata: { rationaleCode: "TEST", matchedFields: [], detectorId: "test", detectorVersion: "1" }, requiresValidation: false, requiresClarification: false, requiresApproval: false, persistenceEffect: "NONE", authorityEffect: "UNCHANGED" },
      validation: gateRequest.validation,
      decision: { candidateId: "candidate-1", disposition: "ACCEPT", reasonCode: "ACCEPTED_FOR_ADMISSION", decisionStatus: "FINAL", policyVersion: "1", constitutionVersion: "1", provenance, durableAdmissionEligible: true, persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false },
    } satisfies KnowledgeAdmissionRequest;
    const writer = new ControlledRegistryWriter({ registryVersion: { currentVersion: async () => "382" }, knowledgeAdmission: { admit: async () => { throw new Error("must not write"); } } });

    await expect(writer.commit({ gateRequest, decision, admission })).resolves.toMatchObject({ status: "RE_EVALUATION_REQUIRED", reasonCode: "REGISTRY_VERSION_CHANGED" });
  });
});
