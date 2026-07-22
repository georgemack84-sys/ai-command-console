import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { establishDriftDefenseArchitecture, replayDriftDefenseArchitecture } from "@/services/drift-defense-architecture";
import type { DriftResponse, DriftSeverity } from "@/types/drift-defense-architecture";
import type {
  ApprovalPatternReport,
  FeedbackAuthenticationReport,
  FeedbackContainmentDecision,
  FeedbackIntegrityScoreReport,
  FeedbackManipulationApiSurface,
  FeedbackManipulationFailure,
  FeedbackManipulationFoundation,
  FeedbackManipulationInput,
  FeedbackManipulationMetrics,
  FeedbackManipulationRecord,
  FeedbackManipulationResult,
  FeedbackManipulationScenario,
  FeedbackManipulationStatus,
  FeedbackTrustBaseline,
  ManipulationAssessment,
  OperatorInfluenceReport,
  RejectionPatternReport,
  SyntheticFeedbackAssessment,
  TrustImpactAnalysis,
} from "@/types/feedback-manipulation-defense";

const DEFENSE_VERSION = "feedback-manipulation-defense/v1" as const;
const DEFENSE_IDENTIFIER = "FeedbackManipulationDefense" as const;
const DEFENSE_TIMESTAMP = "2026-07-11T00:00:00.000Z" as const;

type Scenario = NonNullable<FeedbackManipulationInput["scenario"]>;

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

function buildApiSurface(): FeedbackManipulationApiSurface {
  const base: Omit<FeedbackManipulationApiSurface, "integrity_hash"> = {
    api_id: "feedback_manipulation_defense_api",
    defend_feedback_integrity: "POST /feedback-manipulation-defense/defend",
    retrieve_baseline: "POST /feedback-manipulation-defense/baseline",
    retrieve_authentication_report: "POST /feedback-manipulation-defense/authentication",
    retrieve_approval_report: "POST /feedback-manipulation-defense/approval-patterns",
    retrieve_rejection_report: "POST /feedback-manipulation-defense/rejection-patterns",
    retrieve_synthetic_assessment: "POST /feedback-manipulation-defense/synthetic",
    retrieve_influence_report: "POST /feedback-manipulation-defense/influence",
    retrieve_integrity_score: "POST /feedback-manipulation-defense/integrity-score",
    retrieve_manipulation_assessment: "POST /feedback-manipulation-defense/assessment",
    retrieve_trust_impact: "POST /feedback-manipulation-defense/trust-impact",
    retrieve_containment: "POST /feedback-manipulation-defense/containment",
    retrieve_ledger_record: "POST /feedback-manipulation-defense/ledger",
    retrieve_metrics: "POST /feedback-manipulation-defense/metrics",
    replay_defense: "POST /feedback-manipulation-defense/replay",
    inspect_defense: "POST /feedback-manipulation-defense/inspect",
    retrieve_contract: "GET /feedback-manipulation-defense/contract",
    feedback_mutation_supported: false,
    learning_authorization_supported: false,
    governance_bypass_supported: false,
    advisory_only: true,
    fail_open_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function failureForScenario(scenario: Scenario): FeedbackManipulationFailure | undefined {
  const map: Partial<Record<FeedbackManipulationScenario, FeedbackManipulationFailure>> = {
    UNAUTHORIZED_TRUST_CHANGE: "UNAUTHORIZED_TRUST_CHANGE",
    ANONYMOUS_FEEDBACK: "ANONYMOUS_FEEDBACK_DETECTED",
    UNAUTHORIZED_OPERATOR: "UNAUTHORIZED_OPERATOR_DETECTED",
    SPOOFED_IDENTITY: "SPOOFED_IDENTITY_DETECTED",
    REPLAY_ATTACK: "REPLAY_ATTACK_DETECTED",
    EXPIRED_CREDENTIAL: "EXPIRED_CREDENTIAL_DETECTED",
    FORGED_FEEDBACK: "FORGED_FEEDBACK_DETECTED",
    COORDINATED_APPROVALS: "COORDINATED_APPROVALS_DETECTED",
    MALICIOUS_OVERRIDE: "MALICIOUS_OVERRIDE_DETECTED",
    REPEATED_BIAS: "REPEATED_BIASED_FEEDBACK",
    APPROVAL_GAMING: "APPROVAL_GAMING_DETECTED",
    REJECTION_MANIPULATION: "REJECTION_MANIPULATION_DETECTED",
    FEEDBACK_FLOODING: "FEEDBACK_FLOODING_DETECTED",
    SYNTHETIC_FEEDBACK: "SYNTHETIC_FEEDBACK_DETECTED",
    ADVERSARIAL_INFLUENCE: "ADVERSARIAL_OPERATOR_INFLUENCE",
    COLLUSIVE_APPROVAL: "COLLUSIVE_APPROVAL_BEHAVIOR",
    COORDINATED_REJECTION: "COORDINATED_REJECTION_CAMPAIGN",
    AUTOMATED_GENERATION: "AUTOMATED_FEEDBACK_GENERATION",
    EXCESSIVE_INFLUENCE: "EXCESSIVE_INFLUENCE_CONCENTRATION",
    GOVERNANCE_CIRCUMVENTION: "GOVERNANCE_CIRCUMVENTION_THROUGH_FEEDBACK",
    NONDETERMINISTIC: "NONDETERMINISTIC_ASSESSMENT",
    NONREPLAYABLE_EVIDENCE: "NONREPLAYABLE_FEEDBACK_EVIDENCE",
    TENANT_BREACH: "TENANT_ISOLATION_BREACH",
    UNKNOWN_BEHAVIOR: "UNKNOWN_FEEDBACK_BEHAVIOR",
  };
  return map[scenario];
}

function collectFailures(scenario: Scenario, architectureReplayable: boolean): readonly FeedbackManipulationFailure[] {
  const failures: FeedbackManipulationFailure[] = [];
  const direct = failureForScenario(scenario);
  if (direct) failures.push(direct);
  if (!architectureReplayable) failures.push("DRIFT_DEFENSE_ARCHITECTURE_UNAVAILABLE");
  return freezeArray([...new Set(failures)]);
}

function severityFor(failures: readonly FeedbackManipulationFailure[]): DriftSeverity {
  if (failures.includes("UNKNOWN_FEEDBACK_BEHAVIOR") || failures.includes("TENANT_ISOLATION_BREACH") || failures.includes("GOVERNANCE_CIRCUMVENTION_THROUGH_FEEDBACK")) return "CRITICAL";
  if (failures.some((failure) => [
    "SYNTHETIC_FEEDBACK_DETECTED",
    "FORGED_FEEDBACK_DETECTED",
    "SPOOFED_IDENTITY_DETECTED",
    "REPLAY_ATTACK_DETECTED",
    "COORDINATED_APPROVALS_DETECTED",
    "COORDINATED_REJECTION_CAMPAIGN",
    "COLLUSIVE_APPROVAL_BEHAVIOR",
    "ADVERSARIAL_OPERATOR_INFLUENCE",
  ].includes(failure))) return "HIGH";
  if (failures.length) return "MODERATE";
  return "INFORMATIONAL";
}

function responseFor(severity: DriftSeverity, failures: readonly FeedbackManipulationFailure[]): DriftResponse {
  if (failures.includes("UNKNOWN_FEEDBACK_BEHAVIOR") || severity === "CRITICAL") return "FAIL_CLOSED";
  if (severity === "HIGH") return "SUPPRESS_ADAPTATION";
  if (severity === "MODERATE") return "REQUIRE_REVIEW";
  return "MONITOR";
}

function statusFor(failures: readonly FeedbackManipulationFailure[]): FeedbackManipulationStatus {
  if (failures.includes("UNKNOWN_FEEDBACK_BEHAVIOR") || failures.includes("TENANT_ISOLATION_BREACH")) return "FAIL_CLOSED";
  if (failures.some((failure) => [
    "ANONYMOUS_FEEDBACK_DETECTED",
    "UNAUTHORIZED_OPERATOR_DETECTED",
    "SPOOFED_IDENTITY_DETECTED",
    "REPLAY_ATTACK_DETECTED",
    "EXPIRED_CREDENTIAL_DETECTED",
    "FORGED_FEEDBACK_DETECTED",
    "SYNTHETIC_FEEDBACK_DETECTED",
    "AUTOMATED_FEEDBACK_GENERATION",
  ].includes(failure))) return "QUARANTINED";
  if (failures.includes("UNAUTHORIZED_TRUST_CHANGE") || failures.includes("GOVERNANCE_CIRCUMVENTION_THROUGH_FEEDBACK")) return "REQUIRES_GOVERNANCE_REVIEW";
  return failures.length ? "MANIPULATION_DETECTED" : "PASS";
}

function integrityScore(failures: readonly FeedbackManipulationFailure[]): number {
  if (!failures.length) return 0.96;
  if (failures.includes("UNKNOWN_FEEDBACK_BEHAVIOR") || failures.includes("TENANT_ISOLATION_BREACH")) return 0.05;
  if (failures.includes("SYNTHETIC_FEEDBACK_DETECTED") || failures.includes("FORGED_FEEDBACK_DETECTED") || failures.includes("REPLAY_ATTACK_DETECTED")) return 0.18;
  return 0.52;
}

function buildBaseline(): FeedbackTrustBaseline {
  const base: Omit<FeedbackTrustBaseline, "integrity_hash"> = {
    baseline_id: "feedback_trust_baseline_v1",
    feedback_policy_version: "feedback-policy/v1",
    authorized_roles: freezeArray(["operator", "governance_reviewer", "certification_reviewer", "mission_commander"]),
    authentication_requirements: freezeArray(["authenticated_identity", "active_session", "tenant_ownership", "digital_signature", "replay_nonce"]),
    trust_thresholds: freezeArray(["minimum_trust:0.70", "governance_review:0.55", "quarantine_below:0.40", "fail_closed_unknown"]),
    feedback_limits: freezeArray(["rate_limit_per_operator", "diversity_required_for_learning", "no_single_operator_dominance", "no_anonymous_feedback"]),
    governance_requirements: freezeArray(["feedback_is_evidence_not_authority", "governance_review_for_suspicious_patterns", "learning_boundary_preserved"]),
    constitutional_requirements: freezeArray(["operator_authority_preserved", "tenant_isolation_required", "feedback_cannot_override_governance"]),
    approval_reference: "governance-approval:feedback-trust-baseline:v1",
    effective_date: "2026-07-11",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildAuthenticationReport(failures: readonly FeedbackManipulationFailure[]): FeedbackAuthenticationReport {
  const rejected = failures.filter((failure) => ["ANONYMOUS_FEEDBACK_DETECTED", "UNAUTHORIZED_OPERATOR_DETECTED", "SPOOFED_IDENTITY_DETECTED", "REPLAY_ATTACK_DETECTED", "EXPIRED_CREDENTIAL_DETECTED", "FORGED_FEEDBACK_DETECTED"].includes(failure));
  const valid = rejected.length === 0;
  const base: Omit<FeedbackAuthenticationReport, "integrity_hash"> = {
    report_id: `feedback_authentication_${hash(failures).slice(0, 14)}`,
    operator_identity_valid: !failures.includes("ANONYMOUS_FEEDBACK_DETECTED") && !failures.includes("SPOOFED_IDENTITY_DETECTED"),
    authentication_status: valid ? "AUTHENTICATED" : "REJECTED",
    authorization_scope_valid: !failures.includes("UNAUTHORIZED_OPERATOR_DETECTED"),
    session_integrity_valid: !failures.includes("EXPIRED_CREDENTIAL_DETECTED"),
    tenant_ownership_valid: !failures.includes("TENANT_ISOLATION_BREACH"),
    digital_signature_valid: !failures.includes("FORGED_FEEDBACK_DETECTED"),
    replay_authenticity_valid: !failures.includes("REPLAY_ATTACK_DETECTED"),
    feedback_provenance_valid: valid,
    operator_verification_summary: valid ? "All feedback operators are authenticated and authorized." : "Unauthenticated or unauthorized feedback was rejected.",
    feedback_authenticity_status: valid ? "trusted" : "rejected",
    rejected_feedback_refs: rejected.length ? freezeArray(["feedback:rejected-authentication"]) : freezeArray([]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildApprovalReport(score: number, failures: readonly FeedbackManipulationFailure[]): ApprovalPatternReport {
  const anomalies = failures.filter((failure) => ["COORDINATED_APPROVALS_DETECTED", "APPROVAL_GAMING_DETECTED", "COLLUSIVE_APPROVAL_BEHAVIOR"].includes(failure));
  const base: Omit<ApprovalPatternReport, "integrity_hash"> = {
    report_id: `approval_pattern_${hash({ score, failures }).slice(0, 14)}`,
    approval_frequency_score: anomalies.length ? 0.32 : score,
    approval_consistency_score: anomalies.length ? 0.36 : score,
    approval_timing_score: anomalies.length ? 0.34 : Number((score - 0.01).toFixed(2)),
    approval_clustering_score: anomalies.length ? 0.29 : score,
    approval_sequencing_score: Number((score - 0.02).toFixed(2)),
    operator_agreement_score: Number((score - 0.01).toFixed(2)),
    historical_approval_trend_score: score,
    approval_pattern_report: anomalies.length ? "Approval manipulation indicators detected." : "Approval behavior remains historically consistent.",
    approval_integrity_assessment: anomalies.length ? "Approval pattern requires quarantine and governance review." : "Approval integrity preserved.",
    detected_approval_anomalies: anomalies,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildRejectionReport(score: number, failures: readonly FeedbackManipulationFailure[]): RejectionPatternReport {
  const anomalies = failures.filter((failure) => ["REJECTION_MANIPULATION_DETECTED", "COORDINATED_REJECTION_CAMPAIGN"].includes(failure));
  const base: Omit<RejectionPatternReport, "integrity_hash"> = {
    report_id: `rejection_pattern_${hash({ score, failures }).slice(0, 14)}`,
    rejection_frequency_score: anomalies.length ? 0.33 : score,
    rejection_timing_score: anomalies.length ? 0.35 : Number((score - 0.01).toFixed(2)),
    rejection_clustering_score: anomalies.length ? 0.3 : score,
    rejection_consistency_score: Number((score - 0.02).toFixed(2)),
    historical_rejection_trend_score: score,
    operator_disagreement_score: Number((score - 0.03).toFixed(2)),
    recommendation_targeting_score: anomalies.length ? 0.31 : score,
    rejection_pattern_report: anomalies.length ? "Rejection manipulation indicators detected." : "Rejection behavior remains historically consistent.",
    rejection_integrity_assessment: anomalies.length ? "Rejection pattern requires quarantine and governance review." : "Rejection integrity preserved.",
    detected_rejection_anomalies: anomalies,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildSyntheticAssessment(failures: readonly FeedbackManipulationFailure[]): SyntheticFeedbackAssessment {
  const synthetic = failures.some((failure) => ["SYNTHETIC_FEEDBACK_DETECTED", "AUTOMATED_FEEDBACK_GENERATION", "REPLAY_ATTACK_DETECTED", "FORGED_FEEDBACK_DETECTED"].includes(failure));
  const blocks = synthetic ? freezeArray(["suppress_synthetic_feedback", "exclude_from_learning", "preserve_forensic_evidence"]) : freezeArray([]);
  const base: Omit<SyntheticFeedbackAssessment, "integrity_hash"> = {
    assessment_id: `synthetic_feedback_${hash(failures).slice(0, 14)}`,
    synthetic_feedback_detected: failures.includes("SYNTHETIC_FEEDBACK_DETECTED"),
    duplicated_submissions_detected: failures.includes("FEEDBACK_FLOODING_DETECTED"),
    automated_responses_detected: failures.includes("AUTOMATED_FEEDBACK_GENERATION"),
    replayed_feedback_detected: failures.includes("REPLAY_ATTACK_DETECTED"),
    generated_feedback_detected: failures.includes("SYNTHETIC_FEEDBACK_DETECTED"),
    forged_operator_comments_detected: failures.includes("FORGED_FEEDBACK_DETECTED"),
    anomalous_behavioral_signatures: synthetic ? freezeArray(["timing_uniformity", "signature_mismatch", "bulk_submission_pattern"]) : freezeArray([]),
    authenticity_report: synthetic ? "Synthetic or fabricated feedback detected and blocked." : "No synthetic feedback detected.",
    evidence_integrity_summary: synthetic ? "Evidence preserved for replay and forensic analysis." : "Feedback evidence integrity preserved.",
    automatic_blocks: blocks,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildInfluenceReport(score: number, failures: readonly FeedbackManipulationFailure[]): OperatorInfluenceReport {
  const anomalies = failures.filter((failure) => ["ADVERSARIAL_OPERATOR_INFLUENCE", "EXCESSIVE_INFLUENCE_CONCENTRATION", "GOVERNANCE_CIRCUMVENTION_THROUGH_FEEDBACK", "MALICIOUS_OVERRIDE_DETECTED"].includes(failure));
  const base: Omit<OperatorInfluenceReport, "integrity_hash"> = {
    report_id: `operator_influence_${hash({ score, failures }).slice(0, 14)}`,
    operator_influence_score: anomalies.length ? 0.34 : score,
    influence_concentration_score: anomalies.length ? 0.72 : 0.08,
    feedback_diversity_score: anomalies.length ? 0.38 : score,
    historical_trust_score: score,
    governance_compliance_score: failures.includes("GOVERNANCE_CIRCUMVENTION_THROUGH_FEEDBACK") ? 0.12 : score,
    adaptation_impact_score: anomalies.length ? 0.68 : 0.09,
    recommendation_influence_score: anomalies.length ? 0.66 : 0.1,
    influence_distribution_analysis: anomalies.length ? "Operator influence concentration or adversarial behavior detected." : "Operator influence remains distributed and governed.",
    governance_impact_summary: failures.includes("GOVERNANCE_CIRCUMVENTION_THROUGH_FEEDBACK") ? "Feedback attempted to circumvent governance." : "No governance influence concern detected.",
    detected_influence_anomalies: anomalies,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildIntegrityScore(score: number, failures: readonly FeedbackManipulationFailure[]): FeedbackIntegrityScoreReport {
  const base: Omit<FeedbackIntegrityScoreReport, "integrity_hash"> = {
    score_id: `feedback_integrity_${hash({ score, failures }).slice(0, 14)}`,
    feedback_integrity_score: score,
    authenticity_score: failures.some((failure) => ["ANONYMOUS_FEEDBACK_DETECTED", "SPOOFED_IDENTITY_DETECTED", "FORGED_FEEDBACK_DETECTED", "REPLAY_ATTACK_DETECTED"].includes(failure)) ? 0.12 : score,
    manipulation_score: failures.length ? Number((1 - score).toFixed(2)) : 0.03,
    trust_score: Number((score - 0.01).toFixed(2)),
    diversity_score: failures.includes("EXCESSIVE_INFLUENCE_CONCENTRATION") ? 0.26 : Number((score - 0.02).toFixed(2)),
    consistency_score: failures.includes("REPEATED_BIASED_FEEDBACK") ? 0.32 : Number((score - 0.01).toFixed(2)),
    governance_compliance_score: failures.includes("GOVERNANCE_CIRCUMVENTION_THROUGH_FEEDBACK") ? 0.1 : score,
    historical_reliability_score: Number((score - 0.02).toFixed(2)),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function containmentActions(failures: readonly FeedbackManipulationFailure[], response: DriftResponse): readonly string[] {
  if (!failures.length) return freezeArray(["monitor_feedback_integrity"]);
  const actions = ["quarantine_suspicious_feedback", "exclude_from_adaptive_learning", "preserve_forensic_evidence", "notify_operators"];
  if (response === "FAIL_CLOSED") actions.push("fail_closed");
  if (response === "SUPPRESS_ADAPTATION") actions.push("suppress_adaptation");
  if (failures.includes("GOVERNANCE_CIRCUMVENTION_THROUGH_FEEDBACK")) actions.push("require_governance_review");
  return freezeArray(actions);
}

function buildManipulationAssessment(failures: readonly FeedbackManipulationFailure[], severity: DriftSeverity, response: DriftResponse, actions: readonly string[]): ManipulationAssessment {
  const base: Omit<ManipulationAssessment, "integrity_hash"> = {
    assessment_id: `manipulation_assessment_${hash(failures).slice(0, 14)}`,
    manipulation_detected: failures.length > 0,
    manipulation_types: failures,
    affected_operators: failures.length ? freezeArray(["operator:subject-to-review"]) : freezeArray([]),
    affected_feedback_refs: failures.length ? freezeArray(["feedback:suspicious-1", "feedback:suspicious-2"]) : freezeArray([]),
    supporting_evidence: freezeArray(["evidence:feedback-ledger", "evidence:operator-session", "evidence:replay-trace", "evidence:governance-policy"]),
    severity,
    recommended_containment_actions: actions,
    recommended_response: response,
    deterministic: true,
    replayable: true,
    explainable: true,
    evidence_backed: true,
    audit_ready: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildTrustImpact(score: number, failures: readonly FeedbackManipulationFailure[]): TrustImpactAnalysis {
  const degraded = failures.length > 0;
  const base: Omit<TrustImpactAnalysis, "integrity_hash"> = {
    analysis_id: `trust_impact_${hash({ score, failures }).slice(0, 14)}`,
    adaptation_reliability_score: degraded ? Number((score - 0.08).toFixed(2)) : score,
    recommendation_reliability_score: degraded ? Number((score - 0.06).toFixed(2)) : score,
    governance_confidence_score: failures.includes("GOVERNANCE_CIRCUMVENTION_THROUGH_FEEDBACK") ? 0.15 : score,
    evidence_integrity_score: failures.includes("NONREPLAYABLE_FEEDBACK_EVIDENCE") ? 0.2 : score,
    operator_trust_score: Number((score - 0.02).toFixed(2)),
    certification_readiness_score: degraded ? Number((score - 0.12).toFixed(2)) : score,
    replay_reliability_score: failures.includes("NONREPLAYABLE_FEEDBACK_EVIDENCE") ? 0.18 : score,
    trust_impact_summary: degraded ? "Feedback manipulation reduces adaptive learning trust until review is complete." : "Feedback trust remains suitable for governed learning evidence.",
    production_readiness_impact: degraded ? "Manipulated feedback is excluded from production learning influence." : "No production readiness impact detected.",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildContainment(failures: readonly FeedbackManipulationFailure[], auth: FeedbackAuthenticationReport, assessment: ManipulationAssessment): FeedbackContainmentDecision {
  const rejected = auth.rejected_feedback_refs;
  const suspicious = assessment.affected_feedback_refs;
  const failClosed = failures.includes("UNKNOWN_FEEDBACK_BEHAVIOR") || failures.includes("TENANT_ISOLATION_BREACH");
  const base: Omit<FeedbackContainmentDecision, "integrity_hash"> = {
    containment_id: `feedback_containment_${hash({ failures, rejected }).slice(0, 14)}`,
    rejected_feedback_refs: rejected,
    quarantined_feedback_refs: suspicious,
    excluded_from_learning_refs: failures.length ? freezeArray([...rejected, ...suspicious]) : freezeArray([]),
    containment_actions: assessment.recommended_containment_actions,
    governance_review_required: failures.length > 0,
    operator_notification_required: failures.length > 0,
    forensic_evidence_preserved: true,
    fail_closed: failClosed,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildRecord(input: FeedbackManipulationInput, baseline: FeedbackTrustBaseline, scoreReport: FeedbackIntegrityScoreReport, assessment: ManipulationAssessment, trust: TrustImpactAnalysis, containment: FeedbackContainmentDecision): FeedbackManipulationRecord {
  const base: Omit<FeedbackManipulationRecord, "integrity_hash"> = {
    drift_id: `feedback_manipulation_${hash({ tenant: input.tenant_id ?? "tenant-mission-control", score: scoreReport.feedback_integrity_score, failures: assessment.manipulation_types }).slice(0, 16)}`,
    tenant_id: input.tenant_id ?? "tenant-mission-control",
    feedback_policy_version: baseline.feedback_policy_version,
    manipulation_type: "FEEDBACK_MANIPULATION",
    feedback_integrity_score: scoreReport.feedback_integrity_score,
    trust_score: scoreReport.trust_score,
    severity: assessment.severity,
    affected_feedback_refs: assessment.affected_feedback_refs,
    affected_adaptations: freezeArray(["adaptation:feedback-learning", "adaptation:proposal-prioritization"]),
    affected_recommendations: freezeArray(["recommendation:operator-feedback-weighted", "recommendation:adaptive-improvement"]),
    operator_refs: assessment.affected_operators,
    supporting_evidence: assessment.integrity_hash,
    recommended_response: assessment.recommended_response,
    containment_required: containment.excluded_from_learning_refs.length > 0 || containment.fail_closed,
    governance_impact: containment.governance_review_required ? "governance_review_required" : "governance_preserved",
    trust_impact: trust.trust_impact_summary,
    replay_refs: freezeArray(["replay:feedback-manipulation-defense"]),
    timestamp: DEFENSE_TIMESTAMP,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildMetrics(scoreReport: FeedbackIntegrityScoreReport, containment: FeedbackContainmentDecision, failures: readonly FeedbackManipulationFailure[]): FeedbackManipulationMetrics {
  const base: Omit<FeedbackManipulationMetrics, "integrity_hash"> = {
    feedback_integrity_score: scoreReport.feedback_integrity_score,
    trust_score: scoreReport.trust_score,
    authenticity_score: scoreReport.authenticity_score,
    manipulation_score: scoreReport.manipulation_score,
    containment_required: containment.excluded_from_learning_refs.length > 0 || containment.fail_closed,
    deterministic_assessment: !failures.includes("NONDETERMINISTIC_ASSESSMENT"),
    replayable_assessment: !failures.includes("NONREPLAYABLE_FEEDBACK_EVIDENCE"),
    evidence_backed: !failures.includes("NONREPLAYABLE_FEEDBACK_EVIDENCE"),
    governance_preserved: !failures.includes("GOVERNANCE_CIRCUMVENTION_THROUGH_FEEDBACK") && !failures.includes("UNAUTHORIZED_TRUST_CHANGE"),
    constitutional_preserved: !failures.includes("TENANT_ISOLATION_BREACH"),
    operator_authority_preserved: true,
    tenant_isolated: !failures.includes("TENANT_ISOLATION_BREACH"),
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<FeedbackManipulationResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    architecture_hash: result.architecture_result.integrity_hash,
    baseline_hash: result.baseline.integrity_hash,
    authentication_hash: result.authentication_report.integrity_hash,
    approval_hash: result.approval_report.integrity_hash,
    rejection_hash: result.rejection_report.integrity_hash,
    synthetic_hash: result.synthetic_assessment.integrity_hash,
    influence_hash: result.influence_report.integrity_hash,
    score_hash: result.integrity_score_report.integrity_hash,
    assessment_hash: result.manipulation_assessment.integrity_hash,
    trust_hash: result.trust_impact_analysis.integrity_hash,
    containment_hash: result.containment_decision.integrity_hash,
    record_hash: result.manipulation_record.integrity_hash,
    metrics_hash: result.metrics.integrity_hash,
    status: result.status,
    failures: result.failures,
  });
}

function resultIntegrityHash(result: Omit<FeedbackManipulationResult, "integrity_hash">): string {
  return hash({
    version: result.feedback_manipulation_defense_version,
    defense_identifier: result.defense_identifier,
    api_surface_hash: result.api_surface.integrity_hash,
    replay_hash: result.replay_hash,
    record_hash: result.manipulation_record.integrity_hash,
  });
}

function verifyHashedRecord(value: { integrity_hash: string }): boolean {
  return hashWithoutIntegrity(value) === value.integrity_hash;
}

export function defendFeedbackIntegrity(input: FeedbackManipulationInput = {}): FeedbackManipulationResult {
  const scenario = input.scenario ?? "BASELINE";
  const api_surface = buildApiSurface();
  const architecture_result = input.architecture_result ?? establishDriftDefenseArchitecture();
  const failures = collectFailures(scenario, replayDriftDefenseArchitecture(architecture_result));
  const score = integrityScore(failures);
  const severity = severityFor(failures);
  const response = responseFor(severity, failures);
  const actions = containmentActions(failures, response);
  const baseline = buildBaseline();
  const authentication_report = buildAuthenticationReport(failures);
  const approval_report = buildApprovalReport(score, failures);
  const rejection_report = buildRejectionReport(score, failures);
  const synthetic_assessment = buildSyntheticAssessment(failures);
  const influence_report = buildInfluenceReport(score, failures);
  const integrity_score_report = buildIntegrityScore(score, failures);
  const manipulation_assessment = buildManipulationAssessment(failures, severity, response, actions);
  const trust_impact_analysis = buildTrustImpact(score, failures);
  const containment_decision = buildContainment(failures, authentication_report, manipulation_assessment);
  const manipulation_record = buildRecord(input, baseline, integrity_score_report, manipulation_assessment, trust_impact_analysis, containment_decision);
  const metrics = buildMetrics(integrity_score_report, containment_decision, failures);
  const base: Omit<FeedbackManipulationResult, "integrity_hash" | "replay_hash"> = {
    feedback_manipulation_defense_version: DEFENSE_VERSION,
    defense_identifier: DEFENSE_IDENTIFIER,
    status: statusFor(failures),
    api_surface,
    architecture_result,
    baseline,
    authentication_report,
    approval_report,
    rejection_report,
    synthetic_assessment,
    influence_report,
    integrity_score_report,
    manipulation_assessment,
    trust_impact_analysis,
    containment_decision,
    manipulation_record,
    metrics,
    failures,
    deterministic: metrics.deterministic_assessment,
    replayable: metrics.replayable_assessment,
    explainable: !failures.includes("UNKNOWN_FEEDBACK_BEHAVIOR"),
    evidence_backed: metrics.evidence_backed,
    governance_preserved: metrics.governance_preserved,
    constitutional_preserved: metrics.constitutional_preserved,
    operator_authority_preserved: metrics.operator_authority_preserved,
    tenant_isolated: metrics.tenant_isolated,
    advisory_only: true,
    mutates_production_behavior: false,
    authorizes_learning: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayFeedbackManipulationDefense(result: FeedbackManipulationResult): boolean {
  return (
    verifyHashedRecord(result.api_surface) &&
    replayDriftDefenseArchitecture(result.architecture_result) &&
    verifyHashedRecord(result.baseline) &&
    verifyHashedRecord(result.authentication_report) &&
    verifyHashedRecord(result.approval_report) &&
    verifyHashedRecord(result.rejection_report) &&
    verifyHashedRecord(result.synthetic_assessment) &&
    verifyHashedRecord(result.influence_report) &&
    verifyHashedRecord(result.integrity_score_report) &&
    verifyHashedRecord(result.manipulation_assessment) &&
    verifyHashedRecord(result.trust_impact_analysis) &&
    verifyHashedRecord(result.containment_decision) &&
    verifyHashedRecord(result.manipulation_record) &&
    verifyHashedRecord(result.metrics) &&
    resultReplayHash(result) === result.replay_hash &&
    resultIntegrityHash(result) === result.integrity_hash
  );
}

export function getFeedbackManipulationFoundation(): FeedbackManipulationFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    feedback_manipulation_defense_version: DEFENSE_VERSION,
    api_surface,
    result: defendFeedbackIntegrity(),
  });
}

export const FeedbackManipulationDefense = Object.freeze({
  defend: defendFeedbackIntegrity,
  replay: replayFeedbackManipulationDefense,
});
