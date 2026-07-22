import { createDecisionContext } from "@/services/decision-context-contract";
import { generateDecisionIntegrityHash } from "@/services/decision-integrity";
import { normalizeDecisionCandidateInput } from "@/services/decision-input-normalization";
import { createMissionTenantContextRequest, resolveMissionTenantContext } from "@/services/decision-mission-tenant-context";
import type { DecisionCandidate } from "@/types/decision-input-normalization";
import type { DecisionContextDomain } from "@/types/decision-context-contract";
import type {
  AdvisoryOnlyStatus,
  ApprovalAuthority,
  AuthorityContext,
  AuthorityContextCache,
  AuthorityExplainability,
  AuthorityLevel,
  AuthorityOperatorContextPackage,
  AuthorityOperatorContextRequest,
  AuthorityOperatorFailureReason,
  AuthorityOperatorObservability,
  AuthorityOperatorReplayResult,
  AuthorityOperatorResolutionState,
  AuthorityOperatorValidationResult,
  DelegationAuthority,
  EscalationAuthority,
  OperatorContext,
  OperatorRole,
  RequiredApproval,
} from "@/types/decision-authority-operator-context";

const NOW = "2026-07-02T09:30:00.000Z";
const RESOLVER_VERSION = "authority-operator-context-resolver/v1" as const;
const AUTHORITY_VERSION = "authority-context/v1" as const;
const RESOLUTION_ORDER: readonly AuthorityOperatorResolutionState[] = Object.freeze([
  "OPERATOR_IDENTITY_RESOLVED",
  "AUTHENTICATION_VALIDATED",
  "AUTHORITY_RESOLVED",
  "DELEGATION_RESOLVED",
  "APPROVALS_RESOLVED",
  "ESCALATION_RESOLVED",
  "GOVERNANCE_AUTHORITY_VALIDATED",
  "CONSTITUTION_VALIDATED",
  "ADVISORY_VALIDATED",
  "AUTHORITY_VALIDATED",
  "CACHE_RECORDED",
  "PASSED",
] as const);

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function recordHash<T extends Record<string, unknown>>(value: T): string {
  const copy = { ...value };
  delete copy.integrity_hash;
  return hash(copy);
}

const AUTHORITY_RANK: Readonly<Record<AuthorityLevel, number>> = Object.freeze({
  ADVISORY: 1,
  OPERATOR_APPROVAL: 2,
  GOVERNANCE_APPROVAL: 3,
  CONSTITUTIONAL_APPROVAL: 4,
});

const OPERATOR_REGISTRY = Object.freeze({
  operator_alpha_mission_owner: Object.freeze({
    operator_id: "operator_alpha_mission_owner",
    operator_name: "Alpha Mission Owner",
    operator_role: "MISSION_OWNER" as const,
    operator_permissions: Object.freeze(["review", "approve_operator", "escalate_governance"]),
    operator_certifications: Object.freeze(["cert_operator_alpha_mission_owner_v1"]),
    operator_tenant: "tenant_alpha",
    operator_status: "ACTIVE" as const,
    authority_level: "OPERATOR_APPROVAL" as const,
    delegation_status: "NONE" as const,
  }),
  operator_alpha_governance_officer: Object.freeze({
    operator_id: "operator_alpha_governance_officer",
    operator_name: "Alpha Governance Officer",
    operator_role: "GOVERNANCE_OFFICER" as const,
    operator_permissions: Object.freeze(["review", "approve_operator", "approve_governance", "escalate_constitution"]),
    operator_certifications: Object.freeze(["cert_operator_alpha_governance_v1"]),
    operator_tenant: "tenant_alpha",
    operator_status: "ACTIVE" as const,
    authority_level: "GOVERNANCE_APPROVAL" as const,
    delegation_status: "NONE" as const,
  }),
  operator_alpha_delegate: Object.freeze({
    operator_id: "operator_alpha_delegate",
    operator_name: "Alpha Delegated Operator",
    operator_role: "MISSION_OPERATOR" as const,
    operator_permissions: Object.freeze(["review"]),
    operator_certifications: Object.freeze(["cert_operator_alpha_delegate_v1"]),
    operator_tenant: "tenant_alpha",
    operator_status: "ACTIVE" as const,
    authority_level: "ADVISORY" as const,
    delegation_status: "VALID" as const,
  }),
  operator_beta_external: Object.freeze({
    operator_id: "operator_beta_external",
    operator_name: "Beta External Operator",
    operator_role: "MISSION_OPERATOR" as const,
    operator_permissions: Object.freeze(["review"]),
    operator_certifications: Object.freeze(["cert_operator_beta_v1"]),
    operator_tenant: "tenant_beta",
    operator_status: "ACTIVE" as const,
    authority_level: "ADVISORY" as const,
    delegation_status: "NONE" as const,
  }),
  operator_alpha_suspended: Object.freeze({
    operator_id: "operator_alpha_suspended",
    operator_name: "Alpha Suspended Operator",
    operator_role: "MISSION_OPERATOR" as const,
    operator_permissions: Object.freeze([]),
    operator_certifications: Object.freeze([]),
    operator_tenant: "tenant_alpha",
    operator_status: "SUSPENDED" as const,
    authority_level: "ADVISORY" as const,
    delegation_status: "NONE" as const,
  }),
});

function defaultCandidate(): DecisionCandidate {
  const result = normalizeDecisionCandidateInput();
  if (!result.candidate) throw new Error("default normalized candidate unavailable");
  return result.candidate;
}

export function createAuthorityOperatorContextRequest(overrides: Partial<AuthorityOperatorContextRequest> = {}): AuthorityOperatorContextRequest {
  const candidate = overrides.candidate ?? defaultCandidate();
  return Object.freeze({
    resolution_id: overrides.resolution_id ?? `authority_operator_resolution_${candidate.candidate_id}`,
    candidate,
    base_context: overrides.base_context ?? createDecisionContext({ candidate }),
    mission_tenant_package: overrides.mission_tenant_package ?? resolveMissionTenantContext(createMissionTenantContextRequest({ candidate })),
    operator_id: overrides.operator_id ?? "operator_alpha_mission_owner",
    requested_authority_level: overrides.requested_authority_level ?? (candidate.authority_required ? "OPERATOR_APPROVAL" : "ADVISORY"),
    delegated_by: overrides.delegated_by,
    escalation_reason: overrides.escalation_reason,
    resolver_version: overrides.resolver_version ?? RESOLVER_VERSION,
  });
}

function operatorContext(operator_id: string): OperatorContext | undefined {
  const source = OPERATOR_REGISTRY[operator_id as keyof typeof OPERATOR_REGISTRY];
  if (!source) return undefined;
  const base: Omit<OperatorContext, "integrity_hash"> = {
    operator_id: source.operator_id,
    operator_name: source.operator_name,
    operator_role: source.operator_role,
    operator_permissions: source.operator_permissions,
    operator_certifications: source.operator_certifications,
    operator_tenant: source.operator_tenant,
    operator_status: source.operator_status,
    authority_level: source.authority_level,
    delegation_status: source.delegation_status,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function approvalAuthority(operator: OperatorContext | undefined, request: AuthorityOperatorContextRequest): ApprovalAuthority {
  const sufficient = Boolean(operator && AUTHORITY_RANK[operator.authority_level] >= AUTHORITY_RANK[request.requested_authority_level]);
  const base: Omit<ApprovalAuthority, "integrity_hash"> = {
    approval_level: operator?.authority_level ?? "ADVISORY",
    approval_scope: Object.freeze(operator?.operator_permissions ?? []),
    maximum_authority: operator?.authority_level ?? "ADVISORY",
    decision_class_permissions: Object.freeze(["RECOMMENDATION_SELECTION", request.candidate.decision_type]),
    governance_restrictions: Object.freeze(["no_governance_modification", "operator_supremacy"]),
    constitutional_restrictions: Object.freeze(["advisory_only", "no_self_elevation"]),
    sufficient,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function delegationAuthority(operator: OperatorContext | undefined, request: AuthorityOperatorContextRequest): DelegationAuthority {
  const delegator = request.delegated_by ? operatorContext(request.delegated_by) : undefined;
  const selfDelegation = Boolean(delegator && operator && delegator.operator_id === operator.operator_id);
  const exceeds = Boolean(delegator && operator && AUTHORITY_RANK[operator.authority_level] > AUTHORITY_RANK[delegator.authority_level]);
  const validity = request.delegated_by
    ? selfDelegation ? "INVALID"
      : exceeds ? "EXCEEDS_AUTHORITY"
        : delegator?.operator_status === "ACTIVE" ? "VALID" : "INVALID"
    : operator?.delegation_status ?? "NONE";
  const base: Omit<DelegationAuthority, "integrity_hash"> = {
    delegating_authority: request.delegated_by,
    delegated_operator: operator?.operator_id,
    delegation_scope: Object.freeze(request.delegated_by ? ["review"] : []),
    delegation_duration: request.delegated_by ? "2026-07-02T00:00:00.000Z/2027-07-02T00:00:00.000Z" : "none",
    delegation_validity: validity,
    delegation_lineage: Object.freeze(request.delegated_by ? [`delegation_${request.delegated_by}_${operator?.operator_id}`] : []),
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function requiredApprovals(request: AuthorityOperatorContextRequest): readonly RequiredApproval[] {
  const roles: OperatorRole[] = request.requested_authority_level === "GOVERNANCE_APPROVAL"
    ? ["MISSION_OWNER", "GOVERNANCE_OFFICER"]
    : request.requested_authority_level === "CONSTITUTIONAL_APPROVAL"
      ? ["MISSION_OWNER", "GOVERNANCE_OFFICER", "CONSTITUTIONAL_REVIEWER"]
      : request.requested_authority_level === "OPERATOR_APPROVAL"
        ? ["MISSION_OWNER"]
        : [];
  return Object.freeze(roles.map((role, index) => {
    const base: Omit<RequiredApproval, "integrity_hash"> = {
      approval_id: `approval_${request.candidate.candidate_id}_${role.toLowerCase()}`,
      approval_role: role,
      approval_required: true,
      approval_status: "PENDING",
      approval_order: index + 1,
    };
    return Object.freeze({ ...base, integrity_hash: recordHash(base) });
  }));
}

function escalationAuthority(operator: OperatorContext | undefined, approval: ApprovalAuthority, request: AuthorityOperatorContextRequest): EscalationAuthority {
  const escalation_required = !approval.sufficient || Boolean(request.escalation_reason) || request.requested_authority_level === "CONSTITUTIONAL_APPROVAL";
  const base: Omit<EscalationAuthority, "integrity_hash"> = {
    escalation_required,
    escalation_level: escalation_required ? request.requested_authority_level === "CONSTITUTIONAL_APPROVAL" ? "CONSTITUTIONAL_APPROVAL" : "GOVERNANCE_APPROVAL" : undefined,
    escalation_target: escalation_required ? request.requested_authority_level === "CONSTITUTIONAL_APPROVAL" ? "operator_alpha_constitutional_reviewer" : "operator_alpha_governance_officer" : undefined,
    escalation_triggers: Object.freeze([
      ...(!approval.sufficient ? ["approval_authority_insufficient"] : []),
      ...(request.escalation_reason ? [request.escalation_reason] : []),
      ...(request.requested_authority_level === "CONSTITUTIONAL_APPROVAL" ? ["constitutional_review_required"] : []),
    ]),
    required_escalation_approvals: Object.freeze(escalation_required ? ["governance_officer"] : []),
    escalation_governance: Object.freeze(request.candidate.governance_refs),
    escalation_priority: request.requested_authority_level === "CONSTITUTIONAL_APPROVAL" ? "CRITICAL" : escalation_required ? "HIGH" : "NORMAL",
  };
  void operator;
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function explainability(input: {
  request: AuthorityOperatorContextRequest;
  operator?: OperatorContext;
  delegation: DelegationAuthority;
  escalation: EscalationAuthority;
  validation: readonly string[];
}): AuthorityExplainability {
  const base: Omit<AuthorityExplainability, "integrity_hash"> = {
    authority_source: "authority-registry",
    source_record: input.operator ? `operator_record_${input.operator.operator_id}` : "operator_record_missing",
    approval_reasoning: input.operator ? `${input.operator.authority_level} resolved for ${input.request.requested_authority_level}.` : "Operator identity unavailable.",
    delegation_chain: input.delegation.delegation_lineage,
    escalation_reasoning: input.escalation.escalation_required ? input.escalation.escalation_triggers.join(",") : "No escalation required.",
    governance_influence: input.request.candidate.governance_refs,
    constitutional_influence: Object.freeze(["constitution_advisory_only_v1", "constitution_operator_supremacy_v1"]),
    validation_results: input.validation,
    replay_reference: `replay_authority_operator_${input.request.resolution_id}`,
    supporting_evidence: input.request.candidate.evidence_refs,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function validationFor(input: {
  request: AuthorityOperatorContextRequest;
  operator?: OperatorContext;
  approval: ApprovalAuthority;
  delegation: DelegationAuthority;
  escalation: EscalationAuthority;
  required: readonly RequiredApproval[];
  advisory_status: AdvisoryOnlyStatus;
}): AuthorityOperatorValidationResult {
  const missionTenant = input.request.mission_tenant_package;
  const failures: AuthorityOperatorFailureReason[] = [
    ...(!input.operator ? ["OPERATOR_NOT_FOUND" as const] : []),
    ...(input.operator && input.operator.operator_status !== "ACTIVE" ? ["OPERATOR_NOT_AUTHENTICATED" as const] : []),
    ...(input.operator && input.operator.operator_tenant !== input.request.candidate.tenant_id ? ["OPERATOR_TENANT_MISMATCH" as const, "CROSS_TENANT_AUTHORITY" as const] : []),
    ...(!input.operator?.authority_level ? ["AUTHORITY_NOT_FOUND" as const] : []),
    ...(input.operator && !input.operator.operator_permissions.includes("review") ? ["AUTHORITY_SCOPE_INVALID" as const] : []),
    ...(!input.approval.sufficient && !input.escalation.escalation_required ? ["APPROVAL_AUTHORITY_INSUFFICIENT" as const] : []),
    ...(input.delegation.delegation_validity === "INVALID" ? ["DELEGATION_INVALID" as const] : []),
    ...(input.delegation.delegation_validity === "EXCEEDS_AUTHORITY" ? ["DELEGATION_EXCEEDS_AUTHORITY" as const] : []),
    ...(input.delegation.delegating_authority && input.delegation.delegating_authority === input.operator?.operator_id ? ["SELF_DELEGATION_ATTEMPT" as const] : []),
    ...(input.escalation.escalation_required && input.escalation.required_escalation_approvals.length === 0 ? ["ESCALATION_REQUIRED_UNRESOLVED" as const] : []),
    ...(input.required.some((approval) => approval.approval_required && approval.approval_status !== "PENDING" && approval.approval_status !== "SATISFIED") ? ["REQUIRED_APPROVALS_INCOMPLETE" as const] : []),
    ...(input.request.candidate.governance_refs.length === 0 ? ["GOVERNANCE_APPROVAL_UNAVAILABLE" as const] : []),
    ...(input.request.requested_authority_level === "CONSTITUTIONAL_APPROVAL" && !input.request.candidate.governance_refs.some((ref) => ref.includes("constitutional")) ? ["CONSTITUTIONAL_VALIDATION_UNAVAILABLE" as const] : []),
    ...(input.advisory_status !== "ENFORCED" ? ["ADVISORY_ONLY_VIOLATION" as const] : []),
    ...(input.request.candidate.authority_required && input.request.candidate.advisory_only === false ? ["AUTHORITY_ESCALATION_ATTEMPT" as const] : []),
    ...(missionTenant && missionTenant.validation.validation_status !== "PASS" ? ["INTEGRITY_VERIFICATION_FAILED" as const] : []),
  ];
  const unique = Object.freeze([...new Set(failures)]);
  const state: AuthorityOperatorResolutionState =
    unique.some((failure) => ["OPERATOR_NOT_FOUND", "OPERATOR_NOT_AUTHENTICATED", "OPERATOR_TENANT_MISMATCH"].includes(failure)) ? "FAILED_OPERATOR"
      : unique.some((failure) => ["CROSS_TENANT_AUTHORITY"].includes(failure)) ? "FAILED_ISOLATION"
        : unique.some((failure) => failure.startsWith("DELEGATION") || failure === "SELF_DELEGATION_ATTEMPT") ? "FAILED_DELEGATION"
          : unique.some((failure) => failure.startsWith("ESCALATION")) ? "FAILED_ESCALATION"
            : unique.some((failure) => failure.startsWith("GOVERNANCE")) ? "FAILED_GOVERNANCE"
              : unique.some((failure) => failure.startsWith("CONSTITUTIONAL")) ? "FAILED_CONSTITUTION"
                : unique.some((failure) => failure.includes("ADVISORY")) ? "FAILED_ADVISORY"
                  : unique.some((failure) => failure === "INTEGRITY_VERIFICATION_FAILED") ? "FAILED_INTEGRITY"
                    : unique.length ? "FAILED_AUTHORITY"
                      : "PASSED";
  return Object.freeze({
    validation_status: unique.length ? "FAIL" : "PASS",
    validation_state: state,
    failure_reason: unique[0],
    failure_reasons: unique,
    checks: Object.freeze({
      operator_exists: Boolean(input.operator),
      operator_authenticated: Boolean(input.operator && input.operator.operator_status === "ACTIVE"),
      tenant_membership_verified: Boolean(input.operator && input.operator.operator_tenant === input.request.candidate.tenant_id),
      authority_exists: Boolean(input.operator?.authority_level),
      authority_scope_valid: Boolean(input.operator?.operator_permissions.includes("review")),
      approval_authority_sufficient: input.approval.sufficient || input.escalation.escalation_required,
      delegation_valid: !["INVALID", "EXCEEDS_AUTHORITY", "EXPIRED"].includes(input.delegation.delegation_validity),
      escalation_authority_valid: !input.escalation.escalation_required || Boolean(input.escalation.escalation_target),
      required_approvals_complete: true,
      governance_approval_satisfied: input.request.candidate.governance_refs.length > 0,
      constitutional_authority_satisfied: !unique.includes("CONSTITUTIONAL_VALIDATION_UNAVAILABLE"),
      advisory_only_enforced: input.advisory_status === "ENFORCED",
      tenant_isolated: !unique.includes("CROSS_TENANT_AUTHORITY") && !unique.includes("OPERATOR_TENANT_MISMATCH"),
      integrity_verified: !unique.includes("INTEGRITY_VERIFICATION_FAILED"),
    }),
  });
}

function authorityContext(input: {
  request: AuthorityOperatorContextRequest;
  operator: OperatorContext;
  approval: ApprovalAuthority;
  delegation: DelegationAuthority;
  escalation: EscalationAuthority;
  required: readonly RequiredApproval[];
  validation: AuthorityOperatorValidationResult;
}): AuthorityContext {
  const advisory_only_status: AdvisoryOnlyStatus = input.request.candidate.advisory_only ? "ENFORCED" : "VIOLATED";
  const base: Omit<AuthorityContext, "integrity_hash" | "explainability"> & { explainability?: AuthorityExplainability } = {
    authority_context_id: `authority_context_${input.request.candidate.candidate_id}`,
    decision_candidate_id: input.request.candidate.candidate_id,
    operator_identity: input.operator,
    approval_authority: input.approval,
    delegation_authority: input.delegation,
    escalation_authority: input.escalation,
    required_approvals: input.required,
    advisory_only_status,
    authority_scope: Object.freeze(input.operator.operator_permissions),
    authority_constraints: Object.freeze(["no_autonomous_execution", "no_self_elevation", "no_governance_modification", "tenant_isolation_required"]),
    authority_lineage: Object.freeze([`authority_${input.operator.operator_id}`, ...input.delegation.delegation_lineage]),
    governance_requirements: input.request.candidate.governance_refs,
    constitutional_requirements: Object.freeze(["constitution_advisory_only_v1", "constitution_operator_supremacy_v1"]),
    validation_state: input.validation.validation_state,
  };
  const withExplainability = {
    ...base,
    explainability: explainability({
      request: input.request,
      operator: input.operator,
      delegation: input.delegation,
      escalation: input.escalation,
      validation: input.validation.failure_reasons,
    }),
  } as Omit<AuthorityContext, "integrity_hash">;
  return Object.freeze({ ...withExplainability, integrity_hash: recordHash(withExplainability) });
}

function fallbackOperator(): OperatorContext {
  return operatorContext("operator_alpha_mission_owner") as OperatorContext;
}

function operatorDomain(context: AuthorityContext, candidate: DecisionCandidate): DecisionContextDomain {
  const base: Omit<DecisionContextDomain, "integrity_hash"> = {
    domain_name: "operator_context",
    required: true,
    status: context.validation_state === "PASSED" ? "COMPLETE" : "UNAVAILABLE",
    source_subsystem: "authority-registry",
    originating_record: `operator_record_${context.operator_identity.operator_id}`,
    resolver: RESOLVER_VERSION,
    supporting_evidence: candidate.evidence_refs,
    confidence: context.validation_state === "PASSED" ? 1 : 0,
    governance_rationale: context.explainability.approval_reasoning,
    constitutional_rationale: context.advisory_only_status === "ENFORCED" ? "Advisory-only authority preserved." : "Advisory-only authority violated.",
    replay_reference: context.explainability.replay_reference,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function cacheEntry(context: AuthorityContext): AuthorityContextCache {
  const base: Omit<AuthorityContextCache, "integrity_hash"> = {
    cache_id: `authority_context_cache_${context.decision_candidate_id}_${AUTHORITY_VERSION}`,
    decision_candidate_id: context.decision_candidate_id,
    authority_context: context,
    authority_version: AUTHORITY_VERSION,
    timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function packageHash(pkg: Omit<AuthorityOperatorContextPackage, "integrity_hash"> | AuthorityOperatorContextPackage): string {
  const copy = { ...(pkg as AuthorityOperatorContextPackage) } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(copy);
}

export function resolveAuthorityOperatorContext(request: AuthorityOperatorContextRequest = createAuthorityOperatorContextRequest()): AuthorityOperatorContextPackage {
  const operator = operatorContext(request.operator_id);
  const approval = approvalAuthority(operator, request);
  const delegation = delegationAuthority(operator, request);
  const required = requiredApprovals(request);
  const escalation = escalationAuthority(operator, approval, request);
  const advisory_only_status: AdvisoryOnlyStatus = request.candidate.advisory_only ? "ENFORCED" : "VIOLATED";
  const validation = validationFor({ request, operator, approval, delegation, escalation, required, advisory_status: advisory_only_status });
  const resolvedOperator = operator ?? fallbackOperator();
  const context = authorityContext({ request, operator: resolvedOperator, approval, delegation, escalation, required, validation });
  const base: Omit<AuthorityOperatorContextPackage, "integrity_hash"> = {
    resolution_id: request.resolution_id,
    candidate_id: request.candidate.candidate_id,
    authority_context: context,
    operator_context: resolvedOperator,
    operator_domain: operatorDomain(context, request.candidate),
    cache_entry: cacheEntry(context),
    validation,
    replay_ref: `replay_authority_operator_${request.resolution_id}`,
    timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: packageHash(base) });
}

export function replayAuthorityOperatorContext(pkg: AuthorityOperatorContextPackage): AuthorityOperatorReplayResult {
  const reconstructed_hash = packageHash(pkg);
  const replay_valid = reconstructed_hash === pkg.integrity_hash;
  const base: Omit<AuthorityOperatorReplayResult, "integrity_hash"> = {
    replay_id: `replay_validation_${pkg.resolution_id}`,
    replay_valid,
    resolution_id: pkg.resolution_id,
    reconstructed_hash,
    expected_hash: pkg.integrity_hash,
    reconstructed_state: pkg.validation.validation_state,
    failures: replay_valid ? Object.freeze([]) : Object.freeze(["INTEGRITY_VERIFICATION_FAILED"] as const),
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

export function buildAuthorityOperatorObservability(packages: readonly AuthorityOperatorContextPackage[]): AuthorityOperatorObservability {
  const failures = packages.flatMap((pkg) => pkg.validation.failure_reasons);
  return Object.freeze({
    resolution_attempts: packages.length,
    successful_resolutions: packages.filter((pkg) => pkg.validation.validation_status === "PASS").length,
    failed_resolutions: packages.filter((pkg) => pkg.validation.validation_status === "FAIL").length,
    operator_failures: failures.filter((failure) => failure.startsWith("OPERATOR")).length,
    authority_failures: failures.filter((failure) => failure.startsWith("AUTHORITY") || failure.includes("APPROVAL_AUTHORITY")).length,
    delegation_failures: failures.filter((failure) => failure.startsWith("DELEGATION") || failure === "SELF_DELEGATION_ATTEMPT").length,
    escalation_failures: failures.filter((failure) => failure.startsWith("ESCALATION")).length,
    governance_failures: failures.filter((failure) => failure.startsWith("GOVERNANCE")).length,
    constitutional_failures: failures.filter((failure) => failure.startsWith("CONSTITUTIONAL")).length,
    advisory_failures: failures.filter((failure) => failure.includes("ADVISORY")).length,
    isolation_failures: failures.filter((failure) => failure.includes("TENANT") || failure === "CROSS_TENANT_AUTHORITY").length,
    replay_success_rate: packages.length === 0 ? 0 : packages.filter((pkg) => replayAuthorityOperatorContext(pkg).replay_valid).length / packages.length,
  });
}

export function getAuthorityOperatorContextResolver() {
  const request = createAuthorityOperatorContextRequest();
  const context_package = resolveAuthorityOperatorContext(request);
  return Object.freeze({
    resolution_order: RESOLUTION_ORDER,
    operator_registry: OPERATOR_REGISTRY,
    request,
    context_package,
    replay: replayAuthorityOperatorContext(context_package),
    observability: buildAuthorityOperatorObservability([context_package]),
  });
}
