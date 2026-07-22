export type TrustArchitectureAlignmentOutcome = "PASS" | "FAIL" | "PRUNED";
export type TrustLifecycleState = "DEFINED" | "DESIGNED" | "IMPLEMENTED" | "VALIDATED" | "ACTIVE" | "MONITORING" | "UNDER_REVIEW" | "SUSPENDED" | "RETIRED" | "ARCHIVED";
export type TrustOperatingStep = "Initialize" | "Configure" | "Validate" | "Activate" | "Monitor" | "Assess" | "Update" | "Suspend" | "Retire" | "Archive";
export type TrustLayer = "Constitution Layer" | "Doctrine Layer" | "Architecture Layer" | "Alignment Layer" | "Service Layer" | "Capability Layer" | "Runtime Layer";

export type TrustArchitectureAlignmentFailure =
  | "P5_0_TRUST_CONSTITUTION_MISSING"
  | "P4_20_PORTFOLIO_GOVERNANCE_INVALID"
  | "TRUST_ARCHITECTURE_MISSING"
  | "ALIGNMENT_ARCHITECTURE_MISSING"
  | "TRUST_DOMAIN_MODEL_MISSING"
  | "ALIGNMENT_DOMAIN_MODEL_MISSING"
  | "TRUST_SERVICE_MODEL_MISSING"
  | "TRUST_INTEGRATION_ARCHITECTURE_MISSING"
  | "TRUST_GOVERNANCE_INTEGRATION_MISSING"
  | "TRUST_OBSERVABILITY_ARCHITECTURE_MISSING"
  | "TRUST_OPERATING_MODEL_MISSING"
  | "TRUST_LIFECYCLE_MISSING"
  | "LIFECYCLE_TRANSITION_INVALID"
  | "LIFECYCLE_LINEAGE_MISSING"
  | "SERVICE_CONTRACTS_MISSING"
  | "ARCHITECTURE_CONTRACTS_MISSING"
  | "DEPENDENCY_MODEL_INVALID"
  | "CIRCULAR_DEPENDENCY_DETECTED"
  | "LAYER_STACK_INVALID"
  | "ALIGNMENT_FLOW_INVALID"
  | "AUTHORITY_FLOW_UPWARD"
  | "CROSS_PROGRAM_INTERFACES_MISSING"
  | "GOVERNANCE_INTEGRATION_UNSPECIFIED"
  | "REPLAY_COMPATIBILITY_MISSING"
  | "TENANT_ISOLATION_INVALID"
  | "CONSTITUTIONAL_COMPLIANCE_INVALID"
  | "DETERMINISM_INVALID"
  | "DOWNSTREAM_APPROVAL_MISSING"
  | "TRUST_EVALUATION_IMPLEMENTED"
  | "TRUST_SCORING_IMPLEMENTED"
  | "TRUST_EVIDENCE_IMPLEMENTED"
  | "TRUST_POLICY_IMPLEMENTED"
  | "RUNTIME_TRUST_DECISION_IMPLEMENTED"
  | "EXECUTION_AUTHORITY_CLAIMED"
  | "CERTIFICATION_PRUNED";

export type TrustArchitectureAlignmentScenario = "BASELINE" | TrustArchitectureAlignmentFailure;
export type TrustArchitectureAlignmentInput = Readonly<{ scenario?: TrustArchitectureAlignmentScenario; architecture_id?: string; tenant_id?: string }>;

export type TrustArchitectureAlignmentRecord = Readonly<{ record_id: string; architecture_id: string; tenant_id: string; version: "trust-architecture-alignment-foundation/v5.1"; refs: readonly string[]; governance_refs: readonly string[]; replay_refs: readonly string[]; operational: boolean; deterministic: boolean; integrity_hash: string }>;

export type TrustArchitecture = TrustArchitectureAlignmentRecord & Readonly<{ trust_constitution_ref: string; trust_domain_ref: string; alignment_domain_ref: string; trust_services_ref: string; integration_layer_ref: string; governance_layer_ref: string; observability_layer_ref: string; advisory_by_default: boolean; claims_execution_authority: boolean }>;
export type AlignmentArchitecture = TrustArchitectureAlignmentRecord & Readonly<{ alignment_flow: readonly string[]; constitutional_alignment_ref: string; governance_alignment_ref: string; operational_alignment_ref: string; mission_alignment_ref: string; behavioral_alignment_ref: string; authority_flows_upward: boolean }>;
export type TrustServiceModel = TrustArchitectureAlignmentRecord & Readonly<{ service_refs: readonly string[]; contract_obligations: readonly string[]; has_identity: boolean; has_authority: boolean; has_dependencies: boolean; has_interfaces: boolean; has_lifecycle: boolean; has_observability: boolean; has_governance_bindings: boolean; has_replay_bindings: boolean }>;
export type TrustIntegrationArchitecture = TrustArchitectureAlignmentRecord & Readonly<{ program_interface_refs: readonly string[]; cci_interface_ref: string; caf_interface_ref: string; mission_control_interface_ref: string; application_interface_ref: string; future_program_interface_ref: string; implements_cross_program_behavior: boolean }>;
export type TrustGovernanceArchitecture = TrustArchitectureAlignmentRecord & Readonly<{ constitutional_validation_ref: string; policy_integration_ref: string; authority_integration_ref: string; safety_integration_ref: string; governance_controlled: boolean; defines_trust_policy: boolean }>;
export type TrustObservabilityArchitecture = TrustArchitectureAlignmentRecord & Readonly<{ monitoring_ref: string; diagnostics_ref: string; replay_hook_refs: readonly string[]; lineage_ref: string; audit_interface_ref: string; replay_compatible: boolean; implements_trust_evidence: boolean }>;
export type TrustLifecycleModel = TrustArchitectureAlignmentRecord & Readonly<{ states: readonly TrustLifecycleState[]; operating_steps: readonly TrustOperatingStep[]; cannot_skip_states: boolean; no_regression_without_governance: boolean; preserves_lineage: boolean; preserves_evidence: boolean; supports_replay: boolean }>;
export type TrustDependencyArchitecture = TrustArchitectureAlignmentRecord & Readonly<{ dependency_stack: readonly string[]; layer_stack: readonly TrustLayer[]; circular_dependencies: boolean; layers_depend_only_on_higher_layers: boolean }>;
export type TrustBoundaryModel = Readonly<{ implements_trust_evaluation: boolean; implements_trust_scoring: boolean; implements_trust_evidence: boolean; implements_trust_policies: boolean; implements_runtime_trust_decisions: boolean; claims_execution_authority: boolean; integrity_hash: string }>;

export type TrustArchitectureAlignmentCertification = Readonly<{ certification_id: string; outcome: TrustArchitectureAlignmentOutcome; phase_ready: boolean; architecture_specified: boolean; alignment_defined: boolean; service_model_complete: boolean; lifecycle_specified: boolean; boundaries_documented: boolean; service_contracts_defined: boolean; governance_integration_specified: boolean; cross_program_interfaces_documented: boolean; dependency_architecture_validated: boolean; deterministic_rules_verified: boolean; replay_compatible: boolean; tenant_isolation_preserved: boolean; constitutional_compliance_verified: boolean; downstream_implementation_approved: boolean; no_out_of_scope_implementation: boolean; failures: readonly TrustArchitectureAlignmentFailure[]; integrity_hash: string }>;

export type TrustArchitectureAlignmentResult = Readonly<{ phase_version: "trust-architecture-alignment-foundation/v5.1"; phase_identifier: "TrustArchitectureAlignmentFoundation"; portfolio_governance_ref: "ecosystem-portfolio-governance/v4.20"; architecture: TrustArchitecture; alignment: AlignmentArchitecture; services: TrustServiceModel; integration: TrustIntegrationArchitecture; governance: TrustGovernanceArchitecture; observability: TrustObservabilityArchitecture; lifecycle: TrustLifecycleModel; dependencies: TrustDependencyArchitecture; boundary: TrustBoundaryModel; certification: TrustArchitectureAlignmentCertification; replay_hash: string; integrity_hash: string }>;

export type TrustArchitectureAlignmentValidation = Readonly<{ valid: boolean; outcome: TrustArchitectureAlignmentOutcome; replay_hash_valid: boolean; integrity_hash_valid: boolean; architecture_valid: boolean; alignment_valid: boolean; services_valid: boolean; integration_valid: boolean; governance_valid: boolean; observability_valid: boolean; lifecycle_valid: boolean; dependencies_valid: boolean; boundary_valid: boolean; certification_valid: boolean; failures: readonly TrustArchitectureAlignmentFailure[]; integrity_hash: string }>;

export type TrustArchitectureAlignmentBundle = Readonly<{ doctrine: Readonly<{ version: "trust-architecture-alignment-foundation/v5.1"; owns_trust_architecture: true; owns_alignment_architecture: true; owns_trust_lifecycle: true; owns_trust_services: true; owns_trust_operating_model: true; implements_trust_evaluation: false; implements_trust_scoring: false; implements_trust_evidence: false; implements_trust_policies: false; implements_runtime_trust_decisions: false; claims_execution_authority: false }>; result: TrustArchitectureAlignmentResult; validation: TrustArchitectureAlignmentValidation }>;
