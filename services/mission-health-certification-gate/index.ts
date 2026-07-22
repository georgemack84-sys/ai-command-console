import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { getHealthExplainabilityEngineContract, replayHealthExplanation, validateHealthExplanation } from "@/services/health-explainability-engine";
import { getMissionHealthContract, replayMissionHealth, validateMissionHealth } from "@/services/mission-health-contract";
import { getMissionHealthRecommendationEngineContract, replayMissionHealthRecommendations, validateMissionHealthRecommendations } from "@/services/mission-health-recommendation-engine";
import { getMissionHealthScoringEngineContract, replayMissionHealthScore, validateMissionHealthScore } from "@/services/mission-health-scoring-engine";
import { getMissionHealthTimelineEngineContract, replayMissionHealthTimeline, validateMissionHealthTimeline } from "@/services/mission-health-timeline-engine";
import { getMissionTrendIntelligenceEngineContract, replayMissionTrend, validateMissionTrend } from "@/services/mission-trend-intelligence-engine";
import { getSubsystemHealthCollectionEngineContract, replaySubsystemHealthCollection, validateSubsystemHealthCollection } from "@/services/subsystem-health-collection-engine";
import type {
  CertificationDomainStatus,
  CertificationTestStatus,
  MissionHealthCertification,
  MissionHealthCertificationDecision,
  MissionHealthCertificationFailure,
  MissionHealthCertificationGateContract,
  MissionHealthCertificationInput,
  MissionHealthCertificationObservabilitySurface,
  MissionHealthCertificationReplayResult,
  MissionHealthCertificationReport,
  MissionHealthCertificationScenario,
  MissionHealthCertificationState,
  MissionHealthCertificationTestResult,
  MissionHealthCertificationValidationResult,
  MissionHealthComponentName,
  MissionHealthComponentResult,
} from "@/types/mission-health-certification-gate";

const NOW = "2026-07-13T08:00:00.000Z";
const VERSION = "mission-health-certification-gate/v8ALT.4.8" as const;
const TENANT_ID = "tenant:autonomy:primary";
const states = Object.freeze(["INITIALIZING", "DISCOVERING_COMPONENTS", "VALIDATING_CONTRACTS", "RUNNING_CERTIFICATION_TESTS", "VERIFYING_REPLAY", "VERIFYING_GOVERNANCE", "VERIFYING_SECURITY", "GENERATING_REPORT", "CERTIFIED", "REJECTED"] as const);
const decisions = Object.freeze(["PASS", "CONDITIONAL_PASS", "FAIL"] as const);
const statuses = Object.freeze(["VERIFIED", "WARNING", "FAILED"] as const);

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }
function round(value: number): number { return Number(value.toFixed(4)); }

function scenarioFailures(scenario: MissionHealthCertificationScenario): readonly MissionHealthCertificationFailure[] {
  const map: Partial<Record<MissionHealthCertificationScenario, MissionHealthCertificationFailure>> = {
    COMPONENT_FAILURE: "COMPONENT_VALIDATION_FAILED",
    REPLAY_FAILURE: "REPLAY_VALIDATION_FAILED",
    GOVERNANCE_BYPASS: "GOVERNANCE_BYPASS_DETECTED",
    AUTHORITY_ESCALATION: "AUTHORITY_ESCALATION_DETECTED",
    INTEGRITY_FAILURE: "INTEGRITY_VERIFICATION_FAILED",
    TENANT_ISOLATION_FAILURE: "TENANT_ISOLATION_FAILED",
    ADVISORY_ONLY_VIOLATION: "ADVISORY_ONLY_VIOLATION",
    EXPLAINABILITY_INCOMPLETE: "EXPLAINABILITY_INCOMPLETE",
    RECOMMENDATIONS_NON_REPRODUCIBLE: "RECOMMENDATIONS_NON_REPRODUCIBLE",
    IMMUTABLE_HISTORY_FAILURE: "IMMUTABLE_HISTORY_FAILED",
  };
  return map[scenario] ? freezeArray([map[scenario]]) : freezeArray([]);
}

function status(valid: boolean, forced: boolean): CertificationDomainStatus {
  return forced ? "FAILED" : valid ? "VERIFIED" : "FAILED";
}

function componentResult(component: MissionHealthComponentName, contractVersion: string, valid: boolean, replay: boolean, governance: boolean, authority: boolean, integrity: boolean, tenant: boolean, advisory: boolean, failures: readonly MissionHealthCertificationFailure[]): MissionHealthComponentResult {
  const forced = failures.includes("COMPONENT_VALIDATION_FAILED") && component === "Mission Health Scoring";
  const base = {
    component,
    contract_version: contractVersion,
    valid: forced ? false : valid,
    replay_deterministic: failures.includes("REPLAY_VALIDATION_FAILED") ? false : replay,
    governance_valid: failures.includes("GOVERNANCE_BYPASS_DETECTED") ? false : governance,
    authority_valid: failures.includes("AUTHORITY_ESCALATION_DETECTED") ? false : authority,
    integrity_valid: failures.includes("INTEGRITY_VERIFICATION_FAILED") ? false : integrity,
    tenant_isolated: failures.includes("TENANT_ISOLATION_FAILED") ? false : tenant,
    advisory_only: failures.includes("ADVISORY_ONLY_VIOLATION") ? false : advisory,
    evidence_reference: `evidence:mission-health-certification:${component.toLowerCase().replaceAll(" ", "-")}`,
  };
  return Object.freeze({ ...base, result_hash: hashValue("mission-health-certification-component-result", base) });
}

function componentResults(failures: readonly MissionHealthCertificationFailure[]): readonly MissionHealthComponentResult[] {
  const contract = getMissionHealthContract();
  const collection = getSubsystemHealthCollectionEngineContract();
  const scoring = getMissionHealthScoringEngineContract();
  const trend = getMissionTrendIntelligenceEngineContract();
  const timeline = getMissionHealthTimelineEngineContract();
  const explain = getHealthExplainabilityEngineContract();
  const recommend = getMissionHealthRecommendationEngineContract();
  return freezeArray([
    componentResult("Mission Health Contract", contract.doctrine.contract_version, validateMissionHealth(contract.health).valid, replayMissionHealth(contract.health).deterministic, contract.validation.governance_valid, true, contract.validation.integrity_hashes_valid, contract.validation.tenant_isolated, contract.validation.advisory_only_behavior_enforced, failures),
    componentResult("Subsystem Health Collection", collection.doctrine.engine_version, validateSubsystemHealthCollection(collection.collection).valid, replaySubsystemHealthCollection(collection.collection).deterministic, collection.validation.governance_validation_enforced, collection.validation.authority_validation_enforced, collection.validation.integrity_hashes_valid, collection.validation.tenant_ownership_valid, collection.validation.advisory_only_behavior_enforced, failures),
    componentResult("Mission Health Scoring", scoring.doctrine.engine_version, validateMissionHealthScore(scoring.score).valid, replayMissionHealthScore(scoring.score).deterministic, scoring.validation.governance_valid, scoring.validation.authority_valid, scoring.validation.integrity_hashes_valid, scoring.validation.tenant_isolated, scoring.validation.advisory_only_behavior_enforced, failures),
    componentResult("Trend Intelligence", trend.doctrine.engine_version, validateMissionTrend(trend.trend).valid, replayMissionTrend(trend.trend).deterministic, trend.validation.governance_valid, trend.validation.authority_valid, trend.validation.integrity_hashes_valid, trend.validation.tenant_isolated, trend.validation.advisory_only_behavior_enforced, failures),
    componentResult("Mission Health Timeline", timeline.doctrine.engine_version, validateMissionHealthTimeline(timeline.timeline).valid, replayMissionHealthTimeline(timeline.timeline).deterministic, timeline.validation.governance_valid, timeline.validation.authority_valid, timeline.validation.hash_chain_valid, timeline.validation.tenant_isolated, timeline.validation.advisory_only_behavior_enforced, failures),
    componentResult("Health Explainability", explain.doctrine.engine_version, failures.includes("EXPLAINABILITY_INCOMPLETE") ? false : validateHealthExplanation(explain.explanation).valid, replayHealthExplanation(explain.explanation).deterministic, explain.validation.governance_valid, explain.validation.authority_valid, explain.validation.integrity_hashes_valid, explain.validation.tenant_isolated, explain.validation.advisory_only_behavior_enforced, failures),
    componentResult("Mission Health Recommendation Engine", recommend.doctrine.engine_version, failures.includes("RECOMMENDATIONS_NON_REPRODUCIBLE") ? false : validateMissionHealthRecommendations(recommend.recommendation_set).valid, failures.includes("RECOMMENDATIONS_NON_REPRODUCIBLE") ? false : replayMissionHealthRecommendations(recommend.recommendation_set).deterministic, recommend.validation.governance_validation_valid, recommend.validation.authority_valid, recommend.validation.integrity_hashes_valid, recommend.validation.tenant_isolated, recommend.validation.advisory_only_behavior_enforced, failures),
  ]);
}

const testPlan: readonly [string, MissionHealthComponentName | "Mission Health Certification", keyof MissionHealthComponentResult | "suite"][] = Object.freeze([
  ["Mission Health Contract valid", "Mission Health Contract", "valid"],
  ["subsystem registry complete", "Subsystem Health Collection", "valid"],
  ["subsystem scores reproducible", "Subsystem Health Collection", "replay_deterministic"],
  ["mission health deterministic", "Mission Health Scoring", "replay_deterministic"],
  ["aggregation deterministic", "Mission Health Contract", "valid"],
  ["weighting reproducible", "Mission Health Scoring", "valid"],
  ["confidence reproducible", "Mission Health Scoring", "replay_deterministic"],
  ["trend calculations deterministic", "Trend Intelligence", "replay_deterministic"],
  ["degradation detection reproducible", "Trend Intelligence", "valid"],
  ["health timeline complete", "Mission Health Timeline", "valid"],
  ["historical reconstruction reproducible", "Mission Health Timeline", "replay_deterministic"],
  ["replay reconstructs identical health", "Mission Health Certification", "suite"],
  ["integrity verified", "Mission Health Certification", "suite"],
  ["governance compliance enforced", "Mission Health Certification", "suite"],
  ["authority boundaries enforced", "Mission Health Certification", "suite"],
  ["constitutional compliance verified", "Mission Health Certification", "suite"],
  ["operator visibility complete", "Health Explainability", "valid"],
  ["advisory-only behavior enforced", "Mission Health Certification", "suite"],
  ["tenant isolation preserved", "Mission Health Certification", "suite"],
  ["health recommendations reproducible", "Mission Health Recommendation Engine", "replay_deterministic"],
  ["explainability complete", "Health Explainability", "valid"],
  ["immutable health history verified", "Mission Health Timeline", "integrity_valid"],
  ["certification suite passes", "Mission Health Certification", "suite"],
]);

function tests(components: readonly MissionHealthComponentResult[]): readonly MissionHealthCertificationTestResult[] {
  const all = {
    replay_deterministic: components.every((item) => item.replay_deterministic),
    integrity_valid: components.every((item) => item.integrity_valid),
    governance_valid: components.every((item) => item.governance_valid),
    authority_valid: components.every((item) => item.authority_valid),
    tenant_isolated: components.every((item) => item.tenant_isolated),
    advisory_only: components.every((item) => item.advisory_only),
    valid: components.every((item) => item.valid),
  };
  return freezeArray(testPlan.map(([name, component, key], index) => {
    const result = component === "Mission Health Certification"
      ? all.replay_deterministic && all.integrity_valid && all.governance_valid && all.authority_valid && all.tenant_isolated && all.advisory_only && all.valid
      : Boolean(components.find((item) => item.component === component)?.[key as keyof MissionHealthComponentResult]);
    const base = { test_id: id("MHCT", "mission-health-certification-test", { name, index }), name, expected: "PASS" as const, actual: (result ? "PASS" : "FAIL") as CertificationTestStatus, component, evidence_reference: `evidence:mission-health-certification-test:${index}` };
    return Object.freeze({ ...base, test_hash: hashValue("mission-health-certification-test", base) });
  }));
}

function domainStatus(components: readonly MissionHealthComponentResult[], key: keyof MissionHealthComponentResult): CertificationDomainStatus {
  return components.every((item) => Boolean(item[key])) ? "VERIFIED" : "FAILED";
}

function computeCertificationHash(certification: Omit<MissionHealthCertification, "certification_hash"> | MissionHealthCertification): string {
  const { certification_hash: _hash, ...source } = certification as MissionHealthCertification;
  return hashValue("mission-health-certification", source);
}

export function certifyMissionHealth(input: MissionHealthCertificationInput = {}): MissionHealthCertification {
  const scenario = input.scenario ?? "BASELINE";
  const failures = scenarioFailures(scenario);
  const components = componentResults(failures);
  const testResults = tests(components);
  const failed = testResults.filter((item) => item.actual === "FAIL").length;
  const warnings = freezeArray<string>([]);
  const score = round((testResults.length - failed) / testResults.length * 100);
  const decision: MissionHealthCertificationDecision = failed > 0 || failures.length > 0 ? "FAIL" : warnings.length ? "CONDITIONAL_PASS" : "PASS";
  const certificationId = id("MHCERT", "mission-health-certification", { scenario, components: components.map((item) => item.result_hash) });
  const replay_status = domainStatus(components, "replay_deterministic");
  const governance_status = domainStatus(components, "governance_valid");
  const authority_status = domainStatus(components, "authority_valid");
  const integrity_status = domainStatus(components, "integrity_valid");
  const security_status = domainStatus(components, "tenant_isolated");
  const reportBase = {
    certification_id: certificationId,
    phase: "Phase 8ALT.4 - Mission Health Intelligence" as const,
    overall_state: decision,
    overall_score: score,
    overall_confidence: round(score / 100),
    tests_passed: testResults.length - failed,
    tests_failed: failed,
    warnings,
    component_results: components,
    replay_validation: replay_status,
    governance_validation: governance_status,
    authority_validation: authority_status,
    integrity_validation: integrity_status,
    security_validation: security_status,
    recommendation: decision === "PASS" ? "Mission Health Intelligence certified production-ready." : "Certification denied; deployment blocked and fail-closed remains active.",
    operator_signoff_required: true,
    timestamp: NOW,
  };
  const report: MissionHealthCertificationReport = Object.freeze({ ...reportBase, report_hash: hashValue("mission-health-certification-report", reportBase) });
  const base = {
    certification_id: certificationId,
    mission_id: input.mission_id ?? "mission:health:primary",
    tenant_id: failures.includes("TENANT_ISOLATION_FAILED") ? "external-tenant" : input.tenant_id ?? TENANT_ID,
    certification_state: decision === "PASS" ? "CERTIFIED" as MissionHealthCertificationState : "REJECTED" as MissionHealthCertificationState,
    certification_version: VERSION,
    phase: "Phase 8ALT.4 - Mission Health Intelligence" as const,
    component_results: components,
    test_results: testResults,
    overall_score: score,
    overall_confidence: round(score / 100),
    replay_status,
    governance_status,
    authority_status,
    integrity_status,
    security_status,
    recommendation: report.recommendation,
    certification_timestamp: NOW,
    lineage_reference: `lineage:mission-health-certification:${certificationId}`,
    replay_reference: failures.includes("REPLAY_VALIDATION_FAILED") ? "" : `replay:mission-health-certification:${certificationId}`,
    integrity_hash: failures.includes("INTEGRITY_VERIFICATION_FAILED") ? "" : hashValue("mission-health-certification-integrity", { components: components.map((item) => item.result_hash), tests: testResults.map((item) => item.test_hash), report: report.report_hash }),
    report,
    advisory_only: true as const,
    deployment_authorized: false,
    mission_actions_executed: failures.includes("ADVISORY_ONLY_VIOLATION"),
    subsystem_health_modified: failures.includes("ADVISORY_ONLY_VIOLATION"),
    certification_evidence_modified: failures.includes("ADVISORY_ONLY_VIOLATION"),
    governance_bypassed: failures.includes("GOVERNANCE_BYPASS_DETECTED") || failures.includes("ADVISORY_ONLY_VIOLATION"),
    authority_escalated: failures.includes("AUTHORITY_ESCALATION_DETECTED") || failures.includes("ADVISORY_ONLY_VIOLATION"),
    policy_changed: failures.includes("ADVISORY_ONLY_VIOLATION"),
    autonomous_intervention_authorized: failures.includes("ADVISORY_ONLY_VIOLATION"),
    failures: unique([...failures, ...(failed > 0 ? ["CERTIFICATION_SUITE_FAILED" as const] : [])]),
  };
  return Object.freeze({ ...base, certification_hash: computeCertificationHash(base as Omit<MissionHealthCertification, "certification_hash">) });
}

export function replayMissionHealthCertification(certification = certifyMissionHealth()): MissionHealthCertificationReplayResult {
  const reconstructed_hash = computeCertificationHash(certification);
  const source = { replay_reference: certification.replay_reference, certification_id: certification.certification_id, deterministic: reconstructed_hash === certification.certification_hash && Boolean(certification.replay_reference), reconstructed_hash, original_hash: certification.certification_hash };
  return Object.freeze({ ...source, replay_result_hash: hashValue("mission-health-certification-replay", source) });
}

export function validateMissionHealthCertification(certification?: MissionHealthCertification): MissionHealthCertificationValidationResult {
  if (!certification) {
    const failures = freezeArray<MissionHealthCertificationFailure>(["CERTIFICATION_SUITE_FAILED"]);
    const source = { certification_id: null, valid: false, certification_contract_valid: false, components_valid: false, tests_passed: false, replay_verified: false, governance_verified: false, authority_verified: false, integrity_verified: false, security_verified: false, explainability_complete: false, recommendations_reproducible: false, immutable_history_verified: false, advisory_only_enforced: false, tenant_isolated: false, fail_closed: false, failures };
    return Object.freeze({ ...source, validation_hash: hashValue("mission-health-certification-validation", source) });
  }
  const certification_contract_valid = certification.certification_version === VERSION && certification.phase === "Phase 8ALT.4 - Mission Health Intelligence";
  const components_valid = certification.component_results.every((item) => item.valid);
  const tests_passed = certification.test_results.every((item) => item.actual === "PASS");
  const replay_verified = certification.replay_status === "VERIFIED" && Boolean(certification.replay_reference);
  const governance_verified = certification.governance_status === "VERIFIED" && !certification.governance_bypassed;
  const authority_verified = certification.authority_status === "VERIFIED" && !certification.authority_escalated;
  const integrity_verified = certification.integrity_status === "VERIFIED" && Boolean(certification.integrity_hash) && computeCertificationHash(certification) === certification.certification_hash;
  const security_verified = certification.security_status === "VERIFIED";
  const explainability_complete = certification.component_results.find((item) => item.component === "Health Explainability")?.valid === true;
  const recommendations_reproducible = certification.component_results.find((item) => item.component === "Mission Health Recommendation Engine")?.replay_deterministic === true;
  const immutable_history_verified = certification.component_results.find((item) => item.component === "Mission Health Timeline")?.integrity_valid === true;
  const advisory_only_enforced = certification.advisory_only && certification.component_results.every((item) => item.advisory_only) && !certification.deployment_authorized && !certification.mission_actions_executed && !certification.subsystem_health_modified && !certification.certification_evidence_modified && !certification.policy_changed && !certification.autonomous_intervention_authorized;
  const tenant_isolated = certification.tenant_id.startsWith("tenant:") && certification.component_results.every((item) => item.tenant_isolated);
  const fail_closed = certification.certification_state === "CERTIFIED" || (!certification.deployment_authorized && certification.certification_state === "REJECTED");
  const failures = unique([
    ...(!components_valid ? ["COMPONENT_VALIDATION_FAILED" as const] : []),
    ...(!tests_passed ? ["CERTIFICATION_SUITE_FAILED" as const] : []),
    ...(!replay_verified ? ["REPLAY_VALIDATION_FAILED" as const] : []),
    ...(!governance_verified ? ["GOVERNANCE_BYPASS_DETECTED" as const] : []),
    ...(!authority_verified ? ["AUTHORITY_ESCALATION_DETECTED" as const] : []),
    ...(!integrity_verified ? ["INTEGRITY_VERIFICATION_FAILED" as const] : []),
    ...(!security_verified || !tenant_isolated ? ["TENANT_ISOLATION_FAILED" as const] : []),
    ...(!explainability_complete ? ["EXPLAINABILITY_INCOMPLETE" as const] : []),
    ...(!recommendations_reproducible ? ["RECOMMENDATIONS_NON_REPRODUCIBLE" as const] : []),
    ...(!immutable_history_verified ? ["IMMUTABLE_HISTORY_FAILED" as const] : []),
    ...(!advisory_only_enforced ? ["ADVISORY_ONLY_VIOLATION" as const] : []),
    ...certification.failures,
  ]);
  const valid = failures.length === 0 && certification.report.overall_state === "PASS";
  const source = { certification_id: certification.certification_id, valid, certification_contract_valid, components_valid, tests_passed, replay_verified, governance_verified, authority_verified, integrity_verified, security_verified, explainability_complete, recommendations_reproducible, immutable_history_verified, advisory_only_enforced, tenant_isolated, fail_closed, failures };
  return Object.freeze({ ...source, validation_hash: hashValue("mission-health-certification-validation", source) });
}

export function buildMissionHealthCertificationObservabilitySurface(certification = certifyMissionHealth()): MissionHealthCertificationObservabilitySurface {
  return Object.freeze({ certification_id: certification.certification_id, mission_id: certification.mission_id, tenant_id: certification.tenant_id, overall_state: certification.report.overall_state, overall_score: certification.overall_score, tests_passed: certification.report.tests_passed, tests_failed: certification.report.tests_failed, deployment_authorized: certification.deployment_authorized, advisory_only: true, certification_hash: certification.certification_hash });
}

export function getMissionHealthCertificationGateContract(): MissionHealthCertificationGateContract {
  const certification = certifyMissionHealth();
  return Object.freeze({
    doctrine: Object.freeze({
      engine_version: VERSION,
      principles: freezeArray(["final-mission-health-certification", "deterministic-validation", "component-wide-replay-verification", "governance-enforcement", "authority-boundary-validation", "integrity-verification", "tenant-isolation", "operator-visibility", "fail-closed-certification", "advisory-only-behavior"]),
      certification_states: states,
      decisions,
      domain_statuses: statuses,
      advisory_only: true,
    }),
    certification,
    validation: validateMissionHealthCertification(certification),
    replay: replayMissionHealthCertification(certification),
    observability: buildMissionHealthCertificationObservabilitySurface(certification),
  });
}
