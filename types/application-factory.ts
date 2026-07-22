export type ApplicationFactoryOutcome = "PASS" | "FAIL" | "PRUNED";

export type ApplicationFactoryFailure =
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
  | "P4_7_EVIDENCE_GOVERNANCE_INVALID"
  | "P4_6_INTEGRATION_FRAMEWORK_INVALID"
  | "P4_5_LIFECYCLE_CERTIFICATION_INVALID"
  | "P4_4_IDENTITY_NAMESPACE_INVALID"
  | "P4_3_CAPABILITY_MAPPING_INVALID"
  | "P4_2_REGISTRY_CATALOG_INVALID"
  | "P4_1_CONSTITUTION_INVALID"
  | "FACTORY_ARCHITECTURE_MISSING"
  | "GENERATION_PIPELINE_MISSING"
  | "TEMPLATE_REGISTRY_MISSING"
  | "TEMPLATE_NOT_APPROVED"
  | "TEMPLATE_LINEAGE_MISSING"
  | "BLUEPRINT_LIBRARY_MISSING"
  | "BLUEPRINT_NOT_APPROVED"
  | "COMPOSITION_INVALID"
  | "BOOTSTRAP_ENGINE_MISSING"
  | "BOOTSTRAP_NONDETERMINISTIC"
  | "NAMESPACE_GENERATION_INVALID"
  | "IDENTITY_INITIALIZATION_INVALID"
  | "CAPABILITY_COMPOSITION_INVALID"
  | "CONTRACT_GENERATION_MISSING"
  | "CONSTITUTIONAL_INHERITANCE_MISSING"
  | "GOVERNANCE_INHERITANCE_MISSING"
  | "AUTHORITY_INHERITANCE_MISSING"
  | "LIFECYCLE_INHERITANCE_MISSING"
  | "REGISTRY_REGISTRATION_MISSING"
  | "INTEGRATION_CONTRACTS_MISSING"
  | "EVIDENCE_INITIALIZATION_MISSING"
  | "OBSERVABILITY_INITIALIZATION_MISSING"
  | "PROMOTION_PIPELINE_MISSING"
  | "PROMOTION_APPROVAL_MISSING"
  | "PROMOTION_READINESS_INVALID"
  | "FACTORY_GOVERNANCE_MISSING"
  | "FACTORY_AUDIT_MISSING"
  | "REPLAY_EVIDENCE_MISSING"
  | "REPLAY_NONDETERMINISTIC"
  | "FACTORY_OBSERVABILITY_MISSING"
  | "DIAGNOSTICS_MISSING"
  | "TENANT_ISOLATION_INVALID"
  | "ARTIFACT_INTEGRITY_INVALID"
  | "PROMOTION_AUTHORIZATION_INVALID"
  | "INTEROPERABILITY_INVALID"
  | "QUALIFICATION_FAILED"
  | "PLATFORM_ARCHITECTURE_OWNERSHIP_ATTEMPTED"
  | "GOVERNANCE_ENGINE_OWNERSHIP_ATTEMPTED"
  | "REGISTRY_ENGINE_OWNERSHIP_ATTEMPTED"
  | "CERTIFICATION_ENGINE_OWNERSHIP_ATTEMPTED"
  | "REPLAY_ENGINE_OWNERSHIP_ATTEMPTED"
  | "EVIDENCE_STORAGE_OWNERSHIP_ATTEMPTED"
  | "CERTIFICATION_PRUNED";

export type ApplicationFactoryScenario = "BASELINE" | ApplicationFactoryFailure;
export type ApplicationFactoryInput = Readonly<{ scenario?: ApplicationFactoryScenario; factory_id?: string; tenant_id?: string; application_slug?: string }>;

export type ApplicationFactoryRecord = Readonly<{
  record_id: string;
  factory_id: string;
  tenant_id: string;
  version: "application-factory/v4.18";
  refs: readonly string[];
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  operational: boolean;
  deterministic: boolean;
  integrity_hash: string;
}>;

export type ApplicationFactoryFoundation = ApplicationFactoryRecord & Readonly<{ generation_pipeline_ref: string; template_registry_ref: string; bootstrap_orchestrator_ref: string; owns_platform_architecture: boolean; owns_governance: boolean }>;
export type ApplicationFactoryTemplates = ApplicationFactoryRecord & Readonly<{ template_refs: readonly string[]; approved_template_refs: readonly string[]; lineage_refs: readonly string[]; governed_versioning: boolean }>;
export type ApplicationFactoryBlueprints = ApplicationFactoryRecord & Readonly<{ blueprint_refs: readonly string[]; approved_blueprint_refs: readonly string[]; reusable_module_refs: readonly string[]; composition_valid: boolean }>;
export type ApplicationFactoryBootstrap = ApplicationFactoryRecord & Readonly<{ generated_application_id: string; generated_namespace: string; identity_ref: string; capability_composition_ref: string; contract_refs: readonly string[]; deterministic_bootstrap: boolean }>;
export type ApplicationFactoryInheritance = ApplicationFactoryRecord & Readonly<{ constitutional_ref: string; governance_ref: string; ownership_ref: string; authority_ref: string; lifecycle_ref: string; complete: boolean }>;
export type ApplicationFactoryIntegration = ApplicationFactoryRecord & Readonly<{ registry_ref: string; lifecycle_ref: string; integration_contract_refs: readonly string[]; evidence_ref: string; observability_ref: string; initialized: boolean }>;
export type ApplicationFactoryPromotion = ApplicationFactoryRecord & Readonly<{ promotion_workflow_ref: string; approval_ref: string; readiness_ref: string; governance_ref: string; promotion_allowed: boolean }>;
export type ApplicationFactoryGovernance = ApplicationFactoryRecord & Readonly<{ template_approval_ref: string; blueprint_approval_ref: string; bootstrap_policy_ref: string; audit_report_ref: string; governed: boolean }>;
export type ApplicationFactoryReplayEvidence = ApplicationFactoryRecord & Readonly<{ bootstrap_replay_ref: string; promotion_replay_ref: string; template_lineage_ref: string; blueprint_lineage_ref: string; replay_complete: boolean }>;
export type ApplicationFactoryObservability = ApplicationFactoryRecord & Readonly<{ dashboard_ref: string; generation_telemetry_ref: string; template_usage_ref: string; promotion_metrics_ref: string; diagnostics_ref: string; observable: boolean }>;
export type ApplicationFactorySecurity = ApplicationFactoryRecord & Readonly<{ tenant_isolation_ref: string; namespace_validation_ref: string; identity_verification_ref: string; artifact_integrity_ref: string; promotion_authorization_ref: string; secure: boolean }>;
export type ApplicationFactoryQualification = ApplicationFactoryRecord & Readonly<{ constitutional_inheritance_valid: boolean; deterministic_bootstrapping_valid: boolean; template_governance_valid: boolean; architecture_validation_valid: boolean; promotion_governance_valid: boolean; replay_complete: boolean; evidence_integrity_valid: boolean; identity_correct: boolean; namespace_isolated: boolean; observability_valid: boolean; interoperability_valid: boolean; security_valid: boolean; qualified: boolean }>;

export type ApplicationFactoryCertification = Readonly<{
  certification_id: string;
  outcome: ApplicationFactoryOutcome;
  phase_ready: boolean;
  factory_foundation_ready: boolean;
  templates_ready: boolean;
  blueprints_ready: boolean;
  bootstrap_ready: boolean;
  inheritance_ready: boolean;
  integration_ready: boolean;
  promotion_ready: boolean;
  governance_ready: boolean;
  replay_evidence_ready: boolean;
  observability_ready: boolean;
  security_ready: boolean;
  qualification_ready: boolean;
  no_out_of_scope_ownership: boolean;
  failures: readonly ApplicationFactoryFailure[];
  integrity_hash: string;
}>;

export type ApplicationFactoryResult = Readonly<{
  phase_version: "application-factory/v4.18";
  phase_identifier: "ApplicationFactory";
  stevn_ref: "stevn-application/v4.17";
  apex_ref: "apex/v4.16";
  foundation: ApplicationFactoryFoundation;
  templates: ApplicationFactoryTemplates;
  blueprints: ApplicationFactoryBlueprints;
  bootstrap: ApplicationFactoryBootstrap;
  inheritance: ApplicationFactoryInheritance;
  integration: ApplicationFactoryIntegration;
  promotion: ApplicationFactoryPromotion;
  governance: ApplicationFactoryGovernance;
  replay_evidence: ApplicationFactoryReplayEvidence;
  observability: ApplicationFactoryObservability;
  security: ApplicationFactorySecurity;
  qualification: ApplicationFactoryQualification;
  certification: ApplicationFactoryCertification;
  replay_hash: string;
  integrity_hash: string;
}>;

export type ApplicationFactoryValidation = Readonly<{
  valid: boolean;
  outcome: ApplicationFactoryOutcome;
  replay_hash_valid: boolean;
  integrity_hash_valid: boolean;
  foundation_valid: boolean;
  templates_valid: boolean;
  blueprints_valid: boolean;
  bootstrap_valid: boolean;
  inheritance_valid: boolean;
  integration_valid: boolean;
  promotion_valid: boolean;
  governance_valid: boolean;
  replay_evidence_valid: boolean;
  observability_valid: boolean;
  security_valid: boolean;
  qualification_valid: boolean;
  certification_valid: boolean;
  failures: readonly ApplicationFactoryFailure[];
  integrity_hash: string;
}>;

export type ApplicationFactoryBundle = Readonly<{
  doctrine: Readonly<{ version: "application-factory/v4.18"; owns_application_templates: true; owns_application_bootstrapping: true; owns_reusable_architectures: true; owns_application_promotion: true; owns_platform_architecture: false; owns_governance_engines: false; owns_registry_engine: false; owns_certification_engine: false; owns_replay_engine: false; owns_evidence_storage: false }>;
  result: ApplicationFactoryResult;
  validation: ApplicationFactoryValidation;
}>;
