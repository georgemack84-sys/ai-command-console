export type TrustRecoveryOutcome = "PASS" | "FAIL" | "REQUIRES_GOVERNANCE_REVIEW";
export type TrustLifecycleStanding = "ACTIVE" | "SUSPENDED" | "REVOKED" | "EXPIRED" | "RESTORED" | "FAIL_CLOSED";
export type RuntimeStandingSentinel = "UNKNOWN";
export type RestorationDecision = "RESTORE" | "REQUIRE_MORE_EVIDENCE" | "REQUIRE_GOVERNANCE_REVIEW" | "REQUIRE_SAFETY_REVIEW" | "REQUIRE_REQUALIFICATION" | "DENY" | "FAIL_CLOSED";

export type TrustRecoveryFailure =
  | "P5_14_DRIFT_DETECTION_INVALID"
  | "RECOVERY_FRAMEWORK_MISSING"
  | "SUSPENSION_MANAGEMENT_MISSING"
  | "REVOCATION_MANAGEMENT_MISSING"
  | "RECOVERY_PLANNING_MISSING"
  | "RESTORATION_EVIDENCE_COLLECTION_MISSING"
  | "REQUALIFICATION_INITIATION_MISSING"
  | "RESTORATION_DECISION_ENGINE_MISSING"
  | "GOVERNANCE_APPROVAL_MISSING"
  | "RECOVERY_OBSERVABILITY_MISSING"
  | "AUDIT_LINEAGE_MISSING"
  | "TRUST_SELF_RESTORED"
  | "HISTORIC_EVIDENCE_ONLY"
  | "NEW_EVIDENCE_MISSING"
  | "GOVERNANCE_APPROVAL_ABSENT"
  | "SAFETY_APPROVAL_ABSENT"
  | "CONSTITUTIONAL_VIOLATION_UNRESOLVED"
  | "DRIFT_UNRESOLVED"
  | "REMEDIATION_INCOMPLETE"
  | "RECOVERY_EVIDENCE_MISSING"
  | "RECOVERY_EVIDENCE_STALE"
  | "RECOVERY_EVIDENCE_CONFLICTING"
  | "RECOVERY_EVIDENCE_UNVERIFIABLE"
  | "RECOVERY_REPLAY_FAILED"
  | "UNKNOWN_PERSISTED"
  | "UNKNOWN_NOT_FAIL_CLOSED"
  | "SUSPENSION_RECORD_MISSING"
  | "REVOCATION_RECORD_MISSING"
  | "RECOVERY_PLAN_MISSING"
  | "REQUALIFICATION_REQUEST_MISSING"
  | "RESTORATION_DECISION_MISSING"
  | "RECOVERY_DASHBOARD_MISSING"
  | "IMMUTABLE_AUDIT_MISSING"
  | "TRACEABILITY_INCOMPLETE"
  | "GOVERNANCE_REVIEW_REQUIRED";

export type TrustRecoveryScenario = "BASELINE" | TrustRecoveryFailure;
export type TrustRecoveryInput = Readonly<{ scenario?: TrustRecoveryScenario; trust_id?: string; tenant_id?: string }>;

export type SuspensionRecord = Readonly<{ suspension_id: string; trust_id: string; reason: string; authority: string; evidence_refs: readonly string[]; scope: string; standing: "SUSPENDED"; integrity_hash: string }>;
export type RevocationRecord = Readonly<{ revocation_id: string; trust_id: string; authority: string; permanent_removal: boolean; remediation_tracking: readonly string[]; lineage_refs: readonly string[]; standing: "REVOKED"; integrity_hash: string }>;
export type RecoveryPlan = Readonly<{ plan_id: string; failed_controls: readonly string[]; required_remediation: readonly string[]; missing_evidence: readonly string[]; governance_approvals: readonly string[]; safety_requirements: readonly string[]; verification_activities: readonly string[]; requalification_requirements: readonly string[]; deterministic: boolean; integrity_hash: string }>;
export type RestorationEvidencePackage = Readonly<{ package_id: string; evidence_refs: readonly string[]; new_evidence_refs: readonly string[]; constitutional: boolean; governance: boolean; safety: boolean; operational: boolean; trust: boolean; alignment: boolean; monitoring: boolean; drift_resolution: boolean; audit: boolean; verifiable: boolean; integrity_hash: string }>;
export type RequalificationRequest = Readonly<{ request_id: string; recovery_plan_ref: string; restoration_evidence_ref: string; trust_evaluation_required: boolean; alignment_verification_required: boolean; compliance_verification_required: boolean; safety_qualification_required: boolean; package_complete: boolean; integrity_hash: string }>;
export type RestorationApproval = Readonly<{ approval_id: string; operator_review: boolean; governance_approval: boolean; constitutional_validation: boolean; safety_validation: boolean; automatic_restoration: boolean; integrity_hash: string }>;
export type RecoveryDecisionRecord = Readonly<{ decision_id: string; decision: RestorationDecision; rationale: string; deterministic: boolean; explainable: boolean; reproducible: boolean; constitutionally_compliant: boolean; integrity_hash: string }>;
export type RecoveryObservability = Readonly<{ dashboard_id: string; suspended_trust_visible: boolean; revoked_trust_visible: boolean; expired_trust_visible: boolean; recovery_progress_visible: boolean; restoration_backlog_visible: boolean; pending_approvals_visible: boolean; requalification_latency_visible: boolean; integrity_hash: string }>;
export type RecoveryAuditRecord = Readonly<{ audit_id: string; suspension_lineage: readonly string[]; revocation_lineage: readonly string[]; recovery_lineage: readonly string[]; restoration_lineage: readonly string[]; requalification_lineage: readonly string[]; approval_lineage: readonly string[]; immutable: boolean; replay_refs: readonly string[]; integrity_hash: string }>;
export type RecoveryFrameworkState = Readonly<{ framework_id: string; recovery_lifecycle: boolean; restoration_lifecycle: boolean; suspension_model: boolean; revocation_model: boolean; expiration_model: boolean; recovery_contracts: boolean; integrity_hash: string }>;
export type TrustRecoveryCertification = Readonly<{ certification_id: string; outcome: TrustRecoveryOutcome; phase_ready: boolean; suspension_lifecycle_implemented: boolean; revocation_lifecycle_auditable: boolean; expiration_handling_supported: boolean; unknown_runtime_only: boolean; recovery_plans_deterministic: boolean; restoration_evidence_traceable: boolean; governance_approval_mandatory: boolean; safety_validation_gates_restoration: boolean; requalification_initiated: boolean; replayable_with_audit_lineage: boolean; decisions_explainable_and_compliant: boolean; invalid_evidence_fail_closed: boolean; failures: readonly TrustRecoveryFailure[]; integrity_hash: string }>;
export type TrustRecoveryResult = Readonly<{ phase_version: "trust-recovery-revocation/v5.15"; phase_identifier: "TrustRecoveryRevocation"; drift_detection_ref: "trust-drift-detection/v5.14"; framework: RecoveryFrameworkState; suspension: SuspensionRecord; revocation: RevocationRecord; plan: RecoveryPlan; evidence: RestorationEvidencePackage; requalification: RequalificationRequest; approval: RestorationApproval; decision: RecoveryDecisionRecord; observability: RecoveryObservability; audit: RecoveryAuditRecord; certification: TrustRecoveryCertification; replay_hash: string; integrity_hash: string }>;
export type TrustRecoveryValidation = Readonly<{ valid: boolean; outcome: TrustRecoveryOutcome; replay_hash_valid: boolean; integrity_hash_valid: boolean; framework_valid: boolean; suspension_valid: boolean; revocation_valid: boolean; plan_valid: boolean; evidence_valid: boolean; requalification_valid: boolean; approval_valid: boolean; decision_valid: boolean; observability_valid: boolean; audit_valid: boolean; certification_valid: boolean; failures: readonly TrustRecoveryFailure[]; integrity_hash: string }>;
export type TrustRecoveryBundle = Readonly<{ doctrine: Readonly<{ version: "trust-recovery-revocation/v5.15"; owns_trust_suspension: true; owns_trust_revocation: true; owns_trust_restoration: true; owns_trust_recovery: true; owns_requalification_initiation: true; self_restores_trust: false; persists_unknown: false }>; result: TrustRecoveryResult; validation: TrustRecoveryValidation }>;
