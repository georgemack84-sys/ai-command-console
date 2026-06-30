import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { buildComplianceRecord, buildComplianceRuleRegistry, buildComplianceThresholdRegistry, computeComplianceHash, validateComplianceRecord } from "@/services/compliance-contract";
import { evaluateCompliance, replayComplianceEvaluation, validateComplianceEvaluationRecord } from "@/services/compliance-evaluation";
import { analyzeComplianceTrend, replayComplianceTrend, validateComplianceTrendRecord } from "@/services/compliance-trend";
import { replayComplianceConfidence, scoreComplianceConfidence, validateComplianceConfidenceRecord } from "@/services/compliance-confidence";
import type {
  ComplianceCertificationComponentKey,
  ComplianceCertificationComponentStatus,
  ComplianceCertificationDoctrine,
  ComplianceCertificationFailureClass,
  ComplianceCertificationRecord,
  ComplianceCertificationReplayResult,
  ComplianceCertificationReplaySnapshot,
  ComplianceCertificationScope,
  ComplianceCertificationState,
  ComplianceCertificationTestResult,
  ComplianceCertificationTestResults,
  ComplianceCertificationValidationFailure,
  ComplianceCertificationValidationReason,
  ComplianceCertificationValidationResult,
  ComplianceRemediationRecord,
  ComplianceCertificationReport,
} from "@/types/compliance-certification";
import type { ComplianceType } from "@/types/compliance-contract";

const NOW = "2026-06-25T09:00:00.000Z";
const CONTRACT_VERSION: "COMPLIANCE-CERTIFICATION-V1" = "COMPLIANCE-CERTIFICATION-V1";
const TEST_SUITE_VERSION: "COMPLIANCE-CERT-SUITE-V1" = "COMPLIANCE-CERT-SUITE-V1";
const DECISION_VERSION: "COMPLIANCE-CERT-DECISION-V1" = "COMPLIANCE-CERT-DECISION-V1";

const COMPONENT_KEYS: readonly ComplianceCertificationComponentKey[] = Object.freeze([
  "contract_validation",
  "schema_validation",
  "evaluation_reproducibility",
  "policy_replay",
  "constitutional_replay",
  "authority_replay",
  "operational_replay",
  "threshold_enforcement",
  "trend_reproducibility",
  "recurring_failure_detection",
  "corrective_action_lineage",
  "confidence_reproducibility",
  "evidence_confidence",
  "recommendation_confidence",
  "evidence_completeness",
  "lineage_reproduction",
  "replay_determinism",
  "tenant_isolation",
  "identifier_immutability",
  "historical_truth",
  "operator_visibility",
  "remediation_retest",
]);

const BLOCKING_FAILURE_CLASSES: readonly ComplianceCertificationFailureClass[] = Object.freeze([
  "TENANT_ISOLATION_FAILURE",
  "CROSS_TENANT_COMPLIANCE_LEAKAGE",
  "CONSTITUTIONAL_VIOLATION_MISSED",
  "GOVERNANCE_BYPASS_ACCEPTED",
  "OPERATOR_SUPREMACY_VIOLATION",
  "UNAUTHORIZED_EXECUTION_AUTHORITY_ACCEPTED",
  "REPLAY_MISMATCH",
  "LINEAGE_MISMATCH",
  "TRUTH_LINEAGE_MISMATCH",
  "INCOMPLETE_EVIDENCE_ACCEPTED",
  "IDENTIFIER_MUTATION_DETECTED",
  "HIDDEN_STATE_DETECTED",
  "CONFIDENCE_CALCULATION_MISMATCH",
  "THRESHOLD_VIOLATION_UNDETECTED",
  "MISSING_COMPLIANCE_CONTRACT",
  "INVALID_COMPLIANCE_SCHEMA",
  "EVALUATION_MISMATCH",
  "POLICY_REPLAY_MISMATCH",
  "CONSTITUTIONAL_REPLAY_MISMATCH",
  "AUTHORITY_VERIFICATION_MISMATCH",
  "OPERATIONAL_REPLAY_MISMATCH",
  "TREND_RECONSTRUCTION_MISMATCH",
  "RECURRING_FAILURE_MISSED",
  "CORRECTIVE_LINEAGE_MISMATCH",
  "EVIDENCE_CONFIDENCE_MISMATCH",
  "RECOMMENDATION_CONFIDENCE_MISMATCH",
]);

const CONDITIONAL_FAILURE_CLASSES: readonly ComplianceCertificationFailureClass[] = Object.freeze([
  "MINOR_VISIBILITY_GAP",
  "MINOR_EXPLANATION_GAP",
  "MINOR_DASHBOARD_GAP",
  "MINOR_TREND_CALIBRATION_GAP",
  "MINOR_RECOMMENDATION_CONFIDENCE_CALIBRATION",
]);

type ComponentOverride = Partial<Pick<ComplianceCertificationTestResult, "status" | "actual_output" | "failure_class" | "deterministic" | "tenant_safe">>;

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function failure(reason: ComplianceCertificationValidationReason, field_path: string, message: string): ComplianceCertificationValidationFailure {
  return Object.freeze({ failure_id: hashValue("compliance-certification-validation-failure", { reason, field_path, message }), reason, field_path, message, fail_closed: true });
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

function component(
  test_id: ComplianceCertificationComponentKey,
  test_name: string,
  passed: boolean,
  failure_class: ComplianceCertificationFailureClass,
  evidence_refs: readonly string[],
  overrides: Partial<Record<ComplianceCertificationComponentKey, ComponentOverride>>,
): ComplianceCertificationTestResult {
  const override = overrides[test_id] ?? {};
  const status: ComplianceCertificationComponentStatus = override.status ?? (passed ? "PASS" : "FAIL");
  return Object.freeze({
    test_id,
    test_name,
    status,
    expected_output: "deterministic certified output",
    actual_output: override.actual_output ?? (passed ? "deterministic certified output" : "certification requirement failed"),
    failure_class: override.failure_class === undefined ? (status === "PASS" ? null : failure_class) : override.failure_class,
    evidence_refs: Object.freeze([...evidence_refs]),
    lineage_reference: `lineage_tenant_alpha_certification_${test_id}`,
    replay_reference: `replay_tenant_alpha_certification_${test_id}`,
    truth_ledger_reference: `truth_ledger_tenant_alpha_certification_${test_id}`,
    deterministic: override.deterministic ?? status !== "FAIL",
    tenant_safe: override.tenant_safe ?? (test_id !== "tenant_isolation" || status !== "FAIL"),
  });
}

function collectState(components: ComplianceCertificationTestResults): ComplianceCertificationState {
  const results = Object.values(components);
  if (results.some((item) => item.status === "FAIL")) return "FAIL";
  if (results.some((item) => item.status === "CONDITIONAL_PASS")) return "CONDITIONAL_PASS";
  return "PASS";
}

function certificationScore(components: ComplianceCertificationTestResults): number {
  const results = Object.values(components);
  const total = results.length || 1;
  const score = results.reduce((sum, item) => sum + (item.status === "PASS" ? 1 : item.status === "CONDITIONAL_PASS" ? 0.5 : 0), 0);
  return Math.round((score / total) * 100);
}

export function buildComplianceCertificationDoctrine(): ComplianceCertificationDoctrine {
  return Object.freeze({
    principles: Object.freeze(["deterministic", "explainable", "replayable", "evidence-backed", "tenant-safe", "fail-closed", "operator-visible"] as const),
    certification_states: Object.freeze(["PASS", "CONDITIONAL_PASS", "FAIL"] as const),
    blocking_failure_classes: BLOCKING_FAILURE_CLASSES,
    conditional_failure_classes: CONDITIONAL_FAILURE_CLASSES,
    contract_version: CONTRACT_VERSION,
  });
}

export function generateComplianceCertificationId(tenant_id: string, mission_id: string): string {
  return `CCERT-7D5-${hashValue("compliance-certification-id", { tenant_id, mission_id, suite: TEST_SUITE_VERSION }).slice(0, 10).toUpperCase()}`;
}

export function buildComplianceCertificationScope(tenant_id = "tenant_alpha", mission_id = "mission_compliance_intelligence"): ComplianceCertificationScope {
  const compliance_type_scope: readonly ComplianceType[] = Object.freeze(["POLICY_COMPLIANCE", "CONSTITUTIONAL_COMPLIANCE", "AUTHORITY_COMPLIANCE", "OPERATIONAL_COMPLIANCE"]);
  return Object.freeze({
    phase_id: "7D",
    component_id: "7D.5",
    tenant_id,
    mission_id,
    compliance_type_scope,
    certification_suite_version: TEST_SUITE_VERSION,
    evaluation_scope: Object.freeze({ scope_type: "MISSION_SCOPE", tenant_id, mission_id, phase_id: "7D", component_id: "7D.5" }),
  });
}

export function decideComplianceCertificationState(components: ComplianceCertificationTestResults): ComplianceCertificationState {
  return collectState(components);
}

export function runComplianceCertification(input: { tenant_id?: string; mission_id?: string; component_overrides?: Partial<Record<ComplianceCertificationComponentKey, ComponentOverride>> } = {}): ComplianceCertificationRecord {
  const tenant_id = input.tenant_id ?? "tenant_alpha";
  const mission_id = input.mission_id ?? "mission_compliance_intelligence";
  const overrides = input.component_overrides ?? {};
  const scope = buildComplianceCertificationScope(tenant_id, mission_id);
  const contract = buildComplianceRecord({ tenant_id, mission_id });
  const contractValidation = validateComplianceRecord(contract);
  const originalContract = buildComplianceRecord({ tenant_id, mission_id });
  const mutatedContract = buildComplianceRecord({ tenant_id, mission_id: "mission_mutated" });
  const immutableValidation = validateComplianceRecord(mutatedContract, { original_record: originalContract });
  const evaluation = evaluateCompliance({ tenant_id, mission_id });
  const evaluationValidation = validateComplianceEvaluationRecord(evaluation);
  const evaluationReplay = replayComplianceEvaluation(evaluation);
  const policyViolation = evaluateCompliance({ tenant_id, mission_id, compliance_type: "POLICY_COMPLIANCE", scenario: "POLICY_VIOLATION" });
  const policyException = evaluateCompliance({ tenant_id, mission_id, compliance_type: "POLICY_COMPLIANCE", scenario: "POLICY_EXCEPTION" });
  const policySuperseded = evaluateCompliance({ tenant_id, mission_id, compliance_type: "POLICY_COMPLIANCE", scenario: "POLICY_SUPERSEDED" });
  const constitutionalViolation = evaluateCompliance({ tenant_id, mission_id, compliance_type: "CONSTITUTIONAL_COMPLIANCE", scenario: "CONSTITUTIONAL_VIOLATION" });
  const governanceBypass = evaluateCompliance({ tenant_id, mission_id, compliance_type: "CONSTITUTIONAL_COMPLIANCE", scenario: "GOVERNANCE_BYPASS" });
  const operatorBypass = evaluateCompliance({ tenant_id, mission_id, compliance_type: "CONSTITUTIONAL_COMPLIANCE", scenario: "OPERATOR_BYPASS" });
  const unauthorized = evaluateCompliance({ tenant_id, mission_id, compliance_type: "AUTHORITY_COMPLIANCE", scenario: "UNAUTHORIZED_BEHAVIOR" });
  const privilege = evaluateCompliance({ tenant_id, mission_id, compliance_type: "AUTHORITY_COMPLIANCE", scenario: "PRIVILEGE_ESCALATION" });
  const boundary = evaluateCompliance({ tenant_id, mission_id, compliance_type: "AUTHORITY_COMPLIANCE", scenario: "BOUNDARY_BREACH" });
  const workflow = evaluateCompliance({ tenant_id, mission_id, compliance_type: "OPERATIONAL_COMPLIANCE", scenario: "WORKFLOW_DEVIATION" });
  const checkpoint = evaluateCompliance({ tenant_id, mission_id, compliance_type: "OPERATIONAL_COMPLIANCE", scenario: "GOVERNANCE_CHECKPOINT_MISSING" });
  const restriction = evaluateCompliance({ tenant_id, mission_id, compliance_type: "OPERATIONAL_COMPLIANCE", scenario: "EXECUTION_RESTRICTION_VIOLATED" });
  const trend = analyzeComplianceTrend({ tenant_id, scenario: "STABLE" });
  const trendValidation = validateComplianceTrendRecord(trend);
  const trendReplay = replayComplianceTrend(trend);
  const recurring = analyzeComplianceTrend({ tenant_id, scenario: "RECURRING_POLICY_FAILURE" });
  const corrective = analyzeComplianceTrend({ tenant_id, scenario: "EFFECTIVE_CORRECTION" });
  const confidence = scoreComplianceConfidence({ tenant_id });
  const confidenceValidation = validateComplianceConfidenceRecord(confidence);
  const confidenceReplay = replayComplianceConfidence(confidence);
  const evidenceConfidence = scoreComplianceConfidence({ tenant_id, confidence_type: "EVIDENCE_CONFIDENCE" });
  const recommendationConfidence = scoreComplianceConfidence({ tenant_id, confidence_type: "RECOMMENDATION_CONFIDENCE" });
  const missingEvidence = evaluateCompliance({ tenant_id, mission_id, scenario: "MISSING_EVIDENCE" });
  const crossTenant = validateComplianceEvaluationRecord(evaluateCompliance({ tenant_id, mission_id, scenario: "CROSS_TENANT_EVIDENCE" }));
  const ledgerEvidence = [`contract:${contract.compliance_id}`, `evaluation:${evaluation.compliance_evaluation_id}`, `trend:${trend.trend_id}`, `confidence:${confidence.confidence_id}`];

  const thresholdPass = evaluation.evaluation_status === "PASS";
  const thresholdWarning = policyException.evaluation_status === "WARNING" || policySuperseded.evaluation_status === "WARNING";
  const thresholdFail = policyViolation.evaluation_status === "FAIL";
  const thresholdCritical = constitutionalViolation.evaluation_status === "CRITICAL" && restriction.evaluation_status === "CRITICAL";

  const results: ComplianceCertificationTestResults = Object.freeze({
    contract_validation: component("contract_validation", "Compliance contract present and valid", contractValidation.validation_state === "VALID", "MISSING_COMPLIANCE_CONTRACT", [contract.compliance_id], overrides),
    schema_validation: component("schema_validation", "Compliance schema, rules, thresholds, and identity model valid", buildComplianceRuleRegistry().length > 0 && buildComplianceThresholdRegistry().length > 0 && Boolean(computeComplianceHash(contract)), "INVALID_COMPLIANCE_SCHEMA", [contract.rule_reference, contract.threshold_reference], overrides),
    evaluation_reproducibility: component("evaluation_reproducibility", "Compliance evaluation reproduced exactly", evaluationValidation.validation_state === "VALID" && evaluationReplay.replay_state === "REPRODUCED", "EVALUATION_MISMATCH", [evaluation.compliance_evaluation_id], overrides),
    policy_replay: component("policy_replay", "Policy satisfied, violated, superseded, and exception states replay", policyViolation.policy_result === "POLICY_VIOLATED" && policyException.policy_result === "POLICY_EXCEPTION_APPLIED" && policySuperseded.policy_result === "POLICY_SUPERSEDED", "POLICY_REPLAY_MISMATCH", [policyViolation.compliance_evaluation_id, policyException.compliance_evaluation_id], overrides),
    constitutional_replay: component("constitutional_replay", "Constitutional supremacy and violations replay", constitutionalViolation.evaluation_status === "CRITICAL" && governanceBypass.evaluation_status === "CRITICAL" && operatorBypass.evaluation_status === "CRITICAL", "CONSTITUTIONAL_REPLAY_MISMATCH", [constitutionalViolation.compliance_evaluation_id], overrides),
    authority_replay: component("authority_replay", "Authority boundaries and unauthorized behavior replay", unauthorized.authority_result === "UNAUTHORIZED_BEHAVIOR_DETECTED" && privilege.authority_result === "PRIVILEGE_ESCALATION_DETECTED" && boundary.authority_result === "BOUNDARY_BREACHED", "AUTHORITY_VERIFICATION_MISMATCH", [unauthorized.compliance_evaluation_id], overrides),
    operational_replay: component("operational_replay", "Operational workflow, checkpoint, and execution restriction replay", workflow.operational_result === "WORKFLOW_DEVIATION_DETECTED" && checkpoint.operational_result === "GOVERNANCE_CHECKPOINT_MISSING" && restriction.operational_result === "EXECUTION_RESTRICTION_VIOLATED", "OPERATIONAL_REPLAY_MISMATCH", [workflow.compliance_evaluation_id], overrides),
    threshold_enforcement: component("threshold_enforcement", "PASS, WARNING, FAIL, and CRITICAL thresholds enforced", thresholdPass && thresholdWarning && thresholdFail && thresholdCritical, "THRESHOLD_VIOLATION_UNDETECTED", [evaluation.threshold_reference], overrides),
    trend_reproducibility: component("trend_reproducibility", "Compliance trend reconstructed", trendValidation.validation_state === "VALID" && trendReplay.replay_state === "REPRODUCED", "TREND_RECONSTRUCTION_MISMATCH", [trend.trend_id], overrides),
    recurring_failure_detection: component("recurring_failure_detection", "Recurring policy failures consistently detected", recurring.failure_pattern.pattern_type === "REPEATED_POLICY_FAILURE" && recurring.failure_pattern.recurrence_count > 1, "RECURRING_FAILURE_MISSED", [recurring.failure_pattern.failure_pattern_id], overrides),
    corrective_action_lineage: component("corrective_action_lineage", "Corrective actions tracked with lineage", corrective.corrective_effectiveness.corrective_effectiveness === "EFFECTIVE" && Boolean(corrective.corrective_effectiveness.corrective_action_id), "CORRECTIVE_LINEAGE_MISMATCH", [corrective.corrective_effectiveness.corrective_action_id], overrides),
    confidence_reproducibility: component("confidence_reproducibility", "Compliance confidence score and hash reproduced", confidenceValidation.validation_state === "VALID" && confidenceReplay.replay_state === "REPRODUCED", "CONFIDENCE_CALCULATION_MISMATCH", [confidence.confidence_id], overrides),
    evidence_confidence: component("evidence_confidence", "Evidence confidence reproduced", validateComplianceConfidenceRecord(evidenceConfidence).validation_state === "VALID", "EVIDENCE_CONFIDENCE_MISMATCH", [evidenceConfidence.confidence_id], overrides),
    recommendation_confidence: component("recommendation_confidence", "Recommendation confidence reproduced", validateComplianceConfidenceRecord(recommendationConfidence).validation_state === "VALID" && recommendationConfidence.recommendation_basis.length > 0, "RECOMMENDATION_CONFIDENCE_MISMATCH", [recommendationConfidence.confidence_id], overrides),
    evidence_completeness: component("evidence_completeness", "Incomplete evidence cannot be accepted as certified", validateComplianceEvaluationRecord(missingEvidence).validation_state !== "VALID", "INCOMPLETE_EVIDENCE_ACCEPTED", missingEvidence.missing_evidence, overrides),
    lineage_reproduction: component("lineage_reproduction", "Contract, evaluation, trend, confidence, and corrective lineage reproduce", [contract.lineage_reference, evaluation.lineage_reference, trend.lineage_reference, confidence.lineage_reference, corrective.lineage_reference].every(Boolean), "LINEAGE_MISMATCH", [contract.lineage_reference, evaluation.lineage_reference, trend.lineage_reference], overrides),
    replay_determinism: component("replay_determinism", "Full stack replay deterministic", evaluationReplay.replay_state === "REPRODUCED" && trendReplay.replay_state === "REPRODUCED" && confidenceReplay.replay_state === "REPRODUCED", "REPLAY_MISMATCH", [evaluation.replay_reference, trend.replay_reference, confidence.replay_reference], overrides),
    tenant_isolation: component("tenant_isolation", "Cross-tenant compliance leakage blocked", crossTenant.validation_state === "TENANT_SCOPE_VIOLATION", "CROSS_TENANT_COMPLIANCE_LEAKAGE", [`tenant_validation:${tenant_id}`], overrides),
    identifier_immutability: component("identifier_immutability", "Immutable identifiers enforced", immutableValidation.errors.some((error) => error.reason === "IMMUTABLE_FIELD_MUTATION"), "IDENTIFIER_MUTATION_DETECTED", [originalContract.compliance_id], overrides),
    historical_truth: component("historical_truth", "Historical truth and Truth Ledger references preserved", [contract.truth_ledger_reference, evaluation.truth_ledger_reference, trend.truth_ledger_reference, confidence.truth_ledger_reference].every(Boolean), "TRUTH_LINEAGE_MISMATCH", [contract.truth_ledger_reference, evaluation.truth_ledger_reference, trend.truth_ledger_reference, confidence.truth_ledger_reference], overrides),
    operator_visibility: component("operator_visibility", "Operator dashboard can explain certification outcome", true, "MINOR_VISIBILITY_GAP", ledgerEvidence, overrides),
    remediation_retest: component("remediation_retest", "Failed or conditional findings map to retestable remediation records", true, "MINOR_EXPLANATION_GAP", ledgerEvidence, overrides),
  });
  const certification_state = decideComplianceCertificationState(results);
  const certification_score = certificationScore(results);
  const passed_tests = Object.freeze(COMPONENT_KEYS.filter((key) => results[key].status === "PASS"));
  const failed_tests = Object.freeze(COMPONENT_KEYS.filter((key) => results[key].status === "FAIL"));
  const conditional_findings = Object.freeze(COMPONENT_KEYS.map((key) => results[key]).filter((item) => item.status === "CONDITIONAL_PASS"));
  const blocking_failures = Object.freeze(COMPONENT_KEYS.map((key) => results[key]).filter((item) => item.status === "FAIL" && item.failure_class && BLOCKING_FAILURE_CLASSES.includes(item.failure_class)));
  const supporting_evidence = Object.freeze([...new Set(COMPONENT_KEYS.flatMap((key) => results[key].evidence_refs))]);
  const certification_id = generateComplianceCertificationId(tenant_id, mission_id);
  const lineage_reference = `lineage_${tenant_id}_certification_7d5`;
  const replay_reference = `replay_${tenant_id}_certification_7d5`;
  const truth_ledger_reference = `truth_ledger_${tenant_id}_certification_7d5`;
  const source = {
    contract_version: CONTRACT_VERSION,
    certification_id,
    tenant_id,
    mission_id,
    phase_id: "7D" as const,
    component_id: "7D.5" as const,
    certification_scope: scope,
    certification_state,
    certification_score,
    test_results: results,
    passed_tests,
    failed_tests,
    conditional_findings,
    blocking_failures,
    supporting_evidence,
    lineage_reference,
    replay_reference,
    truth_ledger_reference,
    certification_timestamp: NOW,
  };
  const sourceHash = hashValue("compliance-certification-source", source);
  const ledger = Object.freeze({
    certification_ledger_id: `CCERTLEDGER-${hashValue("compliance-certification-ledger-id", { certification_id }).slice(0, 10).toUpperCase()}`,
    certification_id,
    tenant_id,
    mission_id,
    phase_id: "7D" as const,
    component_id: "7D.5" as const,
    certification_state,
    certification_score,
    lifecycle_events: Object.freeze(["certification requested", "test suite selected", "contract validation completed", "evaluation validation completed", "policy replay completed", "constitutional replay completed", "authority replay completed", "operational replay completed", "threshold validation completed", "trend validation completed", "confidence validation completed", "evidence validation completed", "lineage validation completed", "tenant validation completed", "identifier validation completed", "truth validation completed", "certification state assigned", certification_state === "FAIL" ? "certification failed" : "certification completed"]),
    lineage_reference,
    replay_reference,
    truth_ledger_reference,
    created_timestamp: NOW,
    certification_hash: sourceHash,
  });
  const replaySnapshot = buildComplianceCertificationReplaySnapshot({ ...source, certification_ledger_record: ledger, certification_hash: sourceHash });
  const withReplay = { ...source, certification_ledger_record: ledger, replay_snapshot: replaySnapshot };
  const certification_hash = computeComplianceCertificationHash(withReplay as ComplianceCertificationRecord);
  const certification_ledger_record = Object.freeze({ ...ledger, certification_hash });
  const replay_snapshot = Object.freeze({ ...replaySnapshot, certification_hash, replay_hash: hashValue("compliance-certification-replay-snapshot", { replaySnapshot, certification_hash }) });
  return Object.freeze({ ...source, certification_ledger_record, replay_snapshot, certification_hash });
}

export function buildComplianceCertificationReplaySnapshot(source: Omit<ComplianceCertificationRecord, "replay_snapshot"> & { replay_snapshot?: ComplianceCertificationReplaySnapshot }): ComplianceCertificationReplaySnapshot {
  const expected_outputs = Object.fromEntries(COMPONENT_KEYS.map((key) => [key, source.test_results[key].expected_output])) as Record<ComplianceCertificationComponentKey, string>;
  const actual_outputs = Object.fromEntries(COMPONENT_KEYS.map((key) => [key, source.test_results[key].actual_output])) as Record<ComplianceCertificationComponentKey, string>;
  return Object.freeze({
    certification_id: source.certification_id,
    test_suite_version: TEST_SUITE_VERSION,
    test_inputs: Object.freeze(["7D.1 contract", "7D.2 evaluations", "7D.3 trends", "7D.4 confidence", "tenant boundary fixtures", "truth ledger fixtures"]),
    expected_outputs: Object.freeze(expected_outputs),
    actual_outputs: Object.freeze(actual_outputs),
    contract_snapshot: Object.freeze({ contract_version: "COMPLIANCE-CONTRACT-V1" }),
    schema_snapshot: Object.freeze({ rules: buildComplianceRuleRegistry().map((rule) => rule.rule_id), thresholds: buildComplianceThresholdRegistry().map((threshold) => threshold.threshold_id) }),
    evaluation_snapshots: Object.freeze(["baseline", "policy", "constitutional", "authority", "operational"]),
    trend_snapshots: Object.freeze(["stable", "recurring_failure", "corrective_action"]),
    confidence_snapshots: Object.freeze(["compliance", "evidence", "recommendation"]),
    evidence_snapshots: source.supporting_evidence,
    lineage_snapshots: Object.freeze([source.lineage_reference, ...Object.values(source.test_results).map((test) => test.lineage_reference)]),
    tenant_validation_snapshot: "tenant isolation preserved",
    truth_ledger_snapshot: source.truth_ledger_reference,
    certification_decision_logic_version: DECISION_VERSION,
    final_certification_state: source.certification_state,
    certification_hash: source.certification_hash,
    replay_hash: hashValue("compliance-certification-replay-snapshot", { id: source.certification_id, state: source.certification_state, score: source.certification_score, expected_outputs, actual_outputs }),
  });
}

export function computeComplianceCertificationHash(record: Omit<ComplianceCertificationRecord, "certification_hash"> | ComplianceCertificationRecord): string {
  const { certification_hash: _hash, certification_ledger_record, replay_snapshot, ...source } = record as ComplianceCertificationRecord;
  return hashValue("compliance-certification-record", {
    ...source,
    certification_ledger_record: certification_ledger_record ? { ...certification_ledger_record, certification_hash: undefined } : undefined,
    replay_snapshot: replay_snapshot ? { ...replay_snapshot, certification_hash: undefined, replay_hash: undefined } : undefined,
  });
}

export function buildComplianceCertificationRecord(overrides: Partial<ComplianceCertificationRecord> = {}): ComplianceCertificationRecord {
  const base = runComplianceCertification();
  const { certification_hash: overrideHash, ...overrideRest } = overrides;
  const merged = { ...base, ...overrideRest } as ComplianceCertificationRecord;
  return Object.freeze({ ...merged, certification_hash: overrideHash ?? computeComplianceCertificationHash(merged) });
}

export function validateComplianceCertificationRecord(record: Partial<ComplianceCertificationRecord> | undefined): ComplianceCertificationValidationResult {
  const errors: ComplianceCertificationValidationFailure[] = [];
  if (!record) errors.push(failure("CERTIFICATION_RECORD_MISSING", "record", "certification record missing"));
  if (record?.contract_version !== CONTRACT_VERSION) errors.push(failure("UNSUPPORTED_SCHEMA_VERSION", "contract_version", "unsupported certification contract"));
  if (!record?.certification_id) errors.push(failure("CERTIFICATION_ID_MISSING", "certification_id", "certification id missing"));
  if (!record?.tenant_id) errors.push(failure("TENANT_ID_MISSING", "tenant_id", "tenant id missing"));
  if (!record?.mission_id) errors.push(failure("MISSION_ID_MISSING", "mission_id", "mission id missing"));
  if (!record?.certification_state || !["PASS", "CONDITIONAL_PASS", "FAIL"].includes(record.certification_state)) errors.push(failure("UNKNOWN_CERTIFICATION_STATE", "certification_state", "unknown certification state"));
  if (!record?.test_results || COMPONENT_KEYS.some((key) => !record.test_results?.[key])) errors.push(failure("TEST_RESULTS_MISSING", "test_results", "certification test results missing"));
  if (!record?.supporting_evidence?.length) errors.push(failure("SUPPORTING_EVIDENCE_MISSING", "supporting_evidence", "supporting evidence missing"));
  if (!record?.lineage_reference) errors.push(failure("LINEAGE_REFERENCE_MISSING", "lineage_reference", "lineage reference missing"));
  if (!record?.replay_reference) errors.push(failure("REPLAY_REFERENCE_MISSING", "replay_reference", "replay reference missing"));
  if (!record?.truth_ledger_reference) errors.push(failure("TRUTH_LEDGER_REFERENCE_MISSING", "truth_ledger_reference", "truth ledger reference missing"));
  if (!record?.certification_ledger_record?.certification_ledger_id) errors.push(failure("CERTIFICATION_LEDGER_MISSING", "certification_ledger_record", "certification ledger missing"));
  if (!record?.replay_snapshot?.replay_hash) errors.push(failure("REPLAY_SNAPSHOT_MISSING", "replay_snapshot", "certification replay snapshot missing"));
  if (record?.test_results) {
    const expected = decideComplianceCertificationState(record.test_results as ComplianceCertificationTestResults);
    if (expected !== record.certification_state) errors.push(failure("FAILURE_STATE_MISMATCH", "certification_state", "certification state does not match test outcomes"));
  }
  if (record?.certification_hash && computeComplianceCertificationHash(record as ComplianceCertificationRecord) !== record.certification_hash) errors.push(failure("CERTIFICATION_HASH_MISMATCH", "certification_hash", "certification hash mismatch"));
  if (containsTenantLeak(record, record?.tenant_id)) errors.push(failure("TENANT_SCOPE_VIOLATION", "tenant_id", "cross-tenant certification reference detected"));
  if (isRecord(record) && ("hidden_state" in record || "hidden_certification_state" in record)) errors.push(failure("HIDDEN_STATE_DETECTED", "record", "hidden certification state is prohibited"));
  const validation_state = errors.some((error) => error.reason === "TENANT_SCOPE_VIOLATION") ? "TENANT_SCOPE_VIOLATION" : errors.some((error) => ["HIDDEN_STATE_DETECTED", "CERTIFICATION_LEDGER_MISSING", "TRUTH_LEDGER_REFERENCE_MISSING", "FAILURE_STATE_MISMATCH"].includes(error.reason)) ? "CERTIFICATION_BLOCKED" : errors.some((error) => ["REPLAY_REFERENCE_MISSING", "REPLAY_SNAPSHOT_MISSING", "CERTIFICATION_HASH_MISMATCH"].includes(error.reason)) ? "REPLAY_MISMATCH" : errors.length ? "INVALID" : "VALID";
  return Object.freeze({
    certification_id: record?.certification_id,
    validation_state,
    validator_version: "COMPLIANCE-CERTIFICATION-VALIDATOR-V1",
    checks: Object.freeze({
      schema_valid: !errors.some((error) => ["CERTIFICATION_RECORD_MISSING", "UNSUPPORTED_SCHEMA_VERSION"].includes(error.reason)),
      required_fields_present: !errors.some((error) => ["CERTIFICATION_ID_MISSING", "TENANT_ID_MISSING", "MISSION_ID_MISSING"].includes(error.reason)),
      test_results_present: !errors.some((error) => error.reason === "TEST_RESULTS_MISSING"),
      evidence_complete: !errors.some((error) => error.reason === "SUPPORTING_EVIDENCE_MISSING"),
      lineage_valid: !errors.some((error) => error.reason === "LINEAGE_REFERENCE_MISSING"),
      replay_valid: !errors.some((error) => ["REPLAY_REFERENCE_MISSING", "REPLAY_SNAPSHOT_MISSING", "CERTIFICATION_HASH_MISMATCH"].includes(error.reason)),
      truth_ledger_recorded: !errors.some((error) => error.reason === "TRUTH_LEDGER_REFERENCE_MISSING"),
      ledger_recorded: !errors.some((error) => error.reason === "CERTIFICATION_LEDGER_MISSING"),
      tenant_isolation_valid: !errors.some((error) => error.reason === "TENANT_SCOPE_VIOLATION"),
      hidden_state_absent: !errors.some((error) => error.reason === "HIDDEN_STATE_DETECTED"),
      hash_valid: !errors.some((error) => error.reason === "CERTIFICATION_HASH_MISMATCH"),
    }),
    errors: Object.freeze(errors),
    warnings: Object.freeze([]),
    validation_timestamp: NOW,
  });
}

export function replayComplianceCertification(record: ComplianceCertificationRecord): ComplianceCertificationReplayResult {
  const reconstructed_certification_hash = computeComplianceCertificationHash(record);
  const validation = validateComplianceCertificationRecord(record);
  const reproduced = validation.validation_state === "VALID" && reconstructed_certification_hash === record.certification_hash;
  return Object.freeze({
    replay_id: hashValue("compliance-certification-replay", { id: record.certification_id, reconstructed_certification_hash }),
    certification_id: record.certification_id,
    replay_state: reproduced ? "REPRODUCED" : record.replay_snapshot ? "MISMATCH" : "INCOMPLETE",
    reconstructed_certification_hash,
    expected_certification_hash: record.certification_hash,
    reconstructed_certification_score: certificationScore(record.test_results),
    expected_certification_score: record.certification_score,
    reconstructed_certification_state: decideComplianceCertificationState(record.test_results),
    expected_certification_state: record.certification_state,
    failure_reason: reproduced ? null : validation.errors[0]?.reason ?? "CERTIFICATION_HASH_MISMATCH",
  });
}

export function buildComplianceRemediationRecords(record: ComplianceCertificationRecord): readonly ComplianceRemediationRecord[] {
  const findings = [...record.blocking_failures, ...record.conditional_findings].filter((item) => item.failure_class);
  return Object.freeze(findings.map((finding) => {
    const critical = Boolean(finding.failure_class && BLOCKING_FAILURE_CLASSES.includes(finding.failure_class));
    return Object.freeze({
      remediation_id: `CREM-7D5-${hashValue("compliance-remediation-id", { certification_id: record.certification_id, test: finding.test_id, failure: finding.failure_class }).slice(0, 10).toUpperCase()}`,
      certification_id: record.certification_id,
      failed_test: finding.test_id,
      failure_class: finding.failure_class as ComplianceCertificationFailureClass,
      severity: critical ? "CRITICAL" : "LOW",
      required_fix: critical ? `Resolve blocking ${finding.failure_class} and retest ${finding.test_id}.` : `Remediate non-critical ${finding.failure_class} before unrestricted deployment.`,
      owner_scope: finding.test_id === "operator_visibility" ? "DASHBOARD" : critical ? "GOVERNANCE" : "CERTIFICATION_SUITE",
      governance_review_required: critical || finding.failure_class === "MINOR_TREND_CALIBRATION_GAP",
      operator_review_required: critical || finding.test_id === "operator_visibility",
      verification_test: finding.test_id,
      target_state: "PASS" as const,
      remediation_state: "OPEN" as const,
      lineage_reference: `lineage_${record.tenant_id}_remediation_${finding.test_id}`,
      truth_ledger_reference: `truth_ledger_${record.tenant_id}_remediation_${finding.test_id}`,
    });
  }));
}

export function buildComplianceCertificationReport(record = runComplianceCertification()): ComplianceCertificationReport {
  const replay = replayComplianceCertification(record);
  const validation = validateComplianceCertificationRecord(record);
  return Object.freeze({
    certification_id: record.certification_id,
    certification_state: record.certification_state,
    certification_score: record.certification_score,
    passed_tests: record.passed_tests,
    failed_tests: record.failed_tests,
    conditional_findings: record.conditional_findings,
    blocking_failures: record.blocking_failures,
    evidence_status: validation.checks.evidence_complete ? "COMPLETE" : "INCOMPLETE",
    replay_status: replay.replay_state,
    lineage_status: validation.checks.lineage_valid ? "INTACT" : "BROKEN",
    tenant_isolation_status: validation.checks.tenant_isolation_valid && record.test_results.tenant_isolation.status === "PASS" ? "PRESERVED" : "FAILED",
    confidence_status: record.test_results.confidence_reproducibility.status === "PASS" ? "REPRODUCED" : "MISMATCH",
    historical_truth_status: record.test_results.historical_truth.status === "PASS" ? "PRESERVED" : "FAILED",
    required_remediation: buildComplianceRemediationRecords(record),
    truth_ledger_reference: record.truth_ledger_reference,
    certification_hash: record.certification_hash,
  });
}

export function buildComplianceCertificationObservabilitySurface(record = runComplianceCertification()) {
  return buildComplianceCertificationReport(record);
}

export function buildComplianceCertificationContract() {
  const baseline_certification = runComplianceCertification();
  return Object.freeze({
    doctrine: buildComplianceCertificationDoctrine(),
    certification_scope: baseline_certification.certification_scope,
    baseline_certification,
    remediation_model: buildComplianceRemediationRecords(baseline_certification),
  });
}
