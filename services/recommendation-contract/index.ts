import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  RecommendationAlternativePathRequirements,
  RecommendationCertificationState,
  RecommendationConfidenceBand,
  RecommendationContractDoctrine,
  RecommendationContractRecord,
  RecommendationEvidenceRequirements,
  RecommendationLifecycleState,
  RecommendationLifecycleTransitionResult,
  RecommendationObservabilitySurface,
  RecommendationReplayResult,
  RecommendationRiskRequirements,
  RecommendationScope,
  RecommendationScopeType,
  RecommendationSeverityLevel,
  RecommendationType,
  RecommendationValidationFailure,
  RecommendationValidationFailureReason,
  RecommendationValidationResult,
  RecommendationValidationState,
} from "@/types/recommendation-contract";

const NOW: "2026-06-26T09:00:00.000Z" = "2026-06-26T09:00:00.000Z";
const CONTRACT_VERSION: "RECOMMENDATION-CONTRACT-V1" = "RECOMMENDATION-CONTRACT-V1";

export const RECOMMENDATION_TYPES: readonly RecommendationType[] = Object.freeze(["POLICY_UPDATE", "CONTROL_IMPROVEMENT", "ESCALATION_RECOMMENDATION", "COMPLIANCE_IMPROVEMENT", "REMEDIATION_RECOMMENDATION", "MONITORING_RECOMMENDATION", "GOVERNANCE_REVIEW_RECOMMENDATION", "RISK_REDUCTION_RECOMMENDATION", "CERTIFICATION_RECOMMENDATION", "OPERATOR_REVIEW_RECOMMENDATION"]);
export const RECOMMENDATION_SCOPE_TYPES: readonly RecommendationScopeType[] = Object.freeze(["LOCAL_PHASE", "CROSS_PHASE", "POLICY_LEVEL", "CONTROL_LEVEL", "COMPLIANCE_LEVEL", "CERTIFICATION_LEVEL", "TENANT_LEVEL", "MISSION_LEVEL", "ECOSYSTEM_LEVEL"]);
const RECOMMENDATION_LIFECYCLE_STATES: readonly RecommendationLifecycleState[] = Object.freeze(["DRAFT", "EVIDENCE_BOUND", "RISK_BOUND", "CONFIDENCE_BOUND", "GOVERNANCE_CONSTRAINED", "VALIDATED", "REJECTED", "PRESENTED", "SUPERSEDED", "ARCHIVED"]);
const IMMUTABLE_FIELDS: readonly (keyof RecommendationContractRecord)[] = Object.freeze(["recommendation_id", "tenant_id", "mission_id", "governance_intelligence_id", "root_recommendation_id", "created_timestamp", "contract_version"]);

const LIFECYCLE_TRANSITIONS: Readonly<Record<RecommendationLifecycleState, readonly RecommendationLifecycleState[]>> = Object.freeze({
  DRAFT: Object.freeze(["EVIDENCE_BOUND", "REJECTED"] as const),
  EVIDENCE_BOUND: Object.freeze(["RISK_BOUND", "REJECTED"] as const),
  RISK_BOUND: Object.freeze(["CONFIDENCE_BOUND", "REJECTED"] as const),
  CONFIDENCE_BOUND: Object.freeze(["GOVERNANCE_CONSTRAINED", "REJECTED"] as const),
  GOVERNANCE_CONSTRAINED: Object.freeze(["VALIDATED", "REJECTED"] as const),
  VALIDATED: Object.freeze(["PRESENTED", "SUPERSEDED"] as const),
  REJECTED: Object.freeze(["ARCHIVED"] as const),
  PRESENTED: Object.freeze(["SUPERSEDED", "ARCHIVED"] as const),
  SUPERSEDED: Object.freeze(["ARCHIVED"] as const),
  ARCHIVED: Object.freeze([] as const),
});

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function failure(reason: RecommendationValidationFailureReason, field_path: string, message: string): RecommendationValidationFailure {
  return Object.freeze({ failure_id: hashValue("recommendation-contract-validation-failure", { reason, field_path, message }), reason, field_path, message, fail_closed: true });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasOwn<T extends object>(object: Partial<T>, key: keyof T): boolean {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function tenantLeak(ref: unknown, tenant_id: string | undefined): boolean {
  if (!tenant_id || typeof ref !== "string") return false;
  const match = ref.match(/tenant_(alpha|beta|[0-9]+)/i);
  return Boolean(match && match[0] !== tenant_id);
}

function containsTenantLeak(value: unknown, tenant_id: string | undefined): boolean {
  if (tenantLeak(value, tenant_id)) return true;
  if (Array.isArray(value)) return value.some((item) => containsTenantLeak(item, tenant_id));
  if (isRecord(value)) return Object.values(value).some((item) => containsTenantLeak(item, tenant_id));
  return false;
}

function confidenceBand(score: number): RecommendationConfidenceBand {
  if (score >= 95) return "CERTIFICATION_CONFIDENCE";
  if (score >= 85) return "HIGH_CONFIDENCE";
  if (score >= 70) return "MODERATE_CONFIDENCE";
  return "LOW_CONFIDENCE";
}

function severityForRisk(score: number): RecommendationSeverityLevel {
  if (score >= 90) return "CRITICAL";
  if (score >= 70) return "HIGH";
  if (score >= 40) return "MODERATE";
  return "LOW";
}

export function buildRecommendationContractDoctrine(): RecommendationContractDoctrine {
  return Object.freeze({
    principles: Object.freeze(["typed", "scoped", "evidence-supported", "risk-aware", "confidence-justified", "governance-compliant", "advisory-only", "tenant-safe", "truth-ledger-linked", "replayable", "certification-ready", "fail-closed"] as const),
    recommendation_types: RECOMMENDATION_TYPES,
    scope_types: RECOMMENDATION_SCOPE_TYPES,
    lifecycle_states: RECOMMENDATION_LIFECYCLE_STATES,
    prohibited_actions: Object.freeze(["execute policy changes", "modify controls directly", "approve governance changes", "deploy configuration updates", "grant permissions", "bypass certification", "suppress escalation", "alter evidence", "alter risk scoring", "alter confidence scoring", "mutate Truth Ledger records"]),
    contract_version: CONTRACT_VERSION,
  });
}

export function generateRecommendationId(tenant_id: string, mission_id: string, recommendation_type: RecommendationType): string {
  return `REC-7E1-${hashValue("recommendation-contract-id", { tenant_id, mission_id, recommendation_type }).slice(0, 10).toUpperCase()}`;
}

function buildScope(tenant_id: string, mission_id: string, overrides: Partial<RecommendationScope> = {}): RecommendationScope {
  return Object.freeze({
    scope_type: overrides.scope_type ?? "COMPLIANCE_LEVEL",
    affected_phase: overrides.affected_phase ?? "7E",
    affected_subphase: overrides.affected_subphase ?? "7E.1",
    affected_policy: overrides.affected_policy ?? `policy_${tenant_id}_recommendation_governance_v1`,
    affected_control: overrides.affected_control ?? `control_${tenant_id}_recommendation_advisory_boundary_v1`,
    affected_tenant: overrides.affected_tenant ?? tenant_id,
    affected_mission: overrides.affected_mission ?? mission_id,
    affected_certification_gate: overrides.affected_certification_gate ?? "7E.5",
  });
}

function buildEvidenceRequirements(tenant_id: string): RecommendationEvidenceRequirements {
  return Object.freeze({
    required_evidence_types: Object.freeze(["POLICY_EVIDENCE", "RISK_EVIDENCE", "COMPLIANCE_EVIDENCE", "LINEAGE_EVIDENCE", "REPLAY_EVIDENCE", "TRUTH_LEDGER_EVIDENCE"] as const),
    minimum_evidence_count: 3,
    required_source_refs: Object.freeze([`source_${tenant_id}_governance_observation_001`]),
    required_policy_refs: Object.freeze([`policy_${tenant_id}_recommendation_governance_v1`]),
    required_risk_refs: Object.freeze([`risk_${tenant_id}_governance_recommendation_001`]),
    required_compliance_refs: Object.freeze([`compliance_${tenant_id}_7d_certified`]),
    required_lineage_refs: Object.freeze([`lineage_${tenant_id}_recommendation_contract_7e1`]),
    evidence_quality_threshold: 90,
    evidence_integrity_required: true,
    evidence_recency_required: true,
    conflicting_evidence_policy: "DISCLOSE_AND_FAIL_IF_UNRESOLVED",
  });
}

function buildRiskRequirements(tenant_id: string, risk_score: number): RecommendationRiskRequirements {
  const severity_level = severityForRisk(risk_score);
  return Object.freeze({
    required_risk_assessment: true,
    risk_refs: Object.freeze([`risk_${tenant_id}_governance_recommendation_001`]),
    addressed_risk_categories: Object.freeze(["COMPLIANCE_GAP_RISK", "CONTROL_WEAKNESS_RISK", "CERTIFICATION_FAILURE_RISK"] as const),
    introduced_risk_categories: Object.freeze(["OPERATOR_VISIBILITY_RISK"] as const),
    residual_risk: "Residual risk remains advisory until an operator reviews and acts.",
    severity_level,
    risk_score,
    risk_threshold: 70,
    escalation_required: severity_level === "HIGH" || severity_level === "CRITICAL",
    risk_rationale: "Risk score reflects compliance gap severity, control weakness, evidence integrity, and certification impact.",
  });
}

function buildAlternativePathRequirements(severity: RecommendationSeverityLevel): RecommendationAlternativePathRequirements {
  const required_path_types = severity === "HIGH" || severity === "CRITICAL"
    ? Object.freeze(["PREFERRED_PATH", "CONSERVATIVE_PATH", "ESCALATION_PATH", "REMEDIATION_PATH"] as const)
    : Object.freeze(["PREFERRED_PATH", "CONSERVATIVE_PATH", "REMEDIATION_PATH"] as const);
  return Object.freeze({ alternatives_required: true, minimum_alternatives: required_path_types.length, required_path_types });
}

export function computeRecommendationHash(record: Omit<RecommendationContractRecord, "recommendation_hash"> | RecommendationContractRecord): string {
  const { recommendation_hash: _hash, ...source } = record as RecommendationContractRecord;
  return hashValue("recommendation-contract", source);
}

export function buildRecommendationContractRecord(overrides: Partial<RecommendationContractRecord> = {}): RecommendationContractRecord {
  const tenant_id = hasOwn(overrides, "tenant_id") ? overrides.tenant_id! : "tenant_alpha";
  const mission_id = hasOwn(overrides, "mission_id") ? overrides.mission_id! : "mission_governance_recommendation";
  const recommendation_type = hasOwn(overrides, "recommendation_type") ? overrides.recommendation_type! : "COMPLIANCE_IMPROVEMENT";
  const recommendation_id = hasOwn(overrides, "recommendation_id") ? overrides.recommendation_id! : generateRecommendationId(tenant_id, mission_id, recommendation_type);
  const governance_intelligence_id = hasOwn(overrides, "governance_intelligence_id") ? overrides.governance_intelligence_id! : `GI-${tenant_id}-${mission_id}-000001`;
  const parent_recommendation_id = hasOwn(overrides, "parent_recommendation_id") ? overrides.parent_recommendation_id! : null;
  const root_recommendation_id = hasOwn(overrides, "root_recommendation_id") ? overrides.root_recommendation_id! : parent_recommendation_id ?? recommendation_id;
  const recommendation_scope = hasOwn(overrides, "recommendation_scope") ? overrides.recommendation_scope! : buildScope(tenant_id, mission_id);
  const evidence_requirements = hasOwn(overrides, "evidence_requirements") ? overrides.evidence_requirements! : buildEvidenceRequirements(tenant_id);
  const evidenceRequirementsForDefaults = evidence_requirements ?? buildEvidenceRequirements(tenant_id);
  const evidence_refs = hasOwn(overrides, "evidence_refs") ? overrides.evidence_refs! : Object.freeze([`evidence_${tenant_id}_policy_001`, `evidence_${tenant_id}_risk_001`, `evidence_${tenant_id}_truth_ledger_001`]);
  const risk_score = hasOwn(overrides, "risk_score") ? overrides.risk_score! : 76;
  const risk_requirements = hasOwn(overrides, "risk_requirements") ? overrides.risk_requirements! : buildRiskRequirements(tenant_id, risk_score);
  const riskRequirementsForDefaults = risk_requirements ?? buildRiskRequirements(tenant_id, risk_score);
  const confidence_score = hasOwn(overrides, "confidence_score") ? overrides.confidence_score! : 91;
  const confidence_inputs = Object.freeze({ evidence_quality: evidenceRequirementsForDefaults.evidence_quality_threshold, risk_score, governance_constraints: 100, replay_readiness: 100 });
  const confidence_replay_hash = hashValue("recommendation-confidence-replay", confidence_inputs);
  const confidence_requirements = hasOwn(overrides, "confidence_requirements") ? overrides.confidence_requirements! : Object.freeze({
    confidence_score,
    confidence_band: confidenceBand(confidence_score),
    confidence_threshold: 85,
    confidence_inputs,
    confidence_rationale: "Confidence reflects evidence quality, risk reproducibility, governance constraints, and replay readiness.",
    uncertainty_factors: Object.freeze(["operator action remains external to recommendation authority"]),
    confidence_replay_hash,
  });
  const target_policy_refs = hasOwn(overrides, "target_policy_refs") ? overrides.target_policy_refs! : Object.freeze([`policy_${tenant_id}_recommendation_governance_v1`]);
  const target_control_refs = hasOwn(overrides, "target_control_refs") ? overrides.target_control_refs! : Object.freeze([`control_${tenant_id}_recommendation_advisory_boundary_v1`]);
  const target_compliance_refs = hasOwn(overrides, "target_compliance_refs") ? overrides.target_compliance_refs! : Object.freeze([`compliance_${tenant_id}_7d_certified`]);
  const governance_constraints = hasOwn(overrides, "governance_constraints") ? overrides.governance_constraints! : Object.freeze({
    applicable_policies: target_policy_refs,
    applicable_controls: target_control_refs,
    applicable_constitutional_rules: Object.freeze(["constitution_operator_supremacy_v1", "constitution_advisory_only_v1"]),
    authority_limits: Object.freeze(["no_execution_authority", "no_mutation_authority", "no_approval_authority", "operator_required_for_action"]),
    escalation_rules: Object.freeze(["high_or_critical_risk_requires_escalation_path", "policy_conflict_requires_governance_review"]),
    certification_rules: Object.freeze(["7E.5 certification required before production reuse"]),
    tenant_isolation_rules: Object.freeze(["same_tenant_evidence_only", "same_tenant_policy_refs_only", "no_cross_tenant_lineage"]),
    operator_review_rules: Object.freeze(["operator can inspect evidence, risk, confidence, governance constraints, replay status"]),
  });
  const replayBase = { recommendation_id, tenant_id, mission_id, recommendation_type, evidence_refs, target_policy_refs, risk_score, confidence_score };
  const replay_requirements = hasOwn(overrides, "replay_requirements") ? overrides.replay_requirements! : Object.freeze({
    replay_id: `replay_${tenant_id}_recommendation_contract_7e1`,
    input_snapshot_hash: hashValue("recommendation-input-snapshot", replayBase),
    evidence_snapshot_hash: hashValue("recommendation-evidence-snapshot", evidence_refs),
    policy_snapshot_hash: hashValue("recommendation-policy-snapshot", target_policy_refs),
    risk_snapshot_hash: hashValue("recommendation-risk-snapshot", riskRequirementsForDefaults),
    confidence_snapshot_hash: hashValue("recommendation-confidence-snapshot", confidence_requirements),
    recommendation_output_hash: hashValue("recommendation-output-snapshot", { recommendation_id, recommendation_type, target_policy_refs }),
    deterministic_generation_hash: hashValue("recommendation-deterministic-generation", replayBase),
    replay_expected_result: "REPRODUCED" as const,
  });
  const truth_ledger_refs = hasOwn(overrides, "truth_ledger_refs") ? overrides.truth_ledger_refs! : Object.freeze([`truth_ledger_${tenant_id}_recommendation_contract_7e1`]);
  const withoutHash: Omit<RecommendationContractRecord, "recommendation_hash"> = {
    recommendation_id,
    tenant_id,
    mission_id,
    governance_intelligence_id,
    parent_recommendation_id,
    root_recommendation_id,
    recommendation_type,
    recommendation_title: hasOwn(overrides, "recommendation_title") ? overrides.recommendation_title! : "Improve compliance evidence coverage",
    recommendation_summary: hasOwn(overrides, "recommendation_summary") ? overrides.recommendation_summary! : "Advisory recommendation to improve compliance evidence coverage without executing any governance change.",
    recommendation_scope,
    target_domain: hasOwn(overrides, "target_domain") ? overrides.target_domain! : "governance-compliance",
    target_policy_refs,
    target_control_refs,
    target_compliance_refs,
    evidence_requirements,
    evidence_refs,
    evidence_lineage_hash: hasOwn(overrides, "evidence_lineage_hash") ? overrides.evidence_lineage_hash! : hashValue("recommendation-evidence-lineage", { tenant_id, evidence_refs, lineage: evidenceRequirementsForDefaults.required_lineage_refs }),
    risk_requirements,
    risk_refs: hasOwn(overrides, "risk_refs") ? overrides.risk_refs! : riskRequirementsForDefaults.risk_refs,
    risk_score,
    severity_level: hasOwn(overrides, "severity_level") ? overrides.severity_level! : riskRequirementsForDefaults.severity_level,
    confidence_requirements,
    confidence_score,
    confidence_rationale: hasOwn(overrides, "confidence_rationale") ? overrides.confidence_rationale! : (confidence_requirements?.confidence_rationale ?? "Confidence requirements are missing."),
    governance_constraints,
    constitutional_constraints: hasOwn(overrides, "constitutional_constraints") ? overrides.constitutional_constraints! : (governance_constraints?.applicable_constitutional_rules ?? []),
    advisory_boundary: hasOwn(overrides, "advisory_boundary") ? overrides.advisory_boundary! : Object.freeze({ advisory_only: true, execution_authority: false, mutation_authority: false, deployment_authority: false, approval_authority: false, enforcement_authority: false, operator_required_for_action: true }),
    advisory_only: hasOwn(overrides, "advisory_only") ? overrides.advisory_only! : true,
    prohibited_authority: hasOwn(overrides, "prohibited_authority") ? overrides.prohibited_authority! : Object.freeze(["execute", "mutate", "deploy", "approve", "enforce", "grant_permission", "bypass_certification", "alter_truth_ledger"]),
    alternative_path_required: hasOwn(overrides, "alternative_path_required") ? overrides.alternative_path_required! : buildAlternativePathRequirements(riskRequirementsForDefaults.severity_level),
    replay_requirements,
    validation_requirements: hasOwn(overrides, "validation_requirements") ? overrides.validation_requirements! : Object.freeze({ contract_present: true, schema_valid: true, recommendation_type_valid: true, scope_valid: true, evidence_supported: true, risk_assessed: true, confidence_justified: true, governance_compliant: true, advisory_only_enforced: true, replay_ready: true, tenant_isolated: true, truth_ledger_linked: true }),
    truth_ledger_requirements: hasOwn(overrides, "truth_ledger_requirements") ? overrides.truth_ledger_requirements! : Object.freeze({ truth_record_id: truth_ledger_refs[0], recommendation_id, evidence_refs, risk_refs: riskRequirementsForDefaults.risk_refs, confidence_refs: Object.freeze([confidence_replay_hash]), policy_refs: target_policy_refs, compliance_refs: target_compliance_refs, validation_refs: Object.freeze([`validation_${tenant_id}_recommendation_contract_7e1`]), replay_refs: Object.freeze([replay_requirements?.replay_id ?? ""].filter(Boolean)), lineage_refs: evidenceRequirementsForDefaults.required_lineage_refs, operator_visibility_refs: Object.freeze([`operator_visibility_${tenant_id}_recommendation_contract_7e1`]) }),
    truth_ledger_refs,
    created_timestamp: hasOwn(overrides, "created_timestamp") ? overrides.created_timestamp! : NOW,
    contract_version: hasOwn(overrides, "contract_version") ? overrides.contract_version! : CONTRACT_VERSION,
    lifecycle_state: hasOwn(overrides, "lifecycle_state") ? overrides.lifecycle_state! : "VALIDATED",
  };
  return Object.freeze({ ...withoutHash, recommendation_hash: hasOwn(overrides, "recommendation_hash") ? overrides.recommendation_hash! : computeRecommendationHash(withoutHash) });
}

export function validateRecommendationContractRecord(record: Partial<RecommendationContractRecord> | undefined, options: { original_record?: RecommendationContractRecord } = {}): RecommendationValidationResult {
  const errors: RecommendationValidationFailure[] = [];
  if (!record) errors.push(failure("CONTRACT_MISSING", "record", "recommendation contract missing"));
  if (record?.contract_version !== CONTRACT_VERSION) errors.push(failure("UNSUPPORTED_SCHEMA_VERSION", "contract_version", "unsupported recommendation contract"));
  if (!record?.recommendation_id) errors.push(failure("RECOMMENDATION_ID_MISSING", "recommendation_id", "recommendation id missing"));
  if (!record?.tenant_id) errors.push(failure("TENANT_ID_MISSING", "tenant_id", "tenant id missing"));
  if (!record?.mission_id) errors.push(failure("MISSION_ID_MISSING", "mission_id", "mission id missing"));
  if (!record?.governance_intelligence_id) errors.push(failure("GOVERNANCE_INTELLIGENCE_ID_MISSING", "governance_intelligence_id", "governance intelligence id missing"));
  if (!record?.recommendation_type || !RECOMMENDATION_TYPES.includes(record.recommendation_type)) errors.push(failure("UNSUPPORTED_RECOMMENDATION_TYPE", "recommendation_type", "unsupported recommendation type"));
  if (!record?.recommendation_scope) errors.push(failure("RECOMMENDATION_SCOPE_MISSING", "recommendation_scope", "recommendation scope missing"));
  if (record?.recommendation_scope && (!RECOMMENDATION_SCOPE_TYPES.includes(record.recommendation_scope.scope_type) || record.recommendation_scope.affected_tenant !== record.tenant_id || record.recommendation_scope.affected_mission !== record.mission_id)) errors.push(failure("UNDEFINED_OR_EXCESSIVE_SCOPE", "recommendation_scope", "recommendation scope is undefined, excessive, or cross-tenant"));
  if (!record?.evidence_requirements) errors.push(failure("EVIDENCE_REQUIREMENTS_MISSING", "evidence_requirements", "evidence requirements missing"));
  if (!record?.evidence_refs?.length || (record.evidence_requirements && record.evidence_refs.length < record.evidence_requirements.minimum_evidence_count)) errors.push(failure("EVIDENCE_MISSING", "evidence_refs", "evidence references missing or below minimum"));
  if (!record?.evidence_lineage_hash || !record.evidence_requirements?.required_lineage_refs?.length) errors.push(failure("EVIDENCE_LINEAGE_MISSING", "evidence_lineage_hash", "evidence lineage missing"));
  if (!record?.risk_requirements || !record.risk_refs?.length) errors.push(failure("RISK_REQUIREMENTS_MISSING", "risk_requirements", "risk requirements missing"));
  if (record?.risk_requirements && !record.risk_requirements.risk_rationale) errors.push(failure("RISK_RATIONALE_MISSING", "risk_requirements.risk_rationale", "risk rationale missing"));
  if (!record?.confidence_requirements) errors.push(failure("CONFIDENCE_REQUIREMENTS_MISSING", "confidence_requirements", "confidence requirements missing"));
  if (record?.confidence_requirements && (record.confidence_requirements.confidence_score !== record.confidence_score || record.confidence_requirements.confidence_score < record.confidence_requirements.confidence_threshold || !record.confidence_requirements.confidence_rationale)) errors.push(failure("CONFIDENCE_UNSUPPORTED", "confidence_requirements", "confidence is unsupported or inflated"));
  if (!record?.governance_constraints || !record.governance_constraints.applicable_policies?.length || !record.governance_constraints.authority_limits?.length) errors.push(failure("GOVERNANCE_CONSTRAINTS_MISSING", "governance_constraints", "governance constraints missing"));
  if (!record?.advisory_boundary || record.advisory_only !== true || record.advisory_boundary.advisory_only !== true) errors.push(failure("ADVISORY_ONLY_BOUNDARY_MISSING", "advisory_boundary", "advisory-only boundary missing"));
  if (record?.advisory_boundary && record.advisory_boundary.execution_authority !== false) errors.push(failure("EXECUTION_AUTHORITY_DETECTED", "advisory_boundary.execution_authority", "recommendation cannot execute actions"));
  if (record?.advisory_boundary && record.advisory_boundary.mutation_authority !== false) errors.push(failure("MUTATION_AUTHORITY_DETECTED", "advisory_boundary.mutation_authority", "recommendation cannot mutate records"));
  if (!record?.replay_requirements?.replay_id || !record.replay_requirements.deterministic_generation_hash) errors.push(failure("REPLAY_REQUIREMENTS_MISSING", "replay_requirements", "replay requirements missing"));
  if (!record?.truth_ledger_refs?.length || !record.truth_ledger_requirements?.truth_record_id) errors.push(failure("TRUTH_LEDGER_LINKAGE_MISSING", "truth_ledger_refs", "Truth Ledger linkage missing"));
  if (containsTenantLeak(record, record?.tenant_id)) errors.push(failure("TENANT_SCOPE_VIOLATION", "tenant_id", "cross-tenant recommendation reference detected"));
  if (isRecord(record) && ("hidden_state" in record || "hidden_recommendation_state" in record || "random_seed" in record)) errors.push(failure("HIDDEN_STATE_DETECTED", "record", "hidden or nondeterministic recommendation state is prohibited"));
  if (options.original_record) {
    for (const key of IMMUTABLE_FIELDS) {
      if (canonicalizeConfidenceToString(options.original_record[key]) !== canonicalizeConfidenceToString(record?.[key])) errors.push(failure("IMMUTABLE_FIELD_MUTATION", String(key), `${String(key)} cannot be mutated; supersede the recommendation instead`));
    }
  }
  if (record?.recommendation_hash && computeRecommendationHash(record as RecommendationContractRecord) !== record.recommendation_hash) errors.push(failure("RECOMMENDATION_HASH_MISMATCH", "recommendation_hash", "recommendation hash mismatch"));
  const validation_state: RecommendationValidationState = errors.some((error) => error.reason === "TENANT_SCOPE_VIOLATION") ? "TENANT_SCOPE_VIOLATION" : errors.some((error) => ["HIDDEN_STATE_DETECTED", "IMMUTABLE_FIELD_MUTATION", "EXECUTION_AUTHORITY_DETECTED", "MUTATION_AUTHORITY_DETECTED"].includes(error.reason)) ? "CERTIFICATION_BLOCKED" : errors.some((error) => error.reason === "CONTRACT_MISSING") ? "INVALID" : errors.some((error) => ["REPLAY_REQUIREMENTS_MISSING", "RECOMMENDATION_HASH_MISMATCH"].includes(error.reason)) ? "REPLAY_MISMATCH" : errors.some((error) => error.reason === "EVIDENCE_MISSING") ? "UNKNOWN" : errors.length ? "INVALID" : "VALID";
  return Object.freeze({
    recommendation_id: record?.recommendation_id,
    validation_state,
    validator_version: "RECOMMENDATION-CONTRACT-VALIDATOR-V1",
    checks: Object.freeze({
      contract_present: !errors.some((error) => error.reason === "CONTRACT_MISSING"),
      schema_valid: !errors.some((error) => ["CONTRACT_MISSING", "UNSUPPORTED_SCHEMA_VERSION"].includes(error.reason)),
      recommendation_type_valid: !errors.some((error) => error.reason === "UNSUPPORTED_RECOMMENDATION_TYPE"),
      scope_valid: !errors.some((error) => ["RECOMMENDATION_SCOPE_MISSING", "UNDEFINED_OR_EXCESSIVE_SCOPE"].includes(error.reason)),
      evidence_supported: !errors.some((error) => ["EVIDENCE_REQUIREMENTS_MISSING", "EVIDENCE_MISSING"].includes(error.reason)),
      evidence_lineage_present: !errors.some((error) => error.reason === "EVIDENCE_LINEAGE_MISSING"),
      risk_assessed: !errors.some((error) => ["RISK_REQUIREMENTS_MISSING", "RISK_RATIONALE_MISSING"].includes(error.reason)),
      confidence_justified: !errors.some((error) => ["CONFIDENCE_REQUIREMENTS_MISSING", "CONFIDENCE_UNSUPPORTED"].includes(error.reason)),
      governance_compliant: !errors.some((error) => error.reason === "GOVERNANCE_CONSTRAINTS_MISSING"),
      advisory_only_enforced: !errors.some((error) => ["ADVISORY_ONLY_BOUNDARY_MISSING", "EXECUTION_AUTHORITY_DETECTED", "MUTATION_AUTHORITY_DETECTED"].includes(error.reason)),
      replay_ready: !errors.some((error) => ["REPLAY_REQUIREMENTS_MISSING", "RECOMMENDATION_HASH_MISMATCH"].includes(error.reason)),
      tenant_isolated: !errors.some((error) => error.reason === "TENANT_SCOPE_VIOLATION"),
      truth_ledger_linked: !errors.some((error) => error.reason === "TRUTH_LEDGER_LINKAGE_MISSING"),
      immutable_identity_valid: !errors.some((error) => error.reason === "IMMUTABLE_FIELD_MUTATION"),
      hidden_state_absent: !errors.some((error) => error.reason === "HIDDEN_STATE_DETECTED"),
      hash_valid: !errors.some((error) => error.reason === "RECOMMENDATION_HASH_MISMATCH"),
    }),
    errors: Object.freeze(errors),
    warnings: Object.freeze([]),
    validation_timestamp: NOW,
  });
}

export function replayRecommendationContract(record: RecommendationContractRecord): RecommendationReplayResult {
  const reconstructed_hash = computeRecommendationHash(record);
  const validation = validateRecommendationContractRecord(record);
  const replay_state = validation.validation_state === "VALID" && reconstructed_hash === record.recommendation_hash ? "REPRODUCED" : record.replay_requirements ? "MISMATCH" : "INCOMPLETE";
  return Object.freeze({
    replay_id: hashValue("recommendation-contract-replay", { recommendation_id: record.recommendation_id, reconstructed_hash }),
    recommendation_id: record.recommendation_id,
    replay_state,
    reconstructed_hash,
    expected_hash: record.recommendation_hash,
    reconstructed_validation_state: validation.validation_state,
    expected_validation_state: "VALID",
    failure_reason: replay_state === "REPRODUCED" ? null : validation.errors[0]?.reason ?? "RECOMMENDATION_HASH_MISMATCH",
  });
}

export function transitionRecommendationLifecycle(from_state: RecommendationLifecycleState, to_state: RecommendationLifecycleState): RecommendationLifecycleTransitionResult {
  const allowed = LIFECYCLE_TRANSITIONS[from_state]?.includes(to_state) ?? false;
  return Object.freeze({ from_state, to_state, allowed, reason: allowed ? "recommendation lifecycle transition allowed" : `invalid recommendation lifecycle transition: ${from_state} to ${to_state}` });
}

export function buildRecommendationObservabilitySurface(record = buildRecommendationContractRecord()): RecommendationObservabilitySurface {
  const validation = validateRecommendationContractRecord(record);
  const replay = replayRecommendationContract(record);
  return Object.freeze({
    recommendation_id: record.recommendation_id,
    recommendation_type: record.recommendation_type,
    recommendation_summary: record.recommendation_summary,
    evidence_basis: record.evidence_refs,
    risk_basis: record.risk_refs,
    confidence_basis: Object.freeze({ score: record.confidence_score, band: record.confidence_requirements.confidence_band, rationale: record.confidence_rationale }),
    governance_constraints: record.governance_constraints,
    alternative_paths: record.alternative_path_required,
    validation_result: validation.validation_state,
    replay_status: replay.replay_state,
    advisory_only_notice: "This recommendation may advise, explain, compare alternatives, or recommend escalation; it may not execute action.",
    truth_ledger_refs: record.truth_ledger_refs,
    validation_failures: Object.freeze(validation.errors.map((error) => error.reason)),
  });
}

export function certifyRecommendationContract(record = buildRecommendationContractRecord()): { certification_state: RecommendationCertificationState; passed_tests: readonly string[]; failed_tests: readonly RecommendationValidationFailureReason[]; conditional_findings: readonly string[]; certification_hash: string } {
  const validation = validateRecommendationContractRecord(record);
  const replay = replayRecommendationContract(record);
  const failed_tests = validation.errors.map((error) => error.reason);
  const conditional_findings = validation.validation_state === "VALID" && record.lifecycle_state !== "VALIDATED" ? ["minor lifecycle presentation gap"] : [];
  const certification_state: RecommendationCertificationState = validation.validation_state === "VALID" && replay.replay_state === "REPRODUCED" && conditional_findings.length === 0 ? "PASS" : validation.validation_state === "VALID" && replay.replay_state === "REPRODUCED" ? "CONDITIONAL_PASS" : "FAIL";
  const passed_tests = Object.entries(validation.checks).filter(([, passed]) => passed).map(([key]) => key);
  return Object.freeze({ certification_state, passed_tests: Object.freeze(passed_tests), failed_tests: Object.freeze(failed_tests), conditional_findings: Object.freeze(conditional_findings), certification_hash: hashValue("recommendation-contract-certification", { id: record.recommendation_id, validation, replay, conditional_findings }) });
}

export function getRecommendationContract() {
  const record = buildRecommendationContractRecord();
  return Object.freeze({
    doctrine: buildRecommendationContractDoctrine(),
    recommendation_types: RECOMMENDATION_TYPES,
    scope_types: RECOMMENDATION_SCOPE_TYPES,
    lifecycle_states: RECOMMENDATION_LIFECYCLE_STATES,
    record,
    certification: certifyRecommendationContract(record),
  });
}
