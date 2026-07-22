import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { submitFeedbackIntake } from "@/services/feedback-intake-engine";
import type {
  DuplicateResolutionStatus,
  FeedbackNormalizationApiSurface,
  FeedbackNormalizationAuditEvent,
  FeedbackNormalizationEngineFoundation,
  FeedbackNormalizationEngineInput,
  FeedbackNormalizationEngineResult,
  FeedbackNormalizationExplanation,
  FeedbackNormalizationFailure,
  FeedbackNormalizationScenario,
  NormalizedConfidenceLevel,
  NormalizedFeedbackRecord,
  NormalizedFeedbackType,
} from "@/types/feedback-normalization-engine";
import type { FeedbackDuplicateStatus } from "@/types/feedback-intake-engine";
import type { OperatorFeedbackType } from "@/types/operator-feedback-contract";

const ENGINE_VERSION = "feedback-normalization-engine/v1" as const;
const NORMALIZATION_VERSION = "feedback-normalization/v1" as const;
const SEMANTIC_VERSION = "feedback-semantic-map/v1" as const;
const NORMALIZED_AT = "2026-07-10T00:00:00.000Z";
const VOCABULARY = Object.freeze([
  "Evidence Sufficiency Issue",
  "Explanation Deficiency",
  "Risk Underestimation",
  "Risk Overestimation",
  "Confidence Miscalibration",
  "Governance Concern",
  "Simulation Coverage Gap",
  "Rollback Improvement Opportunity",
  "Approval Confirmation",
  "Recommendation Rejection",
  "Operator Override",
]);

type Scenario = NonNullable<FeedbackNormalizationEngineInput["scenario"]>;

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

function buildApiSurface(): FeedbackNormalizationApiSurface {
  const base: Omit<FeedbackNormalizationApiSurface, "integrity_hash"> = {
    api_id: "feedback_normalization_engine_api",
    normalize_feedback: "POST /feedback-normalization-engine/normalize",
    retrieve_record: "POST /feedback-normalization-engine/record",
    retrieve_explanation: "POST /feedback-normalization-engine/explanation",
    retrieve_audit: "POST /feedback-normalization-engine/audit",
    retrieve_vocabulary: "GET /feedback-normalization-engine/vocabulary",
    replay_normalization: "POST /feedback-normalization-engine/replay",
    retrieve_contract: "GET /feedback-normalization-engine/contract",
    adaptation_generation_supported: false,
    learning_supported: false,
    production_mutation_supported: false,
    governance_override_supported: false,
    evidence_only: true,
    fail_open_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function intakeScenario(scenario: Scenario): never | undefined {
  const pass = ["BASELINE", "APPROVAL", "REJECTION", "OVERRIDE", "CLARITY", "EVIDENCE", "RISK", "CONFIDENCE", "GOVERNANCE", "SIMULATION", "ROLLBACK", "EXACT_DUPLICATE", "NEAR_DUPLICATE", "ANONYMOUS", "INVALID_OPERATOR", "UNAUTHORIZED_OPERATOR", "MISSING_TENANT", "MISSING_MISSION", "MISSING_DECISION", "MISSING_REPLAY_REFERENCE", "CROSS_TENANT_REFERENCE", "GOVERNANCE_METADATA_OMISSION"];
  if (scenario === "SEMANTIC_DUPLICATE") return "NEAR_DUPLICATE" as never;
  return pass.includes(scenario) ? scenario as never : "BASELINE" as never;
}

function rawWordingFor(scenario: Scenario): string | undefined {
  const map: Partial<Record<Scenario, string>> = {
    RAW_EVIDENCE_WORDING: "Not enough proof",
    RAW_CLARITY_WORDING: "Recommendation was unclear",
    RAW_RISK_LOW_WORDING: "Risk seems too low",
    RAW_CONFIDENCE_HIGH_WORDING: "Confidence feels too high",
    RAW_GOVERNANCE_WORDING: "Policy wasn't considered",
    RAW_SIMULATION_WORDING: "Simulation missed this scenario",
  };
  return map[scenario];
}

function intakeFeedbackOverride(scenario: Scenario) {
  const wording = rawWordingFor(scenario);
  return wording ? { original_operator_wording: wording, rationale: wording } : undefined;
}

function typeMap(type: OperatorFeedbackType): NormalizedFeedbackType {
  const map: Record<OperatorFeedbackType, NormalizedFeedbackType> = {
    APPROVAL: "APPROVAL_FEEDBACK",
    REJECTION: "REJECTION_FEEDBACK",
    OVERRIDE: "OVERRIDE_FEEDBACK",
    CLARITY: "CLARITY_FEEDBACK",
    EVIDENCE: "EVIDENCE_FEEDBACK",
    RISK: "RISK_FEEDBACK",
    CONFIDENCE: "CONFIDENCE_FEEDBACK",
    GOVERNANCE: "GOVERNANCE_FEEDBACK",
    SIMULATION: "SIMULATION_FEEDBACK",
    ROLLBACK: "ROLLBACK_FEEDBACK",
  };
  return map[type];
}

function semanticIssue(wording: string, type: NormalizedFeedbackType): string {
  const lower = wording.toLowerCase();
  if (lower.includes("proof") || lower.includes("evidence")) return "Evidence Sufficiency Issue";
  if (lower.includes("unclear") || lower.includes("rationale")) return "Explanation Deficiency";
  if (lower.includes("risk") && lower.includes("low")) return "Risk Underestimation";
  if (lower.includes("risk") && lower.includes("high")) return "Risk Overestimation";
  if (lower.includes("confidence")) return "Confidence Miscalibration";
  if (lower.includes("policy") || lower.includes("governance")) return "Governance Concern";
  if (lower.includes("simulation") || lower.includes("scenario")) return "Simulation Coverage Gap";
  if (lower.includes("rollback")) return "Rollback Improvement Opportunity";
  if (type === "APPROVAL_FEEDBACK") return "Approval Confirmation";
  if (type === "REJECTION_FEEDBACK") return "Recommendation Rejection";
  if (type === "OVERRIDE_FEEDBACK") return "Operator Override";
  if (type === "EVIDENCE_FEEDBACK") return "Evidence Sufficiency Issue";
  if (type === "CLARITY_FEEDBACK") return "Explanation Deficiency";
  if (type === "RISK_FEEDBACK") return "Risk Underestimation";
  if (type === "CONFIDENCE_FEEDBACK") return "Confidence Miscalibration";
  if (type === "GOVERNANCE_FEEDBACK") return "Governance Concern";
  if (type === "SIMULATION_FEEDBACK") return "Simulation Coverage Gap";
  return "Rollback Improvement Opportunity";
}

function confidenceLevel(wording: string): NormalizedConfidenceLevel {
  const lower = wording.toLowerCase();
  if (lower.includes("very certain")) return "VERY_HIGH";
  if (lower.includes("high confidence")) return "HIGH";
  if (lower.includes("medium") || lower.includes("probably")) return "MODERATE";
  if (lower.includes("low confidence") || lower.includes("unsure")) return "LOW";
  if (lower.includes("needs verification")) return "VERY_LOW";
  if (lower.includes("confidence feels too high")) return "HIGH";
  return "UNKNOWN";
}

function duplicateResolution(status: FeedbackDuplicateStatus, scenario: Scenario): DuplicateResolutionStatus {
  if (status === "EXACT_DUPLICATE") return "EXACT_DUPLICATE_REFERENCED";
  if (scenario === "SEMANTIC_DUPLICATE" || status === "NEAR_DUPLICATE") return "SEMANTIC_DUPLICATE_MERGED";
  if (scenario === "INDEPENDENT_FEEDBACK") return "INDEPENDENT_FEEDBACK";
  return "UNIQUE";
}

function failureFor(scenario: Scenario): FeedbackNormalizationFailure | undefined {
  const map: Partial<Record<Scenario, FeedbackNormalizationFailure>> = {
    UNSUPPORTED_FEEDBACK_CLASSIFICATION: "UNSUPPORTED_FEEDBACK_CLASSIFICATION",
    MISSING_NORMALIZATION_RULE: "MISSING_NORMALIZATION_RULE",
    INVALID_SEMANTIC_MAPPING_VERSION: "INVALID_SEMANTIC_MAPPING_VERSION",
    CORRUPTED_FEEDBACK_RECORD: "CORRUPTED_FEEDBACK_RECORD",
    REPLAY_REFERENCE_MISSING: "REPLAY_REFERENCE_MISSING",
    CONFIDENCE_MAPPING_UNDEFINED: "CONFIDENCE_MAPPING_UNDEFINED",
    DUPLICATE_RESOLUTION_CONFLICT: "DUPLICATE_RESOLUTION_CONFLICT",
  };
  return map[scenario];
}

function collectFailures(input: FeedbackNormalizationEngineInput): readonly FeedbackNormalizationFailure[] {
  const scenario = input.scenario ?? "BASELINE";
  const intake = input.intake_result ?? submitFeedbackIntake({ scenario: intakeScenario(scenario), feedback: intakeFeedbackOverride(scenario) });
  const failures: FeedbackNormalizationFailure[] = [];
  const direct = failureFor(scenario);
  if (direct) failures.push(direct);
  if (!["ACCEPTED", "FLAGGED_FOR_REVIEW", "IGNORED_DUPLICATE"].includes(intake.intake_decision)) failures.push("INTAKE_NOT_ACCEPTED");
  if (!intake.tenant_isolated) failures.push("TENANT_ISOLATION_FAILED");
  if (!intake.governance_compliant) failures.push("GOVERNANCE_METADATA_INVALID");
  if (!intake.feedback_record.replay_id || intake.feedback_record.related_replay_refs.length === 0) failures.push("REPLAY_REFERENCE_MISSING");
  return freezeArray([...new Set(failures)]);
}

function buildNormalizedRecord(input: FeedbackNormalizationEngineInput, failures: readonly FeedbackNormalizationFailure[]): NormalizedFeedbackRecord | null {
  if (failures.length > 0) return null;
  const scenario = input.scenario ?? "BASELINE";
  const intake = input.intake_result ?? submitFeedbackIntake({ scenario: intakeScenario(scenario), feedback: intakeFeedbackOverride(scenario) });
  const record = intake.feedback_record;
  const wording = rawWordingFor(scenario) ?? record.original_operator_wording;
  const canonicalType = typeMap(record.feedback_type);
  const issue = semanticIssue(wording, canonicalType);
  const base: Omit<NormalizedFeedbackRecord, "integrity_hash"> = {
    normalized_feedback_id: `normalized_feedback_${hash(`${record.feedback_id}:${issue}:${SEMANTIC_VERSION}`).slice(0, 16)}`,
    original_feedback_id: record.feedback_id,
    canonical_feedback_type: canonicalType,
    canonical_issue: issue,
    normalized_summary: `${canonicalType}:${issue}`,
    normalized_confidence: scenario === "CONFIDENCE_MAPPING_UNDEFINED" ? "UNKNOWN" : confidenceLevel(wording),
    semantic_mapping_version: SEMANTIC_VERSION,
    normalization_version: NORMALIZATION_VERSION,
    duplicate_resolution_status: duplicateResolution(intake.duplicate_status, scenario),
    normalization_timestamp: NORMALIZED_AT,
    replay_reference: `normalization_replay_${hash(intake.replay_registration.replay_id).slice(0, 14)}`,
    original_operator_wording: wording,
    preserved_evidence_refs: record.related_evidence_refs,
    preserved_replay_refs: record.related_replay_refs,
    governance_metadata_hash: record.governance_metadata.integrity_hash,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildExplanation(input: FeedbackNormalizationEngineInput, normalized: NormalizedFeedbackRecord | null, failures: readonly FeedbackNormalizationFailure[]): FeedbackNormalizationExplanation {
  const scenario = input.scenario ?? "BASELINE";
  const intake = input.intake_result ?? submitFeedbackIntake({ scenario: intakeScenario(scenario), feedback: intakeFeedbackOverride(scenario) });
  const wording = normalized?.original_operator_wording ?? rawWordingFor(scenario) ?? intake.feedback_record.original_operator_wording;
  const base: Omit<FeedbackNormalizationExplanation, "integrity_hash"> = {
    explanation_id: `feedback_normalization_explanation_${hash(`${intake.intake_id}:${scenario}`).slice(0, 14)}`,
    original_wording: wording,
    normalization_rule: failures.length ? "normalization_rejected" : "preserve_intent_and_standardize_vocabulary",
    semantic_mapping: normalized?.canonical_issue ?? "none",
    classification_decision: normalized?.canonical_feedback_type ?? "none",
    confidence_calibration: normalized?.normalized_confidence ?? "none",
    duplicate_resolution: normalized?.duplicate_resolution_status ?? "none",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function auditEvent(seed: string, event_type: FeedbackNormalizationAuditEvent["event_type"], outcome: string): FeedbackNormalizationAuditEvent {
  const base: Omit<FeedbackNormalizationAuditEvent, "integrity_hash"> = {
    audit_event_id: `feedback_normalization_audit_${hash(`${seed}:${event_type}`).slice(0, 14)}`,
    event_type,
    outcome,
    recorded_at: NORMALIZED_AT,
    append_only: true,
    immutable: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildAudit(seed: string, normalized: NormalizedFeedbackRecord | null): readonly FeedbackNormalizationAuditEvent[] {
  return freezeArray([
    auditEvent(seed, "PREPROCESSING", "completed"),
    auditEvent(seed, "NORMALIZATION_RULE", normalized ? "applied" : "rejected"),
    auditEvent(seed, "CLASSIFICATION", normalized?.canonical_feedback_type ?? "none"),
    auditEvent(seed, "SEMANTIC_MAPPING", normalized?.canonical_issue ?? "none"),
    auditEvent(seed, "DUPLICATE_RESOLUTION", normalized?.duplicate_resolution_status ?? "none"),
    auditEvent(seed, "CONFIDENCE_CALIBRATION", normalized?.normalized_confidence ?? "none"),
    auditEvent(seed, "NORMALIZED_RECORD", normalized ? "created" : "not_created"),
    ...(normalized ? [] : [auditEvent(seed, "REJECTION", "normalization_rejected")]),
  ]);
}

function resultReplayHash(result: Omit<FeedbackNormalizationEngineResult, "integrity_hash" | "replay_hash">): string {
  return hash({ intake: result.intake_result.intake_id, normalized_record: result.normalized_record, explanation: result.explanation, audit_events: result.audit_events, state: result.normalization_state });
}

function resultIntegrityHash(result: Omit<FeedbackNormalizationEngineResult, "integrity_hash">): string {
  return hash({
    feedback_normalization_engine_version: result.feedback_normalization_engine_version,
    api_surface_hash: result.api_surface.integrity_hash,
    normalized_hash: result.normalized_record?.integrity_hash ?? "none",
    explanation_hash: result.explanation.integrity_hash,
    audit_hashes: result.audit_events.map((event) => event.integrity_hash),
    replay_hash: result.replay_hash,
  });
}

export function normalizeFeedback(input: FeedbackNormalizationEngineInput = {}): FeedbackNormalizationEngineResult {
  const api_surface = buildApiSurface();
  const scenario = input.scenario ?? "BASELINE";
  const intake_result = input.intake_result ?? submitFeedbackIntake({ scenario: intakeScenario(scenario), feedback: intakeFeedbackOverride(scenario) });
  const failures = collectFailures({ ...input, intake_result });
  const normalized_record = buildNormalizedRecord({ ...input, intake_result }, failures);
  const explanation = buildExplanation({ ...input, intake_result }, normalized_record, failures);
  const audit_events = buildAudit(intake_result.intake_id, normalized_record);
  const base: Omit<FeedbackNormalizationEngineResult, "integrity_hash" | "replay_hash"> = {
    feedback_normalization_engine_version: ENGINE_VERSION,
    api_surface,
    intake_result,
    normalized_record,
    explanation,
    audit_events,
    canonical_vocabulary: VOCABULARY,
    duplicate_status: intake_result.duplicate_status,
    normalization_state: failures.length === 0 ? "NORMALIZED" : "REJECTED",
    failures,
    deterministic: true,
    replayable: failures.length === 0 && Boolean(normalized_record),
    explainable: true,
    tenant_isolated: !failures.includes("TENANT_ISOLATION_FAILED"),
    evidence_only: true,
    immutable_history: true,
    append_only_audit: true,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayFeedbackNormalization(result: FeedbackNormalizationEngineResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
}

export function getFeedbackNormalizationEngineFoundation(): FeedbackNormalizationEngineFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    feedback_normalization_engine_version: ENGINE_VERSION,
    api_surface,
    result: normalizeFeedback(),
  });
}

export const FeedbackNormalizationEngine = Object.freeze({
  normalize: normalizeFeedback,
  replay: replayFeedbackNormalization,
});
