import type { KnowledgeAuditLedger, OperationalPolicyActivatedAuditEvent } from "../../types/learning-constitution/durableKnowledge";
import type {
  OperationalPolicyActivationRequest,
  OperationalPolicyActivationResult,
  OperationalPolicyActivationService as OperationalPolicyActivationServiceContract,
  OperationalPolicyVersion,
  PolicyActivatorAuthorizer,
  OperationalPolicyRepository,
} from "../../types/learning-constitution/operationalPolicy";
import type { GovernanceReviewProposalRepository } from "../../types/learning-constitution/governanceReview";

export const OPERATIONAL_POLICY_ACTIVATION_SERVICE_ID = "phase-0-operational-policy-activation-service";

type Dependencies = Readonly<{
  proposalRepository: GovernanceReviewProposalRepository;
  policyRepository: OperationalPolicyRepository;
  authorizer: PolicyActivatorAuthorizer;
  auditLedger: KnowledgeAuditLedger;
  now?: () => string;
}>;

const result = (status: OperationalPolicyActivationResult["status"], reasonCode: OperationalPolicyActivationResult["reasonCode"], values: Pick<OperationalPolicyActivationResult, "policyVersion" | "created" | "idempotentReplay" | "persistenceEffect">): OperationalPolicyActivationResult => ({
  status, reasonCode, ...values, authorityEffect: "UNCHANGED", executionPermissionGranted: false,
});
const rejected = (reasonCode: OperationalPolicyActivationResult["reasonCode"]): OperationalPolicyActivationResult => result("REJECTED", reasonCode, { created: false, idempotentReplay: false, persistenceEffect: "NONE" });
const constitutionPolicy = (policyId: string): boolean => /constitution/i.test(policyId);
const hasRequiredInput = (request: OperationalPolicyActivationRequest): boolean =>
  Boolean(request.policyId.trim() && request.version.trim() && request.scopeKey.trim() && request.contentHash.trim() && request.impactAnalysis.trim() && request.migrationPlan.trim() && request.rollbackPlan.trim() && request.activatorId.trim() && request.constitutionVersion.trim()) &&
  Number.isFinite(Date.parse(request.effectiveAt));

export class OperationalPolicyActivationService implements OperationalPolicyActivationServiceContract {
  constructor(private readonly dependencies: Dependencies) {}

  async activate(request: OperationalPolicyActivationRequest): Promise<OperationalPolicyActivationResult> {
    if (constitutionPolicy(request.policyId)) return rejected("CONSTITUTION_MUTATION_PROHIBITED");
    if (!hasRequiredInput(request)) return rejected("ACTIVATION_INPUT_MISSING");
    const proposal = await this.dependencies.proposalRepository.getById(request.proposalId);
    if (!proposal) return rejected("PROPOSAL_NOT_FOUND");
    if (proposal.state !== "APPROVED_FOR_POLICY_CHANGE" || !proposal.affectedPolicyIds.includes(request.policyId)) {
      return rejected("PROPOSAL_NOT_APPROVED");
    }
    if (!(await this.dependencies.authorizer.isAuthorized(request.activatorId, request.policyId, request.scopeKey))) {
      return rejected("UNAUTHORIZED_ACTIVATOR");
    }
    const existing = await this.dependencies.policyRepository.getByPolicyVersion(request.policyId, request.version, request.scopeKey);
    if (existing) {
      const same = existing.proposalId === request.proposalId && existing.contentHash === request.contentHash;
      return same
        ? result("ACTIVATED", "IDEMPOTENT_REPLAY", { policyVersion: existing, created: false, idempotentReplay: true, persistenceEffect: "NONE" })
        : rejected("ACTIVATION_VERSION_CONFLICT");
    }
    const activatedAt = this.dependencies.now?.() ?? new Date().toISOString();
    const version: OperationalPolicyVersion = {
      policyId: request.policyId, version: request.version, scopeKey: request.scopeKey, contentHash: request.contentHash,
      impactAnalysis: request.impactAnalysis, migrationPlan: request.migrationPlan, rollbackPlan: request.rollbackPlan,
      effectiveAt: request.effectiveAt, activatedAt, activatedBy: request.activatorId, proposalId: request.proposalId,
      constitutionVersion: request.constitutionVersion, provenance: request.provenance,
    };
    try {
      const activated = await this.dependencies.policyRepository.activate(version);
      const event: OperationalPolicyActivatedAuditEvent = {
        eventId: `audit:operational-policy-activated:${activated.policyId}:${activated.scopeKey}:${activated.version}`,
        eventType: "OPERATIONAL_POLICY_ACTIVATED", policyId: activated.policyId, policyVersion: activated.version,
        scopeKey: activated.scopeKey, proposalId: activated.proposalId, occurredAt: activatedAt,
        constitutionVersion: activated.constitutionVersion, provenance: activated.provenance,
      };
      await this.dependencies.auditLedger.append(event);
      return result("ACTIVATED", "OPERATIONAL_POLICY_ACTIVATED", { policyVersion: activated, created: true, idempotentReplay: false, persistenceEffect: "CREATED" });
    } catch {
      return result("PERSISTENCE_FAILED", "PERSISTENCE_FAILED", { created: false, idempotentReplay: false, persistenceEffect: "NONE" });
    }
  }
}
