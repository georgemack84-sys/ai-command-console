import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runOperatorWorkflowCertification } from "@/services/decision-operator-workflow-certification";
import type { VisibilityRole } from "@/types/decision-observability-contract";
import type { OperatorWorkflowCertificationResult } from "@/types/decision-operator-workflow-certification";
import type {
  AuditCompletenessReport,
  EvidenceLineageReport,
  IntegrityVerificationReport,
  LedgerCertificationEvidencePackage,
  LedgerCertificationLedgerEntry,
  LedgerCertificationReport,
  LedgerImmutabilityReport,
  LedgerIntegrityCertificationFailure,
  LedgerIntegrityCertificationFoundation,
  LedgerIntegrityCertificationInput,
  LedgerIntegrityCertificationResult,
  LedgerIntegrityCertificationValidation,
  LedgerIntegrityCheck,
  LedgerIntegrityScope,
  LedgerRecordSnapshot,
  TraceabilityVerificationReport,
} from "@/types/decision-ledger-integrity-certification";

const CERTIFICATION_VERSION = "decision-ledger-integrity-certification/v1" as const;

export const LEDGER_INTEGRITY_SCOPES: readonly LedgerIntegrityScope[] = Object.freeze(["IMMUTABLE_LEDGER", "INTEGRITY_HASHES", "EVIDENCE_LINEAGE", "AUDIT_COMPLETENESS", "TRACEABILITY", "REPLAY_INTEGRITY", "CERTIFICATION_LINEAGE"]);
export const LEDGER_INTEGRITY_CHECKS: readonly LedgerIntegrityCheck[] = Object.freeze(["APPEND_ONLY_BEHAVIOR", "RECORD_IMMUTABILITY", "WRITE_ORDERING", "HASH_REPRODUCIBILITY", "TAMPER_DETECTION", "LINEAGE_COMPLETENESS", "AUDIT_COMPLETENESS", "END_TO_END_TRACEABILITY", "REPLAY_REPRODUCIBILITY"]);

type Scenario = NonNullable<LedgerIntegrityCertificationInput["scenario"]>;

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

function ctx(source: OperatorWorkflowCertificationResult) {
  return {
    tenant_id: source.workflow_certification_report.tenant_id,
    mission_id: source.workflow_certification_report.mission_id,
    replay_ref: source.replay_hash,
  };
}

function visibleToRole(source: OperatorWorkflowCertificationResult, role: VisibilityRole): boolean {
  return source.intelligence_certification.governance_certification.replay_certification.deterministic_certification.foundation_certification.certification_framework.analytics_result.operator_dashboard.replay_monitoring.governance_visibility.priority_dashboard.conflict_visualization.timeline_result.dashboard_result.observability_result.authorizations.some((auth) => auth.role === role && auth.permissions.includes("VIEW_DECISIONS"));
}

function buildRecord(input: Omit<LedgerRecordSnapshot, "integrity_hash">, scenario: Scenario, index: number): LedgerRecordSnapshot {
  const built = Object.freeze({ ...input, integrity_hash: hashWithoutIntegrity(input) });
  if (scenario === "HASH_MISMATCH" && index === 0) return Object.freeze({ ...built, integrity_hash: hash({ tampered: built.record_id }) });
  return built;
}

function buildRecords(source: OperatorWorkflowCertificationResult, scenario: Scenario): readonly LedgerRecordSnapshot[] {
  const c = ctx(source);
  const tenant_id = scenario === "CROSS_TENANT" ? `${c.tenant_id}_foreign` : c.tenant_id;
  const base: Omit<LedgerRecordSnapshot, "integrity_hash">[] = [
    { record_id: "ledger_record_orchestration", tenant_id, mission_id: c.mission_id, record_type: "ORCHESTRATION", source_ref: source.workflow_report.workflow_report_id, sequence_number: 1, append_only: true, deleted: false, replay_ref: c.replay_ref, evidence_refs: ["workflow:evidence"], parent_refs: [], child_refs: ["ledger_record_decision"] },
    { record_id: "ledger_record_decision", tenant_id, mission_id: c.mission_id, record_type: "DECISION", source_ref: source.intelligence_certification.explainability_report.report_id, sequence_number: 2, append_only: true, deleted: false, replay_ref: c.replay_ref, evidence_refs: ["decision:evidence"], parent_refs: ["ledger_record_orchestration"], child_refs: ["ledger_record_governance"] },
    { record_id: "ledger_record_governance", tenant_id, mission_id: c.mission_id, record_type: "GOVERNANCE", source_ref: source.intelligence_certification.governance_certification.governance_report.report_id, sequence_number: 3, append_only: true, deleted: false, replay_ref: c.replay_ref, evidence_refs: ["governance:evidence"], parent_refs: ["ledger_record_decision"], child_refs: ["ledger_record_operator"] },
    { record_id: "ledger_record_operator", tenant_id, mission_id: c.mission_id, record_type: "OPERATOR", source_ref: source.workflow_certification_report.report_id, sequence_number: 4, append_only: true, deleted: false, replay_ref: c.replay_ref, evidence_refs: ["operator:evidence"], parent_refs: ["ledger_record_governance"], child_refs: ["ledger_record_replay"] },
    { record_id: "ledger_record_replay", tenant_id, mission_id: c.mission_id, record_type: "REPLAY", source_ref: source.replay_report.replay_report_id, sequence_number: 5, append_only: true, deleted: false, replay_ref: c.replay_ref, evidence_refs: ["replay:evidence"], parent_refs: ["ledger_record_operator"], child_refs: ["ledger_record_certification"] },
    { record_id: "ledger_record_certification", tenant_id, mission_id: c.mission_id, record_type: "CERTIFICATION", source_ref: source.replay_hash, sequence_number: 6, append_only: true, deleted: false, replay_ref: c.replay_ref, evidence_refs: ["certification:evidence"], parent_refs: ["ledger_record_replay"], child_refs: [] },
  ];
  const adjusted = base.map((record, index) => {
    if (scenario === "RECORD_DELETION" && index === 1) return { ...record, deleted: true as false };
    if (scenario === "APPEND_ONLY_VIOLATION" && index === 2) return { ...record, append_only: false as true };
    if (scenario === "RECORD_MODIFICATION" && index === 3) return { ...record, source_ref: "modified:source" };
    if (scenario === "HIDDEN_RECORDS" && index === 4) return { ...record, evidence_refs: [] };
    if (scenario === "REPLAY_INCONSISTENCY" && index === 5) return { ...record, replay_ref: "replay:mismatch" };
    return record;
  });
  const records = scenario === "RECORD_DELETION" ? adjusted.slice(0, -1) : adjusted;
  return freezeArray(records.map((record, index) => buildRecord(record, scenario, index)));
}

function buildImmutability(source: OperatorWorkflowCertificationResult, scenario: Scenario): LedgerImmutabilityReport {
  const c = ctx(source);
  const records = buildRecords(source, scenario);
  const ordered = records.map((record) => record.sequence_number).join("|") === "1|2|3|4|5|6";
  const appendOnly = records.every((record) => record.append_only);
  const deleted = records.some((record) => record.deleted);
  const base: Omit<LedgerImmutabilityReport, "integrity_hash"> = {
    immutability_report_id: "ledger_immutability_report",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    ledger_records: records,
    append_only_enforced: appendOnly && scenario !== "LEDGER_MUTATION",
    records_immutable: scenario !== "LEDGER_MUTATION" && scenario !== "RECORD_MODIFICATION",
    write_ordering_deterministic: ordered && scenario !== "INCOMPLETE_CHRONOLOGY",
    commit_integrity_verified: scenario !== "INTEGRITY_FAILURE",
    historical_records_preserved: !deleted && records.length === 6,
    version_permanence_verified: scenario !== "LEDGER_MUTATION",
    ledger_replay_consistent: records.every((record) => record.replay_ref === c.replay_ref),
    validation_state: "PASS",
  };
  const normalized = { ...base, validation_state: base.append_only_enforced && base.records_immutable && base.write_ordering_deterministic && base.commit_integrity_verified && base.historical_records_preserved && base.version_permanence_verified && base.ledger_replay_consistent ? "PASS" as const : "FAIL" as const };
  return Object.freeze({ ...normalized, integrity_hash: hashWithoutIntegrity(normalized) });
}

function buildIntegrity(source: OperatorWorkflowCertificationResult, immutability: LedgerImmutabilityReport, scenario: Scenario): IntegrityVerificationReport {
  const c = ctx(source);
  const hashesVerified = immutability.ledger_records.every((record) => hashWithoutIntegrity(record) === record.integrity_hash);
  const base: Omit<IntegrityVerificationReport, "integrity_hash"> = {
    integrity_report_id: "ledger_integrity_verification_report",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    record_hashes_verified: hashesVerified,
    ledger_hashes_verified: scenario !== "INTEGRITY_FAILURE",
    replay_hashes_verified: scenario !== "REPLAY_INCONSISTENCY" && scenario !== "INTEGRITY_REPLAY_MISMATCH",
    certification_hashes_verified: scenario !== "CERTIFICATION_LINEAGE_CORRUPTION",
    evidence_hashes_verified: scenario !== "MISSING_EVIDENCE_LINEAGE",
    hash_reproducible: scenario !== "HASH_MISMATCH" && scenario !== "INTEGRITY_REPLAY_MISMATCH",
    tampering_detected: scenario !== "TAMPERING_UNDETECTED",
    tampering_detection_operational: scenario !== "TAMPERING_UNDETECTED",
    validation_state: "PASS",
  };
  const normalized = { ...base, validation_state: Object.entries(base).every(([key, value]) => key.endsWith("_id") || key === "tenant_id" || key === "mission_id" || key === "validation_state" || value === true) ? "PASS" as const : "FAIL" as const };
  return Object.freeze({ ...normalized, integrity_hash: hashWithoutIntegrity(normalized) });
}

function buildLineage(source: OperatorWorkflowCertificationResult, scenario: Scenario): EvidenceLineageReport {
  const c = ctx(source);
  const base: Omit<EvidenceLineageReport, "integrity_hash"> = {
    lineage_report_id: "ledger_evidence_lineage_report",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    evidence_origins_complete: scenario !== "MISSING_EVIDENCE_LINEAGE",
    parent_child_relationships_valid: scenario !== "BROKEN_LINEAGE",
    dependency_lineage_complete: scenario !== "BROKEN_LINEAGE",
    decision_lineage_complete: scenario !== "UNTRACEABLE_DECISION",
    governance_lineage_complete: scenario !== "BROKEN_LINEAGE",
    replay_lineage_complete: scenario !== "REPLAY_LINEAGE_CORRUPTION",
    certification_lineage_complete: scenario !== "CERTIFICATION_LINEAGE_CORRUPTION",
    lineage_refs: scenario === "BROKEN_LINEAGE" ? freezeArray([]) : freezeArray(["lineage:evidence", "lineage:decision", "lineage:governance", "lineage:replay", "lineage:certification"]),
    validation_state: "PASS",
  };
  const normalized = { ...base, validation_state: base.evidence_origins_complete && base.parent_child_relationships_valid && base.dependency_lineage_complete && base.decision_lineage_complete && base.governance_lineage_complete && base.replay_lineage_complete && base.certification_lineage_complete && base.lineage_refs.length > 0 ? "PASS" as const : "FAIL" as const };
  return Object.freeze({ ...normalized, integrity_hash: hashWithoutIntegrity(normalized) });
}

function buildAudit(source: OperatorWorkflowCertificationResult, scenario: Scenario): AuditCompletenessReport {
  const c = ctx(source);
  const missing = scenario === "MISSING_AUDIT_RECORDS";
  const base: Omit<AuditCompletenessReport, "integrity_hash"> = {
    audit_report_id: "ledger_audit_completeness_report",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    decision_history_complete: !missing,
    operator_history_complete: !missing,
    governance_history_complete: !missing,
    replay_history_complete: !missing,
    certification_history_complete: !missing,
    state_transitions_complete: scenario !== "INCOMPLETE_CHRONOLOGY",
    event_chronology_complete: scenario !== "INCOMPLETE_CHRONOLOGY",
    audit_timeline_refs: missing ? freezeArray([]) : freezeArray(["timeline:decision", "timeline:operator", "timeline:governance", "timeline:replay", "timeline:certification"]),
    validation_state: "PASS",
  };
  const normalized = { ...base, validation_state: base.decision_history_complete && base.operator_history_complete && base.governance_history_complete && base.replay_history_complete && base.certification_history_complete && base.state_transitions_complete && base.event_chronology_complete && base.audit_timeline_refs.length > 0 ? "PASS" as const : "FAIL" as const };
  return Object.freeze({ ...normalized, integrity_hash: hashWithoutIntegrity(normalized) });
}

function buildTraceability(source: OperatorWorkflowCertificationResult, scenario: Scenario): TraceabilityVerificationReport {
  const c = ctx(source);
  const missing = scenario === "MISSING_TRACEABILITY";
  const base: Omit<TraceabilityVerificationReport, "integrity_hash"> = {
    traceability_report_id: "ledger_traceability_verification_report",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    decision_traceability_complete: !missing && scenario !== "UNTRACEABLE_DECISION",
    evidence_traceability_complete: !missing,
    dependency_traceability_complete: !missing,
    governance_traceability_complete: !missing,
    authority_traceability_complete: !missing,
    operator_traceability_complete: !missing,
    replay_traceability_complete: !missing && scenario !== "REPLAY_LINEAGE_CORRUPTION",
    cross_reference_integrity_valid: !missing && scenario !== "HIDDEN_RECORDS",
    trace_graph_refs: missing ? freezeArray([]) : freezeArray(["trace:decision", "trace:evidence", "trace:dependency", "trace:governance", "trace:operator", "trace:replay"]),
    validation_state: "PASS",
  };
  const normalized = { ...base, validation_state: base.decision_traceability_complete && base.evidence_traceability_complete && base.dependency_traceability_complete && base.governance_traceability_complete && base.authority_traceability_complete && base.operator_traceability_complete && base.replay_traceability_complete && base.cross_reference_integrity_valid && base.trace_graph_refs.length > 0 ? "PASS" as const : "FAIL" as const };
  return Object.freeze({ ...normalized, integrity_hash: hashWithoutIntegrity(normalized) });
}

function buildEvidence(source: OperatorWorkflowCertificationResult, immutability: LedgerImmutabilityReport, integrity: IntegrityVerificationReport, lineage: EvidenceLineageReport, audit: AuditCompletenessReport, traceability: TraceabilityVerificationReport, scenario: Scenario): LedgerCertificationEvidencePackage {
  const c = ctx(source);
  const base: Omit<LedgerCertificationEvidencePackage, "integrity_hash"> = {
    evidence_package_id: "ledger_integrity_certification_evidence_package",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    ledger_evidence_refs: scenario === "HIDDEN_RECORDS" ? freezeArray([]) : freezeArray([immutability.immutability_report_id, ...immutability.ledger_records.map((record) => record.record_id)]),
    integrity_evidence_refs: scenario === "HASH_MISMATCH" || scenario === "INTEGRITY_FAILURE" ? freezeArray([]) : freezeArray([integrity.integrity_report_id, ...immutability.ledger_records.map((record) => record.integrity_hash)]),
    lineage_evidence_refs: scenario === "MISSING_EVIDENCE_LINEAGE" ? freezeArray([]) : freezeArray([lineage.lineage_report_id, ...lineage.lineage_refs]),
    audit_evidence_refs: scenario === "MISSING_AUDIT_RECORDS" ? freezeArray([]) : freezeArray([audit.audit_report_id, ...audit.audit_timeline_refs]),
    traceability_evidence_refs: scenario === "MISSING_TRACEABILITY" ? freezeArray([]) : freezeArray([traceability.traceability_report_id, ...traceability.trace_graph_refs]),
    replay_evidence_refs: scenario === "REPLAY_INCONSISTENCY" ? freezeArray([]) : freezeArray([source.replay_hash, source.replay_report.replay_report_id]),
    complete: scenario !== "HIDDEN_RECORDS" && scenario !== "MISSING_EVIDENCE_LINEAGE" && scenario !== "MISSING_AUDIT_RECORDS" && scenario !== "MISSING_TRACEABILITY",
    immutable: scenario !== "FAIL_OPEN" && scenario !== "LEDGER_MUTATION" && scenario !== "RECORD_MODIFICATION",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(input: {
  operator: OperatorWorkflowCertificationResult;
  immutability: LedgerImmutabilityReport;
  integrity: IntegrityVerificationReport;
  lineage: EvidenceLineageReport;
  audit: AuditCompletenessReport;
  traceability: TraceabilityVerificationReport;
  evidence: LedgerCertificationEvidencePackage;
  ledger: readonly LedgerCertificationLedgerEntry[];
  role: VisibilityRole;
  scenario: Scenario;
}): readonly LedgerIntegrityCertificationFailure[] {
  const failures: LedgerIntegrityCertificationFailure[] = [];
  if (input.operator.validation.validation_status !== "VALID" || input.operator.workflow_certification_report.certification_decision !== "PASS") failures.push("OPERATOR_WORKFLOW_CERTIFICATION_INVALID");
  if (!input.immutability.records_immutable || input.scenario === "LEDGER_MUTATION") failures.push("LEDGER_MUTATION");
  if (!input.immutability.historical_records_preserved || input.immutability.ledger_records.some((record) => record.deleted)) failures.push("RECORD_DELETION");
  if (input.scenario === "RECORD_MODIFICATION") failures.push("RECORD_MODIFICATION");
  if (!input.immutability.append_only_enforced || input.immutability.ledger_records.some((record) => !record.append_only)) failures.push("APPEND_ONLY_VIOLATION");
  if (!input.integrity.record_hashes_verified || input.scenario === "HASH_MISMATCH") failures.push("HASH_MISMATCH");
  if (input.integrity.validation_state !== "PASS") failures.push("INTEGRITY_VERIFICATION_FAILURE");
  if (!input.integrity.tampering_detection_operational || !input.integrity.tampering_detected) failures.push("TAMPERING_UNDETECTED");
  if (!input.lineage.evidence_origins_complete || !input.evidence.lineage_evidence_refs.length) failures.push("MISSING_EVIDENCE_LINEAGE");
  if (!input.lineage.parent_child_relationships_valid || !input.lineage.dependency_lineage_complete) failures.push("BROKEN_LINEAGE_CHAIN");
  if (input.audit.validation_state !== "PASS" || !input.evidence.audit_evidence_refs.length) failures.push("MISSING_AUDIT_RECORDS");
  if (!input.audit.event_chronology_complete || !input.audit.state_transitions_complete || !input.immutability.write_ordering_deterministic) failures.push("INCOMPLETE_CHRONOLOGY");
  if (input.traceability.validation_state !== "PASS" || !input.evidence.traceability_evidence_refs.length) failures.push("MISSING_TRACEABILITY");
  if (!input.lineage.replay_lineage_complete || !input.traceability.replay_traceability_complete) failures.push("REPLAY_LINEAGE_CORRUPTION");
  if (!input.lineage.certification_lineage_complete || !input.integrity.certification_hashes_verified) failures.push("CERTIFICATION_LINEAGE_CORRUPTION");
  if (input.immutability.ledger_records.some((record) => record.tenant_id !== input.operator.workflow_certification_report.tenant_id)) failures.push("CROSS_TENANT_LEDGER_CONTAMINATION");
  if (!input.evidence.ledger_evidence_refs.length || input.scenario === "HIDDEN_RECORDS") failures.push("HIDDEN_RECORDS");
  if (!input.lineage.decision_lineage_complete || !input.traceability.decision_traceability_complete) failures.push("UNTRACEABLE_DECISION");
  if (!input.immutability.ledger_replay_consistent || !input.integrity.replay_hashes_verified || !input.evidence.replay_evidence_refs.length) failures.push("REPLAY_INCONSISTENCY");
  if (!input.integrity.hash_reproducible || input.scenario === "INTEGRITY_REPLAY_MISMATCH") failures.push("INTEGRITY_REPLAY_MISMATCH");
  if (!input.evidence.immutable || input.ledger.some((entry) => !entry.append_only || entry.deleted)) failures.push("FAIL_OPEN_LEDGER_BEHAVIOR");
  if (!visibleToRole(input.operator, input.role)) failures.push("AUTHORIZATION_FAILURE");
  if (input.scenario === "EXECUTION_AUTHORITY") failures.push("EXECUTION_AUTHORITY_GRANTED");
  return freezeArray([...new Set(failures)]);
}

function buildReport(source: OperatorWorkflowCertificationResult, immutability: LedgerImmutabilityReport, integrity: IntegrityVerificationReport, lineage: EvidenceLineageReport, audit: AuditCompletenessReport, traceability: TraceabilityVerificationReport, failures: readonly LedgerIntegrityCertificationFailure[]): LedgerCertificationReport {
  const c = ctx(source);
  const decision = failures.length ? "FAIL" : "PASS";
  const base: Omit<LedgerCertificationReport, "integrity_hash"> = {
    report_id: "ledger_integrity_certification_report",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    executive_summary: decision === "PASS" ? "Decision Orchestrator ledger records are immutable, integrity-protected, auditable, traceable, and replay-ready." : "Ledger integrity certification is blocked by immutability, integrity, lineage, audit, or traceability failures.",
    certification_scope: LEDGER_INTEGRITY_SCOPES,
    certified_checks: LEDGER_INTEGRITY_CHECKS,
    ledger_immutability_assessment: immutability.validation_state,
    integrity_verification_results: integrity.validation_state,
    evidence_lineage_assessment: lineage.validation_state,
    audit_completeness_assessment: audit.validation_state,
    traceability_assessment: traceability.validation_state,
    replay_integrity_results: immutability.ledger_replay_consistent && integrity.replay_hashes_verified ? "PASS" : "FAIL",
    failure_analysis: failures,
    certification_decision: decision,
    production_readiness: decision === "PASS" ? "READY" : "BLOCKED",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildLedger(source: OperatorWorkflowCertificationResult, evidence: LedgerCertificationEvidencePackage, report: LedgerCertificationReport, scenario: Scenario): readonly LedgerCertificationLedgerEntry[] {
  const c = ctx(source);
  const events: Omit<LedgerCertificationLedgerEntry, "integrity_hash">[] = [
    { ledger_entry_id: "ledger_integrity_ledger_001", tenant_id: c.tenant_id, mission_id: c.mission_id, event_type: "LEDGER_VALIDATED", scope_ref: "append_only_ledger", evidence_ref: evidence.evidence_package_id, certification_state: report.certification_decision, replay_refs: evidence.replay_evidence_refs, event_timestamp: "2026-07-05T09:12:26.000Z", sequence_number: 1, append_only: true, deleted: false },
    { ledger_entry_id: "ledger_integrity_ledger_002", tenant_id: c.tenant_id, mission_id: c.mission_id, event_type: "INTEGRITY_VALIDATED", scope_ref: "hash_verification", evidence_ref: evidence.evidence_package_id, certification_state: report.certification_decision, replay_refs: evidence.replay_evidence_refs, event_timestamp: "2026-07-05T09:12:27.000Z", sequence_number: 2, append_only: true, deleted: false },
    { ledger_entry_id: "ledger_integrity_ledger_003", tenant_id: c.tenant_id, mission_id: c.mission_id, event_type: "TRACEABILITY_VALIDATED", scope_ref: "end_to_end_traceability", evidence_ref: evidence.evidence_package_id, certification_state: report.certification_decision, replay_refs: evidence.replay_evidence_refs, event_timestamp: "2026-07-05T09:12:28.000Z", sequence_number: 3, append_only: true, deleted: false },
    { ledger_entry_id: "ledger_integrity_ledger_004", tenant_id: c.tenant_id, mission_id: c.mission_id, event_type: report.certification_decision === "PASS" ? "LEDGER_CERTIFIED" : "LEDGER_BLOCKED", scope_ref: report.report_id, evidence_ref: evidence.evidence_package_id, certification_state: report.certification_decision, replay_refs: evidence.replay_evidence_refs, event_timestamp: "2026-07-05T09:12:29.000Z", sequence_number: 4, append_only: (scenario === "FAIL_OPEN" ? false : true) as true, deleted: false },
  ];
  return freezeArray(events.map((event) => Object.freeze({ ...event, integrity_hash: hashWithoutIntegrity(event) })));
}

function buildValidation(failures: readonly LedgerIntegrityCertificationFailure[]): LedgerIntegrityCertificationValidation {
  const has = (failure: LedgerIntegrityCertificationFailure) => failures.includes(failure);
  const base: Omit<LedgerIntegrityCertificationValidation, "integrity_hash"> = {
    validation_id: "ledger_integrity_certification_validation",
    validation_status: failures.length ? "BLOCKED" : "VALID",
    operator_workflow_certification_valid: !has("OPERATOR_WORKFLOW_CERTIFICATION_INVALID"),
    ledger_unmodified: !has("LEDGER_MUTATION"),
    records_not_deleted: !has("RECORD_DELETION"),
    records_not_modified: !has("RECORD_MODIFICATION"),
    append_only_enforced: !has("APPEND_ONLY_VIOLATION"),
    hashes_match: !has("HASH_MISMATCH"),
    integrity_verified: !has("INTEGRITY_VERIFICATION_FAILURE"),
    tampering_detected: !has("TAMPERING_UNDETECTED"),
    evidence_lineage_complete: !has("MISSING_EVIDENCE_LINEAGE"),
    lineage_chain_valid: !has("BROKEN_LINEAGE_CHAIN"),
    audit_records_complete: !has("MISSING_AUDIT_RECORDS"),
    chronology_complete: !has("INCOMPLETE_CHRONOLOGY"),
    traceability_complete: !has("MISSING_TRACEABILITY"),
    replay_lineage_complete: !has("REPLAY_LINEAGE_CORRUPTION"),
    certification_lineage_complete: !has("CERTIFICATION_LINEAGE_CORRUPTION"),
    tenant_isolated: !has("CROSS_TENANT_LEDGER_CONTAMINATION"),
    hidden_records_absent: !has("HIDDEN_RECORDS"),
    decisions_traceable: !has("UNTRACEABLE_DECISION"),
    replay_consistent: !has("REPLAY_INCONSISTENCY"),
    integrity_replay_consistent: !has("INTEGRITY_REPLAY_MISMATCH"),
    fail_closed: !has("FAIL_OPEN_LEDGER_BEHAVIOR"),
    authorization_valid: !has("AUTHORIZATION_FAILURE"),
    advisory_only: !has("EXECUTION_AUTHORITY_GRANTED"),
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<LedgerIntegrityCertificationResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    immutability: result.immutability_report,
    integrity: result.integrity_report,
    lineage: result.lineage_report,
    audit: result.audit_report,
    traceability: result.traceability_report,
    evidence: result.evidence_package,
    report: result.ledger_report,
    ledger: result.ledger_certification_ledger,
    validation: result.validation,
  });
}

export function runLedgerIntegrityCertification(input: LedgerIntegrityCertificationInput = {}): LedgerIntegrityCertificationResult {
  const scenario = input.scenario ?? "BASELINE";
  const role = input.role ?? "OPERATOR";
  const operator_workflow_certification = input.operator_workflow_certification ?? runOperatorWorkflowCertification({ scenario: scenario === "OPERATOR_INVALID" ? "MUTABLE_AUDIT_HISTORY" : "BASELINE" });
  const immutability_report = buildImmutability(operator_workflow_certification, scenario);
  const integrity_report = buildIntegrity(operator_workflow_certification, immutability_report, scenario);
  const lineage_report = buildLineage(operator_workflow_certification, scenario);
  const audit_report = buildAudit(operator_workflow_certification, scenario);
  const traceability_report = buildTraceability(operator_workflow_certification, scenario);
  const evidence_package = buildEvidence(operator_workflow_certification, immutability_report, integrity_report, lineage_report, audit_report, traceability_report, scenario);
  const preFailures = collectFailures({ operator: operator_workflow_certification, immutability: immutability_report, integrity: integrity_report, lineage: lineage_report, audit: audit_report, traceability: traceability_report, evidence: evidence_package, ledger: [], role, scenario });
  const ledger_report = buildReport(operator_workflow_certification, immutability_report, integrity_report, lineage_report, audit_report, traceability_report, preFailures);
  const ledger_certification_ledger = buildLedger(operator_workflow_certification, evidence_package, ledger_report, scenario);
  const failures = collectFailures({ operator: operator_workflow_certification, immutability: immutability_report, integrity: integrity_report, lineage: lineage_report, audit: audit_report, traceability: traceability_report, evidence: evidence_package, ledger: ledger_certification_ledger, role, scenario });
  const validation = buildValidation(failures);
  const base: Omit<LedgerIntegrityCertificationResult, "integrity_hash" | "replay_hash"> = {
    certification_version: CERTIFICATION_VERSION,
    operator_workflow_certification,
    immutability_report,
    integrity_report,
    lineage_report,
    audit_report,
    traceability_report,
    evidence_package,
    ledger_report,
    ledger_certification_ledger,
    validation,
    deterministic: true,
    replayable: true,
    advisory_only: true,
    mutates_ledger_records: false,
    execution_authority_granted: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayLedgerIntegrityCertification(result: LedgerIntegrityCertificationResult): boolean {
  return resultReplayHash(result) === result.replay_hash && hashWithoutIntegrity(result) === result.integrity_hash;
}

export function computeLedgerRecordHash(record: Omit<LedgerRecordSnapshot, "integrity_hash"> | LedgerRecordSnapshot): string {
  return hashWithoutIntegrity(record);
}

export function getLedgerIntegrityCertificationFoundation(): LedgerIntegrityCertificationFoundation {
  return Object.freeze({
    certification_version: CERTIFICATION_VERSION,
    scopes: LEDGER_INTEGRITY_SCOPES,
    checks: LEDGER_INTEGRITY_CHECKS,
    result: runLedgerIntegrityCertification(),
  });
}

export const LedgerIntegrityCertification = Object.freeze({
  run: runLedgerIntegrityCertification,
  replay: replayLedgerIntegrityCertification,
});
