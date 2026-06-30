import type { AuthorityBoundaryPackage } from "@/types/authority-boundary-engine";

export type ExecutionBoundaryState = "REQUESTED" | "VALIDATING" | "AUTHORIZED" | "EXECUTING" | "MONITORING" | "RESTRICTED" | "PAUSED" | "ROLLBACK_READY" | "ROLLING_BACK" | "ESCALATED" | "TERMINATED" | "COMPLETED" | "FAILED";
export type ExecutionBoundaryDecision = "CONTINUE" | "RESTRICT" | "CHECKPOINT" | "PAUSE" | "ESCALATE" | "ROLLBACK" | "TERMINATE" | "FAIL_SAFE";
export type ExecutionBoundaryStatus = "WITHIN_BOUNDARY" | "VIOLATION";
export type ExecutionBoundaryCategory = "SCOPE" | "TIME" | "RESOURCE" | "DEPENDENCY" | "RETRY" | "CONCURRENCY" | "ROLLBACK";

export type ExecutionBoundaryScenario =
  | "BASELINE"
  | "MINOR_DEVIATION"
  | "CHECKPOINT_REQUIRED"
  | "DEPENDENCY_UNCERTAINTY"
  | "RESOURCE_INSTABILITY"
  | "REPEATED_VIOLATIONS"
  | "CONFLICTING_EXECUTION_STATE"
  | "OUTSIDE_AUTHORITY"
  | "CONSTITUTIONAL_CONFLICT"
  | "TENANT_ISOLATION_VIOLATION"
  | "HIDDEN_EXECUTION_PATH"
  | "INTEGRITY_FAILURE"
  | "SCOPE_EXPANSION"
  | "UNAUTHORIZED_WORKFLOW_CHANGE"
  | "RECURSIVE_EXECUTION_LOOP"
  | "DEPENDENCY_VIOLATION"
  | "TIMEOUT_VIOLATION"
  | "EXCESSIVE_RETRIES"
  | "UNCONTROLLED_CONCURRENCY"
  | "RESOURCE_EXHAUSTION"
  | "SKIPPED_CHECKPOINT"
  | "UNAUTHORIZED_ROLLBACK"
  | "REPLAY_MISMATCH"
  | "LINEAGE_MISSING"
  | "TRUTH_LEDGER_MISSING"
  | "AUTHORITY_BLOCKED";

export type ExecutionBoundaryViolation =
  | "EXECUTION_OUTSIDE_APPROVED_SCOPE"
  | "UNAUTHORIZED_WORKFLOW_CHANGE"
  | "RECURSIVE_EXECUTION_LOOP"
  | "DEPENDENCY_VIOLATION"
  | "TIMEOUT_VIOLATION"
  | "EXCESSIVE_RETRIES"
  | "UNCONTROLLED_CONCURRENCY"
  | "RESOURCE_EXHAUSTION"
  | "SKIPPED_CHECKPOINT"
  | "UNAUTHORIZED_ROLLBACK"
  | "EXECUTION_OUTSIDE_AUTHORITY"
  | "CONSTITUTIONAL_CONFLICT"
  | "TENANT_ISOLATION_VIOLATION"
  | "HIDDEN_EXECUTION_PATH"
  | "EXECUTION_INTEGRITY_FAILURE"
  | "REPLAY_RECONSTRUCTION_MISMATCH"
  | "LINEAGE_REFERENCE_MISSING"
  | "TRUTH_LEDGER_REFERENCE_MISSING"
  | "AUTHORITY_NOT_GRANTED"
  | "FAIL_CLOSED";

export type ResourceUsage = Readonly<{
  cpu: number;
  memory: number;
  storage: number;
  network: number;
  api_consumption: number;
  throughput: number;
  queue_depth: number;
  latency: number;
  backlog: number;
}>;

export type DependencyStatus = Readonly<{
  prerequisites_complete: boolean;
  dependencies_available: boolean;
  ordering_valid: boolean;
  integrity_valid: boolean;
  dependency_graph_hash: string;
}>;

export type ExecutionBoundary = Readonly<{
  execution_boundary_id: string;
  execution_id: string;
  workflow_id: string;
  mission_id: string;
  tenant_id: string;
  execution_state: ExecutionBoundaryState;
  approved_scope: readonly string[];
  current_scope: readonly string[];
  execution_depth: number;
  recursion_depth: number;
  active_tasks: readonly string[];
  completed_tasks: readonly string[];
  pending_tasks: readonly string[];
  dependency_status: DependencyStatus;
  resource_usage: ResourceUsage;
  retry_count: number;
  timeout_status: "WITHIN_LIMIT" | "EXCEEDED";
  concurrency_level: number;
  checkpoint_reference: string;
  rollback_reference: string;
  boundary_status: ExecutionBoundaryStatus;
  decision: ExecutionBoundaryDecision;
  confidence: number;
  detected_violations: readonly ExecutionBoundaryViolation[];
  operator_required: boolean;
  governance_required: boolean;
  timestamp: string;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
}>;

export type ExecutionBoundaryEvaluation = Readonly<{
  evaluation_id: string;
  category: ExecutionBoundaryCategory;
  result: "PASS" | "FAIL";
  violations: readonly ExecutionBoundaryViolation[];
  evidence_refs: readonly string[];
  explanation: string;
  integrity_hash: string;
}>;

export type ExecutionBoundaryEvidence = Readonly<{
  evidence_id: string;
  approved_scope: readonly string[];
  executed_scope: readonly string[];
  execution_progress: readonly string[];
  boundary_evaluations: readonly string[];
  detected_violations: readonly ExecutionBoundaryViolation[];
  resource_metrics: ResourceUsage;
  dependency_graph: string;
  checkpoint_history: readonly string[];
  rollback_history: readonly string[];
  operator_actions: readonly string[];
  governance_actions: readonly string[];
  enforcement_decision: ExecutionBoundaryDecision;
  confidence: number;
  timestamp: string;
  replay_reference: string;
  truth_ledger_reference: string;
  integrity_hash: string;
}>;

export type ExecutionBoundaryLedgerEntry = Readonly<{
  ledger_entry_id: string;
  execution_boundary_id: string;
  execution_validation: string;
  scope_verification: string;
  resource_evidence: string;
  dependency_evidence: string;
  retry_evidence: string;
  checkpoint_evidence: string;
  rollback_evidence: string;
  violation_evidence: readonly ExecutionBoundaryViolation[];
  enforcement_decision: ExecutionBoundaryDecision;
  replay_reference: string;
  append_only: true;
  ledger_hash: string;
}>;

export type ExecutionBoundaryReplayResult = Readonly<{
  replay_id: string;
  execution_boundary_id: string;
  reconstructed_pipeline: readonly string[];
  reconstructed_decision: ExecutionBoundaryDecision;
  reconstructed_boundary_hash: string;
  reconstructed_evidence_hash: string;
  validation_state: "PASS" | "FAIL";
  failure_reason: ExecutionBoundaryViolation | null;
  replay_hash: string;
}>;

export type ExecutionBoundaryPackage = Readonly<{
  package_id: string;
  engine_version: "execution-boundary-engine/v8F.3";
  source_authority_package: AuthorityBoundaryPackage;
  execution_boundary: ExecutionBoundary;
  boundary_evaluations: readonly ExecutionBoundaryEvaluation[];
  execution_evidence: ExecutionBoundaryEvidence;
  ledger_entry: ExecutionBoundaryLedgerEntry;
  replay: ExecutionBoundaryReplayResult;
  execution_scope_expanded: false;
  autonomous_execution_performed: false;
  authority_expanded: false;
  package_hash: string;
}>;

export type ExecutionBoundaryVisibilitySurface = Readonly<{
  package_id: string;
  execution_state: ExecutionBoundaryState;
  approved_scope: readonly string[];
  current_scope: readonly string[];
  execution_timeline: readonly string[];
  active_tasks: readonly string[];
  dependency_graph: string;
  resource_usage: ResourceUsage;
  retry_count: number;
  checkpoint_reference: string;
  rollback_ready: boolean;
  active_restrictions: readonly string[];
  detected_violations: readonly ExecutionBoundaryViolation[];
  enforcement_decision: ExecutionBoundaryDecision;
  confidence_score: number;
  replay_status: "PASS" | "FAIL";
  integrity_status: "VALID" | "INVALID";
}>;

export type ExecutionBoundaryFramework = Readonly<{
  doctrine: Readonly<{
    principles: readonly string[];
    engine_version: "execution-boundary-engine/v8F.3";
    states: readonly ExecutionBoundaryState[];
    decisions: readonly ExecutionBoundaryDecision[];
    categories: readonly ExecutionBoundaryCategory[];
  }>;
  package: ExecutionBoundaryPackage;
  visibility: ExecutionBoundaryVisibilitySurface;
}>;
