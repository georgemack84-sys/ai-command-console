import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { buildExecutionAssuranceRecord, computeExecutionAssuranceIntegrityHash, validateExecutionAssuranceRecord } from "@/services/execution-assurance-contract";
import type { ExecutionAssuranceRecord, ExecutionAssuranceScenario } from "@/types/execution-assurance-contract";
import type {
  ExecutionValidationReport,
  RuntimeAssuranceDashboardSurface,
  RuntimeAssuranceEvidence,
  RuntimeAssuranceFailureReason,
  RuntimeAssuranceFramework,
  RuntimeAssurancePackage,
  RuntimeAssuranceReplayResult,
  RuntimeAssuranceScenario,
  RuntimeAssuranceState,
  RuntimeAssuranceValidationResult,
  RuntimeHealthLevel,
  RuntimeHealthReport,
  RuntimeRecommendedAction,
  RuntimeVerificationResult,
} from "@/types/runtime-assurance-engine";

const NOW = "2026-06-29T19:00:00.000Z";
const ENGINE_VERSION = "runtime-assurance-engine/v8E.2" as const;
const PIPELINE: readonly RuntimeAssuranceState[] = Object.freeze(["INITIALIZING", "COLLECTING_RUNTIME_DATA", "VERIFYING_PROGRESS", "VALIDATING_DEPENDENCIES", "VERIFYING_CHECKPOINTS", "VALIDATING_RUNTIME_STATE", "MONITORING_EXECUTION", "ASSESSING_HEALTH", "GENERATING_EVIDENCE", "ACTIVE"]);

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function unique<T extends string>(values: readonly T[]): readonly T[] {
  return freezeArray([...new Set(values.filter(Boolean))].sort());
}

function id(prefix: string, domain: string, value: unknown) {
  return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`;
}

function assuranceScenarioFor(scenario: RuntimeAssuranceScenario): ExecutionAssuranceScenario {
  if (scenario === "POLICY_VIOLATION" || scenario === "GOVERNANCE_BYPASS") return "GOVERNANCE_INVALID";
  if (scenario === "AUTHORITY_VIOLATION") return "AUTHORITY_INVALID";
  if (scenario === "CONSTITUTIONAL_VIOLATION") return "CONSTITUTIONAL_VIOLATION";
  if (scenario === "TENANT_VIOLATION") return "TENANT_MISMATCH";
  if (scenario === "REPLAY_MISMATCH") return "REPLAY_MISSING";
  if (scenario === "LINEAGE_CORRUPTION") return "LINEAGE_BROKEN";
  if (scenario === "EVIDENCE_INCOMPLETE") return "EVIDENCE_MISSING";
  if (scenario === "NOT_ADVISORY") return "NOT_ADVISORY";
  if (scenario === "HASH_MISMATCH") return "HASH_MISMATCH";
  if (scenario === "INVALID_RUNTIME_STATE") return "RUNTIME_INVALID";
  return "BASELINE";
}

function scenarioFailures(scenario: RuntimeAssuranceScenario): readonly RuntimeAssuranceFailureReason[] {
  const map: Partial<Record<RuntimeAssuranceScenario, RuntimeAssuranceFailureReason>> = {
    PROGRESS_DIVERGENCE: "PROGRESS_DIVERGENCE",
    SKIPPED_TASK: "SKIPPED_TASK",
    DUPLICATE_EXECUTION: "DUPLICATE_EXECUTION",
    STALLED_EXECUTION: "STALLED_EXECUTION",
    UNRESOLVED_DEPENDENCY: "UNRESOLVED_DEPENDENCY",
    INVALID_DEPENDENCY_ORDERING: "INVALID_DEPENDENCY_ORDERING",
    CIRCULAR_DEPENDENCY: "CIRCULAR_DEPENDENCY",
    CHECKPOINT_CORRUPTION: "CHECKPOINT_CORRUPTION",
    MISSING_CHECKPOINT: "MISSING_CHECKPOINT",
    REPLAY_MISMATCH: "REPLAY_MISMATCH",
    INVALID_RUNTIME_STATE: "INVALID_RUNTIME_STATE",
    UNAUTHORIZED_STATE_MUTATION: "UNAUTHORIZED_STATE_MUTATION",
    POLICY_VIOLATION: "POLICY_VIOLATION",
    AUTHORITY_VIOLATION: "AUTHORITY_VIOLATION",
    CONSTITUTIONAL_VIOLATION: "CONSTITUTIONAL_VIOLATION",
    GOVERNANCE_BYPASS: "GOVERNANCE_BYPASS",
    HIDDEN_EXECUTION: "HIDDEN_EXECUTION",
    LINEAGE_CORRUPTION: "LINEAGE_CORRUPTION",
    TENANT_VIOLATION: "TENANT_ISOLATION_VIOLATION",
    EVIDENCE_INCOMPLETE: "EVIDENCE_INCOMPLETE",
    NONDETERMINISTIC_EVALUATION: "NONDETERMINISTIC_EVALUATION",
    NOT_ADVISORY: "ASSURANCE_NOT_ADVISORY",
    HASH_MISMATCH: "INTEGRITY_HASH_MISMATCH",
  };
  return map[scenario] ? freezeArray([map[scenario]]) : freezeArray([]);
}

function scoreFor(domain: RuntimeVerificationResult["domain"], failures: readonly RuntimeAssuranceFailureReason[]): number {
  const domainFailures: Record<RuntimeVerificationResult["domain"], readonly RuntimeAssuranceFailureReason[]> = {
    PROGRESS: ["PROGRESS_DIVERGENCE", "SKIPPED_TASK", "DUPLICATE_EXECUTION", "STALLED_EXECUTION"],
    DEPENDENCY: ["UNRESOLVED_DEPENDENCY", "INVALID_DEPENDENCY_ORDERING", "CIRCULAR_DEPENDENCY"],
    CHECKPOINT: ["CHECKPOINT_CORRUPTION", "MISSING_CHECKPOINT"],
    STATE: ["INVALID_RUNTIME_STATE", "UNAUTHORIZED_STATE_MUTATION"],
    MONITORING: ["STALLED_EXECUTION", "ASSURANCE_NOT_ADVISORY"],
    CONSISTENCY: ["REPLAY_MISMATCH", "HIDDEN_EXECUTION", "LINEAGE_CORRUPTION", "NONDETERMINISTIC_EVALUATION"],
    GOVERNANCE: ["POLICY_VIOLATION", "AUTHORITY_VIOLATION", "CONSTITUTIONAL_VIOLATION", "GOVERNANCE_BYPASS", "TENANT_ISOLATION_VIOLATION"],
  };
  const count = failures.filter((failure) => domainFailures[domain].includes(failure)).length;
  return count === 0 ? 96 : Math.max(15, 70 - count * 20);
}

function verification(domain: RuntimeVerificationResult["domain"], failures: readonly RuntimeAssuranceFailureReason[], record: ExecutionAssuranceRecord): RuntimeVerificationResult {
  const score = scoreFor(domain, failures);
  const findings = freezeArray(failures.filter((failure) => {
    if (domain === "PROGRESS") return ["PROGRESS_DIVERGENCE", "SKIPPED_TASK", "DUPLICATE_EXECUTION", "STALLED_EXECUTION"].includes(failure);
    if (domain === "DEPENDENCY") return ["UNRESOLVED_DEPENDENCY", "INVALID_DEPENDENCY_ORDERING", "CIRCULAR_DEPENDENCY"].includes(failure);
    if (domain === "CHECKPOINT") return ["CHECKPOINT_CORRUPTION", "MISSING_CHECKPOINT"].includes(failure);
    if (domain === "STATE") return ["INVALID_RUNTIME_STATE", "UNAUTHORIZED_STATE_MUTATION"].includes(failure);
    if (domain === "MONITORING") return ["STALLED_EXECUTION", "ASSURANCE_NOT_ADVISORY"].includes(failure);
    if (domain === "CONSISTENCY") return ["REPLAY_MISMATCH", "HIDDEN_EXECUTION", "LINEAGE_CORRUPTION", "NONDETERMINISTIC_EVALUATION"].includes(failure);
    return ["POLICY_VIOLATION", "AUTHORITY_VIOLATION", "CONSTITUTIONAL_VIOLATION", "GOVERNANCE_BYPASS", "TENANT_ISOLATION_VIOLATION"].includes(failure);
  }));
  const source = {
    verification_id: id("RAV", "runtime-assurance-verification-id", { domain, record: record.assurance_id }),
    domain,
    passed: findings.length === 0,
    score,
    findings,
    evidence_reference: `${record.evidence_reference}:${domain.toLowerCase()}`,
  };
  return Object.freeze({ ...source, verification_hash: hashValue("runtime-assurance-verification", source) });
}

function healthLevel(score: number): RuntimeHealthLevel {
  if (score >= 95) return "EXCELLENT";
  if (score >= 88) return "HEALTHY";
  if (score >= 78) return "STABLE";
  if (score >= 65) return "WATCH";
  if (score >= 45) return "DEGRADED";
  if (score >= 25) return "HIGH_RISK";
  return "CRITICAL";
}

function actionFor(level: RuntimeHealthLevel, failures: readonly RuntimeAssuranceFailureReason[]): RuntimeRecommendedAction {
  if (failures.includes("ASSURANCE_NOT_ADVISORY") || failures.includes("INTEGRITY_HASH_MISMATCH")) return "FAIL_CLOSED";
  if (failures.some((failure) => ["POLICY_VIOLATION", "AUTHORITY_VIOLATION", "CONSTITUTIONAL_VIOLATION", "GOVERNANCE_BYPASS", "TENANT_ISOLATION_VIOLATION"].includes(failure))) return "RECOMMEND_ESCALATION";
  if (["CRITICAL", "HIGH_RISK"].includes(level)) return "RECOMMEND_TERMINATION";
  if (level === "DEGRADED") return "RECOMMEND_RECOVERY";
  if (failures.some((failure) => ["PROGRESS_DIVERGENCE", "SKIPPED_TASK", "DUPLICATE_EXECUTION", "STALLED_EXECUTION", "UNRESOLVED_DEPENDENCY", "INVALID_DEPENDENCY_ORDERING", "CIRCULAR_DEPENDENCY", "CHECKPOINT_CORRUPTION", "MISSING_CHECKPOINT", "INVALID_RUNTIME_STATE", "UNAUTHORIZED_STATE_MUTATION", "REPLAY_MISMATCH", "HIDDEN_EXECUTION", "LINEAGE_CORRUPTION", "NONDETERMINISTIC_EVALUATION"].includes(failure))) return "INTENSIFY_MONITORING";
  if (level === "WATCH") return "INTENSIFY_MONITORING";
  return "CONTINUE";
}

function buildHealthReport(packageId: string, verifications: readonly RuntimeVerificationResult[], failures: readonly RuntimeAssuranceFailureReason[]): RuntimeHealthReport {
  const score = (domain: RuntimeVerificationResult["domain"]) => verifications.find((item) => item.domain === domain)?.score ?? 0;
  const execution_score = score("PROGRESS");
  const dependency_score = score("DEPENDENCY");
  const checkpoint_score = score("CHECKPOINT");
  const state_score = score("STATE");
  const governance_score = score("GOVERNANCE");
  const replay_score = score("CONSISTENCY");
  const overall_score = Math.round((execution_score + dependency_score + checkpoint_score + state_score + governance_score + replay_score) / 6);
  const level = healthLevel(overall_score);
  const source = {
    health_report_id: id("RAH", "runtime-assurance-health-report-id", packageId),
    execution_score,
    dependency_score,
    checkpoint_score,
    state_score,
    governance_score,
    replay_score,
    overall_score,
    overall_runtime_health: level,
    recommended_action: actionFor(level, failures),
  };
  return Object.freeze({ ...source, report_hash: hashValue("runtime-assurance-health-report", source) });
}

function buildExecutionValidationReport(packageId: string, verifications: readonly RuntimeVerificationResult[], failures: readonly RuntimeAssuranceFailureReason[]): ExecutionValidationReport {
  const hasDomainFailure = (domain: RuntimeVerificationResult["domain"]) => verifications.find((item) => item.domain === domain)?.passed === false;
  const source = {
    validation_report_id: id("RAEV", "runtime-assurance-execution-validation-id", packageId),
    execution_status: failures.length ? "INVALID" as const : "VALID" as const,
    validation_outcome: failures.length ? "FAIL" as const : "PASS" as const,
    detected_anomalies: failures,
    dependency_verification: hasDomainFailure("DEPENDENCY") ? "FAIL" as const : "PASS" as const,
    state_verification: hasDomainFailure("STATE") ? "FAIL" as const : "PASS" as const,
    integrity_verification: failures.includes("INTEGRITY_HASH_MISMATCH") ? "FAIL" as const : "PASS" as const,
  };
  return Object.freeze({ ...source, report_hash: hashValue("runtime-assurance-execution-validation", source) });
}

function evidenceHashSource(evidence: Omit<RuntimeAssuranceEvidence, "integrity_hash"> | RuntimeAssuranceEvidence) {
  return {
    assurance_event_id: evidence.assurance_event_id,
    execution_id: evidence.execution_id,
    workflow_id: evidence.workflow_id,
    tenant_id: evidence.tenant_id,
    runtime_state: evidence.runtime_state,
    health_score: evidence.health_score,
    execution_score: evidence.execution_score,
    dependency_score: evidence.dependency_score,
    checkpoint_score: evidence.checkpoint_score,
    governance_score: evidence.governance_score,
    replay_score: evidence.replay_score,
    validation_results: evidence.validation_results,
    detected_issues: evidence.detected_issues,
    recommended_action: evidence.recommended_action,
    operator_required: evidence.operator_required,
    timestamp: evidence.timestamp,
    lineage_reference: evidence.lineage_reference,
    replay_reference: evidence.replay_reference,
    evidence_reference: evidence.evidence_reference,
  };
}

export function computeRuntimeAssuranceEvidenceHash(evidence: Omit<RuntimeAssuranceEvidence, "integrity_hash"> | RuntimeAssuranceEvidence): string {
  return hashValue("runtime-assurance-evidence", evidenceHashSource(evidence));
}

function buildEvidence(packageId: string, record: ExecutionAssuranceRecord, health: RuntimeHealthReport, verifications: readonly RuntimeVerificationResult[], failures: readonly RuntimeAssuranceFailureReason[], scenario: RuntimeAssuranceScenario): RuntimeAssuranceEvidence {
  const source = {
    assurance_event_id: id("RAE", "runtime-assurance-event-id", packageId),
    execution_id: record.execution_id,
    workflow_id: record.workflow_id,
    tenant_id: record.tenant_id,
    runtime_state: failures.length ? health.overall_runtime_health === "CRITICAL" ? "FAILED" as const : "WARNING" as const : "ACTIVE" as const,
    health_score: health.overall_score,
    execution_score: health.execution_score,
    dependency_score: health.dependency_score,
    checkpoint_score: health.checkpoint_score,
    governance_score: health.governance_score,
    replay_score: health.replay_score,
    validation_results: freezeArray(verifications.map((item) => item.verification_hash)),
    detected_issues: failures,
    recommended_action: health.recommended_action,
    operator_required: health.recommended_action !== "CONTINUE",
    timestamp: NOW,
    lineage_reference: scenario === "LINEAGE_CORRUPTION" ? "" : record.lineage_reference,
    replay_reference: scenario === "REPLAY_MISMATCH" ? "" : record.replay_reference,
    evidence_reference: scenario === "EVIDENCE_INCOMPLETE" ? "" : record.evidence_reference,
  };
  return Object.freeze({ ...source, integrity_hash: scenario === "HASH_MISMATCH" ? "tampered-runtime-evidence" : computeRuntimeAssuranceEvidenceHash(source) });
}

function collectFailures(record: ExecutionAssuranceRecord, scenario: RuntimeAssuranceScenario): readonly RuntimeAssuranceFailureReason[] {
  const validation = validateExecutionAssuranceRecord(record);
  const failures: RuntimeAssuranceFailureReason[] = [...scenarioFailures(scenario)];
  if (validation.failures.includes("RUNTIME_INPUT_INVALID")) failures.push("INVALID_RUNTIME_STATE");
  if (validation.failures.includes("REPLAY_METADATA_INCOMPLETE")) failures.push("REPLAY_MISMATCH");
  if (validation.failures.includes("LINEAGE_INCOMPLETE")) failures.push("LINEAGE_CORRUPTION");
  if (validation.failures.includes("TENANT_OWNERSHIP_INVALID")) failures.push("TENANT_ISOLATION_VIOLATION");
  if (validation.failures.includes("GOVERNANCE_INVALID")) failures.push("POLICY_VIOLATION");
  if (validation.failures.includes("AUTHORITY_INVALID")) failures.push("AUTHORITY_VIOLATION");
  if (validation.failures.includes("CONSTITUTIONAL_VIOLATION")) failures.push("CONSTITUTIONAL_VIOLATION");
  if (validation.failures.includes("EVIDENCE_INCOMPLETE")) failures.push("EVIDENCE_INCOMPLETE");
  if (validation.failures.includes("ASSURANCE_NOT_ADVISORY")) failures.push("ASSURANCE_NOT_ADVISORY");
  if (computeExecutionAssuranceIntegrityHash(record) !== record.integrity_hash || validation.failures.includes("INTEGRITY_HASH_MISMATCH")) failures.push("INTEGRITY_HASH_MISMATCH");
  return unique(failures);
}

function validatePackage(pkgBase: Omit<RuntimeAssurancePackage, "validation" | "replay" | "package_hash">): RuntimeAssuranceValidationResult {
  const failures: RuntimeAssuranceFailureReason[] = [];
  const issues = pkgBase.assurance_evidence.detected_issues;
  failures.push(...issues);
  if (pkgBase.verification_results.find((item) => item.domain === "PROGRESS")?.passed === false) failures.push("PROGRESS_DIVERGENCE");
  if (pkgBase.verification_results.find((item) => item.domain === "DEPENDENCY")?.passed === false) failures.push("UNRESOLVED_DEPENDENCY");
  if (pkgBase.verification_results.find((item) => item.domain === "CHECKPOINT")?.passed === false) failures.push("CHECKPOINT_CORRUPTION");
  if (pkgBase.verification_results.find((item) => item.domain === "STATE")?.passed === false) failures.push("INVALID_RUNTIME_STATE");
  if (pkgBase.verification_results.find((item) => item.domain === "CONSISTENCY")?.passed === false) failures.push("REPLAY_MISMATCH");
  if (pkgBase.verification_results.find((item) => item.domain === "GOVERNANCE")?.passed === false) failures.push("POLICY_VIOLATION");
  if (!pkgBase.assurance_evidence.lineage_reference) failures.push("LINEAGE_CORRUPTION");
  if (!pkgBase.assurance_evidence.replay_reference) failures.push("REPLAY_MISMATCH");
  if (!pkgBase.assurance_evidence.evidence_reference) failures.push("EVIDENCE_INCOMPLETE");
  if (!pkgBase.advisory_only || pkgBase.execution_modified || pkgBase.workflow_modified || pkgBase.governance_modified || pkgBase.authority_modified) failures.push("ASSURANCE_NOT_ADVISORY");
  if (computeRuntimeAssuranceEvidenceHash(pkgBase.assurance_evidence) !== pkgBase.assurance_evidence.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  const uniqueFailures = unique(failures);
  const has = (failure: RuntimeAssuranceFailureReason) => uniqueFailures.includes(failure);
  const validation_state = uniqueFailures.length ? "FAIL" as const : "PASS" as const;
  const source = { package_id: pkgBase.package_id, validation_state, failures: uniqueFailures };
  return Object.freeze({
    validation_id: id("RAVAL", "runtime-assurance-validation-id", source),
    runtime_package_id: pkgBase.package_id,
    validation_state,
    failures: uniqueFailures,
    progress_valid: !has("PROGRESS_DIVERGENCE") && !has("SKIPPED_TASK") && !has("DUPLICATE_EXECUTION") && !has("STALLED_EXECUTION"),
    dependencies_valid: !has("UNRESOLVED_DEPENDENCY") && !has("INVALID_DEPENDENCY_ORDERING") && !has("CIRCULAR_DEPENDENCY"),
    checkpoints_valid: !has("CHECKPOINT_CORRUPTION") && !has("MISSING_CHECKPOINT"),
    runtime_state_valid: !has("INVALID_RUNTIME_STATE") && !has("UNAUTHORIZED_STATE_MUTATION"),
    execution_monitoring_valid: !has("STALLED_EXECUTION"),
    consistency_valid: !has("REPLAY_MISMATCH") && !has("HIDDEN_EXECUTION") && !has("LINEAGE_CORRUPTION") && !has("NONDETERMINISTIC_EVALUATION"),
    governance_valid: !has("POLICY_VIOLATION") && !has("AUTHORITY_VIOLATION") && !has("CONSTITUTIONAL_VIOLATION") && !has("GOVERNANCE_BYPASS"),
    replay_ready: !has("REPLAY_MISMATCH") && !has("NONDETERMINISTIC_EVALUATION"),
    tenant_isolated: !has("TENANT_ISOLATION_VIOLATION"),
    advisory_only: !has("ASSURANCE_NOT_ADVISORY"),
    evidence_complete: !has("EVIDENCE_INCOMPLETE"),
    integrity_verified: !has("INTEGRITY_HASH_MISMATCH"),
    ready_for_governance_assurance: validation_state === "PASS",
    validation_hash: hashValue("runtime-assurance-validation", source),
  });
}

function replayPackage(pkgBase: Omit<RuntimeAssurancePackage, "replay" | "package_hash">): RuntimeAssuranceReplayResult {
  const source = {
    replay_id: id("RARP", "runtime-assurance-replay-id", pkgBase.package_id),
    runtime_package_id: pkgBase.package_id,
    reconstructed_pipeline: freezeArray(PIPELINE),
    reconstructed_health: pkgBase.health_report.overall_runtime_health,
    reconstructed_action: pkgBase.health_report.recommended_action,
    reconstructed_failures: pkgBase.validation.failures,
    evidence_hash: pkgBase.assurance_evidence.integrity_hash,
    validation_state: pkgBase.validation.validation_state,
    failure_reason: pkgBase.validation.failures[0] ?? null,
  };
  return Object.freeze({ ...source, replay_hash: hashValue("runtime-assurance-replay", source) });
}

function packageHashSource(pkg: Omit<RuntimeAssurancePackage, "package_hash">) {
  return {
    package_id: pkg.package_id,
    engine_version: pkg.engine_version,
    assurance_id: pkg.source_assurance_record.assurance_id,
    verification_hashes: pkg.verification_results.map((item) => item.verification_hash),
    health_hash: pkg.health_report.report_hash,
    validation_report_hash: pkg.execution_validation_report.report_hash,
    evidence_hash: pkg.assurance_evidence.integrity_hash,
    validation_hash: pkg.validation.validation_hash,
    replay_hash: pkg.replay.replay_hash,
    advisory_only: pkg.advisory_only,
  };
}

export function buildRuntimeAssurancePackage(input: { scenario?: RuntimeAssuranceScenario; assuranceRecord?: ExecutionAssuranceRecord } = {}): RuntimeAssurancePackage {
  const scenario = input.scenario ?? "BASELINE";
  const source_assurance_record = input.assuranceRecord ?? buildExecutionAssuranceRecord({ scenario: assuranceScenarioFor(scenario) });
  const failures = collectFailures(source_assurance_record, scenario);
  const verification_results = freezeArray((["PROGRESS", "DEPENDENCY", "CHECKPOINT", "STATE", "MONITORING", "CONSISTENCY", "GOVERNANCE"] as const).map((domain) => verification(domain, failures, source_assurance_record)));
  const package_id = id("RAP", "runtime-assurance-package-id", { assurance: source_assurance_record.assurance_id, scenario });
  const health_report = buildHealthReport(package_id, verification_results, failures);
  const execution_validation_report = buildExecutionValidationReport(package_id, verification_results, failures);
  const assurance_evidence = buildEvidence(package_id, source_assurance_record, health_report, verification_results, failures, scenario);
  const base = {
    package_id,
    engine_version: ENGINE_VERSION,
    source_assurance_record,
    pipeline_state: assurance_evidence.runtime_state,
    verification_results,
    health_report,
    execution_validation_report,
    assurance_evidence,
    advisory_only: true as const,
    execution_modified: false as const,
    workflow_modified: false as const,
    governance_modified: false as const,
    authority_modified: false as const,
  };
  const validation = validatePackage(base);
  const withValidation = { ...base, validation };
  const replay = replayPackage(withValidation);
  const full = { ...withValidation, replay };
  return Object.freeze({ ...full, package_hash: hashValue("runtime-assurance-package", packageHashSource(full)) });
}

export function buildRuntimeAssuranceDashboardSurface(pkg = buildRuntimeAssurancePackage()): RuntimeAssuranceDashboardSurface {
  return Object.freeze({
    package_id: pkg.package_id,
    execution_id: pkg.assurance_evidence.execution_id,
    workflow_id: pkg.assurance_evidence.workflow_id,
    runtime_state: pkg.pipeline_state,
    overall_runtime_health: pkg.health_report.overall_runtime_health,
    recommended_action: pkg.health_report.recommended_action,
    validation_state: pkg.validation.validation_state,
    detected_issues: pkg.validation.failures,
    operator_required: pkg.assurance_evidence.operator_required,
    replay_reference: pkg.assurance_evidence.replay_reference,
    lineage_reference: pkg.assurance_evidence.lineage_reference,
    integrity_status: pkg.validation.integrity_verified ? "VALID" : "INVALID",
  });
}

export function getRuntimeAssuranceFramework(): RuntimeAssuranceFramework {
  const pkg = buildRuntimeAssurancePackage();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray(["deterministic-evaluation", "advisory-only", "operator-supremacy", "governance-supremacy", "constitutional-enforcement", "replay-fidelity", "evidence-first", "fail-closed", "zero-hidden-state", "complete-observability"]),
      engine_version: ENGINE_VERSION,
      states: freezeArray(["INITIALIZING", "COLLECTING_RUNTIME_DATA", "VERIFYING_PROGRESS", "VALIDATING_DEPENDENCIES", "VERIFYING_CHECKPOINTS", "VALIDATING_RUNTIME_STATE", "MONITORING_EXECUTION", "ASSESSING_HEALTH", "GENERATING_EVIDENCE", "ACTIVE", "WARNING", "DEGRADED", "RECOVERY_RECOMMENDED", "ESCALATION_RECOMMENDED", "TERMINATION_RECOMMENDED", "COMPLETED", "FAILED"] as const),
      health_levels: freezeArray(["EXCELLENT", "HEALTHY", "STABLE", "WATCH", "DEGRADED", "HIGH_RISK", "CRITICAL"] as const),
    }),
    package: pkg,
    dashboard: buildRuntimeAssuranceDashboardSurface(pkg),
  });
}
