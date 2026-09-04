import type { AuthorityLedger, AuthorityPromotionEvent, AuthorityPromotionReasonCode, AuthorityPromotionRequest, AuthorityPromotionResult, AuthorityPromotionService as AuthorityPromotionServiceContract } from "../../types/learning-constitution";
import type { LearningAuditLedger } from "../../types/learning-constitution/learningAuditLedger";

const HUMAN_TYPES = new Set(["HUMAN_DIRECTIVE", "HUMAN_DECISION", "HUMAN_CORRECTION", "HUMAN_PREFERENCE"]);
const agentPromotion = new Set(["AGENT_HYPOTHESIS->AGENT_INFERRED", "AGENT_INFERRED->AGENT_DERIVED"]);

const toEvent = (request: AuthorityPromotionRequest): AuthorityPromotionEvent => ({ eventId: request.eventId, recordId: request.record.authorityId, previousAuthority: request.record.authorityType, newAuthority: request.newAuthority, authorizedBy: request.authorizedBy, reason: request.reason, timestamp: request.timestamp, evidenceIds: request.evidenceIds });
const result = (status: AuthorityPromotionResult["status"], reasonCode: AuthorityPromotionReasonCode, event: AuthorityPromotionEvent): AuthorityPromotionResult => ({ status, reasonCode, event, persistenceEffect: "CREATED", authorityEffect: "UNCHANGED", executionPermissionGranted: false });

/** Creates auditable promotion events; it never rewrites the authority record. */
export class LedgerBackedAuthorityPromotionService implements AuthorityPromotionServiceContract {
  constructor(private readonly ledger: AuthorityLedger, private readonly phase10Audit?: Readonly<{ ledger: LearningAuditLedger; workspaceId: string }>) {}
  async promote(request: AuthorityPromotionRequest): Promise<AuthorityPromotionResult> {
    const event = toEvent(request);
    const current = request.record.authorityType;
    let status: AuthorityPromotionResult["status"] = "REVIEW_REQUIRED";
    let reasonCode: AuthorityPromotionReasonCode = "UNSUPPORTED_PROMOTION";
    if (current === request.newAuthority) { status = "REJECTED"; reasonCode = "NO_AUTHORITY_CHANGE"; }
    else if (HUMAN_TYPES.has(request.newAuthority) && !HUMAN_TYPES.has(current)) { status = "REJECTED"; reasonCode = "HUMAN_AUTHORITY_REQUIRES_HUMAN_ESTABLISHMENT"; }
    else if (!request.authorizedBy.trim()) { status = "REJECTED"; reasonCode = "PROMOTION_AUTHORIZER_REQUIRED"; }
    else if (!request.evidenceIds.length) { status = "REJECTED"; reasonCode = "PROMOTION_EVIDENCE_REQUIRED"; }
    else if (agentPromotion.has(`${current}->${request.newAuthority}`)) { status = "APPROVED"; reasonCode = "AGENT_PROMOTION_APPROVED"; }
    await this.ledger.append({ eventId: event.eventId, eventType: status === "APPROVED" ? "PROMOTION_APPROVED" : "PROMOTION_REJECTED", authorityId: event.recordId, occurredAt: event.timestamp, reason: reasonCode, relatedAuthorityId: undefined, previousAuthorityType: event.previousAuthority, newAuthorityType: event.newAuthority, authorizedBy: event.authorizedBy, evidenceIds: event.evidenceIds });
    await this.phase10Audit?.ledger.append({ eventId: `learning-audit:authority:${event.eventId}`, eventType: "AUTHORITY_TRANSITION", workspaceId: this.phase10Audit.workspaceId, occurredAt: event.timestamp, actor: { actorId: event.authorizedBy, actorType: "HUMAN" }, correlationId: event.eventId, schemaVersion: "10.0", references: { authorityIds: [event.recordId], provenanceIds: event.evidenceIds }, payload: { status, reasonCode, previousAuthority: event.previousAuthority, newAuthority: event.newAuthority } });
    return result(status, reasonCode, event);
  }
}
