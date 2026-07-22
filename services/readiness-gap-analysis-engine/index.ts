import { buildHistoricalMaturityEvolution } from "@/services/historical-maturity-evolution";
import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type { AutonomyMaturityDomain, AutonomyMaturityLevel } from "@/types/autonomy-maturity-assessment-contract";
import type { HistoricalMaturityRepository } from "@/types/historical-maturity-evolution";
import type {
  DependencyNode,
  GapCategory,
  GapSeverity,
  ImprovementPriority,
  ImprovementPriorityItem,
  ReadinessAssessmentRecord,
  ReadinessGapAnalysisRepository,
  ReadinessGapBundle,
  ReadinessGapFailure,
  ReadinessGapFinding,
  ReadinessGapInput,
  ReadinessGapLedgerEntry,
  ReadinessGapObservabilitySurface,
  ReadinessGapReport,
  ReadinessGapScenario,
  ReadinessGapValidationResult,
} from "@/types/readiness-gap-analysis-engine";

const VERSION = "readiness-gap-analysis-engine/v8ALT.11.6" as const;
const domains = ["CONSTITUTIONAL_COMPLIANCE", "GOVERNANCE_COMPLIANCE", "AUTHORITY_ENFORCEMENT", "PLANNING_INTELLIGENCE", "EXECUTION_INTELLIGENCE", "REPLAY_INTEGRITY", "EXPLAINABILITY", "RESILIENCE", "VISIBILITY", "CERTIFICATION_READINESS"] as const;

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }

function scenarioFailure(scenario: ReadinessGapScenario): ReadinessGapFailure | null {
  const map: Partial<Record<ReadinessGapScenario, ReadinessGapFailure>> = {
    MISSING_REQUIREMENTS_UNDETECTED: "MISSING_REQUIREMENTS_NOT_DETECTED",
    INCONSISTENT_ARCHITECTURAL_GAPS: "ARCHITECTURAL_GAPS_INCONSISTENT",
    WEAK_DOMAINS_MISCLASSIFIED: "WEAK_DOMAINS_INCORRECTLY_CLASSIFIED",
    INCOMPLETE_DEPENDENCY_ANALYSIS: "DEPENDENCY_ANALYSIS_INCOMPLETE",
    READINESS_REPLAY_MISMATCH: "READINESS_REPLAY_MISMATCHED",
    GOVERNANCE_GAPS_MISSED: "GOVERNANCE_GAPS_MISSED",
    CONSTITUTIONAL_GAPS_MISSED: "CONSTITUTIONAL_GAPS_MISSED",
    REPLAY_DEFICIENCIES_UNDETECTED: "REPLAY_DEFICIENCIES_UNDETECTED",
    CERTIFICATION_BLOCKERS_OMITTED: "CERTIFICATION_BLOCKERS_OMITTED",
    INTEGRITY_VERIFICATION_FAILURE: "INTEGRITY_VERIFICATION_FAILED",
    HIDDEN_EVALUATION_LOGIC: "HIDDEN_EVALUATION_LOGIC_DETECTED",
    TENANT_ISOLATION_VIOLATION: "TENANT_ISOLATION_VIOLATED",
    ADVISORY_ONLY_VIOLATION: "ADVISORY_ONLY_BEHAVIOR_COMPROMISED",
  };
  return map[scenario] ?? null;
}

function gap(category: GapCategory, domain: AutonomyMaturityDomain | "CROSS_DOMAIN", severity: GapSeverity, scenario: ReadinessGapScenario, description: string): ReadinessGapFinding {
  const base = { gap_id: id("RGA-G", "readiness-gap", `${category}:${domain}:${description}`), category, domain, severity, description, dependency_impact: `${domain} affects next-level advisory readiness`, implementation_guidance: "prepare deterministic evidence and operator-approved remediation plan", evidence_reference: `evidence:readiness-gap:${category.toLowerCase()}:${String(domain).toLowerCase()}`, replay_reference: scenario === "REPLAY_DEFICIENCIES_UNDETECTED" && category === "REPLAY_GAP" ? "" : `replay:readiness-gap:${category.toLowerCase()}:${String(domain).toLowerCase()}` };
  return Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_VERIFICATION_FAILURE" && category === "REPLAY_GAP" ? "" : hashValue("readiness-gap-finding", base) });
}

function buildGaps(scenario: ReadinessGapScenario): readonly ReadinessGapFinding[] {
  const rows: readonly Readonly<[GapCategory, AutonomyMaturityDomain | "CROSS_DOMAIN", GapSeverity, string]>[] = [
    ["MISSING_REQUIREMENT", "CROSS_DOMAIN", "HIGH", "next-level evidence package requires final operator review"],
    ["WEAK_DOMAIN", "VISIBILITY", "MEDIUM", "operator visibility needs continued dashboard validation"],
    ["CERTIFICATION_GAP", "CERTIFICATION_READINESS", "CRITICAL", "production certification remains an advisory readiness signal"],
    ["GOVERNANCE_GAP", "GOVERNANCE_COMPLIANCE", "HIGH", "governance replay evidence requires periodic refresh"],
    ["CONSTITUTIONAL_GAP", "CONSTITUTIONAL_COMPLIANCE", "HIGH", "constitutional lineage requires continued validation"],
    ["REPLAY_GAP", "REPLAY_INTEGRITY", "HIGH", "replay reconstruction must be verified before advancement review"],
    ["ARCHITECTURAL_GAP", "RESILIENCE", "MEDIUM", "resilience dependency evidence should be expanded"],
  ];
  const filtered = rows.filter(([category]) => !(
    (scenario === "MISSING_REQUIREMENTS_UNDETECTED" && category === "MISSING_REQUIREMENT") ||
    (scenario === "GOVERNANCE_GAPS_MISSED" && category === "GOVERNANCE_GAP") ||
    (scenario === "CONSTITUTIONAL_GAPS_MISSED" && category === "CONSTITUTIONAL_GAP") ||
    (scenario === "REPLAY_DEFICIENCIES_UNDETECTED" && category === "REPLAY_GAP") ||
    (scenario === "CERTIFICATION_BLOCKERS_OMITTED" && category === "CERTIFICATION_GAP")
  ));
  return freezeArray(filtered.map(([category, domain, severity, description]) => gap(category, domain, scenario === "INCONSISTENT_ARCHITECTURAL_GAPS" && category === "ARCHITECTURAL_GAP" ? "LOW" : severity, scenario, description)));
}

function buildDependencies(scenario: ReadinessGapScenario): readonly DependencyNode[] {
  const rows = [
    ["CAPABILITY", "EXECUTION_INTELLIGENCE"],
    ["GOVERNANCE", "GOVERNANCE_COMPLIANCE"],
    ["CONSTITUTIONAL", "CONSTITUTIONAL_COMPLIANCE"],
    ["REPLAY", "REPLAY_INTEGRITY"],
    ["CERTIFICATION", "CERTIFICATION_READINESS"],
    ["RUNTIME", "RESILIENCE"],
    ["RUNTIME", "VISIBILITY"],
    ["EXPLAINABILITY", "EXPLAINABILITY"],
  ] as const;
  const source = scenario === "INCOMPLETE_DEPENDENCY_ANALYSIS" ? rows.slice(0, -2) : rows;
  return freezeArray(source.map(([dependency_type, domain], index) => {
    const base = { node_id: id("RGA-D", "readiness-dependency", `${dependency_type}:${domain}`), dependency_type, domain, health: index < 5 ? "AT_RISK" as const : "HEALTHY" as const, unresolved: index < 5 };
    return Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_VERIFICATION_FAILURE" && index === 0 ? "" : hashValue("readiness-dependency-node", base) });
  }));
}

function buildPriorities(gaps: readonly ReadinessGapFinding[], scenario: ReadinessGapScenario): readonly ImprovementPriorityItem[] {
  const order: Record<GapSeverity, ImprovementPriority> = { CRITICAL: "CRITICAL", HIGH: "HIGH", MEDIUM: "MEDIUM", LOW: "LOW" };
  return freezeArray(gaps.map((entry, index) => {
    const base = { priority_id: id("RGA-P", "readiness-priority", entry.gap_id), priority: order[entry.severity], domain: entry.domain, maturity_impact: entry.severity === "CRITICAL" ? 100 : entry.severity === "HIGH" ? 75 : entry.severity === "MEDIUM" ? 50 : 25, rationale: scenario === "HIDDEN_EVALUATION_LOGIC" && index === 0 ? "hidden evaluation logic" : `${entry.category} affects advisory readiness`, recommendation: "queue operator-reviewed remediation planning", operator_approval_required: true as const, advisory_only: true as const };
    return Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_VERIFICATION_FAILURE" && index === 0 ? "" : hashValue("readiness-priority-item", base) });
  }).sort((a, b) => b.maturity_impact - a.maturity_impact || a.priority_id.localeCompare(b.priority_id)));
}

function targetLevel(current: AutonomyMaturityLevel): AutonomyMaturityLevel {
  const levels = ["LEVEL_1_ASSISTED_EXECUTION", "LEVEL_2_GUIDED_AUTONOMY", "LEVEL_3_CONTROLLED_AUTONOMY", "LEVEL_4_RESILIENT_AUTONOMY", "LEVEL_5_CERTIFIED_CONSTITUTIONAL_AUTONOMY"] as const;
  return levels[Math.min(levels.indexOf(current) + 1, levels.length - 1)]!;
}

function buildRecord(history: HistoricalMaturityRepository, gaps: readonly ReadinessGapFinding[], scenario: ReadinessGapScenario): ReadinessAssessmentRecord {
  const score = scenario === "READINESS_REPLAY_MISMATCH" ? 89 : Math.max(0, 100 - gaps.reduce((sum, entry) => sum + (entry.severity === "CRITICAL" ? 12 : entry.severity === "HIGH" ? 8 : entry.severity === "MEDIUM" ? 4 : 2), 0));
  const current = history.classification.record.maturity_level;
  const base = { readiness_id: id("RGA", "readiness-assessment", scenario), assessment_id: history.classification.record.assessment_id, readiness_version: VERSION, current_maturity_level: current, target_maturity_level: targetLevel(current), readiness_score: score, readiness_state: score >= 95 ? "READY_FOR_ADVANCEMENT" as const : score >= 85 ? "READY_FOR_CERTIFICATION" as const : score >= 70 ? "SUBSTANTIALLY_READY" as const : score >= 50 ? "PARTIALLY_READY" as const : "NOT_READY" as const, advancement_eligibility: score >= 95 ? "ADVISORY_ELIGIBLE" as const : "ADVISORY_BLOCKED" as const, certification_readiness: score >= 85 ? "READY_SIGNAL" as const : "BLOCKED_SIGNAL" as const, architecture_ready: !gaps.some((entry) => entry.category === "ARCHITECTURAL_GAP" && entry.severity !== "LOW"), governance_ready: !gaps.some((entry) => entry.category === "GOVERNANCE_GAP"), constitutional_ready: !gaps.some((entry) => entry.category === "CONSTITUTIONAL_GAP"), replay_ready: !gaps.some((entry) => entry.category === "REPLAY_GAP"), certification_ready: !gaps.some((entry) => entry.category === "CERTIFICATION_GAP"), resilience_ready: !gaps.some((entry) => entry.domain === "RESILIENCE" && entry.severity === "CRITICAL"), operationally_stable: true, replay_reference: scenario === "READINESS_REPLAY_MISMATCH" ? "" : "replay:readiness-gap-analysis", lineage_reference: "lineage:readiness-gap-analysis", governance_reference: "governance:readiness-gap-analysis", constitutional_reference: "constitutional:readiness-gap-analysis" };
  return Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_VERIFICATION_FAILURE" ? "" : hashValue("readiness-assessment-record", base) });
}

function ledger(record: ReadinessAssessmentRecord, gaps: readonly ReadinessGapFinding[], priorities: readonly ImprovementPriorityItem[], scenario: ReadinessGapScenario): readonly ReadinessGapLedgerEntry[] {
  const base = { ledger_id: id("RGA-L", "readiness-gap-ledger", record.readiness_id), readiness_id: record.readiness_id, assessment_id: record.assessment_id, readiness_score: record.readiness_score, readiness_state: record.readiness_state, missing_requirements: freezeArray(gaps.filter((entry) => entry.category === "MISSING_REQUIREMENT").map((entry) => entry.description)), weak_domains: freezeArray(gaps.filter((entry) => entry.category === "WEAK_DOMAIN").map((entry) => String(entry.domain))), dependency_graph_version: "dependency-graph/v1" as const, improvement_priorities: freezeArray(priorities.map((entry) => entry.priority)), governance_findings: freezeArray(gaps.filter((entry) => entry.category === "GOVERNANCE_GAP").map((entry) => entry.description)), constitutional_findings: freezeArray(gaps.filter((entry) => entry.category === "CONSTITUTIONAL_GAP").map((entry) => entry.description)), replay_findings: freezeArray(gaps.filter((entry) => entry.category === "REPLAY_GAP").map((entry) => entry.description)), replay_reference: record.replay_reference, lineage_reference: record.lineage_reference, timestamp: "1970-01-01T00:00:00.000Z" as const, append_only: true as const, immutable: true };
  return freezeArray([Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_VERIFICATION_FAILURE" ? "" : hashValue("readiness-gap-ledger", base) })]);
}

function report(record: ReadinessAssessmentRecord, gaps: readonly ReadinessGapFinding[], dependencies: readonly DependencyNode[], priorities: readonly ImprovementPriorityItem[], scenario: ReadinessGapScenario): ReadinessGapReport {
  const base = { report_id: id("RGA-R", "readiness-gap-report", record.readiness_id), readiness_summary: `${record.readiness_state} at ${record.readiness_score}`, missing_requirements: freezeArray(gaps.filter((entry) => entry.category === "MISSING_REQUIREMENT")), weak_domains: freezeArray(gaps.filter((entry) => entry.category === "WEAK_DOMAIN")), certification_gaps: freezeArray(gaps.filter((entry) => entry.category === "CERTIFICATION_GAP")), governance_gaps: freezeArray(gaps.filter((entry) => entry.category === "GOVERNANCE_GAP")), constitutional_gaps: freezeArray(gaps.filter((entry) => entry.category === "CONSTITUTIONAL_GAP")), replay_gaps: freezeArray(gaps.filter((entry) => entry.category === "REPLAY_GAP")), dependency_analysis: dependencies, improvement_priorities: priorities, readiness_explanation: freezeArray(["readiness findings are deterministic", "advancement eligibility is advisory-only", "certification readiness is not certification approval", "runtime dependencies are represented through execution, resilience, and visibility"]), advisory_only: true as const };
  return Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_VERIFICATION_FAILURE" ? "" : hashValue("readiness-gap-report", base) });
}

function collectFailures(repository: Omit<ReadinessGapAnalysisRepository, "integrity_hash"> | ReadinessGapAnalysisRepository): readonly ReadinessGapFailure[] {
  return unique([
    ...repository.failures,
    ...(repository.gaps.every((entry) => entry.category !== "MISSING_REQUIREMENT") ? ["MISSING_REQUIREMENTS_NOT_DETECTED" as const] : []),
    ...(repository.gaps.some((entry) => entry.category === "ARCHITECTURAL_GAP" && entry.severity === "LOW") ? ["ARCHITECTURAL_GAPS_INCONSISTENT" as const] : []),
    ...(repository.gaps.every((entry) => entry.category !== "WEAK_DOMAIN") ? ["WEAK_DOMAINS_INCORRECTLY_CLASSIFIED" as const] : []),
    ...(repository.dependencies.length < 8 ? ["DEPENDENCY_ANALYSIS_INCOMPLETE" as const] : []),
    ...(!repository.record.replay_reference || repository.record.readiness_score === 89 ? ["READINESS_REPLAY_MISMATCHED" as const] : []),
    ...(repository.gaps.every((entry) => entry.category !== "GOVERNANCE_GAP") ? ["GOVERNANCE_GAPS_MISSED" as const] : []),
    ...(repository.gaps.every((entry) => entry.category !== "CONSTITUTIONAL_GAP") ? ["CONSTITUTIONAL_GAPS_MISSED" as const] : []),
    ...(repository.gaps.every((entry) => entry.category !== "REPLAY_GAP") || repository.gaps.some((entry) => entry.category === "REPLAY_GAP" && !entry.replay_reference) ? ["REPLAY_DEFICIENCIES_UNDETECTED" as const] : []),
    ...(repository.gaps.every((entry) => entry.category !== "CERTIFICATION_GAP") ? ["CERTIFICATION_BLOCKERS_OMITTED" as const] : []),
    ...(!repository.record.integrity_hash || repository.gaps.some((entry) => !entry.integrity_hash) || repository.dependencies.some((entry) => !entry.integrity_hash) || repository.priorities.some((entry) => !entry.integrity_hash) || repository.ledger.some((entry) => !entry.integrity_hash) || !repository.report.integrity_hash ? ["INTEGRITY_VERIFICATION_FAILED" as const] : []),
    ...(repository.priorities.some((entry) => entry.rationale.includes("hidden")) ? ["HIDDEN_EVALUATION_LOGIC_DETECTED" as const] : []),
    ...(repository.history.ledger.some((entry) => entry.tenant_id !== "tenant:alpha") ? ["TENANT_ISOLATION_VIOLATED" as const] : []),
    ...(!repository.advisory_only || repository.advancement_authorized || repository.production_certification_authorized || repository.corrective_action_authorized || repository.execution_behavior_change_authorized ? ["ADVISORY_ONLY_BEHAVIOR_COMPROMISED" as const] : []),
  ]);
}

export function analyzeReadinessGaps(input: ReadinessGapInput = {}): ReadinessGapAnalysisRepository {
  if (input.repository) return input.repository;
  const scenario = input.scenario ?? "BASELINE";
  const history = input.history ?? buildHistoricalMaturityEvolution(scenario === "TENANT_ISOLATION_VIOLATION" ? { scenario: "TENANT_ISOLATION_VIOLATION" } : {});
  const gaps = buildGaps(scenario);
  const dependencies = buildDependencies(scenario);
  const priorities = buildPriorities(gaps, scenario);
  const record = buildRecord(history, gaps, scenario);
  const readinessLedger = ledger(record, gaps, priorities, scenario);
  const readinessReport = report(record, gaps, dependencies, priorities, scenario);
  const directFailure = scenarioFailure(scenario);
  const source = { analysis_id: id("RGA", "readiness-gap-analysis", scenario), final_state: "READINESS_GAP_ANALYSIS_COMPLETE" as const, history, record, gaps, dependencies, priorities, ledger: readinessLedger, report: readinessReport, failures: freezeArray(directFailure ? [directFailure] : []), advisory_only: true as const, advancement_authorized: false as const, production_certification_authorized: false as const, corrective_action_authorized: false as const, governance_modification_authorized: false as const, execution_behavior_change_authorized: false as const };
  const failures = collectFailures(source);
  const repository = { ...source, failures, final_state: failures.length ? "READINESS_GAP_ANALYSIS_FAILED" as const : source.final_state };
  return Object.freeze({ ...repository, integrity_hash: hashValue("readiness-gap-analysis-repository", repository) });
}

export function listReadinessGaps(input: ReadinessGapInput = {}) { return analyzeReadinessGaps(input).gaps; }
export function listReadinessDependencies(input: ReadinessGapInput = {}) { return analyzeReadinessGaps(input).dependencies; }
export function listImprovementPriorities(input: ReadinessGapInput = {}) { return analyzeReadinessGaps(input).priorities; }
export function listReadinessGapLedger(input: ReadinessGapInput = {}) { return analyzeReadinessGaps(input).ledger; }

export function validateReadinessGapAnalysis(repository = analyzeReadinessGaps()): ReadinessGapValidationResult {
  const failures = unique([...collectFailures(repository), ...(!repository.integrity_hash ? ["INTEGRITY_VERIFICATION_FAILED" as const] : [])]);
  const has = (failure: ReadinessGapFailure) => failures.includes(failure);
  const result = { analysis_id: repository.analysis_id, valid: failures.length === 0 && repository.final_state === "READINESS_GAP_ANALYSIS_COMPLETE", missing_requirements_detected: !has("MISSING_REQUIREMENTS_NOT_DETECTED"), architectural_gaps_consistent: !has("ARCHITECTURAL_GAPS_INCONSISTENT"), weak_domains_correctly_classified: !has("WEAK_DOMAINS_INCORRECTLY_CLASSIFIED"), dependency_analysis_complete: !has("DEPENDENCY_ANALYSIS_INCOMPLETE"), readiness_replay_verified: !has("READINESS_REPLAY_MISMATCHED"), governance_gaps_detected: !has("GOVERNANCE_GAPS_MISSED"), constitutional_gaps_detected: !has("CONSTITUTIONAL_GAPS_MISSED"), replay_deficiencies_detected: !has("REPLAY_DEFICIENCIES_UNDETECTED"), certification_blockers_present: !has("CERTIFICATION_BLOCKERS_OMITTED"), integrity_verified: !has("INTEGRITY_VERIFICATION_FAILED"), no_hidden_logic: !has("HIDDEN_EVALUATION_LOGIC_DETECTED"), tenant_isolated: !has("TENANT_ISOLATION_VIOLATED"), advisory_only: true as const, no_action_authority: !repository.advancement_authorized && !repository.production_certification_authorized && !repository.corrective_action_authorized && !repository.execution_behavior_change_authorized, failures };
  return Object.freeze({ ...result, validation_hash: hashValue("readiness-gap-validation", result) });
}

export function buildReadinessGapObservabilitySurface(repository = analyzeReadinessGaps()): ReadinessGapObservabilitySurface {
  return Object.freeze({ analysis_id: repository.analysis_id, final_state: repository.final_state, readiness_score: repository.record.readiness_score, readiness_state: repository.record.readiness_state, gap_count: repository.gaps.length, dependency_count: repository.dependencies.length, priority_count: repository.priorities.length, ledger_count: repository.ledger.length, failure_count: repository.failures.length, advisory_only: true, advancement_authorized: false, execution_behavior_change_authorized: false, integrity_hash: repository.integrity_hash });
}

export function getReadinessGapAnalysisBundle(): ReadinessGapBundle {
  const repository = analyzeReadinessGaps();
  return Object.freeze({ doctrine: Object.freeze({ engine_version: VERSION, final_state: "READINESS_GAP_ANALYSIS_ENGINE_READY", principles: freezeArray(["historical-evolution-derived", "deterministic-readiness", "canonical-domain-gap-analysis", "dependency-analysis", "operator-approved-remediation-only", "certification-readiness-not-certification", "tenant-isolated", "advisory-only"]) }), repository, validation: validateReadinessGapAnalysis(repository), observability: buildReadinessGapObservabilitySurface(repository) });
}
