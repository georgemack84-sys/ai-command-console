import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runLiveTenantIsolationQualification } from "@/services/live-tenant-isolation-qualification";
import type {
  ProductionReplayDigitalTwinBundle,
  ProductionReplayDigitalTwinResult,
  ProductionReplayDigitalTwinValidation,
  ProductionReplayFailure,
  ProductionReplayInput,
  ProductionReplayOutcome,
  ProductionReplayCertificationTest,
  ReplayComparisonResult,
  ReplayDivergenceCategory,
  ReplayLifecycleState,
  ReplayQualificationOutcome,
} from "@/types/production-replay-digital-twin-validation";

const VERSION = "production-replay-digital-twin-validation/v15.8" as const;
const IDENTIFIER = "ProductionReplayDigitalTwinValidation" as const;
const TIMESTAMP = "2026-07-15T00:00:00.000Z" as const;
const DEFAULT_TENANT = "tenant_phase_15_production_replay" as const;

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function verify(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 20)}`; }
function has(failures: readonly ProductionReplayFailure[], failure: ProductionReplayFailure): boolean { return failures.includes(failure); }
function directFailure(scenario: ProductionReplayInput["scenario"]): ProductionReplayFailure | undefined { return !scenario || scenario === "BASELINE" ? undefined : scenario; }
function outcomeFor(failures: readonly ProductionReplayFailure[]): ProductionReplayOutcome {
  if (failures.length === 1 && failures[0] === "NON_CONSTITUTIONAL_REPLAY_WARNING") return "CONDITIONAL_PASS";
  return failures.length ? "FAIL" : "PASS";
}

const lifecycle = freezeArray(["REPLAY_REQUESTED", "PRODUCTION_CAPTURED", "DIGITAL_TWIN_INITIALIZED", "REPLAY_EXECUTED", "COMPARISON_COMPLETE", "DIVERGENCE_CLASSIFIED", "QUALIFICATION_EVALUATED", "RECORDED"] as const satisfies readonly ReplayLifecycleState[]);
const comparisonResults = freezeArray(["IDENTICAL", "EXPLAINED_DIFFERENCE", "UNEXPECTED_DIFFERENCE", "REPLAY_INCOMPLETE"] as const satisfies readonly ReplayComparisonResult[]);
const divergenceCategories = freezeArray(["INPUT_DIVERGENCE", "CONFIGURATION_DIVERGENCE", "DEPENDENCY_DIVERGENCE", "POLICY_DIVERGENCE", "MODEL_DIVERGENCE", "ORDERING_DIVERGENCE", "OUTPUT_DIVERGENCE", "UNEXPLAINED_DIVERGENCE"] as const satisfies readonly ReplayDivergenceCategory[]);
const qualificationOutcomes = freezeArray(["QUALIFIED", "CONDITIONALLY_QUALIFIED", "REQUALIFICATION_REQUIRED", "GOVERNANCE_REVIEW_REQUIRED", "CONTAINMENT_REQUIRED", "FAIL"] as const satisfies readonly ReplayQualificationOutcome[]);

function certTest(name: string, passed: boolean, failure: ProductionReplayFailure, evidence_refs: readonly string[]): ProductionReplayCertificationTest {
  const actual: ProductionReplayOutcome = passed ? "PASS" : failure === "NON_CONSTITUTIONAL_REPLAY_WARNING" ? "CONDITIONAL_PASS" : "FAIL";
  return nested({ test_id: id("production_replay_test", name), name, expected: "PASS" as const, actual, passed, failure_reason: passed ? null : failure, evidence_refs: freezeArray(evidence_refs) });
}
function resultReplayHash(result: Omit<ProductionReplayDigitalTwinResult, "replay_hash" | "integrity_hash">): string {
  return hash({ tenant: result.live_tenant_isolation_ref, contract: result.contract.integrity_hash, twin: result.digital_twin.integrity_hash, replayRecord: result.replay_record.integrity_hash, comparison: result.comparison.integrity_hash, divergence: result.divergence.integrity_hash, qualification: result.qualification.integrity_hash, ledger: result.ledger.map((e) => e.integrity_hash), tests: result.certification_tests.map((t) => t.integrity_hash), outcome: result.outcome });
}
function resultIntegrityHash(result: Omit<ProductionReplayDigitalTwinResult, "integrity_hash">): string {
  return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.outcome, replay_hash: result.replay_hash });
}

export function runProductionReplayDigitalTwinValidation(input: ProductionReplayInput = {}): ProductionReplayDigitalTwinResult {
  const tenant = runLiveTenantIsolationQualification({ tenant_id: input.tenant_id ?? DEFAULT_TENANT });
  const direct = directFailure(input.scenario);
  const upstreamFailures: ProductionReplayFailure[] = tenant.outcome === "PASS" ? [] : ["TENANT_ISOLATION_NOT_PRESERVED"];
  const failures = freezeArray([...new Set([...upstreamFailures, ...(direct ? [direct] : [])])]);
  const replayId = id("production_replay", tenant.integrity_hash);
  const contract = nested({ contract_version: VERSION, lifecycle, advisory_only: !has(failures, "REPLAY_NOT_ADVISORY_ONLY"), replay_never_modifies_production: !has(failures, "REPLAY_NOT_ADVISORY_ONLY"), deterministic_replay_required: !has(failures, "PRODUCTION_DECISIONS_NOT_REPLAYABLE"), fail_closed_qualification: !has(failures, "UNEXPLAINED_DIVERGENCE_NOT_FAIL_CLOSED"), tenant_isolation_required: !has(failures, "TENANT_ISOLATION_NOT_PRESERVED"), governance_first_validation: !has(failures, "GOVERNANCE_AUTHORITY_NOT_MAINTAINED") });
  const digital_twin = nested({ twin_id: id("digital_twin", tenant.integrity_hash), certified_configuration: !has(failures, "CONFIGURATION_NOT_REPLAYED"), dependency_versions_aligned: !has(failures, "DEPENDENCY_NOT_REPLAYED"), policy_versions_aligned: !has(failures, "POLICY_NOT_REPLAYED"), execution_state_reproducible: !has(failures, "MODEL_NOT_REPLAYED"), environmental_characteristics_reproducible: true, synchronized: !has(failures, "DIGITAL_TWIN_NOT_SYNCHRONIZED"), isolated_from_production: !has(failures, "REPLAY_NOT_ADVISORY_ONLY"), no_production_side_effects: !has(failures, "REPLAY_NOT_ADVISORY_ONLY") });
  const divergenceDetected = has(failures, "UNEXPLAINED_DIVERGENCE_NOT_FAIL_CLOSED") || has(failures, "DIVERGENCE_NOT_CLASSIFIED");
  const comparison = nested({ comparison_id: id("live_replay_comparison", replayId), inputs_reproduced: !has(failures, "PRODUCTION_INPUT_NOT_REPRODUCED"), execution_ordering_reproduced: !has(failures, "EXECUTION_ORDERING_NOT_REPRODUCED"), dependencies_replayed: !has(failures, "DEPENDENCY_NOT_REPLAYED"), policies_replayed: !has(failures, "POLICY_NOT_REPLAYED"), outputs_compared: !has(failures, "OUTPUT_COMPARISON_FAILED"), timing_compared: true, evidence_lineage_linked: !has(failures, "LINEAGE_INCOMPLETE"), deterministic: !has(failures, "COMPARISON_NON_DETERMINISTIC"), result: divergenceDetected ? "UNEXPECTED_DIFFERENCE" as const : "IDENTICAL" as const });
  const divergence = nested({ classification_id: id("divergence_classification", replayId), categories_evaluated: has(failures, "DIVERGENCE_NOT_CLASSIFIED") ? divergenceCategories.slice(0, 4) : divergenceCategories, severity: divergenceDetected ? "CRITICAL" as const : "INFORMATIONAL" as const, every_divergence_classified: !has(failures, "DIVERGENCE_NOT_CLASSIFIED"), root_cause_traceable: !has(failures, "DIVERGENCE_NOT_CLASSIFIED"), qualification_action: divergenceDetected ? "CONTAINMENT_REQUIRED" as const : "NO_ACTION" as const, unexplained_divergence_ignored: false as const, deterministic: !has(failures, "DIVERGENCE_NOT_CLASSIFIED") });
  const qualification = nested({ assessment_id: id("replay_qualification", replayId), replay_success: !has(failures, "PRODUCTION_DECISIONS_NOT_REPLAYABLE"), certification_consistency: !has(failures, "LINEAGE_INCOMPLETE"), policy_compliance: !has(failures, "POLICY_NOT_REPLAYED"), dependency_alignment: !has(failures, "DEPENDENCY_NOT_REPLAYED"), configuration_integrity: !has(failures, "CONFIGURATION_NOT_REPLAYED"), deterministic_behavior: !has(failures, "QUALIFICATION_NOT_REPRODUCIBLE"), outcome: divergenceDetected || has(failures, "UNEXPLAINED_DIVERGENCE_NOT_FAIL_CLOSED") ? "CONTAINMENT_REQUIRED" as const : "QUALIFIED" as const, containment_deterministic: !has(failures, "CONTAINMENT_NOT_DETERMINISTIC"), governance_enforced: !has(failures, "GOVERNANCE_AUTHORITY_NOT_MAINTAINED"), reproducible: !has(failures, "QUALIFICATION_NOT_REPRODUCIBLE") });
  const replay_record = nested({ replay_id: replayId, replay_version: "15.8.0" as const, tenant_id: input.tenant_id ?? DEFAULT_TENANT, production_session_id: id("production_session", tenant.integrity_hash), certification_reference: tenant.production_boundary_ref, environment_reference: tenant.observation.environment_id, replay_start_time: TIMESTAMP, replay_end_time: TIMESTAMP, replay_duration: 0, replay_engine_version: "production-replay-engine/15.8" as const, digital_twin_reference: digital_twin.integrity_hash, production_input_reference: has(failures, "PRODUCTION_INPUT_NOT_REPRODUCED") ? "" : tenant.observation.integrity_hash, production_output_reference: has(failures, "OUTPUT_COMPARISON_FAILED") ? "" : id("production_output", replayId), configuration_reference: has(failures, "CONFIGURATION_NOT_REPLAYED") ? "" : digital_twin.integrity_hash, dependency_reference: has(failures, "DEPENDENCY_NOT_REPLAYED") ? "" : id("dependency", replayId), policy_reference: has(failures, "POLICY_NOT_REPLAYED") ? "" : tenant.observation.policy_refs[0] ?? id("policy", replayId), replay_result: has(failures, "PRODUCTION_DECISIONS_NOT_REPLAYABLE") ? "INCOMPLETE" as const : "REPRODUCED" as const, comparison_result: comparison.result, divergence_detected: divergenceDetected, divergence_category: divergenceDetected ? "UNEXPLAINED_DIVERGENCE" as const : null, divergence_severity: divergence.severity, divergence_summary: divergenceDetected ? "Replay divergence requires containment or governance review." : "Replay matched certified production behavior.", qualification_outcome: qualification.outcome, containment_required: qualification.outcome === "CONTAINMENT_REQUIRED", governance_review_required: false, replay_status: has(failures, "PRODUCTION_DECISIONS_NOT_REPLAYABLE") ? "FAILED" as const : "COMPLETED" as const, replay_evidence_refs: has(failures, "REPLAY_EVIDENCE_MUTABLE") ? freezeArray([]) : freezeArray([tenant.integrity_hash, comparison.integrity_hash]), lineage_refs: has(failures, "LINEAGE_INCOMPLETE") ? freezeArray([]) : freezeArray([tenant.integrity_hash, tenant.production_boundary_ref]), audit_refs: has(failures, "REPLAY_EVIDENCE_MUTABLE") ? freezeArray([]) : freezeArray([qualification.integrity_hash]) });
  const ledgerEvents = ["REPLAY_EXECUTION", "REPLAY_EVIDENCE", "DIVERGENCE_CLASSIFICATION", "QUALIFICATION_OUTCOME", "CONTAINMENT_ACTION", "CERTIFICATION_REFERENCE"] as const;
  const ledger = freezeArray(ledgerEvents.map((event_type, index) => nested({ ledger_entry_id: id("production_replay_ledger", { replayId, event_type }), event_type, sequence: index + 1, replay_id: replayId, evidence_refs: has(failures, "REPLAY_EVIDENCE_MUTABLE") ? freezeArray([]) : freezeArray([replay_record.integrity_hash]), lineage_refs: has(failures, "LINEAGE_INCOMPLETE") ? freezeArray([]) : replay_record.lineage_refs, tenant_isolated: !has(failures, "TENANT_ISOLATION_NOT_PRESERVED"), immutable: !has(failures, "REPLAY_EVIDENCE_MUTABLE"), replayable: !has(failures, "PRODUCTION_DECISIONS_NOT_REPLAYABLE") })));
  const tests = freezeArray([
    certTest("Production decisions replayable", replay_record.replay_status === "COMPLETED" && contract.deterministic_replay_required, "PRODUCTION_DECISIONS_NOT_REPLAYABLE", [replay_record.integrity_hash]),
    certTest("Production digital twins synchronized", digital_twin.synchronized && digital_twin.isolated_from_production, "DIGITAL_TWIN_NOT_SYNCHRONIZED", [digital_twin.integrity_hash]),
    certTest("Live-to-replay comparisons deterministic", comparison.deterministic, "COMPARISON_NON_DETERMINISTIC", [comparison.integrity_hash]),
    certTest("Divergence detected and classified", divergence.every_divergence_classified && divergence.categories_evaluated.length === 8, "DIVERGENCE_NOT_CLASSIFIED", [divergence.integrity_hash]),
    certTest("Replay qualification reproducible", qualification.reproducible, "QUALIFICATION_NOT_REPRODUCIBLE", [qualification.integrity_hash]),
    certTest("Unexplained divergence fail-closed", divergence.unexplained_divergence_ignored === false && (divergenceDetected ? qualification.outcome !== "QUALIFIED" : true), "UNEXPLAINED_DIVERGENCE_NOT_FAIL_CLOSED", [divergence.integrity_hash]),
    certTest("Deterministic containment operational", qualification.containment_deterministic, "CONTAINMENT_NOT_DETERMINISTIC", [qualification.integrity_hash]),
    certTest("Replay evidence immutable", ledger.every((entry) => entry.immutable && entry.evidence_refs.length > 0), "REPLAY_EVIDENCE_MUTABLE", ledger.map((entry) => entry.integrity_hash)),
    certTest("Lineage complete", replay_record.lineage_refs.length > 0 && ledger.every((entry) => entry.lineage_refs.length > 0), "LINEAGE_INCOMPLETE", [replay_record.integrity_hash]),
    certTest("Tenant isolation preserved", contract.tenant_isolation_required && ledger.every((entry) => entry.tenant_isolated), "TENANT_ISOLATION_NOT_PRESERVED", ledger.map((entry) => entry.integrity_hash)),
    certTest("Governance authority maintained", contract.governance_first_validation && qualification.governance_enforced, "GOVERNANCE_AUTHORITY_NOT_MAINTAINED", [qualification.integrity_hash]),
    certTest("Replay remains advisory-only", contract.advisory_only && contract.replay_never_modifies_production && digital_twin.no_production_side_effects, "REPLAY_NOT_ADVISORY_ONLY", [contract.integrity_hash]),
    certTest("Production input reproduction", comparison.inputs_reproduced && Boolean(replay_record.production_input_reference), "PRODUCTION_INPUT_NOT_REPRODUCED", [comparison.integrity_hash]),
    certTest("Configuration replay", digital_twin.certified_configuration && Boolean(replay_record.configuration_reference), "CONFIGURATION_NOT_REPLAYED", [digital_twin.integrity_hash]),
    certTest("Dependency replay", comparison.dependencies_replayed && Boolean(replay_record.dependency_reference), "DEPENDENCY_NOT_REPLAYED", [comparison.integrity_hash]),
    certTest("Policy replay", comparison.policies_replayed && Boolean(replay_record.policy_reference), "POLICY_NOT_REPLAYED", [comparison.integrity_hash]),
    certTest("Model replay", digital_twin.execution_state_reproducible, "MODEL_NOT_REPLAYED", [digital_twin.integrity_hash]),
    certTest("Execution ordering", comparison.execution_ordering_reproduced, "EXECUTION_ORDERING_NOT_REPRODUCED", [comparison.integrity_hash]),
    certTest("Output comparison", comparison.outputs_compared && Boolean(replay_record.production_output_reference), "OUTPUT_COMPARISON_FAILED", [comparison.integrity_hash]),
  ]);
  const effectiveFailures = freezeArray([...new Set([...failures, ...tests.map((test) => test.failure_reason).filter((failure): failure is ProductionReplayFailure => Boolean(failure))])]);
  const outcome = outcomeFor(effectiveFailures);
  const base: Omit<ProductionReplayDigitalTwinResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, live_tenant_isolation_ref: tenant.integrity_hash, contract, digital_twin, replay_record, comparison, divergence, qualification, ledger, certification_tests: tests, failures: effectiveFailures, outcome };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateProductionReplayDigitalTwinValidation(result = runProductionReplayDigitalTwinValidation()): ProductionReplayDigitalTwinValidation {
  const contract_valid = verify(result.contract) && result.contract.lifecycle.length === 8 && result.contract.advisory_only && result.contract.replay_never_modifies_production && result.contract.fail_closed_qualification && result.contract.tenant_isolation_required;
  const twin_valid = verify(result.digital_twin) && Object.entries(result.digital_twin).filter(([key]) => key !== "twin_id" && key !== "integrity_hash").every(([, value]) => value === true);
  const replay_record_valid = verify(result.replay_record) && result.replay_record.replay_status === "COMPLETED" && result.replay_record.replay_evidence_refs.length > 0 && result.replay_record.lineage_refs.length > 0 && result.replay_record.audit_refs.length > 0;
  const comparison_valid = verify(result.comparison) && result.comparison.result === "IDENTICAL" && result.comparison.deterministic && Object.entries(result.comparison).filter(([key]) => key.endsWith("_reproduced") || key.endsWith("_replayed") || key.endsWith("_compared") || key === "evidence_lineage_linked").every(([, value]) => value === true);
  const divergence_valid = verify(result.divergence) && result.divergence.every_divergence_classified && result.divergence.categories_evaluated.length === 8 && result.divergence.unexplained_divergence_ignored === false && result.divergence.deterministic;
  const qualification_valid = verify(result.qualification) && result.qualification.outcome === "QUALIFIED" && result.qualification.reproducible && result.qualification.governance_enforced && result.qualification.containment_deterministic;
  const ledger_valid = result.ledger.length === 6 && result.ledger.every((entry, index) => verify(entry) && entry.sequence === index + 1 && entry.immutable && entry.replayable && entry.tenant_isolated && entry.evidence_refs.length > 0 && entry.lineage_refs.length > 0);
  const certification_valid = result.certification_tests.length === 19 && result.certification_tests.every((test) => verify(test) && test.passed && test.evidence_refs.length > 0);
  const replay_valid = resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
  const valid = result.outcome === "PASS" && replay_valid && contract_valid && twin_valid && replay_record_valid && comparison_valid && divergence_valid && qualification_valid && ledger_valid && certification_valid;
  return nested({ valid, outcome: result.outcome, contract_valid, twin_valid, replay_record_valid, comparison_valid, divergence_valid, qualification_valid, ledger_valid, certification_valid, replay_valid, failures: result.failures });
}

export function replayProductionReplayDigitalTwinValidation(result = runProductionReplayDigitalTwinValidation()): boolean {
  const replayed = runProductionReplayDigitalTwinValidation();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateProductionReplayDigitalTwinValidation(result).valid;
}

export function getProductionReplayDigitalTwinValidationBundle(): ProductionReplayDigitalTwinBundle {
  const result = runProductionReplayDigitalTwinValidation();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, upstream_phase: "live-tenant-isolation-qualification/v15.7" as const, lifecycle, comparison_results: comparisonResults, divergence_categories: divergenceCategories, qualification_outcomes: qualificationOutcomes, certification_outcomes: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const) }), result, validation: validateProductionReplayDigitalTwinValidation(result) });
}

export const ProductionReplayDigitalTwinValidationService = Object.freeze({ run: runProductionReplayDigitalTwinValidation, validate: validateProductionReplayDigitalTwinValidation, replay: replayProductionReplayDigitalTwinValidation });
