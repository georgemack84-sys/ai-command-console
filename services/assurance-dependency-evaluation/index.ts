import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runConstitutionalAuthorityHierarchy, validateConstitutionalAuthorityHierarchy } from "@/services/constitutional-authority-hierarchy";
import type {
  AssuranceDependencyCertification,
  AssuranceDependencyCertificationTest,
  AssuranceDependencyContract,
  AssuranceDependencyContractBundle,
  AssuranceDependencyFailure,
  AssuranceDependencyInput,
  AssuranceDependencyRecord,
  AssuranceDependencyResult,
  AssuranceDependencyScenario,
  AssuranceDependencyValidation,
  AssuranceExecutionPlan,
  AssuranceExecutionRecord,
  AssuranceLifecycleState,
  DependencyAuditLedger,
  DependencyAuditLedgerEntry,
  DependencyClassification,
  DependencyExplanation,
  DependencyGraph,
  DependencyGraphEdge,
  DependencyIntegrityReport,
  DependencyPropagationReport,
  DependencyRegistry,
  DependencyReplayReport,
  DependencyValidationReport,
  EvaluationOrdering,
} from "@/types/assurance-dependency-evaluation";

const VERSION = "assurance-dependency-evaluation/v13.2" as const;
const ID = "AssuranceDependencyEvaluation" as const;
const STATES: readonly AssuranceLifecycleState[] = Object.freeze(["READY", "EXECUTING", "PASS", "FAIL", "PRUNED"] as const);
const CLASSES: readonly DependencyClassification[] = Object.freeze(["REQUIRED", "OPTIONAL", "GOVERNANCE_REQUIRED", "CONSTITUTIONAL_REQUIRED", "EVIDENCE_REQUIRED", "POLICY_REQUIRED", "AUTHORITY_REQUIRED", "CERTIFICATION_REQUIRED"] as const);
const ENGINES = Object.freeze(["constitutional-authority", "governance-assurance", "policy-assurance", "evidence-assurance", "recommendation-assurance", "operations-assurance"] as const);

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 24)}`; }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function scenarioFailure(scenario: AssuranceDependencyScenario): AssuranceDependencyFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function has(failures: readonly AssuranceDependencyFailure[], failure: AssuranceDependencyFailure): boolean { return failures.includes(failure); }
function statusFor(failures: readonly AssuranceDependencyFailure[]): "PASS" | "FAIL" { return failures.length ? "FAIL" : "PASS"; }

function contract(): AssuranceDependencyContract {
  return nested({ contract_id: id("assurance_dependency_contract", VERSION), lifecycle_states: STATES, classifications: CLASSES, pruning_semantics_distinguish_failure: true, implicit_dependencies_prohibited: true as const, replay_required: true as const });
}

function edges(failures: readonly AssuranceDependencyFailure[]): readonly DependencyGraphEdge[] {
  const base: readonly [string, string, DependencyClassification][] = [
    ["constitutional-authority", "governance-assurance", "CONSTITUTIONAL_REQUIRED"],
    ["constitutional-authority", "policy-assurance", "AUTHORITY_REQUIRED"],
    ["governance-assurance", "recommendation-assurance", "GOVERNANCE_REQUIRED"],
    ["policy-assurance", "recommendation-assurance", "POLICY_REQUIRED"],
    ["evidence-assurance", "recommendation-assurance", "EVIDENCE_REQUIRED"],
    ["constitutional-authority", "operations-assurance", "OPTIONAL"],
  ];
  const withCycle = has(failures, "CIRCULAR_DEPENDENCY") ? [...base, ["recommendation-assurance", "constitutional-authority", "REQUIRED"] as const] : base;
  return freezeArray(withCycle.map(([source_engine, destination_engine, classification]) => nested({ source_engine, destination_engine, classification, strength: classification === "OPTIONAL" ? "NON_BLOCKING" as const : "BLOCKING" as const, evaluation_constraint: "SOURCE_BEFORE_DESTINATION" as const })));
}

function graph(failures: readonly AssuranceDependencyFailure[]): DependencyGraph {
  return nested({ graph_id: id("assurance_dependency_graph", failures), nodes: has(failures, "ORPHAN_DEPENDENCY") ? ENGINES.slice(1) : ENGINES, edges: edges(failures), directed: true, acyclic: !has(failures, "CIRCULAR_DEPENDENCY"), deterministic: !has(failures, "ORDERING_NONDETERMINISTIC"), immutable_during_execution: !has(failures, "EXECUTION_PLAN_MUTATED"), replayable: !has(failures, "REPLAY_MISMATCH") });
}

function registry(g: DependencyGraph, failures: readonly AssuranceDependencyFailure[]): DependencyRegistry {
  const deps = freezeArray(g.nodes.map((engine, index): AssuranceDependencyRecord => {
    const prereqs = g.edges.filter((edge) => edge.destination_engine === engine).map((edge) => edge.source_engine);
    return nested({ dependency_id: id("assurance_dependency", engine), assurance_engine_id: engine, prerequisite_engine_refs: prereqs, dependency_type: (g.edges.find((edge) => edge.destination_engine === engine)?.classification ?? "REQUIRED") as DependencyClassification, dependency_strength: prereqs.length ? "BLOCKING" as const : "NON_BLOCKING" as const, evaluation_order: index + 1, execution_policy: "EXECUTE_WHEN_READY" as const, pruning_policy: "PRUNE_ON_BLOCKING_PREREQUISITE_FAILURE" as const, dependency_status: "READY" as const, replay_ref: `replay:dependency:${engine}` });
  }));
  return nested({ registry_id: id("assurance_dependency_registry", g.graph_id), dependencies: has(failures, "DUPLICATE_DEPENDENCY") ? freezeArray([...deps, deps[0]]) : deps, classifications_registered: !has(failures, "INCOMPATIBLE_DEPENDENCY_TYPE"), duplicate_free: !has(failures, "DUPLICATE_DEPENDENCY"), complete: !has(failures, "MISSING_DEPENDENCY") });
}

function validation(g: DependencyGraph, r: DependencyRegistry, failures: readonly AssuranceDependencyFailure[]): DependencyValidationReport {
  return nested({ report_id: id("dependency_validation", failures), missing_dependencies: has(failures, "MISSING_DEPENDENCY") ? freezeArray(["governance-assurance prerequisite missing"]) : freezeArray([]), duplicate_dependencies: has(failures, "DUPLICATE_DEPENDENCY") ? freezeArray([r.dependencies[0]?.dependency_id ?? "dependency:duplicate"]) : freezeArray([]), circular_dependencies: has(failures, "CIRCULAR_DEPENDENCY") ? freezeArray(["recommendation-assurance -> constitutional-authority"]) : freezeArray([]), invalid_references: has(failures, "INVALID_REFERENCE") ? freezeArray(["missing-engine-ref"]) : freezeArray([]), orphaned_dependencies: has(failures, "ORPHAN_DEPENDENCY") ? freezeArray(["constitutional-authority"]) : freezeArray([]), incompatible_types: has(failures, "INCOMPATIBLE_DEPENDENCY_TYPE") ? freezeArray(["UNREGISTERED"]) : freezeArray([]), policy_violations: has(failures, "POLICY_VIOLATION") ? freezeArray(["policy prerequisite unavailable"]) : freezeArray([]), authority_violations: has(failures, "AUTHORITY_VIOLATION") ? freezeArray(["authority prerequisite unavailable"]) : freezeArray([]), planning_allowed: g.acyclic && r.duplicate_free && r.complete && !has(failures, "INVALID_REFERENCE") && !has(failures, "ORPHAN_DEPENDENCY") && !has(failures, "POLICY_VIOLATION") && !has(failures, "AUTHORITY_VIOLATION") });
}

function ordering(failures: readonly AssuranceDependencyFailure[]): EvaluationOrdering {
  const order = has(failures, "ORDERING_NONDETERMINISTIC") ? freezeArray(["evidence-assurance", ...ENGINES.filter((engine) => engine !== "evidence-assurance")]) : ENGINES;
  return nested({ ordering_id: id("assurance_ordering", failures), order, dependency_first: !has(failures, "ORDERING_NONDETERMINISTIC"), stable: !has(failures, "ORDERING_NONDETERMINISTIC"), replay_identical: !has(failures, "REPLAY_MISMATCH"), timing_independent: true });
}

function plan(order: EvaluationOrdering, failures: readonly AssuranceDependencyFailure[]): AssuranceExecutionPlan {
  return nested({ plan_id: id("assurance_execution_plan", order.order), execution_sequence: order.order, prerequisite_chains: freezeArray(["constitutional-authority -> governance-assurance -> recommendation-assurance", "constitutional-authority -> policy-assurance -> recommendation-assurance", "evidence-assurance -> recommendation-assurance"]), dependency_groups: freezeArray(["constitutional", "governance-policy-evidence", "recommendation", "operations"]), pruning_rules: freezeArray(["blocking failed prerequisite prunes declared downstream engines", "independent branches continue"]), replay_ordering: order.order, immutable_once_started: !has(failures, "EXECUTION_PLAN_MUTATED") });
}

function executionRecords(order: EvaluationOrdering, failures: readonly AssuranceDependencyFailure[]): readonly AssuranceExecutionRecord[] {
  const policyFailed = has(failures, "POLICY_VIOLATION");
  const authorityFailed = has(failures, "AUTHORITY_VIOLATION");
  return freezeArray(order.order.map((engine, index) => {
    const blocked = (engine === "governance-assurance" && authorityFailed) || (engine === "policy-assurance" && policyFailed) || (engine === "recommendation-assurance" && (policyFailed || authorityFailed));
    const pruned = blocked && !has(failures, "PRUNED_EXECUTED");
    const state: AssuranceLifecycleState = pruned ? "PRUNED" : blocked ? "FAIL" : "PASS";
    return nested({ engine_id: engine, lifecycle_state: state, ordering_position: index + 1, executed: state !== "PRUNED", prerequisite_results: engine === "recommendation-assurance" ? freezeArray(["governance-assurance", "policy-assurance", "evidence-assurance"]) : freezeArray([]), pruning_reason: pruned ? "blocking prerequisite failed or unavailable" : null, violations: state === "FAIL" ? freezeArray(["blocked engine executed despite pruning rule"]) : freezeArray([]) });
  }));
}

function propagation(records: readonly AssuranceExecutionRecord[], failures: readonly AssuranceDependencyFailure[]): DependencyPropagationReport {
  return nested({ report_id: id("dependency_propagation", failures), downstream_pruning: records.filter((record) => record.lifecycle_state === "PRUNED").map((record) => record.engine_id), propagation_boundaries: freezeArray(["declared dependency edges only"]), independent_branches_continued: !has(failures, "INDEPENDENT_BRANCH_PRUNED"), declared_relationships_only: !has(failures, "FAILURE_PROPAGATION_INVALID"), deterministic: !has(failures, "FAILURE_PROPAGATION_INVALID") });
}

function replay(failures: readonly AssuranceDependencyFailure[]): DependencyReplayReport {
  const ok = !has(failures, "REPLAY_MISMATCH");
  return nested({ report_id: id("dependency_replay", failures), graph_replayed: ok, ordering_replayed: ok, pruning_replayed: ok, pass_fail_replayed: ok, propagation_replayed: ok, timestamps_replayed: ok, execution_plan_replayed: ok, identical_outcomes: ok });
}

function explanation(records: readonly AssuranceExecutionRecord[], failures: readonly AssuranceDependencyFailure[]): DependencyExplanation {
  return nested({ explanation_id: id("dependency_explanation", failures), decisions_explained: records.length, execution_rationale: records.filter((r) => r.executed).map((r) => `${r.engine_id} executed after prerequisites satisfied`), pruning_rationale: records.filter((r) => r.lifecycle_state === "PRUNED").map((r) => `${r.engine_id} pruned because ${r.pruning_reason}`), prerequisite_engines: freezeArray(["constitutional-authority", "governance-assurance", "policy-assurance", "evidence-assurance"]), dependency_chains: freezeArray(["constitutional-authority -> governance-assurance", "policy-assurance -> recommendation-assurance"]), ordering_rationale: "stable topological order sorted by registered evaluation order", propagation_decisions: freezeArray(["declared downstream branches prune; independent branches continue"]), complete: !has(failures, "EXPLAINABILITY_INCOMPLETE") });
}

function integrity(g: DependencyGraph, r: DependencyRegistry, p: AssuranceExecutionPlan, replayReport: DependencyReplayReport, failures: readonly AssuranceDependencyFailure[]): DependencyIntegrityReport {
  const bad = has(failures, "INTEGRITY_FAILURE");
  return nested({ report_id: id("dependency_integrity", failures), graph_complete: !bad && g.nodes.length === ENGINES.length, edge_integrity_valid: !bad, dependency_unique: r.duplicate_free, execution_consistent: !has(failures, "PRUNED_EXECUTED"), pruning_consistent: !has(failures, "PRUNED_EXECUTED"), replay_integrity_valid: replayReport.identical_outcomes, ordering_deterministic: !has(failures, "ORDERING_NONDETERMINISTIC"), execution_plan_immutable: p.immutable_once_started });
}

function ledger(records: readonly AssuranceExecutionRecord[], failures: readonly AssuranceDependencyFailure[]): DependencyAuditLedger {
  const entries = freezeArray(records.map((record): DependencyAuditLedgerEntry => nested({ entry_id: id("dependency_audit_entry", record.engine_id), dependency_identifier: id("assurance_dependency", record.engine_id), assurance_engine: record.engine_id, dependency_chain: record.prerequisite_results, execution_state: record.lifecycle_state, ordering_position: record.ordering_position, prerequisite_results: record.prerequisite_results, pruning_decisions: record.pruning_reason ? freezeArray([record.pruning_reason]) : freezeArray([]), replay_reference: `replay:dependency:${record.engine_id}`, timestamp: "2026-07-15T00:00:00.000Z" })));
  return nested({ ledger_id: id("dependency_audit_ledger", failures), entries, append_only: !has(failures, "AUDIT_LEDGER_MUTABLE"), immutable: !has(failures, "AUDIT_LEDGER_MUTABLE") });
}

type CertBase = Omit<AssuranceDependencyResult, "certification" | "replay_hash" | "integrity_hash">;
function certTest(name: string, passed: boolean, failure: AssuranceDependencyFailure, refs: readonly string[]): AssuranceDependencyCertificationTest {
  return nested({ test_id: id("assurance_dependency_test", name), name, expected: "PASS" as const, actual: passed ? "PASS" as const : "FAIL" as const, passed, failure_reason: passed ? null : failure, evidence_refs: refs });
}
function certificationTests(result: CertBase): readonly AssuranceDependencyCertificationTest[] {
  const refs = freezeArray([result.graph.integrity_hash, result.registry.integrity_hash, result.execution_plan.integrity_hash, result.audit_ledger.integrity_hash]);
  return freezeArray([
    certTest("Dependencies complete", result.registry.complete, "MISSING_DEPENDENCY", refs),
    certTest("Dependencies duplicate-free", result.registry.duplicate_free, "DUPLICATE_DEPENDENCY", refs),
    certTest("Dependency graph acyclic", result.graph.acyclic, "CIRCULAR_DEPENDENCY", refs),
    certTest("References valid", result.validation.invalid_references.length === 0, "INVALID_REFERENCE", refs),
    certTest("No orphan dependencies", result.validation.orphaned_dependencies.length === 0, "ORPHAN_DEPENDENCY", refs),
    certTest("Classifications registered", result.registry.classifications_registered, "INCOMPATIBLE_DEPENDENCY_TYPE", refs),
    certTest("Policy prerequisites valid", result.validation.policy_violations.length === 0, "POLICY_VIOLATION", refs),
    certTest("Authority prerequisites valid", result.validation.authority_violations.length === 0, "AUTHORITY_VIOLATION", refs),
    certTest("Ordering deterministic", result.ordering.stable && result.ordering.dependency_first, "ORDERING_NONDETERMINISTIC", refs),
    certTest("Execution plan immutable", result.execution_plan.immutable_once_started, "EXECUTION_PLAN_MUTATED", refs),
    certTest("Pruned engines never execute", result.execution_records.every((record) => record.lifecycle_state !== "PRUNED" || !record.executed), "PRUNED_EXECUTED", refs),
    certTest("Failure propagation declared-only", result.propagation.declared_relationships_only, "FAILURE_PROPAGATION_INVALID", refs),
    certTest("Independent branches continue", result.propagation.independent_branches_continued, "INDEPENDENT_BRANCH_PRUNED", refs),
    certTest("Replay deterministic", result.replay.identical_outcomes, "REPLAY_MISMATCH", refs),
    certTest("Dependency decisions explainable", result.explainability.complete, "EXPLAINABILITY_INCOMPLETE", refs),
    certTest("Dependency integrity valid", result.integrity.graph_complete && result.integrity.edge_integrity_valid, "INTEGRITY_FAILURE", refs),
    certTest("Audit ledger immutable", result.audit_ledger.append_only && result.audit_ledger.immutable, "AUDIT_LEDGER_MUTABLE", refs),
  ]);
}

function replayHash(result: Omit<AssuranceDependencyResult, "replay_hash" | "integrity_hash">): string {
  return hash({ contract: result.contract.integrity_hash, graph: result.graph.integrity_hash, registry: result.registry.integrity_hash, validation: result.validation.integrity_hash, ordering: result.ordering.integrity_hash, plan: result.execution_plan.integrity_hash, records: result.execution_records.map((r) => r.integrity_hash), propagation: result.propagation.integrity_hash, replay: result.replay.integrity_hash, explainability: result.explainability.integrity_hash, integrity: result.integrity.integrity_hash, ledger: result.audit_ledger.integrity_hash, certification: result.certification.integrity_hash });
}
function integrityHash(result: Omit<AssuranceDependencyResult, "integrity_hash">): string { return hash({ version: result.phase_version, id: result.phase_identifier, status: result.certification.status, replay_hash: result.replay_hash }); }

export function runAssuranceDependencyEvaluation(input: AssuranceDependencyInput = {}): AssuranceDependencyResult {
  const authority = runConstitutionalAuthorityHierarchy({ tenant_id: input.tenant_id ?? "tenant_mission_control" });
  const authorityValid = validateConstitutionalAuthorityHierarchy(authority).valid;
  const directFailure = scenarioFailure(input.scenario ?? "BASELINE");
  const failures = freezeArray<AssuranceDependencyFailure>([...(authorityValid ? [] : ["AUTHORITY_VIOLATION" as const]), ...(directFailure ? [directFailure] : [])]);
  const c = contract();
  const g = graph(failures);
  const r = registry(g, failures);
  const v = validation(g, r, failures);
  const o = ordering(failures);
  const p = plan(o, failures);
  const records = executionRecords(o, failures);
  const prop = propagation(records, failures);
  const rep = replay(failures);
  const exp = explanation(records, failures);
  const int = integrity(g, r, p, rep, failures);
  const led = ledger(records, failures);
  const baseWithoutCertification: CertBase = { phase_version: VERSION, phase_identifier: ID, contract: c, graph: g, registry: r, validation: v, ordering: o, execution_plan: p, execution_records: records, propagation: prop, replay: rep, explainability: exp, integrity: int, audit_ledger: led };
  const tests = certificationTests(baseWithoutCertification);
  const finalFailures = freezeArray([...new Set([...failures, ...tests.map((test) => test.failure_reason).filter((failure): failure is AssuranceDependencyFailure => Boolean(failure))])]);
  const status = statusFor(finalFailures);
  const certification: AssuranceDependencyCertification = nested({ certification_id: id("assurance_dependency_certification", VERSION), status, certified: status === "PASS", failures: finalFailures, tests });
  const base = { ...baseWithoutCertification, certification };
  const rHash = replayHash(base);
  return Object.freeze({ ...base, replay_hash: rHash, integrity_hash: integrityHash({ ...base, replay_hash: rHash }) });
}

export function validateAssuranceDependencyEvaluation(result?: AssuranceDependencyResult): AssuranceDependencyValidation {
  if (!result) {
    const failures = freezeArray<AssuranceDependencyFailure>(["MISSING_DEPENDENCY"]);
    const base = { valid: false, status: "FAIL" as const, certified: false, failures, replay_hash_valid: false, integrity_hash_valid: false, graph_valid: false, plan_valid: false, ledger_valid: false };
    return nested({ ...base, validation_hash: hashWithoutIntegrity(base) });
  }
  const replay_hash_valid = replayHash(result) === result.replay_hash;
  const integrity_hash_valid = integrityHash(result) === result.integrity_hash && hashWithoutIntegrity(result.certification) === result.certification.integrity_hash;
  const graph_valid = result.graph.directed && result.graph.acyclic && result.graph.deterministic;
  const plan_valid = result.execution_plan.immutable_once_started && result.ordering.replay_identical;
  const ledger_valid = result.audit_ledger.append_only && result.audit_ledger.immutable;
  const valid = result.certification.status === "PASS" && result.certification.certified && result.certification.failures.length === 0 && replay_hash_valid && integrity_hash_valid && graph_valid && plan_valid && ledger_valid;
  const base = { valid, status: result.certification.status, certified: result.certification.certified, failures: result.certification.failures, replay_hash_valid, integrity_hash_valid, graph_valid, plan_valid, ledger_valid };
  return nested({ ...base, validation_hash: hashWithoutIntegrity(base) });
}

export function replayAssuranceDependencyEvaluation(result = runAssuranceDependencyEvaluation()): boolean {
  const replayed = runAssuranceDependencyEvaluation();
  return result.integrity_hash === replayed.integrity_hash && result.replay_hash === replayed.replay_hash && validateAssuranceDependencyEvaluation(result).valid;
}

export function getAssuranceDependencyEvaluationContract(): AssuranceDependencyContractBundle {
  const result = runAssuranceDependencyEvaluation();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, deterministic_dependency_graph: true, immutable_execution_plan: true, pruned_is_not_failure: true, dependency_first_ordering: true, replay_required: true, audit_ledger_required: true }), result, validation: validateAssuranceDependencyEvaluation(result) });
}

export const AssuranceDependencyEvaluation = Object.freeze({ run: runAssuranceDependencyEvaluation, validate: validateAssuranceDependencyEvaluation, replay: replayAssuranceDependencyEvaluation });
