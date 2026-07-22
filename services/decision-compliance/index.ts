import crypto from "crypto";
import { createAuthorityBoundaryRecord, validateAuthorityBoundary } from "@/services/decision-authority-boundary";
import type { AuthorityBoundaryRecord } from "@/types/decision-authority-boundary";
import type {
  ComplianceAuditRecord,
  ComplianceEvaluation,
  ComplianceFailure,
  ComplianceMetadata,
  ComplianceObservability,
  ComplianceReplayResult,
  ComplianceState,
  ComplianceValidationResult,
  ConstitutionalMappingRecord,
  ConstitutionalReferenceContract,
  DecisionComplianceInput,
  GovernanceReferenceContract,
  PolicyMappingRecord,
  PolicyType,
} from "@/types/decision-compliance";
import type { DecisionType } from "@/types/decision-schema";

const NOW = "2026-07-02T09:16:00.000Z";
const SUPPORTED_POLICY_VERSION = "policy/v1";
const SUPPORTED_CONSTITUTIONAL_VERSION = "constitution/v1";

const POLICY_BY_DECISION_TYPE: Readonly<Record<DecisionType, readonly (readonly [string, PolicyType, string])[]>> = Object.freeze({
  PLAN_SELECTION: Object.freeze([["policy_plan_selection_governance", "GOVERNANCE", "Plan decisions require policy, evidence, and operator visibility."] as const]),
  RECOMMENDATION_SELECTION: Object.freeze([["policy_advisory_recommendation", "GOVERNANCE", "Recommendation selection remains advisory-only."] as const]),
  RISK_RESPONSE: Object.freeze([["policy_risk_response", "GOVERNANCE", "Risk responses require governance assessment."] as const]),
  RECOVERY_OPTION: Object.freeze([["policy_recovery_option", "MISSION", "Recovery decisions require bounded recovery governance."] as const]),
  GOVERNANCE_ESCALATION: Object.freeze([["policy_governance_escalation", "GOVERNANCE", "Escalations require governance traceability."] as const]),
  POLICY_CONFLICT: Object.freeze([["policy_conflict_resolution", "GOVERNANCE", "Policy conflicts require deterministic policy precedence."] as const]),
  MISSION_HEALTH_ACTION: Object.freeze([["policy_mission_health_action", "MISSION", "Mission health actions require health evidence."] as const]),
  FORECAST_RESPONSE: Object.freeze([["policy_forecast_response", "GOVERNANCE", "Forecast responses require confidence evidence."] as const]),
  OPERATOR_INTERVENTION: Object.freeze([["policy_operator_intervention", "AUTHORITY", "Operator interventions require authority verification."] as const]),
  CERTIFICATION_DECISION: Object.freeze([["policy_certification_decision", "CERTIFICATION", "Certification decisions require certification evidence."] as const]),
  CONTINUATION_DECISION: Object.freeze([["policy_continuation_decision", "GOVERNANCE", "Continuation decisions require governance and mission policy."] as const]),
  DEFERRAL_DECISION: Object.freeze([["policy_deferral_decision", "GOVERNANCE", "Deferrals require outstanding requirement evidence."] as const]),
});

const BASE_CONSTITUTION_RULES = Object.freeze([
  ["constitution_operator_supremacy", "Operator supremacy must be preserved."] as const,
  ["constitution_advisory_only", "Decision orchestration cannot execute actions."] as const,
  ["constitution_governance_supremacy", "Governance cannot be bypassed."] as const,
]);

const CONSTITUTION_BY_DECISION_TYPE: Readonly<Record<DecisionType, readonly (readonly [string, string])[]>> = Object.freeze({
  PLAN_SELECTION: BASE_CONSTITUTION_RULES,
  RECOMMENDATION_SELECTION: BASE_CONSTITUTION_RULES,
  RISK_RESPONSE: BASE_CONSTITUTION_RULES,
  RECOVERY_OPTION: BASE_CONSTITUTION_RULES,
  GOVERNANCE_ESCALATION: BASE_CONSTITUTION_RULES,
  POLICY_CONFLICT: BASE_CONSTITUTION_RULES,
  MISSION_HEALTH_ACTION: BASE_CONSTITUTION_RULES,
  FORECAST_RESPONSE: BASE_CONSTITUTION_RULES,
  OPERATOR_INTERVENTION: BASE_CONSTITUTION_RULES,
  CERTIFICATION_DECISION: BASE_CONSTITUTION_RULES,
  CONTINUATION_DECISION: BASE_CONSTITUTION_RULES,
  DEFERRAL_DECISION: BASE_CONSTITUTION_RULES,
});

function canonicalize(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return `[${value.map((item) => canonicalize(item)).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().filter((key) => record[key] !== undefined).map((key) => `${JSON.stringify(key)}:${canonicalize(record[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function hashValue(value: unknown): string {
  return crypto.createHash("sha256").update(canonicalize(value), "utf8").digest("hex");
}

function stripHash(value: Record<string, unknown>): Record<string, unknown> {
  const copy = { ...value };
  delete copy.integrity_hash;
  return copy;
}

function hashRecord(value: Record<string, unknown>): string {
  return hashValue(stripHash(value));
}

function makeGovernanceReference(authority: AuthorityBoundaryRecord, policy_id: string, policy_type: PolicyType, scenario?: DecisionComplianceInput["scenario"]): GovernanceReferenceContract {
  const base: Omit<GovernanceReferenceContract, "integrity_hash"> = {
    governance_reference_id: `govref_${authority.orchestration_id}_${policy_id}`,
    tenant_id: scenario === "TENANT_LEAK" ? "tenant_beta" : authority.tenant_id,
    mission_id: authority.mission_id,
    policy_id,
    policy_version: scenario === "UNSUPPORTED_POLICY" ? "policy/v999" : SUPPORTED_POLICY_VERSION,
    policy_category: policy_type,
    governance_scope: authority.decision_type,
    compliance_status: "COMPLIANT",
    authority_requirements: authority.approval_chain,
    evidence_refs: Object.freeze([`evidence_${authority.orchestration_id}_${policy_id}`]),
    replay_refs: scenario === "REPLAY_MISSING" ? Object.freeze([]) : Object.freeze([`replay_${authority.orchestration_id}_${policy_id}`]),
    lineage_refs: scenario === "LINEAGE_BROKEN" ? Object.freeze([]) : Object.freeze([`lineage_${authority.orchestration_id}_${policy_id}`]),
    validated_at: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: hashRecord(base) });
}

function makeConstitutionalReference(authority: AuthorityBoundaryRecord, rule_id: string, scenario?: DecisionComplianceInput["scenario"]): ConstitutionalReferenceContract {
  const base: Omit<ConstitutionalReferenceContract, "integrity_hash"> = {
    constitutional_reference_id: `conref_${authority.orchestration_id}_${rule_id}`,
    tenant_id: scenario === "TENANT_LEAK" ? "tenant_beta" : authority.tenant_id,
    mission_id: authority.mission_id,
    constitutional_rule_id: rule_id,
    constitutional_version: scenario === "UNSUPPORTED_CONSTITUTION" ? "constitution/v999" : SUPPORTED_CONSTITUTIONAL_VERSION,
    constitutional_scope: authority.decision_type,
    validation_status: "COMPLIANT",
    authority_constraints: Object.freeze(["advisory-only", "operator-supremacy", "governance-supremacy"]),
    evidence_refs: Object.freeze([`evidence_${authority.orchestration_id}_${rule_id}`]),
    replay_refs: scenario === "REPLAY_MISSING" ? Object.freeze([]) : Object.freeze([`replay_${authority.orchestration_id}_${rule_id}`]),
    lineage_refs: scenario === "LINEAGE_BROKEN" ? Object.freeze([]) : Object.freeze([`lineage_${authority.orchestration_id}_${rule_id}`]),
    validated_at: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: hashRecord(base) });
}

export function resolveApplicablePolicies(authority_record: AuthorityBoundaryRecord): readonly PolicyMappingRecord[] {
  return Object.freeze(POLICY_BY_DECISION_TYPE[authority_record.decision_type].map(([policy_id, policy_type, reason]) => {
    const base: Omit<PolicyMappingRecord, "integrity_hash"> = {
      mapping_id: `polmap_${authority_record.orchestration_id}_${policy_id}`,
      orchestration_id: authority_record.orchestration_id,
      policy_id,
      policy_version: SUPPORTED_POLICY_VERSION,
      policy_type,
      applicability_reason: reason,
      mapping_status: "APPLICABLE",
      validated_at: NOW,
    };
    return Object.freeze({ ...base, integrity_hash: hashRecord(base) });
  }));
}

export function resolveConstitutionalRules(authority_record: AuthorityBoundaryRecord): readonly ConstitutionalMappingRecord[] {
  return Object.freeze(CONSTITUTION_BY_DECISION_TYPE[authority_record.decision_type].map(([rule_id, reason]) => {
    const base: Omit<ConstitutionalMappingRecord, "integrity_hash"> = {
      mapping_id: `conmap_${authority_record.orchestration_id}_${rule_id}`,
      orchestration_id: authority_record.orchestration_id,
      constitutional_rule_id: rule_id,
      constitutional_version: SUPPORTED_CONSTITUTIONAL_VERSION,
      applicability_reason: reason,
      validation_status: "APPLICABLE",
    };
    return Object.freeze({ ...base, integrity_hash: hashRecord(base) });
  }));
}

export function verifyDecisionAuthority(authority_record: AuthorityBoundaryRecord): ComplianceState {
  return validateAuthorityBoundary(authority_record).validation_status === "FAILED_CLOSED" ? "AUTHORITY_VIOLATION" : "COMPLIANT";
}

function stateForFailures(failures: readonly ComplianceFailure[]): ComplianceState {
  if (failures.includes("CONSTITUTIONAL_REFERENCE_MISSING") || failures.includes("CONSTITUTIONAL_RULE_MISSING") || failures.includes("CONSTITUTIONAL_VERSION_UNSUPPORTED") || failures.includes("CONSTITUTIONAL_BYPASS")) return "CONSTITUTIONAL_VIOLATION";
  if (failures.includes("GOVERNANCE_REFERENCE_MISSING") || failures.includes("POLICY_VERSION_UNSUPPORTED") || failures.includes("GOVERNANCE_BYPASS")) return "GOVERNANCE_VIOLATION";
  if (failures.includes("AUTHORITY_VALIDATION_FAILED")) return "AUTHORITY_VIOLATION";
  return failures.length ? "NON_COMPLIANT" : "COMPLIANT";
}

export function createComplianceEvaluation(input: DecisionComplianceInput = {}): ComplianceEvaluation {
  const authority_record = input.authority_record ?? createAuthorityBoundaryRecord(input.scenario === "AUTHORITY_VIOLATION" ? { scenario: "EXECUTION_REQUEST" } : {});
  const policies = resolveApplicablePolicies(authority_record);
  const constitutionalRules = resolveConstitutionalRules(authority_record);
  const governance_references = input.scenario === "MISSING_GOVERNANCE" ? Object.freeze([]) : input.governance_references ?? Object.freeze(policies.map((policy) => makeGovernanceReference(authority_record, policy.policy_id, policy.policy_type, input.scenario)));
  const constitutional_references = input.scenario === "MISSING_CONSTITUTIONAL" ? Object.freeze([]) : input.constitutional_references ?? Object.freeze(constitutionalRules.map((rule) => makeConstitutionalReference(authority_record, rule.constitutional_rule_id, input.scenario)));
  const failures = collectFailures({ authority_record, governance_references, constitutional_references, policy_mappings: policies, constitutional_mappings: constitutionalRules, scenario: input.scenario });
  const compliance_state = stateForFailures(failures);
  const metadataBase: Omit<ComplianceMetadata, "integrity_hash"> = {
    compliance_id: `comp_${authority_record.orchestration_id}`,
    orchestration_id: authority_record.orchestration_id,
    governance_status: failures.some((failure) => failure.startsWith("GOVERNANCE") || failure === "POLICY_VERSION_UNSUPPORTED") ? "GOVERNANCE_VIOLATION" : "COMPLIANT",
    constitutional_status: failures.some((failure) => failure.startsWith("CONSTITUTIONAL")) ? "CONSTITUTIONAL_VIOLATION" : "COMPLIANT",
    authority_status: failures.includes("AUTHORITY_VALIDATION_FAILED") ? "AUTHORITY_VIOLATION" : "COMPLIANT",
    evaluated_policies: Object.freeze(policies.map((policy) => policy.policy_id).sort()),
    evaluated_constitutional_rules: Object.freeze(constitutionalRules.map((rule) => rule.constitutional_rule_id).sort()),
    replay_refs: Object.freeze([...governance_references.flatMap((ref) => ref.replay_refs), ...constitutional_references.flatMap((ref) => ref.replay_refs)].sort()),
    lineage_refs: Object.freeze([...governance_references.flatMap((ref) => ref.lineage_refs), ...constitutional_references.flatMap((ref) => ref.lineage_refs)].sort()),
    evaluated_at: NOW,
  };
  const metadata = Object.freeze({ ...metadataBase, integrity_hash: hashRecord(metadataBase) });
  const auditBase: Omit<ComplianceAuditRecord, "integrity_hash"> = {
    audit_id: `audit_${metadata.compliance_id}`,
    compliance_id: metadata.compliance_id,
    orchestration_id: authority_record.orchestration_id,
    compliance_state,
    governance_reference_ids: Object.freeze(governance_references.map((ref) => ref.governance_reference_id).sort()),
    constitutional_reference_ids: Object.freeze(constitutional_references.map((ref) => ref.constitutional_reference_id).sort()),
    policy_mapping_ids: Object.freeze(policies.map((policy) => policy.mapping_id).sort()),
    constitutional_mapping_ids: Object.freeze(constitutionalRules.map((rule) => rule.mapping_id).sort()),
    authority_id: authority_record.authority_id,
    append_only: true,
    advisory_only: true,
    recorded_at: NOW,
  };
  const audit_record = Object.freeze({ ...auditBase, integrity_hash: hashRecord(auditBase) });
  const base: Omit<ComplianceEvaluation, "integrity_hash"> = {
    compliance_id: metadata.compliance_id,
    orchestration_id: authority_record.orchestration_id,
    tenant_id: authority_record.tenant_id,
    mission_id: authority_record.mission_id,
    decision_type: authority_record.decision_type,
    governance_references,
    constitutional_references,
    policy_mappings: policies,
    constitutional_mappings: constitutionalRules,
    authority_record,
    metadata,
    audit_record,
    compliance_state,
    failures,
    advisory_only: true,
  };
  const evaluation = Object.freeze({ ...base, integrity_hash: hashRecord(base) });
  return input.scenario === "INTEGRITY_MISMATCH" ? Object.freeze({ ...evaluation, integrity_hash: "tampered" }) : evaluation;
}

function collectFailures(input: {
  authority_record: AuthorityBoundaryRecord;
  governance_references: readonly GovernanceReferenceContract[];
  constitutional_references: readonly ConstitutionalReferenceContract[];
  policy_mappings: readonly PolicyMappingRecord[];
  constitutional_mappings: readonly ConstitutionalMappingRecord[];
  scenario?: DecisionComplianceInput["scenario"];
}): readonly ComplianceFailure[] {
  const failures: ComplianceFailure[] = [];
  if (input.governance_references.length === 0) failures.push("GOVERNANCE_REFERENCE_MISSING");
  if (input.constitutional_references.length === 0) failures.push("CONSTITUTIONAL_REFERENCE_MISSING");
  if (input.policy_mappings.length === 0) failures.push("GOVERNANCE_REFERENCE_MISSING");
  if (input.constitutional_mappings.length === 0) failures.push("CONSTITUTIONAL_RULE_MISSING");
  if (input.governance_references.some((ref) => ref.policy_version !== SUPPORTED_POLICY_VERSION)) failures.push("POLICY_VERSION_UNSUPPORTED");
  if (input.constitutional_references.some((ref) => ref.constitutional_version !== SUPPORTED_CONSTITUTIONAL_VERSION)) failures.push("CONSTITUTIONAL_VERSION_UNSUPPORTED");
  if (verifyDecisionAuthority(input.authority_record) !== "COMPLIANT") failures.push("AUTHORITY_VALIDATION_FAILED");
  if ([...input.governance_references, ...input.constitutional_references].some((ref) => ref.replay_refs.length === 0)) failures.push("REPLAY_REFERENCE_MISSING");
  if ([...input.governance_references, ...input.constitutional_references].some((ref) => ref.lineage_refs.length === 0)) failures.push("LINEAGE_BROKEN");
  if ([...input.governance_references, ...input.constitutional_references].some((ref) => ref.tenant_id !== input.authority_record.tenant_id)) failures.push("TENANT_BOUNDARY_VIOLATION");
  if ([...input.governance_references, ...input.constitutional_references].some((ref) => hashRecord(ref) !== ref.integrity_hash)) failures.push("INTEGRITY_MISMATCH");
  if (input.scenario === "GOVERNANCE_BYPASS") failures.push("GOVERNANCE_BYPASS");
  if (input.scenario === "CONSTITUTIONAL_BYPASS") failures.push("CONSTITUTIONAL_BYPASS");
  if (input.scenario === "NONDETERMINISTIC") failures.push("NONDETERMINISTIC_EVALUATION");
  return Object.freeze([...new Set(failures)]);
}

export function validateGovernanceCompliance(evaluation: ComplianceEvaluation): ComplianceValidationResult {
  return validateComplianceEvaluation(evaluation, "governance");
}

export function validateConstitutionalCompliance(evaluation: ComplianceEvaluation): ComplianceValidationResult {
  return validateComplianceEvaluation(evaluation, "constitutional");
}

export function validateComplianceEvaluation(evaluation: ComplianceEvaluation, focus: "all" | "governance" | "constitutional" = "all"): ComplianceValidationResult {
  const failures = [
    ...evaluation.failures,
    ...collectFailures(evaluation),
    ...(hashRecord(evaluation) !== evaluation.integrity_hash ? ["INTEGRITY_MISMATCH" as const] : []),
    ...(hashRecord(evaluation.metadata) !== evaluation.metadata.integrity_hash ? ["INTEGRITY_MISMATCH" as const] : []),
    ...(hashRecord(evaluation.audit_record) !== evaluation.audit_record.integrity_hash ? ["INTEGRITY_MISMATCH" as const] : []),
  ];
  const filtered = focus === "governance" ? failures.filter((failure) => !failure.startsWith("CONSTITUTIONAL")) : focus === "constitutional" ? failures.filter((failure) => !failure.startsWith("GOVERNANCE") && failure !== "POLICY_VERSION_UNSUPPORTED") : failures;
  const unique = Object.freeze([...new Set(filtered)]);
  const compliance_state = stateForFailures(unique);
  const has = (failure: ComplianceFailure) => unique.includes(failure);
  return Object.freeze({
    validation_status: unique.length ? "FAILED_CLOSED" : "VALID",
    compliance_state,
    compliance_id: evaluation.compliance_id,
    failures: unique,
    checks: Object.freeze({
      governance_references_present: !has("GOVERNANCE_REFERENCE_MISSING"),
      constitutional_references_present: !has("CONSTITUTIONAL_REFERENCE_MISSING"),
      policy_mapping_complete: !has("GOVERNANCE_REFERENCE_MISSING") && !has("POLICY_VERSION_UNSUPPORTED"),
      constitutional_mapping_complete: !has("CONSTITUTIONAL_RULE_MISSING") && !has("CONSTITUTIONAL_VERSION_UNSUPPORTED"),
      authority_verified: !has("AUTHORITY_VALIDATION_FAILED"),
      replay_complete: !has("REPLAY_REFERENCE_MISSING"),
      lineage_intact: !has("LINEAGE_BROKEN"),
      tenant_isolated: !has("TENANT_BOUNDARY_VIOLATION"),
      integrity_verified: !has("INTEGRITY_MISMATCH"),
      deterministic: !has("NONDETERMINISTIC_EVALUATION"),
    }),
  });
}

export function replayComplianceEvaluation(evaluation: ComplianceEvaluation): ComplianceReplayResult {
  const reconstructed_hash = hashRecord(evaluation);
  const failures = reconstructed_hash === evaluation.integrity_hash ? Object.freeze([]) : Object.freeze(["INTEGRITY_MISMATCH"] as const);
  return Object.freeze({
    compliance_id: evaluation.compliance_id,
    replay_valid: failures.length === 0,
    reconstructed_state: evaluation.compliance_state,
    reconstructed_policy_mappings: Object.freeze(evaluation.policy_mappings.map((mapping) => mapping.mapping_id).sort()),
    reconstructed_constitutional_mappings: Object.freeze(evaluation.constitutional_mappings.map((mapping) => mapping.mapping_id).sort()),
    reconstructed_hash,
    expected_hash: evaluation.integrity_hash,
    failures,
  });
}

export function buildComplianceObservability(evaluations: readonly ComplianceEvaluation[]): ComplianceObservability {
  const validations = evaluations.map((evaluation) => validateComplianceEvaluation(evaluation));
  const failures = validations.flatMap((validation) => validation.failures);
  return Object.freeze({
    governance_validation_count: evaluations.length,
    constitutional_validation_count: evaluations.length,
    compliance_outcomes: Object.freeze(evaluations.reduce<Record<string, number>>((counts, evaluation) => {
      counts[evaluation.compliance_state] = (counts[evaluation.compliance_state] ?? 0) + 1;
      return counts;
    }, {})),
    policy_mapping_frequency: Object.freeze(evaluations.flatMap((evaluation) => evaluation.policy_mappings).reduce<Record<string, number>>((counts, mapping) => {
      counts[mapping.policy_id] = (counts[mapping.policy_id] ?? 0) + 1;
      return counts;
    }, {})),
    authority_verification_failures: failures.filter((failure) => failure === "AUTHORITY_VALIDATION_FAILED").length,
    governance_violations: failures.filter((failure) => failure === "GOVERNANCE_BYPASS" || failure === "GOVERNANCE_REFERENCE_MISSING" || failure === "POLICY_VERSION_UNSUPPORTED").length,
    constitutional_violations: failures.filter((failure) => failure === "CONSTITUTIONAL_BYPASS" || failure === "CONSTITUTIONAL_REFERENCE_MISSING" || failure === "CONSTITUTIONAL_VERSION_UNSUPPORTED").length,
    replay_mismatches: failures.filter((failure) => failure === "REPLAY_REFERENCE_MISSING" || failure === "INTEGRITY_MISMATCH").length,
    compliance_latency_ms: 0,
    policy_version_usage: Object.freeze(evaluations.flatMap((evaluation) => evaluation.policy_mappings).reduce<Record<string, number>>((counts, mapping) => {
      counts[mapping.policy_version] = (counts[mapping.policy_version] ?? 0) + 1;
      return counts;
    }, {})),
  });
}

export function getDecisionComplianceFramework() {
  const evaluation = createComplianceEvaluation();
  const validation = validateComplianceEvaluation(evaluation);
  return Object.freeze({
    hierarchy: Object.freeze(["CONSTITUTION", "GOVERNANCE_POLICIES", "AUTHORITY_RULES", "MISSION_POLICIES", "DECISION_ORCHESTRATION", "RECOMMENDATIONS"] as const),
    evaluation,
    validation,
    governance_validation: validateGovernanceCompliance(evaluation),
    constitutional_validation: validateConstitutionalCompliance(evaluation),
    replay: replayComplianceEvaluation(evaluation),
    observability: buildComplianceObservability([evaluation]),
  });
}
