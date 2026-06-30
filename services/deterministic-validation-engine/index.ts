import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { buildAutonomyCertificationContract } from "@/services/autonomy-certification-contract";
import type {
  DeterministicResult,
  DeterministicSeverity,
  DeterministicValidationDomain,
  DeterministicValidationFailure,
  DeterministicValidationInput,
  DeterministicValidationObservabilitySurface,
  DeterministicValidationReport,
  DeterministicValidationResult,
  DeterministicValidationScenario,
  ExecutionComparisonRecord,
  SignatureStatus,
  ValidationEvidenceRecord,
  ValidationSignatureSet,
} from "@/types/deterministic-validation-engine";

const NOW = "2026-07-01T08:00:00.000Z";
const ENGINE_VERSION = "deterministic-validation-engine/v8K.2" as const;
const TENANT_ID = "tenant:autonomy:primary";
const MISSION_ID = "mission:autonomy:primary";
const REPLAY_REFERENCE = "replay:deterministic-validation:8k2:primary";
const LINEAGE_REFERENCE = "lineage:deterministic-validation:8k2:primary";

const domains: readonly DeterministicValidationDomain[] = ["PLANNING", "ORCHESTRATION", "DELEGATION", "RUNTIME_SUPERVISION", "REPLAY", "INTEGRITY", "GOVERNANCE", "AUTHORITY", "VISIBILITY", "TENANT_ISOLATION"];

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function uniq<T extends string>(values: readonly T[]): readonly T[] {
  return freezeArray([...new Set(values)].sort());
}

function id(prefix: string, domain: string, value: unknown): string {
  return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`;
}

const failureByScenario: Partial<Record<DeterministicValidationScenario, DeterministicValidationFailure>> = Object.freeze({
  PLANNING_DIVERGENCE: "PLANNING_DIVERGENCE_DETECTED",
  EXECUTION_DIVERGENCE: "EXECUTION_DIVERGENCE_DETECTED",
  DELEGATION_DIVERGENCE: "DELEGATION_DIVERGENCE_DETECTED",
  SUPERVISION_DIVERGENCE: "SUPERVISION_DIVERGENCE_DETECTED",
  REPLAY_MISMATCH: "REPLAY_MISMATCH_DETECTED",
  INTEGRITY_MISMATCH: "INTEGRITY_MISMATCH_DETECTED",
  CONFIDENCE_MISMATCH: "CONFIDENCE_MISMATCH_DETECTED",
  GOVERNANCE_MISMATCH: "GOVERNANCE_MISMATCH_DETECTED",
  AUTHORITY_MISMATCH: "AUTHORITY_MISMATCH_DETECTED",
  VISIBILITY_MISMATCH: "VISIBILITY_MISMATCH_DETECTED",
  LINEAGE_MISMATCH: "LINEAGE_MISMATCH_DETECTED",
  REPLAY_CORRUPTION: "REPLAY_CORRUPTION_DETECTED",
  HIDDEN_EXECUTION_STATE: "HIDDEN_EXECUTION_STATE_DETECTED",
  HIDDEN_GOVERNANCE_STATE: "HIDDEN_GOVERNANCE_STATE_DETECTED",
  TENANT_ISOLATION_FAILURE: "TENANT_ISOLATION_FAILURE_DETECTED",
  CROSS_TENANT_STATE_LEAKAGE: "CROSS_TENANT_STATE_LEAKAGE_DETECTED",
  NONDETERMINISTIC_STATE_TRANSITIONS: "NONDETERMINISTIC_STATE_TRANSITIONS_DETECTED",
  MUTABLE_HISTORICAL_EVIDENCE: "MUTABLE_HISTORICAL_EVIDENCE_DETECTED",
});

function failureForScenario(scenario: DeterministicValidationScenario): DeterministicValidationFailure | null {
  return failureByScenario[scenario] ?? null;
}

function mutationKey(scenario: DeterministicValidationScenario): keyof Omit<ValidationSignatureSet, "signature_hash"> | null {
  const map: Partial<Record<DeterministicValidationScenario, keyof Omit<ValidationSignatureSet, "signature_hash">>> = {
    PLANNING_DIVERGENCE: "decision_signature",
    EXECUTION_DIVERGENCE: "state_signature",
    DELEGATION_DIVERGENCE: "decision_signature",
    SUPERVISION_DIVERGENCE: "confidence_signature",
    REPLAY_MISMATCH: "replay_signature",
    INTEGRITY_MISMATCH: "integrity_signature",
    CONFIDENCE_MISMATCH: "confidence_signature",
    GOVERNANCE_MISMATCH: "governance_signature",
    AUTHORITY_MISMATCH: "authority_signature",
    VISIBILITY_MISMATCH: "visibility_signature",
    LINEAGE_MISMATCH: "lineage_signature",
    REPLAY_CORRUPTION: "replay_signature",
    HIDDEN_EXECUTION_STATE: "state_signature",
    HIDDEN_GOVERNANCE_STATE: "governance_signature",
    TENANT_ISOLATION_FAILURE: "tenant_signature",
    CROSS_TENANT_STATE_LEAKAGE: "tenant_signature",
    NONDETERMINISTIC_STATE_TRANSITIONS: "state_signature",
    MUTABLE_HISTORICAL_EVIDENCE: "evidence_signature",
  };
  return map[scenario] ?? null;
}

function basePayload(component: string) {
  return Object.freeze({
    component,
    tenant_id: TENANT_ID,
    mission_id: MISSION_ID,
    policy_version: "policy:controlled-autonomy:v8",
    governance_state: "APPROVED",
    authority_state: "AUTHORIZED",
    environment: "certified-deterministic",
    input_seed: "certified-input:8k2",
  });
}

function signatureSet(component: string, scenario: DeterministicValidationScenario, comparison: boolean): ValidationSignatureSet {
  const payload = basePayload(component);
  const source = {
    input_signature: hashValue("deterministic-input-signature", payload),
    environment_signature: hashValue("deterministic-environment-signature", payload),
    state_signature: hashValue("deterministic-state-signature", { ...payload, transitions: ["REGISTERED", "VALIDATING", "COMPLETE"] }),
    decision_signature: hashValue("deterministic-decision-signature", { ...payload, decisions: ["PLAN", "DELEGATE", "EXECUTE", "SUPERVISE"] }),
    confidence_signature: hashValue("deterministic-confidence-signature", { ...payload, confidence: [0.91, 0.88, 0.93] }),
    replay_signature: hashValue("deterministic-replay-signature", { ...payload, replay: REPLAY_REFERENCE }),
    integrity_signature: hashValue("deterministic-integrity-signature", { ...payload, integrity: "verified" }),
    governance_signature: hashValue("deterministic-governance-signature", { ...payload, governance: "pass" }),
    authority_signature: hashValue("deterministic-authority-signature", { ...payload, authority: "within-boundary" }),
    visibility_signature: hashValue("deterministic-visibility-signature", { ...payload, visibility: "complete" }),
    tenant_signature: hashValue("deterministic-tenant-signature", { tenant_id: TENANT_ID, isolation: "strict" }),
    lineage_signature: hashValue("deterministic-lineage-signature", { ...payload, lineage: LINEAGE_REFERENCE }),
    evidence_signature: hashValue("deterministic-evidence-signature", { ...payload, evidence: "immutable" }),
  };
  const key = comparison ? mutationKey(scenario) : null;
  const mutated = key ? { ...source, [key]: hashValue("deterministic-mutated-signature", { key, scenario }) } : source;
  return Object.freeze({ ...mutated, signature_hash: hashValue("deterministic-signature-set", mutated) });
}

function domainKey(domain: DeterministicValidationDomain): keyof ValidationSignatureSet {
  const map: Record<DeterministicValidationDomain, keyof ValidationSignatureSet> = {
    PLANNING: "decision_signature",
    ORCHESTRATION: "state_signature",
    DELEGATION: "decision_signature",
    RUNTIME_SUPERVISION: "confidence_signature",
    REPLAY: "replay_signature",
    INTEGRITY: "integrity_signature",
    GOVERNANCE: "governance_signature",
    AUTHORITY: "authority_signature",
    VISIBILITY: "visibility_signature",
    TENANT_ISOLATION: "tenant_signature",
  };
  return map[domain];
}

function domainFailure(domain: DeterministicValidationDomain, scenarioFailure: DeterministicValidationFailure | null): DeterministicValidationFailure | null {
  if (!scenarioFailure) return null;
  const domainFailures: Partial<Record<DeterministicValidationDomain, readonly DeterministicValidationFailure[]>> = {
    PLANNING: ["PLANNING_DIVERGENCE_DETECTED"],
    ORCHESTRATION: ["EXECUTION_DIVERGENCE_DETECTED", "NONDETERMINISTIC_STATE_TRANSITIONS_DETECTED", "HIDDEN_EXECUTION_STATE_DETECTED"],
    DELEGATION: ["DELEGATION_DIVERGENCE_DETECTED"],
    RUNTIME_SUPERVISION: ["SUPERVISION_DIVERGENCE_DETECTED", "CONFIDENCE_MISMATCH_DETECTED"],
    REPLAY: ["REPLAY_MISMATCH_DETECTED", "REPLAY_CORRUPTION_DETECTED"],
    INTEGRITY: ["INTEGRITY_MISMATCH_DETECTED", "LINEAGE_MISMATCH_DETECTED", "MUTABLE_HISTORICAL_EVIDENCE_DETECTED"],
    GOVERNANCE: ["GOVERNANCE_MISMATCH_DETECTED", "HIDDEN_GOVERNANCE_STATE_DETECTED"],
    AUTHORITY: ["AUTHORITY_MISMATCH_DETECTED"],
    VISIBILITY: ["VISIBILITY_MISMATCH_DETECTED"],
    TENANT_ISOLATION: ["TENANT_ISOLATION_FAILURE_DETECTED", "CROSS_TENANT_STATE_LEAKAGE_DETECTED"],
  };
  return domainFailures[domain]?.includes(scenarioFailure) ? scenarioFailure : null;
}

function evidenceRecord(domain: DeterministicValidationDomain): ValidationEvidenceRecord {
  const source = {
    evidence_id: id("DVE", "deterministic-validation-evidence-id", domain),
    domain,
    evidence_type: "DETERMINISTIC_VALIDATION_EVIDENCE",
    replay_reference: `${REPLAY_REFERENCE}:${domain.toLowerCase()}`,
    lineage_reference: `${LINEAGE_REFERENCE}:${domain.toLowerCase()}`,
    integrity_hash: hashValue("deterministic-validation-evidence-integrity", domain),
    immutable_reference: `immutable:deterministic-validation:${domain.toLowerCase()}:8k2`,
  };
  return Object.freeze({ ...source, evidence_hash: hashValue("deterministic-validation-evidence-record", source) });
}

function comparisonRecord(domain: DeterministicValidationDomain, baseline: ValidationSignatureSet, comparison: ValidationSignatureSet, scenarioFailure: DeterministicValidationFailure | null, evidence: readonly ValidationEvidenceRecord[]): ExecutionComparisonRecord {
  const key = domainKey(domain);
  const detected = domainFailure(domain, scenarioFailure);
  const status: SignatureStatus = detected || baseline[key] !== comparison[key] ? "MISMATCH" : "MATCH";
  const source = {
    comparison_id: id("DVC", "deterministic-validation-comparison-id", domain),
    domain,
    baseline_signature: baseline[key],
    comparison_signature: comparison[key],
    status,
    detected_failure: status === "MISMATCH" ? detected ?? scenarioFailure : null,
    explanation: status === "MATCH" ? `${domain} signatures match exactly.` : `${domain} deterministic comparison failed.`,
    evidence_refs: freezeArray(evidence.filter((item) => item.domain === domain).map((item) => item.evidence_hash)),
  };
  return Object.freeze({ ...source, comparison_hash: hashValue("deterministic-validation-comparison-record", source) });
}

function severityFor(failures: readonly DeterministicValidationFailure[]): DeterministicSeverity {
  if (failures.length === 0) return "NONE";
  if (failures.some((failure) => ["TENANT_ISOLATION_FAILURE_DETECTED", "CROSS_TENANT_STATE_LEAKAGE_DETECTED", "MUTABLE_HISTORICAL_EVIDENCE_DETECTED"].includes(failure))) return "CRITICAL";
  if (failures.some((failure) => ["REPLAY_CORRUPTION_DETECTED", "INTEGRITY_MISMATCH_DETECTED", "HIDDEN_EXECUTION_STATE_DETECTED", "HIDDEN_GOVERNANCE_STATE_DETECTED"].includes(failure))) return "HIGH";
  return "MEDIUM";
}

export function computeDeterministicValidationReportHash(report: Omit<DeterministicValidationReport, "report_hash"> | DeterministicValidationReport): string {
  const { report_hash: _hash, ...source } = report as DeterministicValidationReport;
  return hashValue("deterministic-validation-report", source);
}

export function runDeterministicValidation(input: DeterministicValidationInput = {}): DeterministicValidationReport {
  const scenario = input.scenario ?? "BASELINE";
  const component = input.component ?? "CONTROLLED_AUTONOMY";
  const certificationContract = buildAutonomyCertificationContract({ component });
  const baseline = signatureSet(component, "BASELINE", false);
  const comparison = signatureSet(component, scenario, true);
  const evidence = freezeArray(domains.map(evidenceRecord));
  const scenarioFailure = failureForScenario(scenario);
  const comparisons = freezeArray(domains.map((domain) => comparisonRecord(domain, baseline, comparison, scenarioFailure, evidence)));
  const detected = uniq(comparisons.map((item) => item.detected_failure).filter((failure): failure is DeterministicValidationFailure => Boolean(failure)));
  const result: DeterministicResult = detected.length === 0 && baseline.signature_hash === comparison.signature_hash ? "DETERMINISTIC" : "NONDETERMINISTIC";
  const integrity_hash = hashValue("deterministic-validation-integrity", { baseline: baseline.signature_hash, comparison: comparison.signature_hash, comparisons: comparisons.map((item) => item.comparison_hash), evidence: evidence.map((item) => item.evidence_hash) });
  const base = {
    validation_id: id("DVAL", "deterministic-validation-id", { scenario, component }),
    engine_version: ENGINE_VERSION,
    tenant_id: TENANT_ID,
    mission_id: MISSION_ID,
    component,
    validation_scope: freezeArray(domains),
    baseline_execution: baseline,
    comparison_execution: comparison,
    input_signature: baseline.input_signature,
    environment_signature: baseline.environment_signature,
    state_signature: comparison.state_signature,
    decision_signature: comparison.decision_signature,
    confidence_signature: comparison.confidence_signature,
    replay_signature: comparison.replay_signature,
    integrity_signature: comparison.integrity_signature,
    governance_signature: comparison.governance_signature,
    authority_signature: comparison.authority_signature,
    visibility_signature: comparison.visibility_signature,
    tenant_signature: comparison.tenant_signature,
    deterministic_result: result,
    detected_differences: detected,
    severity: severityFor(detected),
    validation_state: "COMPLETE" as const,
    validation_timestamp: NOW,
    lineage_reference: LINEAGE_REFERENCE,
    replay_reference: REPLAY_REFERENCE,
    integrity_hash,
    evidence,
    comparisons,
    certification_contract: certificationContract,
    metadata: Object.freeze({
      validation_pipeline: "input-environment-baseline-repeat-comparison-replay-integrity-governance-authority-visibility-tenant-assessment",
      fail_closed: "true",
      normalized_signature_version: "8K.2",
    }),
  };
  return Object.freeze({ ...base, report_hash: computeDeterministicValidationReportHash(base as Omit<DeterministicValidationReport, "report_hash">) });
}

export function validateDeterministicValidationReport(report?: DeterministicValidationReport): DeterministicValidationResult {
  if (!report) {
    const failures = freezeArray<DeterministicValidationFailure>(["EXECUTION_DIVERGENCE_DETECTED"]);
    const source = { validation_id: null, valid: false, deterministic_result: null, report_hash_valid: false, evidence_complete: false, failures };
    return Object.freeze({ ...source, validation_hash: hashValue("deterministic-validation-validation", source) });
  }
  const report_hash_valid = computeDeterministicValidationReportHash(report) === report.report_hash;
  const evidence_complete = report.evidence.every((item) => item.evidence_hash && item.replay_reference && item.lineage_reference && item.integrity_hash);
  const valid = report.deterministic_result === "DETERMINISTIC" && report.detected_differences.length === 0 && report_hash_valid && evidence_complete;
  const source = { validation_id: report.validation_id, valid, deterministic_result: report.deterministic_result, report_hash_valid, evidence_complete, failures: report.detected_differences };
  return Object.freeze({ ...source, validation_hash: hashValue("deterministic-validation-validation", source) });
}

export function buildDeterministicValidationObservabilitySurface(report = runDeterministicValidation()): DeterministicValidationObservabilitySurface {
  return Object.freeze({
    validation_id: report.validation_id,
    deterministic_result: report.deterministic_result,
    validation_state: report.validation_state,
    severity: report.severity,
    comparison_count: report.comparisons.length,
    mismatches: report.comparisons.filter((item) => item.status === "MISMATCH").length,
    failures: report.detected_differences,
    evidence_records: report.evidence.length,
    report_hash: report.report_hash,
  });
}

export function getDeterministicValidationContract() {
  const report = runDeterministicValidation();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray(["input-determinism", "decision-determinism", "state-determinism", "output-determinism", "replay-determinism", "confidence-determinism", "governance-determinism", "authority-determinism", "explainability-determinism", "fail-closed"]),
      engine_version: ENGINE_VERSION,
      validation_states: freezeArray(["REGISTERED", "INPUT_VALIDATION", "ENVIRONMENT_VALIDATION", "BASELINE_EXECUTION", "REPEAT_EXECUTION", "COMPARISON", "REPLAY_VALIDATION", "INTEGRITY_VALIDATION", "GOVERNANCE_VALIDATION", "AUTHORITY_VALIDATION", "VISIBILITY_VALIDATION", "TENANT_VALIDATION", "ASSESSMENT", "COMPLETE"] as const),
      validation_scope: freezeArray(domains),
    }),
    report,
    validation: validateDeterministicValidationReport(report),
    observability: buildDeterministicValidationObservabilitySurface(report),
  });
}
