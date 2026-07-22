import { createDecisionContext } from "@/services/decision-context-contract";
import { generateDecisionIntegrityHash } from "@/services/decision-integrity";
import { normalizeDecisionCandidateInput } from "@/services/decision-input-normalization";
import { createMissionTenantContextRequest, resolveMissionTenantContext } from "@/services/decision-mission-tenant-context";
import { createAuthorityOperatorContextRequest, resolveAuthorityOperatorContext } from "@/services/decision-authority-operator-context";
import { createEvidenceDependencyContextRequest, resolveEvidenceDependencyContext } from "@/services/decision-evidence-dependency-context";
import { createRiskConfidenceContextRequest, resolveRiskConfidenceContext } from "@/services/decision-risk-confidence-context";
import type { DecisionCandidate } from "@/types/decision-input-normalization";
import type { DecisionContextDomain } from "@/types/decision-context-contract";
import type {
  ConstitutionalCompliance,
  ConstitutionalContext,
  ConstitutionalEvaluation,
  ConstitutionalExplainability,
  ConstitutionalPrinciple,
  GovernanceConstitutionalContextPackage,
  GovernanceConstitutionalContextRequest,
  GovernanceConstitutionalFailureReason,
  GovernanceConstitutionalObservability,
  GovernanceConstitutionalReplayResult,
  GovernanceConstitutionalResolutionState,
  GovernanceConstitutionalValidationResult,
  GovernanceContext,
  GovernanceEvaluation,
  GovernanceExplainability,
  GovernancePolicy,
  GovernanceStatus,
  PolicyConflict,
} from "@/types/decision-governance-constitutional-context";

const NOW = "2026-07-02T09:33:00.000Z";
const RESOLVER_VERSION = "governance-constitutional-context-resolver/v1" as const;
const RESOLUTION_ORDER: readonly GovernanceConstitutionalResolutionState[] = Object.freeze([
  "POLICY_REPOSITORY_RESOLVED",
  "ACTIVE_POLICIES_RESOLVED",
  "APPLICABLE_RULES_RESOLVED",
  "GOVERNANCE_EVALUATED",
  "APPROVALS_RESOLVED",
  "REVIEWS_RESOLVED",
  "POLICY_CONFLICTS_DETECTED",
  "GOVERNANCE_VALIDATED",
  "CONSTITUTION_REPOSITORY_RESOLVED",
  "PRINCIPLES_RESOLVED",
  "CONSTITUTION_EVALUATED",
  "COMPLIANCE_ASSESSED",
  "CONSTRAINTS_RESOLVED",
  "VIOLATIONS_DETECTED",
  "CONSTITUTION_VALIDATED",
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

function makePolicy(input: Omit<GovernancePolicy, "integrity_hash">): GovernancePolicy {
  return Object.freeze({ ...input, integrity_hash: recordHash(input) });
}

function makePrinciple(input: Omit<ConstitutionalPrinciple, "integrity_hash">): ConstitutionalPrinciple {
  return Object.freeze({ ...input, integrity_hash: recordHash(input) });
}

const POLICY_REGISTRY: readonly GovernancePolicy[] = Object.freeze([
  makePolicy({
    policy_id: "policy_tenant_alpha_mission_phase_9_governance_review",
    tenant_id: "tenant_alpha",
    mission_id: "mission_phase_9_decision_orchestration",
    policy_type: "MISSION",
    policy_version: "9.3.6",
    precedence: 90,
    applicable_rules: Object.freeze(["rule_governance_context_required", "rule_policy_conflicts_preserved"]),
    approval_requirements: Object.freeze(["Governance Officer"]),
    review_requirements: Object.freeze(["Policy review"]),
    lineage_refs: Object.freeze(["lineage_policy_phase_9_governance_review_001"]),
    replay_refs: Object.freeze(["replay_policy_phase_9_governance_review_001"]),
  }),
  makePolicy({
    policy_id: "policy_tenant_alpha_phase_9_security_authority",
    tenant_id: "tenant_alpha",
    mission_id: "mission_phase_9_decision_orchestration",
    policy_type: "SECURITY",
    policy_version: "9.3.6",
    precedence: 80,
    applicable_rules: Object.freeze(["rule_no_hidden_execution", "rule_security_review_for_risk_context"]),
    approval_requirements: Object.freeze(["Security Authority"]),
    review_requirements: Object.freeze(["Security review"]),
    lineage_refs: Object.freeze(["lineage_policy_phase_9_security_001"]),
    replay_refs: Object.freeze(["replay_policy_phase_9_security_001"]),
  }),
  makePolicy({
    policy_id: "policy_tenant_alpha_phase_9_risk_review",
    tenant_id: "tenant_alpha",
    mission_id: "mission_phase_9_decision_orchestration",
    policy_type: "RISK",
    policy_version: "9.3.6",
    precedence: 70,
    applicable_rules: Object.freeze(["rule_moderate_risk_requires_review", "rule_confidence_calibration_traceable"]),
    approval_requirements: Object.freeze(["Risk Authority"]),
    review_requirements: Object.freeze(["Risk review"]),
    lineage_refs: Object.freeze(["lineage_policy_phase_9_risk_001"]),
    replay_refs: Object.freeze(["replay_policy_phase_9_risk_001"]),
  }),
  makePolicy({
    policy_id: "policy_tenant_beta_external_governance",
    tenant_id: "tenant_beta",
    mission_id: "mission_phase_9_decision_orchestration",
    policy_type: "APPROVAL",
    policy_version: "9.3.6",
    precedence: 100,
    applicable_rules: Object.freeze(["rule_beta_external_approval"]),
    approval_requirements: Object.freeze(["Executive Governance"]),
    review_requirements: Object.freeze(["Executive review"]),
    lineage_refs: Object.freeze(["lineage_policy_beta_001"]),
    replay_refs: Object.freeze(["replay_policy_beta_001"]),
  }),
]);

const CONSTITUTION_REGISTRY: readonly ConstitutionalPrinciple[] = Object.freeze([
  makePrinciple({
    principle_id: "constitution_governance_supremacy_v1",
    principle_name: "Governance supremacy",
    immutable: true,
    constraints: Object.freeze(["No governance bypass", "Governance context required"]),
    lineage_refs: Object.freeze(["lineage_constitution_governance_supremacy_001"]),
    replay_refs: Object.freeze(["replay_constitution_governance_supremacy_001"]),
  }),
  makePrinciple({
    principle_id: "constitution_advisory_only_v1",
    principle_name: "Advisory-only operation",
    immutable: true,
    constraints: Object.freeze(["No autonomous execution", "No authority escalation"]),
    lineage_refs: Object.freeze(["lineage_constitution_advisory_only_001"]),
    replay_refs: Object.freeze(["replay_constitution_advisory_only_001"]),
  }),
  makePrinciple({
    principle_id: "constitution_replay_integrity_v1",
    principle_name: "Replay fidelity and integrity preservation",
    immutable: true,
    constraints: Object.freeze(["No hidden execution", "Replay fidelity required", "Integrity preservation required"]),
    lineage_refs: Object.freeze(["lineage_constitution_replay_integrity_001"]),
    replay_refs: Object.freeze(["replay_constitution_replay_integrity_001"]),
  }),
  makePrinciple({
    principle_id: "constitution_tenant_isolation_v1",
    principle_name: "Tenant isolation",
    immutable: true,
    constraints: Object.freeze(["No tenant crossover"]),
    lineage_refs: Object.freeze(["lineage_constitution_tenant_isolation_001"]),
    replay_refs: Object.freeze(["replay_constitution_tenant_isolation_001"]),
  }),
]);

function defaultCandidate(): DecisionCandidate {
  const result = normalizeDecisionCandidateInput();
  if (!result.candidate) throw new Error("default normalized candidate unavailable");
  return result.candidate;
}

export function createGovernanceConstitutionalContextRequest(overrides: Partial<GovernanceConstitutionalContextRequest> = {}): GovernanceConstitutionalContextRequest {
  const candidate = overrides.candidate ?? defaultCandidate();
  const mission_tenant_package = overrides.mission_tenant_package ?? resolveMissionTenantContext(createMissionTenantContextRequest({ candidate }));
  const authority_operator_package = overrides.authority_operator_package ?? resolveAuthorityOperatorContext(createAuthorityOperatorContextRequest({ candidate, mission_tenant_package }));
  const evidence_dependency_package = overrides.evidence_dependency_package ?? resolveEvidenceDependencyContext(createEvidenceDependencyContextRequest({ candidate, mission_tenant_package, authority_operator_package }));
  return Object.freeze({
    resolution_id: overrides.resolution_id ?? `governance_constitutional_resolution_${candidate.candidate_id}`,
    candidate,
    base_context: overrides.base_context ?? createDecisionContext({ candidate }),
    mission_tenant_package,
    authority_operator_package,
    evidence_dependency_package,
    risk_confidence_package: overrides.risk_confidence_package ?? resolveRiskConfidenceContext(createRiskConfidenceContextRequest({ candidate, mission_tenant_package, authority_operator_package, evidence_dependency_package })),
    resolver_version: overrides.resolver_version ?? RESOLVER_VERSION,
  });
}

function activePolicies(candidate: DecisionCandidate): readonly GovernancePolicy[] {
  const requested = new Set(candidate.governance_refs);
  const scoped = POLICY_REGISTRY.filter((policy) => policy.tenant_id === candidate.tenant_id && policy.mission_id === candidate.mission_id);
  const direct = POLICY_REGISTRY.filter((policy) => requested.has(policy.policy_id));
  return Object.freeze([...new Map([...scoped, ...direct].map((policy) => [policy.policy_id, policy])).values()].sort((left, right) => left.precedence === right.precedence ? left.policy_id.localeCompare(right.policy_id) : right.precedence - left.precedence));
}

function governanceEvaluations(request: GovernanceConstitutionalContextRequest, policies: readonly GovernancePolicy[]): readonly GovernanceEvaluation[] {
  const riskReviewRequired = request.risk_confidence_package?.risk_context.risk_severity === "Moderate" || request.risk_confidence_package?.risk_context.risk_severity === "High" || request.risk_confidence_package?.risk_context.risk_severity === "Critical";
  return Object.freeze(policies.map((policy) => {
    const violations = Object.freeze(policy.tenant_id === request.candidate.tenant_id ? [] : ["cross_tenant_policy_reference"]);
    const recommendations = Object.freeze([
      ...(policy.policy_type === "RISK" && riskReviewRequired ? ["complete_risk_authority_review_before_orchestration"] : []),
      ...(request.evidence_dependency_package?.evidence_context.conflicting_evidence.length ? ["preserve_conflicting_governance_evidence"] : []),
    ]);
    const base: Omit<GovernanceEvaluation, "integrity_hash"> = {
      policy_id: policy.policy_id,
      applicable: true,
      satisfied: violations.length === 0,
      exceptions: Object.freeze([]),
      violations,
      recommendations,
      dependencies: Object.freeze([...policy.approval_requirements, ...policy.review_requirements].sort()),
      rationale: `${policy.policy_type} policy ${policy.policy_id} applied by precedence ${policy.precedence}.`,
    };
    return Object.freeze({ ...base, integrity_hash: recordHash(base) });
  }));
}

function policyConflicts(policies: readonly GovernancePolicy[]): readonly PolicyConflict[] {
  const approvalPolicies = policies.filter((policy) => policy.approval_requirements.length > 0);
  if (approvalPolicies.length < 2) return Object.freeze([]);
  const highest = approvalPolicies[0];
  const base: Omit<PolicyConflict, "integrity_hash"> = {
    conflict_id: "policy_conflict_phase_9_approval_precedence",
    policy_refs: Object.freeze(approvalPolicies.map((policy) => policy.policy_id).sort()),
    conflict_type: "PRECEDENCE",
    resolved: true,
    resolution_basis: `highest_precedence_policy:${highest.policy_id}`,
    lineage_refs: Object.freeze(approvalPolicies.flatMap((policy) => policy.lineage_refs).sort()),
  };
  return Object.freeze([Object.freeze({ ...base, integrity_hash: recordHash(base) })]);
}

function governanceStatus(evaluations: readonly GovernanceEvaluation[], conflicts: readonly PolicyConflict[]): GovernanceStatus {
  if (evaluations.some((evaluation) => evaluation.violations.length > 0)) return "Non-Compliant";
  if (conflicts.some((conflict) => !conflict.resolved)) return "Escalation Required";
  if (evaluations.some((evaluation) => evaluation.recommendations.length > 0)) return "Review Required";
  return "Compliant";
}

function governanceExplainability(input: { policies: readonly GovernancePolicy[]; evaluations: readonly GovernanceEvaluation[]; conflicts: readonly PolicyConflict[] }): GovernanceExplainability {
  const base: Omit<GovernanceExplainability, "integrity_hash"> = {
    applicable_policy_rationale: Object.freeze(input.policies.map((policy) => `${policy.policy_id}:${policy.policy_type}:precedence_${policy.precedence}`)),
    evaluation_results: Object.freeze(input.evaluations.map((evaluation) => `${evaluation.policy_id}:${evaluation.satisfied ? "satisfied" : "violated"}`)),
    approval_rationale: Object.freeze(input.policies.flatMap((policy) => policy.approval_requirements).sort()),
    review_rationale: Object.freeze(input.policies.flatMap((policy) => policy.review_requirements).sort()),
    conflict_reasoning: Object.freeze(input.conflicts.map((conflict) => `${conflict.conflict_id}:${conflict.resolution_basis}`)),
    replay_references: Object.freeze(input.policies.flatMap((policy) => policy.replay_refs).sort()),
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function principlesFor(_candidate: DecisionCandidate): readonly ConstitutionalPrinciple[] {
  return CONSTITUTION_REGISTRY;
}

function constitutionalEvaluations(request: GovernanceConstitutionalContextRequest, principles: readonly ConstitutionalPrinciple[], governance: GovernanceContext): readonly ConstitutionalEvaluation[] {
  const evidenceRefs = request.evidence_dependency_package?.evidence_context.evidence_lineage ?? Object.freeze([]);
  return Object.freeze(principles.map((principle) => {
    const remediation = Object.freeze([
      ...(principle.principle_id === "constitution_advisory_only_v1" && !request.candidate.advisory_only ? ["restore_advisory_only_constraint"] : []),
      ...(principle.principle_id === "constitution_tenant_isolation_v1" && request.candidate.governance_refs.some((ref) => ref.includes("tenant_beta")) ? ["remove_cross_tenant_reference"] : []),
      ...(principle.principle_id === "constitution_governance_supremacy_v1" && governance.active_policies.length === 0 ? ["resolve_governance_policy_repository"] : []),
    ]);
    const base: Omit<ConstitutionalEvaluation, "integrity_hash"> = {
      principle_id: principle.principle_id,
      applicable: true,
      compliant: remediation.length === 0,
      supporting_evidence: Object.freeze([...evidenceRefs, ...governance.governance_lineage].sort()),
      validation_results: Object.freeze(remediation.length === 0 ? ["compliant"] : ["remediation_required"]),
      required_remediation: remediation,
      rationale: `${principle.principle_name} evaluated deterministically for ${request.candidate.candidate_id}.`,
    };
    return Object.freeze({ ...base, integrity_hash: recordHash(base) });
  }));
}

function constitutionalCompliance(evaluations: readonly ConstitutionalEvaluation[]): ConstitutionalCompliance {
  if (evaluations.some((evaluation) => evaluation.required_remediation.length > 0)) return "Non-Compliant";
  if (evaluations.some((evaluation) => evaluation.validation_results.includes("review_required"))) return "Review Required";
  return "Compliant";
}

function constitutionalExplainability(input: { principles: readonly ConstitutionalPrinciple[]; evaluations: readonly ConstitutionalEvaluation[]; constraints: readonly string[]; violations: readonly string[] }): ConstitutionalExplainability {
  const base: Omit<ConstitutionalExplainability, "integrity_hash"> = {
    principles_applied: Object.freeze(input.principles.map((principle) => principle.principle_id)),
    compliance_determination: input.evaluations.every((evaluation) => evaluation.compliant) ? "All applicable principles compliant." : "One or more principles require remediation.",
    constraint_enforcement: input.constraints,
    violation_rationale: input.violations,
    replay_references: Object.freeze(input.principles.flatMap((principle) => principle.replay_refs).sort()),
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function validationFor(request: GovernanceConstitutionalContextRequest, policies: readonly GovernancePolicy[], evaluations: readonly GovernanceEvaluation[], conflicts: readonly PolicyConflict[], principles: readonly ConstitutionalPrinciple[], constitutionalEvaluationsResult: readonly ConstitutionalEvaluation[], violations: readonly string[]): GovernanceConstitutionalValidationResult {
  const crossTenant = policies.some((policy) => policy.tenant_id !== request.candidate.tenant_id) || request.candidate.governance_refs.some((ref) => ref.includes("tenant_beta"));
  const lineageComplete = policies.every((policy) => policy.lineage_refs.length > 0) && principles.every((principle) => principle.lineage_refs.length > 0);
  const replayCompatible = request.evidence_dependency_package?.validation.validation_status === "PASS" && request.risk_confidence_package?.validation.validation_status === "PASS";
  const upstreamIntegrityFailed = request.mission_tenant_package?.validation.validation_status === "FAIL" || request.authority_operator_package?.validation.validation_status === "FAIL";
  const failures: GovernanceConstitutionalFailureReason[] = [
    ...(POLICY_REGISTRY.length === 0 ? ["POLICY_REPOSITORY_UNAVAILABLE" as const] : []),
    ...(policies.length === 0 ? ["APPLICABLE_POLICIES_UNRESOLVED" as const] : []),
    ...(evaluations.length !== policies.length ? ["GOVERNANCE_EVALUATION_INCOMPLETE" as const] : []),
    ...(evaluations.length === 0 ? ["GOVERNANCE_STATUS_UNDETERMINED" as const] : []),
    ...(policies.some((policy) => policy.approval_requirements.length === 0) ? ["APPROVALS_UNRESOLVED" as const] : []),
    ...(policies.some((policy) => policy.review_requirements.length === 0) ? ["REVIEWS_UNRESOLVED" as const] : []),
    ...(conflicts.some((conflict) => !conflict.resolved) ? ["POLICY_CONFLICT_UNRESOLVED" as const] : []),
    ...(principles.length === 0 ? ["CONSTITUTIONAL_PRINCIPLES_UNAVAILABLE" as const] : []),
    ...(constitutionalEvaluationsResult.length !== principles.length ? ["CONSTITUTIONAL_EVALUATION_INCOMPLETE" as const] : []),
    ...(constitutionalEvaluationsResult.length === 0 ? ["CONSTITUTIONAL_COMPLIANCE_UNDETERMINED" as const] : []),
    ...(principles.some((principle) => principle.constraints.length === 0) ? ["CONSTITUTIONAL_CONSTRAINTS_UNENFORCED" as const] : []),
    ...(violations.length ? ["CONSTITUTIONAL_VIOLATION_DETECTED" as const] : []),
    ...(!lineageComplete ? ["LINEAGE_INCOMPLETE" as const] : []),
    ...(!replayCompatible ? ["REPLAY_INCOMPATIBLE" as const] : []),
    ...(crossTenant ? ["CROSS_TENANT_GOVERNANCE_REFERENCE" as const] : []),
    ...(upstreamIntegrityFailed ? ["INTEGRITY_VERIFICATION_FAILED" as const] : []),
  ];
  const unique = Object.freeze([...new Set(failures)]);
  const state: GovernanceConstitutionalResolutionState =
    unique.includes("CROSS_TENANT_GOVERNANCE_REFERENCE") ? "FAILED_ISOLATION"
      : unique.some((failure) => failure.includes("CONSTITUTIONAL")) ? "FAILED_CONSTITUTIONAL"
        : unique.includes("INTEGRITY_VERIFICATION_FAILED") ? "FAILED_INTEGRITY"
          : unique.length ? "FAILED_GOVERNANCE"
            : "PASSED";
  return Object.freeze({
    validation_status: unique.length ? "FAIL" : "PASS",
    validation_state: state,
    failure_reason: unique[0],
    failure_reasons: unique,
    checks: Object.freeze({
      policies_identified: policies.length > 0,
      governance_evaluations_complete: evaluations.length === policies.length,
      governance_status_determined: evaluations.length > 0,
      approvals_resolved: policies.every((policy) => policy.approval_requirements.length > 0),
      reviews_resolved: policies.every((policy) => policy.review_requirements.length > 0),
      policy_conflicts_resolved: conflicts.every((conflict) => conflict.resolved),
      principles_resolved: principles.length > 0,
      constitutional_evaluations_complete: constitutionalEvaluationsResult.length === principles.length,
      compliance_determined: constitutionalEvaluationsResult.length > 0,
      constraints_enforced: principles.every((principle) => principle.constraints.length > 0),
      violations_absent: violations.length === 0,
      lineage_preserved: lineageComplete,
      replay_compatible: replayCompatible,
      tenant_isolated: !crossTenant,
      integrity_verified: !upstreamIntegrityFailed,
    }),
  });
}

function governanceContext(request: GovernanceConstitutionalContextRequest, policies: readonly GovernancePolicy[], evaluations: readonly GovernanceEvaluation[], conflicts: readonly PolicyConflict[], validation: GovernanceConstitutionalValidationResult): GovernanceContext {
  const approvals = Object.freeze([...new Set(policies.flatMap((policy) => policy.approval_requirements))].sort());
  const reviews = Object.freeze([...new Set([
    ...policies.flatMap((policy) => policy.review_requirements),
    ...(request.risk_confidence_package?.risk_context.risk_severity === "Moderate" ? ["Constitutional review"] : []),
  ])].sort());
  const base: Omit<GovernanceContext, "integrity_hash"> = {
    governance_context_id: `governance_context_${request.candidate.candidate_id}`,
    decision_candidate_id: request.candidate.candidate_id,
    active_policies: policies,
    applicable_rules: Object.freeze([...new Set(policies.flatMap((policy) => policy.applicable_rules))].sort()),
    governance_evaluations: evaluations,
    governance_status: governanceStatus(evaluations, conflicts),
    governance_approvals: approvals,
    required_reviews: reviews,
    policy_conflicts: conflicts,
    governance_lineage: Object.freeze(policies.flatMap((policy) => policy.lineage_refs).sort()),
    validation_state: validation.validation_state,
    explainability: governanceExplainability({ policies, evaluations, conflicts }),
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function constitutionalContext(request: GovernanceConstitutionalContextRequest, governance: GovernanceContext, validation: GovernanceConstitutionalValidationResult): ConstitutionalContext {
  const principles = principlesFor(request.candidate);
  const evaluations = constitutionalEvaluations(request, principles, governance);
  const constraints = Object.freeze([...new Set(principles.flatMap((principle) => principle.constraints))].sort());
  const violations = Object.freeze(evaluations.flatMap((evaluation) => evaluation.required_remediation));
  const base: Omit<ConstitutionalContext, "integrity_hash"> = {
    constitutional_context_id: `constitutional_context_${request.candidate.candidate_id}`,
    decision_candidate_id: request.candidate.candidate_id,
    constitutional_principles: principles,
    constitutional_evaluations: evaluations,
    constitutional_compliance: constitutionalCompliance(evaluations),
    constitutional_constraints: constraints,
    constitutional_violations: violations,
    constitutional_lineage: Object.freeze(principles.flatMap((principle) => principle.lineage_refs).sort()),
    validation_state: validation.validation_state,
    explainability: constitutionalExplainability({ principles, evaluations, constraints, violations }),
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function governanceDomain(context: GovernanceContext, candidate: DecisionCandidate): DecisionContextDomain {
  const base: Omit<DecisionContextDomain, "integrity_hash"> = {
    domain_name: "governance_context",
    required: true,
    status: context.validation_state === "PASSED" ? "COMPLETE" : "UNAVAILABLE",
    source_subsystem: "governance-intelligence",
    originating_record: context.governance_context_id,
    resolver: RESOLVER_VERSION,
    supporting_evidence: Object.freeze(context.active_policies.map((policy) => policy.policy_id)),
    confidence: context.governance_status === "Compliant" || context.governance_status === "Review Required" ? 0.92 : 0,
    governance_rationale: `${context.governance_status} governance status resolved for ${candidate.candidate_id}.`,
    constitutional_rationale: "Governance supremacy and policy traceability preserved.",
    replay_reference: `replay_governance_context_${candidate.candidate_id}`,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function constitutionalDomain(context: ConstitutionalContext, candidate: DecisionCandidate): DecisionContextDomain {
  const base: Omit<DecisionContextDomain, "integrity_hash"> = {
    domain_name: "constitutional_context",
    required: true,
    status: context.validation_state === "PASSED" ? "COMPLETE" : "UNAVAILABLE",
    source_subsystem: "constitution-engine",
    originating_record: context.constitutional_context_id,
    resolver: RESOLVER_VERSION,
    supporting_evidence: Object.freeze(context.constitutional_principles.map((principle) => principle.principle_id)),
    confidence: context.constitutional_compliance === "Compliant" ? 1 : 0,
    governance_rationale: "Constitutional supremacy evaluated before orchestration.",
    constitutional_rationale: `${context.constitutional_compliance} constitutional compliance with ${context.constitutional_constraints.length} constraints.`,
    replay_reference: `replay_constitutional_context_${candidate.candidate_id}`,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function packageHash(pkg: Omit<GovernanceConstitutionalContextPackage, "integrity_hash"> | GovernanceConstitutionalContextPackage): string {
  const copy = { ...(pkg as GovernanceConstitutionalContextPackage) } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(copy);
}

export function resolveGovernanceConstitutionalContext(request: GovernanceConstitutionalContextRequest = createGovernanceConstitutionalContextRequest()): GovernanceConstitutionalContextPackage {
  const policies = activePolicies(request.candidate);
  const evaluations = governanceEvaluations(request, policies);
  const conflicts = policyConflicts(policies);
  const principles = principlesFor(request.candidate);
  const preliminaryGovernance = governanceContext(request, policies, evaluations, conflicts, {
    validation_status: "PASS",
    validation_state: "PASSED",
    failure_reasons: Object.freeze([]),
    checks: Object.freeze({
      policies_identified: true,
      governance_evaluations_complete: true,
      governance_status_determined: true,
      approvals_resolved: true,
      reviews_resolved: true,
      policy_conflicts_resolved: true,
      principles_resolved: true,
      constitutional_evaluations_complete: true,
      compliance_determined: true,
      constraints_enforced: true,
      violations_absent: true,
      lineage_preserved: true,
      replay_compatible: true,
      tenant_isolated: true,
      integrity_verified: true,
    }),
  });
  const constitutionalEvaluationsResult = constitutionalEvaluations(request, principles, preliminaryGovernance);
  const violations = Object.freeze(constitutionalEvaluationsResult.flatMap((evaluation) => evaluation.required_remediation));
  const validation = validationFor(request, policies, evaluations, conflicts, principles, constitutionalEvaluationsResult, violations);
  const governance_context = governanceContext(request, policies, evaluations, conflicts, validation);
  const constitutional_context = constitutionalContext(request, governance_context, validation);
  const base: Omit<GovernanceConstitutionalContextPackage, "integrity_hash"> = {
    resolution_id: request.resolution_id,
    candidate_id: request.candidate.candidate_id,
    governance_context,
    constitutional_context,
    governance_domain: governanceDomain(governance_context, request.candidate),
    constitutional_domain: constitutionalDomain(constitutional_context, request.candidate),
    validation,
    replay_ref: `replay_governance_constitutional_${request.resolution_id}`,
    timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: packageHash(base) });
}

export function replayGovernanceConstitutionalContext(pkg: GovernanceConstitutionalContextPackage): GovernanceConstitutionalReplayResult {
  const reconstructed_hash = packageHash(pkg);
  const replay_valid = reconstructed_hash === pkg.integrity_hash;
  const base: Omit<GovernanceConstitutionalReplayResult, "integrity_hash"> = {
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

export function buildGovernanceConstitutionalObservability(packages: readonly GovernanceConstitutionalContextPackage[]): GovernanceConstitutionalObservability {
  const failures = packages.flatMap((pkg) => pkg.validation.failure_reasons);
  return Object.freeze({
    resolution_attempts: packages.length,
    successful_resolutions: packages.filter((pkg) => pkg.validation.validation_status === "PASS").length,
    failed_resolutions: packages.filter((pkg) => pkg.validation.validation_status === "FAIL").length,
    governance_failures: failures.filter((failure) => failure.includes("POLICY") || failure.includes("GOVERNANCE") || failure.includes("APPROVALS") || failure.includes("REVIEWS")).length,
    constitutional_failures: failures.filter((failure) => failure.includes("CONSTITUTIONAL")).length,
    isolation_failures: failures.filter((failure) => failure === "CROSS_TENANT_GOVERNANCE_REFERENCE").length,
    integrity_failures: failures.filter((failure) => failure === "INTEGRITY_VERIFICATION_FAILED").length,
    policy_conflict_count: packages.reduce((count, pkg) => count + pkg.governance_context.policy_conflicts.length, 0),
    constitutional_violation_count: packages.reduce((count, pkg) => count + pkg.constitutional_context.constitutional_violations.length, 0),
    replay_success_rate: packages.length === 0 ? 0 : packages.filter((pkg) => replayGovernanceConstitutionalContext(pkg).replay_valid).length / packages.length,
  });
}

export function getGovernanceConstitutionalContextResolver() {
  const request = createGovernanceConstitutionalContextRequest();
  const context_package = resolveGovernanceConstitutionalContext(request);
  return Object.freeze({
    resolution_order: RESOLUTION_ORDER,
    policy_registry: POLICY_REGISTRY,
    constitution_registry: CONSTITUTION_REGISTRY,
    request,
    context_package,
    replay: replayGovernanceConstitutionalContext(context_package),
    observability: buildGovernanceConstitutionalObservability([context_package]),
  });
}
