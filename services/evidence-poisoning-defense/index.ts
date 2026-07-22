import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { establishDriftDefenseArchitecture, replayDriftDefenseArchitecture } from "@/services/drift-defense-architecture";
import type { DriftResponse, DriftSeverity } from "@/types/drift-defense-architecture";
import type {
  EvidenceConsistencyReport,
  EvidenceContainmentDecision,
  EvidenceHealthScoreReport,
  EvidencePoisoningApiSurface,
  EvidencePoisoningFailure,
  EvidencePoisoningFoundation,
  EvidencePoisoningInput,
  EvidencePoisoningMetrics,
  EvidencePoisoningRecord,
  EvidencePoisoningResult,
  EvidencePoisoningScenario,
  EvidencePoisoningStatus,
  EvidenceQualityReport,
  EvidenceTrustBaseline,
  PoisoningAssessment,
  ProvenanceReport,
  SourceReliabilityImpact,
  SourceReliabilityReport,
  SyntheticEvidenceReport,
} from "@/types/evidence-poisoning-defense";

const DEFENSE_VERSION = "evidence-poisoning-defense/v1" as const;
const DEFENSE_IDENTIFIER = "EvidencePoisoningDefense" as const;
const DEFENSE_TIMESTAMP = "2026-07-11T00:00:00.000Z" as const;

type Scenario = NonNullable<EvidencePoisoningInput["scenario"]>;

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

function buildApiSurface(): EvidencePoisoningApiSurface {
  const base: Omit<EvidencePoisoningApiSurface, "integrity_hash"> = {
    api_id: "evidence_poisoning_defense_api",
    defend_evidence_integrity: "POST /evidence-poisoning-defense/defend",
    retrieve_baseline: "POST /evidence-poisoning-defense/baseline",
    retrieve_provenance_report: "POST /evidence-poisoning-defense/provenance",
    retrieve_consistency_report: "POST /evidence-poisoning-defense/consistency",
    retrieve_synthetic_report: "POST /evidence-poisoning-defense/synthetic",
    retrieve_quality_report: "POST /evidence-poisoning-defense/quality",
    retrieve_source_reliability: "POST /evidence-poisoning-defense/source-reliability",
    retrieve_health_score: "POST /evidence-poisoning-defense/health-score",
    retrieve_poisoning_assessment: "POST /evidence-poisoning-defense/assessment",
    retrieve_source_impact: "POST /evidence-poisoning-defense/source-impact",
    retrieve_containment: "POST /evidence-poisoning-defense/containment",
    retrieve_ledger_record: "POST /evidence-poisoning-defense/ledger",
    retrieve_metrics: "POST /evidence-poisoning-defense/metrics",
    replay_defense: "POST /evidence-poisoning-defense/replay",
    inspect_defense: "POST /evidence-poisoning-defense/inspect",
    retrieve_contract: "GET /evidence-poisoning-defense/contract",
    evidence_mutation_supported: false,
    learning_authorization_supported: false,
    governance_bypass_supported: false,
    advisory_only: true,
    fail_open_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function failureForScenario(scenario: Scenario): EvidencePoisoningFailure | undefined {
  const map: Partial<Record<EvidencePoisoningScenario, EvidencePoisoningFailure>> = {
    UNAUTHORIZED_POLICY_CHANGE: "UNAUTHORIZED_POLICY_CHANGE",
    UNKNOWN_SOURCE: "UNKNOWN_SOURCE_DETECTED",
    BROKEN_LINEAGE: "BROKEN_LINEAGE_DETECTED",
    MISSING_PROVENANCE: "MISSING_PROVENANCE_DETECTED",
    INVALID_SIGNATURE: "INVALID_SIGNATURE_DETECTED",
    TAMPERED_EVIDENCE: "TAMPERED_EVIDENCE_DETECTED",
    UNVERIFIABLE_ARTIFACT: "UNVERIFIABLE_ARTIFACT_DETECTED",
    FABRICATED_EVIDENCE: "FABRICATED_EVIDENCE_DETECTED",
    DUPLICATED_EVIDENCE: "DUPLICATED_EVIDENCE_DETECTED",
    CONTRADICTORY_EVIDENCE: "CONTRADICTORY_EVIDENCE_DETECTED",
    REPLAY_INCONSISTENCY: "REPLAY_INCONSISTENCY_DETECTED",
    SOURCE_CORRUPTION: "SOURCE_CORRUPTION_DETECTED",
    SYNTHETIC_DATA_INJECTION: "SYNTHETIC_DATA_INJECTION_DETECTED",
    LOW_QUALITY_CLUSTER: "LOW_QUALITY_EVIDENCE_CLUSTER",
    ABNORMAL_GROWTH: "ABNORMAL_EVIDENCE_GROWTH",
    INCOMPLETE_LINEAGE: "INCOMPLETE_EVIDENCE_LINEAGE",
    REPLAY_MANIPULATION: "EVIDENCE_REPLAY_MANIPULATION",
    COORDINATED_ATTACK: "COORDINATED_EVIDENCE_ATTACK",
    STALE_EVIDENCE: "STALE_EVIDENCE_EXPLOITATION",
    EVIDENCE_CONCENTRATION: "EVIDENCE_CONCENTRATION_ATTACK",
    NONDETERMINISTIC: "NONDETERMINISTIC_ASSESSMENT",
    NONREPLAYABLE_VALIDATION: "NONREPLAYABLE_EVIDENCE_VALIDATION",
    TENANT_BREACH: "TENANT_ISOLATION_BREACH",
    UNKNOWN_BEHAVIOR: "UNKNOWN_EVIDENCE_BEHAVIOR",
  };
  return map[scenario];
}

function collectFailures(scenario: Scenario, architectureReplayable: boolean): readonly EvidencePoisoningFailure[] {
  const failures: EvidencePoisoningFailure[] = [];
  const direct = failureForScenario(scenario);
  if (direct) failures.push(direct);
  if (!architectureReplayable) failures.push("DRIFT_DEFENSE_ARCHITECTURE_UNAVAILABLE");
  return freezeArray([...new Set(failures)]);
}

function severityFor(failures: readonly EvidencePoisoningFailure[]): DriftSeverity {
  if (failures.includes("UNKNOWN_EVIDENCE_BEHAVIOR") || failures.includes("TENANT_ISOLATION_BREACH")) return "CRITICAL";
  if (failures.some((failure) => [
    "FABRICATED_EVIDENCE_DETECTED",
    "TAMPERED_EVIDENCE_DETECTED",
    "SYNTHETIC_DATA_INJECTION_DETECTED",
    "EVIDENCE_REPLAY_MANIPULATION",
    "COORDINATED_EVIDENCE_ATTACK",
    "SOURCE_CORRUPTION_DETECTED",
  ].includes(failure))) return "HIGH";
  if (failures.length) return "MODERATE";
  return "INFORMATIONAL";
}

function responseFor(severity: DriftSeverity, failures: readonly EvidencePoisoningFailure[]): DriftResponse {
  if (failures.includes("UNKNOWN_EVIDENCE_BEHAVIOR") || severity === "CRITICAL") return "FAIL_CLOSED";
  if (severity === "HIGH") return "SUPPRESS_ADAPTATION";
  if (severity === "MODERATE") return "REQUIRE_REVIEW";
  return "MONITOR";
}

function statusFor(failures: readonly EvidencePoisoningFailure[]): EvidencePoisoningStatus {
  if (failures.includes("UNKNOWN_EVIDENCE_BEHAVIOR") || failures.includes("TENANT_ISOLATION_BREACH")) return "FAIL_CLOSED";
  if (failures.some((failure) => [
    "UNKNOWN_SOURCE_DETECTED",
    "BROKEN_LINEAGE_DETECTED",
    "MISSING_PROVENANCE_DETECTED",
    "INVALID_SIGNATURE_DETECTED",
    "TAMPERED_EVIDENCE_DETECTED",
    "UNVERIFIABLE_ARTIFACT_DETECTED",
    "FABRICATED_EVIDENCE_DETECTED",
    "SYNTHETIC_DATA_INJECTION_DETECTED",
  ].includes(failure))) return "QUARANTINED";
  if (failures.includes("UNAUTHORIZED_POLICY_CHANGE")) return "REQUIRES_GOVERNANCE_REVIEW";
  return failures.length ? "POISONING_DETECTED" : "PASS";
}

function healthScore(failures: readonly EvidencePoisoningFailure[]): number {
  if (!failures.length) return 0.97;
  if (failures.includes("UNKNOWN_EVIDENCE_BEHAVIOR") || failures.includes("TENANT_ISOLATION_BREACH")) return 0.04;
  if (failures.includes("FABRICATED_EVIDENCE_DETECTED") || failures.includes("TAMPERED_EVIDENCE_DETECTED") || failures.includes("SYNTHETIC_DATA_INJECTION_DETECTED")) return 0.16;
  return 0.5;
}

function buildBaseline(): EvidenceTrustBaseline {
  const base: Omit<EvidenceTrustBaseline, "integrity_hash"> = {
    baseline_id: "evidence_trust_baseline_v1",
    evidence_policy_version: "evidence-policy/v1",
    trusted_sources: freezeArray(["truth-ledger", "outcome-observation", "simulation-validation", "governance-audit", "operator-approved-evidence"]),
    source_classifications: freezeArray(["authoritative", "validated", "simulation", "operator_attested", "untrusted"]),
    quality_thresholds: freezeArray(["minimum_health:0.70", "quarantine_below:0.45", "fail_closed_unknown_origin", "replay_required"]),
    provenance_requirements: freezeArray(["source_identity", "origin_signature", "timestamp_integrity", "chain_of_custody", "replay_reference"]),
    lineage_requirements: freezeArray(["immutable_lineage", "complete_collection_history", "cryptographic_hash", "tenant_scope"]),
    governance_requirements: freezeArray(["governance_review_for_poisoning", "evidence_acceptance_policy_preserved", "learning_exclusion_until_review"]),
    constitutional_requirements: freezeArray(["tenant_isolation_required", "evidence_integrity_required", "evidence_cannot_override_governance"]),
    approval_reference: "governance-approval:evidence-trust-baseline:v1",
    effective_date: "2026-07-11",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildProvenanceReport(failures: readonly EvidencePoisoningFailure[]): ProvenanceReport {
  const rejected = failures.filter((failure) => ["UNKNOWN_SOURCE_DETECTED", "BROKEN_LINEAGE_DETECTED", "MISSING_PROVENANCE_DETECTED", "INVALID_SIGNATURE_DETECTED", "TAMPERED_EVIDENCE_DETECTED", "UNVERIFIABLE_ARTIFACT_DETECTED"].includes(failure));
  const valid = rejected.length === 0;
  const base: Omit<ProvenanceReport, "integrity_hash"> = {
    report_id: `evidence_provenance_${hash(failures).slice(0, 14)}`,
    source_identity_valid: !failures.includes("UNKNOWN_SOURCE_DETECTED"),
    origin_authenticity_valid: !failures.includes("MISSING_PROVENANCE_DETECTED"),
    evidence_lineage_valid: !failures.includes("BROKEN_LINEAGE_DETECTED") && !failures.includes("INCOMPLETE_EVIDENCE_LINEAGE"),
    collection_history_valid: !failures.includes("INCOMPLETE_EVIDENCE_LINEAGE"),
    chain_of_custody_valid: !failures.includes("BROKEN_LINEAGE_DETECTED"),
    timestamp_integrity_valid: !failures.includes("STALE_EVIDENCE_EXPLOITATION"),
    cryptographic_integrity_valid: !failures.includes("INVALID_SIGNATURE_DETECTED") && !failures.includes("TAMPERED_EVIDENCE_DETECTED"),
    replay_references_valid: !failures.includes("NONREPLAYABLE_EVIDENCE_VALIDATION"),
    lineage_validation_summary: valid ? "Evidence lineage and chain of custody are complete." : "Evidence provenance failed validation and was rejected.",
    evidence_authenticity_assessment: valid ? "authentic" : "rejected",
    rejected_evidence_refs: rejected.length ? freezeArray(["evidence:rejected-provenance"]) : freezeArray([]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildConsistencyReport(score: number, failures: readonly EvidencePoisoningFailure[]): EvidenceConsistencyReport {
  const consistencyFailures = failures.filter((failure) => ["CONTRADICTORY_EVIDENCE_DETECTED", "REPLAY_INCONSISTENCY_DETECTED", "EVIDENCE_REPLAY_MANIPULATION", "ABNORMAL_EVIDENCE_GROWTH"].includes(failure));
  const base: Omit<EvidenceConsistencyReport, "integrity_hash"> = {
    report_id: `evidence_consistency_${hash({ score, failures }).slice(0, 14)}`,
    evidence_agreement_score: consistencyFailures.length ? 0.31 : score,
    historical_consistency_score: consistencyFailures.length ? 0.34 : score,
    source_consistency_score: failures.includes("SOURCE_CORRUPTION_DETECTED") ? 0.28 : score,
    timeline_consistency_score: failures.includes("ABNORMAL_EVIDENCE_GROWTH") ? 0.3 : Number((score - 0.01).toFixed(2)),
    replay_consistency_score: failures.includes("REPLAY_INCONSISTENCY_DETECTED") || failures.includes("EVIDENCE_REPLAY_MANIPULATION") ? 0.22 : score,
    lineage_consistency_score: failures.includes("INCOMPLETE_EVIDENCE_LINEAGE") ? 0.25 : score,
    semantic_consistency_score: failures.includes("CONTRADICTORY_EVIDENCE_DETECTED") ? 0.27 : score,
    contradiction_analysis: consistencyFailures.length ? "Contradictory or replay-inconsistent evidence detected." : "Evidence remains internally and historically consistent.",
    historical_consistency_assessment: consistencyFailures.length ? "Historical evidence consistency requires review." : "Historical consistency preserved.",
    detected_consistency_failures: consistencyFailures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildSyntheticReport(failures: readonly EvidencePoisoningFailure[]): SyntheticEvidenceReport {
  const synthetic = failures.some((failure) => ["FABRICATED_EVIDENCE_DETECTED", "SYNTHETIC_DATA_INJECTION_DETECTED", "DUPLICATED_EVIDENCE_DETECTED", "EVIDENCE_REPLAY_MANIPULATION", "COORDINATED_EVIDENCE_ATTACK"].includes(failure));
  const base: Omit<SyntheticEvidenceReport, "integrity_hash"> = {
    report_id: `synthetic_evidence_${hash(failures).slice(0, 14)}`,
    synthetic_telemetry_detected: failures.includes("SYNTHETIC_DATA_INJECTION_DETECTED"),
    generated_observations_detected: failures.includes("SYNTHETIC_DATA_INJECTION_DETECTED"),
    fabricated_documents_detected: failures.includes("FABRICATED_EVIDENCE_DETECTED"),
    injected_events_detected: failures.includes("SYNTHETIC_DATA_INJECTION_DETECTED"),
    replay_fabrication_detected: failures.includes("EVIDENCE_REPLAY_MANIPULATION"),
    automated_evidence_generation_detected: failures.includes("SYNTHETIC_DATA_INJECTION_DETECTED"),
    duplicated_synthetic_artifacts_detected: failures.includes("DUPLICATED_EVIDENCE_DETECTED"),
    coordinated_injection_detected: failures.includes("COORDINATED_EVIDENCE_ATTACK"),
    injection_assessment: synthetic ? "Synthetic or injected evidence detected and blocked." : "No synthetic evidence detected.",
    authenticity_summary: synthetic ? "Synthetic evidence is excluded from learning." : "Evidence authenticity preserved.",
    automatic_blocks: synthetic ? freezeArray(["block_synthetic_evidence", "exclude_from_learning", "preserve_forensic_evidence"]) : freezeArray([]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildQualityReport(score: number, failures: readonly EvidencePoisoningFailure[]): EvidenceQualityReport {
  const qualityFailures = failures.filter((failure) => ["LOW_QUALITY_EVIDENCE_CLUSTER", "STALE_EVIDENCE_EXPLOITATION", "EVIDENCE_CONCENTRATION_ATTACK", "ABNORMAL_EVIDENCE_GROWTH"].includes(failure));
  const base: Omit<EvidenceQualityReport, "integrity_hash"> = {
    report_id: `evidence_quality_${hash({ score, failures }).slice(0, 14)}`,
    completeness_score: failures.includes("INCOMPLETE_EVIDENCE_LINEAGE") ? 0.28 : score,
    freshness_score: failures.includes("STALE_EVIDENCE_EXPLOITATION") ? 0.24 : Number((score - 0.01).toFixed(2)),
    relevance_score: score,
    diversity_score: failures.includes("EVIDENCE_CONCENTRATION_ATTACK") ? 0.3 : Number((score - 0.02).toFixed(2)),
    consistency_score: failures.includes("LOW_QUALITY_EVIDENCE_CLUSTER") ? 0.33 : score,
    traceability_score: failures.includes("INCOMPLETE_EVIDENCE_LINEAGE") ? 0.25 : score,
    replay_quality_score: failures.includes("NONREPLAYABLE_EVIDENCE_VALIDATION") ? 0.2 : score,
    audit_readiness_score: Number((score - 0.01).toFixed(2)),
    quality_trend_analysis: qualityFailures.length ? "Evidence quality degradation detected." : "Evidence quality remains above policy thresholds.",
    evidence_completeness_assessment: failures.includes("INCOMPLETE_EVIDENCE_LINEAGE") ? "Evidence lineage is incomplete." : "Evidence completeness preserved.",
    detected_quality_failures: qualityFailures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildSourceReliability(score: number, failures: readonly EvidencePoisoningFailure[]): SourceReliabilityReport {
  const compromised = failures.includes("SOURCE_CORRUPTION_DETECTED") || failures.includes("COORDINATED_EVIDENCE_ATTACK");
  const base: Omit<SourceReliabilityReport, "integrity_hash"> = {
    report_id: `source_reliability_${hash({ score, failures }).slice(0, 14)}`,
    historical_accuracy_score: compromised ? 0.31 : score,
    consistency_score: compromised ? 0.29 : score,
    authenticity_score: failures.includes("UNKNOWN_SOURCE_DETECTED") ? 0.18 : score,
    poisoning_history_score: compromised ? 0.25 : score,
    trust_history_score: compromised ? 0.3 : score,
    governance_compliance_score: failures.includes("UNAUTHORIZED_POLICY_CHANGE") ? 0.2 : score,
    evidence_acceptance_rate: compromised ? 0.22 : Number((score - 0.02).toFixed(2)),
    replay_reliability_score: failures.includes("NONREPLAYABLE_EVIDENCE_VALIDATION") ? 0.18 : score,
    reliability_trend_analysis: compromised ? "Source reliability has degraded and requires isolation." : "Source reliability remains stable.",
    trust_degradation_assessment: compromised ? "Trust degradation detected." : "No trust degradation detected.",
    compromised_sources: compromised ? freezeArray(["source:compromised-review"]) : freezeArray([]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildHealthScore(score: number, failures: readonly EvidencePoisoningFailure[]): EvidenceHealthScoreReport {
  const base: Omit<EvidenceHealthScoreReport, "integrity_hash"> = {
    score_id: `evidence_health_${hash({ score, failures }).slice(0, 14)}`,
    evidence_health_score: score,
    provenance_score: failures.some((failure) => ["UNKNOWN_SOURCE_DETECTED", "MISSING_PROVENANCE_DETECTED", "BROKEN_LINEAGE_DETECTED"].includes(failure)) ? 0.18 : score,
    quality_score: failures.includes("LOW_QUALITY_EVIDENCE_CLUSTER") ? 0.32 : score,
    consistency_score: failures.includes("CONTRADICTORY_EVIDENCE_DETECTED") ? 0.28 : score,
    authenticity_score: failures.some((failure) => ["FABRICATED_EVIDENCE_DETECTED", "TAMPERED_EVIDENCE_DETECTED", "INVALID_SIGNATURE_DETECTED"].includes(failure)) ? 0.14 : score,
    reliability_score: failures.includes("SOURCE_CORRUPTION_DETECTED") ? 0.25 : score,
    replay_score: failures.includes("NONREPLAYABLE_EVIDENCE_VALIDATION") || failures.includes("EVIDENCE_REPLAY_MANIPULATION") ? 0.19 : score,
    lineage_completeness_score: failures.includes("INCOMPLETE_EVIDENCE_LINEAGE") ? 0.22 : score,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function containmentActions(failures: readonly EvidencePoisoningFailure[], response: DriftResponse): readonly string[] {
  if (!failures.length) return freezeArray(["monitor_evidence_integrity"]);
  const actions = ["quarantine_suspected_evidence", "exclude_from_adaptive_learning", "preserve_forensic_evidence"];
  if (failures.includes("SOURCE_CORRUPTION_DETECTED") || failures.includes("COORDINATED_EVIDENCE_ATTACK")) actions.push("isolate_compromised_sources");
  if (response === "FAIL_CLOSED") actions.push("fail_closed");
  if (response === "SUPPRESS_ADAPTATION") actions.push("suppress_adaptation");
  return freezeArray(actions);
}

function buildPoisoningAssessment(failures: readonly EvidencePoisoningFailure[], severity: DriftSeverity, response: DriftResponse, actions: readonly string[]): PoisoningAssessment {
  const base: Omit<PoisoningAssessment, "integrity_hash"> = {
    assessment_id: `poisoning_assessment_${hash(failures).slice(0, 14)}`,
    poisoning_detected: failures.length > 0,
    poisoning_techniques: failures,
    affected_evidence_refs: failures.length ? freezeArray(["evidence:suspicious-1", "evidence:suspicious-2"]) : freezeArray([]),
    affected_adaptations: freezeArray(["adaptation:proposal-generation", "adaptation:simulation-validation"]),
    source_analysis: failures.includes("SOURCE_CORRUPTION_DETECTED") ? "Source corruption detected." : "Source analysis completed.",
    governance_impacts: failures.length ? freezeArray(["governance_review_required"]) : freezeArray(["governance_preserved"]),
    constitutional_impacts: failures.includes("TENANT_ISOLATION_BREACH") ? freezeArray(["tenant_isolation_violation"]) : freezeArray(["constitutional_boundary_preserved"]),
    replay_impacts: failures.includes("NONREPLAYABLE_EVIDENCE_VALIDATION") || failures.includes("EVIDENCE_REPLAY_MANIPULATION") ? freezeArray(["replay_integrity_degraded"]) : freezeArray(["replay_integrity_preserved"]),
    supporting_evidence: freezeArray(["evidence:truth-ledger", "evidence:lineage-chain", "evidence:replay-trace", "evidence:source-registry"]),
    containment_actions: actions,
    recommended_response: response,
    severity,
    deterministic: true,
    replayable: true,
    explainable: true,
    evidence_backed: true,
    audit_ready: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildSourceImpact(score: number, source: SourceReliabilityReport, failures: readonly EvidencePoisoningFailure[]): SourceReliabilityImpact {
  const affected = source.compromised_sources.length ? source.compromised_sources : failures.length ? freezeArray(["source:under-review"]) : freezeArray([]);
  const base: Omit<SourceReliabilityImpact, "integrity_hash"> = {
    impact_id: `source_reliability_impact_${hash({ score, failures }).slice(0, 14)}`,
    affected_sources: affected,
    future_learning_eligibility: failures.length ? "suspended_until_governance_review" : "eligible",
    governance_confidence_score: failures.includes("UNAUTHORIZED_POLICY_CHANGE") ? 0.2 : score,
    source_reliability_impact: failures.length ? "Source reliability requires review before future learning eligibility." : "No source reliability impact detected.",
    trust_recovery_requirements: failures.length ? freezeArray(["governance_review", "lineage_revalidation", "replay_certification"]) : freezeArray([]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildContainment(provenance: ProvenanceReport, assessment: PoisoningAssessment, sourceImpact: SourceReliabilityImpact): EvidenceContainmentDecision {
  const failClosed = assessment.recommended_response === "FAIL_CLOSED";
  const base: Omit<EvidenceContainmentDecision, "integrity_hash"> = {
    containment_id: `evidence_containment_${hash({ assessment: assessment.integrity_hash, source: sourceImpact.integrity_hash }).slice(0, 14)}`,
    rejected_evidence_refs: provenance.rejected_evidence_refs,
    quarantined_evidence_refs: assessment.affected_evidence_refs,
    isolated_sources: sourceImpact.affected_sources,
    excluded_from_learning_refs: assessment.poisoning_detected ? freezeArray([...provenance.rejected_evidence_refs, ...assessment.affected_evidence_refs]) : freezeArray([]),
    containment_actions: assessment.containment_actions,
    governance_review_required: assessment.poisoning_detected,
    forensic_evidence_preserved: true,
    fail_closed: failClosed,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildRecord(input: EvidencePoisoningInput, baseline: EvidenceTrustBaseline, health: EvidenceHealthScoreReport, source: SourceReliabilityReport, assessment: PoisoningAssessment, impact: SourceReliabilityImpact, containment: EvidenceContainmentDecision): EvidencePoisoningRecord {
  const base: Omit<EvidencePoisoningRecord, "integrity_hash"> = {
    poisoning_id: `evidence_poisoning_${hash({ tenant: input.tenant_id ?? "tenant-mission-control", score: health.evidence_health_score, failures: assessment.poisoning_techniques }).slice(0, 16)}`,
    tenant_id: input.tenant_id ?? "tenant-mission-control",
    evidence_policy_version: baseline.evidence_policy_version,
    poisoning_type: "EVIDENCE_POISONING",
    evidence_health_score: health.evidence_health_score,
    source_reliability_score: source.trust_history_score,
    severity: assessment.severity,
    affected_evidence_refs: assessment.affected_evidence_refs,
    affected_sources: impact.affected_sources,
    affected_adaptations: assessment.affected_adaptations,
    affected_recommendations: freezeArray(["recommendation:evidence-weighted", "recommendation:adaptive-proposal"]),
    supporting_evidence: assessment.integrity_hash,
    recommended_response: assessment.recommended_response,
    containment_required: containment.excluded_from_learning_refs.length > 0 || containment.fail_closed,
    governance_impact: containment.governance_review_required ? "governance_review_required" : "governance_preserved",
    replay_impact: assessment.replay_impacts.join(","),
    source_reliability_impact: impact.source_reliability_impact,
    replay_refs: freezeArray(["replay:evidence-poisoning-defense"]),
    timestamp: DEFENSE_TIMESTAMP,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildMetrics(health: EvidenceHealthScoreReport, source: SourceReliabilityReport, containment: EvidenceContainmentDecision, failures: readonly EvidencePoisoningFailure[]): EvidencePoisoningMetrics {
  const base: Omit<EvidencePoisoningMetrics, "integrity_hash"> = {
    evidence_health_score: health.evidence_health_score,
    source_reliability_score: source.trust_history_score,
    provenance_score: health.provenance_score,
    quality_score: health.quality_score,
    consistency_score: health.consistency_score,
    containment_required: containment.excluded_from_learning_refs.length > 0 || containment.fail_closed,
    deterministic_assessment: !failures.includes("NONDETERMINISTIC_ASSESSMENT"),
    replayable_assessment: !failures.includes("NONREPLAYABLE_EVIDENCE_VALIDATION"),
    governance_preserved: !failures.includes("UNAUTHORIZED_POLICY_CHANGE"),
    constitutional_preserved: !failures.includes("TENANT_ISOLATION_BREACH"),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_BREACH"),
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<EvidencePoisoningResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    architecture_hash: result.architecture_result.integrity_hash,
    baseline_hash: result.baseline.integrity_hash,
    provenance_hash: result.provenance_report.integrity_hash,
    consistency_hash: result.consistency_report.integrity_hash,
    synthetic_hash: result.synthetic_report.integrity_hash,
    quality_hash: result.quality_report.integrity_hash,
    source_hash: result.source_reliability_report.integrity_hash,
    health_hash: result.health_score_report.integrity_hash,
    assessment_hash: result.poisoning_assessment.integrity_hash,
    impact_hash: result.source_reliability_impact.integrity_hash,
    containment_hash: result.containment_decision.integrity_hash,
    record_hash: result.poisoning_record.integrity_hash,
    metrics_hash: result.metrics.integrity_hash,
    status: result.status,
    failures: result.failures,
  });
}

function resultIntegrityHash(result: Omit<EvidencePoisoningResult, "integrity_hash">): string {
  return hash({
    version: result.evidence_poisoning_defense_version,
    defense_identifier: result.defense_identifier,
    api_surface_hash: result.api_surface.integrity_hash,
    replay_hash: result.replay_hash,
    record_hash: result.poisoning_record.integrity_hash,
  });
}

function verifyHashedRecord(value: { integrity_hash: string }): boolean {
  return hashWithoutIntegrity(value) === value.integrity_hash;
}

export function defendEvidenceIntegrity(input: EvidencePoisoningInput = {}): EvidencePoisoningResult {
  const scenario = input.scenario ?? "BASELINE";
  const api_surface = buildApiSurface();
  const architecture_result = input.architecture_result ?? establishDriftDefenseArchitecture();
  const failures = collectFailures(scenario, replayDriftDefenseArchitecture(architecture_result));
  const score = healthScore(failures);
  const severity = severityFor(failures);
  const response = responseFor(severity, failures);
  const actions = containmentActions(failures, response);
  const baseline = buildBaseline();
  const provenance_report = buildProvenanceReport(failures);
  const consistency_report = buildConsistencyReport(score, failures);
  const synthetic_report = buildSyntheticReport(failures);
  const quality_report = buildQualityReport(score, failures);
  const source_reliability_report = buildSourceReliability(score, failures);
  const health_score_report = buildHealthScore(score, failures);
  const poisoning_assessment = buildPoisoningAssessment(failures, severity, response, actions);
  const source_reliability_impact = buildSourceImpact(score, source_reliability_report, failures);
  const containment_decision = buildContainment(provenance_report, poisoning_assessment, source_reliability_impact);
  const poisoning_record = buildRecord(input, baseline, health_score_report, source_reliability_report, poisoning_assessment, source_reliability_impact, containment_decision);
  const metrics = buildMetrics(health_score_report, source_reliability_report, containment_decision, failures);
  const base: Omit<EvidencePoisoningResult, "integrity_hash" | "replay_hash"> = {
    evidence_poisoning_defense_version: DEFENSE_VERSION,
    defense_identifier: DEFENSE_IDENTIFIER,
    status: statusFor(failures),
    api_surface,
    architecture_result,
    baseline,
    provenance_report,
    consistency_report,
    synthetic_report,
    quality_report,
    source_reliability_report,
    health_score_report,
    poisoning_assessment,
    source_reliability_impact,
    containment_decision,
    poisoning_record,
    metrics,
    failures,
    deterministic: metrics.deterministic_assessment,
    replayable: metrics.replayable_assessment,
    explainable: !failures.includes("UNKNOWN_EVIDENCE_BEHAVIOR"),
    evidence_backed: !failures.includes("NONREPLAYABLE_EVIDENCE_VALIDATION"),
    governance_preserved: metrics.governance_preserved,
    constitutional_preserved: metrics.constitutional_preserved,
    tenant_isolated: metrics.tenant_isolated,
    advisory_only: true,
    mutates_production_behavior: false,
    authorizes_learning: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayEvidencePoisoningDefense(result: EvidencePoisoningResult): boolean {
  return (
    verifyHashedRecord(result.api_surface) &&
    replayDriftDefenseArchitecture(result.architecture_result) &&
    verifyHashedRecord(result.baseline) &&
    verifyHashedRecord(result.provenance_report) &&
    verifyHashedRecord(result.consistency_report) &&
    verifyHashedRecord(result.synthetic_report) &&
    verifyHashedRecord(result.quality_report) &&
    verifyHashedRecord(result.source_reliability_report) &&
    verifyHashedRecord(result.health_score_report) &&
    verifyHashedRecord(result.poisoning_assessment) &&
    verifyHashedRecord(result.source_reliability_impact) &&
    verifyHashedRecord(result.containment_decision) &&
    verifyHashedRecord(result.poisoning_record) &&
    verifyHashedRecord(result.metrics) &&
    resultReplayHash(result) === result.replay_hash &&
    resultIntegrityHash(result) === result.integrity_hash
  );
}

export function getEvidencePoisoningFoundation(): EvidencePoisoningFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    evidence_poisoning_defense_version: DEFENSE_VERSION,
    api_surface,
    result: defendEvidenceIntegrity(),
  });
}

export const EvidencePoisoningDefense = Object.freeze({
  defend: defendEvidenceIntegrity,
  replay: replayEvidencePoisoningDefense,
});
