import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  GovernanceInfluence,
  GovernanceLineageDoctrine,
  GovernanceLineageErrorCode,
  GovernanceLineageExplanationResult,
  GovernanceLineageFailureReason,
  GovernanceLineageInfluenceResolution,
  GovernanceLineageObjectType,
  GovernanceLineageObservabilitySurface,
  GovernanceLineageRecord,
  GovernanceLineageReplayResult,
  GovernanceLineageScenario,
  GovernanceLineageState,
  GovernanceLineageTransitionResult,
  GovernanceLineageType,
  GovernanceLineageValidationFailure,
  GovernanceLineageValidationResult,
} from "@/types/governance-lineage";

const NOW: "2026-06-26T17:00:00.000Z" = "2026-06-26T17:00:00.000Z";
const CONTRACT_VERSION: "GOVERNANCE-LINEAGE-CONTRACT-V1" = "GOVERNANCE-LINEAGE-CONTRACT-V1";
const TYPES: readonly GovernanceLineageType[] = Object.freeze(["POLICY", "CONSTITUTION", "AUTHORITY", "EVIDENCE", "RISK", "COMPLIANCE", "RECOMMENDATION", "ESCALATION", "DECISION", "GOVERNANCE"]);
const STATES: readonly GovernanceLineageState[] = Object.freeze(["CREATED", "VALIDATED", "CERTIFIED", "SUPERSEDED", "ARCHIVED"]);
const RELATIONSHIPS = Object.freeze(["SUPPORTED_BY", "INFLUENCED_BY", "REQUIRED_BY", "OVERRIDDEN_BY", "CONSTRAINED_BY", "ESCALATED_BY", "VALIDATED_BY", "SUPERSEDED_BY", "CORRELATED_WITH"] as const);
const ERROR_CODES: Readonly<Record<GovernanceLineageFailureReason, GovernanceLineageErrorCode>> = Object.freeze({
  MISSING_LINEAGE_ID: "GLC-001",
  DUPLICATE_LINEAGE_ID: "GLC-002",
  MISSING_TENANT_ID: "GLC-003",
  MISSING_MISSION_ID: "GLC-004",
  INVALID_LINEAGE_TYPE: "GLC-005",
  MISSING_GOVERNANCE_OBJECT: "GLC-006",
  MISSING_POLICY_REFERENCE: "GLC-007",
  MISSING_EVIDENCE_REFERENCE: "GLC-008",
  MISSING_REPLAY_METADATA: "GLC-009",
  HIDDEN_INFLUENCE_DETECTED: "GLC-010",
  CROSS_TENANT_REFERENCE: "GLC-011",
  INVALID_STATE_TRANSITION: "GLC-012",
  IMMUTABLE_FIELD_MUTATION: "GLC-013",
  DETERMINISTIC_HASH_MISMATCH: "GLC-014",
  LINEAGE_VALIDATION_FAILED: "GLC-015",
});

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function uniqueSorted(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values.filter(Boolean))].sort());
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
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

function failure(reason: GovernanceLineageFailureReason, field_path: string, message: string): GovernanceLineageValidationFailure {
  return Object.freeze({ error_code: ERROR_CODES[reason], reason, field_path, message, fail_closed: true });
}

function objectTypeFor(type: GovernanceLineageType): GovernanceLineageObjectType {
  if (type === "RECOMMENDATION") return "Recommendation";
  if (type === "COMPLIANCE") return "ComplianceFinding";
  if (type === "RISK") return "RiskAssessment";
  if (type === "ESCALATION") return "EscalationDecision";
  if (type === "POLICY") return "PolicyEvaluation";
  return "GovernanceDecision";
}

function typeForScenario(scenario: GovernanceLineageScenario): GovernanceLineageType {
  return TYPES.includes(scenario as GovernanceLineageType) ? scenario as GovernanceLineageType : "GOVERNANCE";
}

function confidenceLevel(score: number) {
  if (score >= 95) return "CERTIFICATION_READY" as const;
  if (score >= 85) return "HIGH" as const;
  if (score >= 65) return "MODERATE" as const;
  return "LOW" as const;
}

function influence(source_type: GovernanceLineageType, source_identifier: string, relationship: GovernanceInfluence["relationship"], weight: number, confidence: number, reason: string): GovernanceInfluence {
  return Object.freeze({ source_type, source_identifier, relationship, weight, confidence, reason });
}

export function buildGovernanceLineageDoctrine(): GovernanceLineageDoctrine {
  return Object.freeze({
    principles: Object.freeze(["immutable", "deterministic", "replay-safe", "explainable", "auditable", "evidence-driven", "constitution-aware", "policy-aware", "advisory-only", "tenant-safe", "fail-closed", "certification-ready"] as const),
    supported_lineage_types: TYPES,
    supported_relationships: RELATIONSHIPS,
    supported_states: STATES,
    contract_version: CONTRACT_VERSION,
  });
}

export function computeGovernanceLineageHash(record: Omit<GovernanceLineageRecord, "lineage_hash"> | GovernanceLineageRecord): string {
  const { lineage_hash: _hash, ...source } = record as GovernanceLineageRecord;
  return hashValue("governance-lineage-record", {
    governance_lineage_id: source.governance_lineage_id,
    tenant_id: source.tenant_id,
    mission_id: source.mission_id,
    session_id: source.session_id,
    lineage_version: source.lineage_version,
    created_timestamp: source.created_timestamp,
    created_by: source.created_by,
    lineage_type: source.lineage_type,
    governance_object: source.governance_object,
    parent_lineage_id: source.parent_lineage_id,
    root_lineage_id: source.root_lineage_id,
    child_lineage_ids: source.child_lineage_ids,
    previous_lineage_id: source.previous_lineage_id,
    superseded_by: source.superseded_by,
    references: source.references,
    influence_chain: source.influence_chain,
    confidence: source.confidence,
    replay_metadata: source.replay_metadata,
    explanation_metadata: source.explanation_metadata,
    state: source.state,
    advisory_boundary: source.advisory_boundary,
  });
}

export function registerGovernanceLineage(input: { tenant_id?: string; mission_id?: string; session_id?: string; scenario?: GovernanceLineageScenario } = {}): GovernanceLineageRecord {
  const scenario = input.scenario ?? "BASELINE";
  const tenant_id = scenario === "MISSING_TENANT" ? "" : input.tenant_id ?? "tenant_alpha";
  const mission_id = scenario === "MISSING_MISSION" ? "" : input.mission_id ?? "mission_governance_lineage";
  const refTenant = scenario === "CROSS_TENANT" ? "tenant_beta" : tenant_id || "tenant_alpha";
  const lineage_type = scenario === "INVALID_TYPE" ? "UNSUPPORTED" as GovernanceLineageType : typeForScenario(scenario);
  const identitySource = { tenant_id, mission_id, scenario, lineage_type };
  const governance_lineage_id = scenario === "MISSING_ID" ? "" : `GLIN-7G1-${hashValue("governance-lineage-id", identitySource).slice(0, 10).toUpperCase()}`;
  const root_lineage_id = governance_lineage_id ? `GLIN-ROOT-${hashValue("governance-lineage-root", { tenant_id, mission_id }).slice(0, 10).toUpperCase()}` : "";
  const policy_ids = scenario === "MISSING_POLICY" ? Object.freeze([]) : Object.freeze([`policy_${refTenant}_governance_lineage_v1`, `policy_${refTenant}_advisory_boundary_v1`]);
  const evidence_ids = scenario === "MISSING_EVIDENCE" ? Object.freeze([]) : Object.freeze([`evidence_${refTenant}_lineage_observation`, `evidence_${refTenant}_lineage_truth_event`]);
  const replayMissing = scenario === "MISSING_REPLAY";
  const influence_chain = scenario === "HIDDEN_INFLUENCE" ? Object.freeze([]) : Object.freeze([
    influence("POLICY", policy_ids[0] ?? `policy_${refTenant}_missing`, "REQUIRED_BY", 0.22, 96, "Governance conclusion requires policy lineage."),
    influence("EVIDENCE", evidence_ids[0] ?? `evidence_${refTenant}_missing`, "SUPPORTED_BY", 0.28, 95, "Evidence supports the governance conclusion."),
    influence("RISK", `risk_${refTenant}_governance_lineage`, "INFLUENCED_BY", 0.18, 88, "Risk intelligence influences the conclusion."),
    influence("COMPLIANCE", `compliance_${refTenant}_lineage_evaluation`, "VALIDATED_BY", 0.16, 90, "Compliance evaluation validates governance posture."),
    influence("ESCALATION", `escalation_${refTenant}_7f_certified`, "CORRELATED_WITH", 0.16, 91, "Escalation certification correlates with governance lineage."),
  ]);
  const confidenceScore = Math.round(influence_chain.reduce((sum, item) => sum + item.confidence * item.weight, 0) / Math.max(0.01, influence_chain.reduce((sum, item) => sum + item.weight, 0)));
  const base: Omit<GovernanceLineageRecord, "lineage_hash"> = Object.freeze({
    governance_lineage_id,
    tenant_id,
    mission_id,
    session_id: input.session_id ?? `session_${tenant_id || "missing"}_7g1`,
    lineage_version: CONTRACT_VERSION,
    created_timestamp: NOW,
    created_by: `operator_${tenant_id || "missing"}_governance`,
    lineage_type,
    governance_object: scenario === "MISSING_OBJECT" ? Object.freeze({ governance_object: "", object_type: "GovernanceDecision", object_identifier: "", object_version: "" }) : Object.freeze({
      governance_object: `${objectTypeFor(lineage_type)}:${lineage_type.toLowerCase()}_lineage`,
      object_type: objectTypeFor(lineage_type),
      object_identifier: `object_${refTenant}_${lineage_type.toLowerCase()}_001`,
      object_version: "v1",
    }),
    parent_lineage_id: null,
    root_lineage_id,
    child_lineage_ids: Object.freeze([`GLIN-CHILD-${hashValue("governance-lineage-child", identitySource).slice(0, 8).toUpperCase()}`]),
    previous_lineage_id: null,
    superseded_by: null,
    references: Object.freeze({
      policy_ids,
      constitutional_rule_ids: Object.freeze([`constitution_${refTenant}_operator_supremacy`, `constitution_${refTenant}_advisory_only`]),
      authority_ids: Object.freeze([`authority_${refTenant}_operator_review`, `authority_${refTenant}_no_expansion`]),
      evidence_ids,
      risk_ids: Object.freeze([`risk_${refTenant}_governance_lineage`]),
      compliance_ids: Object.freeze([`compliance_${refTenant}_lineage_evaluation`]),
      recommendation_ids: Object.freeze([`recommendation_${refTenant}_7f_advisory`]),
      escalation_ids: Object.freeze([`escalation_${refTenant}_7f_certified`]),
    }),
    influence_chain,
    confidence: Object.freeze({
      confidence_score: confidenceScore,
      confidence_level: confidenceLevel(confidenceScore),
      confidence_method: "EVIDENCE_WEIGHTED_LINEAGE_V1",
      supporting_lineage_refs: Object.freeze([root_lineage_id, governance_lineage_id].filter(Boolean)),
    }),
    replay_metadata: Object.freeze({
      replay_id: replayMissing ? "" : `GLR-7G1-${hashValue("governance-lineage-replay", identitySource).slice(0, 10).toUpperCase()}`,
      reconstruction_hash: replayMissing ? "" : hashValue("governance-lineage-reconstruction", { governance_lineage_id, references: { policy_ids, evidence_ids }, influence_chain }),
      deterministic_hash: replayMissing ? "" : hashValue("governance-lineage-deterministic", { governance_lineage_id, root_lineage_id, influence_chain }),
      truth_record_reference: replayMissing ? "" : `truth_${refTenant}_governance_lineage_${governance_lineage_id.toLowerCase()}`,
      replay_timestamp: replayMissing ? "" : NOW,
    }),
    explanation_metadata: Object.freeze({
      explanation_reference: `explain_${refTenant}_governance_lineage_${governance_lineage_id.toLowerCase()}`,
      summary: `${lineage_type} lineage explains how policy, evidence, risk, compliance, recommendation, and escalation inputs support the governance conclusion.`,
      operator_visible: true,
      explanation_version: "GOVERNANCE-LINEAGE-EXPLANATION-V1",
    }),
    state: scenario === "INVALID_TRANSITION" ? "ARCHIVED" : "CREATED",
    advisory_boundary: Object.freeze({
      advisory_only: true,
      execution_authority: false,
      mutation_authority: false,
      policy_modification_authority: false,
      operator_override_authority: false,
    }),
  });
  const record = Object.freeze({ ...base, lineage_hash: computeGovernanceLineageHash(base) });
  if (scenario === "HASH_MISMATCH") return Object.freeze({ ...record, lineage_hash: "tampered" });
  if (scenario === "DUPLICATE_IDENTIFIER") return Object.freeze({ ...record, child_lineage_ids: Object.freeze([...record.child_lineage_ids, record.governance_lineage_id]) });
  if (scenario === "IMMUTABLE_MUTATION") return Object.freeze({ ...record, previous_lineage_id: record.governance_lineage_id, created_timestamp: "2026-06-27T00:00:00.000Z" });
  return record;
}

export function transitionGovernanceLineageState(from_state: GovernanceLineageState, to_state: GovernanceLineageState): GovernanceLineageTransitionResult {
  const from = STATES.indexOf(from_state);
  const to = STATES.indexOf(to_state);
  const allowed = from >= 0 && to >= 0 && to >= from && !(from_state === "ARCHIVED" && to_state !== "ARCHIVED");
  return Object.freeze({ from_state, to_state, allowed, reason: allowed ? `${from_state} can transition to ${to_state}.` : `${from_state} cannot transition to ${to_state}; reverse or invalid transitions are prohibited.` });
}

export function validateGovernanceLineage(record: Partial<GovernanceLineageRecord> | undefined, registry: readonly Partial<GovernanceLineageRecord>[] = []): GovernanceLineageValidationResult {
  const errors: GovernanceLineageValidationFailure[] = [];
  if (!record?.governance_lineage_id) errors.push(failure("MISSING_LINEAGE_ID", "governance_lineage_id", "governance lineage identifier is required"));
  if (record?.governance_lineage_id && registry.filter((item) => item.governance_lineage_id === record.governance_lineage_id).length > 1) errors.push(failure("DUPLICATE_LINEAGE_ID", "governance_lineage_id", "duplicate governance lineage identifier detected"));
  if (record?.child_lineage_ids?.includes(record.governance_lineage_id ?? "")) errors.push(failure("DUPLICATE_LINEAGE_ID", "child_lineage_ids", "lineage cannot reference its own identifier as a child"));
  if (!record?.tenant_id) errors.push(failure("MISSING_TENANT_ID", "tenant_id", "tenant identifier is required"));
  if (!record?.mission_id) errors.push(failure("MISSING_MISSION_ID", "mission_id", "mission identifier is required"));
  if (!record?.lineage_type || !TYPES.includes(record.lineage_type)) errors.push(failure("INVALID_LINEAGE_TYPE", "lineage_type", "lineage type is unsupported"));
  if (!record?.governance_object?.governance_object || !record.governance_object.object_identifier || !record.governance_object.object_version) errors.push(failure("MISSING_GOVERNANCE_OBJECT", "governance_object", "governance object is required"));
  if (!record?.references?.policy_ids?.length) errors.push(failure("MISSING_POLICY_REFERENCE", "references.policy_ids", "policy references are required"));
  if (!record?.references?.evidence_ids?.length) errors.push(failure("MISSING_EVIDENCE_REFERENCE", "references.evidence_ids", "evidence references are required"));
  if (!record?.influence_chain?.length) errors.push(failure("HIDDEN_INFLUENCE_DETECTED", "influence_chain", "influence chain is required and cannot be hidden"));
  if (record?.influence_chain?.some((item) => !RELATIONSHIPS.includes(item.relationship) || item.weight <= 0 || item.confidence < 0 || !item.reason)) errors.push(failure("LINEAGE_VALIDATION_FAILED", "influence_chain", "influence entries must have supported relationship, positive weight, confidence, and reason"));
  if (!record?.root_lineage_id) errors.push(failure("LINEAGE_VALIDATION_FAILED", "root_lineage_id", "root lineage reference is required"));
  if (!record?.replay_metadata?.replay_id || !record.replay_metadata.reconstruction_hash || !record.replay_metadata.deterministic_hash || !record.replay_metadata.truth_record_reference) errors.push(failure("MISSING_REPLAY_METADATA", "replay_metadata", "replay metadata is required"));
  if (!record?.explanation_metadata?.summary || !record.explanation_metadata.explanation_reference || record.explanation_metadata.operator_visible !== true) errors.push(failure("LINEAGE_VALIDATION_FAILED", "explanation_metadata", "operator-visible explanation metadata is required"));
  if (record?.state && !STATES.includes(record.state)) errors.push(failure("INVALID_STATE_TRANSITION", "state", "lineage state is unsupported"));
  if (record?.state === "ARCHIVED" && !record.superseded_by) errors.push(failure("INVALID_STATE_TRANSITION", "state", "archived lineage must preserve successor reference"));
  if (record?.previous_lineage_id === record?.governance_lineage_id) errors.push(failure("IMMUTABLE_FIELD_MUTATION", "previous_lineage_id", "previous lineage cannot mutate immutable identity"));
  if (record?.created_timestamp && record.created_timestamp !== NOW) errors.push(failure("IMMUTABLE_FIELD_MUTATION", "created_timestamp", "created timestamp mutation detected"));
  if (record && containsTenantLeak(record, record.tenant_id)) errors.push(failure("CROSS_TENANT_REFERENCE", "tenant_id", "cross-tenant lineage reference detected"));
  if (isRecord(record) && ("hidden_influence" in record || "hidden_state" in record || "random_seed" in record)) errors.push(failure("HIDDEN_INFLUENCE_DETECTED", "record", "hidden influence state detected"));
  if (record?.advisory_boundary && (record.advisory_boundary.advisory_only !== true || record.advisory_boundary.execution_authority !== false || record.advisory_boundary.mutation_authority !== false || record.advisory_boundary.policy_modification_authority !== false || record.advisory_boundary.operator_override_authority !== false)) errors.push(failure("LINEAGE_VALIDATION_FAILED", "advisory_boundary", "lineage contract must remain advisory-only"));
  if (record?.lineage_hash && computeGovernanceLineageHash(record as GovernanceLineageRecord) !== record.lineage_hash) errors.push(failure("DETERMINISTIC_HASH_MISMATCH", "lineage_hash", "deterministic lineage hash mismatch"));
  const validation_state = errors.some((error) => error.reason === "CROSS_TENANT_REFERENCE") ? "TENANT_SCOPE_VIOLATION" : errors.some((error) => ["HIDDEN_INFLUENCE_DETECTED", "IMMUTABLE_FIELD_MUTATION", "INVALID_STATE_TRANSITION"].includes(error.reason)) ? "CERTIFICATION_BLOCKED" : errors.some((error) => error.reason === "DETERMINISTIC_HASH_MISMATCH") ? "REPLAY_MISMATCH" : errors.length ? "INVALID" : "VALID";
  return Object.freeze({
    governance_lineage_id: record?.governance_lineage_id,
    validation_state,
    validator_version: "GOVERNANCE-LINEAGE-VALIDATOR-V1",
    checks: Object.freeze({
      identity_valid: !errors.some((error) => ["MISSING_LINEAGE_ID", "DUPLICATE_LINEAGE_ID", "MISSING_TENANT_ID", "MISSING_MISSION_ID", "IMMUTABLE_FIELD_MUTATION"].includes(error.reason)),
      type_valid: !errors.some((error) => error.reason === "INVALID_LINEAGE_TYPE"),
      object_valid: !errors.some((error) => error.reason === "MISSING_GOVERNANCE_OBJECT"),
      references_complete: !errors.some((error) => ["MISSING_POLICY_REFERENCE", "MISSING_EVIDENCE_REFERENCE"].includes(error.reason)),
      influence_chain_complete: !errors.some((error) => ["HIDDEN_INFLUENCE_DETECTED", "LINEAGE_VALIDATION_FAILED"].includes(error.reason) && error.field_path.includes("influence")),
      replay_ready: !errors.some((error) => ["MISSING_REPLAY_METADATA", "DETERMINISTIC_HASH_MISMATCH"].includes(error.reason)),
      explanation_complete: !errors.some((error) => error.field_path === "explanation_metadata"),
      state_valid: !errors.some((error) => error.reason === "INVALID_STATE_TRANSITION"),
      tenant_isolated: !errors.some((error) => error.reason === "CROSS_TENANT_REFERENCE"),
      hidden_influence_absent: !errors.some((error) => error.reason === "HIDDEN_INFLUENCE_DETECTED"),
      advisory_only_enforced: !errors.some((error) => error.field_path === "advisory_boundary"),
      hash_valid: !errors.some((error) => error.reason === "DETERMINISTIC_HASH_MISMATCH"),
    }),
    errors: Object.freeze(errors),
    warnings: Object.freeze([]),
    validation_timestamp: NOW,
  });
}

export function verifyGovernanceReplay(record: GovernanceLineageRecord): GovernanceLineageReplayResult {
  const reconstructed_hash = computeGovernanceLineageHash(record);
  const validation = validateGovernanceLineage(record);
  const reproduced = validation.validation_state === "VALID" && reconstructed_hash === record.lineage_hash;
  return Object.freeze({
    replay_id: hashValue("governance-lineage-replay-result", { id: record.governance_lineage_id, reconstructed_hash }),
    replay_state: reproduced ? "REPRODUCED" : record.replay_metadata?.replay_id ? "MISMATCH" : "INCOMPLETE",
    reconstructed_hash,
    expected_hash: record.lineage_hash,
    reconstructed_lineage_id: record.governance_lineage_id,
    failure_reason: reproduced ? null : validation.errors[0]?.reason ?? "DETERMINISTIC_HASH_MISMATCH",
  });
}

export function getGovernanceLineage(record = registerGovernanceLineage()): GovernanceLineageRecord {
  return record;
}

export function resolveInfluenceChain(record = registerGovernanceLineage()): GovernanceLineageInfluenceResolution {
  return Object.freeze({
    governance_lineage_id: record.governance_lineage_id,
    upstream_influences: record.influence_chain,
    downstream_lineage_ids: record.child_lineage_ids,
    root_lineage_id: record.root_lineage_id,
    influence_hash: hashValue("governance-lineage-influence-resolution", { id: record.governance_lineage_id, influences: record.influence_chain, children: record.child_lineage_ids }),
  });
}

export function explainGovernanceConclusion(record = registerGovernanceLineage()): GovernanceLineageExplanationResult {
  const result = Object.freeze({
    governance_lineage_id: record.governance_lineage_id,
    summary: record.explanation_metadata.summary,
    why_it_exists: `${record.governance_object.object_identifier} exists because ${record.influence_chain.map((item) => `${item.relationship} ${item.source_identifier}`).join("; ")}.`,
    policy_basis: record.references.policy_ids,
    evidence_basis: record.references.evidence_ids,
    risk_basis: record.references.risk_ids,
    compliance_basis: record.references.compliance_ids,
    escalation_basis: record.references.escalation_ids,
    confidence_basis: `${record.confidence.confidence_level} confidence via ${record.confidence.confidence_method} with ${record.confidence.supporting_lineage_refs.length} supporting lineage refs.`,
    operator_visible: record.explanation_metadata.operator_visible,
  });
  return Object.freeze({ ...result, explanation_hash: hashValue("governance-lineage-explanation", result) });
}

export function buildGovernanceLineageObservabilitySurface(record = registerGovernanceLineage()): GovernanceLineageObservabilitySurface {
  const validation = validateGovernanceLineage(record);
  const replay = verifyGovernanceReplay(record);
  return Object.freeze({
    governance_lineage_id: record.governance_lineage_id,
    lineage_type: record.lineage_type,
    object_identifier: record.governance_object.object_identifier,
    state: record.state,
    parent_lineage_id: record.parent_lineage_id,
    root_lineage_id: record.root_lineage_id,
    child_lineage_ids: record.child_lineage_ids,
    influence_count: record.influence_chain.length,
    evidence_refs: record.references.evidence_ids,
    policy_refs: record.references.policy_ids,
    replay_state: replay.replay_state,
    truth_record_reference: record.replay_metadata.truth_record_reference,
    explanation_summary: record.explanation_metadata.summary,
    advisory_only_notice: "Governance lineage is advisory-only; it explains governance conclusions without executing actions, mutating policy, or overriding operators.",
    validation_failures: Object.freeze(validation.errors.map((error) => error.reason)),
  });
}

export function getGovernanceLineageContract() {
  const baseline_lineage = registerGovernanceLineage();
  return Object.freeze({ doctrine: buildGovernanceLineageDoctrine(), baseline_lineage, observability: buildGovernanceLineageObservabilitySurface(baseline_lineage) });
}
