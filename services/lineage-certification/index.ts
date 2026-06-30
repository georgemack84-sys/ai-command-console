import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { analyzeDecisionInfluence, validateDecisionInfluenceAnalysis, verifyInfluenceReplay } from "@/services/decision-influence-analysis";
import { generateGovernanceExplanation, validateGovernanceExplanation, verifyExplanationReplay } from "@/services/governance-explainability";
import { registerGovernanceLineage, validateGovernanceLineage, verifyGovernanceReplay } from "@/services/governance-lineage";
import { reconstructPolicyLineage, validatePolicyLineageReconstruction, verifyPolicyReplay } from "@/services/policy-lineage-reconstruction";
import type { DecisionInfluenceScenario } from "@/types/decision-influence-analysis";
import type { GovernanceExplanationScenario } from "@/types/governance-explainability";
import type { GovernanceLineageScenario } from "@/types/governance-lineage";
import type {
  LineageCertificationCategory,
  LineageCertificationEngineInput,
  LineageCertificationEvidencePackage,
  LineageCertificationFailureReason,
  LineageCertificationObservabilitySurface,
  LineageCertificationReport,
  LineageCertificationScenario,
  LineageCertificationState,
  LineageCertificationTestResult,
  LineageReplayMatrixEntry,
} from "@/types/lineage-certification";
import type { PolicyLineageScenario } from "@/types/policy-lineage-reconstruction";

const NOW = "2026-06-26T21:00:00.000Z";
const SCHEMA_VERSION = "lineage-certification-gate/v7G.5" as const;

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function uniq(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values.filter(Boolean))].sort());
}

function scenarioMap(scenario: LineageCertificationScenario | undefined) {
  const s = scenario ?? "BASELINE";
  const governance: GovernanceLineageScenario = s === "MISSING_CONTRACT" ? "MISSING_ID" : s === "IMMUTABLE_MUTATION" ? "IMMUTABLE_MUTATION" : s === "INCOMPLETE_LINEAGE" ? "HIDDEN_INFLUENCE" : s === "LINEAGE_REPLAY_MISMATCH" || s === "HASH_VERIFICATION_FAILED" ? "HASH_MISMATCH" : s === "CROSS_TENANT" ? "CROSS_TENANT" : "BASELINE";
  const policy: PolicyLineageScenario = s === "POLICY_REPLAY_MISMATCH" || s === "POLICY_DEPENDENCY_MISMATCH" ? "REPLAY_MISMATCH" : s === "POLICY_INHERITANCE_MISMATCH" ? "INHERITANCE_INCOMPLETE" : s === "CONSTITUTIONAL_PRECEDENCE_VIOLATION" ? "CONSTITUTION_MISSING" : s === "SUPERSESSION_MISMATCH" ? "SUPERSESSION_INCONSISTENT" : s === "CROSS_TENANT" ? "CROSS_TENANT" : s === "IMMUTABLE_MUTATION" ? "HISTORICAL_MUTATION" : "BASELINE";
  const influence: DecisionInfluenceScenario = s === "HIDDEN_INFLUENCE" || s === "HIDDEN_GOVERNANCE_ARTIFACT" ? "HIDDEN_INFLUENCE" : s === "CONTRIBUTION_MISMATCH" ? "CONTRIBUTION_FAILED" : s === "INFLUENCE_GRAPH_MISMATCH" ? "DEPENDENCY_INCOMPLETE" : s === "UNRESOLVED_CONFLICT" ? "UNRESOLVED_CONFLICT" : s === "CONSTITUTIONAL_PRECEDENCE_VIOLATION" ? "PRECEDENCE_VIOLATION" : s === "CROSS_TENANT" ? "CROSS_TENANT" : s === "HASH_VERIFICATION_FAILED" ? "REPLAY_MISMATCH" : "BASELINE";
  const explanation: GovernanceExplanationScenario = s === "INCOMPLETE_EXPLANATION" ? "MISSING_EVIDENCE" : s === "EXPLANATION_REPLAY_MISMATCH" ? "REPLAY_MISMATCH" : s === "UNSUPPORTED_INFERENCE" ? "UNSUPPORTED_INFERENCE" : s === "HIDDEN_INFLUENCE" || s === "HIDDEN_GOVERNANCE_ARTIFACT" ? "HIDDEN_INFLUENCE" : s === "CROSS_TENANT" ? "CROSS_TENANT" : s === "TRUTH_LEDGER_MISMATCH" ? "MISSING_REPLAY" : s === "IMMUTABLE_MUTATION" ? "IMMUTABLE_MUTATION" : "BASELINE";
  return { governance, policy, influence, explanation };
}

function testResult(input: {
  category: LineageCertificationCategory;
  name: string;
  expected?: "PASS" | "FAIL";
  actual: "PASS" | "FAIL";
  evidence_refs?: readonly string[];
  replay_refs?: readonly string[];
  failure_reason: LineageCertificationFailureReason | null;
}): LineageCertificationTestResult {
  const expected = input.expected ?? "PASS";
  return Object.freeze({
    test_id: `LCG-TEST-${hashValue("lineage-certification-test-id", { category: input.category, name: input.name }).slice(0, 10).toUpperCase()}`,
    category: input.category,
    name: input.name,
    expected,
    actual: input.actual,
    passed: input.actual === expected,
    evidence_refs: uniq(input.evidence_refs ?? []),
    replay_refs: uniq(input.replay_refs ?? []),
    failure_reason: input.failure_reason,
  });
}

function actual(pass: boolean): "PASS" | "FAIL" {
  return pass ? "PASS" : "FAIL";
}

export function runLineageCertification(input: LineageCertificationEngineInput = {}): LineageCertificationReport {
  const mapped = scenarioMap(input.scenario);
  const governance = registerGovernanceLineage({ tenant_id: input.tenant_id, mission_id: input.mission_id, scenario: mapped.governance });
  const policy = reconstructPolicyLineage({ tenant_id: input.tenant_id ?? governance.tenant_id, mission_id: input.mission_id ?? governance.mission_id, governance_conclusion_ref: governance.governance_object.object_identifier, scenario: mapped.policy });
  const influence = analyzeDecisionInfluence({ tenant_id: input.tenant_id ?? governance.tenant_id, mission_id: input.mission_id ?? governance.mission_id, governance_lineage: governance, policy_lineage: policy, scenario: mapped.influence });
  const explanation = generateGovernanceExplanation({ tenant_id: input.tenant_id ?? governance.tenant_id, mission_id: input.mission_id ?? governance.mission_id, governance_lineage: governance, policy_lineage: policy, decision_influence: influence, scenario: mapped.explanation });
  const governanceValidation = validateGovernanceLineage(governance);
  const policyValidation = validatePolicyLineageReconstruction(policy);
  const influenceValidation = validateDecisionInfluenceAnalysis(influence);
  const explanationValidation = validateGovernanceExplanation(explanation);
  const governanceReplay = verifyGovernanceReplay(governance);
  const policyReplay = verifyPolicyReplay(policy);
  const influenceReplay = verifyInfluenceReplay(influence);
  const explanationReplay = verifyExplanationReplay(explanation);
  const evidence = uniq([...governance.references.evidence_ids, ...explanation.evidence_references]);
  const replayRefs = uniq([governance.replay_metadata.replay_id, policy.replay_refs.replay_id, influence.replay_refs.replay_id, explanation.replay_refs.replay_id]);

  const contractResults = [
    testResult({ category: "CONTRACT", name: "governance lineage contract present", actual: actual(governanceValidation.validation_state === "VALID"), evidence_refs: [governance.governance_lineage_id], replay_refs: [governance.replay_metadata.replay_id], failure_reason: governanceValidation.validation_state === "VALID" ? null : "GOVERNANCE_LINEAGE_INVALID" }),
    testResult({ category: "CONTRACT", name: "immutable lineage identifiers enforced", actual: actual(!governanceValidation.errors.some((error) => error.reason === "IMMUTABLE_FIELD_MUTATION")), evidence_refs: [governance.lineage_hash], failure_reason: governanceValidation.errors.some((error) => error.reason === "IMMUTABLE_FIELD_MUTATION") ? "HISTORICAL_INTEGRITY_INVALID" : null }),
    testResult({ category: "CONTRACT", name: "lineage relationships complete", actual: actual(governance.influence_chain.length > 0), evidence_refs: governance.references.evidence_ids, failure_reason: governance.influence_chain.length > 0 ? null : "GOVERNANCE_LINEAGE_INVALID" }),
  ];
  const policyResults = [
    testResult({ category: "POLICY_LINEAGE", name: "policy lineage reconstructed deterministically", actual: actual(policyValidation.validation_state === "VALID"), evidence_refs: policy.source_truth_records, replay_refs: [policy.replay_refs.replay_id], failure_reason: policyValidation.validation_state === "VALID" ? null : "POLICY_LINEAGE_INVALID" }),
    testResult({ category: "POLICY_LINEAGE", name: "policy inheritance reproducible", actual: actual(policy.inheritance_chain.length > 0), replay_refs: [policy.replay_refs.inheritance_chain_hash], failure_reason: policy.inheritance_chain.length > 0 ? null : "POLICY_LINEAGE_INVALID" }),
    testResult({ category: "POLICY_LINEAGE", name: "policy dependency graph reproducible", actual: actual(policy.dependency_graph.length > 0), replay_refs: [policy.replay_refs.dependency_graph_hash], failure_reason: policy.dependency_graph.length > 0 ? null : "POLICY_LINEAGE_INVALID" }),
    testResult({ category: "POLICY_LINEAGE", name: "constitutional policy precedence enforced", actual: actual(policy.constitutional_resolutions.length > 0 && policyValidation.checks.constitutional_resolution_complete), replay_refs: [policy.replay_refs.constitutional_resolution_hash], failure_reason: policyValidation.checks.constitutional_resolution_complete ? null : "CONSTITUTIONAL_PRECEDENCE_INVALID" }),
    testResult({ category: "POLICY_LINEAGE", name: "supersession history reproducible", actual: actual(policy.supersession_chain.length > 0 && !policyValidation.errors.some((error) => error.reason === "SUPERSESSION_INCONSISTENCY")), replay_refs: [policy.replay_refs.supersession_chain_hash], failure_reason: policyValidation.errors.some((error) => error.reason === "SUPERSESSION_INCONSISTENCY") ? "POLICY_LINEAGE_INVALID" : null }),
  ];
  const influenceResults = [
    testResult({ category: "DECISION_INFLUENCE", name: "decision influence chains complete", actual: actual(influenceValidation.validation_state === "VALID"), evidence_refs: influence.source_truth_records, replay_refs: [influence.replay_refs.replay_id], failure_reason: influenceValidation.validation_state === "VALID" ? null : "DECISION_INFLUENCE_INVALID" }),
    testResult({ category: "DECISION_INFLUENCE", name: "hidden influence detected", expected: "PASS", actual: actual(influenceValidation.checks.influence_visible), failure_reason: influenceValidation.checks.influence_visible ? null : "HIDDEN_GOVERNANCE_ARTIFACT" }),
    testResult({ category: "DECISION_INFLUENCE", name: "influence contributions reproducible", actual: actual(influenceValidation.checks.contributions_reproducible), replay_refs: [influence.replay_refs.contribution_hash], failure_reason: influenceValidation.checks.contributions_reproducible ? null : "DECISION_INFLUENCE_INVALID" }),
    testResult({ category: "DECISION_INFLUENCE", name: "influence dependency graph reproducible", actual: actual(influenceValidation.checks.dependencies_complete), replay_refs: [influence.replay_refs.dependency_graph_hash], failure_reason: influenceValidation.checks.dependencies_complete ? null : "DECISION_INFLUENCE_INVALID" }),
    testResult({ category: "DECISION_INFLUENCE", name: "conflict detection deterministic", actual: actual(influenceValidation.checks.conflicts_resolved), replay_refs: [influence.replay_refs.conflict_resolution_hash], failure_reason: influenceValidation.checks.conflicts_resolved ? null : "DECISION_INFLUENCE_INVALID" }),
  ];
  const explainabilityResults = [
    testResult({ category: "EXPLAINABILITY", name: "governance explanations complete", actual: actual(explanationValidation.validation_state === "VALID"), evidence_refs: explanation.evidence_references, replay_refs: [explanation.replay_refs.replay_id], failure_reason: explanationValidation.validation_state === "VALID" ? null : "EXPLAINABILITY_INVALID" }),
    testResult({ category: "EXPLAINABILITY", name: "recommendation explanation reproducible", actual: actual(Boolean(explanation.summary && explanation.policy_references.length)), replay_refs: [explanation.replay_refs.summary_hash], failure_reason: explanation.summary && explanation.policy_references.length ? null : "EXPLAINABILITY_INVALID" }),
    testResult({ category: "EXPLAINABILITY", name: "explanations reference verified lineage only", actual: actual(explanationValidation.checks.no_unsupported_inference), failure_reason: explanationValidation.checks.no_unsupported_inference ? null : "UNSUPPORTED_INFERENCE_DETECTED" }),
    testResult({ category: "EXPLAINABILITY", name: "operator visibility complete", actual: actual(explanation.layers.length === 3 && Boolean(explanation.views.executive_view.summary)), evidence_refs: [explanation.explanation_id], failure_reason: explanation.layers.length === 3 ? null : "OPERATOR_VISIBILITY_INCOMPLETE" }),
  ];
  const replayResults = [
    testResult({ category: "REPLAY", name: "replay reconstructs identical lineage", actual: actual(governanceReplay.replay_state === "REPRODUCED"), replay_refs: [governanceReplay.replay_id], failure_reason: governanceReplay.replay_state === "REPRODUCED" ? null : "REPLAY_INVALID" }),
    testResult({ category: "REPLAY", name: "replay reconstructs identical influence graphs", actual: actual(influenceReplay.replay_state === "REPRODUCED"), replay_refs: [influenceReplay.replay_id], failure_reason: influenceReplay.replay_state === "REPRODUCED" ? null : "REPLAY_INVALID" }),
    testResult({ category: "REPLAY", name: "replay reconstructs identical explanations", actual: actual(explanationReplay.replay_state === "REPRODUCED"), replay_refs: [explanationReplay.replay_id], failure_reason: explanationReplay.replay_state === "REPRODUCED" ? null : "REPLAY_INVALID" }),
    testResult({ category: "REPLAY", name: "deterministic hashes verified", actual: actual(governanceValidation.checks.hash_valid && policyValidation.checks.hash_valid && influenceValidation.checks.hash_valid && explanationValidation.checks.hash_valid), replay_refs: replayRefs, failure_reason: governanceValidation.checks.hash_valid && policyValidation.checks.hash_valid && influenceValidation.checks.hash_valid && explanationValidation.checks.hash_valid ? null : "DETERMINISTIC_HASH_INVALID" }),
  ];
  const governanceResults = [
    testResult({ category: "GOVERNANCE", name: "governance boundaries enforced", actual: actual(governance.advisory_boundary.advisory_only && explanation.inference_guard.verified_sources_only), failure_reason: governance.advisory_boundary.advisory_only ? null : "GOVERNANCE_BOUNDARY_INVALID" }),
    testResult({ category: "GOVERNANCE", name: "advisory-only behavior enforced", actual: actual(!governance.advisory_boundary.execution_authority && !explanation.inference_guard.unsupported_inference_detected), failure_reason: !governance.advisory_boundary.execution_authority ? null : "ADVISORY_ONLY_VIOLATED" }),
  ];
  const tenantResults = [
    testResult({ category: "TENANT_ISOLATION", name: "tenant isolation enforced", actual: actual(governanceValidation.checks.tenant_isolated && policyValidation.checks.tenant_isolated && influenceValidation.checks.tenant_isolated && explanationValidation.checks.tenant_isolated), failure_reason: governanceValidation.checks.tenant_isolated && policyValidation.checks.tenant_isolated && influenceValidation.checks.tenant_isolated && explanationValidation.checks.tenant_isolated ? null : "TENANT_ISOLATION_INVALID" }),
  ];
  const integrityResults = [
    testResult({ category: "INTEGRITY", name: "Truth Ledger references reproducible", actual: actual(explanation.truth_record_reference.length > 0 && policy.source_truth_records.length > 0), evidence_refs: [explanation.truth_record_reference, ...policy.source_truth_records], failure_reason: explanation.truth_record_reference.length > 0 ? null : "TRUTH_LEDGER_REFERENCE_INVALID" }),
    testResult({ category: "INTEGRITY", name: "historical lineage preserved", actual: actual(governanceValidation.checks.hash_valid && policyValidation.checks.historical_integrity_preserved && explanationValidation.checks.immutable), failure_reason: governanceValidation.checks.hash_valid && policyValidation.checks.historical_integrity_preserved && explanationValidation.checks.immutable ? null : "HISTORICAL_INTEGRITY_INVALID" }),
  ];

  const executed = Object.freeze([...contractResults, ...policyResults, ...influenceResults, ...explainabilityResults, ...replayResults, ...governanceResults, ...tenantResults, ...integrityResults]);
  const failures = uniq(executed.filter((item) => !item.passed && item.failure_reason).map((item) => item.failure_reason!)) as readonly LineageCertificationFailureReason[];
  const replayMatrix: readonly LineageReplayMatrixEntry[] = Object.freeze([
    matrix("Governance lineage", governanceReplay.replay_state === "REPRODUCED", governanceReplay.reconstructed_hash),
    matrix("Policy ancestry", policyReplay.replay_state === "REPRODUCED", policyReplay.reconstructed_hash),
    matrix("Influence graph", influenceReplay.replay_state === "REPRODUCED", influenceReplay.reconstructed_hash),
    matrix("Governance explanations", explanationReplay.replay_state === "REPRODUCED", explanationReplay.reconstructed_hash),
    matrix("Truth Ledger references", explanation.truth_record_reference.length > 0, hashValue("truth-ledger-references", [explanation.truth_record_reference, ...policy.source_truth_records])),
  ]);
  const evidencePackage = evidencePackageFor(governance.lineage_hash, policy.reconstruction_hash, influence.analysis_hash, explanation.explanation_hash, replayRefs, [explanation.truth_record_reference, ...policy.source_truth_records], evidence);
  const conditional = input.scenario === "MINOR_METADATA_GAP";
  const certification_state: LineageCertificationState = failures.length ? "FAIL" : conditional ? "CONDITIONAL_PASS" : "PASS";
  const source = {
    certification_id: `LCG-7G5-${hashValue("lineage-certification-id", { scenario: input.scenario ?? "BASELINE", governance: governance.governance_lineage_id }).slice(0, 10).toUpperCase()}`,
    phase_version: "7G.5" as const,
    schema_version: SCHEMA_VERSION,
    execution_timestamp: NOW,
    environment: "mission-control-local" as const,
    certification_state,
    contract_validation_results: Object.freeze(contractResults),
    policy_lineage_results: Object.freeze(policyResults),
    decision_influence_results: Object.freeze(influenceResults),
    explainability_results: Object.freeze(explainabilityResults),
    replay_results: Object.freeze(replayResults),
    governance_results: Object.freeze(governanceResults),
    integrity_results: Object.freeze(integrityResults),
    tenant_isolation_results: Object.freeze(tenantResults),
    executed_test_results: executed,
    failures,
    warnings: conditional ? Object.freeze(["Minor metadata gap blocks production certification but permits controlled testing."]) : Object.freeze([]),
    replay_matrix: replayMatrix,
    replay_hashes: replayRefs,
    truth_ledger_references: uniq([explanation.truth_record_reference, ...policy.source_truth_records]),
    evidence_references: evidence,
    evidence_package: evidencePackage,
    operator_approval_status: certification_state === "PASS" ? "APPROVED_FOR_PRODUCTION" as const : certification_state === "CONDITIONAL_PASS" ? "APPROVED_FOR_CONTROLLED_TESTING" as const : "BLOCKED" as const,
    certification_signature: hashValue("lineage-certification-signature", { certification_state, failures, replayRefs }),
    source_artifacts: Object.freeze({ governance_lineage: governance, policy_lineage: policy, decision_influence: influence, explanation }),
  };
  return Object.freeze({ ...source, report_hash: computeLineageCertificationReportHash(source) });
}

function matrix(artifact: string, pass: boolean, replay_hash: string): LineageReplayMatrixEntry {
  return Object.freeze({ artifact, required_result: "IDENTICAL", actual_result: pass ? "IDENTICAL" : "MISMATCH", replay_hash });
}

function evidencePackageFor(governance_lineage_hash: string, policy_lineage_hash: string, decision_influence_hash: string, explanation_hash: string, replay_hashes: readonly string[], truth_ledger_references: readonly string[], evidence_references: readonly string[]): LineageCertificationEvidencePackage {
  const source = { governance_lineage_hash, policy_lineage_hash, decision_influence_hash, explanation_hash, replay_hashes: uniq(replay_hashes), truth_ledger_references: uniq(truth_ledger_references), evidence_references: uniq(evidence_references), audit_artifacts: uniq(["governance_lineage", "policy_lineage", "decision_influence", "governance_explanation"]) };
  return Object.freeze({ ...source, evidence_package_hash: hashValue("lineage-certification-evidence-package", source) });
}

export function computeLineageCertificationReportHash(report: Omit<LineageCertificationReport, "report_hash"> | LineageCertificationReport): string {
  const { report_hash: _hash, ...source } = report as LineageCertificationReport;
  return hashValue("lineage-certification-report", source);
}

export function validateLineageCertificationReport(report: LineageCertificationReport) {
  const hash_valid = computeLineageCertificationReportHash(report) === report.report_hash;
  const replay_matrix_valid = report.replay_matrix.every((item) => item.actual_result === "IDENTICAL");
  const tests_passed = report.executed_test_results.every((item) => item.passed);
  return Object.freeze({
    certification_id: report.certification_id,
    validation_state: hash_valid && replay_matrix_valid && tests_passed && report.certification_state !== "FAIL" ? "PASS" as const : "FAIL" as const,
    hash_valid,
    replay_matrix_valid,
    tests_passed,
    failures: report.failures,
  });
}

export function buildLineageCertificationObservabilitySurface(report = runLineageCertification()): LineageCertificationObservabilitySurface {
  const failed = report.executed_test_results.filter((item) => !item.passed).length;
  return Object.freeze({
    certification_id: report.certification_id,
    certification_state: report.certification_state,
    total_tests: report.executed_test_results.length,
    passed_tests: report.executed_test_results.length - failed,
    failed_tests: failed,
    failures: report.failures,
    replay_matrix_state: report.replay_matrix.every((item) => item.actual_result === "IDENTICAL") ? "IDENTICAL" : "MISMATCH",
    operator_approval_status: report.operator_approval_status,
    advisory_only_notice: "Lineage certification is advisory-only; it certifies governance lineage readiness without granting execution authority.",
  });
}

export function getLineageCertificationContract() {
  const report = runLineageCertification();
  return Object.freeze({
    doctrine: Object.freeze({ principles: Object.freeze(["deterministic", "replayable", "explainable", "immutable", "constitution-first", "evidence-backed", "tenant-safe", "auditable", "advisory-only", "fail-closed"]), schema_version: SCHEMA_VERSION, certification_states: Object.freeze(["PASS", "CONDITIONAL_PASS", "FAIL"] as const) }),
    report,
    observability: buildLineageCertificationObservabilitySurface(report),
  });
}
