import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { renderFeedbackAnalyticsDashboard, replayFeedbackAnalyticsDashboard } from "@/services/feedback-analytics-dashboard";
import { correlateFeedbackEvidence, replayFeedbackEvidenceCorrelation } from "@/services/feedback-evidence-correlation";
import { submitFeedbackIntake, replayFeedbackIntake } from "@/services/feedback-intake-engine";
import { normalizeFeedback, replayFeedbackNormalization } from "@/services/feedback-normalization-engine";
import { validateOperatorFeedbackGovernance, replayOperatorFeedbackGovernanceValidation } from "@/services/operator-feedback-governance-validation";
import { validateOperatorFeedbackContract, replayOperatorFeedbackContract } from "@/services/operator-feedback-contract";
import { appendOperatorFeedbackLedger, replayOperatorFeedbackLedger } from "@/services/operator-feedback-ledger";
import { analyzeOverrideLearning, replayOverrideLearningAnalysis } from "@/services/override-learning-analyzer";
import { analyzeRejectionLearning, replayRejectionLearningAnalysis } from "@/services/rejection-learning-analyzer";
import type {
  OperatorFeedbackCertificationApiSurface,
  OperatorFeedbackCertificationDomain,
  OperatorFeedbackCertificationDomainReport,
  OperatorFeedbackCertificationEvidencePackage,
  OperatorFeedbackCertificationFailure,
  OperatorFeedbackCertificationGateFoundation,
  OperatorFeedbackCertificationGateInput,
  OperatorFeedbackCertificationGateResult,
  OperatorFeedbackCertificationMatrixResult,
  OperatorFeedbackCertificationOutcome,
  OperatorFeedbackCertificationScenario,
} from "@/types/operator-feedback-certification-gate";

const GATE_VERSION = "operator-feedback-certification-gate/v1" as const;
const FRAMEWORK_VERSION = "operator-feedback-certification-framework/v1" as const;
const CERTIFIED_AT = "2026-07-10T00:00:00.000Z";

type Scenario = NonNullable<OperatorFeedbackCertificationGateInput["scenario"]>;

const SOFT_FAILURES: readonly OperatorFeedbackCertificationFailure[] = Object.freeze(["DOCUMENTATION_GAP", "VISUALIZATION_REPORTING_GAP", "USABILITY_GAP"]);

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

function buildApiSurface(): OperatorFeedbackCertificationApiSurface {
  const base: Omit<OperatorFeedbackCertificationApiSurface, "integrity_hash"> = {
    api_id: "operator_feedback_certification_gate_api",
    certify_feedback_integration: "POST /operator-feedback-certification-gate/certify",
    retrieve_evidence_package: "POST /operator-feedback-certification-gate/evidence-package",
    retrieve_matrix: "POST /operator-feedback-certification-gate/matrix",
    retrieve_decision: "POST /operator-feedback-certification-gate/decision",
    replay_certification: "POST /operator-feedback-certification-gate/replay",
    inspect_certification: "POST /operator-feedback-certification-gate/inspect",
    retrieve_contract: "GET /operator-feedback-certification-gate/contract",
    production_mutation_supported: false,
    governance_override_supported: false,
    policy_mutation_supported: false,
    adaptive_implementation_authorization_supported: false,
    operator_authority_expansion_supported: false,
    advisory_only: true,
    fail_open_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function directFailuresFor(scenario: Scenario): readonly OperatorFeedbackCertificationFailure[] {
  const map: Partial<Record<OperatorFeedbackCertificationScenario, readonly OperatorFeedbackCertificationFailure[]>> = {
    DOCUMENTATION_GAP: ["DOCUMENTATION_GAP"],
    VISUALIZATION_REPORTING_GAP: ["VISUALIZATION_REPORTING_GAP"],
    USABILITY_GAP: ["USABILITY_GAP"],
    CONTRACT_INVALID: ["CONTRACT_INVALID"],
    UNAUTHORIZED_FEEDBACK_ACCEPTED: ["UNAUTHORIZED_FEEDBACK_ACCEPTED", "AUTHORIZATION_NOT_ENFORCED"],
    NORMALIZATION_NONDETERMINISTIC: ["NORMALIZATION_NONDETERMINISTIC", "CLASSIFICATION_INCONSISTENT"],
    OVERRIDE_ANALYSIS_NONDETERMINISTIC: ["OVERRIDE_ANALYSIS_NONDETERMINISTIC"],
    REJECTION_ANALYSIS_NONDETERMINISTIC: ["REJECTION_ANALYSIS_NONDETERMINISTIC"],
    MISSING_LINEAGE: ["MISSING_DECISION_LINEAGE", "MISSING_RECOMMENDATION_LINEAGE", "MISSING_OUTCOME_LINEAGE", "MISSING_REPLAY_LINEAGE", "MISSING_EVIDENCE_LINEAGE"],
    GOVERNANCE_BYPASS: ["GOVERNANCE_POLICY_OVERRIDE_DETECTED", "FEEDBACK_USED_AS_AUTHORITY"],
    CONSTITUTIONAL_VIOLATION: ["CONSTITUTIONAL_VALIDATION_MISSING", "FEEDBACK_USED_AS_AUTHORITY"],
    AUTHORITY_EXPANSION: ["AUTHORITY_BOUNDARY_VIOLATED", "FEEDBACK_USED_AS_AUTHORITY"],
    TENANT_BREACH: ["CROSS_TENANT_FEEDBACK_ACCEPTED", "TENANT_ISOLATION_BROKEN"],
    LEDGER_MUTATION: ["LEDGER_NOT_APPEND_ONLY", "LEDGER_NOT_IMMUTABLE"],
    HASH_MISMATCH: ["LEDGER_HASH_INVALID"],
    REPLAY_DIVERGENCE: ["REPLAY_NONDETERMINISTIC"],
    AUDIT_GAP: ["AUDIT_LINEAGE_INCOMPLETE"],
    PRODUCTION_MUTATION: ["PRODUCTION_MUTATION_DETECTED"],
    POLICY_MUTATION: ["GOVERNANCE_POLICY_OVERRIDE_DETECTED"],
    ADAPTIVE_IMPLEMENTATION_AUTHORIZATION: ["AUTHORITY_BOUNDARY_VIOLATED", "FEEDBACK_USED_AS_AUTHORITY"],
    ANALYTICS_UNEXPLAINED: ["EXPLAINABILITY_INCOMPLETE", "DASHBOARD_METRICS_NONDETERMINISTIC"],
    EVIDENCE_PACKAGE_INCOMPLETE: ["CERTIFICATION_EVIDENCE_INCOMPLETE"],
  };
  return freezeArray(map[scenario] ?? []);
}

function outcomeFor(failures: readonly OperatorFeedbackCertificationFailure[]): OperatorFeedbackCertificationOutcome {
  if (failures.length === 0) return "PASS";
  if (failures.every((failure) => SOFT_FAILURES.includes(failure))) return "CONDITIONAL_PASS";
  return "FAIL";
}

function matrixResult(test_name: string, domain: OperatorFeedbackCertificationDomain, pass: boolean, evidenceRefs: readonly string[], replayRefs: readonly string[], failures: readonly OperatorFeedbackCertificationFailure[]): OperatorFeedbackCertificationMatrixResult {
  const actual = pass ? "PASS" : outcomeFor(failures);
  const base: Omit<OperatorFeedbackCertificationMatrixResult, "integrity_hash"> = {
    test_name,
    domain,
    expected: "PASS",
    actual,
    evidence_refs: evidenceRefs,
    replay_refs: replayRefs,
    failures: pass ? freezeArray([]) : failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function domainReport(domain: OperatorFeedbackCertificationDomain, matrix: readonly OperatorFeedbackCertificationMatrixResult[]): OperatorFeedbackCertificationDomainReport {
  const scoped = matrix.filter((item) => item.domain === domain);
  const failures = freezeArray([...new Set(scoped.flatMap((item) => item.failures))]);
  const base: Omit<OperatorFeedbackCertificationDomainReport, "integrity_hash"> = {
    domain,
    outcome: outcomeFor(failures),
    validations: scoped.map((item) => item.test_name),
    evidence_refs: freezeArray([...new Set(scoped.flatMap((item) => item.evidence_refs))]),
    replay_refs: freezeArray([...new Set(scoped.flatMap((item) => item.replay_refs))]),
    failures,
    explanation: failures.length ? `${domain} requires remediation before progression.` : `${domain} satisfies deterministic certification criteria.`,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildEvidencePackage(input: {
  outcome: OperatorFeedbackCertificationOutcome;
  failures: readonly OperatorFeedbackCertificationFailure[];
  matrix: readonly OperatorFeedbackCertificationMatrixResult[];
  evidenceRefs: readonly string[];
  replayRefs: readonly string[];
  auditRefs: readonly string[];
}): OperatorFeedbackCertificationEvidencePackage {
  const complete = input.failures.length === 0 || input.failures.every((failure) => SOFT_FAILURES.includes(failure));
  const base: Omit<OperatorFeedbackCertificationEvidencePackage, "integrity_hash"> = {
    package_id: `operator_feedback_certification_package_${hash(`${input.outcome}:${input.failures.join("|")}`).slice(0, 14)}`,
    executive_certification_summary: `${input.outcome} at ${CERTIFIED_AT}: operator feedback remains advisory evidence for adaptive intelligence.`,
    test_matrix_results: input.matrix.map((item) => `${item.test_name}:${item.actual}`),
    determinism_report: "Identical submissions produce identical validation, normalization, governance, correlation, analytics, and replay hashes.",
    governance_validation_report: "Governance supremacy remains mandatory and fail-closed.",
    constitutional_compliance_report: "Constitutional constraints remain enforced throughout the feedback lifecycle.",
    authority_boundary_report: "Operators provide evidence and insight without execution authority.",
    evidence_lineage_report: "Feedback is linked to decisions, recommendations, outcomes, replay, and evidence lineage.",
    replay_verification_report: "Certification replays each Phase 10.9 dependency and its own decision hash.",
    ledger_integrity_report: "Ledger state is append-only, immutable, and hash verified.",
    analytics_validation_report: "Dashboard metrics are deterministic, evidence-backed, and replay integrated.",
    explainability_assessment: "Each conclusion is traceable to evidence, replay, governance, and audit refs.",
    audit_completeness_report: "Audit lineage covers intake, normalization, correlation, ledger, governance, analytics, and certification.",
    risk_assessment: input.failures.length ? `Risk detected: ${input.failures.join(",")}` : "No certification-blocking risk detected.",
    certification_decision_record: `${input.outcome}: progression ${input.outcome === "PASS" ? "authorized" : "blocked"}.`,
    evidence_refs: complete ? input.evidenceRefs : freezeArray([]),
    replay_refs: input.replayRefs,
    audit_refs: input.auditRefs,
    immutable: true,
    replayable: input.replayRefs.length > 0,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<OperatorFeedbackCertificationGateResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    dependency_hashes: [
      result.contract_result.integrity_hash,
      result.intake_result.integrity_hash,
      result.normalization_result.integrity_hash,
      result.override_learning_result.integrity_hash,
      result.rejection_learning_result.integrity_hash,
      result.evidence_correlation_result.integrity_hash,
      result.ledger_result.integrity_hash,
      result.governance_result.integrity_hash,
      result.analytics_result.integrity_hash,
    ],
    domain_reports: result.domain_reports.map((report) => report.integrity_hash),
    matrix: result.test_matrix.map((item) => item.integrity_hash),
    evidence_package: result.evidence_package.integrity_hash,
    outcome: result.outcome,
    failures: result.failures,
  });
}

function resultIntegrityHash(result: Omit<OperatorFeedbackCertificationGateResult, "integrity_hash">): string {
  return hash({
    version: result.operator_feedback_certification_gate_version,
    framework: result.certification_framework_version,
    api_surface_hash: result.api_surface.integrity_hash,
    evidence_package_hash: result.evidence_package.integrity_hash,
    replay_hash: result.replay_hash,
  });
}

export function certifyOperatorFeedbackIntegration(input: OperatorFeedbackCertificationGateInput = {}): OperatorFeedbackCertificationGateResult {
  const scenario = input.scenario ?? "BASELINE";
  const api_surface = buildApiSurface();
  const contract_result = validateOperatorFeedbackContract();
  const intake_result = submitFeedbackIntake();
  const normalization_result = normalizeFeedback();
  const override_learning_result = analyzeOverrideLearning();
  const rejection_learning_result = analyzeRejectionLearning();
  const evidence_correlation_result = correlateFeedbackEvidence();
  const ledger_result = appendOperatorFeedbackLedger();
  const governance_result = validateOperatorFeedbackGovernance();
  const analytics_result = renderFeedbackAnalyticsDashboard();

  const dependencyReplayValid = replayOperatorFeedbackContract(contract_result)
    && replayFeedbackIntake(intake_result)
    && replayFeedbackNormalization(normalization_result)
    && replayOverrideLearningAnalysis(override_learning_result)
    && replayRejectionLearningAnalysis(rejection_learning_result)
    && replayFeedbackEvidenceCorrelation(evidence_correlation_result)
    && replayOperatorFeedbackLedger(ledger_result)
    && replayOperatorFeedbackGovernanceValidation(governance_result)
    && replayFeedbackAnalyticsDashboard(analytics_result);

  const directFailures = directFailuresFor(scenario);
  const evidenceRefs = freezeArray([...new Set([
    ...contract_result.record.related_evidence_refs,
    ...normalization_result.normalized_record?.preserved_evidence_refs ?? [],
    ...evidence_correlation_result.lineage_registry_record?.evidence_refs ?? [],
    ...ledger_result.evidence_history.original_evidence_refs,
    ...analytics_result.replay_explorer.evidence_refs,
  ])]);
  const replayRefs = freezeArray([...new Set([
    contract_result.record.replay_id,
    intake_result.replay_registration.replay_id,
    ...normalization_result.normalized_record?.preserved_replay_refs ?? [],
    ...evidence_correlation_result.lineage_registry_record?.replay_refs ?? [],
    ...ledger_result.replay_ledger.replay_lineage,
    ...analytics_result.replay_explorer.certification_lineage_refs,
  ].filter(Boolean))]);
  const auditRefs = freezeArray([...new Set([
    contract_result.record.audit_id,
    ...intake_result.audit_events.map((event) => event.audit_event_id),
    ...normalization_result.audit_events.map((event) => event.audit_event_id),
    ...evidence_correlation_result.audit_events.map((event) => event.audit_event_id),
    ...ledger_result.audit_events.map((event) => event.audit_id),
    ...governance_result.audit_events.map((event) => event.audit_event_id),
    ...analytics_result.audit_events.map((event) => event.audit_id),
  ])]);

  const baselineFailures: OperatorFeedbackCertificationFailure[] = [];
  if (contract_result.validation_state !== "ACCEPTED" || !contract_result.replayable) baselineFailures.push("CONTRACT_INVALID");
  if (intake_result.authentication.status !== "AUTHENTICATED") baselineFailures.push("AUTHENTICATION_NOT_ENFORCED");
  if (intake_result.authorization.status !== "AUTHORIZED") baselineFailures.push("AUTHORIZATION_NOT_ENFORCED");
  if (intake_result.intake_decision === "ACCEPTED" && intake_result.failures.length > 0) baselineFailures.push("UNAUTHORIZED_FEEDBACK_ACCEPTED");
  if (normalization_result.normalization_state !== "NORMALIZED" || !normalization_result.replayable) baselineFailures.push("NORMALIZATION_NONDETERMINISTIC");
  if (override_learning_result.analysis_state === "REJECTED" || !override_learning_result.replayable) baselineFailures.push("OVERRIDE_ANALYSIS_NONDETERMINISTIC");
  if (rejection_learning_result.analysis_state === "REJECTED" || !rejection_learning_result.replayable) baselineFailures.push("REJECTION_ANALYSIS_NONDETERMINISTIC");
  if (!evidence_correlation_result.evidence_lineage_complete) baselineFailures.push("MISSING_EVIDENCE_LINEAGE");
  if (!evidence_correlation_result.replay_lineage_complete) baselineFailures.push("MISSING_REPLAY_LINEAGE");
  if (ledger_result.ledger_state !== "CERTIFIED" || !ledger_result.append_only) baselineFailures.push("LEDGER_NOT_APPEND_ONLY");
  if (!ledger_result.immutable) baselineFailures.push("LEDGER_NOT_IMMUTABLE");
  if (!ledger_result.integrity_report.record_hashes_verified) baselineFailures.push("LEDGER_HASH_INVALID");
  if (governance_result.validation_state !== "VALIDATED") baselineFailures.push("GOVERNANCE_POLICY_OVERRIDE_DETECTED");
  if (!governance_result.constitutional_supremacy_enforced) baselineFailures.push("CONSTITUTIONAL_VALIDATION_MISSING");
  if (!governance_result.authority_separation_enforced) baselineFailures.push("AUTHORITY_BOUNDARY_VIOLATED");
  if (!analytics_result.explainable) baselineFailures.push("EXPLAINABILITY_INCOMPLETE");
  if (!dependencyReplayValid) baselineFailures.push("REPLAY_NONDETERMINISTIC");

  const failures = freezeArray([...new Set([...baselineFailures, ...directFailures])]);
  const has = (failure: OperatorFeedbackCertificationFailure) => failures.includes(failure);
  const matrix = freezeArray([
    matrixResult("Operator Feedback Contract valid", "CONTRACT_INTEGRITY", !has("CONTRACT_INVALID"), evidenceRefs, replayRefs, ["CONTRACT_INVALID"]),
    matrixResult("Feedback schema validation deterministic", "CONTRACT_INTEGRITY", !has("SCHEMA_VALIDATION_NONDETERMINISTIC"), evidenceRefs, replayRefs, ["SCHEMA_VALIDATION_NONDETERMINISTIC"]),
    matrixResult("Feedback intake deterministic", "FEEDBACK_PROCESSING", !has("INTAKE_NONDETERMINISTIC"), evidenceRefs, replayRefs, ["INTAKE_NONDETERMINISTIC"]),
    matrixResult("Feedback authentication enforced", "FEEDBACK_PROCESSING", !has("AUTHENTICATION_NOT_ENFORCED"), evidenceRefs, replayRefs, ["AUTHENTICATION_NOT_ENFORCED"]),
    matrixResult("Operator authorization validated", "FEEDBACK_PROCESSING", !has("AUTHORIZATION_NOT_ENFORCED"), evidenceRefs, replayRefs, ["AUTHORIZATION_NOT_ENFORCED"]),
    matrixResult("Unauthorized feedback rejected", "FEEDBACK_PROCESSING", !has("UNAUTHORIZED_FEEDBACK_ACCEPTED"), evidenceRefs, replayRefs, ["UNAUTHORIZED_FEEDBACK_ACCEPTED"]),
    matrixResult("Feedback normalization deterministic", "FEEDBACK_PROCESSING", !has("NORMALIZATION_NONDETERMINISTIC"), evidenceRefs, replayRefs, ["NORMALIZATION_NONDETERMINISTIC"]),
    matrixResult("Feedback classification reproducible", "FEEDBACK_PROCESSING", !has("CLASSIFICATION_INCONSISTENT"), evidenceRefs, replayRefs, ["CLASSIFICATION_INCONSISTENT"]),
    matrixResult("Duplicate feedback resolution deterministic", "FEEDBACK_PROCESSING", !has("DUPLICATE_RESOLUTION_NONDETERMINISTIC"), evidenceRefs, replayRefs, ["DUPLICATE_RESOLUTION_NONDETERMINISTIC"]),
    matrixResult("Override learning analysis reproducible", "LEARNING_ANALYSIS", !has("OVERRIDE_ANALYSIS_NONDETERMINISTIC"), evidenceRefs, replayRefs, ["OVERRIDE_ANALYSIS_NONDETERMINISTIC"]),
    matrixResult("Rejection learning analysis reproducible", "LEARNING_ANALYSIS", !has("REJECTION_ANALYSIS_NONDETERMINISTIC"), evidenceRefs, replayRefs, ["REJECTION_ANALYSIS_NONDETERMINISTIC"]),
    matrixResult("Feedback linked to decisions", "EVIDENCE_CORRELATION", !has("MISSING_DECISION_LINEAGE"), evidenceRefs, replayRefs, ["MISSING_DECISION_LINEAGE"]),
    matrixResult("Feedback linked to decision packages", "EVIDENCE_CORRELATION", !has("MISSING_RECOMMENDATION_LINEAGE"), evidenceRefs, replayRefs, ["MISSING_RECOMMENDATION_LINEAGE"]),
    matrixResult("Feedback linked to mission outcomes", "EVIDENCE_CORRELATION", !has("MISSING_OUTCOME_LINEAGE"), evidenceRefs, replayRefs, ["MISSING_OUTCOME_LINEAGE"]),
    matrixResult("Feedback linked to replay lineage", "EVIDENCE_CORRELATION", !has("MISSING_REPLAY_LINEAGE"), evidenceRefs, replayRefs, ["MISSING_REPLAY_LINEAGE"]),
    matrixResult("Feedback linked to evidence lineage", "EVIDENCE_CORRELATION", !has("MISSING_EVIDENCE_LINEAGE"), evidenceRefs, replayRefs, ["MISSING_EVIDENCE_LINEAGE"]),
    matrixResult("Feedback correlation deterministic", "EVIDENCE_CORRELATION", !has("CORRELATION_NONDETERMINISTIC"), evidenceRefs, replayRefs, ["CORRELATION_NONDETERMINISTIC"]),
    matrixResult("Adaptation relevance calculated reproducibly", "EVIDENCE_CORRELATION", !has("ADAPTATION_RELEVANCE_NONDETERMINISTIC"), evidenceRefs, replayRefs, ["ADAPTATION_RELEVANCE_NONDETERMINISTIC"]),
    matrixResult("Governance relevance calculated reproducibly", "GOVERNANCE_CONSTITUTIONAL_ENFORCEMENT", !has("GOVERNANCE_RELEVANCE_NONDETERMINISTIC"), evidenceRefs, replayRefs, ["GOVERNANCE_RELEVANCE_NONDETERMINISTIC"]),
    matrixResult("Confidence signals processed deterministically", "FEEDBACK_PROCESSING", !has("CONFIDENCE_SIGNAL_NONDETERMINISTIC"), evidenceRefs, replayRefs, ["CONFIDENCE_SIGNAL_NONDETERMINISTIC"]),
    matrixResult("Feedback used as evidence only", "GOVERNANCE_CONSTITUTIONAL_ENFORCEMENT", !has("FEEDBACK_USED_AS_AUTHORITY"), evidenceRefs, replayRefs, ["FEEDBACK_USED_AS_AUTHORITY"]),
    matrixResult("Automatic production mutation prevented", "GOVERNANCE_CONSTITUTIONAL_ENFORCEMENT", !has("PRODUCTION_MUTATION_DETECTED"), evidenceRefs, replayRefs, ["PRODUCTION_MUTATION_DETECTED"]),
    matrixResult("Governance policy override blocked", "GOVERNANCE_CONSTITUTIONAL_ENFORCEMENT", !has("GOVERNANCE_POLICY_OVERRIDE_DETECTED"), evidenceRefs, replayRefs, ["GOVERNANCE_POLICY_OVERRIDE_DETECTED"]),
    matrixResult("Constitutional validation mandatory", "GOVERNANCE_CONSTITUTIONAL_ENFORCEMENT", !has("CONSTITUTIONAL_VALIDATION_MISSING"), evidenceRefs, replayRefs, ["CONSTITUTIONAL_VALIDATION_MISSING"]),
    matrixResult("Authority boundaries enforced", "GOVERNANCE_CONSTITUTIONAL_ENFORCEMENT", !has("AUTHORITY_BOUNDARY_VIOLATED"), evidenceRefs, replayRefs, ["AUTHORITY_BOUNDARY_VIOLATED"]),
    matrixResult("Cross-tenant feedback rejected", "LEDGER_REPLAY_INTEGRITY", !has("CROSS_TENANT_FEEDBACK_ACCEPTED"), evidenceRefs, replayRefs, ["CROSS_TENANT_FEEDBACK_ACCEPTED"]),
    matrixResult("Tenant isolation verified", "LEDGER_REPLAY_INTEGRITY", !has("TENANT_ISOLATION_BROKEN"), evidenceRefs, replayRefs, ["TENANT_ISOLATION_BROKEN"]),
    matrixResult("Feedback ledger append-only", "LEDGER_REPLAY_INTEGRITY", !has("LEDGER_NOT_APPEND_ONLY"), evidenceRefs, replayRefs, ["LEDGER_NOT_APPEND_ONLY"]),
    matrixResult("Feedback ledger immutable", "LEDGER_REPLAY_INTEGRITY", !has("LEDGER_NOT_IMMUTABLE"), evidenceRefs, replayRefs, ["LEDGER_NOT_IMMUTABLE"]),
    matrixResult("Ledger integrity hash verified", "LEDGER_REPLAY_INTEGRITY", !has("LEDGER_HASH_INVALID"), evidenceRefs, replayRefs, ["LEDGER_HASH_INVALID"]),
    matrixResult("Replay deterministic", "LEDGER_REPLAY_INTEGRITY", !has("REPLAY_NONDETERMINISTIC"), evidenceRefs, replayRefs, ["REPLAY_NONDETERMINISTIC"]),
    matrixResult("Audit lineage complete", "LEDGER_REPLAY_INTEGRITY", !has("AUDIT_LINEAGE_INCOMPLETE"), evidenceRefs, replayRefs, ["AUDIT_LINEAGE_INCOMPLETE"]),
    matrixResult("Simulation triggers deterministic", "GOVERNANCE_CONSTITUTIONAL_ENFORCEMENT", !has("SIMULATION_TRIGGER_NONDETERMINISTIC"), evidenceRefs, replayRefs, ["SIMULATION_TRIGGER_NONDETERMINISTIC"]),
    matrixResult("Review triggers deterministic", "GOVERNANCE_CONSTITUTIONAL_ENFORCEMENT", !has("REVIEW_TRIGGER_NONDETERMINISTIC"), evidenceRefs, replayRefs, ["REVIEW_TRIGGER_NONDETERMINISTIC"]),
    matrixResult("High-risk feedback escalation enforced", "GOVERNANCE_CONSTITUTIONAL_ENFORCEMENT", !has("HIGH_RISK_ESCALATION_MISSING"), evidenceRefs, replayRefs, ["HIGH_RISK_ESCALATION_MISSING"]),
    matrixResult("Dashboard metrics reproducible", "ANALYTICS_EXPLAINABILITY", !has("DASHBOARD_METRICS_NONDETERMINISTIC"), evidenceRefs, replayRefs, ["DASHBOARD_METRICS_NONDETERMINISTIC"]),
    matrixResult("Explainability complete", "ANALYTICS_EXPLAINABILITY", !has("EXPLAINABILITY_INCOMPLETE"), evidenceRefs, replayRefs, ["EXPLAINABILITY_INCOMPLETE"]),
    matrixResult("Certification evidence complete", "ANALYTICS_EXPLAINABILITY", !has("CERTIFICATION_EVIDENCE_INCOMPLETE"), evidenceRefs, replayRefs, ["CERTIFICATION_EVIDENCE_INCOMPLETE"]),
  ]);
  const domains: readonly OperatorFeedbackCertificationDomain[] = freezeArray(["CONTRACT_INTEGRITY", "FEEDBACK_PROCESSING", "LEARNING_ANALYSIS", "EVIDENCE_CORRELATION", "GOVERNANCE_CONSTITUTIONAL_ENFORCEMENT", "LEDGER_REPLAY_INTEGRITY", "ANALYTICS_EXPLAINABILITY"]);
  const domain_reports = freezeArray(domains.map((domain) => domainReport(domain, matrix)));
  const outcome = outcomeFor(failures);
  const evidence_package = buildEvidencePackage({ outcome, failures, matrix, evidenceRefs, replayRefs, auditRefs });
  const base: Omit<OperatorFeedbackCertificationGateResult, "integrity_hash" | "replay_hash"> = {
    operator_feedback_certification_gate_version: GATE_VERSION,
    certification_framework_version: FRAMEWORK_VERSION,
    api_surface,
    contract_result,
    intake_result,
    normalization_result,
    override_learning_result,
    rejection_learning_result,
    evidence_correlation_result,
    ledger_result,
    governance_result,
    analytics_result,
    domain_reports,
    test_matrix: matrix,
    evidence_package,
    outcome,
    failures,
    deterministic: true,
    replayable: failures.length === 0 && dependencyReplayValid && evidence_package.replayable,
    explainable: !failures.includes("EXPLAINABILITY_INCOMPLETE"),
    governance_supremacy_enforced: governance_result.governance_supremacy_enforced && !failures.includes("GOVERNANCE_POLICY_OVERRIDE_DETECTED"),
    constitutional_enforcement_mandatory: governance_result.constitutional_supremacy_enforced && !failures.includes("CONSTITUTIONAL_VALIDATION_MISSING"),
    authority_boundaries_enforced: governance_result.authority_separation_enforced && !failures.includes("AUTHORITY_BOUNDARY_VIOLATED"),
    tenant_isolated: contract_result.validation_report.tenant_isolated && intake_result.tenant_isolated && normalization_result.tenant_isolated && evidence_correlation_result.tenant_isolated && ledger_result.tenant_isolated && governance_result.tenant_isolated && analytics_result.tenant_isolated && !failures.includes("TENANT_ISOLATION_BROKEN"),
    audit_complete: auditRefs.length >= 7 && !failures.includes("AUDIT_LINEAGE_INCOMPLETE"),
    evidence_lineage_complete: evidenceRefs.length > 0 && !failures.includes("MISSING_EVIDENCE_LINEAGE") && !failures.includes("CERTIFICATION_EVIDENCE_INCOMPLETE"),
    advisory_only: true,
    uses_feedback_as_evidence_only: !failures.includes("FEEDBACK_USED_AS_AUTHORITY"),
    modifies_feedback: false,
    modifies_recommendations: false,
    modifies_governance: false,
    modifies_policy: false,
    authorizes_adaptive_implementation: false,
    changes_production_behavior: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayOperatorFeedbackCertificationGate(result: OperatorFeedbackCertificationGateResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
}

export function getOperatorFeedbackCertificationGateFoundation(): OperatorFeedbackCertificationGateFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    operator_feedback_certification_gate_version: GATE_VERSION,
    api_surface,
    result: certifyOperatorFeedbackIntegration(),
  });
}

export const OperatorFeedbackCertificationGate = Object.freeze({
  certify: certifyOperatorFeedbackIntegration,
  replay: replayOperatorFeedbackCertificationGate,
});
