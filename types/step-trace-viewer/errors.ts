export type TraceViewerErrorCode =
  | "TRACE_VIEWER_REPO_CONTEXT_MISSING"
  | "TRACE_VIEWER_MUTATION_FORBIDDEN"
  | "TRACE_SOURCE_TRUTH_MISSING"
  | "TRACE_PROJECTION_NONDETERMINISTIC"
  | "TRACE_EVIDENCE_MISSING"
  | "TRACE_TIMELINE_UNAVAILABLE"
  | "TRACE_CAUSALITY_UNAVAILABLE"
  | "TRACE_STATE_RECONSTRUCTION_UNAVAILABLE"
  | "TRACE_FORENSICS_UNAVAILABLE"
  | "TRACE_REPLAY_UNAVAILABLE"
  | "TRACE_DEPENDENCY_VIEW_INVALID"
  | "TRACE_GOVERNANCE_VIEW_INCOMPLETE"
  | "TRACE_VALIDATION_VIEW_INCOMPLETE"
  | "TRACE_VIEW_HASH_MISMATCH"
  | "TRACE_UNSUPPORTED_SOURCE_ARTIFACT";

export type TraceViewerError = Readonly<{
  code: TraceViewerErrorCode;
  message: string;
  path?: string;
  expected?: unknown;
  actual?: unknown;
}>;

export type TraceViewerWarning = Readonly<{
  code:
    | "trace-evidence-missing"
    | "trace-graph-cycle-visible"
    | "trace-graph-duplicate-edge"
    | "trace-replay-warning"
    | "trace-governance-warning";
  message: string;
  path?: string;
}>;
