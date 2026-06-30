import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { runGovernanceIntegrityCertification } from "@/services/governance-integrity-certification";
import type { GovernanceIntegrityState } from "@/types/governance-integrity-contract";
import type { GovernanceIntegrityCertificationReport, GovernanceIntegrityCertificationScenario } from "@/types/governance-integrity-certification";
import type { GovernanceIntegrityVerificationScenario } from "@/types/governance-integrity-verification";
import type {
  GovernanceIntegrityHashDisplay,
  GovernanceIntegrityTamperAlert,
  GovernanceIntegrityTimelineEvent,
  GovernanceIntegrityTrend,
  GovernanceIntegrityTrustIndicators,
  GovernanceIntegrityVerificationDisplay,
  GovernanceIntegrityViewerAction,
  GovernanceIntegrityViewerInput,
  GovernanceIntegrityViewerObservabilitySurface,
  GovernanceIntegrityViewerView,
} from "@/types/governance-integrity-viewer";

const NOW = "2026-06-27T16:30:00.000Z";
const SCHEMA_VERSION = "governance-integrity-viewer/v7K.4" as const;
const VIEW_VERSION = "governance-integrity-view/v7K.4" as const;

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function unique(values: readonly string[]): readonly string[] {
  return freezeArray([...new Set(values.filter(Boolean))].sort());
}

function scenarioForState(state: GovernanceIntegrityState | undefined): GovernanceIntegrityCertificationScenario | undefined {
  if (state === "CORRUPTED") return "CONTENT_HASH_MISMATCH_UNDETECTED";
  return undefined;
}

function verificationScenarioForState(state: GovernanceIntegrityState | undefined): GovernanceIntegrityVerificationScenario | undefined {
  if (state === "DEGRADED") return "OPTIONAL_METADATA_UNAVAILABLE";
  if (state === "CORRUPTED") return "CONTENT_HASH_MISMATCH";
  return undefined;
}

function severityForState(state: GovernanceIntegrityState): GovernanceIntegrityTamperAlert["severity"] {
  if (state === "CORRUPTED") return "CRITICAL";
  if (state === "DEGRADED") return "MEDIUM";
  return "INFO";
}

function investigationForState(state: GovernanceIntegrityState): GovernanceIntegrityTamperAlert["investigation_status"] {
  if (state === "CORRUPTED") return "BLOCKED";
  if (state === "DEGRADED") return "OPEN";
  return "NOT_REQUIRED";
}

function resolutionForState(state: GovernanceIntegrityState): GovernanceIntegrityTamperAlert["resolution_status"] {
  if (state === "CORRUPTED") return "REQUIRES_RECOVERY";
  if (state === "DEGRADED") return "PENDING";
  return "CLEAR";
}

function hashDisplays(report: GovernanceIntegrityCertificationReport): readonly GovernanceIntegrityHashDisplay[] {
  return freezeArray(report.verification_report.source_chain.records.map((record) => {
    const source = {
      hash_id: `GIH-7K4-${hashValue("governance-integrity-viewer-hash-id", record.record_id).slice(0, 10).toUpperCase()}`,
      record_id: record.record_id,
      governance_object_id: record.governance_object_id,
      governance_object_type: record.governance_object_type,
      chain_position: record.chain_position,
      current_hash: record.current_hash,
      previous_hash: record.previous_hash,
      root_hash: record.root_hash,
      replay_hash: record.replay_hash,
      evidence_hash: record.canonical.canonical_hash,
      hash_algorithm: record.hash_generation.hash_algorithm,
      verification_status: record.verification_status,
    };
    return Object.freeze({ ...source, display_hash: hashValue("governance-integrity-viewer-hash-display", source) });
  }).sort((a, b) => a.chain_position - b.chain_position || a.record_id.localeCompare(b.record_id)));
}

function verificationDisplays(report: GovernanceIntegrityCertificationReport): readonly GovernanceIntegrityVerificationDisplay[] {
  return freezeArray(report.verification_report.verification_results.map((result) => Object.freeze({
    verification_id: report.verification_report.verification_id,
    module: result.module,
    state: result.state,
    passed: result.passed,
    failure: result.failure,
    message: result.message,
    evidence_refs: result.evidence_refs,
    result_hash: result.result_hash,
  })).sort((a, b) => a.module.localeCompare(b.module)));
}

function tamperAlerts(report: GovernanceIntegrityCertificationReport): readonly GovernanceIntegrityTamperAlert[] {
  const violations = report.verification_report.tamper_report.violations;
  if (violations.length === 0) {
    const source = {
      alert_id: `GITA-7K4-${hashValue("governance-integrity-viewer-clear-alert-id", report.certification_id).slice(0, 10).toUpperCase()}`,
      detection_timestamp: report.verification_report.tamper_report.observation.observed_at,
      affected_records: freezeArray([report.verification_report.verified_governance_object]),
      severity: "INFO" as const,
      violation_type: "NONE" as const,
      reason: "NONE" as const,
      investigation_status: "NOT_REQUIRED" as const,
      resolution_status: "CLEAR" as const,
      supporting_evidence: freezeArray([report.verification_report.tamper_report.observation.observation_hash]),
    };
    return freezeArray([Object.freeze({ ...source, alert_hash: hashValue("governance-integrity-viewer-tamper-alert", source) })]);
  }
  return freezeArray(violations.map((violation) => {
    const source = {
      alert_id: `GITA-7K4-${hashValue("governance-integrity-viewer-alert-id", violation.violation_id).slice(0, 10).toUpperCase()}`,
      detection_timestamp: violation.detected_at,
      affected_records: freezeArray([report.verification_report.verified_governance_object, violation.path]),
      severity: severityForState(violation.integrity_state),
      violation_type: violation.violation_type,
      reason: violation.reason,
      investigation_status: investigationForState(violation.integrity_state),
      resolution_status: resolutionForState(violation.integrity_state),
      supporting_evidence: violation.evidence_hashes,
    };
    return Object.freeze({ ...source, alert_hash: hashValue("governance-integrity-viewer-tamper-alert", source) });
  }).sort((a, b) => a.severity.localeCompare(b.severity) || a.alert_id.localeCompare(b.alert_id)));
}

function corruptionIndicators(report: GovernanceIntegrityCertificationReport): readonly string[] {
  return unique([
    ...report.verification_report.failure_details,
    ...report.verification_report.source_chain.validation.failures.map((failure) => failure.reason),
    ...report.detected_findings,
  ]);
}

function timeline(report: GovernanceIntegrityCertificationReport): readonly GovernanceIntegrityTimelineEvent[] {
  const chain = report.verification_report.source_chain;
  const tamper = report.verification_report.tamper_report;
  const base = [
    {
      event_type: "INTEGRITY_INITIALIZATION" as const,
      timestamp: chain.records[0]?.verification_timestamp ?? report.verification_report.verification_timestamp,
      summary: `Integrity chain ${chain.chain_id} initialized for governance records.`,
      evidence_refs: [chain.chain_execution_hash],
    },
    {
      event_type: "HASH_GENERATION" as const,
      timestamp: chain.records.at(-1)?.hash_generation.hash_timestamp ?? report.verification_report.verification_timestamp,
      summary: `${chain.records.length} governance hashes rendered with ${chain.hash_algorithm}.`,
      evidence_refs: chain.records.map((record) => record.current_hash),
    },
    {
      event_type: "VERIFICATION_EXECUTION" as const,
      timestamp: report.verification_report.verification_timestamp,
      summary: `${report.verification_report.verification_results.length} integrity verification modules evaluated.`,
      evidence_refs: report.verification_report.verification_results.map((result) => result.result_hash),
    },
    {
      event_type: "TAMPER_DETECTION" as const,
      timestamp: tamper.observation.observed_at,
      summary: `${tamper.violations.length} tamper alerts rendered from certified detection output.`,
      evidence_refs: [tamper.report_hash, tamper.observation.observation_hash],
    },
    {
      event_type: report.integrity_state === "VALID" ? "RECOVERY_VERIFICATION" as const : "INTEGRITY_DEGRADATION" as const,
      timestamp: report.verification_report.truth_ledger_record.recorded_at,
      summary: `Integrity state classified as ${report.integrity_state}.`,
      evidence_refs: [report.verification_report.truth_ledger_record.evidence_hash],
    },
    {
      event_type: "CERTIFICATION_VALIDATION" as const,
      timestamp: report.certification_timestamp,
      summary: `Certification completed with ${report.certification_state}.`,
      evidence_refs: [report.report_hash, report.certification_signature],
    },
  ];
  return freezeArray(base.map((event, index) => {
    const source = {
      event_id: `GITE-7K4-${String(index + 1).padStart(2, "0")}`,
      timestamp: event.timestamp,
      event_type: event.event_type,
      integrity_state: report.integrity_state,
      summary: event.summary,
      evidence_refs: unique(event.evidence_refs),
    };
    return Object.freeze({ ...source, event_hash: hashValue("governance-integrity-viewer-timeline-event", source) });
  }));
}

function trustIndicators(report: GovernanceIntegrityCertificationReport): GovernanceIntegrityTrustIndicators {
  const passed = report.certification_tests.filter((test) => test.passed).length;
  const testRate = passed / report.certification_tests.length;
  const verificationRate = report.verification_report.verification_results.filter((result) => result.passed).length / report.verification_report.verification_results.length;
  const hashConfidence = report.verification_report.source_chain.validation.valid ? 0.99 : report.integrity_state === "DEGRADED" ? 0.7 : 0.2;
  const certificationConfidence = report.certification_state === "PASS" ? 0.99 : report.certification_state === "CONDITIONAL_PASS" ? 0.72 : 0.1;
  const overall = Number(((testRate + verificationRate + hashConfidence + certificationConfidence) / 4).toFixed(4));
  const source = {
    overall_trust_score: overall,
    integrity_confidence: report.integrity_state === "VALID" ? 0.99 : report.integrity_state === "DEGRADED" ? 0.68 : 0.08,
    verification_confidence: Number(verificationRate.toFixed(4)),
    hash_confidence: hashConfidence,
    replay_confidence: report.verification_report.source_chain.validation.replay_valid ? 0.98 : 0.15,
    evidence_confidence: report.certification_evidence.evidence_hash ? 0.97 : 0.25,
    certification_confidence: certificationConfidence,
    governance_trust_level: report.certification_state === "PASS" ? "TRUSTED" as const : report.certification_state === "CONDITIONAL_PASS" ? "WATCH" as const : "BLOCKED" as const,
  };
  return Object.freeze({ ...source, trust_hash: hashValue("governance-integrity-viewer-trust", source) });
}

function trends(report: GovernanceIntegrityCertificationReport): GovernanceIntegrityTrend {
  const verificationSuccess = report.verification_report.verification_results.filter((result) => result.passed).length / report.verification_report.verification_results.length;
  const source = {
    trend_id: `GITR-7K4-${hashValue("governance-integrity-viewer-trend-id", report.certification_id).slice(0, 10).toUpperCase()}`,
    verification_success_rate: Number(verificationSuccess.toFixed(4)),
    tamper_frequency: report.verification_report.tamper_report.violations.length,
    degradation_events: report.integrity_state === "DEGRADED" ? 1 : 0,
    recovery_events: report.integrity_state === "VALID" ? 1 : 0,
    replay_consistency: report.verification_report.source_chain.validation.replay_valid ? 1 : 0,
    hash_validation_success: report.verification_report.source_chain.validation.valid ? 1 : 0,
    certification_stability: report.certification_state === "PASS" ? 1 : report.certification_state === "CONDITIONAL_PASS" ? 0.65 : 0,
  };
  return Object.freeze({ ...source, trend_hash: hashValue("governance-integrity-viewer-trend", source) });
}

export function buildGovernanceIntegrityViewerView(input: GovernanceIntegrityViewerInput = {}): GovernanceIntegrityViewerView {
  const report = runGovernanceIntegrityCertification({
    scenario: scenarioForState(input.state),
    verification_scenario: verificationScenarioForState(input.state),
    tenant_id: input.tenant_id,
    mission_id: input.mission_id,
    created_by: input.operator_id,
  });
  const chain = report.verification_report.source_chain;
  const tenant_id = input.tenant_id ?? report.verification_report.tenant_id;
  const mission_id = input.mission_id ?? report.verification_report.mission_id;
  const operator_id = input.operator_id ?? "operator_console";
  const hashes = hashDisplays(report);
  const verification_results = verificationDisplays(report);
  const tamper_alerts = tamperAlerts(report);
  const source = {
    viewer_id: `GIVW-7K4-${hashValue("governance-integrity-viewer-id", { tenant_id, mission_id, state: report.integrity_state }).slice(0, 10).toUpperCase()}`,
    schema_version: SCHEMA_VERSION,
    tenant_id,
    mission_id,
    operator_id,
    integrity_state: report.integrity_state,
    certification_state: report.certification_state,
    viewer_version: VIEW_VERSION,
    generated_at: NOW,
    read_only: true as const,
    advisory_only: true as const,
    hash_repair_allowed: false as const,
    verification_mutation_allowed: false as const,
    hash_recalculation_allowed: false as const,
    mutation_allowed: false as const,
    tenant_isolated: true,
    authorization_enforced: true,
    chain_id: chain.chain_id,
    chain_version: chain.chain_version,
    chain_continuity: chain.validation.previous_hashes_valid && chain.validation.ordering_valid,
    chain_completeness: chain.validation.chain_complete,
    protected_record_count: chain.records.length,
    verification_id: report.verification_report.verification_id,
    certification_id: report.certification_id,
    truth_ledger_certification_reference: report.truth_ledger_certification_reference,
    hashes,
    verification_results,
    tamper_alerts,
    corruption_indicators: corruptionIndicators(report),
    timeline: timeline(report),
    trust_indicators: trustIndicators(report),
    trends: trends(report),
    certification_history: freezeArray([Object.freeze({
      certification_id: report.certification_id,
      certification_state: report.certification_state,
      certification_date: report.certification_timestamp,
      validation_scope: report.verification_report.verification_scope,
      outstanding_issues: report.detected_findings,
      report_hash: report.report_hash,
    })]),
    evidence_refs: unique([report.certification_evidence.evidence_hash, ...report.verification_report.supporting_evidence]),
    replay_refs: report.certification_evidence.replay_references,
    lineage_refs: report.certification_evidence.lineage_references,
  };
  return Object.freeze({ ...source, viewer_hash: hashValue("governance-integrity-viewer", source) });
}

export function buildGovernanceIntegrityViewerObservabilitySurface(input: GovernanceIntegrityViewerInput = {}): GovernanceIntegrityViewerObservabilitySurface {
  const view = buildGovernanceIntegrityViewerView(input);
  return Object.freeze({
    viewer_id: view.viewer_id,
    integrity_state: view.integrity_state,
    certification_state: view.certification_state,
    protected_record_count: view.protected_record_count,
    tamper_alert_count: view.tamper_alerts.length,
    corruption_indicator_count: view.corruption_indicators.length,
    read_only: true,
    viewer_hash: view.viewer_hash,
  });
}

export function assertGovernanceIntegrityViewerActionBlocked(action: GovernanceIntegrityViewerAction): never {
  throw new Error(`Governance Integrity Viewer is read-only; ${action} is not permitted.`);
}

export function getGovernanceIntegrityViewerContract() {
  const view = buildGovernanceIntegrityViewerView();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray(["read-only", "advisory-only", "deterministic", "immutable", "replay-aware", "explainable", "audit-ready", "tenant-isolated", "constitution-protected", "cryptographically-verifiable"]),
      schema_version: SCHEMA_VERSION,
      states: freezeArray(["VALID", "DEGRADED", "CORRUPTED"] as const),
      certification_states: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const),
      severity_levels: freezeArray(["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"] as const),
      prohibited_actions: freezeArray(["REPAIR_INTEGRITY", "MODIFY_HASH", "RECALCULATE_HASH", "MODIFY_VERIFICATION", "ALTER_HISTORY", "OVERRIDE_GOVERNANCE"] as const),
    }),
    view,
    observability: buildGovernanceIntegrityViewerObservabilitySurface(),
  });
}
