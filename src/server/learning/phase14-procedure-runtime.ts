import { ConservativeProcedureCompletenessValidator, InMemoryProcedureExecutionLedger, InMemoryProcedureHumanReviewRepository, InMemoryProcedureRegistry, PrismaLearningAuditLedger, PrismaProcedureArtifactRepository, ProcedureCandidateService, ProcedureExecutionLifecycleService, ProcedureHumanReviewService, ProcedureRegistryService, ProcedureSimulationService } from "@/services/learning-constitution";

/** Workspace-scoped composition root for durable Phase 14 procedure artifacts and audit evidence. */
export function createPhase14ProcedureRuntime(workspaceId: string) {
  const artifacts = new PrismaProcedureArtifactRepository(workspaceId); const audit = new PrismaLearningAuditLedger(workspaceId);
  return { artifacts, candidates: new ProcedureCandidateService(new ConservativeProcedureCompletenessValidator(), audit, artifacts), reviews: new ProcedureHumanReviewService(new InMemoryProcedureHumanReviewRepository(), audit, artifacts), registry: new ProcedureRegistryService(new InMemoryProcedureRegistry(), audit, artifacts), simulation: new ProcedureSimulationService(audit, artifacts), execution: new ProcedureExecutionLifecycleService(new InMemoryProcedureExecutionLedger(), audit, artifacts) };
}

