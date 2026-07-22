export type CrossApplicationInteroperabilityOutcome = "PASS" | "FAIL" | "PRUNED";

export type CrossApplicationInteroperabilityFailure =
  | "P4_18_APPLICATION_FACTORY_INVALID"
  | "P4_17_STEVN_INVALID"
  | "P4_16_APEX_INVALID"
  | "P4_15_AURORA_INVALID"
  | "P4_14_PUBLISHER_OS_INVALID"
  | "P4_13_PBG_INVALID"
  | "P4_12_QCI_INVALID"
  | "P4_11_MISSION_CONTROL_INVALID"
  | "P4_10_OBSERVABILITY_INVALID"
  | "P4_9_REPLAY_AUDIT_INVALID"
  | "P4_8_GOVERNANCE_BINDING_INVALID"
  | "P4_6_INTEGRATION_FRAMEWORK_INVALID"
  | "CCI_MESSAGING_UNAVAILABLE"
  | "CCI_IDENTITY_UNAVAILABLE"
  | "CCI_GOVERNANCE_UNAVAILABLE"
  | "CAF_AUTHORITY_GATE_UNAVAILABLE"
  | "CAF_POLICY_GATE_UNAVAILABLE"
  | "CAF_SAFETY_GATE_UNAVAILABLE"
  | "INTEROPERABILITY_FOUNDATION_MISSING"
  | "FEDERATION_FRAMEWORK_MISSING"
  | "FEDERATION_REGISTRY_MISSING"
  | "FEDERATION_MEMBERSHIP_INVALID"
  | "COMMUNICATION_CONTRACTS_MISSING"
  | "EVENT_CONTRACTS_MISSING"
  | "REQUEST_RESPONSE_CONTRACTS_MISSING"
  | "SHARED_WORKFLOW_ORCHESTRATION_MISSING"
  | "WORKFLOW_REGISTRY_MISSING"
  | "WORKFLOW_NONDETERMINISTIC"
  | "GOVERNANCE_VALIDATORS_MISSING"
  | "AUTHORITY_VALIDATION_MISSING"
  | "POLICY_VALIDATION_MISSING"
  | "SAFETY_VALIDATION_MISSING"
  | "APPROVAL_ROUTING_MISSING"
  | "IDENTITY_PROPAGATION_MISSING"
  | "CONTEXT_TRANSFER_INVALID"
  | "TENANT_BOUNDARY_INVALID"
  | "SESSION_CONTINUITY_INVALID"
  | "FEDERATION_OBSERVABILITY_MISSING"
  | "WORKFLOW_TELEMETRY_MISSING"
  | "COLLABORATION_DIAGNOSTICS_MISSING"
  | "REPLAY_AUDIT_INTEGRATION_MISSING"
  | "EVIDENCE_LINKAGE_MISSING"
  | "WORKFLOW_LINEAGE_MISSING"
  | "CONTRACT_VALIDATION_MISSING"
  | "INTERFACE_COMPATIBILITY_INVALID"
  | "WORKFLOW_COMPATIBILITY_INVALID"
  | "GOVERNANCE_COMPATIBILITY_INVALID"
  | "FEDERATION_INTEGRITY_INVALID"
  | "CERTIFICATION_READINESS_FAILED"
  | "REPLAY_EVIDENCE_UNAVAILABLE"
  | "AUDIT_INCOMPLETE"
  | "MESSAGING_INFRASTRUCTURE_OWNERSHIP_ATTEMPTED"
  | "TRANSPORT_PROTOCOL_OWNERSHIP_ATTEMPTED"
  | "AUTHENTICATION_SERVICE_OWNERSHIP_ATTEMPTED"
  | "AUTHORIZATION_INFRASTRUCTURE_OWNERSHIP_ATTEMPTED"
  | "REPLAY_INFRASTRUCTURE_OWNERSHIP_ATTEMPTED"
  | "EVIDENCE_STORAGE_OWNERSHIP_ATTEMPTED"
  | "APPLICATION_LIFECYCLE_OWNERSHIP_ATTEMPTED"
  | "GOVERNANCE_POLICY_DEFINITION_ATTEMPTED"
  | "CERTIFICATION_EXECUTION_ATTEMPTED"
  | "CERTIFICATION_PRUNED";

export type CrossApplicationInteroperabilityScenario = "BASELINE" | CrossApplicationInteroperabilityFailure;
export type CrossApplicationInteroperabilityInput = Readonly<{ scenario?: CrossApplicationInteroperabilityScenario; federation_id?: string; tenant_id?: string }>;
export type CrossApplicationInteroperabilityLifecycleStep = "Application Discovery" | "Federation Qualification" | "Contract Validation" | "Identity Propagation" | "Authority Validation" | "Policy Validation" | "Safety Validation" | "Workflow Orchestration";

export type CrossApplicationInteroperabilityRecord = Readonly<{
  record_id: string;
  federation_id: string;
  tenant_id: string;
  version: "cross-application-interoperability/v4.19";
  refs: readonly string[];
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  operational: boolean;
  deterministic: boolean;
  integrity_hash: string;
}>;

export type InteroperabilityFoundation = CrossApplicationInteroperabilityRecord & Readonly<{ collaboration_model_ref: string; communication_standard_refs: readonly string[]; federation_principles_ref: string; owns_messaging_infrastructure: boolean; owns_transport_protocols: boolean }>;
export type FederationFramework = CrossApplicationInteroperabilityRecord & Readonly<{ federation_registry_ref: string; membership_rule_refs: readonly string[]; federation_lifecycle: readonly CrossApplicationInteroperabilityLifecycleStep[]; membership_valid: boolean }>;
export type CommunicationContracts = CrossApplicationInteroperabilityRecord & Readonly<{ interaction_pattern_refs: readonly string[]; event_contract_refs: readonly string[]; request_response_contract_refs: readonly string[]; compatible: boolean }>;
export type SharedWorkflowOrchestration = CrossApplicationInteroperabilityRecord & Readonly<{ workflow_orchestrator_ref: string; workflow_registry_ref: string; execution_model_ref: string; orchestration_policy_refs: readonly string[]; deterministic_workflows: boolean }>;
export type InteroperabilityGovernance = CrossApplicationInteroperabilityRecord & Readonly<{ authority_validator_ref: string; policy_validator_ref: string; safety_validator_ref: string; approval_rule_refs: readonly string[]; governance_verified: boolean; defines_policy: boolean }>;
export type IdentityContextPropagation = CrossApplicationInteroperabilityRecord & Readonly<{ identity_propagation_ref: string; context_transfer_rule_refs: readonly string[]; tenant_boundary_ref: string; session_continuity_ref: string; context_valid: boolean }>;
export type FederationObservability = CrossApplicationInteroperabilityRecord & Readonly<{ dashboard_ref: string; workflow_telemetry_ref: string; collaboration_diagnostics_ref: string; federation_metrics_ref: string; observable: boolean }>;
export type ReplayAuditIntegration = CrossApplicationInteroperabilityRecord & Readonly<{ federation_replay_ref: string; workflow_audit_report_ref: string; evidence_linkage_refs: readonly string[]; workflow_lineage_ref: string; replayable: boolean; owns_replay_infrastructure: boolean; owns_evidence_storage: boolean }>;
export type ContractValidation = CrossApplicationInteroperabilityRecord & Readonly<{ interface_compatibility: boolean; workflow_compatibility: boolean; governance_compatibility: boolean; dependency_verified: boolean; federation_integrity: boolean }>;
export type CertificationReadiness = CrossApplicationInteroperabilityRecord & Readonly<{ federation_integrity_ready: boolean; workflow_determinism_ready: boolean; governance_enforcement_ready: boolean; tenant_isolation_ready: boolean; observability_ready: boolean; replay_evidence_ready: boolean; audit_complete: boolean; ready: boolean }>;

export type CrossApplicationInteroperabilityCertification = Readonly<{
  certification_id: string;
  outcome: CrossApplicationInteroperabilityOutcome;
  phase_ready: boolean;
  foundation_ready: boolean;
  federation_ready: boolean;
  communication_ready: boolean;
  workflows_ready: boolean;
  governance_ready: boolean;
  identity_ready: boolean;
  observability_ready: boolean;
  replay_audit_ready: boolean;
  contracts_valid: boolean;
  certification_ready: boolean;
  no_out_of_scope_ownership: boolean;
  failures: readonly CrossApplicationInteroperabilityFailure[];
  integrity_hash: string;
}>;

export type CrossApplicationInteroperabilityResult = Readonly<{
  phase_version: "cross-application-interoperability/v4.19";
  phase_identifier: "CrossApplicationInteroperability";
  application_factory_ref: "application-factory/v4.18";
  foundation: InteroperabilityFoundation;
  federation: FederationFramework;
  communication: CommunicationContracts;
  workflows: SharedWorkflowOrchestration;
  governance: InteroperabilityGovernance;
  identity: IdentityContextPropagation;
  observability: FederationObservability;
  replay_audit: ReplayAuditIntegration;
  validation: ContractValidation;
  readiness: CertificationReadiness;
  certification: CrossApplicationInteroperabilityCertification;
  replay_hash: string;
  integrity_hash: string;
}>;

export type CrossApplicationInteroperabilityValidation = Readonly<{
  valid: boolean;
  outcome: CrossApplicationInteroperabilityOutcome;
  replay_hash_valid: boolean;
  integrity_hash_valid: boolean;
  foundation_valid: boolean;
  federation_valid: boolean;
  communication_valid: boolean;
  workflows_valid: boolean;
  governance_valid: boolean;
  identity_valid: boolean;
  observability_valid: boolean;
  replay_audit_valid: boolean;
  contract_validation_valid: boolean;
  readiness_valid: boolean;
  certification_valid: boolean;
  failures: readonly CrossApplicationInteroperabilityFailure[];
  integrity_hash: string;
}>;

export type CrossApplicationInteroperabilityBundle = Readonly<{
  doctrine: Readonly<{ version: "cross-application-interoperability/v4.19"; owns_application_federation: true; owns_shared_workflows: true; owns_interoperability: true; owns_orchestration: true; owns_messaging_infrastructure: false; owns_transport_protocols: false; owns_authentication_services: false; owns_authorization_infrastructure: false; owns_replay_infrastructure: false; owns_evidence_storage: false; owns_application_lifecycle: false; owns_governance_policy_definition: false; owns_certification_execution: false }>;
  result: CrossApplicationInteroperabilityResult;
  validation: CrossApplicationInteroperabilityValidation;
}>;
