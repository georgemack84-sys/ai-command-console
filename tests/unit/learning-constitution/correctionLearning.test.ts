import { describe, expect, it } from "vitest";
import { ConservativeCorrectionDetector, ConservativeCorrectionErrorClassifier, ConservativeCorrectionTargetResolver, CorrectionAnalysisService, CorrectionDependencyImpactService, CorrectionExtractionService, CorrectionIntakeService, CorrectionRegressionService, CorrectionRepairPlanner, CorrectionRepairPlanningService, CorrectionRootCauseService, GatedCorrectionSupersessionService, InMemoryCorrectionRepository, InMemoryLearningAuditLedger, InMemoryProvenanceLedger } from "@/services/learning-constitution";
import type { DurableLearningGateRequest, KnowledgeAdmissionRequest } from "@/types/learning-constitution";

const actor = { actorId: "user:georg", actorType: "HUMAN" as const };
const input = { correctionId: "correction:1", sourceEventId: "message:1", sourceText: "No. That's wrong: only Axiom should use dark mode.", actor, timestamp: "2026-09-01T00:00:00.000Z", targetCandidateIds: ["knowledge:100"] };

describe("Phase 12 correction intake", () => {
  it("detects explicit and implicit correction signals but ignores ordinary teaching", () => {
    const detector = new ConservativeCorrectionDetector();
    expect(detector.detect(input)).toMatchObject({ explicitness: "EXPLICIT", processingStatus: "DETECTED", targetCandidateIds: ["knowledge:100"] });
    expect(detector.detect({ ...input, correctionId: "correction:2", sourceText: "Actually, reports means monthly reports only." })).toMatchObject({ explicitness: "IMPLICIT" });
    expect(detector.detect({ ...input, correctionId: "correction:3", sourceText: "Axiom should use dark mode." })).toBeNull();
  });
  it("persists correction intake idempotently and records the deduplication audit trail", async () => {
    const detector = new ConservativeCorrectionDetector(); const signal = detector.detect(input)!; const audit = new InMemoryLearningAuditLedger(); const service = new CorrectionIntakeService(new InMemoryCorrectionRepository(), audit);
    await expect(service.intake(signal, "workspace:1", "flow:1")).resolves.toMatchObject({ persistenceEffect: "CREATED", authorityEffect: "UNCHANGED", executionPermissionGranted: false });
    await expect(service.intake(signal, "workspace:1", "flow:1")).resolves.toMatchObject({ duplicate: true, persistenceEffect: "IDEMPOTENT_REPLAY" });
    await expect(audit.list("workspace:1")).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ event: expect.objectContaining({ eventType: "CORRECTION_DETECTED" }) }), expect.objectContaining({ event: expect.objectContaining({ eventType: "CORRECTION_DEDUPLICATED" }) })]));
  });
  it("never exposes correction intake as authorization to repair durable knowledge", async () => {
    const signal = new ConservativeCorrectionDetector().detect(input)!; const result = await new CorrectionIntakeService(new InMemoryCorrectionRepository()).intake(signal, "workspace:1", "flow:1");
    expect(result.record).toMatchObject({ status: "DETECTED", analyses: [], immutable: true });
    expect(result).not.toHaveProperty("repair");
  });
  it("resolves only clear targets and leaves ambiguous corrections unresolved", async () => {
    const resolver = new ConservativeCorrectionTargetResolver();
    expect(resolver.resolve({ correctionId: "correction:2", candidates: [{ targetId: "knowledge:100", relevance: 1, recency: 1, directReference: true, rationale: "Explicitly referenced." }], errorType: "OVERGENERALIZATION", severity: "MAJOR", rationale: "Global scope was rejected.", analyzedAt: input.timestamp })).toMatchObject({ targetResolution: "DIRECT_TARGET", targets: [{ targetId: "knowledge:100" }] });
    expect(resolver.resolve({ correctionId: "correction:3", candidates: [{ targetId: "knowledge:101", relevance: 0.6, recency: 0.4, directReference: false, rationale: "Weak context." }], rationale: "Ambiguous reply.", analyzedAt: input.timestamp })).toMatchObject({ targetResolution: "UNRESOLVED_TARGET", targets: [] });
    const audit = new InMemoryLearningAuditLedger(); const service = new CorrectionAnalysisService(resolver, audit);
    await service.analyze({ correctionId: "correction:3", candidates: [], rationale: "Ambiguous reply.", analyzedAt: input.timestamp }, "workspace:1", actor, "flow:1");
    await expect(audit.list("workspace:1")).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ event: expect.objectContaining({ eventType: "CORRECTION_TARGET_UNRESOLVED" }) }), expect.objectContaining({ event: expect.objectContaining({ eventType: "ERROR_CLASSIFIED" }) })]));
  });
  it("classifies only clear error evidence and defaults unknowns conservatively", () => {
    const classifier = new ConservativeCorrectionErrorClassifier();
    expect(classifier.classify("You're applying that too broadly to everything.")).toMatchObject({ errorType: "OVERGENERALIZATION", severity: "MAJOR" });
    expect(classifier.classify("No, that's wrong.")).toMatchObject({ errorType: "UNKNOWN_ERROR" });
  });
  it("finds provenance dependents without invalidating them", async () => {
    const provenance = new InMemoryProvenanceLedger(); const corrections = new InMemoryCorrectionRepository(); const audit = new InMemoryLearningAuditLedger();
    await new CorrectionIntakeService(corrections).intake({ ...new ConservativeCorrectionDetector().detect(input)!, correctionId: "correction:4" }, "workspace:1", "flow:1");
    await provenance.append({ id: "knowledge:100", recordType: "DURABLE_KNOWLEDGE", statement: "All projects use dark mode.", classification: "PREFERENCE", scope: { type: "GLOBAL" }, authority: "HUMAN", candidateId: "candidate:100", approvalId: "approval:100", evidenceRefs: [], status: "ACTIVE", createdAt: input.timestamp, immutable: true });
    await provenance.append({ id: "candidate:200", recordType: "CANDIDATE_KNOWLEDGE", statement: "Apply dark mode to Orion.", classification: "PREFERENCE", scope: { type: "PROJECT", projectId: "orion" }, authority: "AGENT_INFERRED", extractionRefs: [], evidenceRefs: [], status: "PROPOSED", createdAt: input.timestamp, immutable: true });
    await provenance.relate({ id: "relationship:200", fromId: "candidate:200", toId: "knowledge:100", type: "DERIVED_FROM", actor, createdAt: input.timestamp, immutable: true });
    const result = await new CorrectionDependencyImpactService(provenance, corrections, audit).analyze({ correctionId: "correction:4", targetIds: ["knowledge:100"], analyzedAt: input.timestamp }, "workspace:1", actor, "flow:1");
    expect(result).toMatchObject({ authorityEffect: "UNCHANGED", executionPermissionGranted: false, impacts: [expect.objectContaining({ affectedRecordId: "candidate:200", status: "POTENTIALLY_AFFECTED" })] });
    await expect(corrections.get("correction:4")).resolves.toMatchObject({ impacts: [expect.objectContaining({ affectedRecordId: "candidate:200", status: "POTENTIALLY_AFFECTED" })] });
    await expect(audit.list("workspace:1")).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ event: expect.objectContaining({ eventType: "DEPENDENCY_IMPACT_DETECTED" }) })]));
  });
  it("extracts a bounded correction candidate and treats generalization as discovery only", async () => {
    const repository = new InMemoryCorrectionRepository(); const audit = new InMemoryLearningAuditLedger();
    await new CorrectionIntakeService(repository).intake({ ...new ConservativeCorrectionDetector().detect(input)!, correctionId: "correction:5" }, "workspace:1", "flow:1");
    const candidate = await new CorrectionExtractionService(repository, audit).extract({ candidateId: "corrected-candidate:1", correctionId: "correction:5", targetIds: ["knowledge:100"], rejectedInterpretation: "The user wants dark mode everywhere.", correctedStatement: "Axiom should default to dark mode.", rationale: "Axiom is used as a bedside terminal.", classification: "PREFERENCE", scope: { type: "PROJECT", id: "axiom" }, nonApplicabilityBoundary: "Do not infer a theme preference for unrelated projects.", generalizationResult: "DISCOVERY_ONLY", similarKnowledgeCandidateIds: ["knowledge:201"], extractedBy: actor, extractedAt: input.timestamp }, "workspace:1", "flow:1");
    expect(candidate).toMatchObject({ status: "EXTRACTED", immutable: true, scope: { type: "PROJECT", id: "axiom" }, generalizationResult: "DISCOVERY_ONLY" });
    await expect(repository.get("correction:5")).resolves.toMatchObject({ candidates: [expect.objectContaining({ candidateId: "corrected-candidate:1" })] });
    await expect(audit.list("workspace:1")).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ event: expect.objectContaining({ eventType: "CORRECTED_KNOWLEDGE_EXTRACTED" }) }), expect.objectContaining({ event: expect.objectContaining({ eventType: "CORRECTION_GENERALIZED", payload: expect.objectContaining({ mutationAuthorized: false }) }) })]));
  });
  it("plans scope repairs for review and keeps supersession behind the durable-learning gate", async () => {
    const repository = new InMemoryCorrectionRepository(); await new CorrectionIntakeService(repository).intake({ ...new ConservativeCorrectionDetector().detect(input)!, correctionId: "correction:6" }, "workspace:1", "flow:1");
    const candidate = await new CorrectionExtractionService(repository).extract({ candidateId: "corrected-candidate:6", correctionId: "correction:6", targetIds: ["knowledge:100"], rejectedInterpretation: "A rule applies globally.", correctedStatement: "The rule applies only to Axiom.", rationale: "The correction narrows scope.", classification: "PREFERENCE", scope: { type: "PROJECT", id: "axiom" }, nonApplicabilityBoundary: "Unrelated projects are excluded.", generalizationResult: "LOCAL", similarKnowledgeCandidateIds: [], extractedBy: actor, extractedAt: input.timestamp }, "workspace:1", "flow:1");
    const plan = await new CorrectionRepairPlanningService(repository, new CorrectionRepairPlanner()).plan({ planId: "plan:6", correctionId: "correction:6", analysis: { correctionId: "correction:6", targetResolution: "DIRECT_TARGET", targets: [{ targetId: "knowledge:100", confidence: 1, rationale: "Direct." }], errorType: "OVERGENERALIZATION", severity: "MAJOR", rationale: "Scope was too broad.", analyzedAt: input.timestamp, immutable: true }, candidate, plannedAt: input.timestamp }, "workspace:1", actor, "flow:1");
    expect(plan).toMatchObject({ operation: "NARROW_SCOPE", authorization: "HUMAN_REVIEW_REQUIRED" });
    const supercedePlan = { ...plan, planId: "plan:7", operation: "SUPERSEDE" as const, authorization: "GATE_REQUIRED" as const };
    let supersessionCalled = false;
    const result = await new GatedCorrectionSupersessionService({ promote: async () => ({ status: "DEFERRED" as const }) }, { supersede: async () => { supersessionCalled = true; throw new Error("must not run"); } }).execute({ plan: supercedePlan, gateRequest: {} as DurableLearningGateRequest, admission: {} as KnowledgeAdmissionRequest, priorKnowledgeId: "knowledge:100", successorKnowledgeId: "knowledge:101", actor, reason: "Human correction.", occurredAt: input.timestamp, workspaceId: "workspace:1", correlationId: "flow:1" });
    expect(result).toMatchObject({ status: "GATE_DEFERRED", persistenceEffect: "NONE", executionPermissionGranted: false });
    expect(supersessionCalled).toBe(false);
    const audit = new InMemoryLearningAuditLedger();
    const committed = await new GatedCorrectionSupersessionService({ promote: async () => ({ status: "COMMITTED" as const }) }, { supersede: async () => ({ status: "SUPERSEDED", reasonCode: "KNOWLEDGE_SUPERSEDED", relationships: [], created: true, persistenceEffect: "CREATED", authorityEffect: "UNCHANGED", executionPermissionGranted: false }) }, audit).execute({ plan: supercedePlan, gateRequest: {} as DurableLearningGateRequest, admission: {} as KnowledgeAdmissionRequest, priorKnowledgeId: "knowledge:100", successorKnowledgeId: "knowledge:101", actor, reason: "Human correction.", occurredAt: input.timestamp, workspaceId: "workspace:1", correlationId: "flow:1" });
    expect(committed).toMatchObject({ status: "SUPERSEDED", persistenceEffect: "CREATED" });
    await expect(audit.list("workspace:1")).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ event: expect.objectContaining({ eventType: "KNOWLEDGE_SUPERSEDED", references: expect.objectContaining({ correctionIds: ["correction:6"] }) }) })]));
  });
  it("freezes regression cases before counterfactual replay and records the outcome as evidence", async () => {
    const repository = new InMemoryCorrectionRepository(); const audit = new InMemoryLearningAuditLedger();
    await new CorrectionIntakeService(repository).intake({ ...new ConservativeCorrectionDetector().detect(input)!, correctionId: "correction:7" }, "workspace:1", "flow:1");
    const service = new CorrectionRegressionService(repository, { replay: async () => ({ actualBehavior: "No dark-mode preference is applied to Orion.", outcome: "PASS" as const, findings: ["COUNTERFACTUAL_BEHAVIOR_CHANGED"] }) }, audit);
    const regressionCase = await service.createCase({ regressionCaseId: "regression:7", correctionId: "correction:7", protectsCandidateId: "corrected-candidate:7", errorType: "OVERGENERALIZATION", scenario: "Choose a theme for unrelated project Orion.", expectedBehavior: "Do not inherit Axiom's dark-mode preference.", counterexample: "Axiom itself may use dark mode.", createdAt: input.timestamp, immutable: true }, "workspace:1", actor, "flow:1");
    await expect(service.retest(regressionCase, "retest:7", input.timestamp, "workspace:1", actor, "flow:1")).resolves.toMatchObject({ outcome: "PASS", immutable: true });
    await expect(repository.get("correction:7")).resolves.toMatchObject({ regressionCases: [expect.objectContaining({ regressionCaseId: "regression:7" })], retests: [expect.objectContaining({ retestId: "retest:7", outcome: "PASS" })] });
    await expect(audit.list("workspace:1")).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ event: expect.objectContaining({ eventType: "REGRESSION_CASE_CREATED" }) }), expect.objectContaining({ event: expect.objectContaining({ eventType: "CORRECTION_RETEST_STARTED" }) }), expect.objectContaining({ event: expect.objectContaining({ eventType: "CORRECTION_RETEST_PASSED" }) })]));
  });
  it("records root causes and turns repeated error classes into non-mutating improvement candidates", async () => {
    const repository = new InMemoryCorrectionRepository(); const audit = new InMemoryLearningAuditLedger(); const intake = new CorrectionIntakeService(repository);
    for (const correctionId of ["correction:8", "correction:9"]) { await intake.intake({ ...new ConservativeCorrectionDetector().detect(input)!, correctionId }, "workspace:1", "flow:1"); await repository.appendAnalysis({ correctionId, targetResolution: "DIRECT_TARGET", targets: [{ targetId: "knowledge:100", confidence: 1, rationale: "Direct." }], errorType: "OVERGENERALIZATION", severity: "MAJOR", rationale: "Scope was too broad.", analyzedAt: input.timestamp, immutable: true }); }
    const service = new CorrectionRootCauseService(repository, audit);
    await expect(service.identify({ rootCauseId: "root:8", correctionId: "correction:8", errorType: "OVERGENERALIZATION", immediateCause: "A project preference was globalized.", deeperCause: "Scope resolution ignored an explicit project reference.", controlFailure: "The classifier did not require a boundary check.", mechanism: "SCOPE_RESOLUTION", identifiedAt: input.timestamp, immutable: true }, "workspace:1", actor, "flow:1")).resolves.toMatchObject({ mechanism: "SCOPE_RESOLUTION" });
    await expect(service.detectRecurring("OVERGENERALIZATION", 2, "improvement:1", input.timestamp, "workspace:1", actor, "flow:1")).resolves.toMatchObject({ status: "DETECTED", correctionIds: ["correction:8", "correction:9"], mutationAuthorized: false });
    await expect(audit.list("workspace:1")).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ event: expect.objectContaining({ eventType: "ROOT_CAUSE_IDENTIFIED" }) }), expect.objectContaining({ event: expect.objectContaining({ eventType: "RECURRING_FAILURE_PATTERN_DETECTED" }) }), expect.objectContaining({ event: expect.objectContaining({ eventType: "SYSTEM_IMPROVEMENT_CANDIDATE_CREATED" }) })]));
  });
});
