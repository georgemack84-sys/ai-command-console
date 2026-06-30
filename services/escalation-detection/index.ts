import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import {
  buildEscalationContractRecord,
  computeEscalationHash,
  replayEscalationContract,
  validateEscalationContractRecord,
} from "@/services/escalation-contract";
import type { EscalationContractRecord, EscalationTriggerType, EscalationType } from "@/types/escalation-contract";
import type {
  EscalationDetectionDoctrine,
  EscalationDetectionFailureReason,
  EscalationDetectionFinding,
  EscalationDetectionLedgerRecord,
  EscalationDetectionMetrics,
  EscalationDetectionObservabilitySurface,
  EscalationDetectionOutputType,
  EscalationDetectionReplayResult,
  EscalationDetectionResult,
  EscalationDetectionScenario,
  EscalationDetectionValidationFailure,
  EscalationDetectionValidationResult,
  EscalationGovernanceInput,
  EscalationTriggerEvaluation,
} from "@/types/escalation-detection";

const NOW: "2026-06-26T15:00:00.000Z" = "2026-06-26T15:00:00.000Z";
const CONTRACT_VERSION: "ESCALATION-DETECTION-V1" = "ESCALATION-DETECTION-V1";

const OUTPUTS: readonly EscalationDetectionOutputType[] = Object.freeze(["CONSTITUTIONAL_ESCALATION", "AUTHORITY_ESCALATION", "POLICY_ESCALATION", "COMPLIANCE_ESCALATION", "PROCESS_ESCALATION", "RISK_ESCALATION", "EVIDENCE_ESCALATION", "REPLAY_ESCALATION", "INTEGRITY_ESCALATION"]);

const TRIGGER_MAP: Readonly<Record<EscalationDetectionScenario, { trigger: EscalationTriggerType; output: EscalationDetectionOutputType; escalation_type: EscalationType; score: number } | null>> = Object.freeze({
  BASELINE: { trigger: "POLICY_VIOLATION", output: "POLICY_ESCALATION", escalation_type: "POLICY", score: 78 },
  CONSTITUTIONAL_RISK: { trigger: "CONSTITUTIONAL_CONFLICT", output: "CONSTITUTIONAL_ESCALATION", escalation_type: "CONSTITUTIONAL", score: 96 },
  AUTHORITY_VIOLATION: { trigger: "AUTHORITY_DRIFT", output: "AUTHORITY_ESCALATION", escalation_type: "AUTHORITY", score: 90 },
  POLICY_FAILURE: { trigger: "POLICY_VIOLATION", output: "POLICY_ESCALATION", escalation_type: "POLICY", score: 78 },
  COMPLIANCE_DEGRADATION: { trigger: "COMPLIANCE_GAP", output: "COMPLIANCE_ESCALATION", escalation_type: "COMPLIANCE", score: 75 },
  PROCESS_FAILURE: { trigger: "GOVERNANCE_EXCEPTION", output: "PROCESS_ESCALATION", escalation_type: "GOVERNANCE", score: 72 },
  RISK_ESCALATION: { trigger: "RISK_THRESHOLD", output: "RISK_ESCALATION", escalation_type: "RISK", score: 88 },
  EVIDENCE_ESCALATION: { trigger: "EVIDENCE_INTEGRITY_FAILURE", output: "EVIDENCE_ESCALATION", escalation_type: "EVIDENCE", score: 82 },
  REPLAY_ESCALATION: { trigger: "REPLAY_MISMATCH", output: "REPLAY_ESCALATION", escalation_type: "REPLAY", score: 86 },
  INTEGRITY_ESCALATION: { trigger: "EVIDENCE_INTEGRITY_FAILURE", output: "INTEGRITY_ESCALATION", escalation_type: "EVIDENCE", score: 89 },
  NO_ESCALATION: null,
  UNSUPPORTED_TRIGGER: { trigger: "OPERATIONAL_FAILURE", output: "PROCESS_ESCALATION", escalation_type: "OPERATIONAL", score: 72 },
  MISSING_EVIDENCE: { trigger: "EVIDENCE_INTEGRITY_FAILURE", output: "EVIDENCE_ESCALATION", escalation_type: "EVIDENCE", score: 82 },
  INVALID_AUTHORITY: { trigger: "AUTHORITY_DRIFT", output: "AUTHORITY_ESCALATION", escalation_type: "AUTHORITY", score: 90 },
  INVALID_CONSTITUTIONAL_REF: { trigger: "CONSTITUTIONAL_CONFLICT", output: "CONSTITUTIONAL_ESCALATION", escalation_type: "CONSTITUTIONAL", score: 96 },
  INCOMPLETE_GOVERNANCE_CONTEXT: { trigger: "GOVERNANCE_EXCEPTION", output: "PROCESS_ESCALATION", escalation_type: "GOVERNANCE", score: 72 },
  REPLAY_MISMATCH: { trigger: "REPLAY_MISMATCH", output: "REPLAY_ESCALATION", escalation_type: "REPLAY", score: 86 },
  BROKEN_LINEAGE: { trigger: "GOVERNANCE_EXCEPTION", output: "PROCESS_ESCALATION", escalation_type: "GOVERNANCE", score: 72 },
  CROSS_TENANT: { trigger: "POLICY_VIOLATION", output: "POLICY_ESCALATION", escalation_type: "POLICY", score: 78 },
  HIDDEN_STATE: { trigger: "POLICY_VIOLATION", output: "POLICY_ESCALATION", escalation_type: "POLICY", score: 78 },
  EXECUTION_AUTHORITY: { trigger: "AUTHORITY_DRIFT", output: "AUTHORITY_ESCALATION", escalation_type: "AUTHORITY", score: 90 },
  DETECTION_HASH_MISMATCH: { trigger: "POLICY_VIOLATION", output: "POLICY_ESCALATION", escalation_type: "POLICY", score: 78 },
});

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

function failure(reason: EscalationDetectionFailureReason, field_path: string, message: string): EscalationDetectionValidationFailure {
  return Object.freeze({ failure_id: hashValue("escalation-detection-validation-failure", { reason, field_path, message }), reason, field_path, message, fail_closed: true });
}

export function buildEscalationDetectionDoctrine(): EscalationDetectionDoctrine {
  return Object.freeze({
    principles: Object.freeze(["deterministic", "trigger-evaluated", "evidence-driven", "governance-aware", "constitutionally-bound", "authority-preserving", "advisory-only", "tenant-safe", "truth-ledger-recorded", "replayable", "explainable", "certification-ready", "fail-closed"] as const),
    supported_outputs: OUTPUTS,
    detector_version: CONTRACT_VERSION,
  });
}

export function buildEscalationGovernanceInput(input: { tenant_id?: string; mission_id?: string; scenario?: EscalationDetectionScenario } = {}): EscalationGovernanceInput {
  const tenant_id = input.tenant_id ?? "tenant_alpha";
  const mission_id = input.mission_id ?? "mission_governance_escalation";
  const scenario = input.scenario ?? "BASELINE";
  const refTenant = scenario === "CROSS_TENANT" ? "tenant_beta" : tenant_id;
  const evidence_refs = scenario === "MISSING_EVIDENCE" ? Object.freeze([]) : Object.freeze([`evidence_${refTenant}_escalation_policy`, `evidence_${refTenant}_escalation_risk`, `evidence_${refTenant}_escalation_replay`]);
  const authority_refs = scenario === "INVALID_AUTHORITY" ? Object.freeze([]) : Object.freeze([`authority_${refTenant}_operator_review_required`, `authority_${refTenant}_no_expansion`]);
  const constitutional_refs = scenario === "INVALID_CONSTITUTIONAL_REF" ? Object.freeze([]) : Object.freeze([`constitution_${refTenant}_operator_supremacy`, `constitution_${refTenant}_advisory_only`]);
  const replay_refs = scenario === "REPLAY_MISMATCH" ? Object.freeze([]) : Object.freeze([`replay_${refTenant}_governance_detection_7f2`]);
  const inputWithoutHash = {
    input_id: `EGIN-7F2-${hashValue("escalation-input-id", { tenant_id, mission_id, scenario }).slice(0, 10).toUpperCase()}`,
    tenant_id,
    mission_id,
    governance_session_id: `gov_session_${tenant_id}_7f2`,
    constitutional_refs,
    authority_refs,
    policy_refs: scenario === "INCOMPLETE_GOVERNANCE_CONTEXT" ? Object.freeze([]) : Object.freeze([`policy_${refTenant}_governance_escalation_v1`]),
    compliance_refs: Object.freeze([`compliance_${refTenant}_7d_certified`]),
    recommendation_refs: Object.freeze([`recommendation_${refTenant}_7e_certified`]),
    risk_refs: Object.freeze([`risk_${refTenant}_governance_escalation_001`]),
    evidence_refs,
    replay_refs,
    integrity_refs: scenario === "INTEGRITY_ESCALATION" ? Object.freeze([`integrity_${refTenant}_ledger_hash_mismatch`]) : Object.freeze([`integrity_${refTenant}_ledger_verified`]),
    trust_score: scenario === "RISK_ESCALATION" ? 61 : 88,
    operational_health_score: scenario === "PROCESS_FAILURE" ? 58 : 91,
    source_timestamp: NOW,
  };
  return Object.freeze({ ...inputWithoutHash, input_hash: hashValue("escalation-governance-input", inputWithoutHash) });
}

function evaluateTrigger(input: EscalationGovernanceInput, scenario: EscalationDetectionScenario): EscalationTriggerEvaluation | null {
  if (scenario === "NO_ESCALATION") return null;
  const mapped = TRIGGER_MAP[scenario] ?? TRIGGER_MAP.BASELINE;
  if (!mapped) return null;
  const supported = scenario !== "UNSUPPORTED_TRIGGER";
  const evidence_present = input.evidence_refs.length > 0;
  const governance_valid = input.constitutional_refs.length > 0 && input.authority_refs.length > 0 && input.policy_refs.length > 0;
  const applicable = true;
  const escalation_required = applicable && supported && evidence_present && governance_valid;
  const source = { trigger_type: mapped.trigger, output_type: mapped.output, applicable, supported, evidence_present, governance_valid, escalation_required, input_hash: input.input_hash };
  return Object.freeze({
    evaluation_id: `EVAL-7F2-${hashValue("escalation-trigger-evaluation-id", source).slice(0, 10).toUpperCase()}`,
    trigger_type: mapped.trigger,
    output_type: mapped.output,
    applicable,
    supported,
    evidence_present,
    governance_valid,
    escalation_required,
    evaluation_reason: escalation_required ? `${mapped.output} required because ${mapped.trigger} was deterministically supported by tenant-scoped governance evidence.` : `${mapped.trigger} did not satisfy supported, evidence, and governance checks.`,
    evaluation_hash: hashValue("escalation-trigger-evaluation", source),
  });
}

function confidenceFor(input: EscalationGovernanceInput, evaluation: EscalationTriggerEvaluation): number {
  let score = 96;
  if (!evaluation.evidence_present) score -= 45;
  if (!evaluation.governance_valid) score -= 25;
  if (!input.replay_refs.length) score -= 20;
  if (input.trust_score < 70) score -= 8;
  if (input.operational_health_score < 70) score -= 6;
  return Math.max(0, Math.min(100, score));
}

function findingFor(input: EscalationGovernanceInput, evaluation: EscalationTriggerEvaluation, scenario: EscalationDetectionScenario): EscalationDetectionFinding | null {
  if (!evaluation.escalation_required) return null;
  const mapped = TRIGGER_MAP[scenario] ?? TRIGGER_MAP.BASELINE;
  if (!mapped) return null;
  const confidence_score = confidenceFor(input, evaluation);
  const source = { evaluation_hash: evaluation.evaluation_hash, evidence_refs: input.evidence_refs, confidence_score };
  return Object.freeze({
    finding_id: `EDF-7F2-${hashValue("escalation-detection-finding-id", source).slice(0, 10).toUpperCase()}`,
    trigger_type: evaluation.trigger_type,
    output_type: evaluation.output_type,
    escalation_type: mapped.escalation_type,
    escalation_required: true,
    explanation: `${evaluation.output_type} generated because ${evaluation.trigger_type} is supported by evidence, governance context, replay references, and tenant-scoped lineage.`,
    evidence_refs: input.evidence_refs,
    governance_refs: uniqueSorted([...input.constitutional_refs, ...input.authority_refs, ...input.policy_refs, ...input.compliance_refs, ...input.risk_refs]),
    replay_refs: input.replay_refs,
    confidence_score,
    finding_hash: hashValue("escalation-detection-finding", source),
  });
}

function recordFor(input: EscalationGovernanceInput, finding: EscalationDetectionFinding, scenario: EscalationDetectionScenario): EscalationContractRecord {
  const contractScenario = scenario === "EXECUTION_AUTHORITY" ? "EXECUTION_AUTHORITY" : scenario === "REPLAY_MISMATCH" ? "REPLAY_MISMATCH" : scenario === "BROKEN_LINEAGE" ? "BROKEN_LINEAGE" : "BASELINE";
  return buildEscalationContractRecord({
    scenario: contractScenario,
    tenant_id: input.tenant_id,
    mission_id: input.mission_id,
    governance_session_id: input.governance_session_id,
    escalation_type: finding.escalation_type,
    category: finding.output_type.toLowerCase(),
    source: input.input_id,
    trigger_definition: {
      trigger_id: `trigger_${input.tenant_id}_${finding.trigger_type.toLowerCase()}_7f2`,
      trigger_type: finding.trigger_type,
      trigger_name: finding.output_type.replaceAll("_", " "),
      trigger_reason: finding.explanation,
      trigger_timestamp: NOW,
      trigger_source: input.input_id,
      deterministic_trigger_hash: hashValue("escalation-trigger", { trigger_type: finding.trigger_type, trigger_name: finding.output_type.replaceAll("_", " "), trigger_reason: finding.explanation, trigger_source: input.input_id, trigger_timestamp: NOW }),
    },
    severity_definition: {
      severity: finding.confidence_score >= 95 ? "CRITICAL" : finding.confidence_score >= 85 ? "HIGH" : "MEDIUM",
      severity_score: (TRIGGER_MAP[scenario] ?? TRIGGER_MAP.BASELINE)?.score ?? 78,
      severity_reason: `${finding.output_type} severity derives from trigger class, trust score, evidence integrity, and replay status.`,
      threshold_model_version: "ESCALATION-SEVERITY-V1",
    },
    evidence_references: {
      evidence_ids: input.evidence_refs,
      truth_record_ids: input.evidence_refs.map((ref) => ref.replace("evidence", "truth_record")),
      recommendation_ids: input.recommendation_refs,
      policy_ids: input.policy_refs,
      risk_ids: input.risk_refs,
      compliance_ids: input.compliance_refs,
      lineage_refs: scenario === "BROKEN_LINEAGE" ? Object.freeze([]) : Object.freeze([`lineage_${input.tenant_id}_detection_${finding.finding_id}`]),
    },
    governance_context: {
      constitutional_context: input.constitutional_refs,
      authority_context: input.authority_refs,
      policy_context: input.policy_refs,
      compliance_context: input.compliance_refs,
      risk_context: input.risk_refs,
    },
    confidence_metadata: {
      confidence_score: finding.confidence_score,
      confidence_level: finding.confidence_score >= 95 ? "CERTIFICATION_READY" : finding.confidence_score >= 85 ? "HIGH" : "MODERATE",
      confidence_reason: "Detection confidence is derived from evidence completeness, governance validity, replay integrity, trust score, and operational health.",
      confidence_inputs: { evidence_count: input.evidence_refs.length, governance_refs: finding.governance_refs.length, replay_refs: input.replay_refs.length, trust_score: input.trust_score, operational_health_score: input.operational_health_score },
      confidence_hash: hashValue("escalation-confidence", { evidence_count: input.evidence_refs.length, governance_refs: finding.governance_refs.length, replay_refs: input.replay_refs.length, trust_score: input.trust_score, operational_health_score: input.operational_health_score }),
    },
    lineage_references: {
      parent_escalation_id: null,
      root_escalation_id: `ESC-ROOT-${finding.finding_id}`,
      lineage_chain: scenario === "BROKEN_LINEAGE" ? Object.freeze([]) : Object.freeze([input.input_id, evaluationLineageRef(finding), finding.finding_id]),
      supersedes_escalation_ids: Object.freeze([]),
      related_escalation_ids: Object.freeze([]),
    },
  });
}

function evaluationLineageRef(finding: EscalationDetectionFinding): string {
  return `trigger_chain_${finding.trigger_type}_${finding.finding_id}`;
}

function ledgerFor(input: EscalationGovernanceInput, findings: readonly EscalationDetectionFinding[], records: readonly EscalationContractRecord[], detection_hash: string, scenario: EscalationDetectionScenario): EscalationDetectionLedgerRecord {
  return Object.freeze({
    detection_ledger_id: `EDLEDGER-7F2-${hashValue("escalation-detection-ledger", detection_hash).slice(0, 10).toUpperCase()}`,
    tenant_id: input.tenant_id,
    mission_id: input.mission_id,
    escalation_ids: Object.freeze(records.map((record) => record.escalation_id)),
    trigger_evidence_refs: uniqueSorted(findings.flatMap((finding) => finding.evidence_refs)),
    confidence_refs: Object.freeze(findings.map((finding) => finding.finding_hash)),
    governance_context_refs: uniqueSorted(findings.flatMap((finding) => finding.governance_refs)),
    replay_refs: uniqueSorted(findings.flatMap((finding) => finding.replay_refs)),
    lineage_refs: uniqueSorted(records.flatMap((record) => record.lineage_references.lineage_chain)),
    truth_ledger_refs: scenario === "MISSING_EVIDENCE" ? Object.freeze([]) : uniqueSorted(records.map((record) => record.truth_ledger_reference.truth_record_reference)),
    detection_hash,
    recorded_timestamp: NOW,
  });
}

export function computeEscalationDetectionHash(input: Pick<EscalationDetectionResult, "input" | "trigger_evaluations" | "findings" | "escalation_records">): string {
  return hashValue("escalation-detection-result", {
    input_hash: input.input.input_hash,
    trigger_evaluations: input.trigger_evaluations.map((evaluation) => evaluation.evaluation_hash),
    findings: input.findings.map((finding) => finding.finding_hash),
    escalation_records: input.escalation_records.map((record) => ({ id: record.escalation_id, hash: record.escalation_hash })),
  });
}

export function runEscalationDetection(input: { tenant_id?: string; mission_id?: string; scenario?: EscalationDetectionScenario } = {}): EscalationDetectionResult {
  const scenario = input.scenario ?? "BASELINE";
  const governanceInput = buildEscalationGovernanceInput({ tenant_id: input.tenant_id, mission_id: input.mission_id, scenario });
  const evaluation = evaluateTrigger(governanceInput, scenario);
  const trigger_evaluations = Object.freeze([evaluation].filter(Boolean) as EscalationTriggerEvaluation[]);
  const findings = Object.freeze(trigger_evaluations.map((item) => findingFor(governanceInput, item, scenario)).filter(Boolean) as EscalationDetectionFinding[]);
  const escalation_records = Object.freeze(findings.map((finding) => recordFor(governanceInput, finding, scenario)));
  const detection_hash = scenario === "DETECTION_HASH_MISMATCH" ? "tampered" : computeEscalationDetectionHash({ input: governanceInput, trigger_evaluations, findings, escalation_records });
  const ledger_record = ledgerFor(governanceInput, findings, escalation_records, detection_hash, scenario);
  const provisional = { contract_version: CONTRACT_VERSION, tenant_id: governanceInput.tenant_id, mission_id: governanceInput.mission_id, detector_version: CONTRACT_VERSION, input: governanceInput, trigger_evaluations, findings, escalation_records, ledger_record, validation_state: "VALID" as const, replay_state: "REPRODUCED" as const, detection_hash };
  const validation = validateEscalationDetection(provisional);
  const replay = replayEscalationDetection(provisional);
  return Object.freeze({ ...provisional, validation_state: validation.validation_state, replay_state: replay.replay_state });
}

export function validateEscalationDetection(result: Partial<EscalationDetectionResult> | undefined): EscalationDetectionValidationResult {
  const errors: EscalationDetectionValidationFailure[] = [];
  if (!result) errors.push(failure("DETECTION_RESULT_MISSING", "result", "detection result missing"));
  if (result?.trigger_evaluations?.some((evaluation) => !evaluation.supported)) errors.push(failure("UNSUPPORTED_TRIGGER_ACCEPTED", "trigger_evaluations", "unsupported trigger cannot be accepted"));
  if (result?.trigger_evaluations?.some((evaluation) => !evaluation.evidence_present)) errors.push(failure("MISSING_EVIDENCE_ACCEPTED", "trigger_evaluations", "missing evidence cannot support escalation detection"));
  if (!result?.input?.authority_refs?.length) errors.push(failure("INVALID_AUTHORITY_ACCEPTED", "input.authority_refs", "authority references are missing or invalid"));
  if (!result?.input?.constitutional_refs?.length) errors.push(failure("INVALID_CONSTITUTIONAL_REF_ACCEPTED", "input.constitutional_refs", "constitutional references are missing or invalid"));
  if (result?.trigger_evaluations?.some((evaluation) => !evaluation.governance_valid)) errors.push(failure("INCOMPLETE_GOVERNANCE_CONTEXT_ACCEPTED", "trigger_evaluations", "governance context incomplete"));
  if (result?.findings?.some((finding) => !finding.replay_refs.length)) errors.push(failure("REPLAY_MISMATCH_ACCEPTED", "findings.replay_refs", "replay references missing"));
  for (const record of result?.escalation_records ?? []) {
    const contractValidation = validateEscalationContractRecord(record);
    for (const error of contractValidation.errors) errors.push(failure(error.reason === "TENANT_SCOPE_VIOLATION" ? "CROSS_TENANT_DETECTION" : error.reason === "EXECUTION_AUTHORITY_DETECTED" ? "EXECUTION_AUTHORITY_DETECTED" : error.reason === "LINEAGE_BROKEN" ? "BROKEN_LINEAGE_ACCEPTED" : error.reason === "REPLAY_HASH_MISMATCH" ? "REPLAY_MISMATCH_ACCEPTED" : "ESCALATION_CONTRACT_INVALID", `escalation_records.${record.escalation_id}.${error.field_path}`, error.message));
    if (record.advisory_boundary.execution_authority !== false) errors.push(failure("EXECUTION_AUTHORITY_DETECTED", `escalation_records.${record.escalation_id}.advisory_boundary`, "execution authority detected"));
  }
  if (containsTenantLeak(result, result?.tenant_id)) errors.push(failure("CROSS_TENANT_DETECTION", "tenant_id", "cross-tenant detection reference detected"));
  if (isRecord(result) && ("hidden_state" in result || "hidden_detection_state" in result || "random_seed" in result)) errors.push(failure("HIDDEN_STATE_DETECTED", "result", "hidden detection state detected"));
  if (!result?.ledger_record?.truth_ledger_refs?.length && (result?.findings?.length ?? 0) > 0) errors.push(failure("TRUTH_LEDGER_RECORD_MISSING", "ledger_record.truth_ledger_refs", "Truth Ledger record missing"));
  if (result?.detection_hash && result.input && result.trigger_evaluations && result.findings && result.escalation_records && computeEscalationDetectionHash(result as EscalationDetectionResult) !== result.detection_hash) errors.push(failure("DETECTION_HASH_MISMATCH", "detection_hash", "detection hash mismatch"));
  const validation_state = errors.some((error) => error.reason === "CROSS_TENANT_DETECTION") ? "TENANT_SCOPE_VIOLATION" : errors.some((error) => ["HIDDEN_STATE_DETECTED", "EXECUTION_AUTHORITY_DETECTED"].includes(error.reason)) ? "CERTIFICATION_BLOCKED" : errors.some((error) => ["REPLAY_MISMATCH_ACCEPTED", "DETECTION_HASH_MISMATCH"].includes(error.reason)) ? "REPLAY_MISMATCH" : errors.length ? "INVALID" : "VALID";
  return Object.freeze({
    validation_state,
    validator_version: "ESCALATION-DETECTION-VALIDATOR-V1",
    checks: Object.freeze({
      triggers_supported: !errors.some((error) => error.reason === "UNSUPPORTED_TRIGGER_ACCEPTED"),
      evidence_complete: !errors.some((error) => error.reason === "MISSING_EVIDENCE_ACCEPTED"),
      governance_context_complete: !errors.some((error) => error.reason === "INCOMPLETE_GOVERNANCE_CONTEXT_ACCEPTED"),
      authority_valid: !errors.some((error) => error.reason === "INVALID_AUTHORITY_ACCEPTED"),
      constitutional_refs_valid: !errors.some((error) => error.reason === "INVALID_CONSTITUTIONAL_REF_ACCEPTED"),
      contracts_valid: !errors.some((error) => error.reason === "ESCALATION_CONTRACT_INVALID"),
      advisory_only_enforced: !errors.some((error) => error.reason === "EXECUTION_AUTHORITY_DETECTED"),
      tenant_isolated: !errors.some((error) => error.reason === "CROSS_TENANT_DETECTION"),
      lineage_reconstructable: !errors.some((error) => error.reason === "BROKEN_LINEAGE_ACCEPTED"),
      replay_ready: !errors.some((error) => ["REPLAY_MISMATCH_ACCEPTED", "DETECTION_HASH_MISMATCH"].includes(error.reason)),
      truth_ledger_recorded: !errors.some((error) => error.reason === "TRUTH_LEDGER_RECORD_MISSING"),
      hidden_state_absent: !errors.some((error) => error.reason === "HIDDEN_STATE_DETECTED"),
      hash_valid: !errors.some((error) => error.reason === "DETECTION_HASH_MISMATCH"),
    }),
    errors: Object.freeze(errors),
    warnings: Object.freeze([]),
    validation_timestamp: NOW,
  });
}

export function replayEscalationDetection(result: EscalationDetectionResult): EscalationDetectionReplayResult {
  const reconstructed_detection_hash = computeEscalationDetectionHash(result);
  const validation = validateEscalationDetection(result);
  const contractReplays = result.escalation_records.map((record) => replayEscalationContract(record));
  const reproduced = validation.validation_state === "VALID" && reconstructed_detection_hash === result.detection_hash && contractReplays.every((replay) => replay.replay_state === "REPRODUCED");
  return Object.freeze({
    replay_id: hashValue("escalation-detection-replay", { expected: result.detection_hash, reconstructed_detection_hash }),
    replay_state: reproduced ? "REPRODUCED" : "MISMATCH",
    reconstructed_detection_hash,
    expected_detection_hash: result.detection_hash,
    reconstructed_escalation_ids: Object.freeze(result.escalation_records.map((record) => record.escalation_id)),
    expected_escalation_ids: result.ledger_record.escalation_ids,
    failure_reason: reproduced ? null : validation.errors[0]?.reason ?? "DETECTION_HASH_MISMATCH",
  });
}

export function buildEscalationDetectionMetrics(result = runEscalationDetection()): EscalationDetectionMetrics {
  const trigger_frequency = Object.fromEntries(["CONSTITUTIONAL_CONFLICT", "AUTHORITY_DRIFT", "POLICY_VIOLATION", "COMPLIANCE_GAP", "GOVERNANCE_EXCEPTION", "RISK_THRESHOLD", "RECOMMENDATION_BLOCKER", "EVIDENCE_INTEGRITY_FAILURE", "REPLAY_MISMATCH", "OPERATIONAL_FAILURE"].map((trigger) => [trigger, result.trigger_evaluations.filter((evaluation) => evaluation.trigger_type === trigger).length])) as EscalationDetectionMetrics["trigger_frequency"];
  const trigger_distribution = Object.fromEntries(OUTPUTS.map((output) => [output, result.findings.filter((finding) => finding.output_type === output).length])) as EscalationDetectionMetrics["trigger_distribution"];
  return Object.freeze({
    detection_rate: result.findings.length,
    trigger_frequency: Object.freeze(trigger_frequency),
    trigger_distribution: Object.freeze(trigger_distribution),
    replay_success_rate: result.replay_state === "REPRODUCED" ? 1 : 0,
    evidence_completeness: result.findings.length ? result.findings.filter((finding) => finding.evidence_refs.length > 0).length / result.findings.length : 1,
    average_confidence: result.findings.length ? Math.round(result.findings.reduce((sum, finding) => sum + finding.confidence_score, 0) / result.findings.length) : 100,
    constitutional_escalation_count: result.findings.filter((finding) => finding.output_type === "CONSTITUTIONAL_ESCALATION").length,
    authority_escalation_count: result.findings.filter((finding) => finding.output_type === "AUTHORITY_ESCALATION").length,
    compliance_escalation_count: result.findings.filter((finding) => finding.output_type === "COMPLIANCE_ESCALATION").length,
    integrity_escalation_count: result.findings.filter((finding) => finding.output_type === "INTEGRITY_ESCALATION").length,
    replay_escalation_count: result.findings.filter((finding) => finding.output_type === "REPLAY_ESCALATION").length,
    average_detection_latency_ms: 0,
  });
}

export function buildEscalationDetectionObservabilitySurface(result = runEscalationDetection()): EscalationDetectionObservabilitySurface {
  const validation = validateEscalationDetection(result);
  return Object.freeze({
    escalation_count: result.escalation_records.length,
    trigger_evaluations: result.trigger_evaluations,
    finding_explanations: Object.freeze(result.findings.map((finding) => finding.explanation)),
    escalation_ids: Object.freeze(result.escalation_records.map((record) => record.escalation_id)),
    evidence_refs: result.ledger_record.trigger_evidence_refs,
    governance_refs: result.ledger_record.governance_context_refs,
    replay_refs: result.ledger_record.replay_refs,
    ledger_refs: result.ledger_record.truth_ledger_refs,
    replay_state: result.replay_state,
    advisory_only_notice: "Escalation detection is advisory only; it does not execute governance actions, modify policy, change compliance state, approve recommendations, or bypass operators.",
    metrics: buildEscalationDetectionMetrics(result),
    validation_failures: Object.freeze(validation.errors.map((error) => error.reason)),
  });
}

export function getEscalationDetectionContract() {
  const baseline_detection = runEscalationDetection();
  return Object.freeze({ doctrine: buildEscalationDetectionDoctrine(), baseline_detection, observability: buildEscalationDetectionObservabilitySurface(baseline_detection) });
}
