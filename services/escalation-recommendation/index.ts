import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { validateEscalationContractRecord } from "@/services/escalation-contract";
import { prioritizeEscalations, validateEscalationPrioritization } from "@/services/escalation-prioritization";
import type { EscalationConfidenceLevel } from "@/types/escalation-contract";
import type { EscalationPrioritizationResult, EscalationPrioritizationScenario, EscalationPriorityLevel, EscalationPriorityRecord } from "@/types/escalation-prioritization";
import type {
  EscalationRecommendationDoctrine,
  EscalationRecommendationFailureReason,
  EscalationRecommendationMetrics,
  EscalationRecommendationObservabilitySurface,
  EscalationRecommendationRecord,
  EscalationRecommendationReplayResult,
  EscalationRecommendationResult,
  EscalationRecommendationScenario,
  EscalationRecommendationType,
  EscalationRecommendationValidationFailure,
  EscalationRecommendationValidationResult,
} from "@/types/escalation-recommendation";

const NOW: "2026-06-26T16:00:00.000Z" = "2026-06-26T16:00:00.000Z";
const CONTRACT_VERSION: "ESCALATION-RECOMMENDATION-V1" = "ESCALATION-RECOMMENDATION-V1";
const TYPES: readonly EscalationRecommendationType[] = Object.freeze(["OPERATOR_NOTIFICATION", "GOVERNANCE_REVIEW", "POLICY_REVIEW", "COMPLIANCE_REVIEW", "CONSTITUTIONAL_REVIEW", "AUTHORITY_REVIEW", "EMERGENCY_GOVERNANCE_REVIEW"]);
const DECISION_MATRIX: Readonly<Record<EscalationPriorityLevel, readonly EscalationRecommendationType[]>> = Object.freeze({
  INFO: Object.freeze(["OPERATOR_NOTIFICATION"] as const),
  LOW: Object.freeze(["OPERATOR_NOTIFICATION", "GOVERNANCE_REVIEW"] as const),
  MEDIUM: Object.freeze(["GOVERNANCE_REVIEW", "POLICY_REVIEW"] as const),
  HIGH: Object.freeze(["GOVERNANCE_REVIEW", "COMPLIANCE_REVIEW", "AUTHORITY_REVIEW"] as const),
  CRITICAL: Object.freeze(["EMERGENCY_GOVERNANCE_REVIEW", "CONSTITUTIONAL_REVIEW", "OPERATOR_NOTIFICATION"] as const),
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

function failure(reason: EscalationRecommendationFailureReason, field_path: string, message: string): EscalationRecommendationValidationFailure {
  return Object.freeze({ failure_id: hashValue("escalation-recommendation-validation-failure", { reason, field_path, message }), reason, field_path, message, fail_closed: true });
}

function prioritizationScenarioFor(scenario: EscalationRecommendationScenario): EscalationPrioritizationScenario {
  if (["MISSING_PRIORITY_ASSIGNMENT", "UNSUPPORTED_RECOMMENDATION", "MISSING_RECOMMENDATION_EVIDENCE", "INCOMPLETE_RECOMMENDATION_CONTEXT", "RECOMMENDATION_REPLAY_MISMATCH", "BROKEN_RECOMMENDATION_LINEAGE", "CROSS_TENANT_RECOMMENDATION", "HIDDEN_RECOMMENDATION_STATE", "RECOMMENDATION_HASH_MISMATCH", "RECOMMENDATION_RESULT_HASH_MISMATCH"].includes(scenario)) return "BASELINE";
  return scenario as EscalationPrioritizationScenario;
}

function confidenceLevel(score: number): EscalationConfidenceLevel {
  if (score >= 95) return "CERTIFICATION_READY";
  if (score >= 85) return "HIGH";
  if (score >= 65) return "MODERATE";
  return "LOW";
}

function reviewFor(type: EscalationRecommendationType): string {
  return type.toLowerCase().replaceAll("_", " ");
}

function actionFor(type: EscalationRecommendationType, priority: EscalationPriorityLevel): string {
  switch (type) {
    case "OPERATOR_NOTIFICATION":
      return `Notify responsible operators about ${priority} governance escalation conditions.`;
    case "GOVERNANCE_REVIEW":
      return `Open formal governance review for ${priority} escalation findings.`;
    case "POLICY_REVIEW":
      return "Review governance policy consistency, completeness, and recurring failure signals.";
    case "COMPLIANCE_REVIEW":
      return "Review compliance degradation and corrective-action verification requirements.";
    case "CONSTITUTIONAL_REVIEW":
      return "Review constitutional interpretation, precedence, and boundary implications.";
    case "AUTHORITY_REVIEW":
      return "Review authority assignments, delegation boundaries, and privilege exposure.";
    case "EMERGENCY_GOVERNANCE_REVIEW":
      return "Initiate emergency governance review workflow for immediate human attention.";
  }
}

function expectedRecommendationId(priority: EscalationPriorityRecord, type: EscalationRecommendationType, source_hash: string): string {
  return `EREC-7F4-${hashValue("escalation-recommendation-id", { priority_id: priority.priority_id, escalation_id: priority.escalation_id, type, source_hash }).slice(0, 10).toUpperCase()}`;
}

function computeConfidence(priority: EscalationPriorityRecord, type: EscalationRecommendationType) {
  let confidence_score = Math.min(100, priority.confidence.confidence_score);
  if (priority.evidence_refs.length === 0) confidence_score -= 45;
  if (priority.governance_refs.length === 0) confidence_score -= 30;
  if (priority.replay_refs.length === 0) confidence_score -= 20;
  if (type === "EMERGENCY_GOVERNANCE_REVIEW" && priority.priority_level !== "CRITICAL") confidence_score -= 20;
  confidence_score = Math.max(0, confidence_score);
  const confidence_inputs = Object.freeze([
    `priority:${priority.priority_id}`,
    `priority_level:${priority.priority_level}`,
    `priority_confidence:${priority.confidence.confidence_score}`,
    `type:${type}`,
    `evidence:${priority.evidence_refs.length}`,
    `governance:${priority.governance_refs.length}`,
    `replay:${priority.replay_refs.length}`,
  ]);
  return Object.freeze({
    confidence_score,
    confidence_level: confidenceLevel(confidence_score),
    confidence_reason: "Recommendation confidence is derived from validated priority confidence, evidence completeness, governance context, replay readiness, and decision-matrix fit.",
    confidence_inputs,
    confidence_hash: hashValue("escalation-recommendation-confidence", confidence_inputs),
  });
}

export function computeEscalationRecommendationRecordHash(record: Omit<EscalationRecommendationRecord, "recommendation_hash">): string {
  return hashValue("escalation-recommendation-record", {
    recommendation_id: record.recommendation_id,
    recommendation_type: record.recommendation_type,
    recommended_action: record.recommended_action,
    recommended_review: record.recommended_review,
    priority_level: record.priority_level,
    priority_id: record.priority_id,
    escalation_id: record.escalation_id,
    tenant_id: record.tenant_id,
    mission_id: record.mission_id,
    recommendation_reason: record.recommendation_reason,
    recommendation_timestamp: record.recommendation_timestamp,
    governance_context: record.governance_context,
    evidence: record.evidence,
    confidence_hash: record.confidence.confidence_hash,
    lineage: record.lineage,
    replay_refs: record.replay_refs,
    truth_ledger_refs: record.truth_ledger_refs,
    explainability: record.explainability,
    certification_metadata: record.certification_metadata,
    advisory_boundary: record.advisory_boundary,
  });
}

function buildRecommendationRecord(priority: EscalationPriorityRecord, type: EscalationRecommendationType, source_hash: string): EscalationRecommendationRecord {
  const recommendation_id = expectedRecommendationId(priority, type, source_hash);
  const confidence = computeConfidence(priority, type);
  const governance_context = Object.freeze({
    constitutional_context: priority.explainability.constitutional_basis,
    authority_context: priority.explainability.authority_basis,
    policy_context: priority.explainability.policy_basis,
    compliance_context: priority.explainability.compliance_basis,
    risk_context: priority.governance_refs.filter((ref) => ref.includes("risk")),
    operational_context: uniqueSorted([...priority.replay_refs, ...priority.lineage.trigger_chain]),
  });
  const truth_record_ref = `truth_${priority.tenant_id}_recommendation_${recommendation_id.toLowerCase()}`;
  const base: Omit<EscalationRecommendationRecord, "recommendation_hash"> = Object.freeze({
    recommendation_id,
    recommendation_type: type,
    recommended_action: actionFor(type, priority.priority_level),
    recommended_review: reviewFor(type),
    priority_level: priority.priority_level,
    priority_id: priority.priority_id,
    escalation_id: priority.escalation_id,
    tenant_id: priority.tenant_id,
    mission_id: priority.mission_id,
    recommendation_reason: `${type} generated because ${priority.priority_level} priority ${priority.priority_id} maps deterministically to the escalation recommendation decision matrix.`,
    recommendation_timestamp: NOW,
    governance_context,
    evidence: Object.freeze({
      escalation_id: priority.escalation_id,
      priority_id: priority.priority_id,
      evidence_ids: priority.evidence_refs,
      truth_record_ids: uniqueSorted([...priority.truth_ledger_refs, truth_record_ref]),
      policy_ids: priority.explainability.policy_basis,
      compliance_ids: priority.explainability.compliance_basis,
      risk_ids: governance_context.risk_context,
      authority_ids: priority.explainability.authority_basis,
    }),
    confidence,
    lineage: Object.freeze({
      recommendation_lineage_id: `ERL-7F4-${hashValue("escalation-recommendation-lineage", { recommendation_id, priority_id: priority.priority_id }).slice(0, 10).toUpperCase()}`,
      parent_recommendation: null,
      root_recommendation: recommendation_id,
      related_escalations: Object.freeze([priority.escalation_id]),
      recommendation_history: Object.freeze([priority.escalation_id, priority.priority_id, recommendation_id]),
      trigger_chain: priority.lineage.trigger_chain,
    }),
    replay_refs: priority.replay_refs,
    truth_ledger_refs: Object.freeze([truth_record_ref]),
    explainability: Object.freeze({
      why_generated: `${type} was selected because ${priority.priority_level} priority maps to ${DECISION_MATRIX[priority.priority_level].join(", ")}.`,
      triggering_escalation: priority.escalation_id,
      priority_influence: `${priority.priority_level} priority with score ${priority.priority_score} controlled the deterministic response selection.`,
      constitutional_basis: priority.explainability.constitutional_basis,
      authority_basis: priority.explainability.authority_basis,
      policy_basis: priority.explainability.policy_basis,
      compliance_basis: priority.explainability.compliance_basis,
      evidence_basis: priority.evidence_refs,
      alternatives_not_selected: Object.freeze(TYPES.filter((candidate) => !DECISION_MATRIX[priority.priority_level].includes(candidate))),
      confidence_explanation: confidence.confidence_reason,
    }),
    certification_metadata: Object.freeze({
      recommendation_version: CONTRACT_VERSION,
      validation_state: "VALID",
      certification_prerequisite: "ESCALATION-CERTIFICATION-PREREQ-V1",
    }),
    advisory_boundary: Object.freeze({
      advisory_only: true,
      execution_authority: false,
      mutation_authority: false,
      policy_modification_authority: false,
      approval_authority: false,
      operator_override_authority: false,
    }),
  });
  return Object.freeze({ ...base, recommendation_hash: computeEscalationRecommendationRecordHash(base) });
}

function applyScenarioMutations(records: readonly EscalationRecommendationRecord[], scenario: EscalationRecommendationScenario): readonly EscalationRecommendationRecord[] {
  if (!records.length) return records;
  const first = records[0];
  switch (scenario) {
    case "UNSUPPORTED_RECOMMENDATION":
      return Object.freeze([{ ...first, recommendation_type: "AUTONOMOUS_REMEDIATION" as EscalationRecommendationType }, ...records.slice(1)]);
    case "MISSING_RECOMMENDATION_EVIDENCE":
      return Object.freeze([{ ...first, evidence: { ...first.evidence, evidence_ids: Object.freeze([]), truth_record_ids: Object.freeze([]) } }, ...records.slice(1)]);
    case "INCOMPLETE_RECOMMENDATION_CONTEXT":
      return Object.freeze([{ ...first, governance_context: { ...first.governance_context, policy_context: Object.freeze([]), authority_context: Object.freeze([]), operational_context: Object.freeze([]) } }, ...records.slice(1)]);
    case "RECOMMENDATION_REPLAY_MISMATCH":
      return Object.freeze([{ ...first, replay_refs: Object.freeze([]) }, ...records.slice(1)]);
    case "BROKEN_RECOMMENDATION_LINEAGE":
      return Object.freeze([{ ...first, lineage: { ...first.lineage, recommendation_history: Object.freeze([]), trigger_chain: Object.freeze([]) } }, ...records.slice(1)]);
    case "CROSS_TENANT_RECOMMENDATION":
      return Object.freeze([{ ...first, evidence: { ...first.evidence, evidence_ids: Object.freeze([...first.evidence.evidence_ids, "evidence_tenant_beta_recommendation_leak"]) } }, ...records.slice(1)]);
    case "RECOMMENDATION_HASH_MISMATCH":
      return Object.freeze([{ ...first, recommendation_hash: "tampered" }, ...records.slice(1)]);
    default:
      return records;
  }
}

function ledgerFor(result: Pick<EscalationRecommendationResult, "tenant_id" | "mission_id" | "source_prioritization" | "recommendation_records" | "recommendation_hash">) {
  return Object.freeze({
    recommendation_ledger_id: `ERLEDGER-7F4-${hashValue("escalation-recommendation-ledger", result.recommendation_hash).slice(0, 10).toUpperCase()}`,
    tenant_id: result.tenant_id,
    mission_id: result.mission_id,
    source_prioritization_hash: result.source_prioritization.prioritization_hash,
    recommendation_ids: Object.freeze(result.recommendation_records.map((record) => record.recommendation_id)),
    escalation_ids: uniqueSorted(result.recommendation_records.map((record) => record.escalation_id)),
    priority_ids: uniqueSorted(result.recommendation_records.map((record) => record.priority_id)),
    recommendation_types: Object.freeze(result.recommendation_records.map((record) => record.recommendation_type)),
    evidence_refs: uniqueSorted(result.recommendation_records.flatMap((record) => record.evidence.evidence_ids)),
    governance_context_refs: uniqueSorted(result.recommendation_records.flatMap((record) => [...record.governance_context.constitutional_context, ...record.governance_context.authority_context, ...record.governance_context.policy_context, ...record.governance_context.compliance_context, ...record.governance_context.risk_context, ...record.governance_context.operational_context])),
    confidence_refs: Object.freeze(result.recommendation_records.map((record) => record.confidence.confidence_hash)),
    lineage_refs: uniqueSorted(result.recommendation_records.flatMap((record) => [...record.lineage.recommendation_history, ...record.lineage.trigger_chain])),
    replay_refs: uniqueSorted(result.recommendation_records.flatMap((record) => record.replay_refs)),
    truth_ledger_refs: uniqueSorted(result.recommendation_records.flatMap((record) => record.truth_ledger_refs)),
    recommendation_hash: result.recommendation_hash,
    recorded_timestamp: NOW,
  });
}

export function buildEscalationRecommendationDoctrine(): EscalationRecommendationDoctrine {
  return Object.freeze({
    principles: Object.freeze(["deterministic", "priority-driven", "evidence-backed", "governance-policy-evaluated", "confidence-reproducible", "lineage-preserving", "truth-ledger-recorded", "replayable", "explainable", "constitutional-supremacy", "authority-preserving", "advisory-only", "tenant-safe", "certification-ready", "fail-closed"] as const),
    supported_recommendation_types: TYPES,
    decision_matrix: DECISION_MATRIX,
    recommender_version: CONTRACT_VERSION,
  });
}

export function computeEscalationRecommendationHash(input: Pick<EscalationRecommendationResult, "source_prioritization" | "recommendation_records" | "recommended_escalation_ids">): string {
  return hashValue("escalation-recommendation-result", {
    source_prioritization_hash: input.source_prioritization.prioritization_hash,
    recommendation_records: input.recommendation_records.map((record) => ({ recommendation_id: record.recommendation_id, type: record.recommendation_type, hash: record.recommendation_hash })),
    recommended_escalation_ids: input.recommended_escalation_ids,
  });
}

export function generateEscalationRecommendations(input: { tenant_id?: string; mission_id?: string; scenario?: EscalationRecommendationScenario } = {}): EscalationRecommendationResult {
  const scenario = input.scenario ?? "BASELINE";
  const prioritized = prioritizeEscalations({ tenant_id: input.tenant_id, mission_id: input.mission_id, scenario: prioritizationScenarioFor(scenario) });
  const source_prioritization = scenario === "MISSING_PRIORITY_ASSIGNMENT" ? Object.freeze({ ...prioritized, priority_records: Object.freeze([]), prioritized_escalation_ids: Object.freeze([]) }) : prioritized;
  const records = source_prioritization.priority_records.flatMap((priority) => (DECISION_MATRIX[priority.priority_level] ?? []).map((type) => buildRecommendationRecord(priority, type, source_prioritization.prioritization_hash)));
  const recommendation_records = applyScenarioMutations(Object.freeze(records), scenario);
  const sorted_records = Object.freeze([...recommendation_records].sort((a, b) => a.escalation_id.localeCompare(b.escalation_id) || TYPES.indexOf(a.recommendation_type) - TYPES.indexOf(b.recommendation_type)));
  const recommended_escalation_ids = uniqueSorted(sorted_records.map((record) => record.escalation_id));
  const recommendation_hash = scenario === "RECOMMENDATION_RESULT_HASH_MISMATCH" ? "tampered" : computeEscalationRecommendationHash({ source_prioritization, recommendation_records: sorted_records, recommended_escalation_ids });
  const provisional = {
    contract_version: CONTRACT_VERSION,
    tenant_id: source_prioritization.tenant_id,
    mission_id: source_prioritization.mission_id,
    recommender_version: CONTRACT_VERSION,
    source_prioritization,
    recommendation_records: sorted_records,
    recommended_escalation_ids,
    ledger_record: ledgerFor({ tenant_id: source_prioritization.tenant_id, mission_id: source_prioritization.mission_id, source_prioritization, recommendation_records: sorted_records, recommendation_hash }),
    validation_state: "VALID" as const,
    replay_state: "REPRODUCED" as const,
    recommendation_hash,
  };
  const validation = validateEscalationRecommendation(provisional);
  const replay = replayEscalationRecommendation(provisional);
  const result = Object.freeze({ ...provisional, validation_state: validation.validation_state, replay_state: replay.replay_state });
  if (scenario === "HIDDEN_RECOMMENDATION_STATE") return Object.freeze({ ...result, hidden_recommendation_state: true } as never);
  return result;
}

export function validateEscalationRecommendation(result: Partial<EscalationRecommendationResult> | undefined): EscalationRecommendationValidationResult {
  const errors: EscalationRecommendationValidationFailure[] = [];
  if (!result) errors.push(failure("RECOMMENDATION_RESULT_MISSING", "result", "recommendation result missing"));
  if (result?.source_prioritization && validateEscalationPrioritization(result.source_prioritization).validation_state !== "VALID") errors.push(failure("SOURCE_PRIORITIZATION_INVALID", "source_prioritization", "source prioritization must be valid before recommendations"));
  for (const escalation of result?.source_prioritization?.source_detection?.escalation_records ?? []) {
    const contractValidation = validateEscalationContractRecord(escalation);
    for (const error of contractValidation.errors) errors.push(failure(error.reason === "TENANT_SCOPE_VIOLATION" ? "CROSS_TENANT_RECOMMENDATION" : "INVALID_ESCALATION_RECORD", `source_prioritization.source_detection.escalation_records.${escalation.escalation_id}.${error.field_path}`, error.message));
  }
  for (const priority of result?.source_prioritization?.priority_records ?? []) {
    if (!result?.recommendation_records?.some((record) => record.priority_id === priority.priority_id)) errors.push(failure("ESCALATION_NOT_RECOMMENDED", `recommendation_records.${priority.priority_id}`, "priority assignment did not produce a recommendation"));
  }
  if ((result?.source_prioritization?.source_detection?.escalation_records.length ?? 0) > 0 && (result?.source_prioritization?.priority_records.length ?? 0) === 0) errors.push(failure("MISSING_PRIORITY_ASSIGNMENT", "source_prioritization.priority_records", "recommendations require priority assignments"));
  const seen = new Set<string>();
  for (const record of result?.recommendation_records ?? []) {
    if (seen.has(record.recommendation_id)) errors.push(failure("DUPLICATE_RECOMMENDATION_RECORD", `recommendation_records.${record.recommendation_id}`, "duplicate recommendation record"));
    seen.add(record.recommendation_id);
    const priority = result?.source_prioritization?.priority_records?.find((item) => item.priority_id === record.priority_id);
    if (priority && record.recommendation_id !== expectedRecommendationId(priority, record.recommendation_type, result?.source_prioritization?.prioritization_hash ?? "")) errors.push(failure("MUTABLE_RECOMMENDATION_IDENTIFIER", `recommendation_records.${record.recommendation_id}.recommendation_id`, "recommendation identifier is not deterministic"));
    if (!TYPES.includes(record.recommendation_type)) errors.push(failure("UNSUPPORTED_RECOMMENDATION_TYPE", `recommendation_records.${record.recommendation_id}.recommendation_type`, "recommendation type is unsupported"));
    if (!record.governance_context.operational_context.length || !record.governance_context.authority_context.length || !record.governance_context.policy_context.length) errors.push(failure("INCOMPLETE_GOVERNANCE_CONTEXT", `recommendation_records.${record.recommendation_id}.governance_context`, "governance context is incomplete"));
    if (!record.evidence.evidence_ids.length || !record.evidence.truth_record_ids.length || !record.evidence.policy_ids.length || !record.evidence.authority_ids.length) errors.push(failure("INCOMPLETE_EVIDENCE", `recommendation_records.${record.recommendation_id}.evidence`, "recommendation evidence is incomplete"));
    if (!record.replay_refs.length) errors.push(failure("REPLAY_MISMATCH_ACCEPTED", `recommendation_records.${record.recommendation_id}.replay_refs`, "replay references are required"));
    if (!record.lineage.recommendation_history.length || !record.lineage.trigger_chain.length || !record.lineage.related_escalations.includes(record.escalation_id)) errors.push(failure("BROKEN_LINEAGE", `recommendation_records.${record.recommendation_id}.lineage`, "recommendation lineage is incomplete"));
    if (!record.truth_ledger_refs.length) errors.push(failure("TRUTH_LEDGER_RECORD_MISSING", `recommendation_records.${record.recommendation_id}.truth_ledger_refs`, "Truth Ledger references are required"));
    if (!Number.isInteger(record.confidence.confidence_score) || record.confidence.confidence_score < 0 || record.confidence.confidence_score > 100) errors.push(failure("CONFIDENCE_INVALID", `recommendation_records.${record.recommendation_id}.confidence.confidence_score`, "confidence score must be an integer from 0 through 100"));
    if (record.confidence.confidence_hash !== hashValue("escalation-recommendation-confidence", record.confidence.confidence_inputs)) errors.push(failure("CONFIDENCE_HASH_MISMATCH", `recommendation_records.${record.recommendation_id}.confidence.confidence_hash`, "confidence hash mismatch"));
    if (record.advisory_boundary.advisory_only !== true || record.advisory_boundary.execution_authority !== false || record.advisory_boundary.mutation_authority !== false || record.advisory_boundary.policy_modification_authority !== false || record.advisory_boundary.approval_authority !== false || record.advisory_boundary.operator_override_authority !== false) errors.push(failure("EXECUTION_AUTHORITY_DETECTED", `recommendation_records.${record.recommendation_id}.advisory_boundary`, "recommendation must remain advisory-only"));
    const { recommendation_hash: _hash, ...withoutHash } = record;
    if (computeEscalationRecommendationRecordHash(withoutHash) !== record.recommendation_hash) errors.push(failure("RECOMMENDATION_HASH_MISMATCH", `recommendation_records.${record.recommendation_id}.recommendation_hash`, "recommendation record hash mismatch"));
  }
  if (containsTenantLeak(result, result?.tenant_id)) errors.push(failure("CROSS_TENANT_RECOMMENDATION", "tenant_id", "cross-tenant recommendation reference detected"));
  if (isRecord(result) && ("hidden_state" in result || "hidden_recommendation_state" in result || "random_seed" in result)) errors.push(failure("HIDDEN_RECOMMENDATION_STATE", "result", "hidden recommendation state detected"));
  if (!result?.ledger_record?.truth_ledger_refs?.length && (result?.recommendation_records?.length ?? 0) > 0) errors.push(failure("TRUTH_LEDGER_RECORD_MISSING", "ledger_record.truth_ledger_refs", "Truth Ledger record missing"));
  if (result?.recommendation_hash && result.source_prioritization && result.recommendation_records && result.recommended_escalation_ids && computeEscalationRecommendationHash(result as EscalationRecommendationResult) !== result.recommendation_hash) errors.push(failure("RECOMMENDATION_RESULT_HASH_MISMATCH", "recommendation_hash", "recommendation result hash mismatch"));
  const validation_state = errors.some((error) => error.reason === "CROSS_TENANT_RECOMMENDATION") ? "TENANT_SCOPE_VIOLATION" : errors.some((error) => ["HIDDEN_RECOMMENDATION_STATE", "EXECUTION_AUTHORITY_DETECTED"].includes(error.reason)) ? "CERTIFICATION_BLOCKED" : errors.some((error) => ["REPLAY_MISMATCH_ACCEPTED", "RECOMMENDATION_HASH_MISMATCH", "RECOMMENDATION_RESULT_HASH_MISMATCH"].includes(error.reason)) ? "REPLAY_MISMATCH" : errors.length ? "INVALID" : "VALID";
  return Object.freeze({
    validation_state,
    validator_version: "ESCALATION-RECOMMENDATION-VALIDATOR-V1",
    checks: Object.freeze({
      source_prioritization_valid: !errors.some((error) => error.reason === "SOURCE_PRIORITIZATION_INVALID"),
      escalation_records_valid: !errors.some((error) => error.reason === "INVALID_ESCALATION_RECORD"),
      priority_assignments_present: !errors.some((error) => error.reason === "MISSING_PRIORITY_ASSIGNMENT"),
      every_priority_recommended: !errors.some((error) => error.reason === "ESCALATION_NOT_RECOMMENDED" || error.reason === "DUPLICATE_RECOMMENDATION_RECORD"),
      recommendation_types_supported: !errors.some((error) => error.reason === "UNSUPPORTED_RECOMMENDATION_TYPE"),
      governance_context_complete: !errors.some((error) => error.reason === "INCOMPLETE_GOVERNANCE_CONTEXT"),
      evidence_complete: !errors.some((error) => error.reason === "INCOMPLETE_EVIDENCE"),
      confidence_reproducible: !errors.some((error) => error.reason === "CONFIDENCE_INVALID" || error.reason === "CONFIDENCE_HASH_MISMATCH"),
      lineage_reconstructable: !errors.some((error) => error.reason === "BROKEN_LINEAGE"),
      replay_ready: !errors.some((error) => ["REPLAY_MISMATCH_ACCEPTED", "RECOMMENDATION_HASH_MISMATCH", "RECOMMENDATION_RESULT_HASH_MISMATCH"].includes(error.reason)),
      truth_ledger_recorded: !errors.some((error) => error.reason === "TRUTH_LEDGER_RECORD_MISSING"),
      advisory_only_enforced: !errors.some((error) => error.reason === "EXECUTION_AUTHORITY_DETECTED"),
      tenant_isolated: !errors.some((error) => error.reason === "CROSS_TENANT_RECOMMENDATION"),
      hidden_state_absent: !errors.some((error) => error.reason === "HIDDEN_RECOMMENDATION_STATE"),
      hash_valid: !errors.some((error) => error.reason === "RECOMMENDATION_HASH_MISMATCH" || error.reason === "RECOMMENDATION_RESULT_HASH_MISMATCH"),
    }),
    errors: Object.freeze(errors),
    warnings: Object.freeze([]),
    validation_timestamp: NOW,
  });
}

export function replayEscalationRecommendation(result: EscalationRecommendationResult): EscalationRecommendationReplayResult {
  const reconstructed_recommendation_hash = computeEscalationRecommendationHash(result);
  const validation = validateEscalationRecommendation(result);
  const reproduced = validation.validation_state === "VALID" && reconstructed_recommendation_hash === result.recommendation_hash;
  return Object.freeze({
    replay_id: hashValue("escalation-recommendation-replay", { expected: result.recommendation_hash, reconstructed_recommendation_hash }),
    replay_state: reproduced ? "REPRODUCED" : "MISMATCH",
    reconstructed_recommendation_hash,
    expected_recommendation_hash: result.recommendation_hash,
    reconstructed_recommendation_ids: Object.freeze(result.recommendation_records.map((record) => record.recommendation_id)),
    expected_recommendation_ids: result.ledger_record.recommendation_ids,
    failure_reason: reproduced ? null : validation.errors[0]?.reason ?? "RECOMMENDATION_RESULT_HASH_MISMATCH",
  });
}

export function buildEscalationRecommendationMetrics(result = generateEscalationRecommendations()): EscalationRecommendationMetrics {
  const total = result.recommendation_records.length;
  const recommendation_distribution = Object.fromEntries(TYPES.map((type) => [type, result.recommendation_records.filter((record) => record.recommendation_type === type).length])) as EscalationRecommendationMetrics["recommendation_distribution"];
  const confidenceLevels: readonly EscalationConfidenceLevel[] = Object.freeze(["LOW", "MODERATE", "HIGH", "CERTIFICATION_READY"]);
  const recommendation_confidence_distribution = Object.fromEntries(confidenceLevels.map((level) => [level, result.recommendation_records.filter((record) => record.confidence.confidence_level === level).length])) as EscalationRecommendationMetrics["recommendation_confidence_distribution"];
  return Object.freeze({
    recommendations_generated: total,
    recommendation_distribution: Object.freeze(recommendation_distribution),
    recommendation_acceptance_rate: 0,
    recommendation_confidence_distribution: Object.freeze(recommendation_confidence_distribution),
    constitutional_review_frequency: recommendation_distribution.CONSTITUTIONAL_REVIEW,
    authority_review_frequency: recommendation_distribution.AUTHORITY_REVIEW,
    policy_review_frequency: recommendation_distribution.POLICY_REVIEW,
    compliance_review_frequency: recommendation_distribution.COMPLIANCE_REVIEW,
    emergency_governance_review_frequency: recommendation_distribution.EMERGENCY_GOVERNANCE_REVIEW,
    replay_success_rate: result.replay_state === "REPRODUCED" ? 1 : 0,
    evidence_completeness: total ? result.recommendation_records.filter((record) => record.evidence.evidence_ids.length > 0 && record.evidence.truth_record_ids.length > 0).length / total : 1,
    recommendation_generation_latency_ms: 0,
  });
}

export function buildEscalationRecommendationObservabilitySurface(result = generateEscalationRecommendations()): EscalationRecommendationObservabilitySurface {
  const validation = validateEscalationRecommendation(result);
  return Object.freeze({
    recommendation_count: result.recommendation_records.length,
    recommendation_ids: Object.freeze(result.recommendation_records.map((record) => record.recommendation_id)),
    recommendation_types: Object.freeze(result.recommendation_records.map((record) => record.recommendation_type)),
    recommended_reviews: Object.freeze(result.recommendation_records.map((record) => record.recommended_review)),
    recommendation_reasons: Object.freeze(result.recommendation_records.map((record) => record.recommendation_reason)),
    priorities: Object.freeze(result.recommendation_records.map((record) => record.priority_level)),
    confidence: Object.freeze(result.recommendation_records.map((record) => Object.freeze({ score: record.confidence.confidence_score, level: record.confidence.confidence_level }))),
    evidence_refs: result.ledger_record.evidence_refs,
    governance_refs: result.ledger_record.governance_context_refs,
    replay_refs: result.ledger_record.replay_refs,
    ledger_refs: result.ledger_record.truth_ledger_refs,
    replay_state: result.replay_state,
    advisory_only_notice: "Escalation recommendations are advisory only; they do not execute actions, modify policy, approve requests, remediate systems, or override operators.",
    metrics: buildEscalationRecommendationMetrics(result),
    validation_failures: Object.freeze(validation.errors.map((error) => error.reason)),
  });
}

export function getEscalationRecommendationContract() {
  const baseline_recommendation = generateEscalationRecommendations();
  return Object.freeze({ doctrine: buildEscalationRecommendationDoctrine(), baseline_recommendation, observability: buildEscalationRecommendationObservabilitySurface(baseline_recommendation) });
}
