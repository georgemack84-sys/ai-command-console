import {
  ConflictAdmissionGate,
  CanonicalLearningIntegrityFailureRecorder,
  ConservativeInformationClassifier,
  ConservativeKnowledgeScopeResolver,
  ConservativeKnowledgeValidator,
  ConservativeLearningDecisionEngine,
  DeferredCandidateLifecycleService,
  DeferredCandidateResolutionService,
  FailClosedAuthorityGate,
  FailClosedDurableLearningGate,
  PrismaAuthorityBindingRepository,
  PrismaDeferredCandidateRegistry,
  PrismaDeferredCandidateResolutionLedger,
  PrismaDurableRegistryWriter,
  PrismaGateAuditLedger,
  PrismaLearningAuditLedger,
  PrismaRegistryVersionProvider,
  PrismaProvenanceLedger,
  PromotionConflictAnalysisService,
  ProvenanceReevaluationInputProvider,
  ScopeBoundAuthorityBoundaryEvaluator,
  DurableLearningPromotionService,
  DeterministicTeachBackPolicy,
  GateReplayService,
  PrismaTeachBackRepository,
  TeachBackEvidenceResolver,
} from "@/services/learning-constitution";
import type { AuthorityGateResult, ConflictDetectionResult } from "@/types/learning-constitution";

const authorityReview = (): AuthorityGateResult => ({ decision: "REVIEW", reasonCode: "UNKNOWN_AUTHORITY", persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false });

/** Workspace-scoped composition root for the Phase 9 learning path. */
export function createPhase9DurableLearningRuntime(workspaceId: string) {
  const provenance = new PrismaProvenanceLedger(workspaceId);
  const deferredCandidates = new PrismaDeferredCandidateRegistry(workspaceId);
  const resolutionLedger = new PrismaDeferredCandidateResolutionLedger(workspaceId);
  const authorityBindings = new PrismaAuthorityBindingRepository();
  const teachBackEvidence = new TeachBackEvidenceResolver(new PrismaTeachBackRepository(workspaceId));
  const phase10Audit = new PrismaLearningAuditLedger(workspaceId);
  const authorityGate = new FailClosedAuthorityGate();
  const conflictGate = new ConflictAdmissionGate(provenance);
  const provider = new ProvenanceReevaluationInputProvider({
    ledger: provenance,
    classifier: new ConservativeInformationClassifier(),
    scopeResolver: new ConservativeKnowledgeScopeResolver(),
    authorityEvaluator: async ({ candidate, scope }) => {
      if (!scope.scope) return authorityReview();
      const authorityRecord = await authorityBindings.find(workspaceId, candidate.authority);
      if (!authorityRecord) return authorityReview();
      return authorityGate.evaluate({
        resolution: { status: "CANDIDATE_ASSIGNED", reasonCode: "HUMAN_DECISION_IDENTIFIED", authorityType: authorityRecord.authorityType, source: { sourceClass: "HUMAN", sourceIdentity: authorityRecord.sourceIdentity, sourceReference: authorityRecord.authoritySource }, persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false },
        authorityRecord,
        boundary: new ScopeBoundAuthorityBoundaryEvaluator().evaluate({ authority: authorityRecord, subjectScope: scope.scope }),
        conflict: { outcome: "NO_CONFLICT", reasonCode: "KNOWLEDGE_COMPATIBLE", persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false },
        delegationValid: true,
      });
    },
    conflictEvaluator: async ({ candidate, scope, provenance: candidateProvenance }) => {
      await new PromotionConflictAnalysisService(provenance).analyze(candidate.id, { actorId: "agent:noesis", actorType: "AGENT" });
      const assessment = await conflictGate.evaluate(candidate.id);
      const blocked = assessment.decision === "BLOCK";
      return {
        candidateId: candidate.id,
        existingKnowledgeId: assessment.blockingConflictIds[0] ?? "none",
        relationship: blocked ? "UNCERTAIN" : "UNRELATED",
        confidence: blocked ? 0 : 1,
        status: blocked ? "UNCERTAIN" : "ASSESSED",
        scopeCompatibility: { outcome: "COMPATIBLE", reason: "EXACT_SCOPE_MATCH" },
        provenance: { candidate: candidateProvenance, existingKnowledge: candidateProvenance },
        reasoningMetadata: { rationaleCode: blocked ? "UNRESOLVED_PHASE_8_CONFLICT" : "PHASE_8_CONFLICT_ANALYSIS_COMPLETE", matchedFields: [], detectorId: "phase-8-conflict-admission", detectorVersion: "8.0.0" },
        requiresValidation: blocked,
        requiresClarification: blocked,
        requiresApproval: blocked,
        persistenceEffect: "NONE",
        authorityEffect: "UNCHANGED",
      } satisfies ConflictDetectionResult;
    },
    validator: new ConservativeKnowledgeValidator(),
    decisionEngine: new ConservativeLearningDecisionEngine(),
    resolveIntent: ({ source, resolution }) => source.sourceType === "HUMAN_ENTRY" && resolution.kind === "APPROVAL" ? "APPROVED" : "UNKNOWN",
    versions: { gateVersion: "9.0.0", constitutionVersion: "1.0.0", taxonomyVersion: "1.0.0", authorityPolicyVersion: "6.0.0", validationPolicyVersion: "1.0.0", conflictEngineVersion: "8.0.0" },
    registryVersion: () => new PrismaRegistryVersionProvider(workspaceId).currentVersion(),
    teachBack: { requirement: (classification, scope) => new DeterministicTeachBackPolicy().evaluate({ classification, scope }), latestOutcome: (candidateId) => teachBackEvidence.latestOutcome(candidateId) },
  });
  let lifecycle: DeferredCandidateLifecycleService | undefined;
  const promotion = new DurableLearningPromotionService({
    gate: new FailClosedDurableLearningGate({ auditLedger: new PrismaGateAuditLedger(workspaceId) }),
    registryWriter: new PrismaDurableRegistryWriter(workspaceId),
    phase10Audit: { ledger: phase10Audit, workspaceId, actor: { actorId: "agent:noesis", actorType: "SYSTEM" } },
    deferredCandidates: { defer: async (decision) => lifecycle?.defer(decision) },
  });
  lifecycle = new DeferredCandidateLifecycleService({ registry: deferredCandidates, promotion });
  return {
    deferredCandidates,
    resolutionLedger,
    replay: new GateReplayService({ gate: new FailClosedDurableLearningGate({ auditLedger: new PrismaGateAuditLedger(workspaceId) }), auditLedger: new PrismaGateAuditLedger(workspaceId), failureRecorder: new CanonicalLearningIntegrityFailureRecorder(phase10Audit), workspaceId }),
    promotion,
    lifecycle,
    resolution: new DeferredCandidateResolutionService({ registry: deferredCandidates, resolutionLedger, reevaluationInputProvider: provider, lifecycle }),
  };
}

