export type EcosystemPortfolioGovernanceOutcome = "PASS" | "FAIL" | "PRUNED";

export type EcosystemPortfolioGovernanceFailure =
  | "P4_19_INTEROPERABILITY_INVALID"
  | "P4_10_OPERATIONAL_EVIDENCE_INVALID"
  | "P4_8_GOVERNANCE_EVIDENCE_INVALID"
  | "P4_6_INTEROPERABILITY_EVIDENCE_INVALID"
  | "P4_5_CERTIFICATION_EVIDENCE_INVALID"
  | "PORTFOLIO_FOUNDATION_MISSING"
  | "PORTFOLIO_REGISTRY_MISSING"
  | "PORTFOLIO_INVENTORY_MISSING"
  | "APPLICATION_INVENTORY_INCOMPLETE"
  | "CERTIFICATION_AGGREGATION_MISSING"
  | "CERTIFICATION_STATUS_REFS_MISSING"
  | "GOVERNANCE_AGGREGATION_MISSING"
  | "GOVERNANCE_EVIDENCE_MISSING"
  | "INTEROPERABILITY_MONITORING_MISSING"
  | "INTEROPERABILITY_EVIDENCE_MISSING"
  | "OPERATIONAL_MONITORING_MISSING"
  | "OPERATIONAL_EVIDENCE_MISSING"
  | "PORTFOLIO_DASHBOARD_MISSING"
  | "DASHBOARD_STATUS_INACCURATE"
  | "GOVERNANCE_REPORTING_MISSING"
  | "REPORT_NON_REPRODUCIBLE"
  | "PORTFOLIO_ANALYTICS_MISSING"
  | "ANALYTICS_NONDETERMINISTIC"
  | "PORTFOLIO_HEALTH_ASSESSMENT_MISSING"
  | "HEALTH_SUMMARY_INCOMPLETE"
  | "EVIDENCE_AGGREGATION_MISSING"
  | "EVIDENCE_LINEAGE_BROKEN"
  | "EXECUTIVE_REPORTING_MISSING"
  | "TENANT_ISOLATION_INVALID"
  | "APPLICATION_OWNERSHIP_NOT_PRESERVED"
  | "EVIDENCE_MODIFICATION_ATTEMPTED"
  | "CERTIFICATION_DECISION_ATTEMPTED"
  | "QUALIFICATION_DECISION_ATTEMPTED"
  | "APPROVAL_DECISION_ATTEMPTED"
  | "SUSPENSION_DECISION_ATTEMPTED"
  | "REVOCATION_DECISION_ATTEMPTED"
  | "GOVERNANCE_MODIFICATION_ATTEMPTED"
  | "AUTHORITY_OVERRIDE_ATTEMPTED"
  | "OPERATIONAL_WORKFLOW_EXECUTION_ATTEMPTED"
  | "CONSTITUTIONAL_DECISION_ATTEMPTED"
  | "CERTIFICATION_PRUNED";

export type EcosystemPortfolioGovernanceScenario = "BASELINE" | EcosystemPortfolioGovernanceFailure;
export type EcosystemPortfolioGovernanceInput = Readonly<{ scenario?: EcosystemPortfolioGovernanceScenario; portfolio_id?: string; tenant_id?: string }>;

export type EcosystemPortfolioGovernanceRecord = Readonly<{ record_id: string; portfolio_id: string; tenant_id: string; version: "ecosystem-portfolio-governance/v4.20"; refs: readonly string[]; evidence_refs: readonly string[]; replay_refs: readonly string[]; operational: boolean; deterministic: boolean; integrity_hash: string }>;

export type PortfolioRecord = EcosystemPortfolioGovernanceRecord & Readonly<{ portfolio_name: "Civitas Ecosystem Application Portfolio"; application_refs: readonly string[]; certificate_refs: readonly string[]; certification_status_refs: readonly string[]; governance_evidence_refs: readonly string[]; interoperability_evidence_refs: readonly string[]; operational_evidence_refs: readonly string[]; overall_health: "HEALTHY" | "DEGRADED" | "BLOCKED"; generated_timestamp: "2026-07-18T00:00:00.000Z" }>;
export type PortfolioHealthSummary = EcosystemPortfolioGovernanceRecord & Readonly<{ summary_id: string; application_count: number; certified_application_count: number; governance_compliant_count: number; operational_ready_count: number; interoperable_application_count: number; health_score: number; generated_timestamp: "2026-07-18T00:00:00.000Z" }>;
export type EcosystemGovernanceReport = EcosystemPortfolioGovernanceRecord & Readonly<{ report_id: string; governance_summary: string; certification_summary: string; interoperability_summary: string; operational_summary: string; risk_summary: string; recommendations: readonly string[]; generated_timestamp: "2026-07-18T00:00:00.000Z"; reproducible: boolean }>;

export type PortfolioFoundation = EcosystemPortfolioGovernanceRecord & Readonly<{ governance_architecture_ref: string; portfolio_model_ref: string; aggregation_contract_refs: readonly string[]; portfolio_registry_ref: string }>;
export type CertificationAggregation = EcosystemPortfolioGovernanceRecord & Readonly<{ certificate_refs: readonly string[]; certification_status_refs: readonly string[]; certification_distribution_ref: string; certification_trend_refs: readonly string[]; portfolio_readiness_ref: string }>;
export type GovernanceAggregation = EcosystemPortfolioGovernanceRecord & Readonly<{ governance_compliance_refs: readonly string[]; constitutional_compliance_refs: readonly string[]; authority_compliance_refs: readonly string[]; policy_compliance_refs: readonly string[]; governance_trend_refs: readonly string[] }>;
export type InteroperabilityPortfolioMonitoring = EcosystemPortfolioGovernanceRecord & Readonly<{ interoperability_evidence_refs: readonly string[]; federation_summary_ref: string; dependency_summary_ref: string; integration_maturity_ref: string; ready_application_refs: readonly string[] }>;
export type OperationalPortfolioMonitoring = EcosystemPortfolioGovernanceRecord & Readonly<{ operational_evidence_refs: readonly string[]; operational_summary_ref: string; health_summary_ref: string; availability_summary_ref: string; operational_trend_refs: readonly string[] }>;
export type PortfolioDashboard = EcosystemPortfolioGovernanceRecord & Readonly<{ view_refs: readonly string[]; status_accurate: boolean }>;
export type PortfolioAnalytics = EcosystemPortfolioGovernanceRecord & Readonly<{ adoption_trend_refs: readonly string[]; certification_trend_refs: readonly string[]; governance_trend_refs: readonly string[]; operational_trend_refs: readonly string[]; interoperability_trend_refs: readonly string[]; maturity_progression_ref: string }>;
export type PortfolioEvidenceIndex = EcosystemPortfolioGovernanceRecord & Readonly<{ certification_evidence_refs: readonly string[]; governance_evidence_refs: readonly string[]; interoperability_evidence_refs: readonly string[]; operational_evidence_refs: readonly string[]; lineage_intact: boolean; modifies_evidence: boolean }>;
export type ExecutivePortfolioReporting = EcosystemPortfolioGovernanceRecord & Readonly<{ ecosystem_summary_ref: string; strategic_dashboard_ref: string; governance_scorecard_ref: string; certification_summary_ref: string; operational_summary_ref: string }>;
export type PortfolioBoundary = Readonly<{ certifies_applications: boolean; qualifies_applications: boolean; approves_applications: boolean; suspends_applications: boolean; revokes_applications: boolean; modifies_application_governance: boolean; overrides_application_authority: boolean; executes_operational_workflows: boolean; issues_constitutional_decisions: boolean; integrity_hash: string }>;

export type EcosystemPortfolioGovernanceCertification = Readonly<{ certification_id: string; outcome: EcosystemPortfolioGovernanceOutcome; phase_ready: boolean; foundation_ready: boolean; inventory_complete: boolean; certification_aggregated: boolean; governance_aggregated: boolean; interoperability_aggregated: boolean; operations_aggregated: boolean; dashboard_ready: boolean; reports_ready: boolean; analytics_deterministic: boolean; health_assessed: boolean; evidence_lineage_intact: boolean; executive_visibility_ready: boolean; no_constitutional_decisions: boolean; failures: readonly EcosystemPortfolioGovernanceFailure[]; integrity_hash: string }>;

export type EcosystemPortfolioGovernanceResult = Readonly<{ phase_version: "ecosystem-portfolio-governance/v4.20"; phase_identifier: "EcosystemPortfolioGovernance"; interoperability_ref: "cross-application-interoperability/v4.19"; foundation: PortfolioFoundation; inventory: PortfolioRecord; certification_aggregation: CertificationAggregation; governance_aggregation: GovernanceAggregation; interoperability_monitoring: InteroperabilityPortfolioMonitoring; operational_monitoring: OperationalPortfolioMonitoring; dashboard: PortfolioDashboard; reports: EcosystemGovernanceReport; analytics: PortfolioAnalytics; health: PortfolioHealthSummary; evidence: PortfolioEvidenceIndex; executive: ExecutivePortfolioReporting; boundary: PortfolioBoundary; certification: EcosystemPortfolioGovernanceCertification; replay_hash: string; integrity_hash: string }>;

export type EcosystemPortfolioGovernanceValidation = Readonly<{ valid: boolean; outcome: EcosystemPortfolioGovernanceOutcome; replay_hash_valid: boolean; integrity_hash_valid: boolean; foundation_valid: boolean; inventory_valid: boolean; certification_aggregation_valid: boolean; governance_aggregation_valid: boolean; interoperability_monitoring_valid: boolean; operational_monitoring_valid: boolean; dashboard_valid: boolean; reports_valid: boolean; analytics_valid: boolean; health_valid: boolean; evidence_valid: boolean; executive_valid: boolean; boundary_valid: boolean; certification_valid: boolean; failures: readonly EcosystemPortfolioGovernanceFailure[]; integrity_hash: string }>;

export type EcosystemPortfolioGovernanceBundle = Readonly<{ doctrine: Readonly<{ version: "ecosystem-portfolio-governance/v4.20"; owns_application_portfolio_governance: true; owns_portfolio_monitoring: true; owns_ecosystem_governance: true; owns_governance_aggregation: true; owns_certification_aggregation: true; certifies_applications: false; qualifies_applications: false; approves_applications: false; revokes_applications: false; modifies_application_governance: false; overrides_application_authority: false; executes_operational_workflows: false; issues_constitutional_decisions: false }>; result: EcosystemPortfolioGovernanceResult; validation: EcosystemPortfolioGovernanceValidation }>;
