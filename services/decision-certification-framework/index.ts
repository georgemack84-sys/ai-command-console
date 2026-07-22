import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runObservabilityAnalyticsEngine } from "@/services/decision-observability-analytics-engine";
import type { ObservabilityAnalyticsResult } from "@/types/decision-observability-analytics-engine";
import type { VisibilityRole } from "@/types/decision-observability-contract";
import type {
  CertificationCategory,
  CertificationEvidenceRequirement,
  CertificationEvidenceType,
  CertificationExecutedTest,
  CertificationExecutionRule,
  CertificationFailureClass,
  CertificationFailureClassification,
  CertificationFrameworkFailure,
  CertificationFrameworkFoundation,
  CertificationFrameworkInput,
  CertificationFrameworkResult,
  CertificationFrameworkValidation,
  CertificationLifecycleState,
  CertificationMetadata,
  CertificationScoreComponent,
  CertificationSeverity,
  CertificationTestRegistryEntry,
  DecisionOrchestratorCertification,
  DecisionOrchestratorCertificationState,
} from "@/types/decision-certification-framework";

const FRAMEWORK_VERSION = "decision-certification-framework/v1" as const;
const REGISTRY_VERSION = "decision-certification-test-registry/v1" as const;

export const CERTIFICATION_LIFECYCLE_STATES: readonly CertificationLifecycleState[] = Object.freeze(["DEFINED", "REGISTERED", "READY", "EXECUTING", "EVIDENCE_COLLECTION", "VALIDATION", "SCORING", "RESULT_GENERATION", "OPERATOR_REVIEW", "FINALIZED", "ARCHIVED"]);
export const CERTIFICATION_STATES: readonly DecisionOrchestratorCertificationState[] = Object.freeze(["PASS", "CONDITIONAL_PASS", "FAIL"]);
export const CERTIFICATION_CATEGORIES: readonly CertificationCategory[] = Object.freeze(["FOUNDATION", "SCHEMA", "DETERMINISM", "CONTEXT", "DEPENDENCY", "CONFLICT", "PRIORITY", "GOVERNANCE", "CONSTITUTIONAL", "AUTHORITY", "DECISION_PACKAGE", "OPERATOR_WORKFLOW", "REPLAY", "LEDGER", "DASHBOARD", "SECURITY", "PRODUCTION_READINESS"]);
export const CERTIFICATION_EVIDENCE_TYPES: readonly CertificationEvidenceType[] = Object.freeze(["TEST", "REPLAY", "GOVERNANCE", "INTEGRITY", "OPERATOR", "DASHBOARD"]);
export const CERTIFICATION_FAILURE_CLASSES: readonly CertificationFailureClass[] = Object.freeze(["GOVERNANCE_BYPASS", "CONSTITUTIONAL_VIOLATION", "UNAUTHORIZED_EXECUTION", "REPLAY_MISMATCH", "TENANT_LEAKAGE", "HIDDEN_ORCHESTRATION", "INTEGRITY_FAILURE", "MISSING_MANDATORY_EVIDENCE", "FAIL_OPEN_BEHAVIOR", "MISSING_EXPLANATION", "INCOMPLETE_OBSERVABILITY", "DOCUMENTATION_DEFICIENCY"]);

type Scenario = NonNullable<CertificationFrameworkInput["scenario"]>;

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

function hashWithoutCertificationHash(value: DecisionOrchestratorCertification): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.certification_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function ctx(source: ObservabilityAnalyticsResult) {
  return {
    tenant_id: source.source_snapshot.tenant_id,
    mission_id: source.source_snapshot.mission_id,
    replay_ref: source.replay_hash,
    certification_ref: source.operator_dashboard.activity_record.certification_ref,
    source_refs: freezeArray([source.decision_analytics.analytics_id, source.operational_health.health_dashboard_id, ...source.analytics_ledger.map((entry) => entry.analytics_ledger_id)]),
  };
}

function registryEntry(test_id: string, name: string, category: CertificationCategory, severity: CertificationSeverity, evidence: readonly CertificationEvidenceType[], failure: CertificationFailureClass): CertificationTestRegistryEntry {
  const base: Omit<CertificationTestRegistryEntry, "integrity_hash"> = {
    test_id,
    test_name: name,
    description: `${name} certification test for Mission Control Decision Orchestrator.`,
    certification_category: category,
    dependencies: test_id === "cert_foundation_contract" ? freezeArray([]) : freezeArray(["cert_foundation_contract"]),
    expected_result: "PASS",
    pass_criteria: freezeArray(["deterministic", "replayable", "evidence-backed", "fail-closed"]),
    failure_criteria: freezeArray([failure]),
    required_evidence: evidence,
    replay_requirement: "REQUIRED",
    severity,
    owner: "mission_control_certification",
    version: "phase-9-cert-test/v1",
    mandatory: severity === "CRITICAL",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildRegistry(scenario: Scenario): readonly CertificationTestRegistryEntry[] {
  const entries = [
    registryEntry("cert_foundation_contract", "Foundation Contract", "FOUNDATION", "CRITICAL", ["TEST", "INTEGRITY"], "HIDDEN_ORCHESTRATION"),
    registryEntry("cert_schema_contract", "Schema Contract", "SCHEMA", "CRITICAL", ["TEST", "INTEGRITY"], "MISSING_MANDATORY_EVIDENCE"),
    registryEntry("cert_determinism", "Deterministic Execution", "DETERMINISM", "CRITICAL", ["TEST", "REPLAY"], "REPLAY_MISMATCH"),
    registryEntry("cert_context", "Context Completeness", "CONTEXT", "MAJOR", ["TEST", "GOVERNANCE"], "INCOMPLETE_OBSERVABILITY"),
    registryEntry("cert_dependency_graph", "Dependency Safety", "DEPENDENCY", "CRITICAL", ["TEST", "REPLAY"], "FAIL_OPEN_BEHAVIOR"),
    registryEntry("cert_conflict_arbitration", "Conflict Arbitration", "CONFLICT", "CRITICAL", ["TEST", "GOVERNANCE"], "GOVERNANCE_BYPASS"),
    registryEntry("cert_priority_scoring", "Priority Scoring", "PRIORITY", "MAJOR", ["TEST", "DASHBOARD"], "MISSING_EXPLANATION"),
    registryEntry("cert_governance", "Governance Enforcement", "GOVERNANCE", "CRITICAL", ["GOVERNANCE", "TEST"], "GOVERNANCE_BYPASS"),
    registryEntry("cert_constitutional", "Constitutional Compliance", "CONSTITUTIONAL", "CRITICAL", ["GOVERNANCE", "INTEGRITY"], "CONSTITUTIONAL_VIOLATION"),
    registryEntry("cert_authority", "Authority Validation", "AUTHORITY", "CRITICAL", ["GOVERNANCE", "OPERATOR"], "UNAUTHORIZED_EXECUTION"),
    registryEntry("cert_decision_package", "Decision Package", "DECISION_PACKAGE", "MAJOR", ["TEST", "DASHBOARD"], "INCOMPLETE_OBSERVABILITY"),
    registryEntry("cert_operator_workflow", "Operator Workflow", "OPERATOR_WORKFLOW", "CRITICAL", ["OPERATOR", "REPLAY"], "UNAUTHORIZED_EXECUTION"),
    registryEntry("cert_replay", "Replay Audit", "REPLAY", "CRITICAL", ["REPLAY", "INTEGRITY"], "REPLAY_MISMATCH"),
    registryEntry("cert_ledger", "Ledger Integrity", "LEDGER", "CRITICAL", ["INTEGRITY", "REPLAY"], "INTEGRITY_FAILURE"),
    registryEntry("cert_dashboard", "Dashboard Visibility", "DASHBOARD", "MAJOR", ["DASHBOARD", "TEST"], "INCOMPLETE_OBSERVABILITY"),
    registryEntry("cert_security", "Security Boundary", "SECURITY", "CRITICAL", ["TEST", "GOVERNANCE"], "TENANT_LEAKAGE"),
    registryEntry("cert_production_readiness", "Production Readiness", "PRODUCTION_READINESS", "CRITICAL", ["TEST", "REPLAY", "INTEGRITY"], "FAIL_OPEN_BEHAVIOR"),
  ];
  if (scenario === "INCOMPLETE_REGISTRY") return freezeArray(entries.slice(0, -2));
  return freezeArray(entries);
}

function buildExecutionRules(scenario: Scenario): readonly CertificationExecutionRule[] {
  const names = ["Initialize Certification", "Load Certification Contract", "Load Test Registry", "Validate Prerequisites", "Execute Foundation Tests", "Execute Functional Tests", "Execute Governance Tests", "Execute Replay Tests", "Execute Integrity Tests", "Collect Evidence", "Score Results", "Generate Reports", "Operator Review", "Finalize Certification", "Append Certification Ledger"];
  const ordered = scenario === "NONDETERMINISTIC_ORDER" ? [...names].reverse() : names;
  return freezeArray(ordered.map((name, index) => {
    const base: Omit<CertificationExecutionRule, "integrity_hash"> = {
      rule_id: `cert_rule_${String(index + 1).padStart(2, "0")}`,
      execution_order: index + 1,
      rule_name: name,
      deterministic: scenario !== "NONDETERMINISTIC_ORDER",
      required: true,
      replay_required: true,
    };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }));
}

function buildEvidence(source: ObservabilityAnalyticsResult, scenario: Scenario): readonly CertificationEvidenceRequirement[] {
  const c = ctx(source);
  const refs: Record<CertificationEvidenceType, readonly string[]> = {
    TEST: freezeArray(source.metric_records.map((record) => record.metric_id)),
    REPLAY: freezeArray([c.replay_ref, source.operator_dashboard.replay_hash]),
    GOVERNANCE: source.operator_dashboard.replay_monitoring.governance_visibility.governance_dashboard.policy_results,
    INTEGRITY: freezeArray([source.integrity_hash, source.operator_dashboard.integrity_hash]),
    OPERATOR: source.operator_dashboard.activity_record.action_record_refs,
    DASHBOARD: source.source_snapshot.source_dashboard_refs,
  };
  return freezeArray(CERTIFICATION_EVIDENCE_TYPES.map((type) => {
    const collected = scenario === "INCOMPLETE_EVIDENCE" && type === "REPLAY" ? freezeArray([]) : refs[type];
    const base: Omit<CertificationEvidenceRequirement, "integrity_hash"> = {
      evidence_id: `cert_evidence_${type.toLowerCase()}`,
      evidence_type: type,
      required_refs: refs[type],
      collected_refs: collected,
      complete: collected.length > 0,
      immutable: scenario !== "MUTABLE_LINEAGE",
    };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }));
}

function testOutcome(entry: CertificationTestRegistryEntry, scenario: Scenario): DecisionOrchestratorCertificationState {
  if (scenario === "MANDATORY_TEST_FAILURE" && entry.mandatory) return "FAIL";
  if (scenario === "BAD_FAILURE_CLASSIFICATION" && entry.test_id === "cert_dashboard") return "CONDITIONAL_PASS";
  return "PASS";
}

function buildExecutedTests(registry: readonly CertificationTestRegistryEntry[], evidence: readonly CertificationEvidenceRequirement[], source: ObservabilityAnalyticsResult, scenario: Scenario): readonly CertificationExecutedTest[] {
  const replayRefs = scenario === "MISSING_REPLAY_REFS" ? freezeArray([]) : freezeArray([source.replay_hash]);
  return freezeArray(registry.map((entry, index) => {
    const outcome = testOutcome(entry, scenario);
    const base: Omit<CertificationExecutedTest, "integrity_hash"> = {
      execution_id: `cert_execution_${entry.test_id}`,
      test_id: entry.test_id,
      execution_order: index + 1,
      expected_outcome: "PASS",
      actual_outcome: outcome,
      execution_duration_ms: 25 + index,
      evidence_refs: evidence.filter((item) => entry.required_evidence.includes(item.evidence_type)).map((item) => item.evidence_id),
      replay_refs: replayRefs,
      failure_class: outcome === "FAIL" ? entry.failure_criteria[0] : null,
    };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }));
}

function buildScores(executed: readonly CertificationExecutedTest[], scenario: Scenario): readonly CertificationScoreComponent[] {
  const categories: readonly CertificationScoreComponent["category"][] = ["FOUNDATION", "DETERMINISM", "REPLAY", "GOVERNANCE", "CONSTITUTIONAL_COMPLIANCE", "AUTHORITY_VALIDATION", "DECISION_INTELLIGENCE", "OPERATOR_WORKFLOW", "INTEGRITY_LEDGER", "OBSERVABILITY"];
  const weights = [10, 15, 15, 15, 10, 10, 10, 5, 5, 5];
  const passRate = executed.filter((test) => test.actual_outcome === "PASS").length / Math.max(1, executed.length);
  return freezeArray(categories.map((category, index) => {
    const score = scenario === "BAD_SCORING" && category === "REPLAY" ? 0 : Number((passRate * 100).toFixed(2));
    const base: Omit<CertificationScoreComponent, "integrity_hash"> = {
      category,
      weight: weights[index],
      score,
      weighted_score: Number((score * (weights[index] / 100)).toFixed(2)),
    };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }));
}

function buildClassifications(scenario: Scenario): readonly CertificationFailureClassification[] {
  return freezeArray(CERTIFICATION_FAILURE_CLASSES.map((failureClass) => {
    const critical: readonly CertificationFailureClass[] = ["GOVERNANCE_BYPASS", "CONSTITUTIONAL_VIOLATION", "UNAUTHORIZED_EXECUTION", "REPLAY_MISMATCH", "TENANT_LEAKAGE", "HIDDEN_ORCHESTRATION", "INTEGRITY_FAILURE", "MISSING_MANDATORY_EVIDENCE", "FAIL_OPEN_BEHAVIOR"];
    const severity: CertificationSeverity = critical.includes(failureClass) ? "CRITICAL" : failureClass === "DOCUMENTATION_DEFICIENCY" ? "MINOR" : "MAJOR";
    const base: Omit<CertificationFailureClassification, "integrity_hash"> = {
      classification_id: `cert_failure_class_${failureClass.toLowerCase()}`,
      failure_class: failureClass,
      severity: scenario === "BAD_FAILURE_CLASSIFICATION" && failureClass === "REPLAY_MISMATCH" ? "MINOR" : severity,
      result: severity === "CRITICAL" ? "FAIL" : severity === "MAJOR" ? "CONDITIONAL_PASS" : "CONDITIONAL_PASS",
      rationale: `${failureClass} maps deterministically to ${severity}.`,
    };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }));
}

function certificationState(executed: readonly CertificationExecutedTest[], evidence: readonly CertificationEvidenceRequirement[], classifications: readonly CertificationFailureClassification[]): DecisionOrchestratorCertificationState {
  const failed = executed.filter((test) => test.actual_outcome === "FAIL");
  if (failed.some((test) => classifications.find((item) => item.failure_class === test.failure_class)?.severity === "CRITICAL")) return "FAIL";
  if (failed.length || evidence.some((item) => !item.complete)) return "CONDITIONAL_PASS";
  return "PASS";
}

function buildContract(source: ObservabilityAnalyticsResult, registry: readonly CertificationTestRegistryEntry[], executed: readonly CertificationExecutedTest[], evidence: readonly CertificationEvidenceRequirement[], scores: readonly CertificationScoreComponent[], classifications: readonly CertificationFailureClassification[], scenario: Scenario): DecisionOrchestratorCertification {
  const c = ctx(source);
  const state = scenario === "INCOMPLETE_CONTRACT" ? "FAIL" : certificationState(executed, evidence, classifications);
  const score = scenario === "BAD_SCORING" ? 0 : Number(scores.reduce((sum, item) => sum + item.weighted_score, 0).toFixed(2));
  const base: Omit<DecisionOrchestratorCertification, "certification_hash"> = {
    certification_id: "decision_orchestrator_certification_9_12_1",
    certification_version: FRAMEWORK_VERSION,
    phase_id: "9.12.1",
    certification_scope: "MISSION_CONTROL_DECISION_ORCHESTRATOR",
    execution_timestamp: "2026-07-05T09:12:01.000Z",
    execution_id: "cert_execution_phase_9_12_1",
    execution_state: scenario === "INCOMPLETE_CONTRACT" ? "BLOCKED" : "COMPLETED",
    lifecycle_state: scenario === "INCOMPLETE_CONTRACT" ? "VALIDATION" : "FINALIZED",
    certification_state: state,
    certification_score: score,
    test_registry_version: REGISTRY_VERSION,
    executed_tests: scenario === "INCOMPLETE_CONTRACT" ? freezeArray([]) : freezeArray(executed.map((test) => test.execution_id)),
    evidence_refs: scenario === "INCOMPLETE_CONTRACT" ? freezeArray([]) : freezeArray(evidence.map((item) => item.evidence_id)),
    replay_refs: scenario === "MISSING_REPLAY_REFS" ? freezeArray([]) : freezeArray([c.replay_ref]),
    governance_validation: scenario === "MISSING_GOVERNANCE_VALIDATION" ? "FAIL" : "PASS",
    constitutional_validation: scenario === "MISSING_CONSTITUTIONAL_VALIDATION" ? "FAIL" : "PASS",
    authority_validation: scenario === "MISSING_AUTHORITY_VALIDATION" ? "FAIL" : "PASS",
    tenant_validation: scenario === "MISSING_TENANT_VALIDATION" ? "FAIL" : "PASS",
    integrity_validation: scenario === "MISSING_INTEGRITY_VALIDATION" ? "FAIL" : "PASS",
    failure_summary: freezeArray(executed.flatMap((test) => test.failure_class ? [test.failure_class] : [])),
    recommendations: freezeArray(state === "PASS" ? ["certification framework ready for downstream certification gates"] : ["resolve blocked certification requirements before production certification"]),
    operator_review: scenario === "MISSING_OPERATOR_REVIEW" ? "MISSING" : "COMPLETED",
    advisory_only: true,
    production_ready: state === "PASS",
  };
  const built = Object.freeze({ ...base, certification_hash: hash(base) });
  if (scenario === "HASH_MISMATCH") return Object.freeze({ ...built, certification_hash: hash({ tampered: built.certification_id }) });
  return built;
}

function buildMetadata(source: ObservabilityAnalyticsResult, contract: DecisionOrchestratorCertification, scenario: Scenario): CertificationMetadata {
  const c = ctx(source);
  const base: Omit<CertificationMetadata, "integrity_hash"> = {
    certification_id: contract.certification_id,
    phase_id: "9.12.1",
    version: FRAMEWORK_VERSION,
    build_version: "phase-9-decision-orchestrator",
    execution_timestamp: contract.execution_timestamp,
    operator: "operator_alpha",
    environment: "TEST",
    test_registry_version: REGISTRY_VERSION,
    certification_state: contract.certification_state,
    replay_reference: scenario === "MISSING_REPLAY_REFS" ? "" : c.replay_ref,
    ledger_reference: scenario === "MUTABLE_LINEAGE" ? "" : source.analytics_ledger[0]?.analytics_ledger_id ?? "",
    digital_signature: hash({ certification_id: contract.certification_id, certification_hash: contract.certification_hash }),
    certification_duration_ms: 9121,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(input: {
  source: ObservabilityAnalyticsResult;
  registry: readonly CertificationTestRegistryEntry[];
  executed: readonly CertificationExecutedTest[];
  evidence: readonly CertificationEvidenceRequirement[];
  rules: readonly CertificationExecutionRule[];
  scores: readonly CertificationScoreComponent[];
  classifications: readonly CertificationFailureClassification[];
  contract: DecisionOrchestratorCertification;
  metadata: CertificationMetadata;
  role: VisibilityRole;
  scenario: Scenario;
}): readonly CertificationFrameworkFailure[] {
  const failures: CertificationFrameworkFailure[] = [];
  const c = ctx(input.source);
  if (!input.contract.executed_tests.length || !input.contract.evidence_refs.length || input.contract.execution_state === "BLOCKED") failures.push("CERTIFICATION_CONTRACT_INCOMPLETE");
  if (input.registry.length !== CERTIFICATION_CATEGORIES.length) failures.push("TEST_REGISTRY_INCOMPLETE");
  if (input.scenario === "NONDETERMINISTIC_ORDER" || !input.rules.every((rule, index) => rule.execution_order === index + 1 && rule.deterministic)) failures.push("EXECUTION_ORDER_NONDETERMINISTIC");
  if (input.executed.some((test) => input.registry.find((entry) => entry.test_id === test.test_id)?.mandatory && test.actual_outcome === "FAIL")) failures.push("MANDATORY_TEST_FAILED");
  if (input.evidence.some((item) => !item.complete)) failures.push("EVIDENCE_INCOMPLETE");
  if (input.scores.reduce((sum, item) => sum + item.weight, 0) !== 100 || input.contract.certification_score !== Number(input.scores.reduce((sum, item) => sum + item.weighted_score, 0).toFixed(2))) failures.push("SCORING_NONDETERMINISTIC");
  if (input.classifications.some((item) => item.failure_class === "REPLAY_MISMATCH" && item.severity !== "CRITICAL")) failures.push("FAILURE_CLASSIFICATION_INCONSISTENT");
  if (input.contract.governance_validation !== "PASS") failures.push("GOVERNANCE_VALIDATION_MISSING");
  if (input.contract.constitutional_validation !== "PASS") failures.push("CONSTITUTIONAL_VALIDATION_MISSING");
  if (input.contract.authority_validation !== "PASS") failures.push("AUTHORITY_VALIDATION_MISSING");
  if (input.contract.tenant_validation !== "PASS") failures.push("TENANT_VALIDATION_MISSING");
  if (input.contract.integrity_validation !== "PASS") failures.push("INTEGRITY_VALIDATION_MISSING");
  if (input.contract.operator_review !== "COMPLETED") failures.push("OPERATOR_REVIEW_MISSING");
  if (!input.contract.replay_refs.length || !input.metadata.replay_reference || input.executed.some((test) => !test.replay_refs.length)) failures.push("REPLAY_REFERENCES_MISSING");
  if (!input.metadata.ledger_reference || input.evidence.some((item) => !item.immutable)) failures.push("CERTIFICATION_LINEAGE_MUTABLE");
  if (input.source.source_snapshot.tenant_id !== input.source.operator_dashboard.activity_record.tenant_id || input.source.source_snapshot.tenant_id !== c.tenant_id) failures.push("CROSS_TENANT_CERTIFICATION_VISIBLE");
  if (
    input.registry.some((entry) => hashWithoutIntegrity(entry) !== entry.integrity_hash)
    || input.executed.some((test) => hashWithoutIntegrity(test) !== test.integrity_hash)
    || input.evidence.some((item) => hashWithoutIntegrity(item) !== item.integrity_hash)
    || input.rules.some((rule) => hashWithoutIntegrity(rule) !== rule.integrity_hash)
    || input.scores.some((score) => hashWithoutIntegrity(score) !== score.integrity_hash)
    || input.classifications.some((item) => hashWithoutIntegrity(item) !== item.integrity_hash)
    || hashWithoutCertificationHash(input.contract) !== input.contract.certification_hash
    || hashWithoutIntegrity(input.metadata) !== input.metadata.integrity_hash
  ) failures.push("INTEGRITY_HASH_MISMATCH");
  if (input.scenario === "REPLAY_RECONSTRUCTION_FAILURE") failures.push("CERTIFICATION_REPLAY_RECONSTRUCTION_FAILED");
  if (!input.source.operator_dashboard.replay_monitoring.governance_visibility.priority_dashboard.conflict_visualization.timeline_result.dashboard_result.observability_result.authorizations.some((auth) => auth.role === input.role && auth.permissions.includes("VIEW_DECISIONS"))) failures.push("AUTHORIZATION_FAILURE");
  if (input.scenario === "EXECUTION_AUTHORITY") failures.push("EXECUTION_AUTHORITY_GRANTED");
  return freezeArray([...new Set(failures)]);
}

function buildValidation(failures: readonly CertificationFrameworkFailure[]): CertificationFrameworkValidation {
  const has = (failure: CertificationFrameworkFailure) => failures.includes(failure);
  const base: Omit<CertificationFrameworkValidation, "integrity_hash"> = {
    validation_id: "decision_certification_framework_validation",
    validation_status: failures.length ? "BLOCKED" : "VALID",
    contract_complete: !has("CERTIFICATION_CONTRACT_INCOMPLETE"),
    test_registry_complete: !has("TEST_REGISTRY_INCOMPLETE"),
    execution_order_deterministic: !has("EXECUTION_ORDER_NONDETERMINISTIC"),
    mandatory_tests_passed: !has("MANDATORY_TEST_FAILED"),
    evidence_complete: !has("EVIDENCE_INCOMPLETE"),
    scoring_deterministic: !has("SCORING_NONDETERMINISTIC"),
    failure_classification_consistent: !has("FAILURE_CLASSIFICATION_INCONSISTENT"),
    governance_validation_present: !has("GOVERNANCE_VALIDATION_MISSING"),
    constitutional_validation_present: !has("CONSTITUTIONAL_VALIDATION_MISSING"),
    authority_validation_present: !has("AUTHORITY_VALIDATION_MISSING"),
    tenant_validation_present: !has("TENANT_VALIDATION_MISSING"),
    integrity_validation_present: !has("INTEGRITY_VALIDATION_MISSING"),
    operator_review_present: !has("OPERATOR_REVIEW_MISSING"),
    replay_refs_present: !has("REPLAY_REFERENCES_MISSING") && !has("CERTIFICATION_REPLAY_RECONSTRUCTION_FAILED"),
    lineage_immutable: !has("CERTIFICATION_LINEAGE_MUTABLE"),
    tenant_isolated: !has("CROSS_TENANT_CERTIFICATION_VISIBLE"),
    authorization_valid: !has("AUTHORIZATION_FAILURE"),
    integrity_verified: !has("INTEGRITY_HASH_MISMATCH"),
    advisory_only: !has("EXECUTION_AUTHORITY_GRANTED"),
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<CertificationFrameworkResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    contract: result.certification_contract,
    registry: result.test_registry,
    executed: result.executed_tests,
    evidence: result.evidence_requirements,
    rules: result.execution_rules,
    scores: result.score_components,
    classifications: result.failure_classifications,
    metadata: result.metadata,
    validation: result.validation,
  });
}

export function runCertificationFramework(input: CertificationFrameworkInput = {}): CertificationFrameworkResult {
  const scenario = input.scenario ?? "BASELINE";
  const role = input.role ?? "OPERATOR";
  const analytics_result = input.analytics_result ?? runObservabilityAnalyticsEngine(scenario === "CROSS_TENANT" ? { scenario: "CROSS_TENANT" } : {});
  const test_registry = buildRegistry(scenario);
  const evidence_requirements = buildEvidence(analytics_result, scenario);
  const executed_tests = buildExecutedTests(test_registry, evidence_requirements, analytics_result, scenario);
  const execution_rules = buildExecutionRules(scenario);
  const score_components = buildScores(executed_tests, scenario);
  const failure_classifications = buildClassifications(scenario);
  const certification_contract = buildContract(analytics_result, test_registry, executed_tests, evidence_requirements, score_components, failure_classifications, scenario);
  const metadata = buildMetadata(analytics_result, certification_contract, scenario);
  const failures = collectFailures({ source: analytics_result, registry: test_registry, executed: executed_tests, evidence: evidence_requirements, rules: execution_rules, scores: score_components, classifications: failure_classifications, contract: certification_contract, metadata, role, scenario });
  const validation = buildValidation(failures);
  const base: Omit<CertificationFrameworkResult, "integrity_hash" | "replay_hash"> = {
    framework_version: FRAMEWORK_VERSION,
    analytics_result,
    certification_contract,
    test_registry,
    executed_tests,
    evidence_requirements,
    execution_rules,
    score_components,
    failure_classifications,
    metadata,
    validation,
    deterministic: true,
    replayable: true,
    advisory_only: true,
    mutates_certification_or_orchestration: false,
    execution_authority_granted: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayCertificationFramework(result: CertificationFrameworkResult): boolean {
  return resultReplayHash(result) === result.replay_hash && hashWithoutIntegrity(result) === result.integrity_hash;
}

export function computeCertificationTestRegistryEntryHash(entry: Omit<CertificationTestRegistryEntry, "integrity_hash"> | CertificationTestRegistryEntry): string {
  return hashWithoutIntegrity(entry);
}

export function getCertificationFrameworkFoundation(): CertificationFrameworkFoundation {
  return Object.freeze({
    framework_version: FRAMEWORK_VERSION,
    lifecycle_states: CERTIFICATION_LIFECYCLE_STATES,
    certification_states: CERTIFICATION_STATES,
    categories: CERTIFICATION_CATEGORIES,
    evidence_types: CERTIFICATION_EVIDENCE_TYPES,
    failure_classes: CERTIFICATION_FAILURE_CLASSES,
    result: runCertificationFramework(),
  });
}

export const CertificationFramework = Object.freeze({
  run: runCertificationFramework,
  replay: replayCertificationFramework,
});
