import { runApplicationGovernanceBinding, validateApplicationGovernanceBinding } from "@/services/application-governance-binding";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  ApplicationReplayAuditForensicsResult,
  ApplicationReplayForensicsBundle,
  ApplicationReplayForensicsFailure,
  ApplicationReplayForensicsInput,
  ApplicationReplayForensicsOutcome,
  ApplicationReplayForensicsScenario,
  ApplicationReplayForensicsValidation,
} from "@/types/application-replay-audit-forensics";

const VERSION = "application-replay-audit-forensics/v4.9" as const;
const IDENTIFIER = "ApplicationReplayAuditForensics" as const;
const TIMESTAMP = "2026-07-18T00:00:00.000Z" as const;
let baselineGovernanceBinding: ReturnType<typeof runApplicationGovernanceBinding> | undefined;

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}
function nested<T extends object>(value: T): T & { integrity_hash: string } {
  return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string };
}
function has(failures: readonly ApplicationReplayForensicsFailure[], failure: ApplicationReplayForensicsFailure): boolean { return failures.includes(failure); }
function scenarioFailure(scenario: ApplicationReplayForensicsScenario): ApplicationReplayForensicsFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function getBaselineGovernanceBinding() { baselineGovernanceBinding ??= runApplicationGovernanceBinding(); return baselineGovernanceBinding; }
function outcome(failures: readonly ApplicationReplayForensicsFailure[]): ApplicationReplayForensicsOutcome {
  if (has(failures, "CERTIFICATION_PRUNED")) return "PRUNED";
  return failures.length ? "FAIL" : "PASS";
}
function verifyHashedRecord(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }

function resultReplayHash(result: Omit<ApplicationReplayAuditForensicsResult, "replay_hash" | "integrity_hash">): string {
  return hash({
    request: result.replay_request.integrity_hash,
    analysis: result.replay_analysis_report.integrity_hash,
    audit: result.audit_report.integrity_hash,
    timeline: result.investigation_timeline.integrity_hash,
    forensic: result.forensic_finding.integrity_hash,
    correlation: result.correlation_map.integrity_hash,
    report: result.investigation_report.integrity_hash,
    lineage: result.lineage_record.integrity_hash,
    certification: result.certification.integrity_hash,
  });
}
function resultIntegrityHash(result: Omit<ApplicationReplayAuditForensicsResult, "integrity_hash">): string {
  return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.certification.outcome, replay_hash: result.replay_hash });
}

export function runApplicationReplayAuditForensics(input: ApplicationReplayForensicsInput = {}): ApplicationReplayAuditForensicsResult {
  const direct = scenarioFailure(input.scenario ?? "BASELINE");
  const scenarioFailures = freezeArray<ApplicationReplayForensicsFailure>(direct ? [direct] : []);
  const governanceBinding = getBaselineGovernanceBinding();
  const dependencyFailures = freezeArray<ApplicationReplayForensicsFailure>([
    ...(!validateApplicationGovernanceBinding(governanceBinding).valid || has(scenarioFailures, "P4_8_GOVERNANCE_BINDING_INVALID") ? ["P4_8_GOVERNANCE_BINDING_INVALID" as const] : []),
    ...(has(scenarioFailures, "CCI_REPLAY_INFRASTRUCTURE_INVALID") ? ["CCI_REPLAY_INFRASTRUCTURE_INVALID" as const] : []),
    ...(has(scenarioFailures, "CCI_REPLAY_LEDGER_INVALID") ? ["CCI_REPLAY_LEDGER_INVALID" as const] : []),
    ...(has(scenarioFailures, "CCI_AUDIT_LEDGER_INVALID") ? ["CCI_AUDIT_LEDGER_INVALID" as const] : []),
    ...(has(scenarioFailures, "CCI_EVIDENCE_SERVICES_INVALID") ? ["CCI_EVIDENCE_SERVICES_INVALID" as const] : []),
    ...(has(scenarioFailures, "CCI_IMMUTABLE_STORAGE_INVALID") ? ["CCI_IMMUTABLE_STORAGE_INVALID" as const] : []),
    ...(has(scenarioFailures, "CAF_BEHAVIORAL_REPLAY_INVALID") ? ["CAF_BEHAVIORAL_REPLAY_INVALID" as const] : []),
    ...(has(scenarioFailures, "CAF_DIVERGENCE_REPORTS_INVALID") ? ["CAF_DIVERGENCE_REPORTS_INVALID" as const] : []),
    ...(has(scenarioFailures, "CAF_ASSURANCE_EVIDENCE_INVALID") ? ["CAF_ASSURANCE_EVIDENCE_INVALID" as const] : []),
    ...(has(scenarioFailures, "CAF_GOVERNANCE_EVIDENCE_INVALID") ? ["CAF_GOVERNANCE_EVIDENCE_INVALID" as const] : []),
  ]);
  const failures = freezeArray([...new Set([...scenarioFailures, ...dependencyFailures])]);
  const applicationId = input.application_id ?? governanceBinding.constitutional_binding.application_id;
  const replay_request = nested({
    replay_request_id: has(failures, "REPLAY_REQUEST_MISSING") ? "" : "P4.9-REPLAY-REQUEST-001",
    requester: input.requester ?? "investigator:application-governance",
    application_id: applicationId,
    replay_scope: freezeArray(["application-execution-flow", "integration-behavior", "capability-execution", "governance-decisions"]),
    requested_period: "2026-07-17T00:00:00.000Z/2026-07-18T00:00:00.000Z",
    authorization_reference: has(failures, "REPLAY_REQUEST_UNAUTHORIZED") ? "" : governanceBinding.approval_routing.routing_id,
    status: has(failures, "CANONICAL_REPLAY_EVIDENCE_MISSING") ? "AUTHORIZED" as const : "ARCHIVED" as const,
    request_timestamp: TIMESTAMP,
  });
  const replayEvidenceRefs = has(failures, "CANONICAL_REPLAY_EVIDENCE_MISSING") ? freezeArray<string>([]) : freezeArray(["cci:replay-session:P4.9-001", "cci:replay-ledger:P4.9-001", "cci:evidence:P4.9-immutable"]);
  const cafEvidenceRefs = has(failures, "CAF_REPLAY_EVIDENCE_MISSING") ? freezeArray<string>([]) : freezeArray(["caf:behavioral-replay:P4.9-001", "caf:divergence-report:P4.9-001", "caf:assurance-evidence:P4.9-001"]);
  const replay_analysis_report = nested({
    report_id: has(failures, "REPLAY_ANALYSIS_REPORT_MISSING") ? "" : "P4.9-REPLAY-ANALYSIS-REPORT-001",
    replay_request_id: replay_request.replay_request_id,
    application_id: applicationId,
    replay_session_reference: has(failures, "REPLAY_SESSION_REFERENCE_MISSING") ? "" : "cci:replay-session:P4.9-001",
    replay_scope: replay_request.replay_scope,
    analyzed_events: freezeArray(["request-authorized", "cci-replay-evidence-retrieved", "caf-behavioral-evidence-linked", "application-flow-interpreted"]),
    divergence_summary: "CAF divergence evidence was interpreted for application impact without replacing CAF behavioral replay.",
    execution_summary: "Application execution flow reconstructed from CCI replay evidence.",
    dependency_summary: "Integration and capability dependencies correlated against Program 4 registry records.",
    findings: freezeArray(["application-behavior-reproducible", "governance-path-preserved"]),
    evidence_references: has(failures, "NON_CCI_REPLAY_EVIDENCE_USED") ? freezeArray(["noncci:replay:evidence"]) : replayEvidenceRefs,
    analysis_timestamp: TIMESTAMP,
    deterministic: !has(failures, "REPLAY_ANALYSIS_NON_DETERMINISTIC"),
    uses_only_cci_replay_evidence: !has(failures, "NON_CCI_REPLAY_EVIDENCE_USED") && replayEvidenceRefs.length > 0,
  });
  const audit_report = nested({
    audit_report_id: has(failures, "AUDIT_REPORT_MISSING") ? "" : "P4.9-AUDIT-REPORT-001",
    application_id: applicationId,
    audit_scope: freezeArray(["governance-records", "lifecycle-events", "compliance-history", "audit-ledger"]),
    governance_events: freezeArray([governanceBinding.governance_binding.registry_id, governanceBinding.approval_routing.routing_id]),
    lifecycle_events: freezeArray(["lifecycle:p4.5:qualification", "integration:p4.6:contract", "evidence:p4.7:index"]),
    compliance_summary: "Immutable audit history interpreted against application governance binding.",
    audit_findings: freezeArray(["compliance-evidence-complete", "audit-history-preserved"]),
    evidence_references: freezeArray(["cci:audit-ledger:P4.9-001", governanceBinding.compliance_report.report_id]),
    generated_timestamp: TIMESTAMP,
    deterministic: !has(failures, "AUDIT_INTERPRETATION_NON_DETERMINISTIC"),
    immutable_history_preserved: !has(failures, "AUDIT_HISTORY_MUTATION_ATTEMPTED"),
  });
  const investigation_timeline = nested({
    timeline_id: "P4.9-INVESTIGATION-TIMELINE-001",
    investigation_id: "P4.9-INVESTIGATION-001",
    ordered_events: has(failures, "TIMELINE_INCOMPLETE") ? freezeArray(["incident-declared"]) : freezeArray(["incident-declared", "replay-requested", "authorization-verified", "cci-evidence-retrieved", "caf-evidence-linked", "application-analysis-completed", "audit-interpreted", "forensic-correlation-completed", "report-generated", "evidence-archived"]),
    dependency_timeline_refs: freezeArray(["application-registry:P4.2", "application-lifecycle:P4.5", "application-integration:P4.6"]),
    deterministic_ordering: !has(failures, "TIMELINE_NON_DETERMINISTIC"),
    complete: !has(failures, "TIMELINE_INCOMPLETE"),
  });
  const forensic_finding = nested({
    finding_id: has(failures, "FORENSIC_FINDING_MISSING") ? "" : "P4.9-FORENSIC-FINDING-001",
    investigation_id: investigation_timeline.investigation_id,
    application_id: applicationId,
    incident_reference: input.incident_reference ?? "incident:P4.9:governed-replay",
    reconstructed_timeline: investigation_timeline.timeline_id,
    causal_analysis: "Root cause analysis is derived from replay, audit, governance, lifecycle, and CAF behavioral evidence.",
    affected_components: freezeArray(["application-runtime-boundary", "integration-contract", "capability-execution-path"]),
    evidence_references: freezeArray([...replayEvidenceRefs, ...cafEvidenceRefs, audit_report.audit_report_id]),
    confidence_level: has(failures, "FORENSIC_CONFIDENCE_INSUFFICIENT") ? "LOW" as const : "HIGH" as const,
    investigator: replay_request.requester,
    created_timestamp: TIMESTAMP,
  });
  const correlation_map = nested({
    correlation_id: has(failures, "CORRELATION_MAP_MISSING") ? "" : "P4.9-CORRELATION-MAP-001",
    application_id: applicationId,
    replay_evidence_refs: replayEvidenceRefs,
    audit_event_refs: audit_report.evidence_references,
    governance_decision_refs: governanceBinding.governance_evidence.governance_lineage_refs,
    lifecycle_history_refs: freezeArray(["lifecycle:p4.5:qualification", "governance:p4.8:binding"]),
    application_dependency_refs: freezeArray(["registry:p4.2:application", "integration:p4.6:contract", "evidence:p4.7:index"]),
    cross_application_links: has(failures, "CROSS_APPLICATION_CORRELATION_INVALID") ? freezeArray([]) : freezeArray(["application:dependency:shared-capability", "application:dependency:tenant-boundary"]),
    valid: !has(failures, "CROSS_APPLICATION_CORRELATION_INVALID") && !has(failures, "CORRELATION_MAP_MISSING"),
  });
  const investigation_report = nested({
    report_id: has(failures, "INVESTIGATION_REPORT_MISSING") ? "" : "P4.9-INVESTIGATION-REPORT-001",
    investigation_id: investigation_timeline.investigation_id,
    replay_summary_ref: replay_analysis_report.report_id,
    audit_report_ref: audit_report.audit_report_id,
    forensic_finding_refs: forensic_finding.finding_id ? freezeArray([forensic_finding.finding_id]) : freezeArray<string>([]),
    timeline_ref: investigation_timeline.timeline_id,
    correlation_map_ref: correlation_map.correlation_id,
    compliance_evidence_refs: freezeArray([governanceBinding.compliance_report.report_id, ...audit_report.evidence_references]),
    reproducible_from_canonical_evidence: !has(failures, "REPORT_NOT_REPRODUCIBLE"),
    generated_timestamp: TIMESTAMP,
  });
  const lineage_record = nested({
    lineage_id: "P4.9-INVESTIGATION-LINEAGE-001",
    evidence_references: has(failures, "INVESTIGATION_LINEAGE_INCOMPLETE") ? freezeArray<string>([]) : freezeArray([...replayEvidenceRefs, ...cafEvidenceRefs, ...audit_report.evidence_references]),
    investigation_refs: freezeArray([investigation_timeline.investigation_id]),
    report_refs: investigation_report.report_id ? freezeArray([investigation_report.report_id]) : freezeArray<string>([]),
    replay_provenance_refs: replay_analysis_report.replay_session_reference ? freezeArray([replay_analysis_report.replay_session_reference, "cci:replay-ledger:P4.9-001"]) : freezeArray<string>([]),
    immutable: !has(failures, "EVIDENCE_REFERENCE_MUTATED"),
    complete: !has(failures, "INVESTIGATION_LINEAGE_INCOMPLETE"),
  });
  const noOutOfScope = !has(failures, "REPLAY_EXECUTION_ATTEMPTED") && !has(failures, "CCI_REPLAY_REPLACEMENT_ATTEMPTED") && !has(failures, "CAF_REPLAY_REPLACEMENT_ATTEMPTED") && !has(failures, "FORENSIC_STORAGE_ATTEMPTED") && !has(failures, "AUDIT_HISTORY_MUTATION_ATTEMPTED");
  const derivedFailures = freezeArray([...new Set([
    ...failures,
    ...(replay_request.replay_request_id.length === 0 ? ["REPLAY_REQUEST_MISSING" as const] : []),
    ...(replay_request.authorization_reference.length === 0 ? ["REPLAY_REQUEST_UNAUTHORIZED" as const] : []),
    ...(replay_analysis_report.replay_session_reference.length === 0 ? ["REPLAY_SESSION_REFERENCE_MISSING" as const] : []),
    ...(replayEvidenceRefs.length === 0 ? ["CANONICAL_REPLAY_EVIDENCE_MISSING" as const] : []),
    ...(cafEvidenceRefs.length === 0 ? ["CAF_REPLAY_EVIDENCE_MISSING" as const] : []),
    ...(!replay_analysis_report.uses_only_cci_replay_evidence ? ["NON_CCI_REPLAY_EVIDENCE_USED" as const] : []),
    ...(!replay_analysis_report.deterministic ? ["REPLAY_ANALYSIS_NON_DETERMINISTIC" as const] : []),
    ...(replay_analysis_report.report_id.length === 0 ? ["REPLAY_ANALYSIS_REPORT_MISSING" as const] : []),
    ...(!audit_report.deterministic ? ["AUDIT_INTERPRETATION_NON_DETERMINISTIC" as const] : []),
    ...(audit_report.audit_report_id.length === 0 ? ["AUDIT_REPORT_MISSING" as const] : []),
    ...(forensic_finding.finding_id.length === 0 ? ["FORENSIC_FINDING_MISSING" as const] : []),
    ...(forensic_finding.confidence_level !== "HIGH" ? ["FORENSIC_CONFIDENCE_INSUFFICIENT" as const] : []),
    ...(!investigation_timeline.deterministic_ordering ? ["TIMELINE_NON_DETERMINISTIC" as const] : []),
    ...(!investigation_timeline.complete ? ["TIMELINE_INCOMPLETE" as const] : []),
    ...(correlation_map.correlation_id.length === 0 ? ["CORRELATION_MAP_MISSING" as const] : []),
    ...(!correlation_map.valid ? ["CROSS_APPLICATION_CORRELATION_INVALID" as const] : []),
    ...(investigation_report.report_id.length === 0 ? ["INVESTIGATION_REPORT_MISSING" as const] : []),
    ...(!investigation_report.reproducible_from_canonical_evidence ? ["REPORT_NOT_REPRODUCIBLE" as const] : []),
    ...(!lineage_record.complete || lineage_record.evidence_references.length === 0 ? ["INVESTIGATION_LINEAGE_INCOMPLETE" as const] : []),
    ...(!lineage_record.immutable ? ["EVIDENCE_REFERENCE_MUTATED" as const] : []),
    ...(!noOutOfScope ? ["REPLAY_EXECUTION_ATTEMPTED" as const] : []),
  ])]);
  const certification = nested({
    certification_id: "P4.9-REPLAY-AUDIT-FORENSICS-CERTIFICATION-001",
    outcome: outcome(derivedFailures),
    phase_ready: outcome(derivedFailures) === "PASS",
    replay_requests_governed: replay_request.authorization_reference.length > 0,
    application_replay_analysis_operational: replay_analysis_report.report_id.length > 0 && replay_analysis_report.deterministic && replay_analysis_report.uses_only_cci_replay_evidence,
    audit_interpretation_operational: audit_report.audit_report_id.length > 0 && audit_report.deterministic && audit_report.immutable_history_preserved,
    forensic_reconstruction_deterministic: forensic_finding.finding_id.length > 0 && investigation_timeline.deterministic_ordering && forensic_finding.confidence_level === "HIGH",
    cross_application_correlation_functional: correlation_map.valid,
    timeline_reconstruction_deterministic: investigation_timeline.deterministic_ordering && investigation_timeline.complete,
    reports_reproducible: investigation_report.reproducible_from_canonical_evidence,
    immutable_lineage_preserved: lineage_record.immutable && lineage_record.complete && lineage_record.evidence_references.length > 0,
    no_replay_execution_logic: !has(failures, "REPLAY_EXECUTION_ATTEMPTED") && !has(failures, "CCI_REPLAY_REPLACEMENT_ATTEMPTED"),
    no_evidence_mutation: !has(failures, "EVIDENCE_REFERENCE_MUTATED") && !has(failures, "AUDIT_HISTORY_MUTATION_ATTEMPTED"),
    no_out_of_scope_ownership: noOutOfScope,
    failures: derivedFailures,
  });
  const base: Omit<ApplicationReplayAuditForensicsResult, "replay_hash" | "integrity_hash"> = {
    phase_version: VERSION,
    phase_identifier: IDENTIFIER,
    governance_binding_ref: "application-governance-binding/v4.8",
    cci_replay_infrastructure_ref: "Program 2 - CCI Replay Infrastructure",
    cci_audit_ledger_ref: "Program 2 - CCI Audit Ledger",
    caf_behavioral_replay_ref: "Program 3 - CAF Behavioral Replay Evidence",
    replay_request,
    replay_analysis_report,
    audit_report,
    investigation_timeline,
    forensic_finding,
    correlation_map,
    investigation_report,
    lineage_record,
    certification,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateApplicationReplayAuditForensics(result?: ApplicationReplayAuditForensicsResult): ApplicationReplayForensicsValidation {
  if (!result) return nested({ valid: false, outcome: "FAIL" as const, replay_hash_valid: false, integrity_hash_valid: false, request_valid: false, analysis_valid: false, audit_valid: false, timeline_valid: false, forensic_valid: false, correlation_valid: false, report_valid: false, lineage_valid: false, certification_valid: false, failures: freezeArray(["CERTIFICATION_PRUNED" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash;
  const request_valid = verifyHashedRecord(result.replay_request) && result.replay_request.replay_request_id.length > 0 && result.replay_request.authorization_reference.length > 0;
  const analysis_valid = verifyHashedRecord(result.replay_analysis_report) && result.replay_analysis_report.report_id.length > 0 && result.replay_analysis_report.replay_session_reference.length > 0 && result.replay_analysis_report.deterministic && result.replay_analysis_report.uses_only_cci_replay_evidence;
  const audit_valid = verifyHashedRecord(result.audit_report) && result.audit_report.audit_report_id.length > 0 && result.audit_report.deterministic && result.audit_report.immutable_history_preserved;
  const timeline_valid = verifyHashedRecord(result.investigation_timeline) && result.investigation_timeline.deterministic_ordering && result.investigation_timeline.complete;
  const forensic_valid = verifyHashedRecord(result.forensic_finding) && result.forensic_finding.finding_id.length > 0 && result.forensic_finding.confidence_level === "HIGH" && result.forensic_finding.evidence_references.length > 0;
  const correlation_valid = verifyHashedRecord(result.correlation_map) && result.correlation_map.correlation_id.length > 0 && result.correlation_map.valid;
  const report_valid = verifyHashedRecord(result.investigation_report) && result.investigation_report.report_id.length > 0 && result.investigation_report.reproducible_from_canonical_evidence;
  const lineage_valid = verifyHashedRecord(result.lineage_record) && result.lineage_record.immutable && result.lineage_record.complete && result.lineage_record.evidence_references.length > 0 && result.lineage_record.replay_provenance_refs.length > 0;
  const certification_valid = verifyHashedRecord(result.certification) && result.certification.outcome === "PASS" && result.certification.phase_ready && result.certification.failures.length === 0;
  const valid = replay_hash_valid && integrity_hash_valid && request_valid && analysis_valid && audit_valid && timeline_valid && forensic_valid && correlation_valid && report_valid && lineage_valid && certification_valid;
  return nested({ valid, outcome: result.certification.outcome, replay_hash_valid, integrity_hash_valid, request_valid, analysis_valid, audit_valid, timeline_valid, forensic_valid, correlation_valid, report_valid, lineage_valid, certification_valid, failures: result.certification.failures });
}

export function replayApplicationReplayAuditForensics(result = runApplicationReplayAuditForensics()): boolean {
  const replayed = runApplicationReplayAuditForensics();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateApplicationReplayAuditForensics(result).valid;
}

export function getApplicationReplayAuditForensicsBundle(): ApplicationReplayForensicsBundle {
  const result = runApplicationReplayAuditForensics();
  return Object.freeze({
    doctrine: Object.freeze({
      version: VERSION,
      owns_replay_requests: true,
      owns_application_replay_analysis: true,
      owns_audit_interpretation: true,
      owns_forensic_interpretation: true,
      executes_replay_engines: false,
      replaces_cci_replay_services: false,
      replaces_caf_behavioral_replay: false,
      mutates_replay_evidence: false,
      alters_forensic_evidence: false,
      modifies_audit_history: false,
    }),
    result,
    validation: validateApplicationReplayAuditForensics(result),
  });
}

export const ApplicationReplayAuditForensicsService = Object.freeze({
  run: runApplicationReplayAuditForensics,
  validate: validateApplicationReplayAuditForensics,
  replay: replayApplicationReplayAuditForensics,
});
