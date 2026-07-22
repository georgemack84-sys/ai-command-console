import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  DecisionSummary,
  ExplainabilityContract,
  ExplainabilityFailure,
  ExplainabilityInput,
  ExplainabilityObservabilitySurface,
  ExplainabilityReplayResult,
  ExplainabilityScenario,
  ExplainabilitySearchCriteria,
  ExplainabilityValidationResult,
  ExplanationRecord,
  ExplanationRepository,
  ExplanationType,
  RejectedOption,
} from "@/types/explainability-contract";

const NOW = "2026-07-13T09:00:00.000Z";
const VERSION = "explainability-contract/v8ALT.5.1" as const;
const EXPLANATION_VERSION = "explanation/v8ALT.5.1" as const;
const TENANT_ID = "tenant:autonomy:primary";
const types = Object.freeze(["PLANNING", "EXECUTION", "DELEGATION", "ORCHESTRATION", "SUPERVISION", "GOVERNANCE", "INTERVENTION", "REPLAY"] as const);
const states = Object.freeze(["CREATED", "VALIDATED", "ENRICHED", "GOVERNANCE_VERIFIED", "CONSTITUTION_VERIFIED", "REGISTERED", "CERTIFIED", "REPLAYABLE", "ARCHIVED", "REJECTED"] as const);
const sources = Object.freeze(["EVIDENCE", "POLICY", "CONSTITUTION", "AUTHORITY", "REPLAY", "OPERATOR"] as const);

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }

function failuresFor(scenario: ExplainabilityScenario): readonly ExplainabilityFailure[] {
  const map: Partial<Record<ExplainabilityScenario, ExplainabilityFailure>> = {
    DUPLICATE_EXPLANATION_ID: "EXPLANATION_ID_DUPLICATED",
    MISSING_IDENTIFIERS: "REQUIRED_IDENTIFIERS_MISSING",
    INCOMPLETE_DECISION_SUMMARY: "DECISION_SUMMARY_INCOMPLETE",
    MISSING_SELECTED_OPTION: "SELECTED_OPTION_ABSENT",
    UNDOCUMENTED_REJECTED_OPTIONS: "REJECTED_OPTIONS_UNDOCUMENTED",
    MISSING_EVIDENCE: "EVIDENCE_REFERENCES_MISSING",
    INCOMPLETE_POLICY_REFERENCES: "POLICY_REFERENCES_INCOMPLETE",
    MISSING_CONSTITUTIONAL_REFERENCES: "CONSTITUTIONAL_REFERENCES_ABSENT",
    AUTHORITY_VALIDATION_FAILURE: "AUTHORITY_VALIDATION_FAILED",
    MISSING_CONFIDENCE_REASONING: "CONFIDENCE_REASONING_MISSING",
    MISSING_RISK_REASONING: "RISK_REASONING_MISSING",
    INVALID_REPLAY_REFERENCE: "REPLAY_REFERENCE_INVALID",
    INTEGRITY_HASH_FAILURE: "INTEGRITY_HASH_INVALID",
    ORDERING_VIOLATION: "DETERMINISTIC_ORDERING_VIOLATED",
    CROSS_TENANT_REFERENCE: "CROSS_TENANT_REFERENCE_DETECTED",
    FABRICATED_REASONING: "FABRICATED_REASONING_DETECTED",
    ADVISORY_ONLY_VIOLATION: "ADVISORY_ONLY_VIOLATION",
  };
  return map[scenario] ? freezeArray([map[scenario]]) : freezeArray([]);
}

function rejectedOptions(failures: readonly ExplainabilityFailure[]): readonly RejectedOption[] {
  if (failures.includes("REJECTED_OPTIONS_UNDOCUMENTED")) return freezeArray([]);
  return freezeArray([
    { option: "alternative-plan-alpha", reason_for_rejection: "lower confidence", governance_reason: "operator review preferred", policy_reason: "policy requires evidence binding", constitutional_reason: "authority boundary preserved", risk_reason: "higher operational risk", confidence_difference: 0.12 },
    { option: "alternative-plan-beta", reason_for_rejection: "insufficient replay evidence", governance_reason: "governance lineage incomplete", policy_reason: "auditability threshold not met", constitutional_reason: "operator supremacy retained", risk_reason: "integrity risk elevated", confidence_difference: 0.18 },
  ]);
}

function computeExplanationHash(record: Omit<ExplanationRecord, "explanation_hash"> | ExplanationRecord): string {
  const { explanation_hash: _hash, ...source } = record as ExplanationRecord;
  return hashValue("explainability-record", source);
}

function explanation(type: ExplanationType, order: number, failures: readonly ExplainabilityFailure[], tenantId: string, missionId: string): ExplanationRecord {
  const explanation_id = id("EXP", "explainability-record", { type, order, missionId });
  const decision: DecisionSummary = failures.includes("DECISION_SUMMARY_INCOMPLETE")
    ? Object.freeze({ decision_type: "", decision_state: "", objective: "", decision_timestamp: "", decision_result: "" })
    : Object.freeze({ decision_type: `${type.toLowerCase()}-decision`, decision_state: "SELECTED", objective: "Preserve deterministic operator-readable transparency", decision_timestamp: NOW, decision_result: "advisory explanation registered" });
  const replay_reference = failures.includes("REPLAY_REFERENCE_INVALID") ? "" : `replay:explainability:${explanation_id}`;
  const base = {
    explanation_id: failures.includes("EXPLANATION_ID_DUPLICATED") && order === 2 ? "EXP-DUPLICATE" : explanation_id,
    explanation_version: EXPLANATION_VERSION,
    contract_version: VERSION,
    tenant_id: failures.includes("CROSS_TENANT_REFERENCE_DETECTED") ? "external-tenant" : tenantId,
    mission_id: failures.includes("REQUIRED_IDENTIFIERS_MISSING") ? "" : missionId,
    execution_id: failures.includes("REQUIRED_IDENTIFIERS_MISSING") ? "" : `execution:${missionId}`,
    plan_id: failures.includes("REQUIRED_IDENTIFIERS_MISSING") ? "" : `plan:${missionId}`,
    decision_id: failures.includes("REQUIRED_IDENTIFIERS_MISSING") ? "" : `decision:${type.toLowerCase()}:${order}`,
    timestamp: NOW,
    created_by: "explainability-contract",
    engine_version: VERSION,
    status: failures.length ? "REJECTED" as const : "ACTIVE" as const,
    explanation_type: type,
    lifecycle_state: failures.length ? "REJECTED" as const : "REPLAYABLE" as const,
    decision_summary: decision,
    selected_option: failures.includes("SELECTED_OPTION_ABSENT") ? null : Object.freeze({ option: `${type.toLowerCase()}-selected-option`, approval_status: "operator-review-required", selection_reason: "highest deterministic confidence with complete evidence" }),
    rejected_options: rejectedOptions(failures),
    evidence_references: failures.includes("EVIDENCE_REFERENCES_MISSING") ? freezeArray<string>([]) : freezeArray([`truth:ledger:${explanation_id}`, `evidence:${explanation_id}`]),
    policy_references: failures.includes("POLICY_REFERENCES_INCOMPLETE") ? freezeArray<string>([]) : freezeArray(["policy:operator-supremacy", "policy:advisory-only"]),
    constitutional_references: failures.includes("CONSTITUTIONAL_REFERENCES_ABSENT") ? freezeArray<string>([]) : freezeArray(["constitution:authority-boundary", "constitution:tenant-isolation"]),
    authority_references: Object.freeze({ required_authority: "operator", validated_authority: failures.includes("AUTHORITY_VALIDATION_FAILED") ? "" : "operator", approval_source: "operator-visible-review", authority_chain: failures.includes("AUTHORITY_VALIDATION_FAILED") ? freezeArray<string>([]) : freezeArray(["tenant", "operator", "governance"]), authority_result: failures.includes("AUTHORITY_VALIDATION_FAILED") ? "FAILED" : "VALIDATED" }),
    confidence_reasoning: failures.includes("CONFIDENCE_REASONING_MISSING") ? null : Object.freeze({ confidence_score: 0.91, contributing_factors: freezeArray(["evidence quality", "replay consistency", "governance certainty"]), evidence_quality: 0.94, historical_consistency: 0.9, replay_consistency: 0.93, governance_certainty: 0.92 }),
    risk_reasoning: failures.includes("RISK_REASONING_MISSING") ? null : Object.freeze({ operational_risk: 0.18, governance_risk: 0.04, execution_risk: 0.12, policy_risk: 0.03, constitutional_risk: 0.02, integrity_risk: 0.01, mitigation_rationale: "operator review and replay verification preserve advisory-only operation" }),
    replay: Object.freeze({ replay_reference, truth_reference: `truth:explainability:${explanation_id}`, lineage_reference: `lineage:explainability:${explanation_id}`, integrity_hash: failures.includes("INTEGRITY_HASH_INVALID") ? "" : hashValue("explainability-replay-integrity", { explanation_id, replay_reference }), reconstruction_version: VERSION }),
    reasoning_source: "EVIDENCE" as const,
    evidence_bound: !failures.includes("FABRICATED_REASONING_DETECTED"),
    inference_declared: true,
    unsupported_claims: failures.includes("FABRICATED_REASONING_DETECTED") ? freezeArray(["unsupported hidden causal claim"]) : freezeArray([]),
    fabricated_reasoning_detected: failures.includes("FABRICATED_REASONING_DETECTED"),
    deterministic_order: failures.includes("DETERMINISTIC_ORDERING_VIOLATED") ? 99 - order : order,
    advisory_only: true as const,
    plan_modified: failures.includes("ADVISORY_ONLY_VIOLATION"),
    execution_modified: failures.includes("ADVISORY_ONLY_VIOLATION"),
    evidence_modified: failures.includes("ADVISORY_ONLY_VIOLATION"),
    governance_modified: failures.includes("ADVISORY_ONLY_VIOLATION"),
    authority_escalated: failures.includes("ADVISORY_ONLY_VIOLATION"),
    policy_changed: failures.includes("ADVISORY_ONLY_VIOLATION"),
    mission_state_modified: failures.includes("ADVISORY_ONLY_VIOLATION"),
  };
  return Object.freeze({ ...base, explanation_hash: computeExplanationHash(base as Omit<ExplanationRecord, "explanation_hash">) });
}

function computeRepositoryHash(repository: Omit<ExplanationRepository, "repository_hash"> | ExplanationRepository): string {
  const { repository_hash: _hash, ...source } = repository as ExplanationRepository;
  return hashValue("explainability-repository", source);
}

export function registerExplanation(input: ExplainabilityInput = {}): ExplanationRepository {
  const scenario = input.scenario ?? "BASELINE";
  const failures = failuresFor(scenario);
  const tenantId = input.tenant_id ?? TENANT_ID;
  const missionId = input.mission_id ?? "mission:explainability:primary";
  const records = input.explanation ? [input.explanation] : types.map((type, index) => explanation(type, index + 1, failures, tenantId, missionId));
  const explanations = scenario === "DUPLICATE_EXPLANATION_ID" ? freezeArray([records[0], { ...records[1], explanation_id: records[0].explanation_id } as ExplanationRecord, ...records.slice(2)]) : freezeArray(records);
  const base = { repository_id: id("EXPR", "explainability-repository", { missionId, scenario }), tenant_id: failures.includes("CROSS_TENANT_REFERENCE_DETECTED") ? "external-tenant" : tenantId, mission_id: missionId, explanations, append_only: true as const, read_only: true as const };
  return Object.freeze({ ...base, repository_hash: computeRepositoryHash(base as Omit<ExplanationRepository, "repository_hash">) });
}

export function getExplanation(repository = registerExplanation(), explanation_id?: string): ExplanationRecord | null {
  return repository.explanations.find((item) => item.explanation_id === (explanation_id ?? repository.explanations[0]?.explanation_id)) ?? null;
}

export function validateExplanation(record?: ExplanationRecord | null): ExplainabilityValidationResult {
  if (!record) {
    const failures = freezeArray<ExplainabilityFailure>(["REQUIRED_IDENTIFIERS_MISSING"]);
    const source = { explanation_id: null, valid: false, identity_valid: false, schema_valid: false, governance_valid: false, constitutional_valid: false, authority_valid: false, replay_valid: false, integrity_valid: false, deterministic_ordering_valid: false, tenant_isolated: false, fabricated_reasoning_rejected: false, advisory_only_enforced: false, failures };
    return Object.freeze({ ...source, validation_hash: hashValue("explainability-validation", source) });
  }
  const identity_valid = Boolean(record.explanation_id && record.mission_id && record.execution_id && record.plan_id && record.decision_id && record.tenant_id && record.replay.replay_reference) && record.contract_version === VERSION;
  const schema_valid = Boolean(record.decision_summary.decision_type && record.decision_summary.decision_state && record.decision_summary.objective && record.decision_summary.decision_result && record.selected_option && record.rejected_options.length > 0 && record.confidence_reasoning && record.risk_reasoning);
  const governance_valid = record.policy_references.length > 0 && !record.governance_modified;
  const constitutional_valid = record.constitutional_references.length > 0;
  const authority_valid = record.authority_references.authority_result === "VALIDATED" && record.authority_references.authority_chain.length > 0 && !record.authority_escalated;
  const replay_valid = Boolean(record.replay.replay_reference && record.replay.truth_reference && record.replay.lineage_reference);
  const integrity_valid = Boolean(record.replay.integrity_hash) && computeExplanationHash(record) === record.explanation_hash;
  const deterministic_ordering_valid = record.deterministic_order > 0 && record.deterministic_order < 90;
  const tenant_isolated = record.tenant_id.startsWith("tenant:");
  const fabricated_reasoning_rejected = record.evidence_bound && !record.fabricated_reasoning_detected && record.unsupported_claims.length === 0;
  const advisory_only_enforced = record.advisory_only && !record.plan_modified && !record.execution_modified && !record.evidence_modified && !record.governance_modified && !record.authority_escalated && !record.policy_changed && !record.mission_state_modified;
  const failures = unique([
    ...(!identity_valid ? ["REQUIRED_IDENTIFIERS_MISSING" as const] : []),
    ...(!schema_valid ? ["DECISION_SUMMARY_INCOMPLETE" as const, ...(!record.selected_option ? ["SELECTED_OPTION_ABSENT" as const] : []), ...(!record.rejected_options.length ? ["REJECTED_OPTIONS_UNDOCUMENTED" as const] : []), ...(!record.confidence_reasoning ? ["CONFIDENCE_REASONING_MISSING" as const] : []), ...(!record.risk_reasoning ? ["RISK_REASONING_MISSING" as const] : [])] : []),
    ...(!record.evidence_references.length ? ["EVIDENCE_REFERENCES_MISSING" as const] : []),
    ...(!governance_valid ? ["POLICY_REFERENCES_INCOMPLETE" as const] : []),
    ...(!constitutional_valid ? ["CONSTITUTIONAL_REFERENCES_ABSENT" as const] : []),
    ...(!authority_valid ? ["AUTHORITY_VALIDATION_FAILED" as const] : []),
    ...(!replay_valid ? ["REPLAY_REFERENCE_INVALID" as const] : []),
    ...(!integrity_valid ? ["INTEGRITY_HASH_INVALID" as const] : []),
    ...(!deterministic_ordering_valid ? ["DETERMINISTIC_ORDERING_VIOLATED" as const] : []),
    ...(!tenant_isolated ? ["CROSS_TENANT_REFERENCE_DETECTED" as const] : []),
    ...(!fabricated_reasoning_rejected ? ["FABRICATED_REASONING_DETECTED" as const] : []),
    ...(!advisory_only_enforced ? ["ADVISORY_ONLY_VIOLATION" as const] : []),
  ]);
  const valid = failures.length === 0;
  const source = { explanation_id: record.explanation_id, valid, identity_valid, schema_valid, governance_valid, constitutional_valid, authority_valid, replay_valid, integrity_valid, deterministic_ordering_valid, tenant_isolated, fabricated_reasoning_rejected, advisory_only_enforced, failures };
  return Object.freeze({ ...source, validation_hash: hashValue("explainability-validation", source) });
}

export function replayExplanation(record = getExplanation()): ExplainabilityReplayResult {
  const reconstructed_hash = record ? computeExplanationHash(record) : "";
  const source = { replay_reference: record?.replay.replay_reference ?? "", explanation_id: record?.explanation_id ?? "", deterministic: Boolean(record?.replay.replay_reference) && reconstructed_hash === record?.explanation_hash, reconstructed_hash, original_hash: record?.explanation_hash ?? "" };
  return Object.freeze({ ...source, replay_result_hash: hashValue("explainability-replay", source) });
}

export function searchExplanations(criteria: ExplainabilitySearchCriteria = {}, repository = registerExplanation()): readonly ExplanationRecord[] {
  return freezeArray(repository.explanations.filter((item) =>
    (!criteria.mission_id || item.mission_id === criteria.mission_id) &&
    (!criteria.execution_id || item.execution_id === criteria.execution_id) &&
    (!criteria.decision_id || item.decision_id === criteria.decision_id) &&
    (!criteria.plan_id || item.plan_id === criteria.plan_id) &&
    (!criteria.tenant_id || item.tenant_id === criteria.tenant_id) &&
    (!criteria.authority || item.authority_references.authority_chain.includes(criteria.authority)) &&
    (!criteria.policy || item.policy_references.includes(criteria.policy)) &&
    (criteria.confidence_min === undefined || (item.confidence_reasoning?.confidence_score ?? 0) >= criteria.confidence_min) &&
    (criteria.risk_max === undefined || (item.risk_reasoning?.operational_risk ?? 1) <= criteria.risk_max) &&
    (!criteria.replay_reference || item.replay.replay_reference === criteria.replay_reference)
  ).sort((a, b) => a.deterministic_order - b.deterministic_order));
}

export function validateExplanationRepository(repository = registerExplanation()): ExplainabilityValidationResult {
  const ids = repository.explanations.map((item) => item.explanation_id);
  const duplicate = new Set(ids).size !== ids.length;
  const ordered = repository.explanations.map((item) => item.deterministic_order).join("|") === [...repository.explanations.map((item) => item.deterministic_order)].sort((a, b) => a - b).join("|");
  const validations = repository.explanations.map((item) => validateExplanation(item));
  if (!duplicate && ordered && validations.every((item) => item.valid)) return validations[0];
  const failures = unique([...validations.flatMap((item) => item.failures), ...(duplicate ? ["EXPLANATION_ID_DUPLICATED" as const] : []), ...(!ordered ? ["DETERMINISTIC_ORDERING_VIOLATED" as const] : [])]);
  const source = { explanation_id: repository.repository_id, valid: false, identity_valid: !duplicate, schema_valid: validations.every((item) => item.schema_valid), governance_valid: validations.every((item) => item.governance_valid), constitutional_valid: validations.every((item) => item.constitutional_valid), authority_valid: validations.every((item) => item.authority_valid), replay_valid: validations.every((item) => item.replay_valid), integrity_valid: validations.every((item) => item.integrity_valid), deterministic_ordering_valid: ordered, tenant_isolated: validations.every((item) => item.tenant_isolated), fabricated_reasoning_rejected: validations.every((item) => item.fabricated_reasoning_rejected), advisory_only_enforced: validations.every((item) => item.advisory_only_enforced), failures };
  return Object.freeze({ ...source, validation_hash: hashValue("explainability-validation", source) });
}

export function buildExplainabilityObservabilitySurface(repository = registerExplanation()): ExplainabilityObservabilitySurface {
  return Object.freeze({ repository_id: repository.repository_id, tenant_id: repository.tenant_id, mission_id: repository.mission_id, explanation_count: repository.explanations.length, explanation_types: freezeArray(repository.explanations.map((item) => item.explanation_type)), advisory_only: true, repository_hash: repository.repository_hash });
}

export function getExplainabilityContract(): ExplainabilityContract {
  const repository = registerExplanation();
  const record = getExplanation(repository);
  return Object.freeze({
    doctrine: Object.freeze({
      contract_version: VERSION,
      principles: freezeArray(["deterministic-explanations", "replayable-reconstruction", "evidence-backed-reasoning", "governance-aware", "constitutional-compliance", "authority-traceable", "tenant-isolated", "immutable-records", "anti-fabrication", "advisory-only"]),
      explanation_types: types,
      lifecycle_states: states,
      reasoning_sources: sources,
      advisory_only: true,
    }),
    repository,
    validation: validateExplanationRepository(repository),
    replay: replayExplanation(record),
    observability: buildExplainabilityObservabilitySurface(repository),
  });
}
