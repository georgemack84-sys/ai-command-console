export type ApexOutcome = "PASS" | "FAIL" | "PRUNED";

export type ApexFailure =
  | "P4_15_AURORA_INVALID"
  | "P4_14_PUBLISHER_OS_INVALID"
  | "P4_13_PBG_INVALID"
  | "PROGRAM_1_FOUNDATION_INVALID"
  | "PROGRAM_2_CCI_INVALID"
  | "PROGRAM_3_CAF_INVALID"
  | "APEX_APPLICATION_MISSING"
  | "APPLICATION_FOUNDATION_MISSING"
  | "APPLICATION_CONSTITUTION_MISSING"
  | "PLANNING_MODEL_MISSING"
  | "EXECUTION_MODEL_MISSING"
  | "PLANNING_ENGINE_MISSING"
  | "MISSION_PLANNING_MISSING"
  | "DEPENDENCY_PLANNING_MISSING"
  | "SCHEDULING_MISSING"
  | "OBJECTIVE_DECOMPOSITION_MISSING"
  | "WORKFLOW_ENGINE_MISSING"
  | "STAGE_PROGRESSION_INVALID"
  | "DEPENDENCY_COORDINATION_INVALID"
  | "EXECUTION_COORDINATOR_MISSING"
  | "EXECUTION_STATE_INVALID"
  | "EXECUTION_MONITORING_MISSING"
  | "OPERATIONAL_DASHBOARD_MISSING"
  | "WORKFLOW_VISUALIZATION_MISSING"
  | "PROGRESS_MONITORING_MISSING"
  | "COLLABORATION_WORKSPACE_MISSING"
  | "CAF_COLLABORATION_INVALID"
  | "APPROVAL_COLLABORATION_MISSING"
  | "GOVERNANCE_INTEGRATION_MISSING"
  | "AUTHORITY_GATE_NOT_BOUND"
  | "POLICY_GATE_NOT_BOUND"
  | "SAFETY_GATE_NOT_BOUND"
  | "APPROVAL_ROUTING_MISSING"
  | "EVIDENCE_INTEGRATION_MISSING"
  | "WORKFLOW_EVIDENCE_MISSING"
  | "PLANNING_EVIDENCE_INDEX_MISSING"
  | "REPLAY_INTEGRATION_MISSING"
  | "BEHAVIORAL_REPLAY_NOT_CONSUMED"
  | "OBSERVABILITY_MISSING"
  | "DIAGNOSTICS_MISSING"
  | "LIFECYCLE_RECORDS_MISSING"
  | "CERTIFICATION_RECORDS_MISSING"
  | "TENANT_ISOLATION_INVALID"
  | "SECURITY_BOUNDARIES_INVALID"
  | "PERFORMANCE_REPORT_MISSING"
  | "SCALABILITY_INVALID"
  | "INTEGRATION_REPORT_MISSING"
  | "INTEROPERABILITY_INVALID"
  | "PRODUCTION_READINESS_MISSING"
  | "QUALIFICATION_FAILED"
  | "IDENTITY_OWNERSHIP_ATTEMPTED"
  | "GOVERNANCE_ENGINE_ATTEMPTED"
  | "AUTHORITY_ENFORCEMENT_ATTEMPTED"
  | "POLICY_ENFORCEMENT_ATTEMPTED"
  | "SAFETY_ENFORCEMENT_ATTEMPTED"
  | "REPLAY_ENGINE_ATTEMPTED"
  | "AUDIT_ENGINE_ATTEMPTED"
  | "EVIDENCE_STORAGE_ATTEMPTED"
  | "CERTIFICATION_ENGINE_ATTEMPTED"
  | "MESSAGING_INFRASTRUCTURE_ATTEMPTED"
  | "OBSERVABILITY_PLATFORM_ATTEMPTED"
  | "REGISTRY_INFRASTRUCTURE_ATTEMPTED"
  | "CERTIFICATION_PRUNED";

export type ApexScenario = "BASELINE" | ApexFailure;
export type ApexInput = Readonly<{ scenario?: ApexScenario; application_id?: string; tenant_id?: string }>;

export type ApexRecord = Readonly<{
  record_id: string;
  refs: readonly string[];
  operational: boolean;
  deterministic: boolean;
  integrity_hash: string;
}>;

export type ApexFoundation = ApexRecord & Readonly<{
  application_id: string;
  application_name: "APEX";
  tenant_id: string;
  application_constitution_ref: string;
  planning_model_ref: string;
  execution_model_ref: string;
}>;

export type ApexGovernance = ApexRecord & Readonly<{
  authority_gate_ref: string;
  policy_gate_ref: string;
  safety_gate_ref: string;
  approval_routing_ref: string;
  constitutional_execution_verified: boolean;
  governed_planning_verified: boolean;
  enforcement_owned: boolean;
}>;

export type ApexEvidence = ApexRecord & Readonly<{
  execution_refs: readonly string[];
  workflow_evidence_refs: readonly string[];
  planning_evidence_index_refs: readonly string[];
  canonical_cci_evidence: boolean;
  owns_evidence_storage: boolean;
}>;

export type ApexReplay = ApexRecord & Readonly<{
  execution_replay_view_refs: readonly string[];
  planning_replay_visualization_refs: readonly string[];
  workflow_replay_interpretation_refs: readonly string[];
  consumes_caf_behavioral_replay: boolean;
  executes_replay: boolean;
}>;

export type ApexSecurity = ApexRecord & Readonly<{
  tenant_boundary_refs: readonly string[];
  authorization_inheritance_ref: string;
  namespace_isolation_ref: string;
  secure_boundary_refs: readonly string[];
  tenant_isolation_validated: boolean;
}>;

export type ApexQualification = ApexRecord & Readonly<{
  performance_report_ref: string;
  integration_report_ref: string;
  production_readiness_ref: string;
  certification_record_refs: readonly string[];
  replay_compatible: boolean;
  evidence_complete: boolean;
  interoperability_verified: boolean;
  operational_readiness: boolean;
  application_maturity: boolean;
  qualified: boolean;
}>;

export type ApexCertification = Readonly<{
  certification_id: string;
  outcome: ApexOutcome;
  phase_ready: boolean;
  foundation_complete: boolean;
  planning_operational: boolean;
  workflow_orchestration_operational: boolean;
  execution_coordination_operational: boolean;
  dashboards_operational: boolean;
  collaboration_supported: boolean;
  governance_integrated: boolean;
  evidence_complete: boolean;
  replay_supported: boolean;
  observability_operational: boolean;
  lifecycle_certification_supported: boolean;
  tenant_isolation_validated: boolean;
  performance_scalability_validated: boolean;
  integrations_validated: boolean;
  production_ready: boolean;
  application_qualified: boolean;
  no_out_of_scope_ownership: boolean;
  failures: readonly ApexFailure[];
  integrity_hash: string;
}>;

export type ApexResult = Readonly<{
  phase_version: "apex/v4.16";
  phase_identifier: "APEX";
  aurora_ref: "aurora/v4.15";
  publisher_os_ref: "publisher-os/v4.14";
  pbg_ref: "policy-business-governance/v4.13";
  foundation: ApexFoundation;
  planning_engine: ApexRecord;
  workflow_orchestration: ApexRecord;
  execution_coordination: ApexRecord;
  dashboards: ApexRecord;
  collaboration: ApexRecord;
  governance: ApexGovernance;
  evidence: ApexEvidence;
  replay: ApexReplay;
  observability: ApexRecord;
  lifecycle_certification: ApexRecord;
  security: ApexSecurity;
  performance: ApexRecord;
  integration_validation: ApexRecord;
  qualification: ApexQualification;
  certification: ApexCertification;
  replay_hash: string;
  integrity_hash: string;
}>;

export type ApexValidation = Readonly<{
  valid: boolean;
  outcome: ApexOutcome;
  replay_hash_valid: boolean;
  integrity_hash_valid: boolean;
  foundation_valid: boolean;
  planning_valid: boolean;
  workflow_valid: boolean;
  execution_valid: boolean;
  dashboards_valid: boolean;
  collaboration_valid: boolean;
  governance_valid: boolean;
  evidence_valid: boolean;
  replay_valid: boolean;
  observability_valid: boolean;
  lifecycle_valid: boolean;
  security_valid: boolean;
  performance_valid: boolean;
  integration_valid: boolean;
  qualification_valid: boolean;
  certification_valid: boolean;
  failures: readonly ApexFailure[];
  integrity_hash: string;
}>;

export type ApexBundle = Readonly<{
  doctrine: Readonly<{
    version: "apex/v4.16";
    owns_planning_workflows: true;
    owns_execution_orchestration: true;
    owns_operational_coordination: true;
    owns_workflow_management: true;
    owns_operational_dashboards: true;
    owns_identity: false;
    owns_governance_engines: false;
    owns_authority_enforcement: false;
    owns_policy_enforcement: false;
    owns_safety_enforcement: false;
    owns_replay_engine: false;
    owns_audit_engine: false;
    owns_evidence_storage: false;
    owns_certification_engine: false;
    owns_messaging_infrastructure: false;
    owns_observability_platform: false;
    owns_registry_infrastructure: false;
  }>;
  result: ApexResult;
  validation: ApexValidation;
}>;
