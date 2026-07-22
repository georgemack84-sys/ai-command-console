import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  OperatorFeedbackContractApiSurface,
  OperatorFeedbackContractFoundation,
  OperatorFeedbackContractInput,
  OperatorFeedbackContractResult,
  OperatorFeedbackContractVocabulary,
  OperatorFeedbackFailure,
  OperatorFeedbackGovernanceMetadata,
  OperatorFeedbackRecord,
  OperatorFeedbackScenario,
  OperatorFeedbackType,
  OperatorFeedbackValidationReport,
} from "@/types/operator-feedback-contract";

const CONTRACT_VERSION = "operator-feedback-contract/v1" as const;
const SCHEMA_VERSION = "operator-feedback-schema/v1" as const;
const RECORD_VERSION = "operator-feedback-record/v1" as const;
const CREATED_AT = "2026-07-10T00:00:00.000Z";

const FEEDBACK_TYPES: readonly OperatorFeedbackType[] = Object.freeze(["APPROVAL", "REJECTION", "OVERRIDE", "CLARITY", "EVIDENCE", "RISK", "CONFIDENCE", "GOVERNANCE", "SIMULATION", "ROLLBACK"]);
const SCHEMA_FIELDS = Object.freeze([
  "feedback_id",
  "tenant_id",
  "mission_id",
  "operator_id",
  "decision_id",
  "decision_package_id",
  "feedback_type",
  "feedback_summary",
  "operator_action_taken",
  "rationale",
  "related_evidence_refs",
  "related_replay_refs",
  "adaptation_relevance",
  "governance_relevance",
  "confidence_signal",
  "created_timestamp",
  "contract_version",
  "schema_version",
  "record_version",
  "operator_role",
  "authentication_method",
  "authority_scope",
  "governance_metadata",
  "constitutional_validation_status",
  "replay_id",
  "audit_id",
  "origin_system",
  "integrity_hash",
]);

type Scenario = NonNullable<OperatorFeedbackContractInput["scenario"]>;

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity<T extends object>(value: T): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function buildApiSurface(): OperatorFeedbackContractApiSurface {
  const base: Omit<OperatorFeedbackContractApiSurface, "integrity_hash"> = {
    api_id: "operator_feedback_contract_api",
    validate_feedback: "POST /operator-feedback-contract/validate",
    retrieve_contract: "GET /operator-feedback-contract/contract",
    retrieve_schema: "GET /operator-feedback-contract/schema",
    retrieve_vocabulary: "GET /operator-feedback-contract/vocabulary",
    replay_validation: "POST /operator-feedback-contract/replay",
    inspect_contract: "POST /operator-feedback-contract/inspect",
    processing_supported: false,
    normalization_supported: false,
    adaptation_generation_supported: false,
    production_mutation_supported: false,
    governance_override_supported: false,
    advisory_only: true,
    fail_open_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildVocabulary(): OperatorFeedbackContractVocabulary {
  const base: Omit<OperatorFeedbackContractVocabulary, "integrity_hash"> = {
    feedback_types: FEEDBACK_TYPES,
    confidence_signals: freezeArray(["OVERCONFIDENT", "UNDERCONFIDENT", "APPROPRIATE", "UNKNOWN"]),
    relevance_values: freezeArray(["NONE", "LOW", "MEDIUM", "HIGH"]),
    authority_scopes: freezeArray(["OPERATOR_FEEDBACK_ONLY", "GOVERNANCE_REVIEW", "UNAUTHORIZED"]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function typeForScenario(scenario: Scenario): OperatorFeedbackType {
  return FEEDBACK_TYPES.includes(scenario as OperatorFeedbackType) ? scenario as OperatorFeedbackType : "APPROVAL";
}

function failureFor(scenario: Scenario): OperatorFeedbackFailure | undefined {
  const map: Partial<Record<Scenario, OperatorFeedbackFailure>> = {
    DUPLICATE_IDENTIFIER: "DUPLICATE_IDENTIFIER",
    INVALID_OPERATOR: "INVALID_OPERATOR",
    MISSING_TENANT: "MISSING_TENANT",
    MISSING_MISSION: "MISSING_MISSION",
    MISSING_DECISION: "MISSING_DECISION",
    MISSING_REPLAY_REFERENCE: "MISSING_REPLAY_REFERENCE",
    INVALID_SCHEMA_VERSION: "INVALID_SCHEMA_VERSION",
    INVALID_CONTRACT_VERSION: "INVALID_CONTRACT_VERSION",
    MALFORMED_CLASSIFICATION: "MALFORMED_CLASSIFICATION",
    CORRUPTED_INTEGRITY_HASH: "CORRUPTED_INTEGRITY_HASH",
    UNAUTHORIZED_AUTHORITY_SCOPE: "UNAUTHORIZED_AUTHORITY_SCOPE",
    GOVERNANCE_METADATA_OMISSION: "GOVERNANCE_METADATA_OMISSION",
    CROSS_TENANT_REFERENCE: "CROSS_TENANT_REFERENCE",
  };
  return map[scenario];
}

function buildGovernanceMetadata(scenario: Scenario): OperatorFeedbackGovernanceMetadata {
  const tenantScope = scenario === "CROSS_TENANT_REFERENCE" ? "tenant_foreign" : "tenant_alpha";
  const base: Omit<OperatorFeedbackGovernanceMetadata, "integrity_hash"> = {
    governance_context_id: `governance_feedback_context_${hash(scenario).slice(0, 12)}`,
    policy_refs: scenario === "GOVERNANCE_METADATA_OMISSION" ? freezeArray([]) : freezeArray(["operator_feedback_policy", "feedback_evidence_only_policy"]),
    constitutional_refs: scenario === "GOVERNANCE_METADATA_OMISSION" ? freezeArray([]) : freezeArray(["advisory_only_protection", "operator_authority_protection"]),
    authority_refs: scenario === "GOVERNANCE_METADATA_OMISSION" ? freezeArray([]) : freezeArray(["operator_feedback_authority_scope"]),
    tenant_scope: tenantScope,
    advisory_only: true,
    production_mutation_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function recordHashPayload(record: Omit<OperatorFeedbackRecord, "integrity_hash">): unknown {
  return {
    feedback_id: record.feedback_id,
    tenant_id: record.tenant_id,
    mission_id: record.mission_id,
    operator_id: record.operator_id,
    decision_id: record.decision_id,
    decision_package_id: record.decision_package_id,
    feedback_type: record.feedback_type,
    feedback_summary: record.feedback_summary,
    operator_action_taken: record.operator_action_taken,
    rationale: record.rationale,
    related_evidence_refs: record.related_evidence_refs,
    related_replay_refs: record.related_replay_refs,
    adaptation_relevance: record.adaptation_relevance,
    governance_relevance: record.governance_relevance,
    confidence_signal: record.confidence_signal,
    created_timestamp: record.created_timestamp,
    contract_version: record.contract_version,
    schema_version: record.schema_version,
    record_version: record.record_version,
    governance_metadata_hash: record.governance_metadata.integrity_hash,
    replay_id: record.replay_id,
    audit_id: record.audit_id,
  };
}

function buildRecord(input: OperatorFeedbackContractInput = {}): OperatorFeedbackRecord {
  const scenario = input.scenario ?? "BASELINE";
  const feedbackType = scenario === "MALFORMED_CLASSIFICATION" ? "APPROVAL" : typeForScenario(scenario);
  const base: Omit<OperatorFeedbackRecord, "integrity_hash"> = {
    feedback_id: scenario === "DUPLICATE_IDENTIFIER" ? "feedback_duplicate" : `feedback_${hash(`${scenario}:operator-feedback`).slice(0, 16)}`,
    tenant_id: scenario === "MISSING_TENANT" ? "" : "tenant_alpha",
    mission_id: scenario === "MISSING_MISSION" ? "" : "mission_feedback_001",
    operator_id: scenario === "INVALID_OPERATOR" ? "" : "operator_001",
    decision_id: scenario === "MISSING_DECISION" ? "" : "decision_001",
    decision_package_id: scenario === "MISSING_DECISION" ? "" : "decision_package_001",
    feedback_type: feedbackType,
    feedback_summary: `${feedbackType.toLowerCase()} feedback captured as evidence.`,
    operator_action_taken: feedbackType === "OVERRIDE" ? "manual_intervention" : "recorded_feedback",
    rationale: "Operator rationale is preserved verbatim for future adaptive analysis.",
    related_evidence_refs: scenario === "CORRUPTED_INTEGRITY_HASH" ? freezeArray(["evidence_ref_001"]) : freezeArray(["evidence_ref_001", "governance_evidence_ref_001"]),
    related_replay_refs: scenario === "MISSING_REPLAY_REFERENCE" ? freezeArray([]) : freezeArray(["replay_ref_001"]),
    adaptation_relevance: "MEDIUM",
    governance_relevance: feedbackType === "GOVERNANCE" ? "HIGH" : "MEDIUM",
    confidence_signal: feedbackType === "CONFIDENCE" ? "APPROPRIATE" : "UNKNOWN",
    created_timestamp: CREATED_AT,
    contract_version: scenario === "INVALID_CONTRACT_VERSION" ? "operator-feedback-contract/v999" as "operator-feedback-contract/v1" : CONTRACT_VERSION,
    schema_version: scenario === "INVALID_SCHEMA_VERSION" ? "operator-feedback-schema/v999" as "operator-feedback-schema/v1" : SCHEMA_VERSION,
    record_version: RECORD_VERSION,
    operator_role: "mission_operator",
    authentication_method: "SESSION",
    authority_scope: scenario === "UNAUTHORIZED_AUTHORITY_SCOPE" ? "UNAUTHORIZED" : "OPERATOR_FEEDBACK_ONLY",
    governance_metadata: buildGovernanceMetadata(scenario),
    constitutional_validation_status: "VALIDATED",
    replay_id: scenario === "MISSING_REPLAY_REFERENCE" ? "" : "feedback_replay_001",
    audit_id: "feedback_audit_001",
    origin_system: "mission-control",
    secondary_classifications: freezeArray([]),
    original_operator_wording: "Operator rationale is preserved verbatim for future adaptive analysis.",
    normalized_classification: feedbackType,
    immutable: true,
    append_only: true,
    replayable: true,
  };
  const merged = Object.freeze({ ...base, ...input.record }) as Omit<OperatorFeedbackRecord, "integrity_hash">;
  const record = Object.freeze({ ...merged, integrity_hash: hash(recordHashPayload(merged)) });
  return scenario === "CORRUPTED_INTEGRITY_HASH" ? Object.freeze({ ...record, integrity_hash: "tampered_feedback_hash" }) : record;
}

function collectFailures(record: OperatorFeedbackRecord, scenario: Scenario): readonly OperatorFeedbackFailure[] {
  const failures: OperatorFeedbackFailure[] = [];
  const direct = failureFor(scenario);
  if (direct) failures.push(direct);
  if (!record.feedback_id || !record.created_timestamp) failures.push("MISSING_REQUIRED_FIELD");
  if (scenario === "DUPLICATE_IDENTIFIER" || record.feedback_id === "feedback_duplicate") failures.push("DUPLICATE_IDENTIFIER");
  if (!record.operator_id || record.operator_id === "operator_invalid") failures.push("INVALID_OPERATOR");
  if (!record.tenant_id) failures.push("MISSING_TENANT");
  if (!record.mission_id) failures.push("MISSING_MISSION");
  if (!record.decision_id || !record.decision_package_id) failures.push("MISSING_DECISION");
  if (!record.replay_id || record.related_replay_refs.length === 0) failures.push("MISSING_REPLAY_REFERENCE");
  if (record.schema_version !== SCHEMA_VERSION) failures.push("INVALID_SCHEMA_VERSION");
  if (record.contract_version !== CONTRACT_VERSION) failures.push("INVALID_CONTRACT_VERSION");
  if (!FEEDBACK_TYPES.includes(record.feedback_type) || record.normalized_classification !== record.feedback_type) failures.push("MALFORMED_CLASSIFICATION");
  if (record.integrity_hash !== hash(recordHashPayload(record))) failures.push("CORRUPTED_INTEGRITY_HASH");
  if (record.authority_scope === "UNAUTHORIZED") failures.push("UNAUTHORIZED_AUTHORITY_SCOPE");
  if (record.governance_metadata.policy_refs.length === 0 || record.governance_metadata.constitutional_refs.length === 0 || record.governance_metadata.authority_refs.length === 0) failures.push("GOVERNANCE_METADATA_OMISSION");
  if (record.governance_metadata.tenant_scope !== record.tenant_id) failures.push("CROSS_TENANT_REFERENCE");
  return freezeArray([...new Set(failures)]);
}

function buildValidationReport(record: OperatorFeedbackRecord, failures: readonly OperatorFeedbackFailure[]): OperatorFeedbackValidationReport {
  const has = (failure: OperatorFeedbackFailure) => failures.includes(failure);
  const base: Omit<OperatorFeedbackValidationReport, "integrity_hash"> = {
    validation_id: `operator_feedback_validation_${hash(record.feedback_id).slice(0, 14)}`,
    validation_state: failures.length === 0 ? "ACCEPTED" : "REJECTED",
    failures,
    identity_valid: !has("DUPLICATE_IDENTIFIER") && !has("MISSING_REQUIRED_FIELD"),
    operator_valid: !has("INVALID_OPERATOR") && !has("UNAUTHORIZED_AUTHORITY_SCOPE"),
    mission_valid: !has("MISSING_MISSION") && !has("MISSING_TENANT") && !has("CROSS_TENANT_REFERENCE"),
    decision_valid: !has("MISSING_DECISION"),
    replay_valid: !has("MISSING_REPLAY_REFERENCE"),
    evidence_valid: record.related_evidence_refs.length > 0 && !has("CORRUPTED_INTEGRITY_HASH"),
    governance_valid: !has("GOVERNANCE_METADATA_OMISSION") && record.constitutional_validation_status === "VALIDATED",
    integrity_valid: !has("CORRUPTED_INTEGRITY_HASH") && !has("INVALID_SCHEMA_VERSION") && !has("INVALID_CONTRACT_VERSION"),
    tenant_isolated: !has("CROSS_TENANT_REFERENCE") && !has("MISSING_TENANT"),
    authority_bounded: record.authority_scope === "OPERATOR_FEEDBACK_ONLY" || record.authority_scope === "GOVERNANCE_REVIEW",
    accepted_as_evidence_only: failures.length === 0,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<OperatorFeedbackContractResult, "integrity_hash" | "replay_hash">): string {
  return hash({ record: result.record, validation_report: result.validation_report, vocabulary: result.vocabulary });
}

function resultIntegrityHash(result: Omit<OperatorFeedbackContractResult, "integrity_hash">): string {
  return hash({
    operator_feedback_contract_version: result.operator_feedback_contract_version,
    api_surface_hash: result.api_surface.integrity_hash,
    record_hash: result.record.integrity_hash,
    validation_hash: result.validation_report.integrity_hash,
    vocabulary_hash: result.vocabulary.integrity_hash,
    replay_hash: result.replay_hash,
  });
}

export function validateOperatorFeedbackContract(input: OperatorFeedbackContractInput = {}): OperatorFeedbackContractResult {
  const api_surface = buildApiSurface();
  const vocabulary = buildVocabulary();
  const scenario = input.scenario ?? "BASELINE";
  const record = buildRecord(input);
  const failures = collectFailures(record, scenario);
  const validation_report = buildValidationReport(record, failures);
  const base: Omit<OperatorFeedbackContractResult, "integrity_hash" | "replay_hash"> = {
    operator_feedback_contract_version: CONTRACT_VERSION,
    api_surface,
    record,
    validation_report,
    vocabulary,
    validation_state: validation_report.validation_state,
    failures,
    immutable: true,
    append_only: true,
    replayable: failures.length === 0,
    deterministic: true,
    tenant_isolated: validation_report.tenant_isolated,
    governance_aware: true,
    evidence_only: true,
    advisory_only: true,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayOperatorFeedbackContract(result: OperatorFeedbackContractResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
}

export function getOperatorFeedbackContractFoundation(): OperatorFeedbackContractFoundation {
  const api_surface = buildApiSurface();
  const vocabulary = buildVocabulary();
  return Object.freeze({
    operator_feedback_contract_version: CONTRACT_VERSION,
    api_surface,
    schema_fields: SCHEMA_FIELDS,
    vocabulary,
    result: validateOperatorFeedbackContract(),
  });
}

export const OperatorFeedbackContract = Object.freeze({
  validate: validateOperatorFeedbackContract,
  replay: replayOperatorFeedbackContract,
});
