import type { AuthorityGatedAdmissionDependencies, AuthorityGatedAdmissionRequest, AuthorityGatedAdmissionResult, AuthorityGatedKnowledgeAdmissionService } from "../../types/learning-constitution";

/** The only Phase 6 admission adapter: authority must pass before durable-write admission is invoked. */
export class GovernedAuthorityGatedKnowledgeAdmissionService implements AuthorityGatedKnowledgeAdmissionService {
  constructor(private readonly dependencies: AuthorityGatedAdmissionDependencies) {}
  async admit(request: AuthorityGatedAdmissionRequest): Promise<AuthorityGatedAdmissionResult> {
    const gate = this.dependencies.authorityGate.evaluate(request.authority);
    if (gate.decision === "DENY") return { status: "DENIED", reasonCode: "AUTHORITY_GATE_DENIED", gate, persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
    if (gate.decision === "REVIEW") return { status: "REVIEW_REQUIRED", reasonCode: "AUTHORITY_GATE_REVIEW_REQUIRED", gate, persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
    const admission = await this.dependencies.knowledgeAdmission.admit(request.knowledge);
    return { status: "FORWARDED", reasonCode: "AUTHORITY_GATE_ALLOWED", gate, admission, persistenceEffect: admission.persistenceEffect, authorityEffect: "UNCHANGED", executionPermissionGranted: false };
  }
}
