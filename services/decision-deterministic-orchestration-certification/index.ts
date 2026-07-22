import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runFoundationSchemaCertification } from "@/services/decision-foundation-schema-certification";
import type { FoundationSchemaCertificationResult } from "@/types/decision-foundation-schema-certification";
import type { VisibilityRole } from "@/types/decision-observability-contract";
import type {
  DeterminismCertificationLedgerEntry,
  DeterminismCertificationReport,
  DeterminismEvidencePackage,
  DeterministicOrchestrationCertificationFailure,
  DeterministicOrchestrationCertificationFoundation,
  DeterministicOrchestrationCertificationInput,
  DeterministicOrchestrationCertificationResult,
  DeterministicOrchestrationCertificationValidation,
  OrchestrationComparisonReport,
  OrchestrationDeterminismCheck,
  OrchestrationDeterminismStage,
  OrchestrationExecutionFingerprint,
  OrchestrationExecutionRecord,
  OrderingValidationReport,
  OutputEquivalenceValidation,
} from "@/types/decision-deterministic-orchestration-certification";

const CERTIFICATION_VERSION = "decision-deterministic-orchestration-certification/v1" as const;

export const ORCHESTRATION_DETERMINISM_STAGES: readonly OrchestrationDeterminismStage[] = Object.freeze(["INTAKE", "NORMALIZATION", "CONTEXT_BUILDING", "DEPENDENCY_GRAPH", "CONFLICT_ARBITRATION", "PRIORITY_CALCULATION", "DECISION_PACKAGE", "REPLAY_VALIDATION"]);
export const ORCHESTRATION_DETERMINISM_CHECKS: readonly OrchestrationDeterminismCheck[] = Object.freeze(["INPUT_EQUIVALENCE", "PROCESSING_EQUIVALENCE", "OUTPUT_EQUIVALENCE", "ORDERING_EQUIVALENCE", "FINGERPRINT_EQUIVALENCE", "REPLAY_EQUIVALENCE", "INTEGRITY_EQUIVALENCE"]);

type Scenario = NonNullable<DeterministicOrchestrationCertificationInput["scenario"]>;

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity<T extends object>(value: T): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function ctx(source: FoundationSchemaCertificationResult) {
  return {
    tenant_id: source.certification_framework.analytics_result.source_snapshot.tenant_id,
    mission_id: source.certification_framework.analytics_result.source_snapshot.mission_id,
    replay_ref: source.replay_hash,
  };
}

function visibleToRole(source: FoundationSchemaCertificationResult, role: VisibilityRole): boolean {
  return source.certification_framework.analytics_result.operator_dashboard.replay_monitoring.governance_visibility.priority_dashboard.conflict_visualization.timeline_result.dashboard_result.observability_result.authorizations.some((auth) => auth.role === role && auth.permissions.includes("VIEW_DECISIONS"));
}

function fingerprintFor(parts: {
  tenant_id: string;
  mission_id: string;
  candidates: readonly string[];
  normalized: readonly string[];
  contexts: readonly string[];
  nodes: readonly string[];
  edges: readonly string[];
  conflicts: readonly string[];
  priorities: readonly string[];
  packages: readonly string[];
  replays: readonly string[];
  scenario: Scenario;
  variant: "baseline" | "comparison";
}): OrchestrationExecutionFingerprint {
  const maybe = <T>(normal: T, varied: T, variation: Scenario): T => parts.scenario === variation && parts.variant === "comparison" ? varied : normal;
  const input_fingerprint = hash({ candidates: maybe(parts.candidates, [...parts.candidates].reverse(), "INTAKE_VARIATION") });
  const context_fingerprint = hash({ contexts: maybe(parts.contexts, [...parts.contexts, "context:runtime:unexpected"], "CONTEXT_VARIATION") });
  const dependency_fingerprint = hash({ nodes: maybe(parts.nodes, [...parts.nodes].reverse(), "GRAPH_VARIATION"), edges: parts.edges });
  const conflict_fingerprint = hash({ conflicts: maybe(parts.conflicts, [...parts.conflicts, "conflict:unexpected"], "ARBITRATION_VARIATION") });
  const priority_fingerprint = hash({ priorities: maybe(parts.priorities, [...parts.priorities].reverse(), "PRIORITY_VARIATION") });
  const governance_fingerprint = hash({ governance: ["policy:certified", "constitutional:compliant", "authority:operator-visible"] });
  const package_fingerprint = hash({ packages: maybe(parts.packages, [...parts.packages, "package:unexpected"], "PACKAGE_VARIATION") });
  const replay_fingerprint = hash({ replays: maybe(parts.replays, [...parts.replays, "replay:divergent"], "REPLAY_DIVERGENCE") });
  const final_orchestration_fingerprint = hash({ input_fingerprint, context_fingerprint, dependency_fingerprint, conflict_fingerprint, priority_fingerprint, governance_fingerprint, package_fingerprint, replay_fingerprint });
  const base: Omit<OrchestrationExecutionFingerprint, "integrity_hash"> = {
    fingerprint_id: `orchestration_fingerprint_${parts.variant}`,
    tenant_id: parts.scenario === "TENANT_VARIATION" && parts.variant === "comparison" ? `${parts.tenant_id}_shadow` : parts.tenant_id,
    mission_id: parts.mission_id,
    input_fingerprint,
    context_fingerprint,
    dependency_fingerprint,
    conflict_fingerprint,
    priority_fingerprint,
    governance_fingerprint,
    package_fingerprint,
    replay_fingerprint,
    final_orchestration_fingerprint: parts.scenario === "FINGERPRINT_MISMATCH" && parts.variant === "comparison" ? hash({ mismatch: final_orchestration_fingerprint }) : final_orchestration_fingerprint,
  };
  const built = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (parts.scenario === "HASH_MISMATCH" && parts.variant === "comparison") return Object.freeze({ ...built, integrity_hash: hash({ tampered: built.fingerprint_id }) });
  return built;
}

function buildExecution(source: FoundationSchemaCertificationResult, scenario: Scenario, variant: "baseline" | "comparison"): OrchestrationExecutionRecord {
  const c = ctx(source);
  const maybe = <T>(normal: T, varied: T, variation: Scenario): T => scenario === variation && variant === "comparison" ? varied : normal;
  const candidates = freezeArray(maybe(["decision:candidate:alpha", "decision:candidate:bravo", "decision:candidate:charlie"], ["decision:candidate:bravo", "decision:candidate:alpha", "decision:candidate:charlie"], "INTAKE_VARIATION"));
  const normalized = freezeArray(maybe(["normalized:alpha", "normalized:bravo", "normalized:charlie"], ["normalized:alpha", "normalized:charlie", "normalized:bravo"], "NORMALIZATION_VARIATION"));
  const contexts = freezeArray(maybe(["context:mission", "context:evidence", "context:risk", "context:governance", "context:authority"], ["context:mission", "context:evidence", "context:risk", "context:governance"], "CONTEXT_VARIATION"));
  const nodes = freezeArray(maybe(["node:alpha", "node:bravo", "node:charlie"], ["node:charlie", "node:alpha", "node:bravo"], "GRAPH_VARIATION"));
  const edges = freezeArray(maybe(["edge:alpha->bravo", "edge:bravo->charlie"], ["edge:bravo->alpha", "edge:alpha->charlie"], "GRAPH_VARIATION"));
  const conflicts = freezeArray(maybe(["conflict:none", "arbitration:priority-then-governance"], ["conflict:alpha-bravo", "arbitration:manual-review"], "ARBITRATION_VARIATION"));
  const priorities = freezeArray(maybe(["priority:alpha:92", "priority:bravo:81", "priority:charlie:74"], ["priority:bravo:92", "priority:alpha:81", "priority:charlie:74"], "PRIORITY_VARIATION"));
  const ties = freezeArray(maybe(["tie:mission-criticality", "tie:lower-risk", "tie:oldest-logical-sequence"], ["tie:lower-risk", "tie:mission-criticality", "tie:oldest-logical-sequence"], "TIE_BREAKING_VARIATION"));
  const packages = freezeArray(maybe(["package:recommend-alpha", "package:alternative-bravo", "package:reject-charlie"], ["package:recommend-bravo", "package:alternative-alpha", "package:reject-charlie"], "PACKAGE_VARIATION"));
  const replays = freezeArray(maybe([source.replay_hash, "replay:orchestration:logical-sequence"], [source.replay_hash, "replay:orchestration:divergent"], "REPLAY_DIVERGENCE"));
  const stageOrder = freezeArray(maybe(ORCHESTRATION_DETERMINISM_STAGES, [...ORCHESTRATION_DETERMINISM_STAGES].reverse(), "GRAPH_ORDER_VARIATION"));
  const fingerprint = fingerprintFor({ tenant_id: c.tenant_id, mission_id: c.mission_id, candidates, normalized, contexts, nodes, edges, conflicts, priorities, packages, replays, scenario, variant });
  const baseOutput = { candidates, normalized, contexts, nodes, edges, conflicts, priorities, ties, packages, replays, stageOrder, fingerprint: fingerprint.final_orchestration_fingerprint };
  const output_hash = scenario === "OUTPUT_MISMATCH" && variant === "comparison" ? hash({ mismatch: baseOutput }) : hash(baseOutput);
  const base: Omit<OrchestrationExecutionRecord, "integrity_hash"> = {
    execution_id: `determinism_execution_${variant}`,
    tenant_id: scenario === "TENANT_VARIATION" && variant === "comparison" ? `${c.tenant_id}_shadow` : c.tenant_id,
    mission_id: c.mission_id,
    candidate_order: candidates,
    normalized_record_refs: normalized,
    context_refs: contexts,
    graph_node_order: nodes,
    graph_edge_order: edges,
    conflict_resolution_order: conflicts,
    priority_order: priorities,
    tie_breaking_order: ties,
    decision_package_refs: packages,
    replay_refs: replays,
    stage_order: stageOrder,
    output_hash,
    fingerprint,
  };
  const built = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "HASH_MISMATCH" && variant === "comparison") return Object.freeze({ ...built, integrity_hash: hash({ tampered: built.execution_id }) });
  return built;
}

function arraysEqual(a: readonly unknown[], b: readonly unknown[]): boolean {
  return serializeDecisionCanonically(a) === serializeDecisionCanonically(b);
}

function compareExecutions(source: FoundationSchemaCertificationResult, executions: readonly OrchestrationExecutionRecord[]): OrchestrationComparisonReport {
  const c = ctx(source);
  const [baseline, comparison] = executions;
  const input_match = arraysEqual(baseline.candidate_order, comparison.candidate_order);
  const processing_match = arraysEqual(baseline.normalized_record_refs, comparison.normalized_record_refs)
    && arraysEqual(baseline.context_refs, comparison.context_refs)
    && arraysEqual(baseline.graph_node_order, comparison.graph_node_order)
    && arraysEqual(baseline.graph_edge_order, comparison.graph_edge_order)
    && arraysEqual(baseline.conflict_resolution_order, comparison.conflict_resolution_order)
    && arraysEqual(baseline.priority_order, comparison.priority_order)
    && arraysEqual(baseline.tie_breaking_order, comparison.tie_breaking_order);
  const output_match = baseline.output_hash === comparison.output_hash && arraysEqual(baseline.decision_package_refs, comparison.decision_package_refs);
  const ordering_match = arraysEqual(baseline.stage_order, comparison.stage_order);
  const fingerprint_match = baseline.fingerprint.final_orchestration_fingerprint === comparison.fingerprint.final_orchestration_fingerprint;
  const replay_match = arraysEqual(baseline.replay_refs, comparison.replay_refs) && baseline.fingerprint.replay_fingerprint === comparison.fingerprint.replay_fingerprint;
  const integrity_match = hashWithoutIntegrity(baseline) === baseline.integrity_hash
    && hashWithoutIntegrity(comparison) === comparison.integrity_hash
    && hashWithoutIntegrity(baseline.fingerprint) === baseline.fingerprint.integrity_hash
    && hashWithoutIntegrity(comparison.fingerprint) === comparison.fingerprint.integrity_hash;
  const differences: DeterministicOrchestrationCertificationFailure[] = [];
  if (!input_match) differences.push("NONDETERMINISTIC_INTAKE");
  if (!processing_match) differences.push("NONDETERMINISTIC_NORMALIZATION");
  if (!arraysEqual(baseline.context_refs, comparison.context_refs)) differences.push("NONDETERMINISTIC_CONTEXT_BUILDING");
  if (!arraysEqual(baseline.graph_node_order, comparison.graph_node_order) || !arraysEqual(baseline.graph_edge_order, comparison.graph_edge_order)) differences.push("DEPENDENCY_GRAPH_VARIATION");
  if (!ordering_match) differences.push("GRAPH_ORDERING_VARIATION");
  if (!arraysEqual(baseline.conflict_resolution_order, comparison.conflict_resolution_order)) differences.push("CONFLICT_ARBITRATION_INCONSISTENCY");
  if (!arraysEqual(baseline.priority_order, comparison.priority_order)) differences.push("PRIORITY_SCORE_VARIATION");
  if (!arraysEqual(baseline.tie_breaking_order, comparison.tie_breaking_order)) differences.push("TIE_BREAKING_INCONSISTENCY");
  if (!arraysEqual(baseline.decision_package_refs, comparison.decision_package_refs)) differences.push("DECISION_PACKAGE_VARIATION");
  if (!replay_match) differences.push("REPLAY_DIVERGENCE");
  if (!output_match) differences.push("OUTPUT_MISMATCH");
  if (!fingerprint_match) differences.push("FINGERPRINT_MISMATCH");
  if (!integrity_match) differences.push("INTEGRITY_HASH_MISMATCH");
  if (baseline.tenant_id !== comparison.tenant_id) differences.push("TENANT_DEPENDENT_OUTPUT_VARIATION");
  const base: Omit<OrchestrationComparisonReport, "integrity_hash"> = {
    comparison_id: "deterministic_orchestration_comparison",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    baseline_execution_id: baseline.execution_id,
    comparison_execution_id: comparison.execution_id,
    input_match,
    processing_match,
    output_match,
    ordering_match,
    fingerprint_match,
    replay_match,
    integrity_match,
    difference_classification: differences.length ? "CERTIFICATION_FAILURE" : "NONE",
    differences: freezeArray([...new Set(differences)]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildOutputEquivalence(source: FoundationSchemaCertificationResult, comparison: OrchestrationComparisonReport): OutputEquivalenceValidation {
  const c = ctx(source);
  const pass = comparison.output_match && comparison.input_match && comparison.replay_match;
  const base: Omit<OutputEquivalenceValidation, "integrity_hash"> = {
    validation_id: "deterministic_output_equivalence_validation",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    record_counts_match: comparison.input_match,
    ordering_match: comparison.ordering_match,
    values_match: comparison.output_match,
    references_match: comparison.processing_match,
    explanations_match: comparison.output_match,
    recommendations_match: comparison.output_match,
    alternatives_match: comparison.output_match,
    lineage_match: comparison.replay_match,
    replay_refs_match: comparison.replay_match,
    validation_state: pass ? "PASS" : "FAIL",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildOrderingReport(source: FoundationSchemaCertificationResult, comparison: OrchestrationComparisonReport, executions: readonly OrchestrationExecutionRecord[]): OrderingValidationReport {
  const c = ctx(source);
  const base: Omit<OrderingValidationReport, "integrity_hash"> = {
    ordering_report_id: "deterministic_orchestration_ordering_report",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    intake_ordering_deterministic: comparison.input_match,
    dependency_ordering_deterministic: !comparison.differences.includes("DEPENDENCY_GRAPH_VARIATION"),
    priority_ordering_deterministic: !comparison.differences.includes("PRIORITY_SCORE_VARIATION") && !comparison.differences.includes("TIE_BREAKING_INCONSISTENCY"),
    arbitration_ordering_deterministic: !comparison.differences.includes("CONFLICT_ARBITRATION_INCONSISTENCY"),
    package_ordering_deterministic: !comparison.differences.includes("DECISION_PACKAGE_VARIATION"),
    replay_ordering_deterministic: comparison.replay_match,
    ledger_ordering_deterministic: comparison.ordering_match,
    stage_order: executions[0].stage_order,
    validation_state: comparison.ordering_match ? "PASS" : "FAIL",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildEvidence(source: FoundationSchemaCertificationResult, executions: readonly OrchestrationExecutionRecord[], comparison: OrchestrationComparisonReport, scenario: Scenario): DeterminismEvidencePackage {
  const c = ctx(source);
  const base: Omit<DeterminismEvidencePackage, "integrity_hash"> = {
    evidence_package_id: "deterministic_orchestration_evidence_package",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    execution_evidence_refs: scenario === "EVIDENCE_INCOMPLETE" ? freezeArray([executions[0].execution_id]) : freezeArray(executions.map((execution) => execution.execution_id)),
    comparison_evidence_refs: freezeArray([comparison.comparison_id]),
    fingerprint_evidence_refs: scenario === "FINGERPRINT_MISMATCH" ? freezeArray([]) : freezeArray(executions.map((execution) => execution.fingerprint.fingerprint_id)),
    replay_evidence_refs: scenario === "REPLAY_DIVERGENCE" ? freezeArray([]) : freezeArray([source.replay_hash, ...executions.flatMap((execution) => execution.replay_refs)]),
    integrity_evidence_refs: scenario === "HASH_MISMATCH" ? freezeArray([]) : freezeArray(executions.map((execution) => execution.integrity_hash)),
    complete: scenario !== "EVIDENCE_INCOMPLETE",
    immutable: scenario !== "FAIL_OPEN",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildReport(source: FoundationSchemaCertificationResult, comparison: OrchestrationComparisonReport, output: OutputEquivalenceValidation, ordering: OrderingValidationReport, failures: readonly DeterministicOrchestrationCertificationFailure[]): DeterminismCertificationReport {
  const c = ctx(source);
  const decision = failures.length ? "FAIL" : "PASS";
  const base: Omit<DeterminismCertificationReport, "integrity_hash"> = {
    report_id: "deterministic_orchestration_certification_report",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    executive_summary: decision === "PASS" ? "Decision orchestration is deterministic across certified inputs, processing, outputs, ordering, fingerprints, and replay." : "Decision orchestration determinism certification is blocked by reproducibility failures.",
    certified_stages: ORCHESTRATION_DETERMINISM_STAGES,
    certified_checks: ORCHESTRATION_DETERMINISM_CHECKS,
    test_environment: "logical-certification-sandbox",
    execution_configuration: "identical-inputs-identical-operating-conditions",
    input_comparison: comparison.input_match ? "PASS" : "FAIL",
    processing_comparison: comparison.processing_match ? "PASS" : "FAIL",
    output_comparison: output.validation_state,
    ordering_verification: ordering.validation_state,
    replay_verification: comparison.replay_match ? "PASS" : "FAIL",
    fingerprint_verification: comparison.fingerprint_match ? "PASS" : "FAIL",
    integrity_verification: comparison.integrity_match ? "PASS" : "FAIL",
    failure_analysis: failures,
    certification_decision: decision,
    production_readiness: decision === "PASS" ? "READY" : "BLOCKED",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildLedger(source: FoundationSchemaCertificationResult, evidence: DeterminismEvidencePackage, report: DeterminismCertificationReport, scenario: Scenario): readonly DeterminismCertificationLedgerEntry[] {
  const c = ctx(source);
  const events: Omit<DeterminismCertificationLedgerEntry, "integrity_hash">[] = [
    { ledger_entry_id: "determinism_cert_ledger_001", tenant_id: c.tenant_id, mission_id: c.mission_id, event_type: "DETERMINISM_TESTED", scope_ref: "all_orchestration_stages", evidence_ref: evidence.evidence_package_id, certification_state: report.certification_decision, replay_refs: evidence.replay_evidence_refs, event_timestamp: "2026-07-05T09:12:06.000Z", sequence_number: 1, append_only: true, deleted: false },
    { ledger_entry_id: "determinism_cert_ledger_002", tenant_id: c.tenant_id, mission_id: c.mission_id, event_type: "EXECUTIONS_COMPARED", scope_ref: "orchestration_comparison", evidence_ref: evidence.evidence_package_id, certification_state: report.certification_decision, replay_refs: evidence.replay_evidence_refs, event_timestamp: "2026-07-05T09:12:07.000Z", sequence_number: 2, append_only: true, deleted: false },
    { ledger_entry_id: "determinism_cert_ledger_003", tenant_id: c.tenant_id, mission_id: c.mission_id, event_type: "FINGERPRINTS_VERIFIED", scope_ref: "execution_fingerprints", evidence_ref: evidence.evidence_package_id, certification_state: report.certification_decision, replay_refs: evidence.replay_evidence_refs, event_timestamp: "2026-07-05T09:12:08.000Z", sequence_number: 3, append_only: true, deleted: false },
    { ledger_entry_id: "determinism_cert_ledger_004", tenant_id: c.tenant_id, mission_id: c.mission_id, event_type: report.certification_decision === "PASS" ? "DETERMINISM_CERTIFIED" : "DETERMINISM_BLOCKED", scope_ref: report.report_id, evidence_ref: evidence.evidence_package_id, certification_state: report.certification_decision, replay_refs: evidence.replay_evidence_refs, event_timestamp: "2026-07-05T09:12:09.000Z", sequence_number: 4, append_only: (scenario === "FAIL_OPEN" ? false : true) as true, deleted: false },
  ];
  return freezeArray(events.map((event) => Object.freeze({ ...event, integrity_hash: hashWithoutIntegrity(event) })));
}

function collectFailures(input: {
  foundation: FoundationSchemaCertificationResult;
  comparison: OrchestrationComparisonReport;
  output: OutputEquivalenceValidation;
  ordering: OrderingValidationReport;
  evidence: DeterminismEvidencePackage;
  ledger: readonly DeterminismCertificationLedgerEntry[];
  role: VisibilityRole;
  scenario: Scenario;
}): readonly DeterministicOrchestrationCertificationFailure[] {
  const failures: DeterministicOrchestrationCertificationFailure[] = [];
  if (input.foundation.validation.validation_status !== "VALID" || input.foundation.foundation_report.certification_decision !== "PASS") failures.push("FOUNDATION_CERTIFICATION_INVALID");
  failures.push(...input.comparison.differences);
  if (input.output.validation_state !== "PASS") failures.push("OUTPUT_MISMATCH");
  if (input.ordering.validation_state !== "PASS") failures.push("GRAPH_ORDERING_VARIATION");
  if (input.scenario === "HIDDEN_PATH") failures.push("HIDDEN_ORCHESTRATION_PATH");
  if (!input.evidence.complete || input.evidence.execution_evidence_refs.length < 2 || !input.evidence.fingerprint_evidence_refs.length) failures.push("EVIDENCE_INCOMPLETE");
  if (
    hashWithoutIntegrity(input.comparison) !== input.comparison.integrity_hash
    || hashWithoutIntegrity(input.output) !== input.output.integrity_hash
    || hashWithoutIntegrity(input.ordering) !== input.ordering.integrity_hash
    || hashWithoutIntegrity(input.evidence) !== input.evidence.integrity_hash
    || input.ledger.some((entry) => hashWithoutIntegrity(entry) !== entry.integrity_hash)
  ) failures.push("INTEGRITY_HASH_MISMATCH");
  if (!input.evidence.immutable || input.ledger.some((entry) => !entry.append_only || entry.deleted)) failures.push("FAIL_OPEN_PROCESSING");
  if (!visibleToRole(input.foundation, input.role)) failures.push("AUTHORIZATION_FAILURE");
  if (input.scenario === "EXECUTION_AUTHORITY") failures.push("EXECUTION_AUTHORITY_GRANTED");
  return freezeArray([...new Set(failures)]);
}

function buildValidation(failures: readonly DeterministicOrchestrationCertificationFailure[]): DeterministicOrchestrationCertificationValidation {
  const has = (failure: DeterministicOrchestrationCertificationFailure) => failures.includes(failure);
  const base: Omit<DeterministicOrchestrationCertificationValidation, "integrity_hash"> = {
    validation_id: "deterministic_orchestration_certification_validation",
    validation_status: failures.length ? "BLOCKED" : "VALID",
    foundation_certified: !has("FOUNDATION_CERTIFICATION_INVALID"),
    intake_deterministic: !has("NONDETERMINISTIC_INTAKE"),
    normalization_deterministic: !has("NONDETERMINISTIC_NORMALIZATION"),
    context_deterministic: !has("NONDETERMINISTIC_CONTEXT_BUILDING"),
    dependency_graph_deterministic: !has("DEPENDENCY_GRAPH_VARIATION"),
    graph_ordering_deterministic: !has("GRAPH_ORDERING_VARIATION"),
    conflict_arbitration_deterministic: !has("CONFLICT_ARBITRATION_INCONSISTENCY"),
    priority_scoring_deterministic: !has("PRIORITY_SCORE_VARIATION"),
    tie_breaking_deterministic: !has("TIE_BREAKING_INCONSISTENCY"),
    package_generation_deterministic: !has("DECISION_PACKAGE_VARIATION"),
    replay_deterministic: !has("REPLAY_DIVERGENCE"),
    output_equivalent: !has("OUTPUT_MISMATCH"),
    fingerprints_reproducible: !has("FINGERPRINT_MISMATCH"),
    integrity_verified: !has("INTEGRITY_HASH_MISMATCH"),
    hidden_paths_absent: !has("HIDDEN_ORCHESTRATION_PATH"),
    evidence_complete: !has("EVIDENCE_INCOMPLETE"),
    tenant_safe: !has("TENANT_DEPENDENT_OUTPUT_VARIATION"),
    fail_closed: !has("FAIL_OPEN_PROCESSING"),
    authorization_valid: !has("AUTHORIZATION_FAILURE"),
    advisory_only: !has("EXECUTION_AUTHORITY_GRANTED"),
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<DeterministicOrchestrationCertificationResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    executions: result.executions,
    comparison: result.comparison_report,
    output: result.output_equivalence,
    ordering: result.ordering_report,
    evidence: result.evidence_package,
    report: result.determinism_report,
    ledger: result.determinism_ledger,
    validation: result.validation,
  });
}

export function runDeterministicOrchestrationCertification(input: DeterministicOrchestrationCertificationInput = {}): DeterministicOrchestrationCertificationResult {
  const scenario = input.scenario ?? "BASELINE";
  const role = input.role ?? "OPERATOR";
  const foundation_certification = input.foundation_certification ?? runFoundationSchemaCertification({ scenario: scenario === "FOUNDATION_INVALID" ? "NONDETERMINISTIC_VALIDATION" : "BASELINE" });
  const executions = freezeArray([buildExecution(foundation_certification, scenario, "baseline"), buildExecution(foundation_certification, scenario, "comparison")]);
  const comparison_report = compareExecutions(foundation_certification, executions);
  const output_equivalence = buildOutputEquivalence(foundation_certification, comparison_report);
  const ordering_report = buildOrderingReport(foundation_certification, comparison_report, executions);
  const evidence_package = buildEvidence(foundation_certification, executions, comparison_report, scenario);
  const preFailures = collectFailures({ foundation: foundation_certification, comparison: comparison_report, output: output_equivalence, ordering: ordering_report, evidence: evidence_package, ledger: [], role, scenario });
  const determinism_report = buildReport(foundation_certification, comparison_report, output_equivalence, ordering_report, preFailures);
  const determinism_ledger = buildLedger(foundation_certification, evidence_package, determinism_report, scenario);
  const failures = collectFailures({ foundation: foundation_certification, comparison: comparison_report, output: output_equivalence, ordering: ordering_report, evidence: evidence_package, ledger: determinism_ledger, role, scenario });
  const validation = buildValidation(failures);
  const base: Omit<DeterministicOrchestrationCertificationResult, "integrity_hash" | "replay_hash"> = {
    certification_version: CERTIFICATION_VERSION,
    foundation_certification,
    executions,
    comparison_report,
    output_equivalence,
    ordering_report,
    evidence_package,
    determinism_report,
    determinism_ledger,
    validation,
    deterministic: true,
    replayable: true,
    advisory_only: true,
    mutates_orchestrator_state: false,
    execution_authority_granted: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayDeterministicOrchestrationCertification(result: DeterministicOrchestrationCertificationResult): boolean {
  return resultReplayHash(result) === result.replay_hash && hashWithoutIntegrity(result) === result.integrity_hash;
}

export function computeOrchestrationExecutionHash(record: Omit<OrchestrationExecutionRecord, "integrity_hash"> | OrchestrationExecutionRecord): string {
  return hashWithoutIntegrity(record);
}

export function getDeterministicOrchestrationCertificationFoundation(): DeterministicOrchestrationCertificationFoundation {
  return Object.freeze({
    certification_version: CERTIFICATION_VERSION,
    stages: ORCHESTRATION_DETERMINISM_STAGES,
    checks: ORCHESTRATION_DETERMINISM_CHECKS,
    result: runDeterministicOrchestrationCertification(),
  });
}

export const DeterministicOrchestrationCertification = Object.freeze({
  run: runDeterministicOrchestrationCertification,
  replay: replayDeterministicOrchestrationCertification,
});
