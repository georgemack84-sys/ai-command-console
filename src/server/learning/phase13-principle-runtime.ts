import { CandidatePrincipleService, ConservativePatternDetectionService, ConservativePatternEvaluator, PrincipleApplicationService, PrincipleHumanReviewService, PrincipleReassessmentService, PrincipleRegistryService, PrismaLearningAuditLedger, PrismaPrincipleLearningRepository } from "@/services/learning-constitution";

/** Workspace-scoped Phase 13 composition root. It uses append-only persistence for every principle artifact. */
export function createPhase13PrincipleRuntime(workspaceId: string) {
  const repository = new PrismaPrincipleLearningRepository(workspaceId); const audit = new PrismaLearningAuditLedger(workspaceId);
  return {
    repository,
    patterns: new ConservativePatternDetectionService(new ConservativePatternEvaluator(), audit, repository),
    candidates: new CandidatePrincipleService(audit, repository),
    reviews: new PrincipleHumanReviewService(repository, audit),
    registry: new PrincipleRegistryService(repository, audit),
    application: new PrincipleApplicationService(repository, audit),
    reassessment: new PrincipleReassessmentService(audit, repository),
  };
}

