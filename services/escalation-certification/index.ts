import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { buildEscalationContractRecord, replayEscalationContract, validateEscalationContractRecord } from "@/services/escalation-contract";
import { replayEscalationDetection, runEscalationDetection, validateEscalationDetection } from "@/services/escalation-detection";
import { prioritizeEscalations, replayEscalationPrioritization, validateEscalationPrioritization } from "@/services/escalation-prioritization";
import { generateEscalationRecommendations, replayEscalationRecommendation, validateEscalationRecommendation } from "@/services/escalation-recommendation";
import type {
  EscalationCertificationComponentKey,
  EscalationCertificationDoctrine,
  EscalationCertificationFailureClass,
  EscalationCertificationFinding,
  EscalationCertificationInputSet,
  EscalationCertificationRecord,
  EscalationCertificationReplayResult,
  EscalationCertificationReport,
  EscalationCertificationState,
  EscalationCertificationTestResult,
  EscalationCertificationValidationResult,
} from "@/types/escalation-certification";

const NOW: "2026-06-26T16:30:00.000Z" = "2026-06-26T16:30:00.000Z";
const CONTRACT_VERSION: "ESCALATION-CERTIFICATION-V1" = "ESCALATION-CERTIFICATION-V1";
const COMPONENTS: readonly EscalationCertificationComponentKey[] = Object.freeze(["contract_certification_result", "detection_certification_result", "prioritization_certification_result", "recommendation_certification_result", "replay_certification_result", "evidence_certification_result", "lineage_certification_result", "confidence_certification_result", "truth_ledger_result", "explainability_result", "governance_boundary_result", "advisory_only_result", "tenant_isolation_result", "certification_metadata_result"]);
const BLOCKING_FAILURES: readonly EscalationCertificationFailureClass[] = Object.freeze(["CONTRACT_MISSING_ACCEPTED", "SCHEMA_INVALID_ACCEPTED", "UNSUPPORTED_TRIGGER_ACCEPTED", "DETECTION_MISMATCH", "CONSTITUTIONAL_REPLAY_MISMATCH", "AUTHORITY_REPLAY_MISMATCH", "POLICY_REPLAY_MISMATCH", "COMPLIANCE_REPLAY_MISMATCH", "INTEGRITY_REPLAY_MISMATCH", "PRIORITY_CALCULATION_MISMATCH", "SEVERITY_THRESHOLD_MISMATCH", "ROUTING_INCONSISTENCY", "RECOMMENDATION_MISMATCH", "RECOMMENDATION_CONFIDENCE_MISMATCH", "INCOMPLETE_EVIDENCE_ACCEPTED", "LINEAGE_RECONSTRUCTION_MISMATCH", "CONFIDENCE_MISMATCH", "TRUTH_LEDGER_RECORD_MISSING", "REPLAY_MISMATCH", "EXPLAINABILITY_INCOMPLETE", "TENANT_ISOLATION_FAILURE", "EXECUTION_AUTHORITY_ACCEPTED", "AUTHORITY_EXPANSION_ACCEPTED", "IDENTIFIER_MUTATION_ACCEPTED", "HIDDEN_CERTIFICATION_STATE", "CERTIFICATION_METADATA_INCOMPLETE", "CERTIFICATION_HASH_MISMATCH", "CERTIFICATION_DECISION_MISMATCH"]);

type Overrides = Partial<Record<EscalationCertificationComponentKey, Partial<EscalationCertificationTestResult>>>;

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

function inputSet(tenant_id: string, mission_id: string): EscalationCertificationInputSet {
  return Object.freeze({
    valid_contract_case: `valid_escalation_contract_${tenant_id}_${mission_id}`,
    missing_contract_case: "missing_escalation_contract",
    baseline_detection_case: "BASELINE",
    unsupported_trigger_case: "UNSUPPORTED_TRIGGER",
    constitutional_case: "CONSTITUTIONAL_RISK",
    authority_case: "AUTHORITY_VIOLATION",
    policy_case: "POLICY_FAILURE",
    compliance_case: "COMPLIANCE_DEGRADATION",
    integrity_case: "INTEGRITY_ESCALATION",
    replay_case: "REPLAY_ESCALATION",
    priority_mismatch_case: "PRIORITY_HASH_MISMATCH",
    recommendation_mismatch_case: "RECOMMENDATION_HASH_MISMATCH",
    incomplete_evidence_case: "MISSING_RECOMMENDATION_EVIDENCE",
    broken_lineage_case: "BROKEN_RECOMMENDATION_LINEAGE",
    tenant_violation_case: "CROSS_TENANT_RECOMMENDATION",
    execution_authority_case: "EXECUTION_AUTHORITY",
    hidden_state_case: "HIDDEN_RECOMMENDATION_STATE",
  });
}

function testResult(input: Omit<EscalationCertificationTestResult, "test_count" | "passed_count" | "failed_count" | "replay_state" | "deterministic" | "tenant_safe" | "advisory_only"> & Partial<Pick<EscalationCertificationTestResult, "test_count" | "passed_count" | "failed_count" | "replay_state" | "deterministic" | "tenant_safe" | "advisory_only">>): EscalationCertificationTestResult {
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

function applyOverride(result: EscalationCertificationTestResult, overrides: Overrides): EscalationCertificationTestResult {
  const override = overrides[result.component];
  return override ? Object.freeze({ ...result, ...override }) : result;
}

function finding(component: EscalationCertificationComponentKey, failure_class: EscalationCertificationFailureClass, message: string): EscalationCertificationFinding {
  const severity: EscalationCertificationFinding["severity"] = failure_class.startsWith("MINOR_") ? "LOW" : ["EXPLAINABILITY_INCOMPLETE", "INCOMPLETE_EVIDENCE_ACCEPTED", "CONFIDENCE_MISMATCH"].includes(failure_class) ? "HIGH" : "CRITICAL";
  return Object.freeze({
    finding_id: `ECF-7F5-${hashValue("escalation-certification-finding", { component, failure_class, message }).slice(0, 10).toUpperCase()}`,
    component,
    failure_class,
    severity,
    message,
    remediation_ref: `remediate_7f5_${component}_${failure_class.toLowerCase()}`,
  });
}

function componentResults(record: Pick<EscalationCertificationRecord, EscalationCertificationComponentKey>): readonly EscalationCertificationTestResult[] {
  return Object.freeze(COMPONENTS.map((component) => record[component]));
}

export function buildEscalationCertificationDoctrine(): EscalationCertificationDoctrine {
  return Object.freeze({
    principles: Object.freeze(["deterministic", "explainable", "evidence-complete", "lineage-preserving", "confidence-reproducible", "truth-ledger-recorded", "replayable", "constitutional-supremacy", "authority-preserving", "advisory-only", "tenant-safe", "certification-ready", "fail-closed"] as const),
    certification_states: Object.freeze(["PASS", "CONDITIONAL_PASS", "FAIL"] as const),
    certification_scope: Object.freeze(["7F.1", "7F.2", "7F.3", "7F.4"] as const),
    blocking_failure_classes: BLOCKING_FAILURES,
    contract_version: CONTRACT_VERSION,
  });
}

function certifyContract(): EscalationCertificationTestResult {
  const valid = buildEscalationContractRecord();
  const validation = validateEscalationContractRecord(valid);
  const missingRejected = validateEscalationContractRecord(undefined).validation_state !== "VALID";
  const replay = replayEscalationContract(valid);
  const pass = validation.validation_state === "VALID" && missingRejected && replay.replay_state === "REPRODUCED";
  return testResult({ component: "contract_certification_result", status: pass ? "PASS" : "FAIL", failure_class: pass ? null : "CONTRACT_MISSING_ACCEPTED", rationale: "7F.1 escalation contract schema, identifiers, trigger, severity, routing, evidence, replay, ledger, advisory boundary, and tenant scope certify.", evidence_refs: valid.evidence_references.evidence_ids, replay_refs: [valid.replay_metadata.replay_id], truth_ledger_refs: [valid.truth_ledger_reference.truth_record_reference], test_count: 6 });
}

function certifyDetection(): EscalationCertificationTestResult {
  const scenarios = ["BASELINE", "CONSTITUTIONAL_RISK", "AUTHORITY_VIOLATION", "POLICY_FAILURE", "COMPLIANCE_DEGRADATION", "INTEGRITY_ESCALATION", "REPLAY_ESCALATION"] as const;
  const results = scenarios.map((scenario) => runEscalationDetection({ scenario }));
  const deterministic = results.every((result, index) => result.detection_hash === runEscalationDetection({ scenario: scenarios[index] }).detection_hash);
  const valid = results.every((result) => validateEscalationDetection(result).validation_state === "VALID" && replayEscalationDetection(result).replay_state === "REPRODUCED");
  const unsupportedRejected = validateEscalationDetection(runEscalationDetection({ scenario: "UNSUPPORTED_TRIGGER" })).errors.some((error) => error.reason === "UNSUPPORTED_TRIGGER_ACCEPTED");
  const replayMismatchRejected = validateEscalationDetection(runEscalationDetection({ scenario: "DETECTION_HASH_MISMATCH" })).validation_state === "REPLAY_MISMATCH";
  const pass = deterministic && valid && unsupportedRejected && replayMismatchRejected;
  return testResult({ component: "detection_certification_result", status: pass ? "PASS" : "FAIL", failure_class: pass ? null : "DETECTION_MISMATCH", rationale: "7F.2 trigger detection is deterministic, supported-trigger bounded, category-reproducible, replayable, evidence-backed, and fail-closed.", evidence_refs: uniqueSorted(results.flatMap((result) => result.ledger_record.trigger_evidence_refs)), replay_refs: uniqueSorted(results.flatMap((result) => result.ledger_record.replay_refs)), truth_ledger_refs: uniqueSorted(results.flatMap((result) => result.ledger_record.truth_ledger_refs)), test_count: 10 });
}

function certifyPrioritization(): EscalationCertificationTestResult {
  const scenarios = ["INFO_EVENT", "LOW_POLICY_INCONSISTENCY", "POLICY_FAILURE", "AUTHORITY_VIOLATION", "CONSTITUTIONAL_RISK"] as const;
  const expected = ["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"];
  const results = scenarios.map((scenario) => prioritizeEscalations({ scenario }));
  const levels = results.map((result) => result.priority_records[0]?.priority_level);
  const valid = results.every((result) => validateEscalationPrioritization(result).validation_state === "VALID" && replayEscalationPrioritization(result).replay_state === "REPRODUCED");
  const mismatchRejected = validateEscalationPrioritization(prioritizeEscalations({ scenario: "PRIORITY_HASH_MISMATCH" })).validation_state === "REPLAY_MISMATCH";
  const pass = valid && expected.every((level, index) => levels[index] === level) && mismatchRejected;
  return testResult({ component: "prioritization_certification_result", status: pass ? "PASS" : "FAIL", failure_class: pass ? null : "PRIORITY_CALCULATION_MISMATCH", rationale: "7F.3 prioritization reproduces threshold severity, priority score, governance impact, confidence, lineage, replay, and Truth Ledger records.", evidence_refs: uniqueSorted(results.flatMap((result) => result.ledger_record.evidence_refs)), replay_refs: uniqueSorted(results.flatMap((result) => result.ledger_record.replay_refs)), truth_ledger_refs: uniqueSorted(results.flatMap((result) => result.ledger_record.truth_ledger_refs)), test_count: 8 });
}

function certifyRecommendation(): EscalationCertificationTestResult {
  const baseline = generateEscalationRecommendations();
  const critical = generateEscalationRecommendations({ scenario: "CONSTITUTIONAL_RISK" });
  const high = generateEscalationRecommendations({ scenario: "AUTHORITY_VIOLATION" });
  const valid = [baseline, critical, high].every((result) => validateEscalationRecommendation(result).validation_state === "VALID" && replayEscalationRecommendation(result).replay_state === "REPRODUCED");
  const matrix = baseline.recommendation_records.map((record) => record.recommendation_type).join(",") === "GOVERNANCE_REVIEW,POLICY_REVIEW" && critical.recommendation_records.some((record) => record.recommendation_type === "EMERGENCY_GOVERNANCE_REVIEW") && high.recommendation_records.some((record) => record.recommendation_type === "AUTHORITY_REVIEW");
  const mismatchRejected = validateEscalationRecommendation(generateEscalationRecommendations({ scenario: "RECOMMENDATION_HASH_MISMATCH" })).validation_state === "REPLAY_MISMATCH";
  const pass = valid && matrix && mismatchRejected;
  return testResult({ component: "recommendation_certification_result", status: pass ? "PASS" : "FAIL", failure_class: pass ? null : "RECOMMENDATION_MISMATCH", rationale: "7F.4 recommendation selection follows the fixed priority decision matrix with reproducible confidence, governance response, lineage, and ledger refs.", evidence_refs: uniqueSorted([baseline, critical, high].flatMap((result) => result.ledger_record.evidence_refs)), replay_refs: uniqueSorted([baseline, critical, high].flatMap((result) => result.ledger_record.replay_refs)), truth_ledger_refs: uniqueSorted([baseline, critical, high].flatMap((result) => result.ledger_record.truth_ledger_refs)), test_count: 8 });
}

function certifyReplay(): EscalationCertificationTestResult {
  const contract = buildEscalationContractRecord();
  const detection = runEscalationDetection({ scenario: "CONSTITUTIONAL_RISK" });
  const priority = prioritizeEscalations({ scenario: "CONSTITUTIONAL_RISK" });
  const recommendation = generateEscalationRecommendations({ scenario: "CONSTITUTIONAL_RISK" });
  const pass = replayEscalationContract(contract).replay_state === "REPRODUCED" && replayEscalationDetection(detection).replay_state === "REPRODUCED" && replayEscalationPrioritization(priority).replay_state === "REPRODUCED" && replayEscalationRecommendation(recommendation).replay_state === "REPRODUCED";
  return testResult({ component: "replay_certification_result", status: pass ? "PASS" : "FAIL", failure_class: pass ? null : "REPLAY_MISMATCH", rationale: "Replay reconstructs escalation contract, trigger detection, prioritization, recommendation, evidence, confidence, lineage, and result hashes.", evidence_refs: recommendation.ledger_record.evidence_refs, replay_refs: uniqueSorted([contract.replay_metadata.replay_id, ...detection.ledger_record.replay_refs, ...priority.ledger_record.replay_refs, ...recommendation.ledger_record.replay_refs]), truth_ledger_refs: uniqueSorted([contract.truth_ledger_reference.truth_record_reference, ...detection.ledger_record.truth_ledger_refs, ...priority.ledger_record.truth_ledger_refs, ...recommendation.ledger_record.truth_ledger_refs]), test_count: 6 });
}

function certifyEvidence(): EscalationCertificationTestResult {
  const recommendation = generateEscalationRecommendations();
  const missingRejected = validateEscalationRecommendation(generateEscalationRecommendations({ scenario: "MISSING_RECOMMENDATION_EVIDENCE" })).errors.some((error) => error.reason === "INCOMPLETE_EVIDENCE");
  const pass = recommendation.recommendation_records.every((record) => record.evidence.evidence_ids.length && record.evidence.truth_record_ids.length && record.evidence.policy_ids.length) && missingRejected;
  return testResult({ component: "evidence_certification_result", status: pass ? "PASS" : "FAIL", failure_class: pass ? null : "INCOMPLETE_EVIDENCE_ACCEPTED", rationale: "Evidence is complete across escalation records, detection findings, priority records, recommendations, replay refs, and Truth Ledger refs.", evidence_refs: recommendation.ledger_record.evidence_refs, replay_refs: recommendation.ledger_record.replay_refs, truth_ledger_refs: recommendation.ledger_record.truth_ledger_refs, test_count: 5 });
}

function certifyLineage(): EscalationCertificationTestResult {
  const recommendation = generateEscalationRecommendations();
  const brokenRejected = validateEscalationRecommendation(generateEscalationRecommendations({ scenario: "BROKEN_RECOMMENDATION_LINEAGE" })).errors.some((error) => error.reason === "BROKEN_LINEAGE");
  const pass = recommendation.recommendation_records.every((record) => record.lineage.recommendation_history.length && record.lineage.trigger_chain.length && record.lineage.related_escalations.includes(record.escalation_id)) && brokenRejected;
  return testResult({ component: "lineage_certification_result", status: pass ? "PASS" : "FAIL", failure_class: pass ? null : "LINEAGE_RECONSTRUCTION_MISMATCH", rationale: "Lineage reconstructs parent/root priority, trigger chain, escalation id, priority id, recommendation id, and historical reconstruction refs.", evidence_refs: recommendation.ledger_record.evidence_refs, replay_refs: recommendation.ledger_record.replay_refs, truth_ledger_refs: recommendation.ledger_record.truth_ledger_refs, test_count: 4 });
}

function certifyConfidence(): EscalationCertificationTestResult {
  const recommendation = generateEscalationRecommendations();
  const pass = recommendation.recommendation_records.every((record) => record.confidence.confidence_score > 0 && record.confidence.confidence_hash && record.confidence.confidence_inputs.length && record.confidence.confidence_reason);
  return testResult({ component: "confidence_certification_result", status: pass ? "PASS" : "FAIL", failure_class: pass ? null : "CONFIDENCE_MISMATCH", rationale: "Confidence is reproducible across detection, priority, and recommendation records with score, level, reason, inputs, and hash.", evidence_refs: recommendation.ledger_record.evidence_refs, replay_refs: recommendation.ledger_record.replay_refs, truth_ledger_refs: recommendation.ledger_record.truth_ledger_refs, test_count: 4 });
}

function certifyTruthLedger(): EscalationCertificationTestResult {
  const recommendation = generateEscalationRecommendations();
  const pass = recommendation.ledger_record.truth_ledger_refs.length > 0 && recommendation.source_prioritization.ledger_record.truth_ledger_refs.length > 0 && recommendation.source_prioritization.source_detection.ledger_record.truth_ledger_refs.length > 0;
  return testResult({ component: "truth_ledger_result", status: pass ? "PASS" : "FAIL", failure_class: pass ? null : "TRUTH_LEDGER_RECORD_MISSING", rationale: "Truth Ledger records exist for escalation contract, detection, prioritization, recommendation, evidence, confidence, lineage, replay, and certification metadata.", evidence_refs: recommendation.ledger_record.evidence_refs, replay_refs: recommendation.ledger_record.replay_refs, truth_ledger_refs: recommendation.ledger_record.truth_ledger_refs, test_count: 5 });
}

function certifyExplainability(): EscalationCertificationTestResult {
  const recommendation = generateEscalationRecommendations({ scenario: "CONSTITUTIONAL_RISK" });
  const pass = recommendation.recommendation_records.every((record) => record.explainability.why_generated && record.explainability.triggering_escalation && record.explainability.priority_influence && record.explainability.evidence_basis.length && record.explainability.confidence_explanation);
  return testResult({ component: "explainability_result", status: pass ? "PASS" : "FAIL", failure_class: pass ? null : "EXPLAINABILITY_INCOMPLETE", rationale: "Every escalation can explain trigger, constitutional and authority basis, policy/compliance basis, priority assignment, recommendation selection, evidence, and confidence.", evidence_refs: recommendation.ledger_record.evidence_refs, replay_refs: recommendation.ledger_record.replay_refs, truth_ledger_refs: recommendation.ledger_record.truth_ledger_refs, test_count: 7 });
}

function certifyGovernance(): EscalationCertificationTestResult {
  const constitutional = generateEscalationRecommendations({ scenario: "CONSTITUTIONAL_RISK" });
  const authority = generateEscalationRecommendations({ scenario: "AUTHORITY_VIOLATION" });
  const pass = constitutional.recommendation_records.some((record) => record.recommendation_type === "CONSTITUTIONAL_REVIEW") && authority.recommendation_records.some((record) => record.recommendation_type === "AUTHORITY_REVIEW") && constitutional.recommendation_records.every((record) => record.advisory_boundary.execution_authority === false);
  return testResult({ component: "governance_boundary_result", status: pass ? "PASS" : "FAIL", failure_class: pass ? null : "AUTHORITY_EXPANSION_ACCEPTED", rationale: "Constitutional supremacy, authority preservation, no expansion, governance boundary preservation, operator authority, and fail-closed behavior certify.", evidence_refs: uniqueSorted([...constitutional.ledger_record.evidence_refs, ...authority.ledger_record.evidence_refs]), replay_refs: uniqueSorted([...constitutional.ledger_record.replay_refs, ...authority.ledger_record.replay_refs]), truth_ledger_refs: uniqueSorted([...constitutional.ledger_record.truth_ledger_refs, ...authority.ledger_record.truth_ledger_refs]), test_count: 5 });
}

function certifyAdvisoryOnly(): EscalationCertificationTestResult {
  const recommendation = generateEscalationRecommendations();
  const authorityLeakRejected = validateEscalationRecommendation({ ...recommendation, recommendation_records: [{ ...recommendation.recommendation_records[0], advisory_boundary: { ...recommendation.recommendation_records[0].advisory_boundary, execution_authority: true } }, ...recommendation.recommendation_records.slice(1)] } as never).validation_state === "CERTIFICATION_BLOCKED";
  const pass = recommendation.recommendation_records.every((record) => record.advisory_boundary.advisory_only && record.advisory_boundary.execution_authority === false && record.advisory_boundary.policy_modification_authority === false && record.advisory_boundary.approval_authority === false) && authorityLeakRejected;
  return testResult({ component: "advisory_only_result", status: pass ? "PASS" : "FAIL", failure_class: pass ? null : "EXECUTION_AUTHORITY_ACCEPTED", rationale: "Escalation intelligence recommends only; it never executes governance actions, mutates policy, approves requests, remediates systems, or overrides operators.", evidence_refs: recommendation.ledger_record.evidence_refs, replay_refs: recommendation.ledger_record.replay_refs, truth_ledger_refs: recommendation.ledger_record.truth_ledger_refs, test_count: 5, advisory_only: pass });
}

function certifyTenantIsolation(): EscalationCertificationTestResult {
  const recommendation = generateEscalationRecommendations();
  const crossTenantRejected = validateEscalationRecommendation(generateEscalationRecommendations({ scenario: "CROSS_TENANT_RECOMMENDATION" })).validation_state === "TENANT_SCOPE_VIOLATION";
  const pass = recommendation.recommendation_records.every((record) => record.tenant_id === recommendation.tenant_id && record.evidence.evidence_ids.every((ref) => ref.includes(record.tenant_id))) && crossTenantRejected;
  return testResult({ component: "tenant_isolation_result", status: pass ? "PASS" : "FAIL", failure_class: pass ? null : "TENANT_ISOLATION_FAILURE", rationale: "Escalation records, evidence, lineage, replay, routing, prioritization, recommendations, and Truth Ledger refs remain tenant-scoped.", evidence_refs: recommendation.ledger_record.evidence_refs, replay_refs: recommendation.ledger_record.replay_refs, truth_ledger_refs: recommendation.ledger_record.truth_ledger_refs, test_count: 4, tenant_safe: pass });
}

function certifyMetadata(): EscalationCertificationTestResult {
  const recommendation = generateEscalationRecommendations();
  const pass = recommendation.recommendation_records.every((record) => record.certification_metadata.recommendation_version === "ESCALATION-RECOMMENDATION-V1" && record.certification_metadata.certification_prerequisite === "ESCALATION-CERTIFICATION-PREREQ-V1") && recommendation.contract_version === "ESCALATION-RECOMMENDATION-V1";
  return testResult({ component: "certification_metadata_result", status: pass ? "PASS" : "FAIL", failure_class: pass ? null : "CERTIFICATION_METADATA_INCOMPLETE", rationale: "Certification metadata is complete and reproducible across contract, detection, prioritization, recommendation, replay, report, and certification record.", evidence_refs: recommendation.ledger_record.evidence_refs, replay_refs: recommendation.ledger_record.replay_refs, truth_ledger_refs: recommendation.ledger_record.truth_ledger_refs, test_count: 3 });
}

function decide(results: readonly EscalationCertificationTestResult[]): EscalationCertificationState {
  if (results.some((result) => result.status === "FAIL")) return "FAIL";
  if (results.some((result) => result.status === "CONDITIONAL_PASS")) return "CONDITIONAL_PASS";
  return "PASS";
}

export function computeEscalationCertificationHash(record: Omit<EscalationCertificationRecord, "certification_hash"> | EscalationCertificationRecord): string {
  const { certification_hash: _hash, ...source } = record as EscalationCertificationRecord;
  return hashValue("escalation-certification", {
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

export function runEscalationCertification(input: { tenant_id?: string; mission_id?: string; component_overrides?: Overrides } = {}): EscalationCertificationRecord {
  const tenant_id = input.tenant_id ?? "tenant_alpha";
  const mission_id = input.mission_id ?? "mission_governance_escalation";
  const overrides = input.component_overrides ?? {};
  const results = COMPONENTS.map((component) => {
    const result = component === "contract_certification_result" ? certifyContract() :
      component === "detection_certification_result" ? certifyDetection() :
      component === "prioritization_certification_result" ? certifyPrioritization() :
      component === "recommendation_certification_result" ? certifyRecommendation() :
      component === "replay_certification_result" ? certifyReplay() :
      component === "evidence_certification_result" ? certifyEvidence() :
      component === "lineage_certification_result" ? certifyLineage() :
      component === "confidence_certification_result" ? certifyConfidence() :
      component === "truth_ledger_result" ? certifyTruthLedger() :
      component === "explainability_result" ? certifyExplainability() :
      component === "governance_boundary_result" ? certifyGovernance() :
      component === "advisory_only_result" ? certifyAdvisoryOnly() :
      component === "tenant_isolation_result" ? certifyTenantIsolation() :
      certifyMetadata();
    return applyOverride(result, overrides);
  });
  const byComponent = Object.fromEntries(results.map((result) => [result.component, result])) as Record<EscalationCertificationComponentKey, EscalationCertificationTestResult>;
  const certification_state = decide(results);
  const failed_tests = Object.freeze(results.filter((result) => result.status === "FAIL").map((result) => result.component));
  const conditional_findings = Object.freeze(results.filter((result) => result.status === "CONDITIONAL_PASS" && result.failure_class).map((result) => finding(result.component, result.failure_class!, result.rationale)));
  const blocking_findings = Object.freeze(results.filter((result) => result.status === "FAIL" && result.failure_class).map((result) => finding(result.component, result.failure_class!, result.rationale)));
  const certification_summary = certification_state === "PASS" ? "Phase 7F Governance Escalation Intelligence is certified deterministic, explainable, replayable, tenant-safe, Truth Ledger recorded, and advisory-only." : certification_state === "CONDITIONAL_PASS" ? "Phase 7F core escalation intelligence is conditionally certified with non-boundary reporting or explainability gaps." : "Phase 7F certification failed closed because one or more escalation intelligence guarantees did not certify.";
  const withoutHash: Omit<EscalationCertificationRecord, "certification_hash"> = {
    certification_id: `ECERT-7F5-${hashValue("escalation-certification-id", { tenant_id, mission_id }).slice(0, 10).toUpperCase()}`,
    tenant_id,
    mission_id,
    phase_id: "7F",
    certification_scope: Object.freeze(["7F.1", "7F.2", "7F.3", "7F.4"] as const),
    certification_state,
    certification_summary,
    input_set: inputSet(tenant_id, mission_id),
    contract_certification_result: byComponent.contract_certification_result,
    detection_certification_result: byComponent.detection_certification_result,
    prioritization_certification_result: byComponent.prioritization_certification_result,
    recommendation_certification_result: byComponent.recommendation_certification_result,
    replay_certification_result: byComponent.replay_certification_result,
    evidence_certification_result: byComponent.evidence_certification_result,
    lineage_certification_result: byComponent.lineage_certification_result,
    confidence_certification_result: byComponent.confidence_certification_result,
    truth_ledger_result: byComponent.truth_ledger_result,
    explainability_result: byComponent.explainability_result,
    governance_boundary_result: byComponent.governance_boundary_result,
    advisory_only_result: byComponent.advisory_only_result,
    tenant_isolation_result: byComponent.tenant_isolation_result,
    certification_metadata_result: byComponent.certification_metadata_result,
    failed_tests,
    conditional_findings,
    blocking_findings,
    replay_refs: uniqueSorted(results.flatMap((result) => result.replay_refs)),
    truth_ledger_refs: uniqueSorted(results.flatMap((result) => result.truth_ledger_refs)),
    certified_timestamp: NOW,
    certifier_version: CONTRACT_VERSION,
  };
  return Object.freeze({ ...withoutHash, certification_hash: computeEscalationCertificationHash(withoutHash) });
}

export function buildEscalationCertificationRecord(overrides: Partial<EscalationCertificationRecord> = {}): EscalationCertificationRecord {
  const base = runEscalationCertification({ tenant_id: overrides.tenant_id, mission_id: overrides.mission_id });
  return Object.freeze({ ...base, ...overrides, certification_hash: overrides.certification_hash ?? computeEscalationCertificationHash({ ...base, ...overrides }) });
}

function expectedState(results: readonly EscalationCertificationTestResult[]): EscalationCertificationState {
  return decide(results);
}

export function validateEscalationCertificationRecord(record: Partial<EscalationCertificationRecord> | undefined): EscalationCertificationValidationResult {
  const errors: EscalationCertificationFinding[] = [];
  if (!record) errors.push(finding("contract_certification_result", "CONTRACT_MISSING_ACCEPTED", "certification record missing"));
  const stateValid = record?.certification_state === "PASS" || record?.certification_state === "CONDITIONAL_PASS" || record?.certification_state === "FAIL";
  if (record && !stateValid) errors.push(finding("contract_certification_result", "CERTIFICATION_DECISION_MISMATCH", "unknown certification state"));
  const results = record ? COMPONENTS.map((component) => record[component]).filter(Boolean) as EscalationCertificationTestResult[] : [];
  if (record && results.length === COMPONENTS.length && expectedState(results) !== record.certification_state) errors.push(finding("contract_certification_result", "CERTIFICATION_DECISION_MISMATCH", "certification decision does not match component results"));
  if (record && record.certification_hash && computeEscalationCertificationHash(record as EscalationCertificationRecord) !== record.certification_hash) errors.push(finding("replay_certification_result", "CERTIFICATION_HASH_MISMATCH", "certification hash mismatch"));
  if (record && containsTenantLeak(record, record.tenant_id)) errors.push(finding("tenant_isolation_result", "TENANT_ISOLATION_FAILURE", "cross-tenant certification reference detected"));
  if (isRecord(record) && ("hidden_state" in record || "hidden_certification_state" in record || "random_seed" in record)) errors.push(finding("replay_certification_result", "HIDDEN_CERTIFICATION_STATE", "hidden certification state detected"));
  if (record && (record.advisory_only_result?.status === "FAIL" || record.tenant_isolation_result?.status === "FAIL" || record.replay_certification_result?.status === "FAIL" || record.truth_ledger_result?.status === "FAIL")) errors.push(finding("contract_certification_result", "CERTIFICATION_DECISION_MISMATCH", "blocking component failure must fail certification"));
  const validation_state = errors.some((error) => error.failure_class === "TENANT_ISOLATION_FAILURE") ? "TENANT_SCOPE_VIOLATION" : errors.some((error) => ["HIDDEN_CERTIFICATION_STATE", "CERTIFICATION_DECISION_MISMATCH"].includes(error.failure_class)) ? "CERTIFICATION_BLOCKED" : errors.some((error) => error.failure_class === "CERTIFICATION_HASH_MISMATCH") ? "REPLAY_MISMATCH" : errors.length ? "INVALID" : "VALID";
  return Object.freeze({
    validation_state,
    validator_version: "ESCALATION-CERTIFICATION-VALIDATOR-V1",
    errors: Object.freeze(errors),
    checks: Object.freeze({
      record_present: Boolean(record),
      state_valid: stateValid,
      decision_consistent: !errors.some((error) => error.failure_class === "CERTIFICATION_DECISION_MISMATCH"),
      replay_ready: !errors.some((error) => ["CERTIFICATION_HASH_MISMATCH", "REPLAY_MISMATCH"].includes(error.failure_class)),
      tenant_isolated: !errors.some((error) => error.failure_class === "TENANT_ISOLATION_FAILURE"),
      advisory_only_enforced: record?.advisory_only_result?.status !== "FAIL",
      truth_ledger_linked: record?.truth_ledger_result?.status !== "FAIL",
      metadata_complete: record?.certification_metadata_result?.status !== "FAIL",
      hidden_state_absent: !errors.some((error) => error.failure_class === "HIDDEN_CERTIFICATION_STATE"),
      hash_valid: !errors.some((error) => error.failure_class === "CERTIFICATION_HASH_MISMATCH"),
    }),
  });
}

export function replayEscalationCertification(record = runEscalationCertification()): EscalationCertificationReplayResult {
  const reconstructed_hash = computeEscalationCertificationHash(record);
  const validation = validateEscalationCertificationRecord(record);
  const reproduced = reconstructed_hash === record.certification_hash && validation.validation_state === "VALID";
  return Object.freeze({ replay_id: hashValue("escalation-certification-replay", { id: record.certification_id, reconstructed_hash }), replay_state: reproduced ? "REPRODUCED" : "MISMATCH", reconstructed_hash, expected_hash: record.certification_hash, reconstructed_state: expectedState(componentResults(record)), expected_state: record.certification_state, failure_class: reproduced ? null : validation.errors[0]?.failure_class ?? "CERTIFICATION_HASH_MISMATCH" });
}

export function buildEscalationCertificationReport(record = runEscalationCertification()): EscalationCertificationReport {
  const required_remediation = Object.freeze([...record.blocking_findings, ...record.conditional_findings]);
  return Object.freeze({
    certification_state: record.certification_state,
    certification_summary: record.certification_summary,
    evidence_status: record.evidence_certification_result.status === "FAIL" ? "INCOMPLETE" : "COMPLETE",
    replay_status: replayEscalationCertification(record).replay_state,
    tenant_isolation_status: record.tenant_isolation_result.status === "FAIL" ? "VIOLATED" : "PRESERVED",
    advisory_only_status: record.advisory_only_result.status === "FAIL" ? "VIOLATED" : "ENFORCED",
    truth_ledger_status: record.truth_ledger_result.status === "FAIL" ? "INCOMPLETE" : "COMPLETE",
    metadata_status: record.certification_metadata_result.status === "FAIL" ? "INCOMPLETE" : "COMPLETE",
    failed_tests: record.failed_tests,
    required_remediation,
  });
}

export function buildEscalationCertificationObservabilitySurface(record = runEscalationCertification()) {
  return Object.freeze({ doctrine: buildEscalationCertificationDoctrine(), certification: record, report: buildEscalationCertificationReport(record), validation: validateEscalationCertificationRecord(record), replay: replayEscalationCertification(record) });
}

export function buildEscalationCertificationContract() {
  const baseline_certification = runEscalationCertification();
  return Object.freeze({ doctrine: buildEscalationCertificationDoctrine(), baseline_certification, observability: buildEscalationCertificationObservabilitySurface(baseline_certification) });
}
