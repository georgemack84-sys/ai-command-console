import type { DurableLearningGateRequest } from "../../types/learning-constitution/durableLearningGate";
import type { KnowledgeAdmissionRequest } from "../../types/learning-constitution/durableKnowledge";
import type { HumanAuthorizedProcedure } from "../../types/learning-constitution/procedureLearning";
import type { LearningAuditLedger } from "../../types/learning-constitution/learningAuditLedger";

type PromotionService = Readonly<{ promote(input: Readonly<{ gateRequest: DurableLearningGateRequest; admission: KnowledgeAdmissionRequest }>): Promise<Readonly<{ status: "COMMITTED" | "DEFERRED" | "REJECTED" | "RE_EVALUATION_REQUIRED"; persistenceEffect: "CREATED" | "NONE" }>> }>;
export type ProcedurePromotionResult = Readonly<{ status: "COMMITTED" | "DEFERRED" | "REJECTED" | "RE_EVALUATION_REQUIRED" | "BLOCKED"; persistenceEffect: "CREATED" | "NONE"; authorityEffect: "UNCHANGED"; executionPermissionGranted: false }>;

/** Binds a reviewed procedure definition to exactly the governed durable-learning transaction. */
export class ProcedurePromotionService {
  constructor(private readonly promotion: PromotionService, private readonly audit?: LearningAuditLedger) {}
  async promote(input: Readonly<{ authorized: HumanAuthorizedProcedure; gateRequest: DurableLearningGateRequest; admission: KnowledgeAdmissionRequest; workspaceId: string; correlationId: string }>): Promise<ProcedurePromotionResult> {
    const gateCandidate = input.gateRequest?.candidate; const admissionCandidate = input.admission?.candidate; const authorized = input.authorized;
    if (!gateCandidate || !admissionCandidate || authorized.authority !== "HUMAN_DIRECTIVE" || authorized.status !== "PENDING_CONFLICT_AND_GATE" || gateCandidate.candidateId !== authorized.authorizedProcedureId || admissionCandidate.candidateId !== authorized.authorizedProcedureId || gateCandidate.classification !== "PROCEDURE" || admissionCandidate.classification !== "PROCEDURE" || gateCandidate.content !== authorized.procedure.name || admissionCandidate.content !== authorized.procedure.name) return this.result("BLOCKED");
    const promoted = await this.promotion.promote({ gateRequest: input.gateRequest, admission: input.admission });
    if (promoted.status === "COMMITTED" && this.audit) await this.audit.append({ eventId: `audit:procedure-durable:${authorized.authorizedProcedureId}`, eventType: "PROCEDURE_APPROVED", workspaceId: input.workspaceId, occurredAt: authorized.authorizedAt, actor: authorized.authorizedBy, correlationId: input.correlationId, schemaVersion: "10.0", references: { provenanceIds: [authorized.procedure.teachingEventId] }, payload: { authorizedProcedureId: authorized.authorizedProcedureId, procedureId: authorized.procedureId, durableMutationAuthorized: true, executionPermissionGranted: false } });
    return this.result(promoted.status, promoted.persistenceEffect);
  }
  private result(status: ProcedurePromotionResult["status"], persistenceEffect: "CREATED" | "NONE" = "NONE"): ProcedurePromotionResult { return { status, persistenceEffect, authorityEffect: "UNCHANGED", executionPermissionGranted: false }; }
}
