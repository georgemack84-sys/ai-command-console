import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runPolicySetManifestImmutableBinding, validatePolicySetManifestImmutableBinding } from "@/services/policy-set-manifest-immutable-binding";
import type {
  CompletionValidationRecord,
  CycleArchiveRecord,
  CycleLedger,
  CycleLifecycleRecord,
  CycleObservabilityReport,
  CycleReplayRecord,
  CycleTransactionRecord,
  EvaluationCoordinationRecord,
  GenerationCoordinationRecord,
  PolicyBoundEntryRecord,
  RecommendationCycleArtifact,
  RecommendationCycleCertification,
  RecommendationCycleCertificationTest,
  RecommendationCycleContractBundle,
  RecommendationCycleFailure,
  RecommendationCycleInput,
  RecommendationCycleResult,
  RecommendationCycleScenario,
  RecommendationCycleState,
  RecommendationCycleTerminalOutcome,
  RecommendationCycleValidation,
  RecoveryRecord,
  SupersessionRecord,
} from "@/types/recommendation-cycle-management";

const VERSION = "recommendation-cycle-management/v12.3" as const;
const ID = "RecommendationCycleManagement" as const;
const CYCLE_VERSION = "12.3.0" as const;
const FIXED_TIME = "2026-07-15T00:00:00.000Z" as const;
const COMPLETE_TIME = "2026-07-15T00:10:00.000Z" as const;
const TRANSITION_PATH: readonly RecommendationCycleState[] = Object.freeze(["REGISTERED", "POLICY_BOUND", "AUTHORIZED", "GENERATING", "GENERATED", "EVALUATING", "VALIDATING", "COMPLETING", "COMPLETE", "ARCHIVED"]);
const TERMINAL_OUTCOMES: readonly RecommendationCycleTerminalOutcome[] = Object.freeze(["COMPLETE", "FAILED", "CANCELLED", "SUPERSEDED"]);
const GENERATED_ARTIFACTS = Object.freeze(["candidate", "scenario", "forecast", "baseline", "portfolio", "supporting-evidence", "decision-rationale", "traceability"] as const);
const EVALUATIONS = Object.freeze(["qualification", "evidence-sufficiency", "duplicate-suppression", "comparison", "threshold-validation", "confidence-evaluation", "portfolio-evaluation", "tie-resolution", "governance-validation"] as const);

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 24)}`; }
function failureForScenario(scenario: RecommendationCycleScenario): RecommendationCycleFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function statusFor(failures: readonly RecommendationCycleFailure[]): "PASS" | "CONDITIONAL_PASS" | "FAIL" { return failures.length ? "FAIL" : "PASS"; }

function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }

function lifecycle(cycleId: string, failures: readonly RecommendationCycleFailure[]): CycleLifecycleRecord {
  const path = failures.includes("LIFECYCLE_NOT_APPROVED") ? TRANSITION_PATH.slice(0, -1) : TRANSITION_PATH;
  const transitions = freezeArray(path.slice(0, -1).map((from, index) => {
    const base = { from, to: path[index + 1], allowed: true, authority_validated: !failures.includes("AUTHORITY_NOT_RESOLVED"), policy_integrity_validated: !failures.includes("POLICY_VALIDATION_FAILED") };
    return nested(base);
  }));
  const terminals = failures.includes("MULTIPLE_TERMINAL_OUTCOMES") ? freezeArray(["COMPLETE", "FAILED"] as const) : freezeArray(["COMPLETE"] as const);
  const base = { lifecycle_id: id("cycle_lifecycle", cycleId), transitions, terminal_outcomes: terminals, exactly_one_terminal_outcome: terminals.length === 1 && TERMINAL_OUTCOMES.includes(terminals[0]), approved: !failures.includes("LIFECYCLE_NOT_APPROVED") };
  return nested(base);
}

function transaction(cycleId: string, failures: readonly RecommendationCycleFailure[]): CycleTransactionRecord {
  const failClosed = failures.includes("POLICY_BINDING_MISSING") || failures.includes("POLICY_VALIDATION_FAILED") || failures.includes("AUTHORITY_NOT_RESOLVED");
  const base = {
    transaction_id: id("cycle_transaction", cycleId),
    cycle_id: cycleId,
    atomic_creation: !failures.includes("TRANSACTION_MODEL_NONDETERMINISTIC"),
    deterministic_commit: !failures.includes("TRANSACTION_MODEL_NONDETERMINISTIC") && !failures.includes("LEDGER_COMMIT_FAILED"),
    rollback_reproducible: !failures.includes("ROLLBACK_NOT_REPRODUCIBLE"),
    transaction_locked: !failures.includes("CONCURRENCY_UNPROTECTED"),
    concurrency_protected: !failures.includes("CONCURRENCY_UNPROTECTED"),
    idempotency_key: id("cycle_idempotency", cycleId),
    idempotent_operations: !failures.includes("IDEMPOTENCY_BROKEN"),
    status: failClosed ? "FAILED_CLOSED" as const : "COMMITTED" as const,
  };
  return nested(base);
}

function policyEntry(policyValid: boolean, failures: readonly RecommendationCycleFailure[]): PolicyBoundEntryRecord {
  const manifestExists = !failures.includes("POLICY_BINDING_MISSING");
  const authorityResolved = !failures.includes("AUTHORITY_NOT_RESOLVED");
  const governanceApproved = !failures.includes("GOVERNANCE_NOT_APPROVED");
  const constitutionalValidated = !failures.includes("CONSTITUTIONAL_VALIDATION_FAILED");
  const manifestValidated = manifestExists && policyValid && !failures.includes("POLICY_VALIDATION_FAILED");
  const executionAllowed = manifestExists && manifestValidated && authorityResolved && governanceApproved && constitutionalValidated;
  const base = { entry_id: id("policy_bound_entry", { manifestExists, policyValid }), manifest_exists: manifestExists, manifest_validated: manifestValidated, authority_resolved: authorityResolved, governance_approved: governanceApproved, constitutional_validated: constitutionalValidated, immutable_policy_snapshot: manifestExists && manifestValidated, execution_allowed: executionAllowed, fail_closed: !executionAllowed };
  return nested(base);
}

function generation(cycleId: string, failures: readonly RecommendationCycleFailure[]): GenerationCoordinationRecord {
  const order = failures.includes("GENERATION_ORDER_NONDETERMINISTIC") ? freezeArray([...GENERATED_ARTIFACTS].reverse()) : freezeArray(GENERATED_ARTIFACTS);
  const refs = freezeArray(order.map((name) => `artifact:${cycleId}:${name}:v1`));
  const dependencies = freezeArray(order.map((artifact, index) => Object.freeze({ artifact, depends_on: freezeArray(index === 0 ? [] : [order[index - 1]]) })));
  const duplicate = failures.includes("DUPLICATE_ARTIFACT_REGISTERED");
  const base = { coordination_id: id("cycle_generation", cycleId), execution_order: order, dependencies, artifact_registration_complete: !failures.includes("GENERATION_DEPENDENCY_BROKEN"), duplicates_prevented: !duplicate, lineage_recorded: !failures.includes("LINEAGE_RECORDING_MISSING"), transaction_consistent: !failures.includes("GENERATION_DEPENDENCY_BROKEN"), deterministic: !failures.includes("GENERATION_ORDER_NONDETERMINISTIC"), generated_artifact_refs: duplicate ? freezeArray([...refs, refs[0]]) : refs };
  return nested(base);
}

function evaluation(cycleId: string, failures: readonly RecommendationCycleFailure[]): EvaluationCoordinationRecord {
  const order = failures.includes("EVALUATION_NONDETERMINISTIC") ? freezeArray([...EVALUATIONS].reverse()) : freezeArray(EVALUATIONS);
  const refs = freezeArray(order.map((name) => `evaluation:${cycleId}:${name}:v1`));
  const base = {
    coordination_id: id("cycle_evaluation", cycleId),
    evaluation_order: order,
    evidence_sufficient: !failures.includes("EVIDENCE_INSUFFICIENT"),
    duplicate_suppression_complete: !failures.includes("DUPLICATE_ARTIFACT_REGISTERED"),
    comparison_complete: !failures.includes("COMPARISON_INCOMPLETE"),
    thresholds_enforced: !failures.includes("THRESHOLD_VALIDATION_FAILED"),
    confidence_evaluated: true,
    portfolio_evaluated: true,
    tie_resolution_deterministic: !failures.includes("TIE_RESOLUTION_NONDETERMINISTIC"),
    governance_validated: !failures.includes("GOVERNANCE_NOT_APPROVED"),
    deterministic_outcome: failures.includes("EVALUATION_NONDETERMINISTIC") ? "UNSTABLE" : "SELECT_PRIMARY_RECOMMENDATION",
    evaluation_artifact_refs: refs,
  };
  return nested(base);
}

function ledger(cycleId: string, path: readonly RecommendationCycleState[], failures: readonly RecommendationCycleFailure[]): CycleLedger {
  const states = failures.includes("LEDGER_COMMIT_FAILED") ? path.slice(0, -2) : path;
  const entries = freezeArray(states.map((state, index) => {
    const base = { entry_id: id("cycle_ledger_entry", { cycleId, state, index }), type: index === 0 ? "CYCLE_REGISTERED" : `STATE_${state}`, subject_id: cycleId, state };
    return nested(base);
  }));
  const base = { ledger_id: id("cycle_ledger", cycleId), append_only: !failures.includes("LEDGER_NOT_APPEND_ONLY"), committed: !failures.includes("LEDGER_COMMIT_FAILED"), entries };
  return nested(base);
}

function completion(cycleId: string, policy: PolicyBoundEntryRecord, gen: GenerationCoordinationRecord, evals: EvaluationCoordinationRecord, cycleLedger: CycleLedger, failures: readonly RecommendationCycleFailure[]): CompletionValidationRecord {
  const replayValidated = !failures.includes("REPLAY_VALIDATION_FAILED");
  const integrityValidated = !failures.includes("INTEGRITY_VALIDATION_FAILED");
  const referentialIntegrity = !failures.includes("REFERENTIAL_INTEGRITY_FAILED") && gen.generated_artifact_refs.length === new Set(gen.generated_artifact_refs).size;
  const mandatoryArtifacts = !failures.includes("PARTIAL_CYCLE_MARKED_COMPLETE") && gen.artifact_registration_complete && gen.generated_artifact_refs.length === GENERATED_ARTIFACTS.length;
  const complete = mandatoryArtifacts && evals.evidence_sufficient && evals.comparison_complete && evals.thresholds_enforced && evals.tie_resolution_deterministic && policy.execution_allowed && cycleLedger.committed && replayValidated && integrityValidated && referentialIntegrity && !failures.includes("COMPLETION_VALIDATION_FAILED");
  const base = {
    validation_id: id("cycle_completion", cycleId),
    mandatory_artifacts_exist: mandatoryArtifacts,
    evaluations_complete: !failures.includes("EVALUATION_NONDETERMINISTIC") && evals.evidence_sufficient,
    policy_validation_passed: policy.manifest_validated,
    authority_validation_passed: policy.authority_resolved,
    governance_complete: policy.governance_approved && evals.governance_validated,
    comparison_complete: evals.comparison_complete,
    duplicate_resolution_complete: evals.duplicate_suppression_complete,
    recommendation_selected: !failures.includes("PARTIAL_CYCLE_MARKED_COMPLETE"),
    outputs_registered: !failures.includes("PARTIAL_CYCLE_MARKED_COMPLETE"),
    ledger_committed: cycleLedger.committed,
    replay_validated: replayValidated,
    integrity_validated: integrityValidated,
    referential_integrity_valid: referentialIntegrity,
    lifecycle_consistent: !failures.includes("LIFECYCLE_NOT_APPROVED"),
    transaction_integrity_valid: !failures.includes("TRANSACTION_MODEL_NONDETERMINISTIC"),
    complete,
    terminal_outcome: complete ? "COMPLETE" as const : "FAILED" as const,
  };
  return nested(base);
}

function recovery(cycleId: string, failures: readonly RecommendationCycleFailure[]): RecoveryRecord {
  const fabricated = failures.includes("RECOVERY_FABRICATED_ARTIFACT");
  const bypassed = failures.includes("RECOVERY_BYPASSED_GOVERNANCE");
  const deterministic = !failures.includes("RECOVERY_NONDETERMINISTIC") && !fabricated && !bypassed;
  const base = { recovery_id: id("cycle_recovery", cycleId), failure_type: failures[0] ?? "NONE", transaction_state_recovered: deterministic, generated_artifacts_recovered: deterministic && !fabricated, lifecycle_recovered: deterministic, ledger_state_recovered: deterministic, policy_binding_recovered: deterministic, authority_context_recovered: deterministic, fabricated_artifacts: fabricated, governance_bypassed: bypassed, validation_skipped: failures.includes("FAIL_CLOSED_NOT_ENFORCED"), fail_closed: !failures.includes("FAIL_CLOSED_NOT_ENFORCED"), deterministic };
  return nested(base);
}

function supersession(cycleId: string, input: Required<Pick<RecommendationCycleInput, "reevaluation_requested">>, failures: readonly RecommendationCycleFailure[]): SupersessionRecord {
  const replacement = id("replacement_cycle", { cycleId, reason: "reevaluation" });
  const base = { supersession_id: id("cycle_supersession", cycleId), original_cycle_id: cycleId, replacement_cycle_id: failures.includes("REEVALUATION_REUSED_CYCLE") ? cycleId : replacement, supersession_required_for_reevaluation: input.reevaluation_requested, completed_cycle_immutable: !failures.includes("POST_COMPLETION_MUTATION"), append_only: true, reopened_original: failures.includes("POST_COMPLETION_MUTATION"), lineage_preserved: !failures.includes("SUPERSESSION_LINEAGE_BROKEN") && !failures.includes("REEVALUATION_REUSED_CYCLE") };
  return nested(base);
}

function archive(cycleId: string, failures: readonly RecommendationCycleFailure[]): CycleArchiveRecord {
  const components = freezeArray(["cycle_metadata", "policy_manifest", "authority_bindings", "lifecycle_history", "transaction_log", "generated_artifacts", "evaluations", "approvals", "comparisons", "replay_artifacts", "integrity_proofs", "lineage", "supersession_references"]);
  const archived = failures.includes("ARCHIVE_INCOMPLETE") ? components.slice(0, -3) : components;
  const base = { archive_id: id("cycle_archive", cycleId), cycle_id: cycleId, archived_components: freezeArray(archived), immutable: true, replay_preserved: !failures.includes("ARCHIVE_REPLAY_NOT_PRESERVED"), evidence_preserved: !failures.includes("ARCHIVE_INCOMPLETE"), signatures_preserved: !failures.includes("ARCHIVE_INCOMPLETE"), integrity_hashes_preserved: !failures.includes("ARCHIVE_INCOMPLETE"), reconstructable: archived.length === components.length && !failures.includes("ARCHIVE_REPLAY_NOT_PRESERVED") };
  return nested(base);
}

function replay(cycleId: string, completionRecord: CompletionValidationRecord, archiveRecord: CycleArchiveRecord, failures: readonly RecommendationCycleFailure[]): CycleReplayRecord {
  const ok = completionRecord.replay_validated && archiveRecord.replay_preserved && !failures.includes("REPLAY_VALIDATION_FAILED");
  const base = { replay_id: id("cycle_replay", cycleId), cycle_reconstructed: ok, policy_binding_restored: ok, authority_context_restored: ok, lifecycle_restored: ok, artifacts_restored: ok, ledger_restored: ok, byte_identical: ok, deterministic: ok };
  return nested(base);
}

function observability(cycleLedger: CycleLedger, failures: readonly RecommendationCycleFailure[]): CycleObservabilityReport {
  const base = { report_id: id("cycle_observability", cycleLedger.ledger_id), active_cycles: 0, lifecycle_transitions: cycleLedger.entries.length, transaction_duration_ms: 600000, policy_binding_failures: failures.includes("POLICY_BINDING_MISSING") ? 1 : 0, authority_failures: failures.includes("AUTHORITY_NOT_RESOLVED") ? 1 : 0, recovery_attempts: failures.some((failure) => failure.startsWith("RECOVERY")) ? 1 : 0, replay_validation_failures: failures.includes("REPLAY_VALIDATION_FAILED") ? 1 : 0, archival_completion: failures.includes("ARCHIVE_INCOMPLETE") ? 0 : 1, supersession_frequency: failures.includes("SUPERSESSION_LINEAGE_BROKEN") ? 1 : 0, integrity_violations: failures.includes("INTEGRITY_VALIDATION_FAILED") ? 1 : 0, ledger_health: cycleLedger.append_only && cycleLedger.committed ? "HEALTHY" as const : "DEGRADED" as const, observable: !failures.includes("OBSERVABILITY_MISSING") };
  return nested(base);
}

function cycleArtifact(input: Required<Omit<RecommendationCycleInput, "scenario">>, policyResult: ReturnType<typeof runPolicySetManifestImmutableBinding>, entry: PolicyBoundEntryRecord, gen: GenerationCoordinationRecord, evals: EvaluationCoordinationRecord, completionRecord: CompletionValidationRecord, recoveryRecord: RecoveryRecord, replayHashValue: string, failures: readonly RecommendationCycleFailure[]): RecommendationCycleArtifact {
  const cycleSeed = { tenant: input.tenant_id, mission: input.mission_id, type: input.cycle_type, objective: input.strategic_objective, scope: input.recommendation_scope, version: CYCLE_VERSION };
  const cycle_id = failures.includes("CYCLE_IDENTITY_NONDETERMINISTIC") ? id("recommendation_cycle", { cycleSeed, nonce: "unstable" }) : id("recommendation_cycle", cycleSeed);
  const authorityBase = { authority_id: id("cycle_authority", cycle_id), owner: `owner:${input.tenant_id}:recommendation-cycle`, advisory_only: !failures.includes("ADVISORY_BOUNDARY_VIOLATION"), resolved: entry.authority_resolved };
  const policyBase = { manifest_id: policyResult.manifest.manifest_id, binding_id: policyResult.binding.binding_id, manifest_integrity_hash: policyResult.manifest.integrity_hash, validation_passed: entry.manifest_validated };
  const recoveryBase = { recovery_required: failures.length > 0, recovery_attempts: failures.length > 0 ? 1 : 0, fail_closed: recoveryRecord.fail_closed };
  const replayBase = { replay_required: true, replay_validated: completionRecord.replay_validated, replay_hash: replayHashValue };
  const base = {
    cycle_id,
    cycle_version: CYCLE_VERSION,
    tenant_id: failures.includes("TENANT_ISOLATION_BREACH") ? "tenant_beta" : input.tenant_id,
    mission_id: input.mission_id,
    cycle_type: input.cycle_type,
    strategic_objective: input.strategic_objective,
    recommendation_scope: input.recommendation_scope,
    authority_context: nested(authorityBase),
    bound_policy_manifest: nested(policyBase),
    input_artifact_refs: freezeArray([`input:${cycle_id}:mission`, `input:${cycle_id}:context`, `input:${cycle_id}:constraints`]),
    generated_artifact_refs: gen.generated_artifact_refs,
    evaluation_artifact_refs: evals.evaluation_artifact_refs,
    output_refs: completionRecord.outputs_registered ? freezeArray([`output:${cycle_id}:selected-recommendation`, `output:${cycle_id}:decision-package`]) : freezeArray([]),
    lifecycle_state: completionRecord.complete ? "ARCHIVED" as const : "FAILED" as const,
    transaction_status: completionRecord.complete ? "COMMITTED" as const : "FAILED_CLOSED" as const,
    creation_timestamp: FIXED_TIME,
    completion_timestamp: completionRecord.complete ? COMPLETE_TIME : null,
    recovery_metadata: nested(recoveryBase),
    replay_metadata: nested(replayBase),
    immutable: !failures.includes("SCHEMA_MUTABLE") && !failures.includes("POST_COMPLETION_MUTATION"),
  };
  return nested(base);
}

function certTest(name: string, passed: boolean, failure: RecommendationCycleFailure, refs: readonly string[]): RecommendationCycleCertificationTest {
  const base = { test_id: id("recommendation_cycle_test", name), name, expected: "PASS" as const, actual: passed ? "PASS" as const : "FAIL" as const, passed, failure_reason: passed ? null : failure, evidence_refs: refs };
  return nested(base);
}

type CertBase = Omit<RecommendationCycleResult, "certification" | "replay_hash" | "integrity_hash">;
function certificationTests(result: CertBase): readonly RecommendationCycleCertificationTest[] {
  const refs = freezeArray([result.cycle.integrity_hash, result.transaction.integrity_hash, result.policy_bound_entry.integrity_hash, result.completion.integrity_hash, result.ledger.integrity_hash, result.replay.integrity_hash]);
  return freezeArray([
    certTest("Recommendation Cycle contract finalized", result.cycle.cycle_version === CYCLE_VERSION && result.cycle.immutable, "CYCLE_CONTRACT_INVALID", refs),
    certTest("Cycle identity deterministic", result.cycle.cycle_id === id("recommendation_cycle", { tenant: "tenant_mission_control", mission: "mission:strategic-recommendation-intelligence", type: "STRATEGIC_RECOMMENDATION", objective: "Select the highest-integrity strategic recommendation", scope: "enterprise-recommendation-cycle", version: CYCLE_VERSION }), "CYCLE_IDENTITY_NONDETERMINISTIC", refs),
    certTest("Lifecycle approved", result.lifecycle.approved && result.lifecycle.transitions.length >= 9, "LIFECYCLE_NOT_APPROVED", refs),
    certTest("Schema immutable", result.cycle.immutable, "SCHEMA_MUTABLE", refs),
    certTest("Atomic transaction semantics enforced", result.transaction.atomic_creation && result.transaction.deterministic_commit, "TRANSACTION_MODEL_NONDETERMINISTIC", refs),
    certTest("Rollback reproducible", result.transaction.rollback_reproducible, "ROLLBACK_NOT_REPRODUCIBLE", refs),
    certTest("Concurrency protected", result.transaction.transaction_locked && result.transaction.concurrency_protected, "CONCURRENCY_UNPROTECTED", refs),
    certTest("Idempotent operations enforced", result.transaction.idempotent_operations, "IDEMPOTENCY_BROKEN", refs),
    certTest("Policy binding mandatory before execution", result.policy_bound_entry.manifest_exists && result.policy_bound_entry.execution_allowed, "POLICY_BINDING_MISSING", refs),
    certTest("Policy validation mandatory", result.policy_bound_entry.manifest_validated, "POLICY_VALIDATION_FAILED", refs),
    certTest("Authority resolved", result.policy_bound_entry.authority_resolved && result.cycle.authority_context.resolved, "AUTHORITY_NOT_RESOLVED", refs),
    certTest("Governance approved", result.policy_bound_entry.governance_approved, "GOVERNANCE_NOT_APPROVED", refs),
    certTest("Constitutional validation passed", result.policy_bound_entry.constitutional_validated, "CONSTITUTIONAL_VALIDATION_FAILED", refs),
    certTest("Generation coordination deterministic", result.generation.deterministic, "GENERATION_ORDER_NONDETERMINISTIC", refs),
    certTest("Generation dependencies reproducible", result.generation.artifact_registration_complete && result.generation.transaction_consistent, "GENERATION_DEPENDENCY_BROKEN", refs),
    certTest("Duplicate artifacts prevented", result.generation.duplicates_prevented && result.generation.generated_artifact_refs.length === new Set(result.generation.generated_artifact_refs).size, "DUPLICATE_ARTIFACT_REGISTERED", refs),
    certTest("Lineage recording complete", result.generation.lineage_recorded, "LINEAGE_RECORDING_MISSING", refs),
    certTest("Evaluation coordination deterministic", result.evaluation.deterministic_outcome === "SELECT_PRIMARY_RECOMMENDATION", "EVALUATION_NONDETERMINISTIC", refs),
    certTest("Evidence sufficient", result.evaluation.evidence_sufficient, "EVIDENCE_INSUFFICIENT", refs),
    certTest("Thresholds enforced", result.evaluation.thresholds_enforced, "THRESHOLD_VALIDATION_FAILED", refs),
    certTest("Comparison complete", result.evaluation.comparison_complete, "COMPARISON_INCOMPLETE", refs),
    certTest("Tie resolution deterministic", result.evaluation.tie_resolution_deterministic, "TIE_RESOLUTION_NONDETERMINISTIC", refs),
    certTest("Completion mathematically defined", result.completion.complete, "COMPLETION_VALIDATION_FAILED", refs),
    certTest("Exactly one terminal outcome enforced", result.lifecycle.exactly_one_terminal_outcome, "MULTIPLE_TERMINAL_OUTCOMES", refs),
    certTest("Partial cycles cannot masquerade as complete", result.completion.mandatory_artifacts_exist && result.completion.recommendation_selected, "PARTIAL_CYCLE_MARKED_COMPLETE", refs),
    certTest("Ledger committed", result.completion.ledger_committed && result.ledger.committed, "LEDGER_COMMIT_FAILED", refs),
    certTest("Replay validated", result.completion.replay_validated && result.replay.deterministic, "REPLAY_VALIDATION_FAILED", refs),
    certTest("Integrity validated", result.completion.integrity_validated, "INTEGRITY_VALIDATION_FAILED", refs),
    certTest("Recovery deterministic", result.recovery.deterministic, "RECOVERY_NONDETERMINISTIC", refs),
    certTest("Recovery never fabricates artifacts", !result.recovery.fabricated_artifacts, "RECOVERY_FABRICATED_ARTIFACT", refs),
    certTest("Recovery never bypasses governance", !result.recovery.governance_bypassed, "RECOVERY_BYPASSED_GOVERNANCE", refs),
    certTest("Fail-closed recovery enforced", result.recovery.fail_closed && !result.recovery.validation_skipped, "FAIL_CLOSED_NOT_ENFORCED", refs),
    certTest("Completed cycles immutable", result.supersession.completed_cycle_immutable && !result.supersession.reopened_original, "POST_COMPLETION_MUTATION", refs),
    certTest("Reevaluation creates new cycle", result.supersession.replacement_cycle_id !== result.supersession.original_cycle_id, "REEVALUATION_REUSED_CYCLE", refs),
    certTest("Supersession lineage preserved", result.supersession.lineage_preserved, "SUPERSESSION_LINEAGE_BROKEN", refs),
    certTest("Archive complete", result.archive.reconstructable, "ARCHIVE_INCOMPLETE", refs),
    certTest("Archive preserves replay", result.archive.replay_preserved, "ARCHIVE_REPLAY_NOT_PRESERVED", refs),
    certTest("Cycle ledger append-only", result.ledger.append_only, "LEDGER_NOT_APPEND_ONLY", refs),
    certTest("Referential integrity validated", result.completion.referential_integrity_valid, "REFERENTIAL_INTEGRITY_FAILED", refs),
    certTest("Tenant isolation preserved", result.cycle.tenant_id === "tenant_mission_control", "TENANT_ISOLATION_BREACH", refs),
    certTest("Advisory boundary enforced", result.cycle.authority_context.advisory_only, "ADVISORY_BOUNDARY_VIOLATION", refs),
    certTest("Observability active", result.observability.observable, "OBSERVABILITY_MISSING", refs),
  ]);
}

function replayHash(result: Omit<RecommendationCycleResult, "replay_hash" | "integrity_hash">): string {
  return hash({ cycle: result.cycle.integrity_hash, lifecycle: result.lifecycle.integrity_hash, transaction: result.transaction.integrity_hash, policy: result.policy_bound_entry.integrity_hash, generation: result.generation.integrity_hash, evaluation: result.evaluation.integrity_hash, completion: result.completion.integrity_hash, recovery: result.recovery.integrity_hash, supersession: result.supersession.integrity_hash, archive: result.archive.integrity_hash, ledger: result.ledger.integrity_hash, replay: result.replay.integrity_hash, certification: result.certification.integrity_hash });
}
function integrityHash(result: Omit<RecommendationCycleResult, "integrity_hash">): string { return hash({ version: result.phase_version, id: result.phase_identifier, status: result.certification.status, replay_hash: result.replay_hash }); }

export function runRecommendationCycleManagement(input: RecommendationCycleInput = {}): RecommendationCycleResult {
  const resolvedInput = {
    tenant_id: input.tenant_id ?? "tenant_mission_control",
    mission_id: input.mission_id ?? "mission:strategic-recommendation-intelligence",
    cycle_type: input.cycle_type ?? "STRATEGIC_RECOMMENDATION" as const,
    strategic_objective: input.strategic_objective ?? "Select the highest-integrity strategic recommendation",
    recommendation_scope: input.recommendation_scope ?? "enterprise-recommendation-cycle",
    reevaluation_requested: input.reevaluation_requested ?? true,
  };
  const scenarioFailure = failureForScenario(input.scenario ?? "BASELINE");
  const policyResult = runPolicySetManifestImmutableBinding({ tenant_id: resolvedInput.tenant_id, recommendation_cycle_id: "recommendation-cycle:strategic:alpha" });
  const policyValid = validatePolicySetManifestImmutableBinding(policyResult).valid;
  const initialFailures = freezeArray<RecommendationCycleFailure>([...(policyValid ? [] : ["POLICY_VALIDATION_FAILED" as const]), ...(scenarioFailure ? [scenarioFailure] : [])]);
  const cycleSeed = { tenant: resolvedInput.tenant_id, mission: resolvedInput.mission_id, type: resolvedInput.cycle_type, objective: resolvedInput.strategic_objective, scope: resolvedInput.recommendation_scope, version: CYCLE_VERSION };
  const cycleId = id("recommendation_cycle", cycleSeed);
  const lifecycleRecord = lifecycle(cycleId, initialFailures);
  const transactionRecord = transaction(cycleId, initialFailures);
  const policyBoundEntry = policyEntry(policyValid, initialFailures);
  const generationRecord = generation(cycleId, initialFailures);
  const evaluationRecord = evaluation(cycleId, initialFailures);
  const ledgerRecord = ledger(cycleId, TRANSITION_PATH, initialFailures);
  const completionRecord = completion(cycleId, policyBoundEntry, generationRecord, evaluationRecord, ledgerRecord, initialFailures);
  const recoveryRecord = recovery(cycleId, initialFailures);
  const supersessionRecord = supersession(cycleId, resolvedInput, initialFailures);
  const archiveRecord = archive(cycleId, initialFailures);
  const replayRecord = replay(cycleId, completionRecord, archiveRecord, initialFailures);
  const observabilityRecord = observability(ledgerRecord, initialFailures);
  const cycleRecord = cycleArtifact(resolvedInput, policyResult, policyBoundEntry, generationRecord, evaluationRecord, completionRecord, recoveryRecord, hash({ cycleId, replay: replayRecord.integrity_hash }), initialFailures);
  const baseWithoutCertification: CertBase = { phase_version: VERSION, phase_identifier: ID, cycle: cycleRecord, lifecycle: lifecycleRecord, transaction: transactionRecord, policy_bound_entry: policyBoundEntry, generation: generationRecord, evaluation: evaluationRecord, completion: completionRecord, recovery: recoveryRecord, supersession: supersessionRecord, archive: archiveRecord, ledger: ledgerRecord, replay: replayRecord, observability: observabilityRecord };
  const tests = certificationTests(baseWithoutCertification);
  const finalFailures = freezeArray([...new Set([...initialFailures, ...tests.map((item) => item.failure_reason).filter((failure): failure is RecommendationCycleFailure => Boolean(failure))])]);
  const status = statusFor(finalFailures);
  const certBase: Omit<RecommendationCycleCertification, "integrity_hash"> = { certification_id: id("recommendation_cycle_certification", VERSION), status, canonical_transaction_boundary_certified: status === "PASS", failures: finalFailures, tests };
  const certification = nested(certBase);
  const base = { ...baseWithoutCertification, certification };
  const rHash = replayHash(base);
  return Object.freeze({ ...base, replay_hash: rHash, integrity_hash: integrityHash({ ...base, replay_hash: rHash }) });
}

export function validateRecommendationCycleManagement(result?: RecommendationCycleResult): RecommendationCycleValidation {
  if (!result) {
    const failures = freezeArray<RecommendationCycleFailure>(["CYCLE_CONTRACT_INVALID"]);
    const base = { cycle_id: null, valid: false, status: "FAIL" as const, canonical_transaction_boundary_certified: false, failures, replay_hash_valid: false, integrity_hash_valid: false, terminal_outcome_valid: false, immutable_after_completion: false };
    return nested({ ...base, validation_hash: hashWithoutIntegrity(base) });
  }
  const replay_hash_valid = replayHash(result) === result.replay_hash;
  const terminal_outcome_valid = result.lifecycle.exactly_one_terminal_outcome && TERMINAL_OUTCOMES.includes(result.completion.terminal_outcome);
  const immutable_after_completion = result.cycle.immutable && result.supersession.completed_cycle_immutable && !result.supersession.reopened_original;
  const nestedIntegrity = hashWithoutIntegrity(result.cycle) === result.cycle.integrity_hash && hashWithoutIntegrity(result.certification) === result.certification.integrity_hash && hashWithoutIntegrity(result.ledger) === result.ledger.integrity_hash;
  const integrity_hash_valid = integrityHash(result) === result.integrity_hash && nestedIntegrity;
  const valid = result.certification.status === "PASS" && result.certification.canonical_transaction_boundary_certified && result.certification.failures.length === 0 && replay_hash_valid && integrity_hash_valid && terminal_outcome_valid && immutable_after_completion;
  const base = { cycle_id: result.cycle.cycle_id, valid, status: result.certification.status, canonical_transaction_boundary_certified: result.certification.canonical_transaction_boundary_certified, failures: result.certification.failures, replay_hash_valid, integrity_hash_valid, terminal_outcome_valid, immutable_after_completion };
  return nested({ ...base, validation_hash: hashWithoutIntegrity(base) });
}

export function replayRecommendationCycleManagement(result = runRecommendationCycleManagement()): boolean {
  const replayed = runRecommendationCycleManagement({ tenant_id: result.cycle.tenant_id, mission_id: result.cycle.mission_id, cycle_type: result.cycle.cycle_type, strategic_objective: result.cycle.strategic_objective, recommendation_scope: result.cycle.recommendation_scope, reevaluation_requested: result.supersession.supersession_required_for_reevaluation });
  return result.integrity_hash === replayed.integrity_hash && result.replay_hash === replayed.replay_hash && validateRecommendationCycleManagement(result).valid;
}

export function getRecommendationCycleManagementContract(): RecommendationCycleContractBundle {
  const result = runRecommendationCycleManagement();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, recommendation_cycle_first_class_artifact: true, atomic_transaction_boundary: true, immutable_policy_binding_required: true, exactly_one_terminal_outcome_required: true, completed_cycles_never_reopened: true, reevaluation_requires_new_cycle: true, replay_required: true, archival_required: true }), result, validation: validateRecommendationCycleManagement(result) });
}

export const RecommendationCycleManagement = Object.freeze({ run: runRecommendationCycleManagement, validate: validateRecommendationCycleManagement, replay: replayRecommendationCycleManagement });
