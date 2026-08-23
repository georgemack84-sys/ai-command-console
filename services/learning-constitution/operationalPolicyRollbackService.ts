import type { KnowledgeAuditLedger, OperationalPolicyRolledBackAuditEvent } from "../../types/learning-constitution/durableKnowledge";
import type {
  OperationalPolicyRepository,
  OperationalPolicyRollbackReasonCode,
  OperationalPolicyRollbackRequest,
  OperationalPolicyRollbackResult,
  OperationalPolicyRollbackService as OperationalPolicyRollbackServiceContract,
  PolicyRollbackAuthorizer,
} from "../../types/learning-constitution/operationalPolicy";

export const OPERATIONAL_POLICY_ROLLBACK_SERVICE_ID = "phase-0-operational-policy-rollback-service";

type Dependencies = Readonly<{
  policyRepository: OperationalPolicyRepository;
  authorizer: PolicyRollbackAuthorizer;
  auditLedger: KnowledgeAuditLedger;
  now?: () => string;
}>;

const result = (status: OperationalPolicyRollbackResult["status"], reasonCode: OperationalPolicyRollbackReasonCode, values: Pick<OperationalPolicyRollbackResult, "activePolicyVersion" | "created" | "idempotentReplay" | "persistenceEffect">): OperationalPolicyRollbackResult => ({
  status, reasonCode, ...values, authorityEffect: "UNCHANGED", executionPermissionGranted: false,
});
const rejected = (reasonCode: OperationalPolicyRollbackReasonCode): OperationalPolicyRollbackResult => result("REJECTED", reasonCode, { created: false, idempotentReplay: false, persistenceEffect: "NONE" });
const constitutionPolicy = (policyId: string): boolean => /constitution/i.test(policyId);

export class OperationalPolicyRollbackService implements OperationalPolicyRollbackServiceContract {
  constructor(private readonly dependencies: Dependencies) {}

  async rollback(request: OperationalPolicyRollbackRequest): Promise<OperationalPolicyRollbackResult> {
    if (constitutionPolicy(request.policyId)) return rejected("CONSTITUTION_MUTATION_PROHIBITED");
    if (!request.reason.trim()) return rejected("ROLLBACK_REASON_MISSING");
    const active = await this.dependencies.policyRepository.getActive(request.policyId, request.scopeKey);
    if (!active) return rejected("ACTIVE_POLICY_NOT_FOUND");
    const target = await this.dependencies.policyRepository.getByPolicyVersion(request.policyId, request.targetVersion, request.scopeKey);
    if (!target) return rejected("ROLLBACK_TARGET_NOT_FOUND");
    if (target.version === active.version) return result("ROLLED_BACK", "IDEMPOTENT_REPLAY", { activePolicyVersion: active, created: false, idempotentReplay: true, persistenceEffect: "NONE" });
    if (Date.parse(target.activatedAt) >= Date.parse(active.activatedAt)) return rejected("ROLLBACK_TARGET_INVALID");
    if (!(await this.dependencies.authorizer.isAuthorized(request.rollbackActorId, request.policyId, request.scopeKey))) {
      return rejected("UNAUTHORIZED_ROLLBACK_ACTOR");
    }
    const occurredAt = this.dependencies.now?.() ?? new Date().toISOString();
    try {
      const reactivated = await this.dependencies.policyRepository.reactivate(request.policyId, request.targetVersion, request.scopeKey);
      const event: OperationalPolicyRolledBackAuditEvent = {
        eventId: `audit:operational-policy-rollback:${request.policyId}:${request.scopeKey}:${active.version}:${target.version}`,
        eventType: "OPERATIONAL_POLICY_ROLLED_BACK", policyId: request.policyId, fromVersion: active.version,
        toVersion: target.version, scopeKey: request.scopeKey, occurredAt, constitutionVersion: active.constitutionVersion, provenance: active.provenance,
      };
      await this.dependencies.auditLedger.append(event);
      return result("ROLLED_BACK", "OPERATIONAL_POLICY_ROLLED_BACK", { activePolicyVersion: reactivated, created: true, idempotentReplay: false, persistenceEffect: "UPDATED" });
    } catch {
      return result("PERSISTENCE_FAILED", "PERSISTENCE_FAILED", { created: false, idempotentReplay: false, persistenceEffect: "NONE" });
    }
  }
}
