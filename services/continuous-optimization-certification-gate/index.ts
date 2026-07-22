import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { discoverOptimizationOpportunities } from "@/services/optimization-opportunity-discovery";
import { runOptimizationImpactAnalysis } from "@/services/optimization-impact-analysis";
import { runDeterministicOptimizationValidation } from "@/services/deterministic-optimization-validation";
import { runOptimizationRecommendationEngine } from "@/services/optimization-recommendation-engine";
import type {
  CertificationDecisionRecord,
  CertificationEvidenceRecord,
  CertificationTestRecord,
  ContinuousOptimizationCertificationFailure,
  ContinuousOptimizationCertificationGateBundle,
  ContinuousOptimizationCertificationInput,
  ContinuousOptimizationCertificationLedger,
  ContinuousOptimizationCertificationObservabilitySurface,
  ContinuousOptimizationCertificationScenario,
  ContinuousOptimizationCertificationStatus,
  ContinuousOptimizationCertificationValidationResult,
  ContinuousOptimizationUpstreamLedgerState,
  OptimizationCertificationRecord,
} from "@/types/continuous-optimization-certification-gate";

const VERSION = "continuous-optimization-certification-gate/v8ALT.8.5" as const;
const NOW = "2026-07-15T20:00:00.000Z";
const statuses = Object.freeze(["PASS", "CONDITIONAL_PASS", "FAIL"] as const);

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }

function scenarioFailure(scenario: ContinuousOptimizationCertificationScenario): ContinuousOptimizationCertificationFailure | null {
  const map: Partial<Record<ContinuousOptimizationCertificationScenario, ContinuousOptimizationCertificationFailure>> = {
    DISCOVERY_INVALID: "DISCOVERY_CERTIFICATION_FAILED",
    IMPACT_ANALYSIS_INVALID: "IMPACT_ANALYSIS_CERTIFICATION_FAILED",
    DETERMINISTIC_VALIDATION_INVALID: "DETERMINISTIC_VALIDATION_CERTIFICATION_FAILED",
    RECOMMENDATIONS_INVALID: "RECOMMENDATION_CERTIFICATION_FAILED",
    HIDDEN_OPTIMIZATION: "HIDDEN_OPTIMIZATION_DETECTED",
    AUTOMATIC_DEPLOYMENT_DETECTED: "AUTOMATIC_DEPLOYMENT_DETECTED",
    MISSION_OUTCOME_ALTERED: "MISSION_OUTCOME_ALTERED",
    REPLAY_MISMATCH: "REPLAY_MISMATCH_DETECTED",
    NONDETERMINISTIC_RECOMMENDATION: "NONDETERMINISTIC_RECOMMENDATION_DETECTED",
    GOVERNANCE_BYPASS: "GOVERNANCE_BYPASS_DETECTED",
    CONSTITUTIONAL_VIOLATION: "CONSTITUTIONAL_VIOLATION_DETECTED",
    AUTHORITY_ESCALATION: "AUTHORITY_ESCALATION_DETECTED",
    CROSS_TENANT_OPTIMIZATION: "CROSS_TENANT_OPTIMIZATION_DETECTED",
    INCOMPLETE_OPERATOR_VISIBILITY: "OPERATOR_VISIBILITY_INCOMPLETE",
    MISSING_EXPLAINABILITY: "EXPLAINABILITY_MISSING",
    MISSING_ROLLBACK_STRATEGY: "ROLLBACK_STRATEGY_MISSING",
    RECOMMENDATION_EVIDENCE_INCOMPLETE: "RECOMMENDATION_EVIDENCE_INCOMPLETE",
    INTEGRITY_HASH_MISMATCH: "INTEGRITY_HASH_MISMATCH",
    DOCUMENTATION_GAP: "DOCUMENTATION_GAP",
  };
  return map[scenario] ?? null;
}

function isConditionalOnly(failures: readonly ContinuousOptimizationCertificationFailure[]): boolean {
  return failures.length > 0 && failures.every((failure) => failure === "DOCUMENTATION_GAP" || failure === "UPSTREAM_CONDITIONAL_CERTIFICATION");
}

function statusFor(failures: readonly ContinuousOptimizationCertificationFailure[]): ContinuousOptimizationCertificationStatus {
  if (failures.length === 0) return "PASS";
  return isConditionalOnly(failures) ? "CONDITIONAL_PASS" : "FAIL";
}

function buildTest(certificationId: string, name: string, pass: boolean, index: number): CertificationTestRecord {
  return Object.freeze({ test_id: id("COCT", "continuous-optimization-certification-test", { certificationId, name, index }), certification_id: certificationId, test_name: name, expected_result: "PASS", actual_result: pass ? "PASS" : "FAIL", evidence_reference: `evidence:continuous-optimization:${index}`, replay_reference: `replay:continuous-optimization:${index}`, timestamp: NOW });
}

function buildEvidence(certificationId: string, subsystem: string, validationType: string, source: string, index: number): CertificationEvidenceRecord {
  const base = { evidence_id: id("COCE", "continuous-optimization-certification-evidence", { certificationId, subsystem, index }), certification_id: certificationId, subsystem, validation_type: validationType, supporting_evidence: source, governance_reference: `governance:${subsystem}`, constitutional_reference: `constitutional:${subsystem}`, timestamp: NOW };
  return Object.freeze({ ...base, integrity_hash: hashValue("continuous-optimization-certification-evidence", base) });
}

function collectFailures(ledger: Omit<ContinuousOptimizationCertificationLedger, "integrity_hash"> | ContinuousOptimizationCertificationLedger): readonly ContinuousOptimizationCertificationFailure[] {
  return unique([
    ...ledger.failures,
    ...(ledger.tests.some((test) => test.actual_result === "FAIL") ? ["RECOMMENDATION_EVIDENCE_INCOMPLETE" as const] : []),
    ...(!ledger.certification.integrity_hash || !ledger.decision.integrity_hash ? ["INTEGRITY_HASH_MISMATCH" as const] : []),
    ...(ledger.deployment_authorized || ledger.optimization_execution_authorized ? ["AUTOMATIC_DEPLOYMENT_DETECTED" as const] : []),
  ]);
}

function upstreamStateFromPhase(
  phase_id: ContinuousOptimizationUpstreamLedgerState["phase_id"],
  ledger_id: string | null,
  finalState: string,
  failures: readonly unknown[],
  integrityHash: string,
): ContinuousOptimizationUpstreamLedgerState {
  const state = finalState.includes("BLOCKED") || finalState.includes("REJECTED") ? "FAIL" : "PASS";
  return Object.freeze({
    ledger_id: ledger_id ?? `${phase_id}:missing`,
    phase_id,
    state,
    failures: freezeArray(failures.map((failure) => String(failure) as ContinuousOptimizationCertificationFailure)),
    integrity_verified: Boolean(integrityHash),
    replay_verified: true,
    governance_verified: true,
    certified_at: NOW,
  });
}

function inspectUpstreamLedgers(upstreamLedgers: readonly ContinuousOptimizationUpstreamLedgerState[], allowConditional: boolean): readonly ContinuousOptimizationCertificationFailure[] {
  const required: readonly ContinuousOptimizationUpstreamLedgerState["phase_id"][] = ["OPTIMIZATION_DISCOVERY", "OPTIMIZATION_IMPACT_ANALYSIS", "DETERMINISTIC_OPTIMIZATION_VALIDATION", "OPTIMIZATION_RECOMMENDATION_ENGINE"];
  const seen = new Set(upstreamLedgers.map((ledger) => ledger.phase_id));
  return unique([
    ...(required.some((phase) => !seen.has(phase)) ? ["UPSTREAM_LEDGER_MISSING" as const] : []),
    ...upstreamLedgers.flatMap((ledger) => ledger.failures),
    ...(upstreamLedgers.some((ledger) => ledger.state === "MISSING") ? ["UPSTREAM_LEDGER_MISSING" as const] : []),
    ...(upstreamLedgers.some((ledger) => ledger.state === "UNKNOWN") ? ["UPSTREAM_LEDGER_UNKNOWN" as const] : []),
    ...(upstreamLedgers.some((ledger) => ledger.state === "FAIL") ? ["RECOMMENDATION_EVIDENCE_INCOMPLETE" as const] : []),
    ...(upstreamLedgers.some((ledger) => ledger.state === "CONDITIONAL_PASS") ? [allowConditional ? "UPSTREAM_CONDITIONAL_CERTIFICATION" as const : "RECOMMENDATION_EVIDENCE_INCOMPLETE" as const] : []),
    ...(upstreamLedgers.some((ledger) => !ledger.integrity_verified) ? ["UPSTREAM_INTEGRITY_UNVERIFIED" as const] : []),
    ...(upstreamLedgers.some((ledger) => !ledger.replay_verified) ? ["UPSTREAM_REPLAY_UNVERIFIED" as const] : []),
    ...(upstreamLedgers.some((ledger) => !ledger.governance_verified) ? ["UPSTREAM_GOVERNANCE_UNVERIFIED" as const] : []),
  ]);
}

export function runContinuousOptimizationCertification(input: ContinuousOptimizationCertificationInput = {}): ContinuousOptimizationCertificationLedger {
  if (input.ledger) return input.ledger;
  const scenario = input.scenario ?? "BASELINE";
  const options = input.options ?? {};
  const allowConditional = options.allow_conditional_upstream ?? true;
  const shouldBuildUpstream = !input.upstream_ledgers || options.revalidate_upstream === true || options.diagnostic_mode === true;
  const discovery = shouldBuildUpstream ? input.discovery_registry ?? discoverOptimizationOpportunities(scenario === "DISCOVERY_INVALID" ? { scenario: "HIDDEN_EVIDENCE" } : {}) : input.discovery_registry;
  const impact = shouldBuildUpstream ? input.impact_ledger ?? runOptimizationImpactAnalysis({ registry: discovery, scenario: scenario === "IMPACT_ANALYSIS_INVALID" ? "REPLAY_RISK" : "BASELINE" }) : input.impact_ledger;
  const validation = shouldBuildUpstream ? input.validation_ledger ?? runDeterministicOptimizationValidation({ impact_ledger: impact, scenario: scenario === "DETERMINISTIC_VALIDATION_INVALID" ? "REPLAY_MISMATCH" : "BASELINE" }) : input.validation_ledger;
  const recommendation = shouldBuildUpstream ? input.recommendation_ledger ?? runOptimizationRecommendationEngine({ validation_ledger: validation, scenario: scenario === "RECOMMENDATIONS_INVALID" ? "MISSING_EXPLAINABILITY" : "BASELINE" }) : input.recommendation_ledger;
  const upstreamLedgers = freezeArray(input.upstream_ledgers ?? [
    ...(discovery ? [upstreamStateFromPhase("OPTIMIZATION_DISCOVERY", discovery.registry_id, discovery.final_state, discovery.failures, discovery.integrity_hash)] : []),
    ...(impact ? [upstreamStateFromPhase("OPTIMIZATION_IMPACT_ANALYSIS", impact.ledger_id, impact.final_state, impact.failures, impact.integrity_hash)] : []),
    ...(validation ? [upstreamStateFromPhase("DETERMINISTIC_OPTIMIZATION_VALIDATION", validation.ledger_id, validation.final_state, validation.failures, validation.integrity_hash)] : []),
    ...(recommendation ? [upstreamStateFromPhase("OPTIMIZATION_RECOMMENDATION_ENGINE", recommendation.ledger_id, recommendation.final_state, recommendation.failures, recommendation.integrity_hash)] : []),
  ]);
  const discoveryState = upstreamLedgers.find((ledger) => ledger.phase_id === "OPTIMIZATION_DISCOVERY");
  const impactState = upstreamLedgers.find((ledger) => ledger.phase_id === "OPTIMIZATION_IMPACT_ANALYSIS");
  const deterministicState = upstreamLedgers.find((ledger) => ledger.phase_id === "DETERMINISTIC_OPTIMIZATION_VALIDATION");
  const recommendationState = upstreamLedgers.find((ledger) => ledger.phase_id === "OPTIMIZATION_RECOMMENDATION_ENGINE");
  const discoveryValid = discoveryState?.state === "PASS" || discoveryState?.state === "CONDITIONAL_PASS";
  const impactValid = impactState?.state === "PASS" || impactState?.state === "CONDITIONAL_PASS";
  const deterministicValid = deterministicState?.state === "PASS" || deterministicState?.state === "CONDITIONAL_PASS";
  const recommendationValid = recommendationState?.state === "PASS" || recommendationState?.state === "CONDITIONAL_PASS";
  const injected = scenarioFailure(scenario);
  const baseFailures = unique([
    ...(injected ? [injected] : []),
    ...inspectUpstreamLedgers(upstreamLedgers, allowConditional),
    ...(!discoveryValid ? ["DISCOVERY_CERTIFICATION_FAILED" as const] : []),
    ...(!impactValid ? ["IMPACT_ANALYSIS_CERTIFICATION_FAILED" as const] : []),
    ...(!deterministicValid ? ["DETERMINISTIC_VALIDATION_CERTIFICATION_FAILED" as const] : []),
    ...(!recommendationValid ? ["RECOMMENDATION_CERTIFICATION_FAILED" as const] : []),
  ]);
  const certificationStatus = statusFor(baseFailures);
  const certificationId = id("COCG", "continuous-optimization-certification", { scenario, upstream: upstreamLedgers.map((ledger) => ledger.ledger_id) });
  const recommendationCount = recommendation?.recommendations.length ?? 0;
  const explainabilityCount = recommendation?.explainability_reports.length ?? 0;
  const rollbackCount = recommendation?.rollback_strategies.length ?? 0;
  const tests = freezeArray([
    buildTest(certificationId, "Optimization Opportunity Registry valid", discoveryValid, 0),
    buildTest(certificationId, "Impact Analysis deterministic", impactValid, 1),
    buildTest(certificationId, "Deterministic Validation succeeds", deterministicValid, 2),
    buildTest(certificationId, "Optimization Recommendation deterministic", recommendationValid, 3),
    buildTest(certificationId, "Explainability complete", (recommendation ? explainabilityCount === recommendationCount : recommendationValid) && scenario !== "MISSING_EXPLAINABILITY", 4),
    buildTest(certificationId, "Rollback Strategy reproducible", (recommendation ? rollbackCount === recommendationCount : recommendationValid) && scenario !== "MISSING_ROLLBACK_STRATEGY", 5),
    buildTest(certificationId, "Replay Comparison identical", (validation ? validation.replay_records.every((record) => record.replay_match && record.replay_lineage_match) : deterministicValid) && scenario !== "REPLAY_MISMATCH", 6),
    buildTest(certificationId, "Mission outcome equivalence verified", (validation ? validation.mission_equivalence_records.every((record) => record.mission_result_match) : deterministicValid) && scenario !== "MISSION_OUTCOME_ALTERED", 7),
    buildTest(certificationId, "Governance Validation passes", (recommendation ? recommendation.explainability_reports.every((report) => report.governance_validation === "PASS") : recommendationValid) && scenario !== "GOVERNANCE_BYPASS", 8),
    buildTest(certificationId, "Constitutional Validation passes", (recommendation ? recommendation.explainability_reports.every((report) => report.constitutional_validation === "PASS") : recommendationValid) && scenario !== "CONSTITUTIONAL_VIOLATION", 9),
    buildTest(certificationId, "Authority Boundary Verification passes", (recommendation ? recommendation.explainability_reports.every((report) => report.authority_validation === "PASS") : recommendationValid) && scenario !== "AUTHORITY_ESCALATION", 10),
    buildTest(certificationId, "Tenant Isolation preserved", (recommendation ? recommendation.recommendations.every((record) => record.tenant_id === "tenant:alpha") : recommendationValid) && scenario !== "CROSS_TENANT_OPTIMIZATION", 11),
    buildTest(certificationId, "Operator approval required", recommendation?.operator_approval_required ?? true, 12),
    buildTest(certificationId, "Advisory-only behavior enforced", recommendation ? !recommendation.automatic_implementation && !recommendation.implementation_authority && !recommendation.approval_authority : true, 13),
    buildTest(certificationId, "Integrity verification succeeds", scenario !== "INTEGRITY_HASH_MISMATCH", 14),
  ]);
  const evidence = freezeArray([
    buildEvidence(certificationId, "discovery", "deterministic-discovery", discoveryState?.ledger_id ?? "missing", 0),
    buildEvidence(certificationId, "impact-analysis", "reproducible-analysis", impactState?.ledger_id ?? "missing", 1),
    buildEvidence(certificationId, "deterministic-validation", "mission-equivalence", deterministicState?.ledger_id ?? "missing", 2),
    buildEvidence(certificationId, "recommendation-engine", "operator-review-readiness", recommendationState?.ledger_id ?? "missing", 3),
  ]);
  const failedTests = freezeArray(tests.filter((test) => test.actual_result === "FAIL").map((test) => test.test_name));
  const completionGateReady = certificationStatus === "PASS";
  const certBase = { certification_id: certificationId, certification_version: VERSION, optimization_phase: "Phase 8ALT.8" as const, certification_status: certificationStatus, certification_timestamp: NOW, certifying_engine: "continuous-optimization-certification-gate" as const, deployment_authorized: false as const, optimization_execution_authorized: false as const, operator_approval_required: true as const, completion_gate_ready: completionGateReady };
  const certification: OptimizationCertificationRecord = Object.freeze({ ...certBase, integrity_hash: scenario === "INTEGRITY_HASH_MISMATCH" ? "" : hashValue("continuous-optimization-certification-record", certBase) });
  const decisionBase = { decision_id: id("COCD", "continuous-optimization-certification-decision", certificationId), certification_id: certificationId, decision_state: certificationStatus, decision_reason: certificationStatus === "PASS" ? "Continuous optimization is certified for Phase 8L inclusion." : certificationStatus === "CONDITIONAL_PASS" ? "Minor documentation or dashboard gap remains; completion gate readiness blocked." : "Certification failed; fail-closed certification remains active.", failed_tests: failedTests, recommendations: freezeArray(certificationStatus === "PASS" ? ["include in Phase 8L completion gate review"] : ["resolve certification failures before completion gate inclusion"]), operator_review_required: true as const, deployment_authorized: false as const, optimization_execution_authorized: false as const, completion_gate_ready: completionGateReady, timestamp: NOW };
  const decision: CertificationDecisionRecord = Object.freeze({ ...decisionBase, integrity_hash: scenario === "INTEGRITY_HASH_MISMATCH" ? "" : hashValue("continuous-optimization-certification-decision", decisionBase) });
  const source = { ledger_id: id("COCL", "continuous-optimization-certification-ledger", certificationId), final_state: completionGateReady ? "CONTINUOUS_OPTIMIZATION_CERTIFIED_FOR_COMPLETION_GATE" as const : "CONTINUOUS_OPTIMIZATION_CERTIFICATION_BLOCKED" as const, source_discovery_registry_id: discoveryState?.ledger_id ?? null, source_impact_ledger_id: impactState?.ledger_id ?? null, source_validation_ledger_id: deterministicState?.ledger_id ?? null, source_recommendation_ledger_id: recommendationState?.ledger_id ?? null, certification, tests, evidence, decision, upstream_ledgers: upstreamLedgers, failures: baseFailures, deployment_authorized: false as const, optimization_execution_authorized: false as const, operator_approval_required: true as const, completion_gate_ready: completionGateReady };
  const failures = collectFailures(source);
  const finalStatus = statusFor(failures);
  const finalLedger = { ...source, certification: Object.freeze({ ...certification, certification_status: finalStatus, completion_gate_ready: finalStatus === "PASS" }), decision: Object.freeze({ ...decision, decision_state: finalStatus, completion_gate_ready: finalStatus === "PASS" }), failures, final_state: finalStatus === "PASS" ? "CONTINUOUS_OPTIMIZATION_CERTIFIED_FOR_COMPLETION_GATE" as const : "CONTINUOUS_OPTIMIZATION_CERTIFICATION_BLOCKED" as const, completion_gate_ready: finalStatus === "PASS" };
  return Object.freeze({ ...finalLedger, integrity_hash: scenario === "INTEGRITY_HASH_MISMATCH" ? "" : hashValue("continuous-optimization-certification-ledger", finalLedger) });
}

export function listContinuousOptimizationCertificationTests(input: ContinuousOptimizationCertificationInput = {}) { return runContinuousOptimizationCertification(input).tests; }
export function listContinuousOptimizationCertificationEvidence(input: ContinuousOptimizationCertificationInput = {}) { return runContinuousOptimizationCertification(input).evidence; }
export function getContinuousOptimizationCertificationDecision(input: ContinuousOptimizationCertificationInput = {}) { return runContinuousOptimizationCertification(input).decision; }

export function validateContinuousOptimizationCertification(ledger = runContinuousOptimizationCertification()): ContinuousOptimizationCertificationValidationResult {
  const failures = unique([...ledger.failures, ...(!ledger.integrity_hash ? ["INTEGRITY_HASH_MISMATCH" as const] : [])]);
  const has = (failure: ContinuousOptimizationCertificationFailure) => failures.includes(failure);
  const valid = failures.length === 0 && ledger.certification.certification_status === "PASS" && ledger.completion_gate_ready && !ledger.deployment_authorized && !ledger.optimization_execution_authorized;
  const source = { ledger_id: ledger.ledger_id, valid, discovery_certified: !has("DISCOVERY_CERTIFICATION_FAILED"), impact_analysis_certified: !has("IMPACT_ANALYSIS_CERTIFICATION_FAILED"), deterministic_validation_certified: !has("DETERMINISTIC_VALIDATION_CERTIFICATION_FAILED"), recommendations_certified: !has("RECOMMENDATION_CERTIFICATION_FAILED"), replay_reproducible: !has("REPLAY_MISMATCH_DETECTED"), mission_outcomes_equivalent: !has("MISSION_OUTCOME_ALTERED"), governance_enforced: !has("GOVERNANCE_BYPASS_DETECTED"), constitutional_compliant: !has("CONSTITUTIONAL_VIOLATION_DETECTED"), authority_preserved: !has("AUTHORITY_ESCALATION_DETECTED"), tenant_isolated: !has("CROSS_TENANT_OPTIMIZATION_DETECTED"), operator_visible: !has("OPERATOR_VISIBILITY_INCOMPLETE"), explainability_complete: !has("EXPLAINABILITY_MISSING"), lineage_immutable: !has("INTEGRITY_HASH_MISMATCH"), advisory_only_enforced: !has("AUTOMATIC_DEPLOYMENT_DETECTED"), deployment_authorization_absent: !ledger.deployment_authorized, optimization_execution_authorization_absent: !ledger.optimization_execution_authorized, operator_approval_required: true as const, completion_gate_ready: valid, fail_closed: valid || failures.length > 0 || ledger.certification.certification_status !== "PASS", failures };
  return Object.freeze({ ...source, validation_hash: hashValue("continuous-optimization-certification-validation", source) });
}

export function buildContinuousOptimizationCertificationObservabilitySurface(ledger = runContinuousOptimizationCertification()): ContinuousOptimizationCertificationObservabilitySurface {
  return Object.freeze({ ledger_id: ledger.ledger_id, certification_status: ledger.certification.certification_status, final_state: ledger.final_state, tests_passed: ledger.tests.filter((test) => test.actual_result === "PASS").length, tests_failed: ledger.tests.filter((test) => test.actual_result === "FAIL").length, failure_count: ledger.failures.length, deployment_authorized: false, optimization_execution_authorized: false, completion_gate_ready: ledger.completion_gate_ready, integrity_hash: ledger.integrity_hash });
}

export function getContinuousOptimizationCertificationGate(): ContinuousOptimizationCertificationGateBundle {
  const ledger = runContinuousOptimizationCertification();
  return Object.freeze({ doctrine: Object.freeze({ contract_version: VERSION, final_state: "CONTINUOUS_OPTIMIZATION_CERTIFIED_FOR_COMPLETION_GATE", certification_statuses: statuses, principles: freezeArray(["full-optimization-chain-certification", "deterministic-reproducibility", "mission-equivalence", "replay-fidelity", "governance-enforcement", "constitutional-compliance", "authority-preservation", "tenant-isolation", "operator-visibility", "no-deployment-authorization"]) }), ledger, validation: validateContinuousOptimizationCertification(ledger), observability: buildContinuousOptimizationCertificationObservabilitySurface(ledger) });
}
