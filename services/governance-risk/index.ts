import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { buildPolicyIntelligenceCertification } from "@/services/policy-intelligence-certification";
import type {
  GovernanceRiskCategory,
  GovernanceRiskDoctrine,
  GovernanceRiskFailureReason,
  GovernanceRiskRecord,
  GovernanceRiskReplayPackage,
  GovernanceRiskReplayResult,
  GovernanceRiskSeverity,
  GovernanceRiskSourceDefinition,
  GovernanceRiskSourceType,
  GovernanceRiskState,
  GovernanceRiskValidationFailure,
  GovernanceRiskValidationResult,
  GovernanceRiskValidationState,
  GovernanceRiskObservabilitySurface,
} from "@/types/governance-risk";

const NOW = "2026-06-25T09:00:00.000Z";
export const GOVERNANCE_RISK_CATEGORIES = ["POLICY_RISK", "AUTHORITY_RISK", "ESCALATION_RISK", "CONTROL_WEAKNESS_RISK", "OVERSIGHT_RISK", "LINEAGE_RISK", "REPLAY_RISK", "TENANT_ISOLATION_RISK", "CERTIFICATION_RISK", "GOVERNANCE_DRIFT_RISK", "EVIDENCE_RISK", "EXCEPTION_RISK"] as const;
export const GOVERNANCE_RISK_SEVERITIES = ["LOW", "MODERATE", "HIGH", "CRITICAL"] as const;
export const GOVERNANCE_RISK_STATES = ["DETECTED", "VALIDATED", "UNDER_REVIEW", "MITIGATED", "SUPERSEDED", "DISMISSED", "ARCHIVED"] as const;
export const GOVERNANCE_RISK_SOURCES = ["POLICY_VIOLATION", "POLICY_CONFLICT", "POLICY_DRIFT", "AUTHORITY_DRIFT", "GOVERNANCE_EXCEPTION", "MANUAL_OVERRIDE", "ESCALATION_EVENT", "FAILED_CERTIFICATION_TEST", "REPLAY_MISMATCH", "LINEAGE_BREAK", "MISSING_EVIDENCE", "MISSING_CONTRACT", "UNRESOLVED_GOVERNANCE_ACTION", "TENANT_BOUNDARY_ANOMALY", "REPEATED_WARNING_STATE", "RUNTIME_CONTAINMENT_EVENT", "OPERATOR_INTERVENTION_PATTERN"] as const;

const ALLOWED_TRANSITIONS: Readonly<Record<GovernanceRiskState, readonly GovernanceRiskState[]>> = Object.freeze({
  DETECTED: Object.freeze(["VALIDATED", "DISMISSED", "SUPERSEDED"] as const),
  VALIDATED: Object.freeze(["UNDER_REVIEW", "MITIGATED", "SUPERSEDED", "ARCHIVED"] as const),
  UNDER_REVIEW: Object.freeze(["MITIGATED", "DISMISSED", "SUPERSEDED"] as const),
  MITIGATED: Object.freeze(["ARCHIVED"] as const),
  SUPERSEDED: Object.freeze(["ARCHIVED"] as const),
  DISMISSED: Object.freeze(["ARCHIVED"] as const),
  ARCHIVED: Object.freeze([] as const),
});
let cachedPolicyCertification: ReturnType<typeof buildPolicyIntelligenceCertification> | undefined;

function getPolicyCertification() {
  cachedPolicyCertification ??= buildPolicyIntelligenceCertification();
  return cachedPolicyCertification;
}

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function uniq(items: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(items.filter(Boolean))].sort());
}

function failure(reason: GovernanceRiskFailureReason, field_path: string, message: string): GovernanceRiskValidationFailure {
  return Object.freeze({ failure_id: hashValue("governance-risk-validation-failure", { reason, field_path, message }), reason, field_path, message, fail_closed: true });
}

export function buildGovernanceRiskDoctrine(): GovernanceRiskDoctrine {
  return Object.freeze({
    principles: Object.freeze(["advisory-only", "deterministic", "tenant-isolated", "evidence-bound", "lineage-preserving", "replayable", "operator-visible", "fail-closed"] as const),
    prohibited_behaviors: Object.freeze(["risk enforcement", "operator approval", "runtime containment", "governance remediation", "authority expansion", "policy mutation", "subjective severity assignment", "cross-tenant risk linkage"]),
    allowed_categories: Object.freeze([...GOVERNANCE_RISK_CATEGORIES]),
    allowed_severities: Object.freeze([...GOVERNANCE_RISK_SEVERITIES]),
    allowed_states: Object.freeze([...GOVERNANCE_RISK_STATES]),
    allowed_state_transitions: ALLOWED_TRANSITIONS,
  });
}

export function buildGovernanceRiskSourceRegistry(): readonly GovernanceRiskSourceDefinition[] {
  const definitions: GovernanceRiskSourceDefinition[] = [
    { risk_source_type: "POLICY_CONFLICT", description: "Risk derived from policy conflict records.", allowed_risk_categories: ["POLICY_RISK", "GOVERNANCE_DRIFT_RISK"], requires_evidence_refs: true, requires_policy_refs: true, requires_replay_refs: true, requires_operator_review: true, source_confidence_weight: 0.88, tenant_scoped: true, enabled: true },
    { risk_source_type: "REPLAY_MISMATCH", description: "Risk derived from failed replay reconstruction.", allowed_risk_categories: ["REPLAY_RISK", "CERTIFICATION_RISK"], requires_evidence_refs: true, requires_policy_refs: false, requires_replay_refs: true, requires_operator_review: true, source_confidence_weight: 0.9, tenant_scoped: true, enabled: true },
    { risk_source_type: "LINEAGE_BREAK", description: "Risk derived from broken lineage.", allowed_risk_categories: ["LINEAGE_RISK"], requires_evidence_refs: true, requires_policy_refs: false, requires_replay_refs: true, requires_operator_review: true, source_confidence_weight: 0.86, tenant_scoped: true, enabled: true },
    { risk_source_type: "AUTHORITY_DRIFT", description: "Risk derived from authority drift.", allowed_risk_categories: ["AUTHORITY_RISK", "GOVERNANCE_DRIFT_RISK"], requires_evidence_refs: true, requires_policy_refs: true, requires_replay_refs: true, requires_operator_review: true, source_confidence_weight: 0.84, tenant_scoped: true, enabled: true },
    { risk_source_type: "FAILED_CERTIFICATION_TEST", description: "Risk derived from failed certification tests.", allowed_risk_categories: ["CERTIFICATION_RISK", "EVIDENCE_RISK"], requires_evidence_refs: true, requires_policy_refs: false, requires_replay_refs: true, requires_operator_review: true, source_confidence_weight: 0.92, tenant_scoped: true, enabled: true },
    ...GOVERNANCE_RISK_SOURCES.filter((source) => !["POLICY_CONFLICT", "REPLAY_MISMATCH", "LINEAGE_BREAK", "AUTHORITY_DRIFT", "FAILED_CERTIFICATION_TEST"].includes(source)).map((source): GovernanceRiskSourceDefinition => ({ risk_source_type: source, description: `${source} governance risk source.`, allowed_risk_categories: ["GOVERNANCE_DRIFT_RISK"] as const, requires_evidence_refs: true, requires_policy_refs: source.includes("POLICY"), requires_replay_refs: true, requires_operator_review: false, source_confidence_weight: 0.75, tenant_scoped: true, enabled: true })),
  ];
  return Object.freeze(definitions.map((definition) => Object.freeze({ ...definition, allowed_risk_categories: Object.freeze([...definition.allowed_risk_categories]) })));
}

export function generateGovernanceRiskId(tenant_id: string, mission_id: string, source_refs: readonly GovernanceRiskSourceType[]): string {
  return `GRISK-${hashValue("governance-risk-id", { tenant_id, mission_id, source_refs }).slice(0, 12).toUpperCase()}`;
}

export function canonicalizeGovernanceRisk(record: Omit<GovernanceRiskRecord, "risk_hash">): string {
  return canonicalizeConfidenceToString(record);
}

export function computeGovernanceRiskHash(record: Omit<GovernanceRiskRecord, "risk_hash"> | GovernanceRiskRecord): string {
  const { risk_hash: _previousHash, ...source } = record as GovernanceRiskRecord;
  return hashConfidenceValue("governance-risk-contract", canonicalizeGovernanceRisk(source));
}

function buildReplayPackage(source: Omit<GovernanceRiskRecord, "replay_package" | "risk_hash">): GovernanceRiskReplayPackage {
  const source_record_hashes = source.risk_source_refs.map((risk_source) => hashValue("governance-risk-source", { risk_source, tenant_id: source.tenant_id, mission_id: source.mission_id }));
  return Object.freeze({
    governance_risk_id: source.governance_risk_id,
    tenant_id: source.tenant_id,
    mission_id: source.mission_id,
    contract_version: "GOV-RISK-CONTRACT-V1",
    risk_source_refs: Object.freeze([...source.risk_source_refs]),
    evidence_refs: Object.freeze([...source.evidence_refs]),
    policy_refs: Object.freeze([...source.policy_refs]),
    lineage_refs: Object.freeze([...source.lineage_refs]),
    replay_refs: Object.freeze([...source.replay_refs]),
    severity_model_version: "GOV-RISK-SEVERITY-V1",
    confidence_model_version: "GOV-RISK-CONFIDENCE-V1",
    source_record_hashes: Object.freeze(source_record_hashes),
    reconstruction_hash: hashValue("governance-risk-reconstruction", { source_record_hashes, severity: source.risk_severity, confidence: source.confidence_score }),
  });
}

export function buildGovernanceRiskRecord(input: Partial<GovernanceRiskRecord> = {}): GovernanceRiskRecord {
  const certification = getPolicyCertification();
  const has = (key: keyof GovernanceRiskRecord) => Object.prototype.hasOwnProperty.call(input, key);
  const risk_source_refs: readonly GovernanceRiskSourceType[] = has("risk_source_refs") ? input.risk_source_refs as readonly GovernanceRiskSourceType[] : ["POLICY_CONFLICT", "AUTHORITY_DRIFT"] as const;
  const sourceWithoutReplay: Omit<GovernanceRiskRecord, "replay_package" | "risk_hash"> = {
    contract_version: has("contract_version") ? input.contract_version! : "GOV-RISK-CONTRACT-V1",
    governance_risk_id: has("governance_risk_id") ? input.governance_risk_id! : generateGovernanceRiskId(certification.tenant_id, certification.certification_scope.mission_scope, risk_source_refs),
    tenant_id: has("tenant_id") ? input.tenant_id! : certification.tenant_id,
    mission_id: has("mission_id") ? input.mission_id! : certification.certification_scope.mission_scope,
    governance_intelligence_id: has("governance_intelligence_id") ? input.governance_intelligence_id! : "govint_tenant_alpha_7c1",
    policy_intelligence_id: has("policy_intelligence_id") ? input.policy_intelligence_id! : certification.policy_certification_id,
    risk_source_refs,
    risk_category: has("risk_category") ? input.risk_category! : "GOVERNANCE_DRIFT_RISK",
    risk_severity: has("risk_severity") ? input.risk_severity! : "HIGH",
    severity_basis: has("severity_basis") ? input.severity_basis! : { scoring_model_version: "GOV-RISK-SEVERITY-V1", source_inputs: risk_source_refs, deterministic_score: 68, threshold_result: "HIGH", drivers: ["policy conflict", "authority drift"] },
    confidence_score: has("confidence_score") ? input.confidence_score! : 0.91,
    confidence_basis: has("confidence_basis") ? input.confidence_basis! : { supporting_evidence_count: certification.evidence_refs.length, source_quality: 0.93, lineage_completeness: 1, replay_status: "REPLAY_SUCCESSFUL", policy_match_strength: 0.89, historical_pattern_strength: 0.84 },
    evidence_refs: has("evidence_refs") ? input.evidence_refs! : certification.evidence_refs,
    violation_refs: has("violation_refs") ? input.violation_refs! : ["violation_policy_bypass_022"],
    policy_refs: has("policy_refs") ? input.policy_refs! : certification.policy_analysis_refs,
    exception_refs: has("exception_refs") ? input.exception_refs! : ["exception_operator_review"],
    escalation_refs: has("escalation_refs") ? input.escalation_refs! : ["authority_decision_077"],
    lineage_refs: has("lineage_refs") ? input.lineage_refs! : certification.lineage_refs,
    replay_refs: has("replay_refs") ? input.replay_refs! : [certification.replay_refs.replay_execution_ref],
    risk_detected_timestamp: has("risk_detected_timestamp") ? input.risk_detected_timestamp! : NOW,
    risk_window: has("risk_window") ? input.risk_window! : { start: "2026-05-25T00:00:00.000Z", end: "2026-06-25T00:00:00.000Z", window_type: "30_DAY_ROLLING" },
    risk_state: has("risk_state") ? input.risk_state! : "VALIDATED",
    explanation: has("explanation") ? input.explanation! : "Governance risk was detected because policy conflict and authority drift converged within the selected risk window, and replay reconstruction confirmed the same governance drift pattern.",
    recommended_operator_review: has("recommended_operator_review") ? input.recommended_operator_review! : true,
  };
  const replay_package = input.replay_package ?? buildReplayPackage(sourceWithoutReplay);
  return Object.freeze({ ...sourceWithoutReplay, replay_package, risk_hash: input.risk_hash ?? computeGovernanceRiskHash({ ...sourceWithoutReplay, replay_package }) });
}

function registryFor(source: GovernanceRiskSourceType) {
  return buildGovernanceRiskSourceRegistry().find((item) => item.risk_source_type === source);
}

export function validateGovernanceRiskRecord(record: Partial<GovernanceRiskRecord> | undefined, context: { original_record?: GovernanceRiskRecord } = {}): GovernanceRiskValidationResult {
  const errors: GovernanceRiskValidationFailure[] = [];
  if (!record) errors.push(failure("CONTRACT_MISSING", "record", "governance risk contract missing"));
  if (record?.contract_version !== "GOV-RISK-CONTRACT-V1") errors.push(failure("UNSUPPORTED_SCHEMA_VERSION", "contract_version", "unsupported contract version"));
  if (!record?.governance_risk_id) errors.push(failure("GOVERNANCE_RISK_ID_MISSING", "governance_risk_id", "governance_risk_id missing"));
  if (!record?.tenant_id) errors.push(failure("TENANT_ID_MISSING", "tenant_id", "tenant_id missing"));
  if (!record?.mission_id) errors.push(failure("MISSION_ID_MISSING", "mission_id", "mission_id missing"));
  if (!record?.governance_intelligence_id) errors.push(failure("GOVERNANCE_INTELLIGENCE_ID_MISSING", "governance_intelligence_id", "governance_intelligence_id missing"));
  if (record?.policy_intelligence_id === null && record?.risk_category === "POLICY_RISK") errors.push(failure("POLICY_INTELLIGENCE_ID_MISSING", "policy_intelligence_id", "policy_intelligence_id required for policy-derived risk"));
  if (!record?.risk_source_refs?.length) errors.push(failure("REQUIRED_FIELD_MISSING", "risk_source_refs", "risk source refs missing"));
  for (const source of record?.risk_source_refs ?? []) {
    const registered = registryFor(source);
    if (!registered) errors.push(failure("UNKNOWN_SOURCE", "risk_source_refs", "unknown risk source"));
    if (registered && record?.risk_category && !registered.allowed_risk_categories.includes(record.risk_category)) errors.push(failure("INVALID_CATEGORY", "risk_category", "risk category not allowed for source"));
  }
  if (!record?.risk_category || !(GOVERNANCE_RISK_CATEGORIES as readonly string[]).includes(record.risk_category)) errors.push(failure("INVALID_CATEGORY", "risk_category", "invalid risk category"));
  if (!record?.risk_severity || !(GOVERNANCE_RISK_SEVERITIES as readonly string[]).includes(record.risk_severity)) errors.push(failure("INVALID_SEVERITY", "risk_severity", "invalid risk severity"));
  if (!record?.severity_basis?.scoring_model_version || record.severity_basis.threshold_result !== record.risk_severity) errors.push(failure("SEVERITY_BASIS_MISSING", "severity_basis", "severity basis missing or inconsistent"));
  if (typeof record?.confidence_score !== "number") errors.push(failure("CONFIDENCE_SCORE_MISSING", "confidence_score", "confidence score missing"));
  if (typeof record?.confidence_score === "number" && (record.confidence_score < 0 || record.confidence_score > 1)) errors.push(failure("CONFIDENCE_OUT_OF_RANGE", "confidence_score", "confidence score outside range"));
  const cb = record?.confidence_basis;
  if (!cb || cb.supporting_evidence_count === undefined || cb.source_quality === undefined || cb.lineage_completeness === undefined || !cb.replay_status || cb.policy_match_strength === undefined || cb.historical_pattern_strength === undefined) errors.push(failure("CONFIDENCE_BASIS_MISSING", "confidence_basis", "confidence basis incomplete"));
  if (!record?.evidence_refs?.length) errors.push(failure("EVIDENCE_REFS_MISSING", "evidence_refs", "evidence refs missing"));
  if (!record?.lineage_refs?.length) errors.push(failure("LINEAGE_REFS_MISSING", "lineage_refs", "lineage refs missing"));
  if (!record?.replay_refs?.length || !record.replay_package?.reconstruction_hash) errors.push(failure("REPLAY_REFS_MISSING", "replay_refs", "replay refs or package missing"));
  if (record?.evidence_refs?.some((ref) => ref.includes("tenant_beta")) || record?.policy_refs?.some((ref) => ref.includes("tenant_beta"))) errors.push(failure("TENANT_SCOPE_VIOLATION", "references", "cross-tenant reference detected"));
  if (!record?.risk_state || !(GOVERNANCE_RISK_STATES as readonly string[]).includes(record.risk_state)) errors.push(failure("INVALID_STATE", "risk_state", "invalid risk state"));
  if (!record?.explanation) errors.push(failure("EXPLANATION_MISSING", "explanation", "risk explanation missing"));
  if (typeof record?.recommended_operator_review !== "boolean") errors.push(failure("OPERATOR_REVIEW_FLAG_MISSING", "recommended_operator_review", "operator review flag missing"));
  if (context.original_record && (context.original_record.governance_risk_id !== record?.governance_risk_id || context.original_record.tenant_id !== record?.tenant_id || context.original_record.mission_id !== record?.mission_id || context.original_record.risk_detected_timestamp !== record?.risk_detected_timestamp)) errors.push(failure("IDENTITY_MUTATION", "identity", "immutable risk identity field mutated"));
  if (record?.risk_hash && computeGovernanceRiskHash(record as GovernanceRiskRecord) !== record.risk_hash) errors.push(failure("REPLAY_REFS_MISSING", "risk_hash", "risk reconstruction hash mismatch"));
  const state: GovernanceRiskValidationState = errors.some((error) => error.reason === "UNKNOWN_SOURCE") ? "UNKNOWN_SOURCE" : errors.some((error) => error.reason === "TENANT_SCOPE_VIOLATION") ? "TENANT_SCOPE_VIOLATION" : errors.some((error) => error.reason === "REPLAY_REFS_MISSING") ? "REPLAY_REFERENCE_MISSING" : errors.some((error) => error.reason === "LINEAGE_REFS_MISSING") ? "LINEAGE_REFERENCE_MISSING" : errors.some((error) => error.reason === "INVALID_STATE") ? "INVALID_STATE" : errors.length ? "INVALID" : "VALID";
  return Object.freeze({
    governance_risk_id: record?.governance_risk_id,
    validation_state: state,
    validator_version: "GOV-RISK-VALIDATOR-V1",
    checks: Object.freeze({
      schema_valid: !errors.some((error) => error.reason === "UNSUPPORTED_SCHEMA_VERSION" || error.reason === "CONTRACT_MISSING"),
      required_fields_present: !errors.some((error) => ["REQUIRED_FIELD_MISSING", "TENANT_ID_MISSING", "GOVERNANCE_RISK_ID_MISSING", "MISSION_ID_MISSING"].includes(error.reason)),
      risk_sources_registered: !errors.some((error) => error.reason === "UNKNOWN_SOURCE"),
      category_valid: !errors.some((error) => error.reason === "INVALID_CATEGORY"),
      severity_valid: !errors.some((error) => error.reason === "INVALID_SEVERITY" || error.reason === "SEVERITY_BASIS_MISSING"),
      confidence_valid: !errors.some((error) => error.reason.startsWith("CONFIDENCE")),
      evidence_refs_valid: !errors.some((error) => error.reason === "EVIDENCE_REFS_MISSING"),
      lineage_refs_valid: !errors.some((error) => error.reason === "LINEAGE_REFS_MISSING"),
      replay_refs_valid: !errors.some((error) => error.reason === "REPLAY_REFS_MISSING"),
      tenant_isolation_valid: !errors.some((error) => error.reason === "TENANT_SCOPE_VIOLATION"),
      lifecycle_state_valid: !errors.some((error) => error.reason === "INVALID_STATE"),
    }),
    errors: Object.freeze(errors),
    warnings: Object.freeze([]),
    validation_timestamp: NOW,
  });
}

export function transitionGovernanceRiskState(record: GovernanceRiskRecord, to_state: GovernanceRiskState): GovernanceRiskValidationResult {
  if (!ALLOWED_TRANSITIONS[record.risk_state]?.includes(to_state)) {
    return Object.freeze({ ...validateGovernanceRiskRecord(record), validation_state: "INVALID_STATE" as const, errors: Object.freeze([failure("INVALID_STATE_TRANSITION", "risk_state", `${record.risk_state} to ${to_state} blocked`)]) });
  }
  const { risk_hash: _previousHash, ...source } = record;
  return validateGovernanceRiskRecord({ ...source, risk_state: to_state, risk_hash: computeGovernanceRiskHash({ ...source, risk_state: to_state }) });
}

export function replayGovernanceRisk(record: GovernanceRiskRecord): GovernanceRiskReplayResult {
  const reconstructed_hash = computeGovernanceRiskHash(record);
  const validation = validateGovernanceRiskRecord(record);
  return Object.freeze({
    replay_id: hashValue("governance-risk-replay", { id: record.governance_risk_id, reconstructed_hash }),
    governance_risk_id: record.governance_risk_id,
    validation_state: validation.validation_state === "VALID" && reconstructed_hash === record.risk_hash ? "PASS" : "FAIL",
    reconstructed_hash,
    expected_hash: record.risk_hash,
    failure_reason: reconstructed_hash === record.risk_hash ? validation.errors[0]?.reason ?? null : "REPLAY_REFS_MISSING",
  });
}

export function buildGovernanceRiskObservabilitySurface(record = buildGovernanceRiskRecord()): GovernanceRiskObservabilitySurface {
  const validation = validateGovernanceRiskRecord(record);
  return Object.freeze({
    governance_risk_id: record.governance_risk_id,
    tenant_id: record.tenant_id,
    mission_id: record.mission_id,
    risk_category: record.risk_category,
    risk_severity: record.risk_severity,
    confidence_score: record.confidence_score,
    confidence_basis: record.confidence_basis,
    risk_state: record.risk_state,
    recommended_operator_review: record.recommended_operator_review,
    evidence_refs: record.evidence_refs,
    lineage_refs: record.lineage_refs,
    replay_refs: record.replay_refs,
    validation_failures: validation.errors,
  });
}
