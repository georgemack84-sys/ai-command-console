import type { ConflictResolutionGateRequest, ConflictResolutionGateResult } from "../../types/learning-constitution/conflictResolution";

/**
 * Phase 8's resolution gate deliberately has no allow-execution path yet.
 * Planning is safe; any material resolution waits for a later durable human
 * decision and executor.
 */
export class ConflictResolutionAuthorityGate {
  evaluate(request: ConflictResolutionGateRequest): ConflictResolutionGateResult {
    if (!request.attemptingExecution && !request.proposal.requiresApproval) return { decision: "ALLOW_ANALYSIS_ONLY", reasonCode: "NO_MUTATION_PROPOSED", persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
    if (request.resolver.actorType !== "HUMAN") return { decision: "DENY", reasonCode: "AGENT_CANNOT_APPROVE_OR_EXECUTE", persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
    if (request.attemptingExecution) return { decision: "DENY", reasonCode: "RESOLUTION_EXECUTION_NOT_ENABLED", persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
    return { decision: "REQUIRE_APPROVAL", reasonCode: "HUMAN_APPROVAL_REQUIRED", persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
  }
}
