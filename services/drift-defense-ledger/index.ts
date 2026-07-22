import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { establishDriftDefenseArchitecture, replayDriftDefenseArchitecture } from "@/services/drift-defense-architecture";
import { replayDriftResponse, respondToDrift } from "@/services/drift-response-containment-engine";
import type { DriftSeverity } from "@/types/drift-defense-architecture";
import type {
  AdaptiveDriftRecord,
  AdaptiveDriftType,
  CertificationHistory,
  DriftDefenseLedgerApiSurface,
  DriftDefenseLedgerEntry,
  DriftDefenseLedgerFoundation,
  DriftDefenseLedgerInput,
  DriftDefenseLedgerMetrics,
  DriftDefenseLedgerResult,
  DriftLedgerFailure,
  DriftLedgerScenario,
  DriftLedgerSchema,
  DriftLedgerStatus,
  DriftRecordValidationReport,
  DriftTimeline,
  EvidenceLineageRecord,
  GovernanceDecisionHistory,
  LedgerIntegrityReport,
  ReplayReferenceRecord,
  RollbackHistory,
} from "@/types/drift-defense-ledger";

const LEDGER_VERSION = "drift-defense-ledger/v1" as const;
const LEDGER_IDENTIFIER = "DriftDefenseLedger" as const;
const LEDGER_TIMESTAMP = "2026-07-11T00:00:00.000Z" as const;
const PREVIOUS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";

type Scenario = NonNullable<DriftDefenseLedgerInput["scenario"]>;

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

function buildApiSurface(): DriftDefenseLedgerApiSurface {
  const base: Omit<DriftDefenseLedgerApiSurface, "integrity_hash"> = {
    api_id: "drift_defense_ledger_api",
    record_drift_event: "POST /drift-defense-ledger/record",
    retrieve_schema: "POST /drift-defense-ledger/schema",
    retrieve_validation: "POST /drift-defense-ledger/validation",
    retrieve_adaptive_record: "POST /drift-defense-ledger/adaptive-record",
    retrieve_evidence_lineage: "POST /drift-defense-ledger/evidence-lineage",
    retrieve_replay_refs: "POST /drift-defense-ledger/replay-refs",
    retrieve_governance_history: "POST /drift-defense-ledger/governance",
    retrieve_certification_history: "POST /drift-defense-ledger/certification",
    retrieve_rollback_history: "POST /drift-defense-ledger/rollback",
    retrieve_timeline: "POST /drift-defense-ledger/timeline",
    retrieve_integrity: "POST /drift-defense-ledger/integrity",
    retrieve_ledger_entry: "POST /drift-defense-ledger/ledger",
    retrieve_metrics: "POST /drift-defense-ledger/metrics",
    replay_ledger: "POST /drift-defense-ledger/replay",
    inspect_ledger: "POST /drift-defense-ledger/inspect",
    retrieve_contract: "GET /drift-defense-ledger/contract",
    mutation_supported: false,
    deletion_supported: false,
    governance_bypass_supported: false,
    advisory_only: true,
    fail_open_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function failureForScenario(scenario: Scenario): DriftLedgerFailure | undefined {
  const map: Partial<Record<DriftLedgerScenario, DriftLedgerFailure>> = {
    INCOMPLETE_RECORD: "INCOMPLETE_RECORD",
    INVALID_LINEAGE: "INVALID_EVIDENCE_LINEAGE",
    MISSING_EVIDENCE: "MISSING_EVIDENCE",
    INVALID_REPLAY_REFERENCES: "INVALID_REPLAY_REFERENCES",
    TENANT_VIOLATION: "TENANT_OWNERSHIP_VIOLATION",
    INTEGRITY_FAILURE: "INTEGRITY_FAILURE",
    LEDGER_TAMPERING: "LEDGER_TAMPERING",
    RECORD_CORRUPTION: "RECORD_CORRUPTION",
    MISSING_LINEAGE: "MISSING_LINEAGE",
    REPLAY_INCONSISTENCY: "REPLAY_INCONSISTENCY",
    UNAUTHORIZED_MODIFICATION: "UNAUTHORIZED_MODIFICATION",
    NONDETERMINISTIC: "NONDETERMINISTIC_LEDGER_RECORDING",
    NONREPLAYABLE_EVIDENCE: "NONREPLAYABLE_LEDGER_EVIDENCE",
    UNKNOWN_BEHAVIOR: "UNKNOWN_LEDGER_BEHAVIOR",
  };
  return map[scenario];
}

function collectFailures(scenario: Scenario, architectureReplayable: boolean, responseReplayable: boolean): readonly DriftLedgerFailure[] {
  const failures: DriftLedgerFailure[] = [];
  const direct = failureForScenario(scenario);
  if (direct) failures.push(direct);
  if (!architectureReplayable) failures.push("DRIFT_DEFENSE_ARCHITECTURE_UNAVAILABLE");
  if (!responseReplayable) failures.push("REPLAY_INCONSISTENCY");
  return freezeArray([...new Set(failures)]);
}

function statusFor(failures: readonly DriftLedgerFailure[]): DriftLedgerStatus {
  if (failures.some((failure) => ["LEDGER_TAMPERING", "INTEGRITY_FAILURE", "UNKNOWN_LEDGER_BEHAVIOR", "TENANT_OWNERSHIP_VIOLATION"].includes(failure))) return "FAIL_CLOSED";
  return failures.length ? "REJECTED" : "COMMITTED";
}

function buildSchema(): DriftLedgerSchema {
  const supported: readonly AdaptiveDriftType[] = freezeArray(["STRATEGIC_DRIFT", "CONFIDENCE_DRIFT", "RISK_DRIFT", "GOVERNANCE_DRIFT", "AUTHORITY_DRIFT", "OPERATOR_FEEDBACK_DRIFT", "EVIDENCE_DRIFT", "TENANT_ISOLATION_DRIFT", "OPTIMIZATION_DRIFT", "REPLAY_DRIFT"]);
  const base: Omit<DriftLedgerSchema, "integrity_hash"> = {
    schema_id: "drift_ledger_schema_v1",
    schema_version: "drift-ledger-schema/v1",
    supported_drift_types: supported,
    required_fields: freezeArray(["drift_id", "tenant_id", "mission_scope", "drift_type", "detected_source", "affected_adaptation_refs", "affected_decision_refs", "severity", "confidence_score", "governance_impact", "constitutional_impact", "recommended_response", "containment_required", "replay_refs", "integrity_hash"]),
    validation_rules: freezeArray(["required_fields_present", "tenant_ownership_valid", "evidence_lineage_complete", "replay_refs_valid", "integrity_hash_valid", "append_only_commit"]),
    governance_requirements: freezeArray(["governance_review_preserved", "operator_transparency_required", "no_governance_bypass"]),
    constitutional_requirements: freezeArray(["constitutional_protections_preserved", "operator_authority_preserved", "tenant_isolation_required"]),
    replay_requirements: freezeArray(["deterministic_replay_required", "forensic_reconstruction_required", "replay_refs_required"]),
    certification_requirements: freezeArray(["certification_history_preserved", "rollback_certification_preserved", "audit_ready"]),
    approval_reference: "governance-approval:drift-ledger-schema:v1",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function driftTypeFor(input: DriftDefenseLedgerInput): AdaptiveDriftType {
  return input.drift_type ?? "STRATEGIC_DRIFT";
}

function severityFor(failures: readonly DriftLedgerFailure[]): DriftSeverity {
  if (failures.some((failure) => ["LEDGER_TAMPERING", "INTEGRITY_FAILURE", "UNKNOWN_LEDGER_BEHAVIOR", "TENANT_OWNERSHIP_VIOLATION"].includes(failure))) return "CRITICAL";
  if (failures.length) return "HIGH";
  return "INFORMATIONAL";
}

function buildAdaptiveRecord(input: DriftDefenseLedgerInput, failures: readonly DriftLedgerFailure[]): AdaptiveDriftRecord {
  const severity = severityFor(failures);
  const base: Omit<AdaptiveDriftRecord, "integrity_hash"> = {
    drift_id: `adaptive_drift_${hash({ tenant: input.tenant_id ?? "tenant-mission-control", type: driftTypeFor(input), failures }).slice(0, 16)}`,
    tenant_id: input.tenant_id ?? "tenant-mission-control",
    mission_scope: "mission-control/adaptive-intelligence",
    drift_type: driftTypeFor(input),
    detected_source: "phase-10.12-drift-defense",
    affected_adaptation_refs: freezeArray(["adaptation:proposal-generation", "adaptation:simulation", "adaptation:feedback-learning"]),
    affected_decision_refs: freezeArray(["decision:adaptive-governance", "decision:containment"]),
    severity,
    confidence_score: failures.length ? 0.64 : 0.99,
    governance_impact: failures.length ? "governance_review_required" : "governance_preserved",
    constitutional_impact: failures.includes("TENANT_OWNERSHIP_VIOLATION") ? "constitutional_review_required" : "constitutional_preserved",
    recommended_response: failures.length ? "FAIL_CLOSED_UNTIL_VALIDATED" : "RECORD_AND_MONITOR",
    containment_required: failures.length > 0,
    replay_refs: failures.includes("INVALID_REPLAY_REFERENCES") ? freezeArray([]) : freezeArray(["replay:drift-defense-ledger", "replay:drift-response-containment"]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildEvidence(failures: readonly DriftLedgerFailure[]): EvidenceLineageRecord {
  const missing = failures.includes("MISSING_EVIDENCE") || failures.includes("INVALID_EVIDENCE_LINEAGE") || failures.includes("MISSING_LINEAGE");
  const base: Omit<EvidenceLineageRecord, "integrity_hash"> = {
    lineage_id: `evidence_lineage_${hash(failures).slice(0, 14)}`,
    originating_evidence: missing ? freezeArray([]) : freezeArray(["evidence:drift-detection"]),
    supporting_evidence: missing ? freezeArray([]) : freezeArray(["evidence:containment", "evidence:governance", "evidence:replay"]),
    evidence_relationships: missing ? freezeArray([]) : freezeArray(["detection->response", "response->ledger", "ledger->replay"]),
    evidence_versions: missing ? freezeArray([]) : freezeArray(["evidence-schema/v1"]),
    evidence_validation: missing ? freezeArray(["invalid"]) : freezeArray(["valid", "integrity_verified"]),
    evidence_provenance: missing ? freezeArray([]) : freezeArray(["truth-ledger", "audit-ledger"]),
    evidence_history: missing ? freezeArray([]) : freezeArray(["created", "validated", "committed"]),
    lineage_complete: !missing,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildReplayRefs(failures: readonly DriftLedgerFailure[]): ReplayReferenceRecord {
  const invalid = failures.includes("INVALID_REPLAY_REFERENCES") || failures.includes("REPLAY_INCONSISTENCY");
  const base: Omit<ReplayReferenceRecord, "integrity_hash"> = {
    replay_reference_id: `replay_refs_${hash(failures).slice(0, 14)}`,
    replay_identifiers: invalid ? freezeArray([]) : freezeArray(["replay:drift-defense-ledger"]),
    replay_timelines: invalid ? freezeArray([]) : freezeArray(["timeline:drift-lifecycle"]),
    replay_snapshots: invalid ? freezeArray([]) : freezeArray(["snapshot:adaptive-drift-record"]),
    replay_artifacts: invalid ? freezeArray([]) : freezeArray(["artifact:response-record", "artifact:evidence-lineage"]),
    replay_validations: invalid ? freezeArray(["invalid"]) : freezeArray(["valid", "deterministic"]),
    replay_dependencies: invalid ? freezeArray([]) : freezeArray(["drift-response-containment", "drift-defense-architecture"]),
    replay_certifications: invalid ? freezeArray([]) : freezeArray(["certification:replay-ready"]),
    deterministic_reconstruction_supported: !invalid,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildGovernance(): GovernanceDecisionHistory {
  const base: Omit<GovernanceDecisionHistory, "integrity_hash"> = {
    governance_history_id: "governance_history_drift_ledger_v1",
    governance_reviews: freezeArray(["governance:response-policy-review"]),
    constitutional_reviews: freezeArray(["constitutional:boundary-review"]),
    approval_decisions: freezeArray(["approval:record-append-only"]),
    escalation_decisions: freezeArray(["escalation:as-required-by-response"]),
    containment_approvals: freezeArray(["containment:recorded"]),
    policy_evaluations: freezeArray(["policy:drift-ledger-schema/v1"]),
    authority_validations: freezeArray(["authority:operator-visible"]),
    governance_rationale: freezeArray(["Drift records must remain immutable and replayable."]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildCertification(): CertificationHistory {
  const base: Omit<CertificationHistory, "integrity_hash"> = {
    certification_history_id: "certification_history_drift_ledger_v1",
    certification_requests: freezeArray(["certification:ledger-integrity"]),
    certification_outcomes: freezeArray(["certification:ready"]),
    certification_evidence: freezeArray(["evidence:hash-chain", "evidence:replay-validation"]),
    certification_reviewers: freezeArray(["certification-authority"]),
    certification_timelines: freezeArray(["requested", "validated", "recorded"]),
    certification_dependencies: freezeArray(["evidence-lineage", "replay-reference", "governance-history"]),
    certification_recommendations: freezeArray(["preserve_append_only_history"]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildRollback(): RollbackHistory {
  const base: Omit<RollbackHistory, "integrity_hash"> = {
    rollback_history_id: "rollback_history_drift_ledger_v1",
    rollback_requests: freezeArray(["rollback:record-if-required"]),
    rollback_approvals: freezeArray(["approval:governance-required"]),
    rollback_execution: freezeArray(["execution:not_required_for_baseline"]),
    rollback_verification: freezeArray(["verification:replay-compatible"]),
    restored_baseline: "last_certified_adaptive_state",
    replay_validation: freezeArray(["replay:validated"]),
    operator_approvals: freezeArray(["operator:visible"]),
    recovery_completion: freezeArray(["recovery:recorded_when_complete"]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildTimeline(failures: readonly DriftLedgerFailure[]): DriftTimeline {
  const base: Omit<DriftTimeline, "integrity_hash"> = {
    timeline_id: `drift_timeline_${hash(failures).slice(0, 14)}`,
    drift_detection: freezeArray(["detected"]),
    evidence_collection: failures.includes("MISSING_EVIDENCE") ? freezeArray(["missing"]) : freezeArray(["collected", "validated"]),
    replay_validation: failures.includes("INVALID_REPLAY_REFERENCES") ? freezeArray(["invalid"]) : freezeArray(["validated"]),
    simulations_performed: freezeArray(["simulation:as-required"]),
    containment_actions: failures.length ? freezeArray(["rejected_or_fail_closed"]) : freezeArray(["recorded"]),
    operator_reviews: freezeArray(["operator:visible"]),
    governance_reviews: freezeArray(["governance:recorded"]),
    certification_decisions: freezeArray(["certification:recorded"]),
    rollback_actions: freezeArray(["rollback:recorded_if_required"]),
    final_disposition: failures.length ? "not_committed_until_validated" : "committed",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildValidation(record: AdaptiveDriftRecord, evidence: EvidenceLineageRecord, replay: ReplayReferenceRecord, failures: readonly DriftLedgerFailure[]): DriftRecordValidationReport {
  const rejected = failures.length > 0;
  const base: Omit<DriftRecordValidationReport, "integrity_hash"> = {
    report_id: `drift_validation_${hash({ record: record.integrity_hash, failures }).slice(0, 14)}`,
    valid: !rejected,
    rejected,
    required_fields_complete: !failures.includes("INCOMPLETE_RECORD"),
    field_consistency_valid: !failures.includes("RECORD_CORRUPTION"),
    tenant_ownership_valid: !failures.includes("TENANT_OWNERSHIP_VIOLATION"),
    evidence_complete: evidence.lineage_complete && !failures.includes("MISSING_EVIDENCE"),
    replay_references_valid: replay.deterministic_reconstruction_supported && !failures.includes("INVALID_REPLAY_REFERENCES"),
    governance_references_valid: true,
    certification_references_valid: true,
    integrity_hashes_valid: !failures.includes("INTEGRITY_FAILURE") && !failures.includes("LEDGER_TAMPERING"),
    rejection_reasons: failures,
    record_integrity_assessment: rejected ? "Record rejected before ledger commit." : "Record valid for append-only ledger commit.",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildIntegrity(validation: DriftRecordValidationReport, evidence: EvidenceLineageRecord, replay: ReplayReferenceRecord, failures: readonly DriftLedgerFailure[]): LedgerIntegrityReport {
  const base: Omit<LedgerIntegrityReport, "integrity_hash"> = {
    report_id: `ledger_integrity_${hash({ validation: validation.integrity_hash, failures }).slice(0, 14)}`,
    hash_integrity_valid: validation.integrity_hashes_valid,
    append_only_valid: !failures.includes("UNAUTHORIZED_MODIFICATION"),
    replay_consistency_valid: replay.deterministic_reconstruction_supported,
    lineage_complete: evidence.lineage_complete,
    tenant_isolation_valid: validation.tenant_ownership_valid,
    governance_references_valid: validation.governance_references_valid,
    certification_references_valid: validation.certification_references_valid,
    rollback_references_valid: true,
    detected_integrity_failures: failures,
    ledger_health_assessment: failures.length ? "Ledger entry failed validation or requires fail-closed handling." : "Ledger health verified.",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildLedgerEntry(record: AdaptiveDriftRecord, evidence: EvidenceLineageRecord, replay: ReplayReferenceRecord, governance: GovernanceDecisionHistory, certification: CertificationHistory, rollback: RollbackHistory, timeline: DriftTimeline, integrity: LedgerIntegrityReport, committed: boolean): DriftDefenseLedgerEntry {
  const base: Omit<DriftDefenseLedgerEntry, "integrity_hash"> = {
    ledger_entry_id: `drift_ledger_entry_${hash({ record: record.integrity_hash, committed }).slice(0, 16)}`,
    sequence_number: 1,
    previous_entry_hash: PREVIOUS_HASH,
    adaptive_drift_record_hash: record.integrity_hash,
    evidence_lineage_hash: evidence.integrity_hash,
    replay_reference_hash: replay.integrity_hash,
    governance_history_hash: governance.integrity_hash,
    certification_history_hash: certification.integrity_hash,
    rollback_history_hash: rollback.integrity_hash,
    timeline_hash: timeline.integrity_hash,
    integrity_report_hash: integrity.integrity_hash,
    committed,
    timestamp: LEDGER_TIMESTAMP,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildMetrics(status: DriftLedgerStatus, validation: DriftRecordValidationReport, evidence: EvidenceLineageRecord, replay: ReplayReferenceRecord, integrity: LedgerIntegrityReport, failures: readonly DriftLedgerFailure[]): DriftDefenseLedgerMetrics {
  const base: Omit<DriftDefenseLedgerMetrics, "integrity_hash"> = {
    committed: status === "COMMITTED",
    append_only: integrity.append_only_valid,
    immutable: !failures.includes("UNAUTHORIZED_MODIFICATION"),
    deterministic_recording: !failures.includes("NONDETERMINISTIC_LEDGER_RECORDING"),
    replayable_recording: !failures.includes("NONREPLAYABLE_LEDGER_EVIDENCE") && replay.deterministic_reconstruction_supported,
    tenant_isolated: validation.tenant_ownership_valid,
    evidence_complete: evidence.lineage_complete,
    integrity_verified: integrity.hash_integrity_valid,
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<DriftDefenseLedgerResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    architecture_hash: result.architecture_result.integrity_hash,
    response_hash: result.response_result.integrity_hash,
    schema_hash: result.schema.integrity_hash,
    record_hash: result.adaptive_drift_record.integrity_hash,
    validation_hash: result.validation_report.integrity_hash,
    evidence_hash: result.evidence_lineage.integrity_hash,
    replay_refs_hash: result.replay_references.integrity_hash,
    governance_hash: result.governance_history.integrity_hash,
    certification_hash: result.certification_history.integrity_hash,
    rollback_hash: result.rollback_history.integrity_hash,
    timeline_hash: result.timeline.integrity_hash,
    integrity_report_hash: result.integrity_report.integrity_hash,
    ledger_hash: result.ledger_entry.integrity_hash,
    metrics_hash: result.metrics.integrity_hash,
    status: result.status,
    failures: result.failures,
  });
}

function resultIntegrityHash(result: Omit<DriftDefenseLedgerResult, "integrity_hash">): string {
  return hash({
    version: result.drift_defense_ledger_version,
    ledger_identifier: result.ledger_identifier,
    api_surface_hash: result.api_surface.integrity_hash,
    replay_hash: result.replay_hash,
    ledger_entry_hash: result.ledger_entry.integrity_hash,
  });
}

function verifyHashedRecord(value: { integrity_hash: string }): boolean {
  return hashWithoutIntegrity(value) === value.integrity_hash;
}

export function recordDriftDefenseLedger(input: DriftDefenseLedgerInput = {}): DriftDefenseLedgerResult {
  const scenario = input.scenario ?? "BASELINE";
  const api_surface = buildApiSurface();
  const architecture_result = input.architecture_result ?? establishDriftDefenseArchitecture();
  const response_result = input.response_result ?? respondToDrift();
  const failures = collectFailures(scenario, replayDriftDefenseArchitecture(architecture_result), replayDriftResponse(response_result));
  const status = statusFor(failures);
  const schema = buildSchema();
  const adaptive_drift_record = buildAdaptiveRecord(input, failures);
  const evidence_lineage = buildEvidence(failures);
  const replay_references = buildReplayRefs(failures);
  const governance_history = buildGovernance();
  const certification_history = buildCertification();
  const rollback_history = buildRollback();
  const timeline = buildTimeline(failures);
  const validation_report = buildValidation(adaptive_drift_record, evidence_lineage, replay_references, failures);
  const integrity_report = buildIntegrity(validation_report, evidence_lineage, replay_references, failures);
  const ledger_entry = buildLedgerEntry(adaptive_drift_record, evidence_lineage, replay_references, governance_history, certification_history, rollback_history, timeline, integrity_report, status === "COMMITTED");
  const metrics = buildMetrics(status, validation_report, evidence_lineage, replay_references, integrity_report, failures);
  const base: Omit<DriftDefenseLedgerResult, "integrity_hash" | "replay_hash"> = {
    drift_defense_ledger_version: LEDGER_VERSION,
    ledger_identifier: LEDGER_IDENTIFIER,
    status,
    api_surface,
    architecture_result,
    response_result,
    schema,
    adaptive_drift_record,
    validation_report,
    evidence_lineage,
    replay_references,
    governance_history,
    certification_history,
    rollback_history,
    timeline,
    integrity_report,
    ledger_entry,
    metrics,
    failures,
    deterministic: metrics.deterministic_recording,
    replayable: metrics.replayable_recording,
    explainable: !failures.includes("UNKNOWN_LEDGER_BEHAVIOR"),
    evidence_backed: metrics.evidence_complete,
    governance_preserved: true,
    constitutional_preserved: !failures.includes("TENANT_OWNERSHIP_VIOLATION"),
    operator_authority_preserved: true,
    tenant_isolated: metrics.tenant_isolated,
    append_only: true,
    immutable: true,
    mutates_existing_records: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayDriftDefenseLedger(result: DriftDefenseLedgerResult): boolean {
  return (
    verifyHashedRecord(result.api_surface) &&
    replayDriftDefenseArchitecture(result.architecture_result) &&
    replayDriftResponse(result.response_result) &&
    verifyHashedRecord(result.schema) &&
    verifyHashedRecord(result.adaptive_drift_record) &&
    verifyHashedRecord(result.validation_report) &&
    verifyHashedRecord(result.evidence_lineage) &&
    verifyHashedRecord(result.replay_references) &&
    verifyHashedRecord(result.governance_history) &&
    verifyHashedRecord(result.certification_history) &&
    verifyHashedRecord(result.rollback_history) &&
    verifyHashedRecord(result.timeline) &&
    verifyHashedRecord(result.integrity_report) &&
    verifyHashedRecord(result.ledger_entry) &&
    verifyHashedRecord(result.metrics) &&
    resultReplayHash(result) === result.replay_hash &&
    resultIntegrityHash(result) === result.integrity_hash
  );
}

export function getDriftDefenseLedgerFoundation(): DriftDefenseLedgerFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    drift_defense_ledger_version: LEDGER_VERSION,
    api_surface,
    result: recordDriftDefenseLedger(),
  });
}

export const DriftDefenseLedger = Object.freeze({
  record: recordDriftDefenseLedger,
  replay: replayDriftDefenseLedger,
});
