export type QciOutcome = "PASS" | "FAIL" | "PRUNED";
export type IntelligenceDomain = "MARKET" | "COMPETITOR" | "CUSTOMER" | "TECHNOLOGY" | "ECOSYSTEM" | "OPPORTUNITY" | "THREAT";

export type QciFailure =
  | "P4_11_MISSION_CONTROL_INVALID"
  | "P4_10_OBSERVABILITY_INVALID"
  | "P4_9_REPLAY_INVALID"
  | "P4_8_GOVERNANCE_INVALID"
  | "P4_7_EVIDENCE_GOVERNANCE_INVALID"
  | "PROGRAM_1_CAPABILITY_ATLAS_INVALID"
  | "PROGRAM_2_CCI_SHARED_SERVICES_INVALID"
  | "PROGRAM_3_CAF_LEGION_INVALID"
  | "QCI_APPLICATION_MISSING"
  | "QCI_CONSTITUTION_MISSING"
  | "QCI_ARCHITECTURE_MISSING"
  | "INTELLIGENCE_DOMAIN_MODEL_MISSING"
  | "DOMAIN_REGISTRY_INCOMPLETE"
  | "COLLECTION_ENGINE_MISSING"
  | "GOVERNED_SOURCE_INGESTION_MISSING"
  | "SOURCE_QUALIFICATION_INVALID"
  | "PROVENANCE_VALIDATION_MISSING"
  | "ANALYSIS_ENGINE_MISSING"
  | "TREND_ANALYSIS_MISSING"
  | "COMPETITOR_COMPARISON_MISSING"
  | "SWOT_GENERATION_MISSING"
  | "MARKET_POSITIONING_MISSING"
  | "OPPORTUNITY_THREAT_IDENTIFICATION_MISSING"
  | "SYNTHESIS_ENGINE_MISSING"
  | "STRATEGIC_REPORTS_MISSING"
  | "CONFIDENCE_ASSESSMENTS_MISSING"
  | "CAF_AGENT_INTEGRATION_MISSING"
  | "CAF_GOVERNANCE_GATES_MISSING"
  | "EVIDENCE_EXPLAINABILITY_MISSING"
  | "EVIDENCE_CITATIONS_MISSING"
  | "REASONING_LINEAGE_MISSING"
  | "REPLAY_REFERENCES_MISSING"
  | "INTELLIGENCE_DASHBOARD_MISSING"
  | "EXECUTIVE_CONSOLE_MISSING"
  | "GOVERNANCE_INTEGRATION_MISSING"
  | "OPERATIONAL_READINESS_MISSING"
  | "REPLAY_COMPATIBILITY_INVALID"
  | "QUALIFICATION_REPORT_MISSING"
  | "QUALIFICATION_EVIDENCE_MISSING"
  | "QUALIFICATION_DECISION_FAILED"
  | "INTELLIGENCE_WORKFLOWS_NON_DETERMINISTIC"
  | "INTELLIGENCE_PRODUCTS_NOT_EXPLAINABLE"
  | "IDENTITY_OWNERSHIP_ATTEMPTED"
  | "NAMESPACE_OWNERSHIP_ATTEMPTED"
  | "GOVERNANCE_ENFORCEMENT_ATTEMPTED"
  | "REPLAY_INFRASTRUCTURE_ATTEMPTED"
  | "EVIDENCE_STORAGE_ATTEMPTED"
  | "TELEMETRY_INFRASTRUCTURE_ATTEMPTED"
  | "CERTIFICATION_INFRASTRUCTURE_ATTEMPTED"
  | "CONSTITUTIONAL_AUTHORITY_ATTEMPTED"
  | "POLICY_ENFORCEMENT_ATTEMPTED"
  | "DEPLOYMENT_CERTIFICATION_MISSING"
  | "CERTIFICATION_PRUNED";

export type QciScenario = "BASELINE" | QciFailure;
export type QciInput = Readonly<{ scenario?: QciScenario; application_id?: string; tenant_id?: string }>;

export type QciFoundation = Readonly<{
  application_id: string;
  application_name: "QuantEdge CompIntel";
  tenant_id: string;
  constitution_ref: string;
  architecture_ref: string;
  intelligence_doctrine_ref: string;
  ownership_model: readonly string[];
  operational_constraints: readonly string[];
  deterministic_workflows: boolean;
  integrity_hash: string;
}>;

export type IntelligenceDomainRegistry = Readonly<{
  registry_id: string;
  domains: readonly IntelligenceDomain[];
  domain_contract_refs: readonly string[];
  market_model_ref: string;
  competitor_model_ref: string;
  customer_model_ref: string;
  technology_model_ref: string;
  ecosystem_model_ref: string;
  opportunity_model_ref: string;
  threat_model_ref: string;
  complete: boolean;
  integrity_hash: string;
}>;

export type IntelligenceCollectionRecord = Readonly<{
  collection_id: string;
  governed_source_refs: readonly string[];
  evidence_refs: readonly string[];
  normalized_intelligence_refs: readonly string[];
  source_qualification_report_refs: readonly string[];
  provenance_validation_refs: readonly string[];
  consumes_cci_evidence: boolean;
  integrity_hash: string;
}>;

export type IntelligenceAnalysisRecord = Readonly<{
  analysis_id: string;
  trend_analysis_refs: readonly string[];
  competitor_comparison_refs: readonly string[];
  swot_refs: readonly string[];
  market_positioning_refs: readonly string[];
  strategic_pattern_refs: readonly string[];
  opportunity_refs: readonly string[];
  threat_refs: readonly string[];
  findings: readonly string[];
  integrity_hash: string;
}>;

export type IntelligenceSynthesisRecord = Readonly<{
  synthesis_id: string;
  executive_summary_refs: readonly string[];
  intelligence_brief_refs: readonly string[];
  strategic_recommendation_refs: readonly string[];
  evidence_backed_conclusion_refs: readonly string[];
  confidence_assessment_refs: readonly string[];
  report_refs: readonly string[];
  explainable: boolean;
  integrity_hash: string;
}>;

export type QciAgentIntegration = Readonly<{
  integration_id: string;
  planning_agent_refs: readonly string[];
  reasoning_agent_refs: readonly string[];
  research_agent_refs: readonly string[];
  collaboration_agent_refs: readonly string[];
  authority_gate_ref: string;
  policy_gate_ref: string;
  safety_gate_ref: string;
  complete: boolean;
  integrity_hash: string;
}>;

export type IntelligenceExplainabilityRecord = Readonly<{
  explainability_id: string;
  evidence_citation_refs: readonly string[];
  reasoning_lineage_refs: readonly string[];
  confidence_explanation_refs: readonly string[];
  recommendation_justification_refs: readonly string[];
  replay_refs: readonly string[];
  evidence_views_refs: readonly string[];
  explainability_report_refs: readonly string[];
  complete: boolean;
  integrity_hash: string;
}>;

export type QciDashboardRecord = Readonly<{
  dashboard_id: string;
  executive_console_id: string;
  competitive_landscape_refs: readonly string[];
  market_trend_refs: readonly string[];
  opportunity_tracking_refs: readonly string[];
  threat_monitoring_refs: readonly string[];
  strategic_kpi_refs: readonly string[];
  visualization_refs: readonly string[];
  operational: boolean;
  integrity_hash: string;
}>;

export type QciGovernanceIntegration = Readonly<{
  governance_id: string;
  constitutional_binding_ref: string;
  approval_routing_ref: string;
  authority_inheritance_ref: string;
  application_governance_ref: string;
  governance_contract_refs: readonly string[];
  enforcement_owned: boolean;
  integrity_hash: string;
}>;

export type QciOperationalReadiness = Readonly<{
  readiness_id: string;
  performance_validated: boolean;
  scalability_validated: boolean;
  observability_ref: string;
  diagnostics_ref: string;
  replay_compatibility_ref: string;
  operational_readiness_report_ref: string;
  ready: boolean;
  integrity_hash: string;
}>;

export type QciQualification = Readonly<{
  qualification_report_id: string;
  qualification_evidence_refs: readonly string[];
  qualification_decision_ref: string;
  constitutional_compliance: boolean;
  architectural_completeness: boolean;
  governance_compliance: boolean;
  replay_compatibility: boolean;
  evidence_completeness: boolean;
  interoperability: boolean;
  operational_readiness: boolean;
  deployment_certification_ref: string;
  qualified: boolean;
  integrity_hash: string;
}>;

export type QciCertification = Readonly<{
  certification_id: string;
  outcome: QciOutcome;
  phase_ready: boolean;
  application_implemented: boolean;
  workflows_deterministic: boolean;
  products_evidence_backed: boolean;
  products_explainable: boolean;
  caf_integration_complete: boolean;
  constitutional_governance_integrated: boolean;
  replay_compatible: boolean;
  operationally_ready: boolean;
  qualification_complete: boolean;
  deployment_certified: boolean;
  no_out_of_scope_ownership: boolean;
  failures: readonly QciFailure[];
  integrity_hash: string;
}>;

export type QuantEdgeCompIntelResult = Readonly<{
  phase_version: "quantedge-compintel/v4.12";
  phase_identifier: "QuantEdgeCompIntel";
  mission_control_ref: "mission-control/v4.11";
  operational_intelligence_ref: "application-observability-operational-intelligence/v4.10";
  replay_audit_forensics_ref: "application-replay-audit-forensics/v4.9";
  foundation: QciFoundation;
  domain_registry: IntelligenceDomainRegistry;
  collection: IntelligenceCollectionRecord;
  analysis: IntelligenceAnalysisRecord;
  synthesis: IntelligenceSynthesisRecord;
  agent_integration: QciAgentIntegration;
  explainability: IntelligenceExplainabilityRecord;
  dashboards: QciDashboardRecord;
  governance: QciGovernanceIntegration;
  readiness: QciOperationalReadiness;
  qualification: QciQualification;
  certification: QciCertification;
  replay_hash: string;
  integrity_hash: string;
}>;

export type QciValidation = Readonly<{
  valid: boolean;
  outcome: QciOutcome;
  replay_hash_valid: boolean;
  integrity_hash_valid: boolean;
  foundation_valid: boolean;
  domains_valid: boolean;
  collection_valid: boolean;
  analysis_valid: boolean;
  synthesis_valid: boolean;
  agents_valid: boolean;
  explainability_valid: boolean;
  dashboards_valid: boolean;
  governance_valid: boolean;
  readiness_valid: boolean;
  qualification_valid: boolean;
  certification_valid: boolean;
  failures: readonly QciFailure[];
  integrity_hash: string;
}>;

export type QciBundle = Readonly<{
  doctrine: Readonly<{
    version: "quantedge-compintel/v4.12";
    owns_competitive_intelligence_workflows: true;
    owns_strategic_intelligence_generation: true;
    owns_intelligence_synthesis: true;
    owns_recommendation_generation: true;
    owns_application_orchestration: true;
    owns_identity: false;
    owns_namespaces: false;
    owns_governance_enforcement: false;
    owns_replay_infrastructure: false;
    owns_evidence_storage: false;
    owns_telemetry_infrastructure: false;
    owns_certification_infrastructure: false;
    owns_constitutional_authority: false;
    owns_policy_enforcement: false;
  }>;
  result: QuantEdgeCompIntelResult;
  validation: QciValidation;
}>;
