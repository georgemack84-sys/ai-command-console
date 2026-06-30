export type VisibilitySurface = "TRUTH_DASHBOARD" | "REPLAY_VIEWER" | "LEDGER_EXPLORER" | "INTEGRITY_STATUS_VIEWER";
export type VisibilityCapability = "RECOMMENDATION_DISPLAY" | "DECISION_DISPLAY" | "EVIDENCE_DISPLAY" | "LINEAGE_DISPLAY" | "REPLAY_DISPLAY" | "LEDGER_NAVIGATION" | "INTEGRITY_DISPLAY" | "HASH_CHAIN_DISPLAY" | "TAMPER_DISPLAY" | "VERIFICATION_DISPLAY" | "CERTIFICATION_DISPLAY" | "GOVERNANCE_DISPLAY" | "AUDIT_LOGGING" | "REDACTION" | "FAIL_CLOSED";
export type VisibilityCheckState = "PASS" | "WARN" | "FAIL" | "BLOCKED" | "NOT_APPLICABLE";
export type VisibilityCertificationState = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type VisibilityGateState = "READY" | "RUNNING" | "PARTIAL" | "BLOCKED" | "PASSED" | "CONDITIONAL_PASSED" | "FAILED" | "ERROR" | "FAIL_CLOSED";
export type VisibilitySeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type VisibilityCertificationGateContract = Readonly<{
  certification_gate_id: string;
  tenant_id: string;
  certification_run_id: string;
  operator_id?: string;
  scope: Readonly<{
    surfaces: readonly VisibilitySurface[];
    mission_ids?: readonly string[];
    truth_record_ids?: readonly string[];
    replay_ids?: readonly string[];
    ledger_entry_ids?: readonly string[];
    evidence_ids?: readonly string[];
    lineage_refs?: readonly string[];
    time_range?: Readonly<{ from: string; to: string }>;
  }>;
  required_capabilities: Readonly<Record<"recommendations_visible" | "decisions_visible" | "evidence_visible" | "lineage_visible" | "replay_visible" | "ledger_navigation_visible" | "integrity_visible" | "governance_visible" | "audit_visible", boolean>>;
  governance_requirements: Readonly<{
    tenant_isolation_required: boolean;
    operator_access_required: boolean;
    restricted_records_controlled: boolean;
    read_only_required: boolean;
    mutation_blocked: boolean;
    approval_blocked: boolean;
    execution_blocked: boolean;
    repair_blocked: boolean;
    governance_override_blocked: boolean;
    fail_closed_required: boolean;
  }>;
  determinism_requirements: Readonly<{
    query_results_deterministic: boolean;
    rendering_order_stable: boolean;
    filtering_deterministic: boolean;
    redaction_deterministic: boolean;
    certification_replayable: boolean;
  }>;
  certification_states: Readonly<{ allowed_states: readonly VisibilityCertificationState[] }>;
}>;

export type VisibilityCertificationTarget = Readonly<{
  target_id: string;
  surface: VisibilitySurface;
  capability: VisibilityCapability;
  required: boolean;
  certification_state: VisibilityCheckState;
  evidence_refs: readonly string[];
  failure_refs: readonly string[];
}>;

export type VisibilityDeterminismCheck = Readonly<{
  check_id: string;
  surface: VisibilitySurface | "CROSS_SURFACE";
  query_ref: string;
  first_result_hash: string;
  second_result_hash: string;
  result_match: boolean;
  ordering_match: boolean;
  redaction_match: boolean;
  warning_match: boolean;
  certification_result: "PASS" | "WARN" | "FAIL";
}>;

export type SurfaceCertificationResult = Readonly<{
  surface: VisibilitySurface;
  state: VisibilityCertificationState;
  required_targets: number;
  passed_targets: number;
  warning_targets: number;
  failed_targets: number;
  targets: readonly VisibilityCertificationTarget[];
  evidence_refs: readonly string[];
  failure_refs: readonly string[];
  warning_refs: readonly string[];
}>;

export type VisibilityCertificationRemediation = Readonly<{
  remediation_id: string;
  certification_run_id: string;
  tenant_id: string;
  failed_check: string;
  severity: VisibilitySeverity;
  affected_surface: VisibilitySurface | "CROSS_SURFACE";
  issue_summary: string;
  required_fix: "ADD_MISSING_DISPLAY" | "FIX_ACCESS_CONTROL" | "FIX_REDACTION" | "REMOVE_MUTATION_PATH" | "BLOCK_EXECUTION_PATH" | "ENFORCE_QUERY_LAYER" | "FIX_DETERMINISM" | "ADD_WARNING" | "BLOCK_TRUSTED_INTERPRETATION" | "ADD_AUDIT_EVENT" | "FIX_FAIL_CLOSED_BEHAVIOR" | "REMOVE_GOVERNANCE_OVERRIDE";
  certification_blocking: boolean;
}>;

export type VisibilityCertificationReport = Readonly<{
  report_id: string;
  certification_run_id: string;
  tenant_id: string;
  generated_at: string;
  summary: string;
  surface_results: readonly SurfaceCertificationResult[];
  determinism_checks: readonly VisibilityDeterminismCheck[];
  failures: readonly VisibilityCertificationTarget[];
  warnings: readonly VisibilityCertificationTarget[];
  remediation: readonly VisibilityCertificationRemediation[];
  evidence_refs: readonly string[];
  audit_refs: readonly string[];
}>;

export type VisibilityCertificationLedgerEntry = Readonly<{
  ledger_entry_id: string;
  certification_run_id: string;
  tenant_id: string;
  certification_state: VisibilityCertificationState;
  report_ref: string;
  evidence_refs: readonly string[];
  audit_refs: readonly string[];
  appendOnly: true;
  mutationAllowed: false;
}>;

export type VisibilityCertificationResult = Readonly<{
  certification_run_id: string;
  certification_state: VisibilityCertificationState;
  gate_state: VisibilityGateState;
  tenant_id: string;
  operator_id: string;
  generated_at: string;
  surface_results: readonly SurfaceCertificationResult[];
  targets: readonly VisibilityCertificationTarget[];
  determinism_checks: readonly VisibilityDeterminismCheck[];
  failures: readonly VisibilityCertificationTarget[];
  warnings: readonly VisibilityCertificationTarget[];
  remediation: readonly VisibilityCertificationRemediation[];
  report: VisibilityCertificationReport;
  ledger_entry: VisibilityCertificationLedgerEntry;
  evidence_refs: readonly string[];
  audit_events: readonly VisibilityCertificationAuditEvent[];
  readOnly: true;
  mutationAllowed: false;
  approvalAllowed: false;
  executionAllowed: false;
  repairAllowed: false;
  governanceOverrideAllowed: false;
}>;

export type VisibilityCertificationAuditEvent = Readonly<{
  audit_event_id: string;
  certification_gate_id: string;
  certification_run_id: string;
  tenant_id: string;
  operator_id: string;
  event_type: "VISIBILITY_CERTIFICATION_OPENED" | "VISIBILITY_CERTIFICATION_RUN_STARTED" | "VISIBILITY_CERTIFICATION_RESULT_VIEWED" | "SURFACE_RESULT_VIEWED" | "FAILURE_VIEWED" | "WARNING_VIEWED" | "REMEDIATION_VIEWED" | "REPORT_VIEWED" | "EVIDENCE_VIEWED" | "AUDIT_EVENT_RECORDED";
  target_ref?: string;
  timestamp: string;
  appendOnly: true;
  sourceMutationAllowed: false;
}>;

export type VisibilityCertificationView = Readonly<{
  contract: VisibilityCertificationGateContract;
  result: VisibilityCertificationResult;
  guardrails: readonly string[];
  generated_at: string;
}>;
