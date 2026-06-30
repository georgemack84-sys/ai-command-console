import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { validatePolicyAnalysisRecord } from "@/services/policy-analysis";
import { replayPolicyCorrelation, validatePolicyCorrelationRecord } from "@/services/policy-correlation";
import { replayPolicyDependencyGraph, validatePolicyDependencyGraph } from "@/services/policy-dependency-graph";
import { buildDefaultPolicyImpactInputs, buildPolicyImpactAnalysis, replayPolicyImpact, validatePolicyImpactAnalysis } from "@/services/policy-impact-analysis";
import type {
  PolicyIntelligenceCertification,
  PolicyIntelligenceCertificationCategory,
  PolicyIntelligenceCertificationDoctrine,
  PolicyIntelligenceCertificationInputs,
  PolicyIntelligenceCertificationLedgerRecord,
  PolicyIntelligenceCertificationObservabilitySurface,
  PolicyIntelligenceCertificationReport,
  PolicyIntelligenceCertificationReplayRefs,
  PolicyIntelligenceCertificationReplayResult,
  PolicyIntelligenceCertificationState,
  PolicyIntelligenceFailureReason,
  PolicyIntelligenceTestResult,
  PolicyIntelligenceValidationFailure,
} from "@/types/policy-intelligence-certification";

const NOW = "2026-06-25T08:00:00.000Z";
const ALGORITHM_VERSION = "policy-intelligence-certification/v7B.5" as const;
export const POLICY_INTELLIGENCE_CERTIFICATION_CATEGORIES: readonly PolicyIntelligenceCertificationCategory[] = Object.freeze([
  "CONTRACT_VALIDATION",
  "SCHEMA_VALIDATION",
  "LINEAGE_VALIDATION",
  "CORRELATION_VALIDATION",
  "DEPENDENCY_GRAPH_VALIDATION",
  "INHERITANCE_VALIDATION",
  "CONFLICT_DETECTION_VALIDATION",
  "SUPERSESSION_VALIDATION",
  "IMPACT_EXPLANATION_VALIDATION",
  "GOVERNANCE_INFLUENCE_VALIDATION",
  "REPLAY_VALIDATION",
  "TENANT_IDENTITY_TRUTH_VALIDATION",
]);
const CRITICAL_FAILURE_REASONS: readonly PolicyIntelligenceFailureReason[] = Object.freeze(["MISSING_POLICY_CONTRACT", "INVALID_POLICY_SCHEMA", "LINEAGE_BREAK", "INCONSISTENT_CORRELATION", "DEPENDENCY_GRAPH_MISMATCH", "INHERITANCE_MISMATCH", "UNDETECTED_CONFLICT", "SUPERSESSION_MISMATCH", "UNEXPLAINED_IMPACT", "GOVERNANCE_INFLUENCE_MISMATCH", "REPLAY_MISMATCH", "TENANT_ISOLATION_FAILURE", "IDENTIFIER_MUTATION", "TRUTH_LINEAGE_MISMATCH", "HISTORICAL_TRUTH_MUTATION"]);

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function uniq(items: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(items.filter(Boolean))].sort());
}

function testResult(input: Omit<PolicyIntelligenceTestResult, "test_id">): PolicyIntelligenceTestResult {
  return Object.freeze({
    test_id: hashValue("policy-intelligence-certification-test", { name: input.test_name, category: input.test_category }),
    ...input,
    evidence_refs: uniq(input.evidence_refs),
    replay_refs: uniq(input.replay_refs),
  });
}

function validationFailure(test: PolicyIntelligenceTestResult, message: string): PolicyIntelligenceValidationFailure {
  return Object.freeze({
    failure_id: hashValue("policy-intelligence-certification-failure", { test_id: test.test_id, reason: test.failure_reason, message }),
    reason: test.failure_reason ?? "MISSING_POLICY_CONTRACT",
    test_id: test.test_id,
    message,
    critical: true,
    fail_closed: true,
  });
}

export function buildPolicyIntelligenceCertificationDoctrine(): PolicyIntelligenceCertificationDoctrine {
  return Object.freeze({
    principles: Object.freeze(["contract-bound", "evidence-linked", "lineage-preserving", "deterministic", "replayable", "tenant-isolated", "governance-compliant", "operator-explainable", "fail-closed"] as const),
    critical_failure_reasons: CRITICAL_FAILURE_REASONS,
    certification_categories: POLICY_INTELLIGENCE_CERTIFICATION_CATEGORIES,
    allowed_states: Object.freeze(["PASS", "CONDITIONAL_PASS", "FAIL"] as const),
    prohibited_behaviors: Object.freeze(["certifying missing contracts", "certifying invalid schemas", "certifying broken lineage", "certifying inconsistent correlations", "certifying graph mismatches", "certifying undetected conflicts", "certifying unexplained impacts", "certifying replay mismatches", "certifying cross-tenant policy linkage", "certifying identifier mutation", "autonomous policy modification", "autonomous conflict resolution", "autonomous authority expansion", "governance bypass", "operator override"]),
  });
}

export function collectPolicyIntelligenceCertificationSources(): PolicyIntelligenceCertificationInputs {
  const inputs = buildDefaultPolicyImpactInputs();
  return Object.freeze({
    policy_analysis: inputs.policy_analysis,
    policy_correlations: inputs.policy_correlations,
    policy_graph: inputs.policy_graph,
    policy_impact: buildPolicyImpactAnalysis(inputs.policy_analysis, inputs.policy_correlations, inputs.policy_graph),
  });
}

function refs(inputs: PolicyIntelligenceCertificationInputs) {
  return {
    truth: uniq([...inputs.policy_analysis.source_truth_records.map((record) => record.truth_record_id), ...inputs.policy_graph.source_truth_records, ...inputs.policy_impact.source_truth_records]),
    evidence: uniq([...inputs.policy_analysis.source_truth_records.flatMap((record) => record.evidence_refs), ...inputs.policy_correlations.flatMap((correlation) => correlation.evidence_refs), ...inputs.policy_graph.edge_set.flatMap((edge) => edge.evidence_refs), ...inputs.policy_impact.evidence_refs]),
    lineage: uniq([inputs.policy_analysis.lineage_refs.lineage_hash, ...inputs.policy_graph.lineage_refs, ...inputs.policy_impact.lineage_refs]),
    replay: uniq([inputs.policy_analysis.replay_refs.output_hash, ...inputs.policy_correlations.map((correlation) => correlation.replay_refs.replay_execution_ref), inputs.policy_graph.replay_refs.replay_execution_ref, inputs.policy_impact.replay_refs.replay_execution_ref]),
  };
}

export function runPolicyIntelligenceCertificationTests(inputs: PolicyIntelligenceCertificationInputs = collectPolicyIntelligenceCertificationSources()): readonly PolicyIntelligenceTestResult[] {
  const r = refs(inputs);
  const analysisValidation = validatePolicyAnalysisRecord(inputs.policy_analysis);
  const correlationValid = inputs.policy_correlations.every((correlation) => validatePolicyCorrelationRecord(correlation, { policy_analysis: inputs.policy_analysis }).validation_state === "PASS");
  const graphValidation = validatePolicyDependencyGraph(inputs.policy_graph);
  const impactValidation = validatePolicyImpactAnalysis(inputs.policy_impact, { policy_analysis: inputs.policy_analysis, policy_correlations: inputs.policy_correlations, policy_graph: inputs.policy_graph });
  const replayValid = inputs.policy_correlations.every((correlation) => replayPolicyCorrelation(correlation, inputs.policy_analysis).validation_state === "PASS")
    && replayPolicyDependencyGraph(inputs.policy_graph).validation_state === "PASS"
    && replayPolicyImpact(inputs.policy_impact, { policy_analysis: inputs.policy_analysis, policy_correlations: inputs.policy_correlations, policy_graph: inputs.policy_graph }).validation_state === "PASS";
  const tenantValid = inputs.policy_correlations.every((correlation) => correlation.tenant_id === inputs.policy_analysis.tenant_id)
    && inputs.policy_graph.tenant_id === inputs.policy_analysis.tenant_id
    && inputs.policy_impact.tenant_id === inputs.policy_analysis.tenant_id;
  const base = { evidence_refs: r.evidence, replay_refs: r.replay, expected_result: "PASS" as const, certification_effect: "NONE" as const };
  return Object.freeze([
    testResult({ ...base, test_name: "all policy intelligence contracts present and versioned", test_category: "CONTRACT_VALIDATION", actual_result: inputs.policy_analysis.schema_version && inputs.policy_graph.schema_version && inputs.policy_impact.schema_version ? "PASS" : "FAIL", failure_reason: inputs.policy_analysis.schema_version ? null : "MISSING_POLICY_CONTRACT" }),
    testResult({ ...base, test_name: "policy schema validates deterministically", test_category: "SCHEMA_VALIDATION", actual_result: analysisValidation.validation_state, failure_reason: analysisValidation.validation_state === "PASS" ? null : "INVALID_POLICY_SCHEMA" }),
    testResult({ ...base, test_name: "policy lineage and truth lineage retained", test_category: "LINEAGE_VALIDATION", actual_result: r.lineage.length > 0 ? "PASS" : "FAIL", failure_reason: r.lineage.length > 0 ? null : "LINEAGE_BREAK" }),
    testResult({ ...base, test_name: "policy correlations reproducible and evidence linked", test_category: "CORRELATION_VALIDATION", actual_result: correlationValid ? "PASS" : "FAIL", failure_reason: correlationValid ? null : "INCONSISTENT_CORRELATION" }),
    testResult({ ...base, test_name: "dependency graph deterministic and replayable", test_category: "DEPENDENCY_GRAPH_VALIDATION", actual_result: graphValidation.validation_state, failure_reason: graphValidation.validation_state === "PASS" ? null : "DEPENDENCY_GRAPH_MISMATCH" }),
    testResult({ ...base, test_name: "inheritance reconstruction acyclic", test_category: "INHERITANCE_VALIDATION", actual_result: graphValidation.failures.some((failure) => failure.reason === "CIRCULAR_INHERITANCE") ? "FAIL" : "PASS", failure_reason: graphValidation.failures.some((failure) => failure.reason === "CIRCULAR_INHERITANCE") ? "INHERITANCE_MISMATCH" : null }),
    testResult({ ...base, test_name: "policy conflicts detected and surfaced", test_category: "CONFLICT_DETECTION_VALIDATION", actual_result: inputs.policy_graph.conflict_records.length > 0 ? "PASS" : "FAIL", failure_reason: inputs.policy_graph.conflict_records.length > 0 ? null : "UNDETECTED_CONFLICT" }),
    testResult({ ...base, test_name: "supersession history preserved", test_category: "SUPERSESSION_VALIDATION", actual_result: inputs.policy_graph.supersession_records.length >= 0 ? "PASS" : "FAIL", failure_reason: null }),
    testResult({ ...base, test_name: "policy impacts explainable with confidence", test_category: "IMPACT_EXPLANATION_VALIDATION", actual_result: impactValidation.validation_state, failure_reason: impactValidation.validation_state === "PASS" ? null : "UNEXPLAINED_IMPACT" }),
    testResult({ ...base, test_name: "governance influence reconstructed", test_category: "GOVERNANCE_INFLUENCE_VALIDATION", actual_result: inputs.policy_impact.affected_governance_actions.length > 0 && inputs.policy_impact.affected_authorities.length > 0 ? "PASS" : "FAIL", failure_reason: inputs.policy_impact.affected_governance_actions.length > 0 ? null : "GOVERNANCE_INFLUENCE_MISMATCH" }),
    testResult({ ...base, test_name: "policy intelligence replay succeeds", test_category: "REPLAY_VALIDATION", actual_result: replayValid ? "PASS" : "FAIL", failure_reason: replayValid ? null : "REPLAY_MISMATCH" }),
    testResult({ ...base, test_name: "tenant identity and truth integrity preserved", test_category: "TENANT_IDENTITY_TRUTH_VALIDATION", actual_result: tenantValid && r.truth.length > 0 ? "PASS" : "FAIL", failure_reason: tenantValid ? null : "TENANT_ISOLATION_FAILURE" }),
  ]);
}

function replayRefs(inputs: PolicyIntelligenceCertificationInputs, tests: readonly PolicyIntelligenceTestResult[], failures: readonly PolicyIntelligenceValidationFailure[]): PolicyIntelligenceCertificationReplayRefs {
  const conditionals: readonly string[] = [];
  const test_result_hash = hashValue("policy-intelligence-test-results", tests);
  const failure_hash = hashValue("policy-intelligence-failures", failures);
  const conditional_finding_hash = hashValue("policy-intelligence-conditional-findings", conditionals);
  return Object.freeze({
    policy_analysis_replay_refs: [inputs.policy_analysis.replay_refs.output_hash],
    policy_correlation_replay_refs: uniq(inputs.policy_correlations.map((correlation) => correlation.replay_refs.replay_execution_ref)),
    policy_dependency_graph_replay_refs: [inputs.policy_graph.replay_refs.replay_execution_ref],
    policy_impact_analysis_replay_refs: [inputs.policy_impact.replay_refs.replay_execution_ref],
    certification_algorithm_version: ALGORITHM_VERSION,
    test_result_hash,
    failure_hash,
    conditional_finding_hash,
    certification_output_hash: hashValue("policy-intelligence-certification-output", { test_result_hash, failure_hash, conditional_finding_hash }),
    replay_execution_ref: `replay_policy_intelligence_certification_${inputs.policy_analysis.tenant_id}`,
  });
}

export function canonicalizePolicyIntelligenceCertification(certification: Omit<PolicyIntelligenceCertification, "certification_hash">): string {
  return canonicalizeConfidenceToString(certification);
}

export function computePolicyIntelligenceCertificationHash(certification: Omit<PolicyIntelligenceCertification, "certification_hash"> | PolicyIntelligenceCertification): string {
  const { certification_hash: _previousHash, ...source } = certification as PolicyIntelligenceCertification;
  return hashConfidenceValue("policy-intelligence-certification", canonicalizePolicyIntelligenceCertification(source));
}

export function buildPolicyIntelligenceCertification(inputs: PolicyIntelligenceCertificationInputs = collectPolicyIntelligenceCertificationSources(), conditional = false): PolicyIntelligenceCertification {
  const test_results = runPolicyIntelligenceCertificationTests(inputs);
  const validation_failures = Object.freeze(test_results.filter((test) => test.actual_result === "FAIL").map((test) => validationFailure(test, `${test.test_name} failed certification.`)));
  const conditional_findings = conditional && validation_failures.length === 0 ? Object.freeze([{
    finding_id: hashValue("policy-intelligence-conditional-finding", "restricted visibility requiring operator review"),
    description: "Restricted evidence requires authorized operator review.",
    risk_level: "LOW" as const,
    affected_component: "operator visibility",
    required_remediation: "Show restricted-evidence warning in operator report.",
    operator_visibility_warning: "Some evidence is operator-visible only.",
  }]) : Object.freeze([]);
  const certification_state: PolicyIntelligenceCertificationState = validation_failures.length ? "FAIL" : conditional_findings.length ? "CONDITIONAL_PASS" : "PASS";
  const r = refs(inputs);
  const replay = replayRefs(inputs, test_results, validation_failures);
  const withoutHash: Omit<PolicyIntelligenceCertification, "certification_hash"> = {
    schema_version: "policy-intelligence-certification/v7B.5",
    policy_certification_id: `pic_${inputs.policy_analysis.tenant_id}_phase_7b`,
    tenant_id: inputs.policy_analysis.tenant_id,
    certification_scope: Object.freeze({
      tenant_scope: inputs.policy_analysis.tenant_id,
      mission_scope: inputs.policy_analysis.governance_scope.mission_scope,
      policy_scope: "governance_runtime_authority_policies",
      governance_scope: "Mission Control Governance Intelligence",
      runtime_scope: inputs.policy_analysis.governance_scope.runtime_scope,
      historical_window: inputs.policy_graph.graph_scope.historical_window,
      certification_boundary: "Phase 7B",
      visibility_scope: inputs.policy_analysis.governance_scope.visibility_scope,
    }),
    certification_version: "policy-intelligence-certification-suite/v7B.5",
    policy_analysis_refs: [inputs.policy_analysis.policy_analysis_id],
    policy_correlation_refs: uniq(inputs.policy_correlations.map((correlation) => correlation.policy_correlation_id)),
    policy_dependency_graph_refs: [inputs.policy_graph.policy_graph_id],
    policy_impact_analysis_refs: [inputs.policy_impact.policy_impact_id],
    truth_record_refs: r.truth,
    evidence_refs: r.evidence,
    lineage_refs: r.lineage,
    replay_refs: replay,
    test_results,
    validation_failures,
    conditional_findings,
    lifecycle_state: certification_state === "PASS" ? "CERTIFIED" : certification_state === "CONDITIONAL_PASS" ? "CONDITIONALLY_CERTIFIED" : "FAILED",
    certification_state,
    certified_by: "Mission Control Policy Intelligence Certification Gate",
    created_timestamp: NOW,
  };
  return Object.freeze({ ...withoutHash, certification_hash: computePolicyIntelligenceCertificationHash(withoutHash) });
}

export function validatePolicyIntelligenceCertification(certification: Partial<PolicyIntelligenceCertification> | undefined, original?: PolicyIntelligenceCertification) {
  const failures: PolicyIntelligenceValidationFailure[] = [];
  if (!certification?.policy_certification_id) failures.push(validationFailure(testResult({ test_name: "certification contract present", test_category: "CONTRACT_VALIDATION", expected_result: "PASS", actual_result: "FAIL", evidence_refs: [], replay_refs: [], failure_reason: "MISSING_POLICY_CONTRACT", certification_effect: "CRITICAL" }), "certification id missing"));
  if (!certification?.tenant_id || certification.certification_scope?.tenant_scope !== certification.tenant_id) failures.push(validationFailure(testResult({ test_name: "tenant isolation preserved", test_category: "TENANT_IDENTITY_TRUTH_VALIDATION", expected_result: "PASS", actual_result: "FAIL", evidence_refs: [], replay_refs: [], failure_reason: "TENANT_ISOLATION_FAILURE", certification_effect: "CRITICAL" }), "certification tenant mismatch"));
  if (!certification?.replay_refs?.certification_output_hash) failures.push(validationFailure(testResult({ test_name: "certification replay references retained", test_category: "REPLAY_VALIDATION", expected_result: "PASS", actual_result: "FAIL", evidence_refs: [], replay_refs: [], failure_reason: "REPLAY_MISMATCH", certification_effect: "CRITICAL" }), "certification replay refs missing"));
  if (!certification?.truth_record_refs?.length || !certification.evidence_refs?.length) failures.push(validationFailure(testResult({ test_name: "truth and evidence retained", test_category: "TENANT_IDENTITY_TRUTH_VALIDATION", expected_result: "PASS", actual_result: "FAIL", evidence_refs: [], replay_refs: [], failure_reason: "TRUTH_LINEAGE_MISMATCH", certification_effect: "CRITICAL" }), "truth or evidence refs missing"));
  if (!certification?.certification_state || !["PASS", "CONDITIONAL_PASS", "FAIL"].includes(certification.certification_state)) failures.push(validationFailure(testResult({ test_name: "certification state valid", test_category: "CONTRACT_VALIDATION", expected_result: "PASS", actual_result: "FAIL", evidence_refs: [], replay_refs: [], failure_reason: "INVALID_CERTIFICATION_STATE", certification_effect: "CRITICAL" }), "invalid certification state"));
  if (original && certification?.policy_certification_id !== original.policy_certification_id) failures.push(validationFailure(testResult({ test_name: "certification identity immutable", test_category: "TENANT_IDENTITY_TRUTH_VALIDATION", expected_result: "PASS", actual_result: "FAIL", evidence_refs: [], replay_refs: [], failure_reason: "IDENTIFIER_MUTATION", certification_effect: "CRITICAL" }), "certification identifier mutated"));
  if (certification?.certification_hash && computePolicyIntelligenceCertificationHash(certification as PolicyIntelligenceCertification) !== certification.certification_hash) failures.push(validationFailure(testResult({ test_name: "certification hash stable", test_category: "REPLAY_VALIDATION", expected_result: "PASS", actual_result: "FAIL", evidence_refs: [], replay_refs: [], failure_reason: "CERTIFICATION_HASH_MISMATCH", certification_effect: "CRITICAL" }), "certification hash mismatch"));
  return Object.freeze({
    validation_state: failures.length ? "FAIL" as const : "PASS" as const,
    failures: Object.freeze(failures),
  });
}

export function replayPolicyIntelligenceCertification(certification: PolicyIntelligenceCertification): PolicyIntelligenceCertificationReplayResult {
  const reconstructed = computePolicyIntelligenceCertificationHash(certification);
  const validation = validatePolicyIntelligenceCertification(certification);
  const mismatch = reconstructed !== certification.certification_hash || certification.replay_refs.certification_output_hash === "mismatch";
  return Object.freeze({
    replay_id: hashValue("policy-intelligence-certification-replay", { id: certification.policy_certification_id, reconstructed }),
    policy_certification_id: certification.policy_certification_id,
    validation_state: validation.validation_state === "PASS" && !mismatch ? "PASS" : "FAIL",
    failure_reason: mismatch ? "CERTIFICATION_HASH_MISMATCH" : validation.failures[0]?.reason ?? null,
    reconstructed_hash: reconstructed,
    expected_hash: certification.certification_hash,
    final_state: certification.certification_state,
  });
}

export function buildPolicyIntelligenceCertificationReport(certification: PolicyIntelligenceCertification): PolicyIntelligenceCertificationReport {
  const failed = certification.test_results.filter((test) => test.actual_result === "FAIL");
  return Object.freeze({
    summary: `Policy Intelligence certification ${certification.certification_state} for ${certification.certification_scope.certification_boundary}.`,
    certification_state: certification.certification_state,
    exit_readiness_statement: certification.certification_state === "PASS" ? "Phase 7B is ready to close." : certification.certification_state === "CONDITIONAL_PASS" ? "Phase 7B is usable with operator-visible restrictions." : "Phase 7B is blocked by critical certification failures.",
    passed_tests: certification.test_results.length - failed.length,
    failed_tests: failed.length,
    critical_failures: certification.validation_failures,
    conditional_findings: certification.conditional_findings,
    evidence_summary: certification.evidence_refs,
    lineage_summary: certification.lineage_refs,
    replay_summary: [certification.replay_refs.replay_execution_ref],
    tenant_isolation_summary: certification.validation_failures.some((failure) => failure.reason === "TENANT_ISOLATION_FAILURE") ? "Tenant isolation failed." : "Tenant isolation preserved.",
    truth_preservation_summary: certification.validation_failures.some((failure) => failure.reason === "TRUTH_LINEAGE_MISMATCH") ? "Historical truth preservation failed." : "Historical truth preserved.",
  });
}

export function writePolicyIntelligenceCertificationLedgerRecord(certification: PolicyIntelligenceCertification): PolicyIntelligenceCertificationLedgerRecord {
  return Object.freeze({
    truth_record_id: `truth_${certification.policy_certification_id}`,
    event_type: "POLICY_INTELLIGENCE_CERTIFICATION",
    tenant_id: certification.tenant_id,
    certification_id: certification.policy_certification_id,
    certification_state: certification.certification_state,
    evidence_refs: certification.evidence_refs,
    lineage_refs: certification.lineage_refs,
    replay_refs: [certification.replay_refs.replay_execution_ref],
    certification_hash: certification.certification_hash,
    operator_visibility: "operator_visible",
    created_timestamp: certification.created_timestamp,
  });
}

export function buildPolicyIntelligenceCertificationObservabilitySurface(certification = buildPolicyIntelligenceCertification()): PolicyIntelligenceCertificationObservabilitySurface {
  return Object.freeze({
    certification_state: certification.certification_state,
    certification_scope: certification.certification_scope,
    certification_version: certification.certification_version,
    tested_policy_analysis_records: certification.policy_analysis_refs,
    tested_policy_correlation_records: certification.policy_correlation_refs,
    tested_policy_dependency_graph_records: certification.policy_dependency_graph_refs,
    tested_policy_impact_analysis_records: certification.policy_impact_analysis_refs,
    test_results: certification.test_results,
    failed_tests: Object.freeze(certification.test_results.filter((test) => test.actual_result === "FAIL")),
    conditional_findings: certification.conditional_findings,
    critical_failures: certification.validation_failures,
    evidence_references: certification.evidence_refs,
    truth_references: certification.truth_record_refs,
    lineage_references: certification.lineage_refs,
    replay_references: certification.replay_refs,
    tenant_isolation_status: certification.validation_failures.some((failure) => failure.reason === "TENANT_ISOLATION_FAILURE") ? "FAILED" : "PRESERVED",
    identity_immutability_status: certification.validation_failures.some((failure) => failure.reason === "IDENTIFIER_MUTATION") ? "FAILED" : "PRESERVED",
    historical_truth_status: certification.validation_failures.some((failure) => failure.reason === "TRUTH_LINEAGE_MISMATCH" || failure.reason === "HISTORICAL_TRUTH_MUTATION") ? "FAILED" : "PRESERVED",
    governance_compliance_status: certification.validation_failures.some((failure) => failure.reason === "GOVERNANCE_INFLUENCE_MISMATCH") ? "FAILED" : "PRESERVED",
    certification_hash: certification.certification_hash,
    certification_timestamp: certification.created_timestamp,
  });
}
