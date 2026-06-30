import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { generateRecoveryPlans, validateRecoveryPlanningPackage } from "@/services/recovery-planning-engine";
import type { RecoveryPlanningPackage, RecoveryPlanningScenario } from "@/types/recovery-planning-engine";
import type {
  RecoveryValidationAssessment,
  RecoveryValidationCheckStatus,
  RecoveryValidationEngineContract,
  RecoveryValidationEvidenceRecord,
  RecoveryValidationFailure,
  RecoveryValidationInput,
  RecoveryValidationObject,
  RecoveryValidationObservabilitySurface,
  RecoveryValidationPackage,
  RecoveryValidationReplayResult,
  RecoveryValidationResultLevel,
  RecoveryValidationScenario,
} from "@/types/recovery-validation-engine";

const NOW = "2026-07-05T12:00:00.000Z";
const VERSION = "recovery-validation-engine/v8ALT.2.4" as const;
const REPLAY_VERSION = "recovery-validation-replay/v8ALT.2.4" as const;
const TENANT_ID = "tenant:autonomy:primary";
const decisionStates = Object.freeze(["INITIALIZING", "VALIDATING", "GOVERNANCE_REVIEW", "PASSED", "REJECTED", "READY_FOR_RECOMMENDATION"] as const);
const resultLevels = Object.freeze(["PASS", "CONDITIONAL_PASS", "REJECT"] as const);

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function unique<T extends string>(values: readonly T[]): readonly T[] {
  return freezeArray([...new Set(values)].sort());
}

function id(prefix: string, domain: string, value: unknown): string {
  return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`;
}

function toPlanningScenario(scenario: RecoveryValidationScenario): RecoveryPlanningScenario {
  const map: Partial<Record<RecoveryValidationScenario, RecoveryPlanningScenario>> = {
    BASELINE: "BASELINE",
    CONSTITUTIONAL_VIOLATION: "GOVERNANCE_VIOLATION",
    AUTHORITY_VIOLATION: "AUTHORITY_VIOLATION",
    POLICY_VIOLATION: "GOVERNANCE_MUTATION_ATTEMPT",
    TENANT_ISOLATION_FAILURE: "TENANT_ISOLATION_FAILURE",
    NONDETERMINISTIC_PLANNING: "BASELINE",
    REPLAY_MISMATCH: "REPLAY_MISMATCH",
    MISSING_OPERATOR_APPROVAL: "BASELINE",
    MISSING_GOVERNANCE_EVIDENCE: "BASELINE",
    INTEGRITY_FAILURE: "INTEGRITY_FAILURE",
    AUTOMATIC_RESTART_ATTEMPT: "RESTART_EXECUTION_ATTEMPT",
    AUTOMATIC_ROLLBACK_ATTEMPT: "ROLLBACK_EXECUTION_ATTEMPT",
    POLICY_MUTATION_ATTEMPT: "GOVERNANCE_MUTATION_ATTEMPT",
    CONSTITUTIONAL_MUTATION_ATTEMPT: "GOVERNANCE_MUTATION_ATTEMPT",
    GOVERNANCE_BYPASS: "GOVERNANCE_MUTATION_ATTEMPT",
    AUTHORITY_ESCALATION_ATTEMPT: "AUTHORITY_ESCALATION_ATTEMPT",
    HIDDEN_RECOVERY: "HIDDEN_ALTERNATIVES",
    AUTONOMOUS_EXECUTION_ATTEMPT: "AUTONOMOUS_EXECUTION_ATTEMPT",
  };
  return map[scenario] ?? scenario as RecoveryPlanningScenario;
}

function scenarioFailures(scenario: RecoveryValidationScenario): readonly RecoveryValidationFailure[] {
  const map: Partial<Record<RecoveryValidationScenario, RecoveryValidationFailure>> = {
    CONSTITUTIONAL_VIOLATION: "CONSTITUTIONAL_INVALID",
    AUTHORITY_VIOLATION: "AUTHORITY_INVALID",
    POLICY_VIOLATION: "POLICY_INVALID",
    TENANT_ISOLATION_FAILURE: "TENANT_ISOLATION_INVALID",
    NONDETERMINISTIC_PLANNING: "DETERMINISM_INVALID",
    REPLAY_MISMATCH: "REPLAY_INVALID",
    MISSING_OPERATOR_APPROVAL: "OPERATOR_APPROVAL_INVALID",
    MISSING_GOVERNANCE_EVIDENCE: "GOVERNANCE_EVIDENCE_MISSING",
    INTEGRITY_FAILURE: "INTEGRITY_INVALID",
    AUTONOMOUS_EXECUTION_ATTEMPT: "AUTONOMOUS_EXECUTION_DETECTED",
    AUTOMATIC_RESTART_ATTEMPT: "AUTOMATIC_RESTART_DETECTED",
    AUTOMATIC_ROLLBACK_ATTEMPT: "AUTOMATIC_ROLLBACK_DETECTED",
    POLICY_MUTATION_ATTEMPT: "POLICY_MUTATION_DETECTED",
    CONSTITUTIONAL_MUTATION_ATTEMPT: "CONSTITUTIONAL_MUTATION_DETECTED",
    GOVERNANCE_BYPASS: "GOVERNANCE_BYPASS_DETECTED",
    AUTHORITY_ESCALATION_ATTEMPT: "AUTHORITY_ESCALATION_DETECTED",
    HIDDEN_RECOVERY: "HIDDEN_RECOVERY_DETECTED",
  };
  return map[scenario] ? freezeArray([map[scenario]]) : freezeArray([]);
}

function statusFor(failures: readonly RecoveryValidationFailure[], failure: RecoveryValidationFailure): RecoveryValidationCheckStatus {
  return failures.includes(failure) ? "FAIL" : "PASS";
}

function evidence(validation_id: string, category: RecoveryValidationEvidenceRecord["category"], status: RecoveryValidationCheckStatus, reference: string): RecoveryValidationEvidenceRecord {
  const base = {
    evidence_id: id("RVE", "recovery-validation-evidence", { validation_id, category }),
    validation_id,
    category,
    status,
    reference,
    explanation: `${category.toLowerCase().replace(/_/g, " ")} validation ${status.toLowerCase()}.`,
    immutable: true as const,
  };
  return Object.freeze({ ...base, evidence_hash: hashValue("recovery-validation-evidence", base) });
}

export function computeRecoveryValidationHash(validation: Omit<RecoveryValidationObject, "validation_hash"> | RecoveryValidationObject): string {
  const { validation_hash: _hash, ...source } = validation as RecoveryValidationObject;
  return hashValue("recovery-validation-object", source);
}

export function computeRecoveryValidationPackageHash(pkg: Omit<RecoveryValidationPackage, "package_hash"> | RecoveryValidationPackage): string {
  const { package_hash: _hash, ...source } = pkg as RecoveryValidationPackage;
  return hashValue("recovery-validation-package", source);
}

export function runRecoveryValidation(input: RecoveryValidationInput = {}): RecoveryValidationPackage {
  const scenario = input.scenario ?? "BASELINE";
  const injectedFailures = scenarioFailures(scenario);
  const planning = input.planning_package ?? generateRecoveryPlans({ scenario: toPlanningScenario(scenario) });
  const planningAssessment = validateRecoveryPlanningPackage(planning);
  const plan = planning.selected_plan;
  const planningFailures: RecoveryValidationFailure[] = [
    ...(!planningAssessment.governance_valid ? ["GOVERNANCE_BYPASS_DETECTED" as const] : []),
    ...(!planningAssessment.constitutional_valid ? ["CONSTITUTIONAL_INVALID" as const] : []),
    ...(!planningAssessment.authority_valid ? ["AUTHORITY_INVALID" as const] : []),
    ...(!planningAssessment.replay_valid ? ["REPLAY_INVALID" as const] : []),
    ...(!planningAssessment.tenant_isolated ? ["TENANT_ISOLATION_INVALID" as const] : []),
    ...(!planningAssessment.integrity_valid ? ["INTEGRITY_INVALID" as const] : []),
    ...(!planningAssessment.operator_approval_required ? ["OPERATOR_APPROVAL_INVALID" as const] : []),
    ...(!planningAssessment.ranking_valid || scenario === "NONDETERMINISTIC_PLANNING" ? ["DETERMINISM_INVALID" as const] : []),
    ...(planning.recovery_executed ? ["AUTONOMOUS_EXECUTION_DETECTED" as const] : []),
    ...(planning.restart_performed ? ["AUTOMATIC_RESTART_DETECTED" as const] : []),
    ...(planning.rollback_performed ? ["AUTOMATIC_ROLLBACK_DETECTED" as const] : []),
    ...(planning.governance_modified ? ["POLICY_MUTATION_DETECTED" as const] : []),
    ...(planning.authority_escalated ? ["AUTHORITY_ESCALATION_DETECTED" as const] : []),
    ...(planning.alternatives_hidden ? ["HIDDEN_RECOVERY_DETECTED" as const] : []),
  ];
  const failures = unique([...injectedFailures, ...planningFailures]);
  const validation_id = id("RV", "recovery-validation-id", { scenario, planning: planning.package_hash, plan: plan.recovery_plan_id });
  const constitutional_status = statusFor(failures, "CONSTITUTIONAL_INVALID");
  const authority_status = failures.some((f) => ["AUTHORITY_INVALID", "AUTHORITY_ESCALATION_DETECTED"].includes(f)) ? "FAIL" as const : "PASS" as const;
  const policy_status = failures.some((f) => ["POLICY_INVALID", "POLICY_MUTATION_DETECTED", "GOVERNANCE_BYPASS_DETECTED"].includes(f)) ? "FAIL" as const : "PASS" as const;
  const tenant_status = statusFor(failures, "TENANT_ISOLATION_INVALID");
  const replay_status = statusFor(failures, "REPLAY_INVALID");
  const determinism_status = statusFor(failures, "DETERMINISM_INVALID");
  const operator_approval_status = statusFor(failures, "OPERATOR_APPROVAL_INVALID");
  const integrity_status = failures.some((f) => ["INTEGRITY_INVALID", "GOVERNANCE_EVIDENCE_MISSING"].includes(f)) ? "FAIL" as const : "PASS" as const;
  const governance_evidence = scenario === "MISSING_GOVERNANCE_EVIDENCE" ? freezeArray<RecoveryValidationEvidenceRecord>([]) : freezeArray([
    evidence(validation_id, "CONSTITUTION", constitutional_status, plan.governance_requirements[0] ?? "constitutional-reference"),
    evidence(validation_id, "AUTHORITY", authority_status, plan.authority_requirements[0] ?? "authority-reference"),
    evidence(validation_id, "POLICY", policy_status, "policy:recovery-validation"),
    evidence(validation_id, "TENANT", tenant_status, planning.tenant_id),
    evidence(validation_id, "DETERMINISM", determinism_status, planning.replay.planning_decisions),
    evidence(validation_id, "REPLAY", replay_status, planning.replay.replay_reference),
    evidence(validation_id, "OPERATOR_APPROVAL", operator_approval_status, "operator-approval-required"),
    evidence(validation_id, "INTEGRITY", integrity_status, planning.repository.integrity_hash),
  ]);
  const result: RecoveryValidationResultLevel = failures.length === 0 ? "PASS" : failures.every((f) => f === "GOVERNANCE_EVIDENCE_MISSING") ? "CONDITIONAL_PASS" : "REJECT";
  const replayChecksum = failures.includes("REPLAY_INVALID") ? "mismatch" : hashValue("recovery-validation-replay-checksum", { validation_id, failures, evidence: governance_evidence.map((item) => item.evidence_hash), result });
  const baseValidation = {
    validation_id,
    recovery_plan_id: plan.recovery_plan_id,
    recovery_id: planning.recovery_id,
    planning_id: planning.planning_id,
    mission_id: planning.mission_id,
    execution_id: planning.execution_id,
    tenant_id: planning.tenant_id,
    decision_state: result === "PASS" ? "READY_FOR_RECOMMENDATION" as const : "REJECTED" as const,
    constitutional_status,
    authority_status,
    policy_status,
    tenant_status,
    replay_status,
    determinism_status,
    operator_approval_status,
    integrity_status,
    validation_result: result,
    rejection_reasons: failures,
    governance_evidence,
    replay_reference: `replay:${validation_id}`,
    lineage_reference: `lineage:${validation_id}`,
    integrity_hash: failures.includes("INTEGRITY_INVALID") ? "" : hashValue("recovery-validation-integrity", { validation_id, planning: planning.package_hash, evidence: governance_evidence.map((item) => item.evidence_hash) }),
    timestamp: NOW,
    source_planning_package: planning,
    advisory_only: true as const,
    recovery_executed: scenario === "AUTONOMOUS_EXECUTION_ATTEMPT" || planning.recovery_executed,
    recovery_auto_approved: false,
    restart_performed: scenario === "AUTOMATIC_RESTART_ATTEMPT" || planning.restart_performed,
    rollback_performed: scenario === "AUTOMATIC_ROLLBACK_ATTEMPT" || planning.rollback_performed,
    policy_modified: scenario === "POLICY_MUTATION_ATTEMPT" || planning.governance_modified,
    constitutional_modified: scenario === "CONSTITUTIONAL_MUTATION_ATTEMPT",
    governance_bypassed: scenario === "GOVERNANCE_BYPASS",
    authority_escalated: scenario === "AUTHORITY_ESCALATION_ATTEMPT" || planning.authority_escalated,
    recovery_hidden: scenario === "HIDDEN_RECOVERY" || planning.alternatives_hidden,
    cross_tenant_exposed: scenario === "TENANT_ISOLATION_FAILURE" || !(planning.tenant_id === TENANT_ID || planning.tenant_id.startsWith("tenant:")),
  };
  const validation = Object.freeze({ ...baseValidation, validation_hash: computeRecoveryValidationHash(baseValidation as Omit<RecoveryValidationObject, "validation_hash">) });
  const replayBase = {
    replay_reference: validation.replay_reference,
    replay_version: REPLAY_VERSION,
    validation_inputs: hashValue("recovery-validation-inputs", { scenario, planning: planning.package_hash }),
    governance_evaluation: hashValue("recovery-validation-governance-evaluation", governance_evidence.map((item) => item.evidence_hash)),
    constitutional_validation: constitutional_status,
    authority_verification: authority_status,
    policy_verification: policy_status,
    replay_verification: replay_status,
    determinism_analysis: determinism_status,
    rejection_reasoning: hashValue("recovery-validation-rejection-reasoning", failures),
    validation_outcome: result,
    replay_checksum: replayChecksum,
  };
  const ledgerBase = {
    ledger_id: id("RVL", "recovery-validation-ledger", validation_id),
    validation_id,
    recovery_id: validation.recovery_id,
    recovery_plan_id: validation.recovery_plan_id,
    tenant_id: validation.tenant_id,
    result,
    evidence_ids: freezeArray(governance_evidence.map((item) => item.evidence_id)),
    replay_reference: validation.replay_reference,
    lineage_reference: validation.lineage_reference,
    append_only: true as const,
  };
  const basePackage = {
    package_id: id("RVP", "recovery-validation-package", validation_id),
    validation,
    replay: Object.freeze({ ...replayBase, replay_hash: hashValue("recovery-validation-replay", replayBase) }),
    ledger_entry: Object.freeze({ ...ledgerBase, ledger_hash: hashValue("recovery-validation-ledger", ledgerBase) }),
    ready_for_recommendation_engine: result === "PASS",
    recommendation_engine_authorized: result === "PASS",
    execution_authorized: false as const,
  };
  return Object.freeze({ ...basePackage, package_hash: computeRecoveryValidationPackageHash(basePackage as Omit<RecoveryValidationPackage, "package_hash">) });
}

export function assessRecoveryValidation(pkg?: RecoveryValidationPackage): RecoveryValidationAssessment {
  if (!pkg) {
    const failures = freezeArray<RecoveryValidationFailure>(["INTEGRITY_INVALID"]);
    const source = { validation_id: null, valid: false, constitutional_valid: false, authority_valid: false, policy_valid: false, tenant_valid: false, replay_valid: false, determinism_valid: false, operator_approval_valid: false, governance_evidence_complete: false, lineage_valid: false, integrity_valid: false, advisory_only: false, immutable_hash_valid: false, failures };
    return Object.freeze({ ...source, assessment_hash: hashValue("recovery-validation-assessment", source) });
  }
  const validation = pkg.validation;
  const constitutional_valid = validation.constitutional_status === "PASS" && !validation.constitutional_modified;
  const authority_valid = validation.authority_status === "PASS" && !validation.authority_escalated;
  const policy_valid = validation.policy_status === "PASS" && !validation.policy_modified && !validation.governance_bypassed;
  const tenant_valid = validation.tenant_status === "PASS" && !validation.cross_tenant_exposed;
  const replay_valid = validation.replay_status === "PASS" && pkg.replay.replay_checksum !== "mismatch";
  const determinism_valid = validation.determinism_status === "PASS";
  const operator_approval_valid = validation.operator_approval_status === "PASS" && !validation.recovery_auto_approved;
  const governance_evidence_complete = validation.governance_evidence.length >= 8;
  const lineage_valid = Boolean(validation.lineage_reference && pkg.ledger_entry.lineage_reference);
  const integrity_valid = validation.integrity_status === "PASS" && Boolean(validation.integrity_hash && pkg.ledger_entry.ledger_hash);
  const advisory_only = validation.advisory_only && !validation.recovery_executed && !validation.restart_performed && !validation.rollback_performed && !pkg.execution_authorized;
  const immutable_hash_valid = computeRecoveryValidationHash(validation) === validation.validation_hash && computeRecoveryValidationPackageHash(pkg) === pkg.package_hash;
  const failures = unique([
    ...(!constitutional_valid ? ["CONSTITUTIONAL_INVALID" as const] : []),
    ...(!authority_valid ? ["AUTHORITY_INVALID" as const] : []),
    ...(!policy_valid ? ["POLICY_INVALID" as const] : []),
    ...(!tenant_valid ? ["TENANT_ISOLATION_INVALID" as const] : []),
    ...(!replay_valid ? ["REPLAY_INVALID" as const] : []),
    ...(!determinism_valid ? ["DETERMINISM_INVALID" as const] : []),
    ...(!operator_approval_valid ? ["OPERATOR_APPROVAL_INVALID" as const] : []),
    ...(!governance_evidence_complete ? ["GOVERNANCE_EVIDENCE_MISSING" as const] : []),
    ...(!lineage_valid ? ["LINEAGE_INVALID" as const] : []),
    ...(!integrity_valid ? ["INTEGRITY_INVALID" as const] : []),
    ...(validation.recovery_executed ? ["AUTONOMOUS_EXECUTION_DETECTED" as const] : []),
    ...(validation.restart_performed ? ["AUTOMATIC_RESTART_DETECTED" as const] : []),
    ...(validation.rollback_performed ? ["AUTOMATIC_ROLLBACK_DETECTED" as const] : []),
    ...(validation.policy_modified ? ["POLICY_MUTATION_DETECTED" as const] : []),
    ...(validation.constitutional_modified ? ["CONSTITUTIONAL_MUTATION_DETECTED" as const] : []),
    ...(validation.governance_bypassed ? ["GOVERNANCE_BYPASS_DETECTED" as const] : []),
    ...(validation.authority_escalated ? ["AUTHORITY_ESCALATION_DETECTED" as const] : []),
    ...(validation.recovery_hidden ? ["HIDDEN_RECOVERY_DETECTED" as const] : []),
    ...(!immutable_hash_valid ? ["INTEGRITY_INVALID" as const] : []),
  ]);
  const valid = failures.length === 0 && validation.validation_result === "PASS" && pkg.ready_for_recommendation_engine && pkg.recommendation_engine_authorized;
  const source = { validation_id: validation.validation_id, valid, constitutional_valid, authority_valid, policy_valid, tenant_valid, replay_valid, determinism_valid, operator_approval_valid, governance_evidence_complete, lineage_valid, integrity_valid, advisory_only, immutable_hash_valid, failures };
  return Object.freeze({ ...source, assessment_hash: hashValue("recovery-validation-assessment", source) });
}

export function replayRecoveryValidation(pkg = runRecoveryValidation()): RecoveryValidationReplayResult {
  const reconstructed_hash = computeRecoveryValidationPackageHash(pkg);
  const deterministic = reconstructed_hash === pkg.package_hash && pkg.replay.replay_checksum !== "mismatch";
  const source = { replay_reference: pkg.replay.replay_reference, validation_id: pkg.validation.validation_id, deterministic, reconstructed_hash, original_hash: pkg.package_hash, replay_checksum: pkg.replay.replay_checksum };
  return Object.freeze({ ...source, replay_result_hash: hashValue("recovery-validation-replay-result", source) });
}

export function buildRecoveryValidationObservabilitySurface(pkg = runRecoveryValidation()): RecoveryValidationObservabilitySurface {
  const assessment = assessRecoveryValidation(pkg);
  return Object.freeze({
    validation_id: pkg.validation.validation_id,
    recovery_id: pkg.validation.recovery_id,
    recovery_plan_id: pkg.validation.recovery_plan_id,
    validation_result: pkg.validation.validation_result,
    decision_state: pkg.validation.decision_state,
    rejection_reasons: pkg.validation.rejection_reasons,
    evidence_count: pkg.validation.governance_evidence.length,
    replay_valid: assessment.replay_valid,
    tenant_id: pkg.validation.tenant_id,
    ready_for_recommendation_engine: pkg.ready_for_recommendation_engine,
    execution_authorized: false,
    package_hash: pkg.package_hash,
  });
}

export function getRecoveryValidationEngineContract(): RecoveryValidationEngineContract {
  const validation_package = runRecoveryValidation();
  return Object.freeze({
    doctrine: Object.freeze({
      engine_version: VERSION,
      principles: freezeArray(["governance-first-validation", "constitutional-supremacy", "operator-supremacy", "advisory-only", "deterministic-validation", "replay-reproducibility", "explainable-decisions", "immutable-evidence", "tenant-isolated", "fail-closed"]),
      decision_states: decisionStates,
      result_levels: resultLevels,
      advisory_only: true,
      execution_authorized: false,
    }),
    validation_package,
    assessment: assessRecoveryValidation(validation_package),
    replay_result: replayRecoveryValidation(validation_package),
    observability: buildRecoveryValidationObservabilitySurface(validation_package),
  });
}
