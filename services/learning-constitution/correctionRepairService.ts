import type { CorrectionAnalysis, CorrectedKnowledgeCandidate, CorrectionRepairPlan, CorrectionRepository } from "../../types/learning-constitution/correctionLearning";
import type { DurableLearningGateRequest } from "../../types/learning-constitution/durableLearningGate";
import type { KnowledgeAdmissionRequest } from "../../types/learning-constitution/durableKnowledge";
import type { LearningAuditLedger } from "../../types/learning-constitution/learningAuditLedger";
import type { ProvenanceActor, ProvenanceSupersessionRequest, ProvenanceSupersessionResult } from "../../types/learning-constitution/provenance";

type PlanInput = Readonly<{ planId: string; correctionId: string; analysis: CorrectionAnalysis; candidate: CorrectedKnowledgeCandidate; plannedAt: string }>;

/** Repair authorization matrix. It plans safely; it deliberately has no durable mutation capability. */
export class CorrectionRepairPlanner {
  plan(input: PlanInput): CorrectionRepairPlan {
    const { analysis, candidate } = input;
    const unresolved = analysis.targetResolution === "UNRESOLVED_TARGET" || candidate.status !== "EXTRACTED";
    const critical = analysis.severity === "CRITICAL";
    const scopeRepair = analysis.errorType === "OVERGENERALIZATION" || analysis.errorType === "UNDERGENERALIZATION" || analysis.errorType === "SCOPE_ERROR" || analysis.errorType === "EXCEPTION_MISSED";
    const operation = unresolved ? "REQUEST_CLARIFICATION" : critical ? "ESCALATE" : scopeRepair ? "NARROW_SCOPE" : analysis.errorType === "UNKNOWN_ERROR" ? "REQUEST_CLARIFICATION" : "SUPERSEDE";
    const authorization = operation === "SUPERSEDE" ? "GATE_REQUIRED" : operation === "ESCALATE" ? "ESCALATION_REQUIRED" : operation === "REQUEST_CLARIFICATION" ? "CLARIFICATION_REQUIRED" : "HUMAN_REVIEW_REQUIRED";
    return { planId: input.planId, correctionId: input.correctionId, targetIds: candidate.targetIds, correctedCandidateId: candidate.candidateId, operation, rationale: `${analysis.rationale} Repair is constrained by correction safety policy.`, authorization, plannedAt: input.plannedAt, immutable: true };
  }
}

/** Persists an immutable repair plan and records planning, without altering any durable record. */
export class CorrectionRepairPlanningService {
  constructor(private readonly repository: CorrectionRepository, private readonly planner: CorrectionRepairPlanner, private readonly audit?: LearningAuditLedger) {}
  async plan(input: PlanInput, workspaceId: string, actor: CorrectedKnowledgeCandidate["extractedBy"], correlationId: string): Promise<CorrectionRepairPlan> {
    const plan = await this.repository.appendPlan(this.planner.plan(input));
    if (this.audit) await this.audit.append({ eventId: `audit:${plan.correctionId}:repair-plan:${plan.planId}`, eventType: "CORRECTION_REPAIR_PLANNED", workspaceId, occurredAt: plan.plannedAt, actor, correlationId, schemaVersion: "10.0", references: { correctionIds: [plan.correctionId], knowledgeIds: plan.targetIds }, payload: { planId: plan.planId, operation: plan.operation, authorization: plan.authorization, mutationAuthorized: false } });
    return plan;
  }
}

type PromotionService = Readonly<{ promote(input: Readonly<{ gateRequest: DurableLearningGateRequest; admission: KnowledgeAdmissionRequest }>): Promise<Readonly<{ status: "COMMITTED" | "DEFERRED" | "REJECTED" | "RE_EVALUATION_REQUIRED" }>> }>;
type SupersessionService = Readonly<{ supersede(request: ProvenanceSupersessionRequest): Promise<ProvenanceSupersessionResult> }>;
export type CorrectionRepairExecutionResult = Readonly<{ status: "SUPERSEDED" | "GATE_DEFERRED" | "GATE_REJECTED" | "RE_EVALUATION_REQUIRED" | "REPAIR_BLOCKED" | "SUPERSESSION_FAILED"; persistenceEffect: "CREATED" | "NONE"; authorityEffect: "UNCHANGED"; executionPermissionGranted: false }>;

/** The only Phase 12 repair executor. It invokes Phase 9 first and only then creates immutable supersession lineage. */
export class GatedCorrectionSupersessionService {
  constructor(private readonly promotion: PromotionService, private readonly supersession: SupersessionService, private readonly audit?: LearningAuditLedger) {}
  async execute(input: Readonly<{ plan: CorrectionRepairPlan; gateRequest: DurableLearningGateRequest; admission: KnowledgeAdmissionRequest; priorKnowledgeId: string; successorKnowledgeId: string; actor: ProvenanceActor; reason: string; occurredAt: string; workspaceId: string; correlationId: string }>): Promise<CorrectionRepairExecutionResult> {
    if (input.plan.operation !== "SUPERSEDE" || input.plan.authorization !== "GATE_REQUIRED" || input.actor.actorType !== "HUMAN" || !input.plan.targetIds.includes(input.priorKnowledgeId)) return this.result("REPAIR_BLOCKED");
    const promotion = await this.promotion.promote({ gateRequest: input.gateRequest, admission: input.admission });
    if (promotion.status !== "COMMITTED") return this.result(promotion.status === "DEFERRED" ? "GATE_DEFERRED" : promotion.status === "RE_EVALUATION_REQUIRED" ? "RE_EVALUATION_REQUIRED" : "GATE_REJECTED");
    const superseded = await this.supersession.supersede({ priorKnowledgeId: input.priorKnowledgeId, successorKnowledgeId: input.successorKnowledgeId, reason: input.reason, actor: input.actor, occurredAt: input.occurredAt });
    if (superseded.status !== "SUPERSEDED") return this.result("SUPERSESSION_FAILED");
    if (this.audit) await this.audit.append({ eventId: `audit:${input.plan.correctionId}:superseded:${input.successorKnowledgeId}`, eventType: "KNOWLEDGE_SUPERSEDED", workspaceId: input.workspaceId, occurredAt: input.occurredAt, actor: input.actor, correlationId: input.correlationId, schemaVersion: "10.0", references: { correctionIds: [input.plan.correctionId], knowledgeIds: [input.priorKnowledgeId, input.successorKnowledgeId] }, payload: { planId: input.plan.planId, gateRequired: true } });
    return this.result("SUPERSEDED", "CREATED");
  }
  private result(status: CorrectionRepairExecutionResult["status"], persistenceEffect: "CREATED" | "NONE" = "NONE"): CorrectionRepairExecutionResult { return { status, persistenceEffect, authorityEffect: "UNCHANGED", executionPermissionGranted: false }; }
}
