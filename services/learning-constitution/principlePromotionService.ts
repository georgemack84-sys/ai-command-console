import type { DurableLearningGateRequest } from "../../types/learning-constitution/durableLearningGate";
import type { KnowledgeAdmissionRequest } from "../../types/learning-constitution/durableKnowledge";
import type { HumanAuthorizedPrinciple } from "../../types/learning-constitution/principleLearning";
import type { LearningAuditLedger } from "../../types/learning-constitution/learningAuditLedger";

type PromotionService = Readonly<{ promote(input: Readonly<{ gateRequest: DurableLearningGateRequest; admission: KnowledgeAdmissionRequest }>): Promise<Readonly<{ status: "COMMITTED" | "DEFERRED" | "REJECTED" | "RE_EVALUATION_REQUIRED"; persistenceEffect: "CREATED" | "NONE" }>> }>;
export type PrinciplePromotionResult = Readonly<{ status: "COMMITTED" | "DEFERRED" | "REJECTED" | "RE_EVALUATION_REQUIRED" | "BLOCKED"; persistenceEffect: "CREATED" | "NONE"; authorityEffect: "UNCHANGED"; executionPermissionGranted: false }>;

/** Binds a human-authorized interpretation to exactly the Phase 9 candidate that will be evaluated and committed. */
export class PrinciplePromotionService {
  constructor(private readonly promotion: PromotionService, private readonly audit?: LearningAuditLedger) {}
  async promote(input: Readonly<{ interpretation: HumanAuthorizedPrinciple; gateRequest: DurableLearningGateRequest; admission: KnowledgeAdmissionRequest; workspaceId: string; correlationId: string }>): Promise<PrinciplePromotionResult> {
    const { interpretation, gateRequest, admission } = input;
    const gateCandidate = gateRequest?.candidate; const admissionCandidate = admission?.candidate;
    if (!gateCandidate || !admissionCandidate || interpretation.authority !== "HUMAN_DECISION" || interpretation.status !== "PENDING_CONFLICT_AND_GATE" || gateCandidate.candidateId !== interpretation.interpretationId || admissionCandidate.candidateId !== interpretation.interpretationId || gateCandidate.classification !== "PRINCIPLE" || admissionCandidate.classification !== "PRINCIPLE" || gateCandidate.content !== interpretation.statement || admissionCandidate.content !== interpretation.statement) return this.result("BLOCKED");
    const promoted = await this.promotion.promote({ gateRequest, admission });
    if (promoted.status === "COMMITTED" && this.audit) await this.audit.append({ eventId: `audit:principle-durable:${interpretation.interpretationId}`, eventType: "PRINCIPLE_APPROVED", workspaceId: input.workspaceId, occurredAt: interpretation.authorizedAt, actor: interpretation.authorizedBy, correlationId: input.correlationId, schemaVersion: "10.0", references: { provenanceIds: [interpretation.candidatePrincipleId, interpretation.reviewId] }, payload: { interpretationId: interpretation.interpretationId, authority: interpretation.authority, durableMutationAuthorized: true } });
    return this.result(promoted.status, promoted.persistenceEffect);
  }
  private result(status: PrinciplePromotionResult["status"], persistenceEffect: "CREATED" | "NONE" = "NONE"): PrinciplePromotionResult { return { status, persistenceEffect, authorityEffect: "UNCHANGED", executionPermissionGranted: false }; }
}
