export type PolicyManifestCertificationStatus = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type PolicyLifecycleState = "Draft" | "Certified" | "Active" | "Superseded" | "Expired" | "Revoked" | "Archived" | "Retired";
export type PolicyGovernanceClass = "STANDARD" | "REGULATED" | "CONSTITUTIONAL";
export type PolicyCategory = "RECOMMENDATION" | "STRATEGY" | "MISSION" | "PORTFOLIO" | "REGULATORY" | "ORGANIZATIONAL" | "TENANT" | "CONSTITUTIONAL" | "GOVERNANCE";
export type PolicyDependencyKind = "REQUIRED" | "OPTIONAL" | "INHERITED" | "REFERENCED" | "CONSTITUTIONAL" | "GOVERNANCE";
export type PolicyRequirementDimension = "recommendation_type" | "strategy_type" | "mission_class" | "governance_class" | "portfolio_type" | "regulatory_domain" | "organizational_domain" | "tenant_policy_class";
export type PolicyManifestFailure =
  | "POLICY_ARTIFACT_CONTRACT_INVALID"
  | "POLICY_REGISTRY_INCOMPLETE"
  | "POLICY_IDENTITY_NONDETERMINISTIC"
  | "POLICY_SET_MANIFEST_NONDETERMINISTIC"
  | "REQUIRED_POLICY_MATRIX_INCOMPLETE"
  | "MANDATORY_POLICY_MISSING"
  | "DUPLICATE_POLICY_DETECTED"
  | "DEPENDENCY_RESOLUTION_FAILURE"
  | "DEPENDENCY_CYCLE_DETECTED"
  | "COMPATIBILITY_CONFLICT"
  | "VERSION_MISMATCH"
  | "IMMUTABLE_BINDING_VIOLATION"
  | "VERSION_LINEAGE_BROKEN"
  | "SUPERSESSION_INVALID"
  | "EXPIRED_POLICY_REFERENCED"
  | "REVOKED_POLICY_REFERENCED"
  | "GOVERNANCE_APPROVAL_MISSING"
  | "CONSTITUTIONAL_APPROVAL_MISSING"
  | "MANIFEST_INTEGRITY_MISMATCH"
  | "POLICY_SUBSTITUTION_ATTEMPT"
  | "MANIFEST_MUTATION_ATTEMPT"
  | "REPLAY_RECONSTRUCTION_FAILURE"
  | "BYTE_REPLAY_MISMATCH"
  | "DEPENDENCY_GRAPH_REPLAY_MISMATCH"
  | "AUDIT_TRAIL_INCOMPLETE"
  | "TENANT_ISOLATION_BREACH"
  | "UNAUTHORIZED_CROSS_TENANT_POLICY_REUSE"
  | "OBSERVABILITY_METRICS_MISSING"
  | "OPERATIONAL_ALERTS_MISSING"
  | "INTEGRITY_MONITOR_INACTIVE";
export type PolicyManifestScenario = "BASELINE" | PolicyManifestFailure;

export type PolicyManifestInput = Readonly<{
  scenario?: PolicyManifestScenario;
  tenant_id?: string;
  recommendation_cycle_id?: string;
  mission_scope?: string;
  portfolio_scope?: string;
  governance_class?: PolicyGovernanceClass;
}>;

export type PolicyAuthorityContract = Readonly<{
  authority_id: string;
  owner: string;
  scope: string;
  can_approve: boolean;
  can_supersede: boolean;
  cross_tenant_reuse_allowed: boolean;
  integrity_hash: string;
}>;

export type PolicyLifecycleContract = Readonly<{
  lifecycle_id: string;
  state: PolicyLifecycleState;
  issued_at: string;
  effective_at: string;
  expires_at: string | null;
  supersedes: string | null;
  superseded_by: string | null;
  revoked_at: string | null;
  archival_required: boolean;
  overwrite_allowed: false;
  integrity_hash: string;
}>;

export type PolicyMetadata = Readonly<{
  policy_id: string;
  version: string;
  owner: string;
  authority_id: string;
  scope: string;
  category: PolicyCategory;
  lifecycle_state: PolicyLifecycleState;
  governance_class: PolicyGovernanceClass;
  constitutional: boolean;
  certified: boolean;
  approval_refs: readonly string[];
  dependencies: readonly Readonly<{ policy_id: string; version: string; kind: PolicyDependencyKind }>[];
  integrity_hash: string;
}>;

export type PolicyArtifact = Readonly<{
  artifact_id: string;
  tenant_id: string;
  metadata: PolicyMetadata;
  authority: PolicyAuthorityContract;
  lifecycle: PolicyLifecycleContract;
  deterministic_identity: boolean;
  immutable: boolean;
  content_hash: string;
  integrity_hash: string;
}>;

export type PolicyRegistry = Readonly<{
  registry_id: string;
  tenant_id: string;
  policies: readonly PolicyArtifact[];
  complete: boolean;
  duplicate_policy_ids: readonly string[];
  integrity_hash: string;
}>;

export type RequiredPolicyMatrix = Readonly<{
  matrix_id: string;
  context: Readonly<Record<PolicyRequirementDimension, string>>;
  required_policy_ids: readonly string[];
  complete: boolean;
  duplicate_requirements: readonly string[];
  conflicting_requirements: readonly string[];
  invalid_applicability: readonly string[];
  integrity_hash: string;
}>;

export type DependencyResolutionReport = Readonly<{
  report_id: string;
  graph: readonly Readonly<{ from_policy_id: string; to_policy_id: string; version: string; kind: PolicyDependencyKind }>[];
  missing_dependencies: readonly string[];
  cycles: readonly string[];
  incompatible_versions: readonly string[];
  authority_violations: readonly string[];
  deterministic: boolean;
  integrity_hash: string;
}>;

export type CompatibilityReport = Readonly<{
  report_id: string;
  compatible: boolean;
  conflicts: readonly string[];
  version_mismatches: readonly string[];
  tenant_violations: readonly string[];
  integrity_hash: string;
}>;

export type PolicySetManifestArtifact = Readonly<{
  manifest_id: string;
  manifest_version: "12.2.0";
  tenant_id: string;
  recommendation_cycle_id: string;
  mission_scope: string;
  portfolio_scope: string;
  governance_class: PolicyGovernanceClass;
  included_policies: readonly Readonly<{ policy_id: string; version: string; integrity_hash: string; content_hash: string }>[];
  dependency_graph: DependencyResolutionReport["graph"];
  compatibility_report: CompatibilityReport;
  completeness_report: Readonly<{ complete: boolean; missing_policy_ids: readonly string[]; duplicate_policy_ids: readonly string[]; integrity_hash: string }>;
  approval_references: readonly string[];
  creation_timestamp: string;
  sealed: true;
  integrity_hash: string;
}>;

export type RecommendationPolicyBinding = Readonly<{
  binding_id: string;
  tenant_id: string;
  recommendation_cycle_id: string;
  manifest_id: string;
  manifest_version: "12.2.0";
  manifest_integrity_hash: string;
  policy_versions: readonly Readonly<{ policy_id: string; version: string; integrity_hash: string }>[];
  dependency_graph_hash: string;
  governance_approval_refs: readonly string[];
  immutable: true;
  rebound: false;
  bound_at: string;
  integrity_hash: string;
}>;

export type PolicyVersionHistory = Readonly<{
  history_id: string;
  lineage: readonly Readonly<{ policy_id: string; version: string; state: PolicyLifecycleState; supersedes: string | null; superseded_by: string | null; integrity_hash: string }>[];
  supersession_graph_valid: boolean;
  overwrite_detected: boolean;
  integrity_hash: string;
}>;

export type GovernanceValidationReport = Readonly<{
  report_id: string;
  governance_approved: boolean;
  constitutional_approved: boolean;
  authority_ownership_valid: boolean;
  policy_applicability_valid: boolean;
  approval_signatures_valid: boolean;
  certification_status_valid: boolean;
  rejected_policy_ids: readonly string[];
  integrity_hash: string;
}>;

export type PolicyReplayValidationReport = Readonly<{
  report_id: string;
  manifest_restored: boolean;
  versions_restored: boolean;
  dependencies_restored: boolean;
  approvals_restored: boolean;
  authority_bindings_restored: boolean;
  byte_identical: boolean;
  deterministic_ordering: boolean;
  hash_reproducible: boolean;
  integrity_hash: string;
}>;

export type PolicyAuditLedger = Readonly<{
  ledger_id: string;
  append_only: boolean;
  events: readonly Readonly<{ event_id: string; type: string; subject_id: string; integrity_hash: string }>[];
  complete: boolean;
  integrity_hash: string;
}>;

export type ManifestObservabilityReport = Readonly<{
  report_id: string;
  operational_metrics: Readonly<Record<string, number>>;
  manifest_audit_events: readonly string[];
  policy_health_reports: readonly string[];
  governance_metrics: Readonly<Record<string, number>>;
  integrity_analytics: readonly string[];
  alert_conditions: readonly string[];
  metrics_operational: boolean;
  alerts_operational: boolean;
  integrity_monitor_continuous: boolean;
  integrity_hash: string;
}>;

export type PolicyManifestCertificationTest = Readonly<{
  test_id: string;
  name: string;
  expected: "PASS";
  actual: "PASS" | "FAIL";
  passed: boolean;
  failure_reason: PolicyManifestFailure | null;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type Phase122CertificationReport = Readonly<{
  certification_id: string;
  status: PolicyManifestCertificationStatus;
  production_ready: boolean;
  failures: readonly PolicyManifestFailure[];
  tests: readonly PolicyManifestCertificationTest[];
  deliverables: readonly string[];
  integrity_hash: string;
}>;

export type PolicyManifestResult = Readonly<{
  phase_version: "policy-set-manifest-immutable-binding/v12.2";
  phase_identifier: "PolicySetManifestImmutableBinding";
  policy_registry: PolicyRegistry;
  required_policy_matrix: RequiredPolicyMatrix;
  dependency_resolution: DependencyResolutionReport;
  compatibility_report: CompatibilityReport;
  manifest: PolicySetManifestArtifact;
  binding: RecommendationPolicyBinding;
  version_history: PolicyVersionHistory;
  governance_validation: GovernanceValidationReport;
  replay_validation: PolicyReplayValidationReport;
  audit_ledger: PolicyAuditLedger;
  observability: ManifestObservabilityReport;
  certification: Phase122CertificationReport;
  replay_hash: string;
  integrity_hash: string;
}>;

export type PolicyManifestValidation = Readonly<{
  manifest_id: string | null;
  valid: boolean;
  status: PolicyManifestCertificationStatus;
  production_ready: boolean;
  failures: readonly PolicyManifestFailure[];
  replay_hash_valid: boolean;
  integrity_hash_valid: boolean;
  immutable_binding_valid: boolean;
  validation_hash: string;
}>;

export type PolicyManifestContractBundle = Readonly<{
  doctrine: Readonly<{
    version: "policy-set-manifest-immutable-binding/v12.2";
    one_manifest_per_cycle: true;
    manifests_immutable: true;
    policy_versions_immutable: true;
    governance_approval_required: true;
    constitutional_approval_required: true;
    replay_uses_original_manifest: true;
  }>;
  result: PolicyManifestResult;
  validation: PolicyManifestValidation;
}>;
