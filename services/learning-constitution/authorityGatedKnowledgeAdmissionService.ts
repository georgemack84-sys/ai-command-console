import type { AuthorityGatedAdmissionDependencies, AuthorityGatedAdmissionRequest, AuthorityGatedAdmissionResult, AuthorityGatedKnowledgeAdmissionService } from "../../types/learning-constitution";

/** Authority is an upstream check; Phase 9 owns the only durable-write hand-off. */
export class GovernedAuthorityGatedKnowledgeAdmissionService implements AuthorityGatedKnowledgeAdmissionService {
  constructor(private readonly dependencies: AuthorityGatedAdmissionDependencies) {}
  async admit(request: AuthorityGatedAdmissionRequest): Promise<AuthorityGatedAdmissionResult> {
    const gate = this.dependencies.authorityGate.evaluate(request.authority);
    if (gate.decision === "DENY") return { status: "DENIED", reasonCode: "AUTHORITY_GATE_DENIED", gate, persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
    if (gate.decision === "REVIEW") return { status: "REVIEW_REQUIRED", reasonCode: "AUTHORITY_GATE_REVIEW_REQUIRED", gate, persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
    const promotion = await this.dependencies.promotion.promote({
      gateRequest: { ...request.promotion.gateRequest, authority: gate },
      admission: request.promotion.admission,
    });
    if (promotion.status === "DEFERRED") return { status: "DEFERRED", reasonCode: "DURABLE_GATE_DEFERRED", gate, promotion, persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
    if (promotion.status === "REJECTED") return { status: "REJECTED", reasonCode: "DURABLE_GATE_REJECTED", gate, promotion, persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
    if (promotion.status === "RE_EVALUATION_REQUIRED") return { status: "RE_EVALUATION_REQUIRED", reasonCode: "REGISTRY_REEVALUATION_REQUIRED", gate, promotion, persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
    return { status: "FORWARDED", reasonCode: "AUTHORITY_GATE_ALLOWED", gate, promotion, persistenceEffect: promotion.persistenceEffect, authorityEffect: "UNCHANGED", executionPermissionGranted: false };
  }
}
