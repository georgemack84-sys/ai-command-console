import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { buildRecommendationContractRecord, certifyRecommendationContract, validateRecommendationContractRecord } from "@/services/recommendation-contract";
import { generateRecommendations, replayRecommendationGeneration, validateRecommendationGeneration } from "@/services/recommendation-generation";
import { generateAlternativeGovernancePaths, replayAlternativePathGeneration, validateAlternativePathGeneration } from "@/services/recommendation-paths";
import { buildRecommendationValidationObservabilitySurface, replayRecommendationValidation, validateRecommendation } from "@/services/recommendation-validation";
import type { RecommendationCertificationState, RecommendationReplayState } from "@/types/recommendation-contract";
import type {
  RecommendationCertificationComponentKey,
  RecommendationCertificationDoctrine,
  RecommendationCertificationFailureClass,
  RecommendationCertificationFinding,
  RecommendationCertificationInputSet,
  RecommendationCertificationRecord,
  RecommendationCertificationReplayResult,
  RecommendationCertificationReport,
  RecommendationCertificationTestResult,
  RecommendationCertificationValidationResult,
} from "@/types/recommendation-certification";

const NOW: "2026-06-26T13:00:00.000Z" = "2026-06-26T13:00:00.000Z";
const CONTRACT_VERSION: "RECOMMENDATION-CERTIFICATION-V1" = "RECOMMENDATION-CERTIFICATION-V1";
const COMPONENTS: readonly RecommendationCertificationComponentKey[] = Object.freeze(["contract_certification_result", "generation_certification_result", "alternative_path_certification_result", "validation_certification_result", "replay_certification_result", "evidence_certification_result", "risk_certification_result", "confidence_certification_result", "governance_boundary_result", "advisory_only_result", "tenant_isolation_result", "truth_ledger_result", "operator_visibility_result"]);
const BLOCKING_FAILURES: readonly RecommendationCertificationFailureClass[] = Object.freeze(["CONTRACT_MISSING_ACCEPTED", "UNSUPPORTED_RECOMMENDATION_ACCEPTED", "GENERATION_MISMATCH", "UNSUPPORTED_RECOMMENDATION_GENERATED", "PRIORITY_MISMATCH", "CONFIDENCE_MISMATCH", "ALTERNATIVE_PATH_MISMATCH", "PATH_ORDERING_MISMATCH", "PATH_COMPARISON_MISMATCH", "VALIDATION_MISMATCH", "UNSUPPORTED_RECOMMENDATION_VALIDATED", "BOUNDARY_VIOLATION_ACCEPTED", "REPLAY_MISMATCH", "MISSING_EVIDENCE_ACCEPTED", "EVIDENCE_LINEAGE_MISMATCH", "RISK_SCORE_MISMATCH", "CRITICAL_RISK_ESCALATION_MISSING", "CONFIDENCE_INFLATION_ACCEPTED", "GOVERNANCE_VIOLATION_ACCEPTED", "CONSTITUTIONAL_CONFLICT_ACCEPTED", "EXECUTION_AUTHORITY_ACCEPTED", "MUTATION_AUTHORITY_ACCEPTED", "TENANT_ISOLATION_FAILURE", "TRUTH_LEDGER_LINKAGE_MISSING", "LEDGER_MUTATION_ACCEPTED", "OPERATOR_VISIBILITY_INCOMPLETE", "CERTIFICATION_HASH_MISMATCH", "CERTIFICATION_DECISION_MISMATCH", "HIDDEN_CERTIFICATION_STATE"]);

type Overrides = Partial<Record<RecommendationCertificationComponentKey, Partial<RecommendationCertificationTestResult>>>;

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function uniqueSorted(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values.filter(Boolean))].sort());
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function tenantLeak(ref: unknown, tenant_id: string | undefined): boolean {
  if (!tenant_id || typeof ref !== "string") return false;
  const match = ref.match(/tenant_(alpha|beta|[0-9]+)/i);
  return Boolean(match && match[0] !== tenant_id);
}

function containsTenantLeak(value: unknown, tenant_id: string | undefined): boolean {
  if (tenantLeak(value, tenant_id)) return true;
  if (Array.isArray(value)) return value.some((item) => containsTenantLeak(item, tenant_id));
  if (isRecord(value)) return Object.values(value).some((item) => containsTenantLeak(item, tenant_id));
  return false;
}

function inputSet(tenant_id: string, mission_id: string): RecommendationCertificationInputSet {
  return Object.freeze({
    valid_recommendation_contract: `valid_contract_${tenant_id}_${mission_id}`,
    invalid_recommendation_contract: "missing_contract_case",
    policy_update_case: "POLICY_CONFLICT",
    control_improvement_case: "CONTROL_GAP",
    escalation_case: "ESCALATION_REQUIRED",
    compliance_improvement_case: "COMPLIANCE_GAP",
    remediation_case: "REMEDIATION_REQUIRED",
    monitoring_case: "MONITORING_GAP",
    certification_recommendation_case: "CERTIFICATION_READY",
    unsupported_recommendation_case: "UNSUPPORTED_RECOMMENDATION",
    missing_evidence_case: "MISSING_EVIDENCE",
    weak_evidence_case: "PARTIAL_EVIDENCE",
    conflicting_evidence_case: "EVIDENCE_CONFLICT",
    high_risk_case: "ESCALATION_REQUIRED",
    critical_risk_case: "CRITICAL_RISK",
    confidence_mismatch_case: "CONFIDENCE_MISMATCH",
    tenant_violation_case: "CROSS_TENANT",
    replay_mismatch_case: "REPLAY_MISMATCH",
    execution_authority_case: "EXECUTION_AUTHORITY",
  });
}

function testResult(input: Omit<RecommendationCertificationTestResult, "test_count" | "passed_count" | "failed_count" | "replay_state" | "deterministic" | "tenant_safe" | "advisory_only"> & Partial<Pick<RecommendationCertificationTestResult, "test_count" | "passed_count" | "failed_count" | "replay_state" | "deterministic" | "tenant_safe" | "advisory_only">>): RecommendationCertificationTestResult {
  const status = input.status;
  const test_count = input.test_count ?? 1;
  const failed_count = input.failed_count ?? (status === "FAIL" ? 1 : 0);
  const passed_count = input.passed_count ?? test_count - failed_count;
  return Object.freeze({
    component: input.component,
    status,
    test_count,
    passed_count,
    failed_count,
    deterministic: input.deterministic ?? status !== "FAIL",
    tenant_safe: input.tenant_safe ?? status !== "FAIL",
    advisory_only: input.advisory_only ?? true,
    replay_state: input.replay_state ?? (status === "FAIL" ? "MISMATCH" : "REPRODUCED"),
    failure_class: input.failure_class,
    rationale: input.rationale,
    evidence_refs: uniqueSorted(input.evidence_refs),
    replay_refs: uniqueSorted(input.replay_refs),
    truth_ledger_refs: uniqueSorted(input.truth_ledger_refs),
  });
}

function applyOverride(result: RecommendationCertificationTestResult, overrides: Overrides): RecommendationCertificationTestResult {
  const override = overrides[result.component];
  return override ? Object.freeze({ ...result, ...override }) : result;
}

function finding(component: RecommendationCertificationComponentKey, failure_class: RecommendationCertificationFailureClass, message: string): RecommendationCertificationFinding {
  const severity: RecommendationCertificationFinding["severity"] = failure_class.startsWith("MINOR_") ? "LOW" : ["OPERATOR_VISIBILITY_INCOMPLETE", "MISSING_EVIDENCE_ACCEPTED", "CONFIDENCE_INFLATION_ACCEPTED"].includes(failure_class) ? "HIGH" : "CRITICAL";
  return Object.freeze({
    finding_id: `RCF-7E5-${hashValue("recommendation-certification-finding", { component, failure_class, message }).slice(0, 10).toUpperCase()}`,
    component,
    failure_class,
    severity,
    message,
    remediation_ref: `remediate_7e5_${component}_${failure_class.toLowerCase()}`,
  });
}

function componentResults(record: Pick<RecommendationCertificationRecord, RecommendationCertificationComponentKey>): readonly RecommendationCertificationTestResult[] {
  return Object.freeze(COMPONENTS.map((component) => record[component]));
}

export function buildRecommendationCertificationDoctrine(): RecommendationCertificationDoctrine {
  return Object.freeze({
    principles: Object.freeze(["deterministic", "explainable", "evidence-supported", "risk-aware", "confidence-justified", "governance-compliant", "advisory-only", "tenant-safe", "truth-ledger-linked", "replayable", "operator-visible", "certification-ready", "fail-closed"] as const),
    certification_states: Object.freeze(["PASS", "CONDITIONAL_PASS", "FAIL"] as const),
    certification_scope: Object.freeze(["7E.1", "7E.2", "7E.3", "7E.4"] as const),
    blocking_failure_classes: BLOCKING_FAILURES,
    contract_version: CONTRACT_VERSION,
  });
}

function certifyContract(): RecommendationCertificationTestResult {
  const valid = buildRecommendationContractRecord();
  const validCert = certifyRecommendationContract(valid);
  const missingRejected = validateRecommendationContractRecord(undefined).validation_state === "INVALID";
  const unsupportedRejected = validateRecommendationContractRecord({ ...valid, recommendation_type: "UNSUPPORTED" as never }).errors.some((error) => error.reason === "UNSUPPORTED_RECOMMENDATION_TYPE");
  const pass = validCert.certification_state === "PASS" && missingRejected && unsupportedRejected;
  return testResult({ component: "contract_certification_result", status: pass ? "PASS" : "FAIL", failure_class: pass ? null : "CONTRACT_MISSING_ACCEPTED", rationale: "7E.1 contract schema, type control, required fields, scope, advisory boundary, replay, tenant, and ledger requirements are enforced.", evidence_refs: valid.evidence_refs, replay_refs: [valid.replay_requirements.replay_id], truth_ledger_refs: valid.truth_ledger_refs, test_count: 4 });
}

function certifyGeneration(): RecommendationCertificationTestResult {
  const baseline = generateRecommendations();
  const replay = replayRecommendationGeneration(baseline);
  const same = generateRecommendations();
  const scenarios = ["POLICY_CONFLICT", "CONTROL_GAP", "ESCALATION_REQUIRED", "COMPLIANCE_GAP", "REMEDIATION_REQUIRED", "MONITORING_GAP", "CERTIFICATION_READY"] as const;
  const generatedTypes = scenarios.map((scenario) => generateRecommendations({ scenario }).recommendations[0]?.recommendation_type);
  const expectedTypes = ["POLICY_UPDATE", "CONTROL_IMPROVEMENT", "ESCALATION_RECOMMENDATION", "COMPLIANCE_IMPROVEMENT", "REMEDIATION_RECOMMENDATION", "MONITORING_RECOMMENDATION", "CERTIFICATION_RECOMMENDATION"];
  const pass = baseline.generation_hash === same.generation_hash && replay.replay_state === "REPRODUCED" && expectedTypes.every((type) => generatedTypes.includes(type as never)) && validateRecommendationGeneration(baseline).validation_state === "VALID";
  return testResult({ component: "generation_certification_result", status: pass ? "PASS" : "FAIL", failure_class: pass ? null : "GENERATION_MISMATCH", rationale: "7E.2 generation is deterministic across supported recommendation categories, priorities, confidence, rationale, and lineage.", evidence_refs: baseline.aggregated_evidence.evidence_refs, replay_refs: baseline.ledger_record.replay_refs, truth_ledger_refs: baseline.ledger_record.truth_ledger_refs, test_count: 9 });
}

function certifyPaths(): RecommendationCertificationTestResult {
  const baseline = generateAlternativeGovernancePaths();
  const replay = replayAlternativePathGeneration(baseline);
  const same = generateAlternativeGovernancePaths();
  const validation = validateAlternativePathGeneration(baseline);
  const pathTypes = baseline.paths.map((path) => path.path_type);
  const pass = baseline.path_generation_hash === same.path_generation_hash && replay.replay_state === "REPRODUCED" && validation.validation_state === "VALID" && ["PREFERRED_PATH", "CONSERVATIVE_PATH", "REMEDIATION_PATH"].every((type) => pathTypes.includes(type as never));
  return testResult({ component: "alternative_path_certification_result", status: pass ? "PASS" : "FAIL", failure_class: pass ? null : "ALTERNATIVE_PATH_MISMATCH", rationale: "7E.3 paths reproduce preferred, conservative, required escalation/remediation, evidence binding, ordering, and comparison matrix.", evidence_refs: baseline.ledger_record.evidence_refs, replay_refs: baseline.ledger_record.replay_refs, truth_ledger_refs: baseline.ledger_record.truth_ledger_refs, test_count: 8 });
}

function certifyValidation(): RecommendationCertificationTestResult {
  const baseline = validateRecommendation();
  const same = validateRecommendation();
  const unsupportedRejected = validateRecommendation({ scenario: "UNSUPPORTED_RECOMMENDATION" }).validation.validation_state === "REJECTED";
  const boundaryBlocked = validateRecommendation({ scenario: "EXECUTION_AUTHORITY" }).validation.validation_state === "BLOCKED";
  const conditional = validateRecommendation({ scenario: "PARTIAL_EVIDENCE" }).validation.validation_state === "CONDITIONAL_VALIDATION";
  const replay = replayRecommendationValidation(baseline.validation);
  const pass = baseline.validation.validation_hash === same.validation.validation_hash && baseline.validation.validation_state === "VALIDATED" && unsupportedRejected && boundaryBlocked && conditional && replay.replay_state === "REPRODUCED";
  return testResult({ component: "validation_certification_result", status: pass ? "PASS" : "FAIL", failure_class: pass ? null : "VALIDATION_MISMATCH", rationale: "7E.4 validation decisions are deterministic and reject unsupported inputs, block authority violations, and flag conditional recommendations.", evidence_refs: baseline.ledger_record.evidence_refs, replay_refs: baseline.ledger_record.replay_refs, truth_ledger_refs: baseline.validation.truth_ledger_refs, test_count: 7 });
}

function certifyReplay(): RecommendationCertificationTestResult {
  const generation = generateRecommendations();
  const paths = generateAlternativeGovernancePaths();
  const validation = validateRecommendation();
  const pass = replayRecommendationGeneration(generation).replay_state === "REPRODUCED" && replayAlternativePathGeneration(paths).replay_state === "REPRODUCED" && replayRecommendationValidation(validation.validation).replay_state === "REPRODUCED";
  return testResult({ component: "replay_certification_result", status: pass ? "PASS" : "FAIL", failure_class: pass ? null : "REPLAY_MISMATCH", rationale: "Full recommendation pipeline replay reproduces generation, paths, validation, hashes, ordering, and decision state.", evidence_refs: generation.aggregated_evidence.evidence_refs, replay_refs: uniqueSorted([...generation.ledger_record.replay_refs, ...paths.ledger_record.replay_refs, ...validation.ledger_record.replay_refs]), truth_ledger_refs: uniqueSorted([...generation.ledger_record.truth_ledger_refs, ...paths.ledger_record.truth_ledger_refs, ...validation.validation.truth_ledger_refs]), test_count: 5 });
}

function certifyEvidence(): RecommendationCertificationTestResult {
  const baseline = validateRecommendation();
  const missingRejected = validateRecommendation({ scenario: "MISSING_EVIDENCE" }).validation.validation_state === "REJECTED";
  const unsupportedRejected = validateRecommendation({ scenario: "UNSUPPORTED_EVIDENCE" }).validation.validation_state === "REJECTED";
  const tenantBlocked = validateRecommendation({ scenario: "CROSS_TENANT" }).validation.validation_state === "BLOCKED";
  const pass = baseline.validation.evidence_result.status === "PASS" && missingRejected && unsupportedRejected && tenantBlocked;
  return testResult({ component: "evidence_certification_result", status: pass ? "PASS" : "FAIL", failure_class: pass ? null : "MISSING_EVIDENCE_ACCEPTED", rationale: "Evidence refs, lineage, integrity, conflict disclosure, tenant matching, and Truth Ledger evidence refs are enforced.", evidence_refs: baseline.ledger_record.evidence_refs, replay_refs: baseline.ledger_record.replay_refs, truth_ledger_refs: baseline.validation.truth_ledger_refs, test_count: 5 });
}

function certifyRisk(): RecommendationCertificationTestResult {
  const baseline = validateRecommendation();
  const missingRejected = validateRecommendation({ scenario: "MISSING_RISK" }).validation.validation_state === "REJECTED";
  const criticalBlocked = validateRecommendation({ scenario: "CRITICAL_WITHOUT_ESCALATION" }).validation.validation_state === "BLOCKED";
  const pass = baseline.validation.risk_result.status === "PASS" && missingRejected && criticalBlocked;
  return testResult({ component: "risk_certification_result", status: pass ? "PASS" : "FAIL", failure_class: pass ? null : "CRITICAL_RISK_ESCALATION_MISSING", rationale: "Risk refs, scores, severity, introduced and residual risk, rationale, replay, and critical escalation are enforced.", evidence_refs: baseline.ledger_record.evidence_refs, replay_refs: baseline.ledger_record.replay_refs, truth_ledger_refs: baseline.validation.truth_ledger_refs, test_count: 4 });
}

function certifyConfidence(): RecommendationCertificationTestResult {
  const baseline = validateRecommendation();
  const unsupportedRejected = validateRecommendation({ scenario: "UNSUPPORTED_CONFIDENCE" }).validation.validation_state === "REJECTED";
  const inflationRejected = validateRecommendation({ scenario: "INFLATED_CONFIDENCE" }).validation.validation_state === "REJECTED";
  const pass = baseline.validation.confidence_result.status === "PASS" && unsupportedRejected && inflationRejected;
  return testResult({ component: "confidence_certification_result", status: pass ? "PASS" : "FAIL", failure_class: pass ? null : "CONFIDENCE_INFLATION_ACCEPTED", rationale: "Confidence score, band, rationale, inputs, evidence alignment, risk alignment, and replay hash are reproducible.", evidence_refs: baseline.ledger_record.evidence_refs, replay_refs: baseline.ledger_record.replay_refs, truth_ledger_refs: baseline.validation.truth_ledger_refs, test_count: 4 });
}

function certifyGovernance(): RecommendationCertificationTestResult {
  const baseline = validateRecommendation();
  const policyRejected = validateRecommendation({ scenario: "POLICY_VIOLATION" }).validation.validation_state === "REJECTED";
  const constitutionalBlocked = validateRecommendation({ scenario: "CONSTITUTIONAL_CONFLICT" }).validation.validation_state === "BLOCKED";
  const pass = baseline.validation.governance_result.status === "PASS" && policyRejected && constitutionalBlocked;
  return testResult({ component: "governance_boundary_result", status: pass ? "PASS" : "FAIL", failure_class: pass ? null : "GOVERNANCE_VIOLATION_ACCEPTED", rationale: "Governance constraints, policy constraints, constitutional limits, authority boundaries, certification rules, escalation, and fail-closed behavior are enforced.", evidence_refs: baseline.ledger_record.evidence_refs, replay_refs: baseline.ledger_record.replay_refs, truth_ledger_refs: baseline.validation.truth_ledger_refs, test_count: 5 });
}

function certifyAdvisoryOnly(): RecommendationCertificationTestResult {
  const baseline = validateRecommendation();
  const executionBlocked = validateRecommendation({ scenario: "EXECUTION_AUTHORITY" }).validation.validation_state === "BLOCKED";
  const mutationBlocked = validateRecommendation({ scenario: "MUTATION_AUTHORITY" }).validation.validation_state === "BLOCKED";
  const pass = baseline.validation.advisory_only_result.status === "PASS" && executionBlocked && mutationBlocked;
  return testResult({ component: "advisory_only_result", status: pass ? "PASS" : "FAIL", failure_class: pass ? null : "EXECUTION_AUTHORITY_ACCEPTED", rationale: "Recommendations and paths remain advisory only with no execution, mutation, approval, deployment, enforcement, ledger mutation, or authority grant.", evidence_refs: baseline.ledger_record.evidence_refs, replay_refs: baseline.ledger_record.replay_refs, truth_ledger_refs: baseline.validation.truth_ledger_refs, test_count: 4, advisory_only: pass });
}

function certifyTenantIsolation(): RecommendationCertificationTestResult {
  const baseline = validateRecommendation();
  const crossTenantBlocked = validateRecommendation({ scenario: "CROSS_TENANT" }).validation.validation_state === "BLOCKED";
  const pass = baseline.validation.tenant_isolation_result.status === "PASS" && crossTenantBlocked;
  return testResult({ component: "tenant_isolation_result", status: pass ? "PASS" : "FAIL", failure_class: pass ? null : "TENANT_ISOLATION_FAILURE", rationale: "Recommendation, evidence, risk, policy, compliance, paths, lineage, and Truth Ledger refs remain tenant-scoped.", evidence_refs: baseline.ledger_record.evidence_refs, replay_refs: baseline.ledger_record.replay_refs, truth_ledger_refs: baseline.validation.truth_ledger_refs, test_count: 3, tenant_safe: pass });
}

function certifyTruthLedger(): RecommendationCertificationTestResult {
  const baseline = validateRecommendation();
  const missingRejected = validateRecommendation({ scenario: "MISSING_LEDGER_LINKAGE" }).validation.validation_state === "REJECTED";
  const mutationBlocked = validateRecommendation({ scenario: "LEDGER_MUTATION_ATTEMPT" }).validation.validation_state === "BLOCKED";
  const pass = baseline.validation.truth_ledger_result.status === "PASS" && baseline.ledger_record.validation_ledger_id && missingRejected && mutationBlocked;
  return testResult({ component: "truth_ledger_result", status: pass ? "PASS" : "FAIL", failure_class: pass ? null : "TRUTH_LEDGER_LINKAGE_MISSING", rationale: "Recommendation, alternative path, validation, certification, evidence, risk, confidence, replay, lineage, and visibility records are ledger-linked and append-only.", evidence_refs: baseline.ledger_record.evidence_refs, replay_refs: baseline.ledger_record.replay_refs, truth_ledger_refs: baseline.validation.truth_ledger_refs, test_count: 5 });
}

function certifyOperatorVisibility(): RecommendationCertificationTestResult {
  const validation = validateRecommendation();
  const surface = buildRecommendationValidationObservabilitySurface(validation);
  const pass = Boolean(surface.validation_summary && surface.evidence_basis.length && surface.risk_basis.length && surface.confidence_basis.rationale && surface.governance_constraints.length && surface.alternative_path_status && surface.advisory_only_status && surface.replay_readiness && surface.truth_ledger_linkage);
  return testResult({ component: "operator_visibility_result", status: pass ? "PASS" : "FAIL", failure_class: pass ? null : "OPERATOR_VISIBILITY_INCOMPLETE", rationale: "Operators can inspect recommendation summary, type, evidence, risk, confidence, governance constraints, alternatives, validation, certification, replay, advisory boundary, and failure rationale.", evidence_refs: validation.ledger_record.evidence_refs, replay_refs: validation.ledger_record.replay_refs, truth_ledger_refs: validation.validation.truth_ledger_refs, test_count: 8 });
}

export function computeRecommendationCertificationHash(record: Omit<RecommendationCertificationRecord, "certification_hash"> | RecommendationCertificationRecord): string {
  const { certification_hash: _hash, ...source } = record as RecommendationCertificationRecord;
  return hashValue("recommendation-certification", {
    certification_id: source.certification_id,
    tenant_id: source.tenant_id,
    mission_id: source.mission_id,
    phase_id: source.phase_id,
    certification_scope: source.certification_scope,
    certification_state: source.certification_state,
    component_results: COMPONENTS.map((component) => ({ component, status: source[component].status, failure_class: source[component].failure_class, deterministic: source[component].deterministic, tenant_safe: source[component].tenant_safe, advisory_only: source[component].advisory_only, replay_state: source[component].replay_state })),
    failed_tests: source.failed_tests,
    conditional_findings: source.conditional_findings.map((item) => item.finding_id),
    blocking_findings: source.blocking_findings.map((item) => item.finding_id),
    replay_refs: source.replay_refs,
    truth_ledger_refs: source.truth_ledger_refs,
    certifier_version: source.certifier_version,
  });
}

function decide(results: readonly RecommendationCertificationTestResult[]): RecommendationCertificationState {
  if (results.some((result) => result.status === "FAIL")) return "FAIL";
  if (results.some((result) => result.status === "CONDITIONAL_PASS")) return "CONDITIONAL_PASS";
  return "PASS";
}

export function runRecommendationCertification(input: { tenant_id?: string; mission_id?: string; component_overrides?: Overrides } = {}): RecommendationCertificationRecord {
  const tenant_id = input.tenant_id ?? "tenant_alpha";
  const mission_id = input.mission_id ?? "mission_governance_recommendation";
  const overrides = input.component_overrides ?? {};
  const results = COMPONENTS.map((component) => {
    const result = component === "contract_certification_result" ? certifyContract() :
      component === "generation_certification_result" ? certifyGeneration() :
      component === "alternative_path_certification_result" ? certifyPaths() :
      component === "validation_certification_result" ? certifyValidation() :
      component === "replay_certification_result" ? certifyReplay() :
      component === "evidence_certification_result" ? certifyEvidence() :
      component === "risk_certification_result" ? certifyRisk() :
      component === "confidence_certification_result" ? certifyConfidence() :
      component === "governance_boundary_result" ? certifyGovernance() :
      component === "advisory_only_result" ? certifyAdvisoryOnly() :
      component === "tenant_isolation_result" ? certifyTenantIsolation() :
      component === "truth_ledger_result" ? certifyTruthLedger() :
      certifyOperatorVisibility();
    return applyOverride(result, overrides);
  });
  const byComponent = Object.fromEntries(results.map((result) => [result.component, result])) as Record<RecommendationCertificationComponentKey, RecommendationCertificationTestResult>;
  const certification_state = decide(results);
  const failed_tests = Object.freeze(results.filter((result) => result.status === "FAIL").map((result) => result.component));
  const conditional_findings = Object.freeze(results.filter((result) => result.status === "CONDITIONAL_PASS" && result.failure_class).map((result) => finding(result.component, result.failure_class!, result.rationale)));
  const blocking_findings = Object.freeze(results.filter((result) => result.status === "FAIL" && result.failure_class).map((result) => finding(result.component, result.failure_class!, result.rationale)));
  const summary = certification_state === "PASS" ? "Phase 7E is certified deterministic, explainable, evidence-supported, risk-aware, confidence-justified, governed, advisory-only, tenant-safe, ledger-linked, replayable, and operator-visible." : certification_state === "CONDITIONAL_PASS" ? "Phase 7E core recommendation intelligence is certified with minor non-boundary gaps that block production certification." : "Phase 7E certification failed closed because one or more recommendation intelligence boundaries did not certify.";
  const withoutHash: Omit<RecommendationCertificationRecord, "certification_hash"> = {
    certification_id: `RCERT-7E5-${hashValue("recommendation-certification-id", { tenant_id, mission_id }).slice(0, 10).toUpperCase()}`,
    tenant_id,
    mission_id,
    phase_id: "7E",
    certification_scope: Object.freeze(["7E.1", "7E.2", "7E.3", "7E.4"] as const),
    certification_state,
    certification_summary: summary,
    input_set: inputSet(tenant_id, mission_id),
    contract_certification_result: byComponent.contract_certification_result,
    generation_certification_result: byComponent.generation_certification_result,
    alternative_path_certification_result: byComponent.alternative_path_certification_result,
    validation_certification_result: byComponent.validation_certification_result,
    replay_certification_result: byComponent.replay_certification_result,
    evidence_certification_result: byComponent.evidence_certification_result,
    risk_certification_result: byComponent.risk_certification_result,
    confidence_certification_result: byComponent.confidence_certification_result,
    governance_boundary_result: byComponent.governance_boundary_result,
    advisory_only_result: byComponent.advisory_only_result,
    tenant_isolation_result: byComponent.tenant_isolation_result,
    truth_ledger_result: byComponent.truth_ledger_result,
    operator_visibility_result: byComponent.operator_visibility_result,
    failed_tests,
    conditional_findings,
    blocking_findings,
    replay_refs: uniqueSorted(results.flatMap((result) => result.replay_refs)),
    truth_ledger_refs: uniqueSorted(results.flatMap((result) => result.truth_ledger_refs)),
    certified_timestamp: NOW,
    certifier_version: CONTRACT_VERSION,
  };
  return Object.freeze({ ...withoutHash, certification_hash: computeRecommendationCertificationHash(withoutHash) });
}

export function buildRecommendationCertificationRecord(overrides: Partial<RecommendationCertificationRecord> = {}): RecommendationCertificationRecord {
  const base = runRecommendationCertification({ tenant_id: overrides.tenant_id, mission_id: overrides.mission_id });
  return Object.freeze({ ...base, ...overrides, certification_hash: overrides.certification_hash ?? computeRecommendationCertificationHash({ ...base, ...overrides }) });
}

function expectedState(results: readonly RecommendationCertificationTestResult[]): RecommendationCertificationState {
  if (results.some((result) => result.status === "FAIL")) return "FAIL";
  if (results.some((result) => result.status === "CONDITIONAL_PASS")) return "CONDITIONAL_PASS";
  return "PASS";
}

export function validateRecommendationCertificationRecord(record: Partial<RecommendationCertificationRecord> | undefined): RecommendationCertificationValidationResult {
  const errors: RecommendationCertificationFinding[] = [];
  if (!record) errors.push(finding("contract_certification_result", "CONTRACT_MISSING_ACCEPTED", "certification record missing"));
  const stateValid = record?.certification_state === "PASS" || record?.certification_state === "CONDITIONAL_PASS" || record?.certification_state === "FAIL";
  if (record && !stateValid) errors.push(finding("contract_certification_result", "CERTIFICATION_DECISION_MISMATCH", "unknown certification state"));
  const results = record ? COMPONENTS.map((component) => record[component]).filter(Boolean) as RecommendationCertificationTestResult[] : [];
  if (record && results.length === COMPONENTS.length && expectedState(results) !== record.certification_state) errors.push(finding("contract_certification_result", "CERTIFICATION_DECISION_MISMATCH", "certification decision does not match component results"));
  if (record && record.certification_hash && computeRecommendationCertificationHash(record as RecommendationCertificationRecord) !== record.certification_hash) errors.push(finding("replay_certification_result", "CERTIFICATION_HASH_MISMATCH", "certification hash mismatch"));
  if (record && containsTenantLeak(record, record.tenant_id)) errors.push(finding("tenant_isolation_result", "TENANT_ISOLATION_FAILURE", "cross-tenant certification reference detected"));
  if (isRecord(record) && ("hidden_state" in record || "hidden_certification_state" in record || "random_seed" in record)) errors.push(finding("replay_certification_result", "HIDDEN_CERTIFICATION_STATE", "hidden certification state detected"));
  if (record && (record.advisory_only_result?.status === "FAIL" || record.tenant_isolation_result?.status === "FAIL" || record.replay_certification_result?.status === "FAIL" || record.truth_ledger_result?.status === "FAIL")) errors.push(finding("contract_certification_result", "CERTIFICATION_DECISION_MISMATCH", "blocking component failure must fail certification"));
  const validation_state = errors.some((error) => error.failure_class === "TENANT_ISOLATION_FAILURE") ? "TENANT_SCOPE_VIOLATION" : errors.some((error) => ["HIDDEN_CERTIFICATION_STATE", "CERTIFICATION_DECISION_MISMATCH"].includes(error.failure_class)) ? "CERTIFICATION_BLOCKED" : errors.some((error) => error.failure_class === "CERTIFICATION_HASH_MISMATCH") ? "REPLAY_MISMATCH" : errors.length ? "INVALID" : "VALID";
  return Object.freeze({
    validation_state,
    validator_version: "RECOMMENDATION-CERTIFICATION-VALIDATOR-V1",
    errors: Object.freeze(errors),
    checks: Object.freeze({
      record_present: Boolean(record),
      state_valid: stateValid,
      decision_consistent: !errors.some((error) => error.failure_class === "CERTIFICATION_DECISION_MISMATCH"),
      replay_ready: !errors.some((error) => ["CERTIFICATION_HASH_MISMATCH", "REPLAY_MISMATCH"].includes(error.failure_class)),
      tenant_isolated: !errors.some((error) => error.failure_class === "TENANT_ISOLATION_FAILURE"),
      advisory_only_enforced: record?.advisory_only_result?.status !== "FAIL",
      truth_ledger_linked: record?.truth_ledger_result?.status !== "FAIL",
      operator_visible: record?.operator_visibility_result?.status !== "FAIL",
      hidden_state_absent: !errors.some((error) => error.failure_class === "HIDDEN_CERTIFICATION_STATE"),
      hash_valid: !errors.some((error) => error.failure_class === "CERTIFICATION_HASH_MISMATCH"),
    }),
  });
}

export function replayRecommendationCertification(record = runRecommendationCertification()): RecommendationCertificationReplayResult {
  const reconstructed_hash = computeRecommendationCertificationHash(record);
  const validation = validateRecommendationCertificationRecord(record);
  const reproduced = reconstructed_hash === record.certification_hash && validation.validation_state === "VALID";
  return Object.freeze({ replay_id: hashValue("recommendation-certification-replay", { id: record.certification_id, reconstructed_hash }), replay_state: reproduced ? "REPRODUCED" : "MISMATCH", reconstructed_hash, expected_hash: record.certification_hash, reconstructed_state: expectedState(componentResults(record)), expected_state: record.certification_state, failure_class: reproduced ? null : validation.errors[0]?.failure_class ?? "CERTIFICATION_HASH_MISMATCH" });
}

export function buildRecommendationCertificationReport(record = runRecommendationCertification()): RecommendationCertificationReport {
  const remediation = Object.freeze([...record.blocking_findings, ...record.conditional_findings]);
  return Object.freeze({
    certification_state: record.certification_state,
    certification_summary: record.certification_summary,
    evidence_status: record.evidence_certification_result.status === "FAIL" ? "INCOMPLETE" : "COMPLETE",
    replay_status: replayRecommendationCertification(record).replay_state,
    tenant_isolation_status: record.tenant_isolation_result.status === "FAIL" ? "VIOLATED" : "PRESERVED",
    advisory_only_status: record.advisory_only_result.status === "FAIL" ? "VIOLATED" : "ENFORCED",
    truth_ledger_status: record.truth_ledger_result.status === "FAIL" ? "INCOMPLETE" : "COMPLETE",
    operator_visibility_status: record.operator_visibility_result.status === "FAIL" ? "INCOMPLETE" : "COMPLETE",
    failed_tests: record.failed_tests,
    required_remediation: remediation,
  });
}

export function buildRecommendationCertificationObservabilitySurface(record = runRecommendationCertification()) {
  return Object.freeze({ doctrine: buildRecommendationCertificationDoctrine(), certification: record, report: buildRecommendationCertificationReport(record), validation: validateRecommendationCertificationRecord(record), replay: replayRecommendationCertification(record) });
}

export function buildRecommendationCertificationContract() {
  const baseline_certification = runRecommendationCertification();
  return Object.freeze({ doctrine: buildRecommendationCertificationDoctrine(), baseline_certification, observability: buildRecommendationCertificationObservabilitySurface(baseline_certification) });
}
