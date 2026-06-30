import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { buildAutonomousHashChain, validateAutonomousHashChain } from "@/services/autonomous-hash-chain-engine";
import type { IntegrityState } from "@/types/integrity-contract";
import type { AutonomousHashChainExecution, AutonomousHashChainFailureReason, AutonomousHashChainScenario } from "@/types/autonomous-hash-chain-engine";
import type {
  TamperAlertSeverity,
  TamperCorruptionReport,
  TamperDetection,
  TamperDetectionCategory,
  TamperDetectionInput,
  TamperDetectionObservabilitySurface,
  TamperDetectionReason,
  TamperDetectionReport,
  TamperDetectionScenario,
  TamperDetectionState,
  TamperForensicEvidence,
  TamperGovernanceNotification,
  TamperHistoricalConsistency,
  TamperIntegrityAlert,
  TamperIntegrityObservation,
  TamperLineageAnalysis,
  TamperRepairRecommendation,
  TamperReplayVerificationReport,
} from "@/types/tamper-detection-engine";

const NOW = "2026-06-30T13:00:00.000Z";
const SCHEMA_VERSION = "tamper-detection-engine/v8H.3" as const;
const EXPECTED_NODE_COUNT = 9;

const REASON_STATE: Readonly<Record<TamperDetectionReason, TamperDetectionState>> = Object.freeze({
  INCONSISTENT_HASH: "CORRUPTED",
  DUPLICATE_HASH: "CORRUPTED",
  UNAUTHORIZED_MODIFICATION: "CORRUPTED",
  DELETED_RECORD: "CORRUPTED",
  INSERTED_RECORD: "CORRUPTED",
  REPLAY_ALTERATION: "CORRUPTED",
  REPLAY_OMISSION: "CORRUPTED",
  LINEAGE_CORRUPTION: "CORRUPTED",
  ORPHAN_RECORD: "CORRUPTED",
  MISSING_PARENT: "CORRUPTED",
  EXECUTION_DIVERGENCE: "INVALID",
  CHECKPOINT_INCONSISTENCY: "INVALID",
  ORDERING_MUTATION: "CORRUPTED",
  GOVERNANCE_REFERENCE_LOSS: "DEGRADED",
  CONSTITUTIONAL_REFERENCE_LOSS: "INVALID",
  CROSS_TENANT_LINKAGE: "CORRUPTED",
  MALFORMED_METADATA: "DEGRADED",
  HISTORICAL_INCONSISTENCY: "CORRUPTED",
  UNSUPPORTED_HASH_ALGORITHM: "DEGRADED",
});

const HASH_CHAIN_REASON_MAP: Readonly<Record<AutonomousHashChainFailureReason, TamperDetectionReason>> = Object.freeze({
  INVALID_HASH: "INCONSISTENT_HASH",
  BROKEN_PARENT_LINK: "HISTORICAL_INCONSISTENCY",
  MISSING_PARENT: "MISSING_PARENT",
  REPLAY_MISMATCH: "REPLAY_ALTERATION",
  NONDETERMINISTIC_ORDERING: "ORDERING_MUTATION",
  ORPHAN_NODE: "ORPHAN_RECORD",
  UNAUTHORIZED_CHAIN_MODIFICATION: "UNAUTHORIZED_MODIFICATION",
  CROSS_TENANT_LINKAGE: "CROSS_TENANT_LINKAGE",
  LINEAGE_CORRUPTION: "LINEAGE_CORRUPTION",
  GOVERNANCE_REFERENCE_LOSS: "GOVERNANCE_REFERENCE_LOSS",
  CONSTITUTIONAL_REFERENCE_LOSS: "CONSTITUTIONAL_REFERENCE_LOSS",
  DUPLICATE_HASH: "DUPLICATE_HASH",
  MISSING_CHAIN_NODE: "DELETED_RECORD",
  UNSUPPORTED_HASH_ALGORITHM: "UNSUPPORTED_HASH_ALGORITHM",
});

const SCENARIO_CHAIN: Partial<Record<TamperDetectionScenario, AutonomousHashChainScenario>> = Object.freeze({
  INCONSISTENT_HASH: "INVALID_HASH",
  DUPLICATE_HASH: "DUPLICATE_HASH",
  UNAUTHORIZED_MODIFICATION: "UNAUTHORIZED_CHAIN_MODIFICATION",
  DELETED_RECORD: "MISSING_CHAIN_NODE",
  REPLAY_ALTERATION: "REPLAY_MISMATCH",
  LINEAGE_CORRUPTION: "LINEAGE_CORRUPTION",
  ORPHAN_RECORD: "ORPHAN_NODE",
  MISSING_PARENT: "MISSING_PARENT",
  ORDERING_MUTATION: "NONDETERMINISTIC_ORDERING",
  GOVERNANCE_REFERENCE_LOSS: "GOVERNANCE_REFERENCE_LOSS",
  CONSTITUTIONAL_REFERENCE_LOSS: "CONSTITUTIONAL_REFERENCE_LOSS",
  CROSS_TENANT_LINKAGE: "CROSS_TENANT_LINKAGE",
  HISTORICAL_INCONSISTENCY: "BROKEN_PARENT_LINK",
  UNSUPPORTED_HASH_ALGORITHM: "UNSUPPORTED_HASH_ALGORITHM",
});

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function id(prefix: string, domain: string, value: unknown): string {
  return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`;
}

function detectionStateRank(state: TamperDetectionState): number {
  return state === "INVALID" ? 5 : state === "CORRUPTED" ? 4 : state === "DEGRADED" ? 3 : state === "WARNING" ? 2 : 1;
}

function integrityStateFromDetection(state: TamperDetectionState): IntegrityState {
  if (state === "INVALID" || state === "CORRUPTED") return "CORRUPTED";
  if (state === "DEGRADED" || state === "WARNING") return "DEGRADED";
  return "VALID";
}

function deriveDetectionState(detections: readonly TamperDetection[]): TamperDetectionState {
  return detections.reduce<TamperDetectionState>((state, detection) => detectionStateRank(detection.detection_state) > detectionStateRank(state) ? detection.detection_state : state, "CLEAN");
}

export function classifyTamperDetectionReason(reason: TamperDetectionReason): TamperDetectionState {
  return REASON_STATE[reason];
}

function categoryFor(reason: TamperDetectionReason): TamperDetectionCategory {
  if (["INCONSISTENT_HASH", "DUPLICATE_HASH", "UNSUPPORTED_HASH_ALGORITHM"].includes(reason)) return "HASH_INTEGRITY";
  if (["UNAUTHORIZED_MODIFICATION", "DELETED_RECORD", "INSERTED_RECORD", "MALFORMED_METADATA"].includes(reason)) return "ARTIFACT_INTEGRITY";
  if (["REPLAY_ALTERATION", "REPLAY_OMISSION"].includes(reason)) return "REPLAY_INTEGRITY";
  if (["LINEAGE_CORRUPTION", "ORPHAN_RECORD", "MISSING_PARENT"].includes(reason)) return "LINEAGE_INTEGRITY";
  if (["EXECUTION_DIVERGENCE", "CHECKPOINT_INCONSISTENCY", "ORDERING_MUTATION", "HISTORICAL_INCONSISTENCY"].includes(reason)) return "EXECUTION_INTEGRITY";
  return "GOVERNANCE_INTEGRITY";
}

function severityFor(state: TamperDetectionState, reason: TamperDetectionReason): TamperAlertSeverity {
  if (state === "INVALID" || ["CONSTITUTIONAL_REFERENCE_LOSS", "EXECUTION_DIVERGENCE", "CHECKPOINT_INCONSISTENCY"].includes(reason)) return "CRITICAL";
  if (state === "CORRUPTED") return "HIGH";
  if (state === "DEGRADED") return "MEDIUM";
  if (state === "WARNING") return "LOW";
  return "INFORMATION";
}

function scoreFor(state: TamperDetectionState): number {
  if (state === "INVALID") return 0;
  if (state === "CORRUPTED") return 0.15;
  if (state === "DEGRADED") return 0.72;
  if (state === "WARNING") return 0.88;
  return 1;
}

function directReason(scenario: TamperDetectionScenario): TamperDetectionReason | null {
  const map: Partial<Record<TamperDetectionScenario, TamperDetectionReason>> = {
    INSERTED_RECORD: "INSERTED_RECORD",
    REPLAY_OMISSION: "REPLAY_OMISSION",
    EXECUTION_DIVERGENCE: "EXECUTION_DIVERGENCE",
    CHECKPOINT_INCONSISTENCY: "CHECKPOINT_INCONSISTENCY",
    MALFORMED_METADATA: "MALFORMED_METADATA",
  };
  return map[scenario] ?? null;
}

function sourceChain(input: TamperDetectionInput): AutonomousHashChainExecution {
  return input.chain ?? buildAutonomousHashChain({ scenario: input.hash_chain_scenario ?? SCENARIO_CHAIN[input.scenario ?? "BASELINE"] });
}

function buildObservation(chain: AutonomousHashChainExecution): TamperIntegrityObservation {
  const source = {
    observation_id: id("TDO", "tamper-observation-id", { chain_id: chain.chain_id, terminal_hash: chain.terminal_hash }),
    monitor_id: "autonomous-tamper-monitor/v8H.3" as const,
    observed_at: NOW,
    chain_id: chain.chain_id,
    tenant_id: chain.tenant_id,
    observed_node_count: chain.nodes.length,
    expected_node_count: EXPECTED_NODE_COUNT,
    observed_genesis_hash: chain.genesis_hash,
    observed_terminal_hash: chain.terminal_hash,
    replay_chain_hash: chain.replay_evidence.replay_chain_hash,
    lineage_hash: chain.lineage_graph.lineage_hash,
    validation_state: validateAutonomousHashChain(chain).validation_state,
  };
  return Object.freeze({ ...source, observation_hash: hashValue("tamper-observation", source) });
}

function recommendationFor(reason: TamperDetectionReason): string {
  if (["EXECUTION_DIVERGENCE", "CHECKPOINT_INCONSISTENCY", "CONSTITUTIONAL_REFERENCE_LOSS"].includes(reason)) return "Fail closed, suspend certification, and require operator review.";
  if (["UNAUTHORIZED_MODIFICATION", "INCONSISTENT_HASH", "DUPLICATE_HASH", "DELETED_RECORD", "INSERTED_RECORD"].includes(reason)) return "Freeze affected chain segment and run forensic integrity verification.";
  if (["REPLAY_ALTERATION", "REPLAY_OMISSION"].includes(reason)) return "Reconstruct replay evidence from immutable checkpoints before certification.";
  if (["LINEAGE_CORRUPTION", "ORPHAN_RECORD", "MISSING_PARENT"].includes(reason)) return "Rebuild lineage graph and quarantine orphaned artifacts.";
  if (["GOVERNANCE_REFERENCE_LOSS", "UNSUPPORTED_HASH_ALGORITHM", "MALFORMED_METADATA"].includes(reason)) return "Escalate for governance review and schedule deterministic revalidation.";
  return "Notify governance and continue monitored recovery.";
}

function buildDetection(reason: TamperDetectionReason, chain: AutonomousHashChainExecution, observation: TamperIntegrityObservation, path: string, message: string): TamperDetection {
  const node = chain.nodes.find((candidate) => path.includes(String(candidate.sequence_number))) ?? chain.nodes[chain.nodes.length - 1] ?? chain.nodes[0];
  const state = classifyTamperDetectionReason(reason);
  const source = {
    tenant_id: chain.tenant_id,
    artifact_id: node?.artifact_id ?? chain.chain_id,
    artifact_type: node?.artifact_type ?? "CERTIFICATION_RECORD",
    detection_type: categoryFor(reason),
    detection_state: state,
    integrity_score: scoreFor(state),
    detected_issue: reason,
    affected_hash: node?.current_hash ?? chain.terminal_hash,
    affected_lineage: chain.lineage_graph.lineage_hash,
    replay_reference: node?.replay_reference ?? chain.source_integrity_contract.replay_reference,
    governance_reference: node?.governance_reference ?? chain.source_integrity_contract.governance_reference,
    constitutional_reference: node?.constitutional_reference ?? chain.source_integrity_contract.constitutional_reference,
    confidence: state === "DEGRADED" ? 0.82 : 0.97,
    recommended_action: recommendationFor(reason),
    timestamp: NOW,
    evidence_reference: observation.observation_hash,
    path,
    message,
  };
  return Object.freeze({ detection_id: id("TDD", "tamper-detection-id", { reason, path, evidence: observation.observation_hash }), ...source });
}

function detectionsFor(input: TamperDetectionInput, chain: AutonomousHashChainExecution, observation: TamperIntegrityObservation): readonly TamperDetection[] {
  const validation = validateAutonomousHashChain(chain);
  const fromChain = validation.failures.map((failure) => buildDetection(HASH_CHAIN_REASON_MAP[failure.reason], chain, observation, failure.path, failure.message));
  const direct = directReason(input.scenario ?? "BASELINE");
  const directDetections = direct ? [buildDetection(direct, chain, observation, "historical_consistency", `${direct} detected by autonomous tamper monitor.`,)] : [];
  return freezeArray([...fromChain, ...directDetections]);
}

function buildAlerts(detections: readonly TamperDetection[]): readonly TamperIntegrityAlert[] {
  return freezeArray(detections.map((detection) => {
    const severity = severityFor(detection.detection_state, detection.detected_issue);
    const source = {
      detection_id: detection.detection_id,
      severity,
      category: detection.detection_type,
      tenant_id: detection.tenant_id,
      artifact_id: detection.artifact_id,
      message: detection.detected_issue === "GOVERNANCE_REFERENCE_LOSS" ? "Governance integrity degraded." : "Autonomous integrity violation detected.",
      governance_notification_required: severity !== "INFORMATION" && severity !== "LOW",
      certification_suspended: severity === "CRITICAL" || severity === "HIGH",
      emitted_at: NOW,
    };
    return Object.freeze({ alert_id: id("TDA", "tamper-alert-id", source), ...source, evidence_hash: hashValue("tamper-alert", { source, detection }) });
  }));
}

function buildCorruptionReport(detections: readonly TamperDetection[]): TamperCorruptionReport {
  const state = deriveDetectionState(detections);
  const hasDetections = detections.length > 0;
  const reason: TamperDetectionReason | "NONE" = detections[0]?.detected_issue ?? "NONE";
  const source = {
    corruption_report_id: id("TCR", "tamper-corruption-report-id", { state, reason, count: detections.length }),
    detection_state: state,
    corruption_classification: reason,
    corruption_scope: !hasDetections ? "NONE" as const : detections.length === 1 ? "SINGLE_ARTIFACT" as const : detections.length < 4 ? "CHAIN_SEGMENT" as const : "FULL_CHAIN" as const,
    affected_artifacts: freezeArray(detections.map((detection) => detection.artifact_id)),
    recovery_recommendation: hasDetections ? recommendationFor(detections[0].detected_issue) : "Continue monitoring.",
  };
  return Object.freeze({ ...source, report_hash: hashValue("tamper-corruption-report", source) });
}

function buildReplayVerification(chain: AutonomousHashChainExecution, detections: readonly TamperDetection[]): TamperReplayVerificationReport {
  const replayIssues = detections.some((detection) => detection.detection_type === "REPLAY_INTEGRITY" || detection.detection_type === "EXECUTION_INTEGRITY");
  const source = {
    replay_reference: chain.source_integrity_contract.replay_reference,
    replay_reproducible: !replayIssues,
    replay_ordering_valid: !detections.some((detection) => detection.detected_issue === "ORDERING_MUTATION"),
    replay_evidence_valid: !detections.some((detection) => ["REPLAY_ALTERATION", "REPLAY_OMISSION"].includes(detection.detected_issue)),
    replay_chain_hash: chain.replay_evidence.replay_chain_hash,
  };
  return Object.freeze({ ...source, replay_verification_hash: hashValue("tamper-replay-verification", source) });
}

function buildLineageAnalysis(chain: AutonomousHashChainExecution, detections: readonly TamperDetection[]): TamperLineageAnalysis {
  const orphan_count = detections.filter((detection) => detection.detected_issue === "ORPHAN_RECORD").length;
  const missing_parent_count = detections.filter((detection) => detection.detected_issue === "MISSING_PARENT").length;
  return Object.freeze({
    lineage_reference: chain.source_integrity_contract.lineage_reference,
    lineage_continuous: !detections.some((detection) => detection.detection_type === "LINEAGE_INTEGRITY"),
    orphan_count,
    missing_parent_count,
    lineage_hash: chain.lineage_graph.lineage_hash,
  });
}

function buildHistoricalConsistency(chain: AutonomousHashChainExecution, detections: readonly TamperDetection[]): TamperHistoricalConsistency {
  const source = {
    chronology_valid: !detections.some((detection) => detection.detected_issue === "HISTORICAL_INCONSISTENCY"),
    lifecycle_ordering_valid: !detections.some((detection) => detection.detected_issue === "ORDERING_MUTATION"),
    governance_continuity_valid: !detections.some((detection) => detection.detection_type === "GOVERNANCE_INTEGRITY"),
    authority_continuity_valid: !detections.some((detection) => detection.detected_issue === "GOVERNANCE_REFERENCE_LOSS"),
    replay_continuity_valid: !detections.some((detection) => detection.detection_type === "REPLAY_INTEGRITY"),
    chain_id: chain.chain_id,
  };
  return Object.freeze({ ...source, consistency_hash: hashValue("tamper-historical-consistency", source) });
}

function buildRepairRecommendations(detections: readonly TamperDetection[]): readonly TamperRepairRecommendation[] {
  if (detections.length === 0) {
    const source = { reason: "NONE" as const, priority: "INFORMATION" as const, action: "Continue continuous monitoring.", operator_review_required: false };
    return freezeArray([{ recommendation_id: id("TDR", "tamper-recommendation-id", source), ...source, recommendation_hash: hashValue("tamper-recommendation", source) }]);
  }
  return freezeArray(detections.map((detection) => {
    const source = {
      reason: detection.detected_issue,
      priority: severityFor(detection.detection_state, detection.detected_issue),
      action: detection.recommended_action,
      operator_review_required: detection.detection_state !== "CLEAN",
    };
    return Object.freeze({ recommendation_id: id("TDR", "tamper-recommendation-id", { source, detection: detection.detection_id }), ...source, recommendation_hash: hashValue("tamper-recommendation", source) });
  }));
}

function buildGovernanceNotifications(chain: AutonomousHashChainExecution, detections: readonly TamperDetection[], alerts: readonly TamperIntegrityAlert[]): readonly TamperGovernanceNotification[] {
  const notifyAlerts = alerts.filter((alert) => alert.governance_notification_required);
  if (notifyAlerts.length === 0) return freezeArray([]);
  const topSeverity = notifyAlerts.some((alert) => alert.severity === "CRITICAL") ? "CRITICAL" as const : notifyAlerts.some((alert) => alert.severity === "HIGH") ? "HIGH" as const : "MEDIUM" as const;
  const source = {
    severity: topSeverity,
    tenant_id: chain.tenant_id,
    detection_ids: freezeArray(detections.map((detection) => detection.detection_id)),
    governance_reference: chain.source_integrity_contract.governance_reference,
    constitutional_reference: chain.source_integrity_contract.constitutional_reference,
    message: "Autonomous tamper detection generated governance-visible integrity evidence.",
  };
  return freezeArray([Object.freeze({ notification_id: id("TDN", "tamper-governance-notification-id", source), ...source, notification_hash: hashValue("tamper-governance-notification", source) })]);
}

function buildForensicEvidence(chain: AutonomousHashChainExecution, observation: TamperIntegrityObservation, detections: readonly TamperDetection[], alerts: readonly TamperIntegrityAlert[], replay: TamperReplayVerificationReport, history: TamperHistoricalConsistency): TamperForensicEvidence {
  const source = {
    evidence_id: id("TFE", "tamper-forensic-evidence-id", { chain: chain.chain_id, observation: observation.observation_hash }),
    chain_id: chain.chain_id,
    observation_hash: observation.observation_hash,
    detection_hashes: freezeArray(detections.map((detection) => hashValue("tamper-detection-evidence", detection))),
    alert_hashes: freezeArray(alerts.map((alert) => alert.evidence_hash)),
    replay_verification_hash: replay.replay_verification_hash,
    lineage_hash: chain.lineage_graph.lineage_hash,
    consistency_hash: history.consistency_hash,
  };
  return Object.freeze({ ...source, evidence_hash: hashValue("tamper-forensic-evidence", source) });
}

function monitoringState(state: TamperDetectionState) {
  if (state === "INVALID") return "INVALID" as const;
  if (state === "CORRUPTED") return "CORRUPTION_CONFIRMED" as const;
  if (state === "DEGRADED") return "DEGRADED" as const;
  if (state === "WARNING") return "WARNING" as const;
  return "MONITORING" as const;
}

export function runTamperDetection(input: TamperDetectionInput = {}): TamperDetectionReport {
  const chain = sourceChain(input);
  const observation = buildObservation(chain);
  const detections = detectionsFor(input, chain, observation);
  const detection_state = deriveDetectionState(detections);
  const alerts = buildAlerts(detections);
  const corruption_report = buildCorruptionReport(detections);
  const replay_verification = buildReplayVerification(chain, detections);
  const lineage_analysis = buildLineageAnalysis(chain, detections);
  const historical_consistency = buildHistoricalConsistency(chain, detections);
  const repair_recommendations = buildRepairRecommendations(detections);
  const governance_notifications = buildGovernanceNotifications(chain, detections, alerts);
  const forensic_evidence = buildForensicEvidence(chain, observation, detections, alerts, replay_verification, historical_consistency);
  const base = {
    phase_version: "8H.3" as const,
    schema_version: SCHEMA_VERSION,
    report_id: id("TDRP", "tamper-report-id", { chain: chain.chain_id, observation: observation.observation_hash, scenario: input.scenario ?? "BASELINE" }),
    monitoring_state: monitoringState(detection_state),
    detection_state,
    integrity_state: integrityStateFromDetection(detection_state),
    source_chain: chain,
    observation,
    detections,
    alerts,
    corruption_report,
    replay_verification,
    lineage_analysis,
    historical_consistency,
    repair_recommendations,
    governance_notifications,
    forensic_evidence,
    deterministic: true as const,
    certification_ready: detection_state === "CLEAN",
    advisory_only_notice: "The Tamper Detection Engine generates integrity evidence and does not grant autonomous execution authority.",
  };
  return Object.freeze({ ...base, report_hash: hashValue("tamper-detection-report", base) });
}

export function validateTamperDetectionReport(input: TamperDetectionInput | TamperDetectionReport = {}) {
  const report = "phase_version" in input ? input as TamperDetectionReport : runTamperDetection(input as TamperDetectionInput);
  return Object.freeze({
    report_id: report.report_id,
    validation_state: report.integrity_state,
    tamper_detected: report.detections.length > 0,
    alerts_emitted: report.alerts.length === report.detections.length,
    forensic_evidence_complete: Boolean(report.forensic_evidence.evidence_hash),
    governance_notified: report.governance_notifications.length > 0,
    certification_ready: report.certification_ready,
    report_hash: report.report_hash,
  });
}

export function buildTamperDetectionObservabilitySurface(input: TamperDetectionInput = {}): TamperDetectionObservabilitySurface {
  const report = runTamperDetection(input);
  return Object.freeze({
    report_id: report.report_id,
    chain_id: report.source_chain.chain_id,
    tenant_id: report.source_chain.tenant_id,
    detection_state: report.detection_state,
    integrity_state: report.integrity_state,
    alert_count: report.alerts.length,
    critical_alerts: report.alerts.filter((alert) => alert.severity === "CRITICAL").length,
    detections: freezeArray(report.detections.map((detection) => detection.detected_issue)),
    certification_ready: report.certification_ready,
    downstream_blocked: report.detection_state === "CORRUPTED" || report.detection_state === "INVALID",
    latest_observation_hash: report.observation.observation_hash,
    forensic_evidence_hash: report.forensic_evidence.evidence_hash,
  });
}

export function getTamperDetectionContract() {
  const report = runTamperDetection();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray([
        "continuous-autonomy-integrity-monitoring",
        "hash-integrity-scanning",
        "artifact-corruption-detection",
        "replay-alteration-detection",
        "lineage-integrity-reconstruction",
        "execution-divergence-detection",
        "governance-aware-alerting",
        "forensic-evidence-generation",
        "fail-closed-certification-response",
      ]),
      schema_version: SCHEMA_VERSION,
      detection_states: freezeArray(["CLEAN", "WARNING", "DEGRADED", "CORRUPTED", "INVALID"] as const),
      alert_severities: freezeArray(["INFORMATION", "LOW", "MEDIUM", "HIGH", "CRITICAL"] as const),
      failure_state_mapping: REASON_STATE,
    }),
    report,
    validation: validateTamperDetectionReport(report),
    observability: buildTamperDetectionObservabilitySurface(),
  });
}
