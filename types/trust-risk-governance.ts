export type TrustRiskGovernanceOutcome = "PASS" | "FAIL" | "REQUIRES_GOVERNANCE_REVIEW" | "REQUIRES_OPERATOR_REVIEW";
export type RiskCategory = "AUTONOMY" | "GOVERNANCE" | "OPERATIONAL" | "MISSION" | "TRUST";
export type RiskLevel = "MINIMAL" | "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
export type RiskDisposition = "ACCEPTABLE" | "MONITOR" | "MITIGATE" | "REQUIRES_OPERATOR_REVIEW" | "REQUIRES_GOVERNANCE_REVIEW" | "UNACCEPTABLE";
export type RiskLifecycleStatus = "IDENTIFIED" | "UNDER_ANALYSIS" | "ASSESSED" | "MONITORED" | "MITIGATED" | "ACCEPTED" | "REJECTED" | "ARCHIVED";

export type TrustRiskGovernanceFailure =
  | "P5_0_TRUST_CONSTITUTION_INVALID"
  | "P5_1_TRUST_ARCHITECTURE_INVALID"
  | "P5_2_TRUST_REGISTRY_INVALID"
  | "P5_3_RESTRICTION_POLICY_INVALID"
  | "P5_4_AUTONOMY_CLASSIFICATION_INVALID"
  | "P5_5_EVIDENCE_CONFIDENCE_INVALID"
  | "RISK_TAXONOMY_MISSING"
  | "RISK_MODEL_LIBRARY_MISSING"
  | "RISK_RECORD_MISSING"
  | "AUTONOMY_RISK_MISSING"
  | "GOVERNANCE_RISK_MISSING"
  | "OPERATIONAL_RISK_MISSING"
  | "MISSION_RISK_MISSING"
  | "TRUST_RISK_MISSING"
  | "RISK_NOT_EVIDENCE_BASED"
  | "RISK_CONFLATED_WITH_TRUST"
  | "RISK_CONFLATED_WITH_CONFIDENCE"
  | "RISK_GRANTS_AUTHORITY"
  | "RISK_OVERRIDES_POLICY"
  | "RISK_COMPUTATION_NONDETERMINISTIC"
  | "RISK_AGGREGATION_NONREPRODUCIBLE"
  | "RISK_EXPLANATION_INCOMPLETE"
  | "RISK_LINEAGE_INCOMPLETE"
  | "RISK_REPORT_MISSING"
  | "RISK_LIFECYCLE_INVALID"
  | "RISK_GOVERNANCE_MISSING"
  | "RISK_REGISTRY_MISSING"
  | "REPLAY_INVALID"
  | "TENANT_ISOLATION_INVALID"
  | "IMMUTABLE_AUDIT_INVALID"
  | "FAIL_CLOSED_INVALID"
  | "GOVERNANCE_REVIEW_REQUIRED"
  | "OPERATOR_REVIEW_REQUIRED";

export type TrustRiskGovernanceScenario = "BASELINE" | TrustRiskGovernanceFailure;
export type TrustRiskGovernanceInput = Readonly<{ scenario?: TrustRiskGovernanceScenario; tenant_id?: string; assessed_entity?: string; mission_scope?: string }>;
export type RiskModelDefinition = Readonly<{ model_id: string; model_name: string; model_version: string; supported_categories: readonly RiskCategory[]; calculation_method: "EVIDENCE_WEIGHTED_IMPACT_LIKELIHOOD"; weighting_rules: readonly string[]; evidence_requirements: readonly string[]; deterministic: boolean; integrity_hash: string }>;
export type RiskRecord = Readonly<{ risk_id: string; tenant_id: string; mission_scope: string; risk_category: RiskCategory; risk_source: string; risk_score: number; risk_level: RiskLevel; risk_disposition: RiskDisposition; contributing_factors: readonly string[]; evidence_refs: readonly string[]; confidence_refs: readonly string[]; trust_refs: readonly string[]; mitigation_refs: readonly string[]; lifecycle_status: RiskLifecycleStatus; lineage_refs: readonly string[]; trust_granting: boolean; confidence_equivalent: boolean; authority_granting: boolean; policy_overriding: boolean; integrity_hash: string }>;
export type RiskTaxonomy = Readonly<{ taxonomy_id: string; categories: readonly RiskCategory[]; definitions: readonly string[]; metadata_refs: readonly string[]; finalized: boolean; integrity_hash: string }>;
export type RiskRegistry = Readonly<{ registry_id: string; risk_records: readonly RiskRecord[]; tenant_scoped: boolean; operational: boolean; integrity_hash: string }>;
export type RiskAssessment = Readonly<{ assessment_id: string; assessed_entity: string; assessment_time: string; risk_components: readonly RiskRecord[]; overall_risk: number; overall_level: RiskLevel; disposition: RiskDisposition; explanation: string; recommendations: readonly string[]; evidence_backed: boolean; explainable: boolean; integrity_hash: string }>;
export type UnifiedRiskModel = Readonly<{ aggregation_id: string; risk_inputs: readonly string[]; aggregation_method: "WEIGHTED_DOMAIN_RISK_NORMALIZATION"; duplicate_elimination: boolean; preserves_evidence_lineage: boolean; normalized_score: number; deterministic: boolean; integrity_hash: string }>;
export type RiskGovernanceModel = Readonly<{ governance_id: string; governance_review_defined: boolean; operator_review_defined: boolean; approval_routing_defined: boolean; evidence_validation_defined: boolean; audit_lineage_defined: boolean; constitutional_controls_preserved: boolean; confidence_separation_preserved: boolean; authority_separation_preserved: boolean; integrity_hash: string }>;
export type RiskReport = Readonly<{ report_id: string; risk_records: readonly string[]; contributing_factors: readonly string[]; evidence_refs: readonly string[]; confidence_refs: readonly string[]; weighting_summary: string; assumptions: readonly string[]; justification: string; explainable: boolean; governance_visible: boolean; integrity_hash: string }>;
export type RiskObservabilityModel = Readonly<{ observability_id: string; metrics: readonly string[]; monitors_risk_lifecycle: boolean; monitors_replay: boolean; monitors_lineage: boolean; monitors_governance_review: boolean; monitors_operator_review: boolean; integrity_hash: string }>;
export type TrustRiskGovernanceCertification = Readonly<{ certification_id: string; outcome: TrustRiskGovernanceOutcome; phase_ready: boolean; five_domains_implemented: boolean; deterministic_computation_verified: boolean; aggregation_reproducible: boolean; assessments_explainable_evidence_backed: boolean; lineage_complete: boolean; governance_integrated: boolean; separation_preserved: boolean; canonical_artifacts_published: boolean; replay_tenant_audit_fail_closed: boolean; failures: readonly TrustRiskGovernanceFailure[]; integrity_hash: string }>;
export type TrustRiskGovernanceResult = Readonly<{ phase_version: "trust-risk-governance/v5.6"; phase_identifier: "TrustRiskGovernance"; trust_constitution_ref: "trust-constitutional-foundation/v5.0"; trust_architecture_ref: "trust-architecture-alignment-foundation/v5.1"; trust_identity_boundary_ref: "trust-identity-domains-boundaries/v5.2"; trust_restriction_policy_ref: "trust-contracts-restriction-policy/v5.3"; autonomy_classification_ref: "autonomy-classification-framework/v5.4"; trust_evidence_confidence_ref: "trust-evidence-confidence/v5.5"; taxonomy: RiskTaxonomy; model: RiskModelDefinition; registry: RiskRegistry; assessment: RiskAssessment; aggregation: UnifiedRiskModel; governance: RiskGovernanceModel; report: RiskReport; observability: RiskObservabilityModel; certification: TrustRiskGovernanceCertification; replay_hash: string; integrity_hash: string }>;
export type TrustRiskGovernanceValidation = Readonly<{ valid: boolean; outcome: TrustRiskGovernanceOutcome; replay_hash_valid: boolean; integrity_hash_valid: boolean; taxonomy_valid: boolean; model_valid: boolean; registry_valid: boolean; assessment_valid: boolean; aggregation_valid: boolean; governance_valid: boolean; report_valid: boolean; observability_valid: boolean; certification_valid: boolean; failures: readonly TrustRiskGovernanceFailure[]; integrity_hash: string }>;
export type TrustRiskGovernanceBundle = Readonly<{ doctrine: Readonly<{ version: "trust-risk-governance/v5.6"; owns_autonomy_risk: true; owns_governance_risk: true; owns_operational_risk: true; owns_mission_risk: true; owns_trust_risk: true; risk_is_trust: false; risk_is_confidence: false; risk_grants_authority: false; risk_overrides_policy: false }>; result: TrustRiskGovernanceResult; validation: TrustRiskGovernanceValidation }>;
