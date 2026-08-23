import { describe, expect, it } from "vitest";

import {
  InMemoryKnowledgeAuditLedger,
  InMemoryKnowledgeRepository,
  KnowledgeExceptionRegistrationService,
  KnowledgeRetrievalService,
  KnowledgeSupersessionService,
} from "@/services/learning-constitution";
import type { ConflictDetectionResult, DurableKnowledgeRecord } from "@/types/learning-constitution";

const provenance = {
  observationId: "observation-001", sourceId: "interaction-001", sourceType: "OPERATOR_STATEMENT" as const,
  originatingActorId: "operator-001", observedAt: "2026-08-20T12:00:00.000Z",
};
const alphaScope = { type: "PROJECT", id: "project-alpha" } as const;
const betaScope = { type: "PROJECT", id: "project-beta" } as const;

const record = (id: string, candidateId: string, overrides: Partial<DurableKnowledgeRecord> = {}): DurableKnowledgeRecord => ({
  knowledgeId: id, candidateId, content: "Deploy changes after peer review.", classification: "PROCEDURE",
  scope: alphaScope, lifecycleState: "ACTIVE", createdAt: provenance.observedAt, effectiveFrom: provenance.observedAt,
  provenance,
  lineage: {
    candidateId, observationId: provenance.observationId, classificationRationaleCode: "TEST",
    scopeRationaleCode: "TEST", conflictRelationship: "UNRELATED", validationOutcome: "VALID",
    decisionReasonCode: "ACCEPTED_FOR_ADMISSION",
  },
  policyVersion: "1.0.0", constitutionVersion: "1.0.0", ...overrides,
});

const exceptionConflict = (): ConflictDetectionResult => ({
  candidateId: "candidate-exception", existingKnowledgeId: "knowledge-base", relationship: "CREATES_EXCEPTION",
  exceptionTargetKnowledgeId: "knowledge-base", confidence: 1, status: "ASSESSED",
  scopeCompatibility: { outcome: "COMPATIBLE", reason: "EXACT_SCOPE_MATCH" },
  provenance: { candidate: provenance, existingKnowledge: provenance },
  reasoningMetadata: { rationaleCode: "TEST", matchedFields: [], detectorId: "test", detectorVersion: "1" },
  requiresValidation: false, requiresClarification: false, requiresApproval: false,
  persistenceEffect: "NONE", authorityEffect: "UNCHANGED",
});

const seedBaseAndException = async (repository: InMemoryKnowledgeRepository) => {
  await repository.create(record("knowledge-base", "candidate-base"));
  await repository.create(record("knowledge-exception", "candidate-exception", {
    content: "Emergency remediation may proceed before peer review.", classification: "EXCEPTION",
    lineage: { ...record("unused", "candidate-exception").lineage, conflictRelationship: "CREATES_EXCEPTION" },
  }));
  await new KnowledgeExceptionRegistrationService({ repository, auditLedger: new InMemoryKnowledgeAuditLedger() }).register({
    baseKnowledgeId: "knowledge-base", exceptionKnowledgeId: "knowledge-exception",
    applicabilityCondition: "verified production incident", reason: "test", conflictDetection: exceptionConflict(),
  });
};

describe("governed knowledge retrieval", () => {
  it("returns active scoped knowledge without granting authority", async () => {
    const repository = new InMemoryKnowledgeRepository();
    await repository.create(record("knowledge-base", "candidate-base"));

    const result = await new KnowledgeRetrievalService({ repository }).retrieve({
      scope: alphaScope, knowledgeId: "knowledge-base",
    });

    expect(result).toMatchObject({
      status: "APPLICABLE", reasonCode: "ACTIVE_KNOWLEDGE_APPLIES",
      applicableKnowledge: { knowledgeId: "knowledge-base" },
      authorityEffect: "UNCHANGED", executionPermissionGranted: false,
    });
  });

  it("excludes superseded knowledge from normal retrieval while retaining it in the repository", async () => {
    const repository = new InMemoryKnowledgeRepository();
    await repository.create(record("knowledge-prior", "candidate-prior"));
    await repository.create(record("knowledge-replacement", "candidate-replacement", {
      classification: "CORRECTION",
      lineage: { ...record("unused", "candidate-replacement").lineage, conflictRelationship: "CORRECTS" },
    }));
    const correctionConflict: ConflictDetectionResult = {
      ...exceptionConflict(), candidateId: "candidate-replacement", existingKnowledgeId: "knowledge-prior",
      relationship: "CORRECTS", correctionTargetKnowledgeId: "knowledge-prior", exceptionTargetKnowledgeId: undefined,
    };
    await new KnowledgeSupersessionService({ repository, auditLedger: new InMemoryKnowledgeAuditLedger() }).supersede({
      priorKnowledgeId: "knowledge-prior", replacementKnowledgeId: "knowledge-replacement", reason: "test",
      conflictDetection: correctionConflict,
    });

    const result = await new KnowledgeRetrievalService({ repository }).retrieve({
      scope: alphaScope, knowledgeId: "knowledge-prior",
    });
    expect(result).toMatchObject({ status: "NOT_FOUND", reasonCode: "KNOWLEDGE_NOT_ACTIVE" });
    expect(await repository.getById("knowledge-prior")).toMatchObject({ lifecycleState: "SUPERSEDED" });
  });

  it("applies a matching active exception and otherwise returns its base knowledge", async () => {
    const repository = new InMemoryKnowledgeRepository();
    await seedBaseAndException(repository);
    const service = new KnowledgeRetrievalService({ repository });

    const matching = await service.retrieve({
      scope: alphaScope, knowledgeId: "knowledge-base", contextFacts: ["verified production incident"],
    });
    const unmatched = await service.retrieve({
      scope: alphaScope, knowledgeId: "knowledge-base", contextFacts: ["scheduled maintenance"],
    });

    expect(matching).toMatchObject({
      status: "APPLICABLE", reasonCode: "ACTIVE_EXCEPTION_APPLIES",
      applicableKnowledge: { knowledgeId: "knowledge-exception" },
    });
    expect(unmatched).toMatchObject({
      status: "APPLICABLE", reasonCode: "ACTIVE_KNOWLEDGE_APPLIES",
      applicableKnowledge: { knowledgeId: "knowledge-base" },
    });
  });

  it("fails closed when an exception exists but its required context is absent", async () => {
    const repository = new InMemoryKnowledgeRepository();
    await seedBaseAndException(repository);

    const result = await new KnowledgeRetrievalService({ repository }).retrieve({
      scope: alphaScope, knowledgeId: "knowledge-base",
    });

    expect(result).toMatchObject({ status: "INSUFFICIENT_CONTEXT", reasonCode: "EXCEPTION_CONTEXT_REQUIRED" });
  });

  it("isolates scope and reports unqualified multiple matches as ambiguous", async () => {
    const repository = new InMemoryKnowledgeRepository();
    await repository.create(record("knowledge-alpha-one", "candidate-alpha-one"));
    await repository.create(record("knowledge-alpha-two", "candidate-alpha-two", { content: "Deploy after independent review." }));
    await repository.create(record("knowledge-beta", "candidate-beta", { scope: betaScope }));
    const service = new KnowledgeRetrievalService({ repository });

    const ambiguous = await service.retrieve({ scope: alphaScope });
    const outOfScope = await service.retrieve({ scope: betaScope, knowledgeId: "knowledge-alpha-one" });

    expect(ambiguous).toMatchObject({ status: "AMBIGUOUS", reasonCode: "QUERY_AMBIGUOUS" });
    expect(outOfScope).toMatchObject({ status: "OUT_OF_SCOPE", reasonCode: "KNOWLEDGE_OUT_OF_SCOPE" });
  });
});
