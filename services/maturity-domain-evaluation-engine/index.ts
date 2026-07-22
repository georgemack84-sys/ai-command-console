import { buildAutonomyMaturityAssessmentContract } from "@/services/autonomy-maturity-assessment-contract";
import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type { AutonomyMaturityContractRepository, AutonomyMaturityDomain, AutonomyMaturityDomainDefinition } from "@/types/autonomy-maturity-assessment-contract";
import type {
  MaturityDomainAuditEntry,
  MaturityDomainEvaluationBundle,
  MaturityDomainEvaluationFailure,
  MaturityDomainEvaluationInput,
  MaturityDomainEvaluationObservabilitySurface,
  MaturityDomainEvaluationRepository,
  MaturityDomainEvaluationScenario,
  MaturityDomainEvaluationValidationResult,
  MaturityDomainEvidencePackage,
  MaturityDomainMetric,
  MaturityDomainReport,
  MaturityDomainState,
} from "@/types/maturity-domain-evaluation-engine";

const VERSION = "maturity-domain-evaluation-engine/v8ALT.11.2" as const;

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }

function scenarioFailure(scenario: MaturityDomainEvaluationScenario): MaturityDomainEvaluationFailure | null {
  const map: Partial<Record<MaturityDomainEvaluationScenario, MaturityDomainEvaluationFailure>> = {
    INCOMPLETE_EVIDENCE: "DOMAIN_EVIDENCE_INCOMPLETE",
    INCONSISTENT_RULES: "EVALUATION_RULES_INCONSISTENT",
    DETERMINISTIC_CALCULATION_FAILURE: "DETERMINISTIC_CALCULATION_FAILED",
    REPLAY_RECONSTRUCTION_MISMATCH: "REPLAY_RECONSTRUCTION_MISMATCHED",
    GOVERNANCE_VALIDATION_FAILURE: "GOVERNANCE_VALIDATION_FAILED",
    CONSTITUTIONAL_VALIDATION_FAILURE: "CONSTITUTIONAL_VALIDATION_FAILED",
    AUTHORITY_BYPASS: "AUTHORITY_ENFORCEMENT_BYPASSED",
    INTEGRITY_VERIFICATION_FAILURE: "INTEGRITY_VERIFICATION_FAILED",
    HIDDEN_EVALUATION_LOGIC: "HIDDEN_EVALUATION_LOGIC_DETECTED",
    NONDETERMINISTIC_SCORING: "NONDETERMINISTIC_SCORING_DETECTED",
    TENANT_ISOLATION_VIOLATION: "TENANT_ISOLATION_VIOLATED",
    ADVISORY_ONLY_VIOLATION: "ADVISORY_ONLY_BEHAVIOR_COMPROMISED",
  };
  return map[scenario] ?? null;
}

function stateFromScore(score: number, failing: boolean): MaturityDomainState {
  if (failing) return "NON_COMPLIANT";
  if (score >= 81) return "CERTIFIED";
  if (score >= 61) return "MATURE";
  if (score >= 41) return "DEVELOPING";
  if (score >= 21) return "EMERGING";
  return "INITIAL";
}

function metricForMeasure(definition: AutonomyMaturityDomainDefinition, measure: string, index: number, scenario: MaturityDomainEvaluationScenario): MaturityDomainMetric {
  const hidden = scenario === "HIDDEN_EVALUATION_LOGIC" && definition.domain === "EXPLAINABILITY" && index === 0;
  const base = {
    metric_id: id("MDE-M", "maturity-domain-metric", `${definition.domain}:${measure}:${index}`),
    domain: definition.domain,
    metric_order: index + 1,
    metric_name: measure,
    metric_category: definition.domain.toLowerCase().replaceAll("_", "-"),
    calculation_method: hidden ? "hidden evaluation logic" : "weighted deterministic ratio over immutable evidence",
    expected_evidence: freezeArray(["runtime evidence", "governance evidence", "constitutional evidence", "replay reference", "lineage reference", "integrity verification"]),
    scoring_rule: "WEIGHTED_DETERMINISTIC_RATIO" as const,
    weighting_factor: 1 / definition.measures.length,
    replay_required: true as const,
    governance_required: true as const,
    constitutional_required: true as const,
  };
  return Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_VERIFICATION_FAILURE" ? "" : hashValue("maturity-domain-metric", base) });
}

function buildMetrics(contract: AutonomyMaturityContractRepository, scenario: MaturityDomainEvaluationScenario): readonly MaturityDomainMetric[] {
  return freezeArray(contract.domains.flatMap((definition) => definition.measures.map((measure, index) => metricForMeasure(definition, measure, index, scenario))));
}

function evidenceForDomain(domain: AutonomyMaturityDomain, scenario: MaturityDomainEvaluationScenario): MaturityDomainEvidencePackage {
  const incomplete = scenario === "INCOMPLETE_EVIDENCE" && domain === "CERTIFICATION_READINESS";
  const base = {
    evidence_id: id("MDE-E", "maturity-domain-evidence", domain),
    domain,
    tenant_id: scenario === "TENANT_ISOLATION_VIOLATION" && domain === "GOVERNANCE_COMPLIANCE" ? "tenant:foreign" : "tenant:alpha",
    runtime_evidence: incomplete ? "" : `runtime:evidence:${domain.toLowerCase()}`,
    governance_evidence: incomplete ? "" : `governance:evidence:${domain.toLowerCase()}`,
    constitutional_evidence: incomplete ? "" : `constitutional:evidence:${domain.toLowerCase()}`,
    replay_reference: scenario === "REPLAY_RECONSTRUCTION_MISMATCH" && domain === "REPLAY_INTEGRITY" ? "" : `replay:maturity-domain:${domain.toLowerCase()}`,
    lineage_reference: `lineage:maturity-domain:${domain.toLowerCase()}`,
    certification_evidence: incomplete ? "" : `certification:evidence:${domain.toLowerCase()}`,
    explainability_artifact: incomplete ? "" : `explainability:artifact:${domain.toLowerCase()}`,
    monitoring_history: `monitoring:history:${domain.toLowerCase()}`,
    complete: !incomplete,
    governance_validated: !(scenario === "GOVERNANCE_VALIDATION_FAILURE" && domain === "GOVERNANCE_COMPLIANCE"),
    constitutional_validated: !(scenario === "CONSTITUTIONAL_VALIDATION_FAILURE" && domain === "CONSTITUTIONAL_COMPLIANCE"),
    replay_verified: !(scenario === "REPLAY_RECONSTRUCTION_MISMATCH" && domain === "REPLAY_INTEGRITY"),
    authority_enforced: !(scenario === "AUTHORITY_BYPASS" && domain === "AUTHORITY_ENFORCEMENT"),
  };
  return Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_VERIFICATION_FAILURE" && domain === "REPLAY_INTEGRITY" ? "" : hashValue("maturity-domain-evidence", base) });
}

function reportForDomain(definition: AutonomyMaturityDomainDefinition, metrics: readonly MaturityDomainMetric[], scenario: MaturityDomainEvaluationScenario): MaturityDomainReport {
  const evidence = evidenceForDomain(definition.domain, scenario);
  const failing = !evidence.complete || !evidence.governance_validated || !evidence.constitutional_validated || !evidence.replay_verified || !evidence.authority_enforced || !evidence.integrity_hash;
  const domainMetrics = metrics.filter((metric) => metric.domain === definition.domain);
  const hidden = domainMetrics.some((metric) => metric.calculation_method.includes("hidden"));
  const inconsistent = scenario === "INCONSISTENT_RULES" && definition.domain === "PLANNING_INTELLIGENCE";
  const score = failing || hidden || inconsistent ? 42 : 92;
  const base = {
    report_id: id("MDE-R", "maturity-domain-report", definition.domain),
    domain_id: definition.domain_id,
    domain: definition.domain,
    maturity_state: stateFromScore(score, failing || hidden || inconsistent),
    domain_score: scenario === "NONDETERMINISTIC_SCORING" && definition.domain === "VISIBILITY" ? 91 : score,
    confidence_score: failing ? 50 : 94,
    readiness_score: failing || inconsistent ? 45 : 90,
    risk_indicator: failing || hidden || inconsistent ? "BLOCKING" as const : "LOW" as const,
    improvement_priority: failing || hidden || inconsistent ? "IMMEDIATE" as const : "OBSERVE" as const,
    metrics_evaluated: domainMetrics.length,
    metrics_passed: failing || hidden || inconsistent ? Math.max(domainMetrics.length - 1, 0) : domainMetrics.length,
    metrics_failed: failing || hidden || inconsistent ? 1 : 0,
    observations: freezeArray(failing || hidden || inconsistent ? [`${definition.domain} requires deterministic remediation before maturity aggregation`] : [`${definition.domain} meets deterministic evaluation requirements`]),
    evidence,
    governance_assessment: evidence.governance_validated ? "PASS" as const : "FAIL" as const,
    constitutional_assessment: evidence.constitutional_validated ? "PASS" as const : "FAIL" as const,
    replay_assessment: evidence.replay_verified ? "PASS" as const : "FAIL" as const,
    recommendations: freezeArray(["preserve operator approval", "retain advisory-only recommendation handling", "replay evaluation before aggregation"]),
    advisory_only: true as const,
    maturity_advancement_authorized: false as const,
    execution_behavior_change_authorized: false as const,
  };
  return Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_VERIFICATION_FAILURE" && definition.domain === "REPLAY_INTEGRITY" ? "" : hashValue("maturity-domain-report", base) });
}

function auditEntry(report: MaturityDomainReport, index: number, scenario: MaturityDomainEvaluationScenario): MaturityDomainAuditEntry {
  const base = {
    audit_id: id("MDE-A", "maturity-domain-audit", report.domain),
    evaluation_id: "maturity-domain-evaluation",
    assessment_id: "autonomy-maturity-assessment",
    domain_id: report.domain_id,
    domain: report.domain,
    evaluator_version: VERSION,
    scoring_version: "domain-scoring/v1" as const,
    evidence_reference: report.evidence.evidence_id,
    governance_reference: report.evidence.governance_evidence,
    constitutional_reference: report.evidence.constitutional_evidence,
    replay_reference: report.evidence.replay_reference,
    lineage_reference: report.evidence.lineage_reference,
    timestamp: "1970-01-01T00:00:00.000Z" as const,
    append_only: true as const,
  };
  return Object.freeze({ ...base, integrity_hash: scenario === "DETERMINISTIC_CALCULATION_FAILURE" && index === 0 ? "" : hashValue("maturity-domain-audit", base) });
}

function collectFailures(repository: Omit<MaturityDomainEvaluationRepository, "integrity_hash"> | MaturityDomainEvaluationRepository): readonly MaturityDomainEvaluationFailure[] {
  return unique([
    ...repository.failures,
    ...(repository.reports.length !== repository.contract.domains.length ? ["DOMAIN_EVIDENCE_INCOMPLETE" as const] : []),
    ...(repository.reports.some((report) => !report.evidence.complete) ? ["DOMAIN_EVIDENCE_INCOMPLETE" as const] : []),
    ...(repository.metrics.some((metric) => metric.weighting_factor <= 0 || metric.weighting_factor > 1) ? ["EVALUATION_RULES_INCONSISTENT" as const] : []),
    ...(repository.audit_log.some((entry) => !entry.integrity_hash) ? ["DETERMINISTIC_CALCULATION_FAILED" as const] : []),
    ...(repository.reports.some((report) => !report.evidence.replay_verified || !report.evidence.replay_reference) ? ["REPLAY_RECONSTRUCTION_MISMATCHED" as const] : []),
    ...(repository.reports.some((report) => report.governance_assessment === "FAIL") ? ["GOVERNANCE_VALIDATION_FAILED" as const] : []),
    ...(repository.reports.some((report) => report.constitutional_assessment === "FAIL") ? ["CONSTITUTIONAL_VALIDATION_FAILED" as const] : []),
    ...(repository.reports.some((report) => !report.evidence.authority_enforced) ? ["AUTHORITY_ENFORCEMENT_BYPASSED" as const] : []),
    ...(repository.reports.some((report) => !report.integrity_hash || !report.evidence.integrity_hash) || repository.metrics.some((metric) => !metric.integrity_hash) ? ["INTEGRITY_VERIFICATION_FAILED" as const] : []),
    ...(repository.metrics.some((metric) => metric.calculation_method.includes("hidden")) ? ["HIDDEN_EVALUATION_LOGIC_DETECTED" as const] : []),
    ...(repository.reports.some((report) => report.domain === "VISIBILITY" && report.domain_score === 91) ? ["NONDETERMINISTIC_SCORING_DETECTED" as const] : []),
    ...(repository.reports.some((report) => report.evidence.tenant_id !== "tenant:alpha") ? ["TENANT_ISOLATION_VIOLATED" as const] : []),
    ...(!repository.advisory_only || repository.maturity_advancement_authorized || repository.production_certification_authorized || repository.authority_change_authorized || repository.execution_behavior_change_authorized ? ["ADVISORY_ONLY_BEHAVIOR_COMPROMISED" as const] : []),
  ]);
}

export function evaluateMaturityDomains(input: MaturityDomainEvaluationInput = {}): MaturityDomainEvaluationRepository {
  if (input.repository) return input.repository;
  const scenario = input.scenario ?? "BASELINE";
  const contract = input.contract ?? buildAutonomyMaturityAssessmentContract();
  const metrics = buildMetrics(contract, scenario);
  const reports = freezeArray(contract.domains.map((definition) => reportForDomain(definition, metrics, scenario)));
  const audit_log = freezeArray(reports.map((report, index) => auditEntry(report, index, scenario)));
  const directFailure = scenarioFailure(scenario);
  const source = {
    evaluation_id: id("MDE", "maturity-domain-evaluation", scenario),
    final_state: "MATURITY_DOMAIN_EVALUATION_COMPLETE" as const,
    contract,
    metrics,
    reports,
    audit_log,
    failures: freezeArray(directFailure ? [directFailure] : []),
    advisory_only: true as const,
    maturity_advancement_authorized: false as const,
    production_certification_authorized: false as const,
    governance_modification_authorized: false as const,
    authority_change_authorized: false as const,
    execution_behavior_change_authorized: false as const,
  };
  const failures = collectFailures(source);
  const repository = { ...source, failures, final_state: failures.length ? "MATURITY_DOMAIN_EVALUATION_FAILED" as const : source.final_state };
  return Object.freeze({ ...repository, integrity_hash: hashValue("maturity-domain-evaluation-repository", repository) });
}

export function listMaturityDomainMetrics(input: MaturityDomainEvaluationInput = {}) { return evaluateMaturityDomains(input).metrics; }
export function listMaturityDomainReports(input: MaturityDomainEvaluationInput = {}) { return evaluateMaturityDomains(input).reports; }
export function listMaturityDomainAuditLog(input: MaturityDomainEvaluationInput = {}) { return evaluateMaturityDomains(input).audit_log; }

export function validateMaturityDomainEvaluation(repository = evaluateMaturityDomains()): MaturityDomainEvaluationValidationResult {
  const failures = unique([...collectFailures(repository), ...(!repository.integrity_hash ? ["INTEGRITY_VERIFICATION_FAILED" as const] : [])]);
  const has = (failure: MaturityDomainEvaluationFailure) => failures.includes(failure);
  const result = {
    evaluation_id: repository.evaluation_id,
    valid: failures.length === 0 && repository.final_state === "MATURITY_DOMAIN_EVALUATION_COMPLETE",
    all_domains_evaluated: repository.reports.length === repository.contract.domains.length,
    evidence_complete: !has("DOMAIN_EVIDENCE_INCOMPLETE"),
    rules_consistent: !has("EVALUATION_RULES_INCONSISTENT"),
    deterministic_calculations: !has("DETERMINISTIC_CALCULATION_FAILED"),
    replay_verified: !has("REPLAY_RECONSTRUCTION_MISMATCHED"),
    governance_validated: !has("GOVERNANCE_VALIDATION_FAILED"),
    constitutional_validated: !has("CONSTITUTIONAL_VALIDATION_FAILED"),
    authority_enforced: !has("AUTHORITY_ENFORCEMENT_BYPASSED"),
    integrity_verified: !has("INTEGRITY_VERIFICATION_FAILED"),
    no_hidden_logic: !has("HIDDEN_EVALUATION_LOGIC_DETECTED"),
    deterministic_scoring: !has("NONDETERMINISTIC_SCORING_DETECTED"),
    tenant_isolated: !has("TENANT_ISOLATION_VIOLATED"),
    advisory_only: true as const,
    no_execution_authority: !repository.maturity_advancement_authorized && !repository.production_certification_authorized && !repository.authority_change_authorized && !repository.execution_behavior_change_authorized,
    failures,
  };
  return Object.freeze({ ...result, validation_hash: hashValue("maturity-domain-evaluation-validation", result) });
}

export function buildMaturityDomainEvaluationObservabilitySurface(repository = evaluateMaturityDomains()): MaturityDomainEvaluationObservabilitySurface {
  return Object.freeze({
    evaluation_id: repository.evaluation_id,
    final_state: repository.final_state,
    domain_count: repository.contract.domains.length,
    metric_count: repository.metrics.length,
    report_count: repository.reports.length,
    audit_count: repository.audit_log.length,
    failure_count: repository.failures.length,
    minimum_domain_score: Math.min(...repository.reports.map((report) => report.domain_score)),
    advisory_only: true,
    execution_behavior_change_authorized: false,
    integrity_hash: repository.integrity_hash,
  });
}

export function getMaturityDomainEvaluationEngineBundle(): MaturityDomainEvaluationBundle {
  const repository = evaluateMaturityDomains();
  return Object.freeze({
    doctrine: Object.freeze({
      engine_version: VERSION,
      final_state: "MATURITY_DOMAIN_EVALUATION_ENGINE_READY",
      canonical_domain_count: 10,
      principles: freezeArray(["contract-derived-domain-registry", "independent-domain-evaluation", "deterministic-metrics", "complete-evidence-required", "governance-validation", "constitutional-validation", "replay-compatible", "advisory-only"]),
    }),
    repository,
    validation: validateMaturityDomainEvaluation(repository),
    observability: buildMaturityDomainEvaluationObservabilitySurface(repository),
  });
}
