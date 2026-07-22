import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { replayOperatorFeedbackContract, validateOperatorFeedbackContract } from "@/services/operator-feedback-contract";
import type {
  FeedbackAuthenticationResult,
  FeedbackAuthorizationResult,
  FeedbackDuplicateStatus,
  FeedbackErrorClass,
  FeedbackIntakeApiSurface,
  FeedbackIntakeAuditEvent,
  FeedbackIntakeDecision,
  FeedbackIntakeEngineFoundation,
  FeedbackIntakeEngineInput,
  FeedbackIntakeEngineResult,
  FeedbackIntakeFailure,
  FeedbackQueueEntry,
  FeedbackReplayRegistration,
} from "@/types/feedback-intake-engine";
import type { OperatorFeedbackFailure } from "@/types/operator-feedback-contract";

const ENGINE_VERSION = "feedback-intake-engine/v1" as const;
const INTAKE_TIMESTAMP = "2026-07-10T00:00:00.000Z";
type Scenario = NonNullable<FeedbackIntakeEngineInput["scenario"]>;

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

function buildApiSurface(): FeedbackIntakeApiSurface {
  const base: Omit<FeedbackIntakeApiSurface, "integrity_hash"> = {
    api_id: "feedback_intake_engine_api",
    submit_feedback: "POST /feedback-intake-engine/submit",
    retrieve_authentication: "POST /feedback-intake-engine/authentication",
    retrieve_authorization: "POST /feedback-intake-engine/authorization",
    retrieve_validation: "POST /feedback-intake-engine/validation",
    retrieve_duplicate_status: "POST /feedback-intake-engine/duplicates",
    retrieve_queue: "POST /feedback-intake-engine/queue",
    retrieve_audit: "POST /feedback-intake-engine/audit",
    replay_intake: "POST /feedback-intake-engine/replay",
    retrieve_contract: "GET /feedback-intake-engine/contract",
    normalization_supported: false,
    analysis_supported: false,
    adaptation_generation_supported: false,
    production_mutation_supported: false,
    evidence_only: true,
    fail_open_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function contractScenario(scenario: Scenario): FeedbackIntakeEngineInput["scenario"] {
  const passthrough = ["BASELINE", "APPROVAL", "REJECTION", "OVERRIDE", "CLARITY", "EVIDENCE", "RISK", "CONFIDENCE", "GOVERNANCE", "SIMULATION", "ROLLBACK", "DUPLICATE_IDENTIFIER", "INVALID_OPERATOR", "MISSING_TENANT", "MISSING_MISSION", "MISSING_DECISION", "MISSING_REPLAY_REFERENCE", "INVALID_SCHEMA_VERSION", "INVALID_CONTRACT_VERSION", "MALFORMED_CLASSIFICATION", "CORRUPTED_INTEGRITY_HASH", "UNAUTHORIZED_AUTHORITY_SCOPE", "GOVERNANCE_METADATA_OMISSION", "CROSS_TENANT_REFERENCE"];
  return passthrough.includes(scenario) ? scenario : "BASELINE";
}

function authenticationFor(scenario: Scenario, operatorId: string): FeedbackAuthenticationResult {
  const failed = scenario === "ANONYMOUS" || scenario === "INVALID_OPERATOR" || !operatorId;
  const base: Omit<FeedbackAuthenticationResult, "integrity_hash"> = {
    authentication_id: `feedback_auth_${hash(`${scenario}:${operatorId}`).slice(0, 14)}`,
    operator_id: failed ? "" : operatorId,
    status: failed ? "FAILED" : "AUTHENTICATED",
    authentication_method: failed ? "none" : "platform_session",
    authentication_strength: failed ? "LOW" : "STRONG",
    credential_fresh: !failed,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function authorizationFor(scenario: Scenario, operatorId: string, tenantId: string, missionId: string): FeedbackAuthorizationResult {
  const denied = scenario === "UNAUTHORIZED_OPERATOR" || scenario === "UNAUTHORIZED_AUTHORITY_SCOPE" || !operatorId || !tenantId || !missionId;
  const base: Omit<FeedbackAuthorizationResult, "integrity_hash"> = {
    authorization_id: `feedback_authorization_${hash(`${scenario}:${operatorId}:${missionId}`).slice(0, 14)}`,
    operator_id: operatorId,
    tenant_id: tenantId,
    mission_id: missionId,
    status: denied ? "DENIED" : "AUTHORIZED",
    role_permissions: denied ? freezeArray([]) : freezeArray(["submit_operator_feedback", "read_mission_decision_context"]),
    governance_restrictions: denied ? freezeArray(["operator_feedback_denied"]) : freezeArray(["feedback_evidence_only", "no_production_mutation"]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function mapContractFailure(failure: OperatorFeedbackFailure): FeedbackIntakeFailure {
  const map: Record<OperatorFeedbackFailure, FeedbackIntakeFailure> = {
    DUPLICATE_IDENTIFIER: "DUPLICATE_IMMUTABLE_IDENTIFIER",
    INVALID_OPERATOR: "INVALID_OPERATOR",
    MISSING_TENANT: "CROSS_TENANT_FEEDBACK",
    MISSING_MISSION: "MISSING_MISSION_REFERENCE",
    MISSING_DECISION: "MISSING_DECISION_REFERENCE",
    MISSING_REPLAY_REFERENCE: "MISSING_REPLAY_LINEAGE",
    INVALID_SCHEMA_VERSION: "INVALID_SCHEMA_VERSION",
    INVALID_CONTRACT_VERSION: "MALFORMED_RECORD",
    MALFORMED_CLASSIFICATION: "MALFORMED_RECORD",
    CORRUPTED_INTEGRITY_HASH: "CORRUPTED_INTEGRITY_HASH",
    UNAUTHORIZED_AUTHORITY_SCOPE: "UNAUTHORIZED_OPERATOR",
    GOVERNANCE_METADATA_OMISSION: "GOVERNANCE_VIOLATION",
    CROSS_TENANT_REFERENCE: "CROSS_TENANT_FEEDBACK",
    MISSING_REQUIRED_FIELD: "MALFORMED_RECORD",
  };
  return map[failure];
}

function duplicateStatusFor(scenario: Scenario): FeedbackDuplicateStatus {
  if (scenario === "EXACT_DUPLICATE" || scenario === "DUPLICATE_IDENTIFIER") return "EXACT_DUPLICATE";
  if (scenario === "NEAR_DUPLICATE") return "NEAR_DUPLICATE";
  return "UNIQUE";
}

function collectFailures(input: FeedbackIntakeEngineInput, authentication: FeedbackAuthenticationResult, authorization: FeedbackAuthorizationResult): readonly FeedbackIntakeFailure[] {
  const scenario = input.scenario ?? "BASELINE";
  const contract = input.contract_result ?? validateOperatorFeedbackContract({ scenario: contractScenario(scenario) as never, record: input.feedback });
  const failures: FeedbackIntakeFailure[] = contract.failures.map(mapContractFailure);
  if (authentication.status === "FAILED") failures.push(scenario === "ANONYMOUS" ? "ANONYMOUS_FEEDBACK" : "INVALID_OPERATOR");
  if (authorization.status === "DENIED") failures.push("UNAUTHORIZED_OPERATOR");
  if (scenario === "MISSING_PACKAGE_REFERENCE") failures.push("MISSING_PACKAGE_REFERENCE");
  if (scenario === "INVALID_REPLAY_REFERENCE") failures.push("INVALID_REPLAY_REFERENCE");
  if (scenario === "INVALID_EVIDENCE_REFERENCE") failures.push("INVALID_EVIDENCE_REFERENCE");
  if (scenario === "EXACT_DUPLICATE") failures.push("DUPLICATE_IMMUTABLE_IDENTIFIER");
  if (scenario === "QUEUE_UNAVAILABLE") failures.push("QUEUE_UNAVAILABLE");
  if (scenario === "TRANSIENT_SERVICE_TIMEOUT") failures.push("TRANSIENT_SERVICE_TIMEOUT");
  return freezeArray([...new Set(failures)]);
}

function errorClass(failures: readonly FeedbackIntakeFailure[]): FeedbackErrorClass {
  if (failures.length === 0) return "NONE";
  if (failures.every((failure) => failure === "QUEUE_UNAVAILABLE" || failure === "TRANSIENT_SERVICE_TIMEOUT")) return "RECOVERABLE";
  return "NON_RECOVERABLE";
}

function decisionFor(failures: readonly FeedbackIntakeFailure[], duplicateStatus: FeedbackDuplicateStatus): FeedbackIntakeDecision {
  const cls = errorClass(failures);
  if (cls === "RECOVERABLE") return "RETRY_SCHEDULED";
  if (duplicateStatus === "EXACT_DUPLICATE") return "IGNORED_DUPLICATE";
  if (duplicateStatus === "NEAR_DUPLICATE" && failures.length === 0) return "FLAGGED_FOR_REVIEW";
  return failures.length === 0 ? "ACCEPTED" : "REJECTED";
}

function replayRegistration(intakeId: string, decision: FeedbackIntakeDecision, recordReplayId: string, validationRef: string, operatorId: string): FeedbackReplayRegistration {
  const replayable = ["ACCEPTED", "FLAGGED_FOR_REVIEW"].includes(decision);
  const base: Omit<FeedbackReplayRegistration, "integrity_hash"> = {
    replay_registration_id: `feedback_replay_registration_${hash(intakeId).slice(0, 14)}`,
    replay_id: recordReplayId || `replay_${intakeId}`,
    intake_timestamp: INTAKE_TIMESTAMP,
    validation_ref: validationRef,
    operator_id: operatorId,
    submission_sequence: 1,
    routing_history: replayable ? freezeArray(["received", "authenticated", "authorized", "validated", "registered", "queued"]) : freezeArray(["received", "rejected"]),
    replayable,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function queueEntry(intakeId: string, decision: FeedbackIntakeDecision, tenantId: string, missionId: string, operatorId: string, replayId: string): FeedbackQueueEntry | null {
  if (decision !== "ACCEPTED" && decision !== "FLAGGED_FOR_REVIEW") return null;
  const base: Omit<FeedbackQueueEntry, "integrity_hash"> = {
    queue_entry_id: `feedback_queue_${hash(intakeId).slice(0, 14)}`,
    queue_name: "feedback-normalization",
    queue_sequence: decision === "FLAGGED_FOR_REVIEW" ? 2 : 1,
    tenant_id: tenantId,
    mission_id: missionId,
    operator_id: operatorId,
    validation_status: decision,
    replay_id: replayId,
    append_only: true,
    tenant_isolated: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function auditEvent(intakeId: string, event_type: FeedbackIntakeAuditEvent["event_type"], outcome: string, failures: readonly FeedbackIntakeFailure[]): FeedbackIntakeAuditEvent {
  const base: Omit<FeedbackIntakeAuditEvent, "integrity_hash"> = {
    audit_event_id: `feedback_audit_${hash(`${intakeId}:${event_type}`).slice(0, 14)}`,
    event_type,
    outcome,
    rejection_reasons: failures,
    recorded_at: INTAKE_TIMESTAMP,
    append_only: true,
    immutable: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildAuditEvents(intakeId: string, decision: FeedbackIntakeDecision, auth: FeedbackAuthenticationResult, authz: FeedbackAuthorizationResult, duplicateStatus: FeedbackDuplicateStatus, failures: readonly FeedbackIntakeFailure[]): readonly FeedbackIntakeAuditEvent[] {
  return freezeArray([
    auditEvent(intakeId, "SUBMISSION_RECEIVED", "received", freezeArray([])),
    auditEvent(intakeId, "AUTHENTICATION", auth.status, auth.status === "FAILED" ? failures : freezeArray([])),
    auditEvent(intakeId, "AUTHORIZATION", authz.status, authz.status === "DENIED" ? failures : freezeArray([])),
    auditEvent(intakeId, "VALIDATION", failures.length === 0 ? "valid" : "invalid", failures),
    auditEvent(intakeId, "DUPLICATE_DETECTION", duplicateStatus, duplicateStatus === "EXACT_DUPLICATE" ? failures : freezeArray([])),
    auditEvent(intakeId, "REPLAY_REGISTRATION", ["ACCEPTED", "FLAGGED_FOR_REVIEW"].includes(decision) ? "registered" : "not_registered", failures),
    auditEvent(intakeId, "QUEUE_PLACEMENT", ["ACCEPTED", "FLAGGED_FOR_REVIEW"].includes(decision) ? "queued" : "not_queued", failures),
    ...(decision === "REJECTED" || decision === "IGNORED_DUPLICATE" ? [auditEvent(intakeId, "REJECTION", decision, failures)] : []),
  ]);
}

function resultReplayHash(result: Omit<FeedbackIntakeEngineResult, "integrity_hash" | "replay_hash">): string {
  return hash({ intake_id: result.intake_id, feedback_record: result.feedback_record, authentication: result.authentication, authorization: result.authorization, duplicate_status: result.duplicate_status, replay_registration: result.replay_registration, queue_entry: result.queue_entry, audit_events: result.audit_events, intake_decision: result.intake_decision });
}

function resultIntegrityHash(result: Omit<FeedbackIntakeEngineResult, "integrity_hash">): string {
  return hash({
    feedback_intake_engine_version: result.feedback_intake_engine_version,
    api_surface_hash: result.api_surface.integrity_hash,
    intake_id: result.intake_id,
    validation_hash: result.contract_validation.integrity_hash,
    replay_registration_hash: result.replay_registration.integrity_hash,
    queue_hash: result.queue_entry?.integrity_hash ?? "no_queue",
    audit_hashes: result.audit_events.map((event) => event.integrity_hash),
    replay_hash: result.replay_hash,
  });
}

export function submitFeedbackIntake(input: FeedbackIntakeEngineInput = {}): FeedbackIntakeEngineResult {
  const api_surface = buildApiSurface();
  const scenario = input.scenario ?? "BASELINE";
  const contract_validation = input.contract_result ?? validateOperatorFeedbackContract({ scenario: contractScenario(scenario) as never, record: input.feedback });
  const feedback_record = contract_validation.record;
  const authentication = authenticationFor(scenario, feedback_record.operator_id);
  const authorization = authorizationFor(scenario, feedback_record.operator_id, feedback_record.tenant_id, feedback_record.mission_id);
  const duplicate_status = duplicateStatusFor(scenario);
  const failures = collectFailures(input, authentication, authorization);
  const intake_decision = decisionFor(failures, duplicate_status);
  const intake_id = `feedback_intake_${hash(`${scenario}:${feedback_record.feedback_id}:${feedback_record.integrity_hash}`).slice(0, 16)}`;
  const replay_registration = replayRegistration(intake_id, intake_decision, feedback_record.replay_id, contract_validation.validation_report.validation_id, feedback_record.operator_id);
  const queue_entry = queueEntry(intake_id, intake_decision, feedback_record.tenant_id, feedback_record.mission_id, feedback_record.operator_id, replay_registration.replay_id);
  const error_class = errorClass(failures);
  const audit_events = buildAuditEvents(intake_id, intake_decision, authentication, authorization, duplicate_status, failures);
  const base: Omit<FeedbackIntakeEngineResult, "integrity_hash" | "replay_hash"> = {
    feedback_intake_engine_version: ENGINE_VERSION,
    api_surface,
    intake_id,
    feedback_record,
    authentication,
    authorization,
    contract_validation,
    duplicate_status,
    duplicate_reference: duplicate_status === "UNIQUE" ? "" : `existing_${feedback_record.feedback_id}`,
    replay_registration,
    queue_entry,
    audit_events,
    intake_decision,
    failures,
    error_class,
    retry_policy: error_class === "RECOVERABLE" ? "DETERMINISTIC_BACKOFF" : "NONE",
    evidence_only: true,
    immutable_request_preserved: true,
    append_only_audit: true,
    deterministic: true,
    replayable: replay_registration.replayable && replayOperatorFeedbackContract(contract_validation),
    tenant_isolated: !failures.includes("CROSS_TENANT_FEEDBACK"),
    governance_compliant: !failures.includes("GOVERNANCE_VIOLATION"),
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayFeedbackIntake(result: FeedbackIntakeEngineResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
}

export function getFeedbackIntakeEngineFoundation(): FeedbackIntakeEngineFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    feedback_intake_engine_version: ENGINE_VERSION,
    api_surface,
    result: submitFeedbackIntake(),
  });
}

export const FeedbackIntakeEngine = Object.freeze({
  submit: submitFeedbackIntake,
  replay: replayFeedbackIntake,
});
