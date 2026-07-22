export type TrustContractRestrictionPolicyOutcome = "PASS" | "FAIL" | "REQUIRES_GOVERNANCE_REVIEW" | "REQUIRES_OPERATOR_REVIEW";
export type TrustContractStatus = "DRAFT" | "UNDER_REVIEW" | "APPROVED" | "PENDING_ACTIVATION" | "ACTIVE" | "RESTRICTED" | "SUSPENDED" | "TERMINATED" | "EXPIRED" | "SUPERSEDED" | "RETIRED" | "ARCHIVED";
export type TrustStandingRestrictionPolicyStatus = "DRAFT" | "REVIEW" | "APPROVED" | "ACTIVE" | "SUSPENDED" | "SUPERSEDED" | "RETIRED" | "ARCHIVED";
export type RestrictionResolutionStatus = "RESOLVED" | "RESOLVED_WITH_ADDITIONAL_RESTRICTIONS" | "REQUIRES_OPERATOR_REVIEW" | "REQUIRES_GOVERNANCE_REVIEW" | "CONFLICT_DETECTED" | "POLICY_MISSING" | "POLICY_EXPIRED" | "CONTRACT_INVALID" | "FAIL_CLOSED";
export type TrustAutonomyRestrictionClass = "NO_AUTONOMY" | "OBSERVATION_ONLY" | "ADVISORY_ONLY" | "RECOMMENDATION_ONLY" | "PLANNING_ONLY" | "OPERATOR_APPROVAL_REQUIRED" | "BOUNDED_AUTONOMY" | "CONTRACT_DEFINED_AUTONOMY" | "AUTONOMY_SUSPENDED";
export type TrustStanding = "UNVERIFIED" | "PROVISIONALLY_TRUSTED" | "TRUSTED_WITH_RESTRICTIONS" | "TRUSTED" | "DEGRADED" | "SUSPENDED" | "REVOKED" | "EXPIRED";

export type TrustContractRestrictionPolicyFailure =
  | "P5_0_TRUST_CONSTITUTION_INVALID"
  | "P5_1_TRUST_ARCHITECTURE_INVALID"
  | "P5_2_TRUST_REGISTRY_INVALID"
  | "TRUST_CONTRACT_MODEL_MISSING"
  | "TRUST_CONTRACT_LIFECYCLE_INVALID"
  | "TRUST_CONTRACT_SCHEMA_INVALID"
  | "TRUST_CONTRACT_CROSSES_TENANT_BOUNDARY"
  | "TRUST_DOMAIN_APPLICABILITY_IMPLICIT"
  | "TRUST_BOUNDARY_APPLICABILITY_MISSING"
  | "TRUST_CONTRACT_GRANTS_AUTHORITY"
  | "TRUST_STANDING_AUTHORIZES_EXECUTION"
  | "STANDING_RESTRICTION_POLICY_MISSING"
  | "STANDING_POLICY_NOT_ACTIVE"
  | "STANDING_RESTRICTION_MODEL_INVALID"
  | "STANDING_VOCABULARY_REDEFINED"
  | "STANDING_LIFECYCLE_CONFUSED"
  | "LIFECYCLE_RESTRICTION_MODEL_INVALID"
  | "AUTONOMY_RESTRICTION_MODEL_INVALID"
  | "AUTONOMY_CEILING_EXPANDS_AUTHORITY"
  | "RESTRICTION_PRECEDENCE_INVALID"
  | "MONOTONIC_COMPOSITION_INVALID"
  | "LOWER_PRECEDENCE_WEAKENS_HIGHER"
  | "UNKNOWN_POLICY_DOES_NOT_FAIL_CLOSED"
  | "MISSING_POLICY_DOES_NOT_FAIL_CLOSED"
  | "EXPIRED_POLICY_DOES_NOT_FAIL_CLOSED"
  | "RESTRICTION_EXCEPTION_UNGOVERNED"
  | "EXCEPTION_OVERRIDES_CONSTITUTION"
  | "VERSION_LINEAGE_MUTABLE"
  | "SILENT_CONTRACT_MUTATION"
  | "REGISTRY_CONTRACTS_MISSING"
  | "REGISTRY_TENANT_PARTITION_INVALID"
  | "EVIDENCE_REQUIREMENTS_INCOMPLETE"
  | "REPLAY_CONTRACT_INVALID"
  | "DETERMINISTIC_RESOLUTION_INVALID"
  | "RUNTIME_ENFORCEMENT_IMPLEMENTED"
  | "POLICY_ENGINE_EXECUTION_IMPLEMENTED"
  | "TRUST_SCORING_IMPLEMENTED"
  | "TRUST_EVALUATION_IMPLEMENTED"
  | "SECURITY_MODEL_INVALID"
  | "OBSERVABILITY_MODEL_INVALID"
  | "GOVERNANCE_REVIEW_REQUIRED"
  | "OPERATOR_REVIEW_REQUIRED";

export type TrustContractRestrictionPolicyScenario = "BASELINE" | TrustContractRestrictionPolicyFailure;
export type TrustContractRestrictionPolicyInput = Readonly<{ scenario?: TrustContractRestrictionPolicyScenario; tenant_id?: string; trust_contract_id?: string; trust_domain_id?: string; trust_boundary_id?: string; subject_identity_id?: string }>;

export type TrustContractPolicyRecord = Readonly<{ record_id: string; tenant_id: string; version: "trust-contracts-restriction-policy/v5.3"; refs: readonly string[]; immutable: boolean; deterministic: boolean; integrity_hash: string }>;
export type TrustContract = TrustContractPolicyRecord & Readonly<{ trust_contract_id: string; contract_version: string; contract_type: "TENANT_CONTAINED_TRUST_RELATIONSHIP"; participating_identity_refs: readonly string[]; participating_tenant_refs: readonly string[]; participating_trust_domain_refs: readonly string[]; participating_trust_boundary_refs: readonly string[]; purpose: string; permitted_interaction_classes: readonly string[]; prohibited_interaction_classes: readonly string[]; required_trust_standings: readonly TrustStanding[]; standing_restriction_policy_refs: readonly string[]; lifecycle_restriction_policy_refs: readonly string[]; autonomy_restriction_policy_refs: readonly string[]; governance_policy_refs: readonly string[]; authority_policy_refs: readonly string[]; safety_policy_refs: readonly string[]; evidence_requirements: readonly string[]; monitoring_requirements: readonly string[]; operator_review_requirements: readonly string[]; activation_conditions: readonly string[]; suspension_conditions: readonly string[]; termination_conditions: readonly string[]; expiry_policy: string; effective_at: string; expires_at: string; supersedes_contract_id: string; contract_status: TrustContractStatus; provenance_refs: readonly string[]; grants_authority: boolean; executes_enforcement: boolean }>;
export type TrustStandingRestrictionPolicy = TrustContractPolicyRecord & Readonly<{ policy_id: string; policy_version: string; policy_name: "TrustStandingRestrictionPolicy"; trust_domain_id: string; applicable_identity_types: readonly string[]; applicable_contract_types: readonly string[]; trust_standing: TrustStanding; standing_source_refs: readonly string[]; effective_restrictions: readonly string[]; required_operator_controls: readonly string[]; required_governance_controls: readonly string[]; required_policy_controls: readonly string[]; required_safety_controls: readonly string[]; autonomy_ceiling: TrustAutonomyRestrictionClass; interaction_restrictions: readonly string[]; data_access_restrictions: readonly string[]; delegation_restrictions: readonly string[]; federation_restrictions: readonly string[]; monitoring_requirements: readonly string[]; evidence_requirements: readonly string[]; review_requirements: readonly string[]; exception_policy_refs: readonly string[]; activation_conditions: readonly string[]; release_conditions: readonly string[]; expiry_policy: string; supersedes_policy_id: string; effective_at: string; expires_at: string; status: TrustStandingRestrictionPolicyStatus; provenance_refs: readonly string[]; authorizes_execution: boolean; redefines_standing_vocabulary: boolean }>;
export type TrustStandingRestrictionMatrix = TrustContractPolicyRecord & Readonly<{ matrix_id: string; standing_vocab_ref: string; rows: readonly Readonly<{ trust_standing: TrustStanding; interaction: string; autonomy: TrustAutonomyRestrictionClass; delegation: string; federation: string; review: string; minimum_restrictions: readonly string[] }>[]; permits_tenant_strengthening: boolean; prohibits_weakening: boolean; evidence_required: boolean; approvals_required: boolean; activation_conditions_defined: boolean; release_conditions_defined: boolean; escalation_conditions_defined: boolean; integrity_hash: string }>;
export type RestrictionPrecedenceModel = Readonly<{ precedence: readonly string[]; lower_precedence_may_weaken: boolean; most_restrictive_wins: boolean; implementation_guidance_normative: boolean; integrity_hash: string }>;
export type RestrictionCompositionModel = Readonly<{ procedure_steps: readonly string[]; monotonic: boolean; unknown_data_fails_closed: boolean; missing_policy_fails_closed: boolean; expired_policy_fails_closed: boolean; conflict_fails_closed: boolean; produces_effective_restriction_set: boolean; runtime_enforcement_delegated: boolean; integrity_hash: string }>;
export type EffectiveTrustRestrictionSet = Readonly<{ restriction_set_id: string; tenant_id: string; subject_identity_id: string; trust_contract_id: string; trust_domain_refs: readonly string[]; trust_boundary_refs: readonly string[]; trust_standing: TrustStanding; standing_policy_refs: readonly string[]; lifecycle_policy_refs: readonly string[]; autonomy_policy_refs: readonly string[]; governance_restriction_refs: readonly string[]; authority_restriction_refs: readonly string[]; policy_restriction_refs: readonly string[]; safety_restriction_refs: readonly string[]; interaction_restrictions: readonly string[]; data_restrictions: readonly string[]; delegation_restrictions: readonly string[]; federation_restrictions: readonly string[]; autonomy_restrictions: readonly TrustAutonomyRestrictionClass[]; operational_restrictions: readonly string[]; required_reviews: readonly string[]; required_evidence: readonly string[]; effective_from: string; effective_until: string; resolution_status: RestrictionResolutionStatus; provenance_refs: readonly string[]; expands_permission: boolean; integrity_hash: string }>;
export type RestrictionExceptionGovernance = Readonly<{ exceptions_bounded: boolean; approving_authority_required: boolean; tenant_scope_required: boolean; domain_scope_required: boolean; identity_scope_required: boolean; expiration_required: boolean; compensating_controls_required: boolean; evidence_required: boolean; revocation_conditions_required: boolean; may_override_constitution: boolean; may_override_tenant_isolation: boolean; expired_exceptions_ignored: boolean; integrity_hash: string }>;
export type ContractPolicyRegistryModel = Readonly<{ trust_contract_registry_defined: boolean; restriction_policy_registry_defined: boolean; standing_matrix_registry_defined: boolean; tenant_partitioned: boolean; immutable_lineage: boolean; supersession_linked: boolean; integrity_verified: boolean; ownership_boundaries_defined: boolean; integrity_hash: string }>;
export type ContractPolicyGovernanceModel = Readonly<{ contract_approval_defined: boolean; amendment_governance_defined: boolean; renewal_governance_defined: boolean; suspension_governance_defined: boolean; restriction_policy_approval_defined: boolean; exception_governance_defined: boolean; material_weakening_requires_formal_approval: boolean; automatic_strengthening_allowed: boolean; automatic_weakening_prohibited: boolean; integrity_hash: string }>;
export type ContractPolicyEvidenceReplayModel = Readonly<{ evidence_refs: readonly string[]; activation_replayable: boolean; release_replayable: boolean; version_migration_replayable: boolean; immutable_audit_records: boolean; provenance_complete: boolean; integrity_hash: string }>;
export type ContractPolicySecurityObservabilityModel = Readonly<{ tenant_scoped_contract_access: boolean; domain_scoped_policy_resolution: boolean; artifact_integrity: boolean; policy_authorship_approval_separated: boolean; restricted_exception_creation: boolean; no_transitive_trust_assumption: boolean; no_cross_tenant_contract_leakage: boolean; registry_unavailable_fails_closed: boolean; metric_refs: readonly string[]; integrity_hash: string }>;
export type TrustContractRestrictionPolicyBoundary = Readonly<{ implements_runtime_enforcement: boolean; executes_policy_engine: boolean; implements_trust_scoring: boolean; implements_trust_evaluation: boolean; grants_authority: boolean; integrity_hash: string }>;
export type TrustContractRestrictionPolicyCertification = Readonly<{ certification_id: string; outcome: TrustContractRestrictionPolicyOutcome; phase_ready: boolean; trust_contract_model: boolean; trust_contract_lifecycle: boolean; standing_restriction_model: boolean; lifecycle_restriction_model: boolean; autonomy_restriction_model: boolean; restriction_precedence: boolean; monotonic_composition: boolean; tenant_isolation: boolean; trust_domain_containment: boolean; fail_closed_behavior: boolean; exception_governance: boolean; version_lineage_integrity: boolean; evidence_replay_contracts: boolean; registry_contracts: boolean; constitutional_alignment: boolean; no_out_of_scope_execution: boolean; failures: readonly TrustContractRestrictionPolicyFailure[]; integrity_hash: string }>;
export type TrustContractRestrictionPolicyResult = Readonly<{ phase_version: "trust-contracts-restriction-policy/v5.3"; phase_identifier: "TrustContractsRestrictionPolicy"; trust_constitution_ref: "trust-constitutional-foundation/v5.0"; trust_architecture_ref: "trust-architecture-alignment-foundation/v5.1"; trust_identity_boundary_ref: "trust-identity-domains-boundaries/v5.2"; trust_contract: TrustContract; standing_policy: TrustStandingRestrictionPolicy; standing_matrix: TrustStandingRestrictionMatrix; precedence: RestrictionPrecedenceModel; composition: RestrictionCompositionModel; effective_restrictions: EffectiveTrustRestrictionSet; exception_governance: RestrictionExceptionGovernance; registries: ContractPolicyRegistryModel; governance: ContractPolicyGovernanceModel; evidence_replay: ContractPolicyEvidenceReplayModel; security_observability: ContractPolicySecurityObservabilityModel; boundary: TrustContractRestrictionPolicyBoundary; certification: TrustContractRestrictionPolicyCertification; replay_hash: string; integrity_hash: string }>;
export type TrustContractRestrictionPolicyValidation = Readonly<{ valid: boolean; outcome: TrustContractRestrictionPolicyOutcome; replay_hash_valid: boolean; integrity_hash_valid: boolean; contract_valid: boolean; standing_policy_valid: boolean; standing_matrix_valid: boolean; precedence_valid: boolean; composition_valid: boolean; effective_restrictions_valid: boolean; exception_governance_valid: boolean; registries_valid: boolean; governance_valid: boolean; evidence_replay_valid: boolean; security_observability_valid: boolean; boundary_valid: boolean; certification_valid: boolean; failures: readonly TrustContractRestrictionPolicyFailure[]; integrity_hash: string }>;
export type TrustContractRestrictionPolicyBundle = Readonly<{ doctrine: Readonly<{ version: "trust-contracts-restriction-policy/v5.3"; owns_trust_contracts: true; owns_restriction_policy: true; owns_standing_restrictions: true; owns_lifecycle_restrictions: true; owns_autonomy_restrictions: true; owns_restriction_composition: true; implements_runtime_enforcement: false; executes_policy_engine: false; calculates_trust_standing: false; grants_authority: false }>; result: TrustContractRestrictionPolicyResult; validation: TrustContractRestrictionPolicyValidation }>;
