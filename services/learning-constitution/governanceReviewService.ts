import type { KnowledgeAuditLedger, GovernanceReviewProposalAuditEvent } from "../../types/learning-constitution/durableKnowledge";
import type {
  GovernanceReviewDecisionRequest,
  GovernanceReviewProposal,
  GovernanceReviewProposalRequest,
  GovernanceReviewProposalRepository,
  GovernanceReviewReasonCode,
  GovernanceReviewResult,
  GovernanceReviewService as GovernanceReviewServiceContract,
  GovernanceReviewerAuthorizer,
} from "../../types/learning-constitution/governanceReview";
import type { KnowledgeScopeReference } from "../../types/learning-constitution/knowledgeScope";

export const GOVERNANCE_REVIEW_SERVICE_ID = "phase-0-governance-review-service";

type Dependencies = Readonly<{
  repository: GovernanceReviewProposalRepository;
  authorizer: GovernanceReviewerAuthorizer;
  auditLedger: KnowledgeAuditLedger;
  now?: () => string;
}>;

const scopeKey = (scope?: KnowledgeScopeReference): string =>
  !scope ? "ALL" : "id" in scope ? `${scope.type}:${scope.id}` : scope.type;
const result = (status: GovernanceReviewResult["status"], reasonCode: GovernanceReviewReasonCode, values: Pick<GovernanceReviewResult, "proposal" | "created" | "idempotentReplay" | "persistenceEffect">): GovernanceReviewResult => ({
  status, reasonCode, ...values, authorityEffect: "UNCHANGED", executionPermissionGranted: false,
});
const rejected = (reasonCode: GovernanceReviewReasonCode): GovernanceReviewResult => result("REJECTED", reasonCode, { created: false, idempotentReplay: false, persistenceEffect: "NONE" });

const decisionTargets: Record<GovernanceReviewDecisionRequest["action"], GovernanceReviewProposal["state"]> = {
  BEGIN_REVIEW: "UNDER_REVIEW", APPROVE: "APPROVED_FOR_POLICY_CHANGE", REJECT: "REJECTED", WITHDRAW: "WITHDRAWN",
};
const targetState = (action: GovernanceReviewDecisionRequest["action"]): GovernanceReviewProposal["state"] => decisionTargets[action];
const isValidTransition = (from: GovernanceReviewProposal["state"], to: GovernanceReviewProposal["state"]): boolean =>
  (from === "PROPOSED" && (to === "UNDER_REVIEW" || to === "WITHDRAWN")) ||
  (from === "UNDER_REVIEW" && (to === "APPROVED_FOR_POLICY_CHANGE" || to === "REJECTED" || to === "WITHDRAWN"));

export class GovernanceReviewService implements GovernanceReviewServiceContract {
  constructor(private readonly dependencies: Dependencies) {}

  async propose(request: GovernanceReviewProposalRequest): Promise<GovernanceReviewResult> {
    const existing = await this.dependencies.repository.getById(request.proposalId);
    if (existing) {
      return existing.reportId === request.report.reportId &&
        existing.rationale === request.rationale.trim() &&
        existing.expectedImpact === request.expectedImpact.trim() &&
        existing.evidenceIds.join("\u0000") === request.evidenceIds.join("\u0000") &&
        existing.affectedPolicyIds.join("\u0000") === request.affectedPolicyIds.join("\u0000")
        ? result("PROPOSED", "IDEMPOTENT_REPLAY", { proposal: existing, created: false, idempotentReplay: true, persistenceEffect: "NONE" })
        : rejected("PROPOSAL_ID_CONFLICT");
    }
    if (!request.rationale.trim()) return rejected("RATIONALE_MISSING");
    if (!request.expectedImpact.trim()) return rejected("IMPACT_MISSING");
    if (!request.evidenceIds.length || !request.affectedPolicyIds.length) return rejected("EVIDENCE_MISSING");
    const now = this.dependencies.now?.() ?? new Date().toISOString();
    const proposal: GovernanceReviewProposal = {
      proposalId: request.proposalId, reportId: request.report.reportId, scopeKey: scopeKey(request.report.request.scope),
      alertCodes: request.report.alerts.map((alert) => alert.code), rationale: request.rationale.trim(),
      evidenceIds: [...request.evidenceIds], affectedPolicyIds: [...request.affectedPolicyIds], expectedImpact: request.expectedImpact.trim(),
      state: "PROPOSED", createdAt: now, policyVersion: request.policyVersion, constitutionVersion: request.constitutionVersion, provenance: request.provenance,
    };
    try {
      const created = await this.dependencies.repository.create(proposal);
      await this.appendAudit(created, "GOVERNANCE_REVIEW_PROPOSED", now);
      return result("PROPOSED", "GOVERNANCE_REVIEW_PROPOSED", { proposal: created, created: true, idempotentReplay: false, persistenceEffect: "CREATED" });
    } catch {
      return result("PERSISTENCE_FAILED", "PERSISTENCE_FAILED", { created: false, idempotentReplay: false, persistenceEffect: "NONE" });
    }
  }

  async decide(request: GovernanceReviewDecisionRequest): Promise<GovernanceReviewResult> {
    const proposal = await this.dependencies.repository.getById(request.proposalId);
    if (!proposal) return rejected("PROPOSAL_NOT_FOUND");
    if (!(await this.dependencies.authorizer.isAuthorized(request.reviewerId, request.action))) return rejected("UNAUTHORIZED_REVIEWER");
    const next = targetState(request.action);
    if (proposal.state === next) return result("DECIDED", "IDEMPOTENT_REPLAY", { proposal, created: false, idempotentReplay: true, persistenceEffect: "NONE" });
    if (!isValidTransition(proposal.state, next)) return rejected("INVALID_STATE_TRANSITION");
    const now = this.dependencies.now?.() ?? new Date().toISOString();
    try {
      const decided = await this.dependencies.repository.transition(proposal.proposalId, next, request.reviewerId, now);
      await this.appendAudit(decided, "GOVERNANCE_REVIEW_DECIDED", now);
      return result("DECIDED", "GOVERNANCE_REVIEW_DECIDED", { proposal: decided, created: true, idempotentReplay: false, persistenceEffect: "UPDATED" });
    } catch {
      return result("PERSISTENCE_FAILED", "PERSISTENCE_FAILED", { created: false, idempotentReplay: false, persistenceEffect: "NONE" });
    }
  }

  private async appendAudit(proposal: GovernanceReviewProposal, eventType: GovernanceReviewProposalAuditEvent["eventType"], occurredAt: string): Promise<void> {
    await this.dependencies.auditLedger.append({
      eventId: `audit:${eventType.toLowerCase()}:${proposal.proposalId}`, eventType, proposalId: proposal.proposalId,
      scopeKey: proposal.scopeKey, occurredAt, policyVersion: proposal.policyVersion, constitutionVersion: proposal.constitutionVersion, provenance: proposal.provenance,
    });
  }
}
