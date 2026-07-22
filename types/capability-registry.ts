export type CapabilityRegistryDecision = "CAPABILITY_REGISTRY_QUALIFIED" | "CONDITIONALLY_QUALIFIED" | "NOT_QUALIFIED" | "FAIL_CLOSED";
export type CapabilityRegistryFailure =
  | "W2_0_CAF_CONSTITUTION_INVALID"
  | "W2_1_AGENT_REGISTRY_INVALID"
  | "W2_2_LIFECYCLE_ENGINE_INVALID"
  | "CAPABILITY_DEFINITION_SYSTEM_MISSING"
  | "CAPABILITY_IDENTITY_NOT_UNIQUE"
  | "CAPABILITY_IDENTITY_MUTABLE"
  | "CAPABILITY_SCHEMA_INVALID"
  | "CAPABILITY_VERSION_REGISTRY_MISSING"
  | "COMPOSITION_ENGINE_MISSING"
  | "CIRCULAR_COMPOSITION_ALLOWED"
  | "DUPLICATE_COMPOSITION_ALLOWED"
  | "UNSUPPORTED_COMPOSITION_ALLOWED"
  | "COMPOSITION_AUTHORITY_INCOMPATIBLE"
  | "COMPOSITION_LIFECYCLE_INCOMPATIBLE"
  | "DEPENDENCY_FRAMEWORK_MISSING"
  | "DEPENDENCY_GRAPH_NON_DETERMINISTIC"
  | "DEPENDENCY_CYCLE_UNDETECTED"
  | "DEPENDENCY_HEALTH_MISSING"
  | "RISK_CLASSIFICATION_MISSING"
  | "RISK_INHERITANCE_INVALID"
  | "COMPOSITION_RISK_AGGREGATION_FAILED"
  | "MITIGATION_REQUIREMENTS_MISSING"
  | "AUTHORITY_CLASSIFICATION_MISSING"
  | "AUTHORITY_BINDING_INVALID"
  | "DELEGATION_VALIDATION_FAILED"
  | "EXECUTION_ELIGIBILITY_INVALID"
  | "TOOL_BINDING_FRAMEWORK_MISSING"
  | "UNAPPROVED_TOOL_BINDING_ALLOWED"
  | "TOOL_SECURITY_APPROVAL_FAILED"
  | "TOOL_TENANT_RESTRICTION_FAILED"
  | "TOOL_TRUST_REQUIREMENT_MISSING"
  | "VALIDATION_ENGINE_MISSING"
  | "NON_COMPLIANT_CAPABILITY_ACCEPTED"
  | "NAMESPACE_VALIDATION_FAILED"
  | "REGISTRY_APIS_MISSING"
  | "REGISTRY_API_NON_DETERMINISTIC"
  | "GOVERNANCE_INTEGRATION_MISSING"
  | "GOVERNANCE_METADATA_AMBIGUOUS"
  | "CAPABILITY_EVIDENCE_MISSING"
  | "CAPABILITY_EVIDENCE_NOT_IMMUTABLE"
  | "CAPABILITY_REPLAY_INVALID"
  | "CAPABILITY_REGISTRY_QUALIFICATION_GATE_FAILED";
export type CapabilityRegistryScenario = "BASELINE" | "QUALIFIED_WITH_OBSERVATIONS" | "CONDITIONAL_FOLLOWUP" | CapabilityRegistryFailure;
export type CapabilityRegistryInput = Readonly<{ scenario?: CapabilityRegistryScenario; seed?: string }>;
export type RiskLevel = "Minimal" | "Low" | "Moderate" | "High" | "Critical";
export type AuthorityClass = "System" | "Platform" | "Tenant" | "Organization" | "Operator" | "Supervisor" | "Autonomous" | "External";
export type CapabilityDefinitionSystem = Readonly<{ system_id: string; capability_schema: boolean; metadata_repository: boolean; version_registry: boolean; immutable_identity: boolean; unique_identity: boolean; lifecycle_requirements: boolean; runtime_requirements: boolean; evidence_requirements: boolean; integrity_hash: string }>;
export type CapabilityCompositionEngine = Readonly<{ engine_id: string; hierarchical_composition: boolean; reusable_modules: boolean; inheritance: boolean; specialization: boolean; aggregation: boolean; orchestration: boolean; nested_graphs: boolean; circular_detection: boolean; duplicate_detection: boolean; unsupported_rejection: boolean; authority_compatibility: boolean; lifecycle_compatibility: boolean; integrity_hash: string }>;
export type CapabilityDependencyFramework = Readonly<{ framework_id: string; required_capabilities: boolean; optional_capabilities: boolean; runtime_services: boolean; external_services: boolean; registry_dependencies: boolean; infrastructure_dependencies: boolean; policy_dependencies: boolean; security_dependencies: boolean; dependency_lineage: boolean; deterministic_graph: boolean; cycle_free: boolean; dependency_health: boolean; integrity_hash: string }>;
export type CapabilityRiskClassification = Readonly<{ registry_id: string; categories: readonly string[]; levels: readonly RiskLevel[]; risk_inheritance: boolean; composition_risk_aggregation: boolean; policy_compatibility: boolean; mitigation_requirements: boolean; risk_matrix: boolean; integrity_hash: string }>;
export type CapabilityAuthorityClassification = Readonly<{ registry_id: string; authority_classes: readonly AuthorityClass[]; execution_authority: boolean; approval_authority: boolean; delegation_authority: boolean; escalation_authority: boolean; revocation_authority: boolean; constitutional_compliance: boolean; authority_inheritance: boolean; delegation_validation: boolean; execution_rules: boolean; integrity_hash: string }>;
export type CapabilityToolBindingFramework = Readonly<{ registry_id: string; approved_tools: boolean; apis: boolean; services: boolean; connectors: boolean; runtimes: boolean; models: boolean; external_systems: boolean; authority_compatibility: boolean; security_approval: boolean; tenant_restrictions: boolean; version_compatibility: boolean; trust_requirements: boolean; invocation_policies: boolean; integrity_hash: string }>;
export type CapabilityValidationEngine = Readonly<{ engine_id: string; schema_validation: boolean; dependency_validation: boolean; authority_validation: boolean; lifecycle_validation: boolean; composition_validation: boolean; policy_validation: boolean; tool_validation: boolean; certification_validation: boolean; namespace_validation: boolean; non_compliant_rejection: boolean; integrity_hash: string }>;
export type CapabilityRegistryApisGovernance = Readonly<{ api_id: string; register_capability: boolean; update_capability: boolean; retrieve_capability: boolean; search_capability: boolean; validate_capability: boolean; resolve_dependencies: boolean; resolve_composition: boolean; resolve_authority: boolean; resolve_tool_bindings: boolean; deterministic_results: boolean; governance_events: boolean; policy_engine_integration: boolean; safety_gate_integration: boolean; planning_engine_integration: boolean; runtime_orchestrator_integration: boolean; replay_integration: boolean; integrity_hash: string }>;
export type CapabilityRegistryEvidence = Readonly<{ ledger_id: string; records: readonly string[]; definition_evidence: boolean; composition_evidence: boolean; dependency_evidence: boolean; risk_evidence: boolean; authority_evidence: boolean; tool_binding_evidence: boolean; validation_evidence: boolean; governance_evidence: boolean; immutable: boolean; replayable: boolean; integrity_hash: string }>;
export type CapabilityRegistryQualification = Readonly<{ report_id: string; unique_immutable_identity: boolean; schema_validation: boolean; composition_validation: boolean; deterministic_cycle_free_dependencies: boolean; risk_classification_complete: boolean; authority_classification_validated: boolean; tool_binding_policy_compliant: boolean; validation_engine_qualified: boolean; deterministic_apis: boolean; governance_integration_verified: boolean; evidence_integrity: boolean; gate_decision: CapabilityRegistryDecision; integrity_hash: string }>;
export type CapabilityRegistryReadiness = Readonly<{ readiness_id: string; decision: CapabilityRegistryDecision; phase_ready: boolean; constitution_ready: boolean; agent_registry_ready: boolean; lifecycle_engine_ready: boolean; definition_ready: boolean; composition_ready: boolean; dependency_ready: boolean; risk_ready: boolean; authority_ready: boolean; tool_binding_ready: boolean; validation_ready: boolean; apis_governance_ready: boolean; evidence_ready: boolean; qualification_ready: boolean; failures: readonly CapabilityRegistryFailure[]; integrity_hash: string }>;
export type CapabilityRegistryResult = Readonly<{ phase_version: "capability-registry/w2.3"; phase_identifier: "CapabilityRegistry"; caf_constitution_ref: "caf-constitutional-foundation/w2.0"; agent_registry_ref: "agent-registry/w2.1"; lifecycle_engine_ref: "lifecycle-engine/w2.2"; definition_system: CapabilityDefinitionSystem; composition_engine: CapabilityCompositionEngine; dependency_framework: CapabilityDependencyFramework; risk_classification: CapabilityRiskClassification; authority_classification: CapabilityAuthorityClassification; tool_binding: CapabilityToolBindingFramework; validation_engine: CapabilityValidationEngine; apis_governance: CapabilityRegistryApisGovernance; evidence: CapabilityRegistryEvidence; qualification: CapabilityRegistryQualification; readiness: CapabilityRegistryReadiness; replay_hash: string; integrity_hash: string }>;
export type CapabilityRegistryValidation = Readonly<{ valid: boolean; decision: CapabilityRegistryDecision; replay_hash_valid: boolean; integrity_hash_valid: boolean; definition_valid: boolean; composition_valid: boolean; dependency_valid: boolean; risk_valid: boolean; authority_valid: boolean; tool_binding_valid: boolean; validation_engine_valid: boolean; apis_governance_valid: boolean; evidence_valid: boolean; qualification_valid: boolean; readiness_valid: boolean; failures: readonly CapabilityRegistryFailure[]; integrity_hash: string }>;
export type CapabilityRegistryBundle = Readonly<{ doctrine: Readonly<{ version: "capability-registry/w2.3"; owns_capability_definitions: true; owns_capability_composition: true; owns_capability_dependencies: true; owns_risk_classification: true; owns_authority_classification: true; owns_tool_bindings: true; owns_capability_validation: true; owns_capability_apis: true; owns_governance_integration: true; owns_capability_evidence: true; qualification_gate: "Capability Registry Qualification Gate" }>; result: CapabilityRegistryResult; validation: CapabilityRegistryValidation }>;
