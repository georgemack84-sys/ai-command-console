import type { KnowledgeAuditLedger } from "../../types/learning-constitution/durableKnowledge";
import type { GovernanceReviewProposalRepository } from "../../types/learning-constitution/governanceReview";
import type {
  OperationalPolicyExplanationRequest,
  OperationalPolicyExplanationResult,
  OperationalPolicyExplanationService as OperationalPolicyExplanationServiceContract,
} from "../../types/learning-constitution/operationalPolicyExplanation";
import type { OperationalPolicyRepository } from "../../types/learning-constitution/operationalPolicy";

export const OPERATIONAL_POLICY_EXPLANATION_SERVICE_ID = "phase-0-operational-policy-explanation-service";

type Dependencies = Readonly<{
  policyRepository: OperationalPolicyRepository;
  proposalRepository: GovernanceReviewProposalRepository;
  auditLedger: KnowledgeAuditLedger;
}>;

const result = (values: Omit<OperationalPolicyExplanationResult, "persistenceEffect" | "authorityEffect" | "executionPermissionGranted">): OperationalPolicyExplanationResult => ({
  ...values, persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false,
});

export class OperationalPolicyExplanationService implements OperationalPolicyExplanationServiceContract {
  constructor(private readonly dependencies: Dependencies) {}

  async explain(request: OperationalPolicyExplanationRequest): Promise<OperationalPolicyExplanationResult> {
    try {
      const active = request.version
        ? await this.dependencies.policyRepository.getByPolicyVersion(request.policyId, request.version, request.scopeKey)
        : await this.dependencies.policyRepository.getActive(request.policyId, request.scopeKey);
      if (!active) return result({ status: "NOT_FOUND", reasonCode: "POLICY_NOT_FOUND" });
      const [versionHistory, allScopeEvents, governanceProposal] = await Promise.all([
        this.dependencies.policyRepository.findAllByPolicyScope(request.policyId, request.scopeKey),
        this.dependencies.auditLedger.findByKnowledgeId(`policy:${request.scopeKey}`),
        this.dependencies.proposalRepository.getById(active.proposalId),
      ]);
      const auditEvents = allScopeEvents.filter((event) =>
        (event.eventType === "OPERATIONAL_POLICY_ACTIVATED" || event.eventType === "OPERATIONAL_POLICY_ROLLED_BACK") &&
        event.policyId === request.policyId,
      ).sort((left, right) => left.occurredAt.localeCompare(right.occurredAt) || left.eventId.localeCompare(right.eventId));
      const hasActivation = auditEvents.some((event) =>
        event.eventType === "OPERATIONAL_POLICY_ACTIVATED" && event.policyVersion === active.version) ||
        auditEvents.some((event) => event.eventType === "OPERATIONAL_POLICY_ROLLED_BACK" && event.toVersion === active.version);
      return result({
        status: hasActivation ? "COMPLETE" : "INCOMPLETE_HISTORY",
        reasonCode: hasActivation ? "POLICY_HISTORY_EXPLAINED" : "POLICY_ACTIVATION_HISTORY_MISSING",
        trace: { activeVersion: active, versionHistory, auditEvents, governanceProposal, effectivenessAssessment: request.effectivenessAssessment },
      });
    } catch {
      return result({ status: "EXPLANATION_FAILED", reasonCode: "EXPLANATION_FAILED" });
    }
  }
}
