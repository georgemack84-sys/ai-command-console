import { buildAuthorityBoundaryPackage } from "@/services/authority-boundary-engine";
import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type { AuthorityBoundaryPackage } from "@/types/authority-boundary-engine";
import type {
  DependencyStatus,
  ExecutionBoundary,
  ExecutionBoundaryCategory,
  ExecutionBoundaryDecision,
  ExecutionBoundaryEvaluation,
  ExecutionBoundaryEvidence,
  ExecutionBoundaryFramework,
  ExecutionBoundaryLedgerEntry,
  ExecutionBoundaryPackage,
  ExecutionBoundaryReplayResult,
  ExecutionBoundaryScenario,
  ExecutionBoundaryState,
  ExecutionBoundaryViolation,
  ExecutionBoundaryVisibilitySurface,
  ResourceUsage,
} from "@/types/execution-boundary-engine";

const NOW = "2026-06-30T04:00:00.000Z";
const ENGINE_VERSION = "execution-boundary-engine/v8F.3" as const;
const PIPELINE = Object.freeze(["Execution Request", "Approved Scope Reconstruction", "Workflow Graph Validation", "Task Sequencing", "Dependency Validation", "Resource Utilization", "Retry History", "Timeout History", "Checkpoint Creation", "Rollback Decisions", "Boundary Evaluations", "Enforcement Actions", "Final Execution Outcome"]);
const CATEGORIES = Object.freeze(["SCOPE", "TIME", "RESOURCE", "DEPENDENCY", "RETRY", "CONCURRENCY", "ROLLBACK"] as const);

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

function scenarioViolation(scenario: ExecutionBoundaryScenario): ExecutionBoundaryViolation | null {
  const map: Partial<Record<ExecutionBoundaryScenario, ExecutionBoundaryViolation>> = {
    OUTSIDE_AUTHORITY: "EXECUTION_OUTSIDE_AUTHORITY",
    CONSTITUTIONAL_CONFLICT: "CONSTITUTIONAL_CONFLICT",
    TENANT_ISOLATION_VIOLATION: "TENANT_ISOLATION_VIOLATION",
    HIDDEN_EXECUTION_PATH: "HIDDEN_EXECUTION_PATH",
    INTEGRITY_FAILURE: "EXECUTION_INTEGRITY_FAILURE",
    SCOPE_EXPANSION: "EXECUTION_OUTSIDE_APPROVED_SCOPE",
    UNAUTHORIZED_WORKFLOW_CHANGE: "UNAUTHORIZED_WORKFLOW_CHANGE",
    RECURSIVE_EXECUTION_LOOP: "RECURSIVE_EXECUTION_LOOP",
    DEPENDENCY_VIOLATION: "DEPENDENCY_VIOLATION",
    TIMEOUT_VIOLATION: "TIMEOUT_VIOLATION",
    EXCESSIVE_RETRIES: "EXCESSIVE_RETRIES",
    UNCONTROLLED_CONCURRENCY: "UNCONTROLLED_CONCURRENCY",
    RESOURCE_EXHAUSTION: "RESOURCE_EXHAUSTION",
    SKIPPED_CHECKPOINT: "SKIPPED_CHECKPOINT",
    UNAUTHORIZED_ROLLBACK: "UNAUTHORIZED_ROLLBACK",
    REPLAY_MISMATCH: "REPLAY_RECONSTRUCTION_MISMATCH",
    LINEAGE_MISSING: "LINEAGE_REFERENCE_MISSING",
    TRUTH_LEDGER_MISSING: "TRUTH_LEDGER_REFERENCE_MISSING",
    AUTHORITY_BLOCKED: "AUTHORITY_NOT_GRANTED",
  };
  return map[scenario] ?? null;
}

function categoryForViolation(violation: ExecutionBoundaryViolation | null): ExecutionBoundaryCategory | null {
  if (!violation) return null;
  if (["EXECUTION_OUTSIDE_APPROVED_SCOPE", "UNAUTHORIZED_WORKFLOW_CHANGE", "EXECUTION_OUTSIDE_AUTHORITY", "CONSTITUTIONAL_CONFLICT", "TENANT_ISOLATION_VIOLATION", "HIDDEN_EXECUTION_PATH", "EXECUTION_INTEGRITY_FAILURE", "AUTHORITY_NOT_GRANTED"].includes(violation)) return "SCOPE";
  if (violation === "TIMEOUT_VIOLATION") return "TIME";
  if (violation === "RESOURCE_EXHAUSTION") return "RESOURCE";
  if (violation === "DEPENDENCY_VIOLATION") return "DEPENDENCY";
  if (violation === "EXCESSIVE_RETRIES") return "RETRY";
  if (violation === "UNCONTROLLED_CONCURRENCY" || violation === "RECURSIVE_EXECUTION_LOOP") return "CONCURRENCY";
  if (violation === "UNAUTHORIZED_ROLLBACK" || violation === "SKIPPED_CHECKPOINT") return "ROLLBACK";
  return "SCOPE";
}

function decisionFor(scenario: ExecutionBoundaryScenario, violations: readonly ExecutionBoundaryViolation[], authority: AuthorityBoundaryPackage): ExecutionBoundaryDecision {
  if (authority.authorization_decision.decision === "BLOCK" || authority.authorization_decision.decision === "FAIL_SAFE") return "FAIL_SAFE";
  if (["OUTSIDE_AUTHORITY", "CONSTITUTIONAL_CONFLICT", "TENANT_ISOLATION_VIOLATION", "HIDDEN_EXECUTION_PATH", "INTEGRITY_FAILURE"].includes(scenario)) return "TERMINATE";
  if (scenario === "UNAUTHORIZED_ROLLBACK") return "ROLLBACK";
  if (["REPEATED_VIOLATIONS", "CONFLICTING_EXECUTION_STATE"].includes(scenario)) return "ESCALATE";
  if (["DEPENDENCY_UNCERTAINTY", "RESOURCE_INSTABILITY"].includes(scenario)) return "PAUSE";
  if (scenario === "CHECKPOINT_REQUIRED" || scenario === "SKIPPED_CHECKPOINT") return "CHECKPOINT";
  if (violations.length || scenario === "MINOR_DEVIATION") return "RESTRICT";
  return "CONTINUE";
}

function stateFor(decision: ExecutionBoundaryDecision): ExecutionBoundaryState {
  if (decision === "CONTINUE" || decision === "CHECKPOINT") return "MONITORING";
  if (decision === "RESTRICT") return "RESTRICTED";
  if (decision === "PAUSE") return "PAUSED";
  if (decision === "ESCALATE") return "ESCALATED";
  if (decision === "ROLLBACK") return "ROLLBACK_READY";
  if (decision === "TERMINATE") return "TERMINATED";
  return "FAILED";
}

function resourceUsage(scenario: ExecutionBoundaryScenario): ResourceUsage {
  const exhausted = scenario === "RESOURCE_EXHAUSTION";
  const unstable = scenario === "RESOURCE_INSTABILITY";
  return Object.freeze({
    cpu: exhausted ? 98 : unstable ? 82 : 41,
    memory: exhausted ? 97 : unstable ? 79 : 44,
    storage: exhausted ? 95 : 55,
    network: exhausted ? 94 : 37,
    api_consumption: exhausted ? 99 : 46,
    throughput: exhausted ? 12 : 72,
    queue_depth: exhausted ? 88 : unstable ? 44 : 8,
    latency: exhausted ? 1800 : unstable ? 650 : 120,
    backlog: exhausted ? 76 : unstable ? 22 : 3,
  });
}

function dependencyStatus(scenario: ExecutionBoundaryScenario): DependencyStatus {
  const bad = scenario === "DEPENDENCY_VIOLATION" || scenario === "DEPENDENCY_UNCERTAINTY";
  return Object.freeze({
    prerequisites_complete: !bad,
    dependencies_available: scenario !== "DEPENDENCY_VIOLATION",
    ordering_valid: scenario !== "DEPENDENCY_VIOLATION",
    integrity_valid: scenario !== "DEPENDENCY_VIOLATION",
    dependency_graph_hash: hashValue("execution-boundary-dependency-graph", { scenario, bad }),
  });
}

function boundaryHashSource(boundary: Omit<ExecutionBoundary, "integrity_hash"> | ExecutionBoundary) {
  return {
    execution_boundary_id: boundary.execution_boundary_id,
    execution_id: boundary.execution_id,
    workflow_id: boundary.workflow_id,
    mission_id: boundary.mission_id,
    tenant_id: boundary.tenant_id,
    execution_state: boundary.execution_state,
    approved_scope: boundary.approved_scope,
    current_scope: boundary.current_scope,
    execution_depth: boundary.execution_depth,
    recursion_depth: boundary.recursion_depth,
    active_tasks: boundary.active_tasks,
    completed_tasks: boundary.completed_tasks,
    pending_tasks: boundary.pending_tasks,
    dependency_status: boundary.dependency_status,
    resource_usage: boundary.resource_usage,
    retry_count: boundary.retry_count,
    timeout_status: boundary.timeout_status,
    concurrency_level: boundary.concurrency_level,
    checkpoint_reference: boundary.checkpoint_reference,
    rollback_reference: boundary.rollback_reference,
    boundary_status: boundary.boundary_status,
    decision: boundary.decision,
    confidence: boundary.confidence,
    detected_violations: boundary.detected_violations,
    operator_required: boundary.operator_required,
    governance_required: boundary.governance_required,
    timestamp: boundary.timestamp,
    replay_reference: boundary.replay_reference,
    lineage_reference: boundary.lineage_reference,
  };
}

export function computeExecutionBoundaryHash(boundary: Omit<ExecutionBoundary, "integrity_hash"> | ExecutionBoundary): string {
  return hashValue("execution-boundary", boundaryHashSource(boundary));
}

function buildBoundary(authority: AuthorityBoundaryPackage, scenario: ExecutionBoundaryScenario): ExecutionBoundary {
  const baseViolation = scenarioViolation(scenario);
  const authorityViolation: ExecutionBoundaryViolation | null = authority.authorization_decision.decision === "ALLOW" || authority.authorization_decision.decision === "ALLOW_WITH_RESTRICTIONS" || authority.authorization_decision.decision === "ESCALATE" ? null : "AUTHORITY_NOT_GRANTED";
  const violations = unique([...(baseViolation ? [baseViolation] : []), ...(authorityViolation ? [authorityViolation] : [])]);
  const decision = decisionFor(scenario, violations, authority);
  const approvedScope = authority.authorization_decision.approved_scope.length ? authority.authorization_decision.approved_scope : ["mission", "workflow", "execution"];
  const currentScope = scenario === "SCOPE_EXPANSION" || scenario === "UNAUTHORIZED_WORKFLOW_CHANGE" ? [...approvedScope, "external-workflow"] : approvedScope;
  const source = {
    execution_boundary_id: id("EB", "execution-boundary-id", { authority: authority.package_id, scenario }),
    execution_id: authority.source_boundary_contract.execution_id,
    workflow_id: scenario === "UNAUTHORIZED_WORKFLOW_CHANGE" ? "workflow_unapproved" : authority.source_boundary_contract.workflow_id,
    mission_id: authority.source_boundary_contract.mission_id,
    tenant_id: scenario === "TENANT_ISOLATION_VIOLATION" ? "tenant_beta" : authority.source_boundary_contract.tenant_id,
    execution_state: stateFor(decision),
    approved_scope: freezeArray(approvedScope),
    current_scope: freezeArray(currentScope),
    execution_depth: scenario === "RECURSIVE_EXECUTION_LOOP" ? 12 : 3,
    recursion_depth: scenario === "RECURSIVE_EXECUTION_LOOP" ? 9 : 1,
    active_tasks: freezeArray(["task:observe", "task:execute"]),
    completed_tasks: freezeArray(["task:authorize"]),
    pending_tasks: freezeArray(decision === "TERMINATE" ? [] : ["task:checkpoint"]),
    dependency_status: dependencyStatus(scenario),
    resource_usage: resourceUsage(scenario),
    retry_count: scenario === "EXCESSIVE_RETRIES" ? 9 : 1,
    timeout_status: scenario === "TIMEOUT_VIOLATION" ? "EXCEEDED" as const : "WITHIN_LIMIT" as const,
    concurrency_level: scenario === "UNCONTROLLED_CONCURRENCY" ? 17 : 2,
    checkpoint_reference: scenario === "SKIPPED_CHECKPOINT" ? "" : "checkpoint:execution-boundary:v8f3",
    rollback_reference: scenario === "UNAUTHORIZED_ROLLBACK" ? "" : "rollback:execution-boundary:v8f3",
    boundary_status: violations.length ? "VIOLATION" as const : "WITHIN_BOUNDARY" as const,
    decision,
    confidence: violations.length ? 0.28 : decision === "PAUSE" || decision === "ESCALATE" ? 0.72 : 0.97,
    detected_violations: violations,
    operator_required: ["PAUSE", "ESCALATE", "ROLLBACK", "TERMINATE", "FAIL_SAFE"].includes(decision),
    governance_required: true,
    timestamp: NOW,
    replay_reference: scenario === "REPLAY_MISMATCH" ? "" : "replay:execution-boundary:v8f3",
    lineage_reference: scenario === "LINEAGE_MISSING" ? "" : "lineage:execution-boundary:v8f3",
  };
  return Object.freeze({ ...source, integrity_hash: scenario === "INTEGRITY_FAILURE" ? "tampered-execution-boundary" : computeExecutionBoundaryHash(source) });
}

function evaluationHashSource(evaluation: Omit<ExecutionBoundaryEvaluation, "integrity_hash"> | ExecutionBoundaryEvaluation) {
  return {
    evaluation_id: evaluation.evaluation_id,
    category: evaluation.category,
    result: evaluation.result,
    violations: evaluation.violations,
    evidence_refs: evaluation.evidence_refs,
    explanation: evaluation.explanation,
  };
}

export function computeExecutionBoundaryEvaluationHash(evaluation: Omit<ExecutionBoundaryEvaluation, "integrity_hash"> | ExecutionBoundaryEvaluation): string {
  return hashValue("execution-boundary-evaluation", evaluationHashSource(evaluation));
}

function buildEvaluation(category: ExecutionBoundaryCategory, boundary: ExecutionBoundary): ExecutionBoundaryEvaluation {
  const violations = boundary.detected_violations.filter((violation) => categoryForViolation(violation) === category);
  const source = {
    evaluation_id: id("EBE", "execution-boundary-evaluation-id", { boundary: boundary.execution_boundary_id, category }),
    category,
    result: violations.length ? "FAIL" as const : "PASS" as const,
    violations: freezeArray(violations),
    evidence_refs: freezeArray(violations.length ? [] : [`evidence:execution:${category.toLowerCase()}:v8f3`]),
    explanation: violations.length ? `${category} boundary detected ${violations.join(", ")}.` : `${category} boundary remained within approved limits.`,
  };
  return Object.freeze({ ...source, integrity_hash: computeExecutionBoundaryEvaluationHash(source) });
}

function evidenceHashSource(evidence: Omit<ExecutionBoundaryEvidence, "integrity_hash"> | ExecutionBoundaryEvidence) {
  return {
    evidence_id: evidence.evidence_id,
    approved_scope: evidence.approved_scope,
    executed_scope: evidence.executed_scope,
    execution_progress: evidence.execution_progress,
    boundary_evaluations: evidence.boundary_evaluations,
    detected_violations: evidence.detected_violations,
    resource_metrics: evidence.resource_metrics,
    dependency_graph: evidence.dependency_graph,
    checkpoint_history: evidence.checkpoint_history,
    rollback_history: evidence.rollback_history,
    operator_actions: evidence.operator_actions,
    governance_actions: evidence.governance_actions,
    enforcement_decision: evidence.enforcement_decision,
    confidence: evidence.confidence,
    timestamp: evidence.timestamp,
    replay_reference: evidence.replay_reference,
    truth_ledger_reference: evidence.truth_ledger_reference,
  };
}

export function computeExecutionBoundaryEvidenceHash(evidence: Omit<ExecutionBoundaryEvidence, "integrity_hash"> | ExecutionBoundaryEvidence): string {
  return hashValue("execution-boundary-evidence", evidenceHashSource(evidence));
}

function buildEvidence(boundary: ExecutionBoundary, evaluations: readonly ExecutionBoundaryEvaluation[], scenario: ExecutionBoundaryScenario): ExecutionBoundaryEvidence {
  const source = {
    evidence_id: id("EBEV", "execution-boundary-evidence-id", boundary.execution_boundary_id),
    approved_scope: boundary.approved_scope,
    executed_scope: boundary.current_scope,
    execution_progress: freezeArray(["requested", "validated", "authorized", "monitored", boundary.decision.toLowerCase()]),
    boundary_evaluations: freezeArray(evaluations.map((item) => item.integrity_hash)),
    detected_violations: boundary.detected_violations,
    resource_metrics: boundary.resource_usage,
    dependency_graph: boundary.dependency_status.dependency_graph_hash,
    checkpoint_history: freezeArray(boundary.checkpoint_reference ? [boundary.checkpoint_reference] : []),
    rollback_history: freezeArray(boundary.rollback_reference ? [boundary.rollback_reference] : []),
    operator_actions: freezeArray(boundary.operator_required ? ["operator:review-required"] : []),
    governance_actions: freezeArray(["governance:execution-boundary-reviewed"]),
    enforcement_decision: boundary.decision,
    confidence: boundary.confidence,
    timestamp: NOW,
    replay_reference: boundary.replay_reference,
    truth_ledger_reference: scenario === "TRUTH_LEDGER_MISSING" ? "" : `truth-ledger:execution-boundary:${boundary.execution_boundary_id}`,
  };
  return Object.freeze({ ...source, integrity_hash: computeExecutionBoundaryEvidenceHash(source) });
}

function buildLedger(boundary: ExecutionBoundary, evidence: ExecutionBoundaryEvidence): ExecutionBoundaryLedgerEntry {
  const source = {
    ledger_entry_id: id("EBL", "execution-boundary-ledger-id", boundary.execution_boundary_id),
    execution_boundary_id: boundary.execution_boundary_id,
    execution_validation: boundary.integrity_hash,
    scope_verification: hashValue("execution-boundary-scope", { approved: boundary.approved_scope, current: boundary.current_scope }),
    resource_evidence: hashValue("execution-boundary-resource", boundary.resource_usage),
    dependency_evidence: boundary.dependency_status.dependency_graph_hash,
    retry_evidence: hashValue("execution-boundary-retry", boundary.retry_count),
    checkpoint_evidence: boundary.checkpoint_reference,
    rollback_evidence: boundary.rollback_reference,
    violation_evidence: boundary.detected_violations,
    enforcement_decision: boundary.decision,
    replay_reference: boundary.replay_reference,
    append_only: true as const,
  };
  return Object.freeze({ ...source, ledger_hash: evidence.truth_ledger_reference ? hashValue("execution-boundary-ledger", source) : "" });
}

function replayPackage(boundary: ExecutionBoundary, evidence: ExecutionBoundaryEvidence, scenario: ExecutionBoundaryScenario): ExecutionBoundaryReplayResult {
  const source = {
    replay_id: id("EBR", "execution-boundary-replay-id", boundary.execution_boundary_id),
    execution_boundary_id: boundary.execution_boundary_id,
    reconstructed_pipeline: freezeArray(PIPELINE),
    reconstructed_decision: boundary.decision,
    reconstructed_boundary_hash: scenario === "REPLAY_MISMATCH" ? "mismatched-execution-boundary-replay" : boundary.integrity_hash,
    reconstructed_evidence_hash: evidence.integrity_hash,
    validation_state: scenario === "REPLAY_MISMATCH" ? "FAIL" as const : "PASS" as const,
    failure_reason: scenario === "REPLAY_MISMATCH" ? "REPLAY_RECONSTRUCTION_MISMATCH" as const : null,
  };
  return Object.freeze({ ...source, replay_hash: hashValue("execution-boundary-replay", source) });
}

function packageHashSource(pkg: Omit<ExecutionBoundaryPackage, "package_hash">) {
  return {
    package_id: pkg.package_id,
    engine_version: pkg.engine_version,
    authority_package_id: pkg.source_authority_package.package_id,
    boundary_hash: pkg.execution_boundary.integrity_hash,
    evaluation_hashes: pkg.boundary_evaluations.map((item) => item.integrity_hash),
    evidence_hash: pkg.execution_evidence.integrity_hash,
    ledger_hash: pkg.ledger_entry.ledger_hash,
    replay_hash: pkg.replay.replay_hash,
  };
}

export function buildExecutionBoundaryPackage(input: { scenario?: ExecutionBoundaryScenario; authorityPackage?: AuthorityBoundaryPackage } = {}): ExecutionBoundaryPackage {
  const scenario = input.scenario ?? "BASELINE";
  const source_authority_package = input.authorityPackage ?? buildAuthorityBoundaryPackage({ scenario: scenario === "AUTHORITY_BLOCKED" ? "MISSING_AUTHORITY_SOURCE" : "BASELINE" });
  const execution_boundary = buildBoundary(source_authority_package, scenario);
  const boundary_evaluations = freezeArray(CATEGORIES.map((category) => buildEvaluation(category, execution_boundary)));
  const execution_evidence = buildEvidence(execution_boundary, boundary_evaluations, scenario);
  const ledger_entry = buildLedger(execution_boundary, execution_evidence);
  const replay = replayPackage(execution_boundary, execution_evidence, scenario);
  const full = {
    package_id: id("EBP", "execution-boundary-package-id", { authority: source_authority_package.package_id, scenario }),
    engine_version: ENGINE_VERSION,
    source_authority_package,
    execution_boundary,
    boundary_evaluations,
    execution_evidence,
    ledger_entry,
    replay,
    execution_scope_expanded: false as const,
    autonomous_execution_performed: false as const,
    authority_expanded: false as const,
  };
  return Object.freeze({ ...full, package_hash: hashValue("execution-boundary-package", packageHashSource(full)) });
}

export function buildExecutionBoundaryVisibilitySurface(pkg = buildExecutionBoundaryPackage()): ExecutionBoundaryVisibilitySurface {
  return Object.freeze({
    package_id: pkg.package_id,
    execution_state: pkg.execution_boundary.execution_state,
    approved_scope: pkg.execution_boundary.approved_scope,
    current_scope: pkg.execution_boundary.current_scope,
    execution_timeline: pkg.replay.reconstructed_pipeline,
    active_tasks: pkg.execution_boundary.active_tasks,
    dependency_graph: pkg.execution_boundary.dependency_status.dependency_graph_hash,
    resource_usage: pkg.execution_boundary.resource_usage,
    retry_count: pkg.execution_boundary.retry_count,
    checkpoint_reference: pkg.execution_boundary.checkpoint_reference,
    rollback_ready: Boolean(pkg.execution_boundary.rollback_reference),
    active_restrictions: pkg.execution_boundary.decision === "RESTRICT" ? ["reduce concurrency", "limit retries", "enforce checkpoint"] : [],
    detected_violations: pkg.execution_boundary.detected_violations,
    enforcement_decision: pkg.execution_boundary.decision,
    confidence_score: pkg.execution_boundary.confidence,
    replay_status: pkg.replay.validation_state,
    integrity_status: computeExecutionBoundaryHash(pkg.execution_boundary) === pkg.execution_boundary.integrity_hash && pkg.replay.validation_state === "PASS" ? "VALID" : "INVALID",
  });
}

export function getExecutionBoundaryFramework(): ExecutionBoundaryFramework {
  const pkg = buildExecutionBoundaryPackage();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray(["execution-never-exceeds-authorization", "approved-scope-only", "continuous-validation", "runtime-safety", "least-execution", "fail-closed", "deterministic-enforcement", "complete-explainability", "truth-ledger-required", "replayable-enforcement"]),
      engine_version: ENGINE_VERSION,
      states: freezeArray(["REQUESTED", "VALIDATING", "AUTHORIZED", "EXECUTING", "MONITORING", "RESTRICTED", "PAUSED", "ROLLBACK_READY", "ROLLING_BACK", "ESCALATED", "TERMINATED", "COMPLETED", "FAILED"] as const),
      decisions: freezeArray(["CONTINUE", "RESTRICT", "CHECKPOINT", "PAUSE", "ESCALATE", "ROLLBACK", "TERMINATE", "FAIL_SAFE"] as const),
      categories: freezeArray(CATEGORIES),
    }),
    package: pkg,
    visibility: buildExecutionBoundaryVisibilitySurface(pkg),
  });
}
