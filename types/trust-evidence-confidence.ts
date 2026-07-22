export type TrustEvidenceConfidenceOutcome = "PASS" | "FAIL" | "REQUIRES_GOVERNANCE_REVIEW";
export type EvidenceType = "BEHAVIORAL" | "SAFETY" | "GOVERNANCE" | "OPERATIONAL" | "AUDIT" | "REPLAY" | "PROVENANCE";
export type EvidenceCategory = "PRIMARY" | "CORROBORATING" | "CONTRADICTORY" | "DERIVED";
export type ConfidenceStatus = "COMPUTED" | "FAIL_CLOSED" | "REQUIRES_GOVERNANCE_REVIEW";

export type TrustEvidenceConfidenceFailure =
  | "P5_1_TRUST_ARCHITECTURE_INVALID"
  | "P5_2_TRUST_REGISTRY_INVALID"
  | "P5_3_RESTRICTION_POLICY_INVALID"
  | "P5_4_AUTONOMY_CLASSIFICATION_INVALID"
  | "TRUST_EVIDENCE_REGISTRY_MISSING"
  | "EVIDENCE_TAXONOMY_MISSING"
  | "EVIDENCE_RECORD_MISSING"
  | "EVIDENCE_INTEGRITY_INVALID"
  | "EVIDENCE_LINEAGE_INCOMPLETE"
  | "EVIDENCE_QUALITY_MODEL_INVALID"
  | "EVIDENCE_AGGREGATION_NONDETERMINISTIC"
  | "DUPLICATE_EVIDENCE_NOT_ELIMINATED"
  | "CONTRADICTION_NOT_DETECTED"
  | "CONFIDENCE_MODEL_MISSING"
  | "CONFIDENCE_NOT_EVIDENCE_BASED"
  | "CONFIDENCE_COMPUTATION_NONDETERMINISTIC"
  | "CONFIDENCE_NOT_REPLAYABLE"
  | "CONFIDENCE_NOT_EXPLAINABLE"
  | "CONFIDENCE_UNBOUNDED"
  | "CONFIDENCE_INFLATED"
  | "CONFIDENCE_OVERRIDES_GOVERNANCE"
  | "CONFIDENCE_TREATED_AS_TRUST"
  | "CONFIDENCE_GRANTS_AUTHORITY"
  | "CONFIDENCE_REPORT_MISSING"
  | "GOVERNANCE_CONTRACTS_MISSING"
  | "OBSERVABILITY_MODEL_MISSING"
  | "CERTIFICATION_INCOMPLETE"
  | "GOVERNANCE_REVIEW_REQUIRED";

export type TrustEvidenceConfidenceScenario = "BASELINE" | TrustEvidenceConfidenceFailure;
export type TrustEvidenceConfidenceInput = Readonly<{ scenario?: TrustEvidenceConfidenceScenario; tenant_id?: string; subject_id?: string; trust_domain_id?: string }>;
export type TrustEvidenceRecord = Readonly<{ evidence_id: string; evidence_type: EvidenceType; evidence_category: EvidenceCategory; source: string; owner: string; tenant_id: string; trust_domain_id: string; integrity_hash: string; provenance_refs: readonly string[]; collection_time: string; quality_score: number; lineage_refs: readonly string[]; replay_ref: string; immutable: boolean; valid: boolean }>;
export type EvidenceQualityModel = Readonly<{ model_id: string; authenticity: number; completeness: number; freshness: number; replayability: number; provenance: number; governance_approval: number; integrity: number; reproducibility: number; normalized_quality: number; integrity_hash: string }>;
export type EvidenceAggregationRecord = Readonly<{ aggregation_id: string; evidence_inputs: readonly string[]; aggregation_method: "WEIGHTED_DETERMINISTIC_MEAN"; duplicate_resolution: "CANONICAL_HASH_DEDUPLICATION"; contradictions: readonly string[]; final_evidence_set: readonly string[]; lineage_refs: readonly string[]; deterministic: boolean; integrity_hash: string }>;
export type ConfidenceModel = Readonly<{ model_id: string; weighting_model: "QUALITY_WEIGHTED_BOUNDED_CONFIDENCE"; normalization: "ZERO_TO_ONE"; uncertainty_model: "ONE_MINUS_WEIGHTED_QUALITY"; decay_function: "FRESHNESS_WEIGHTED_DECAY"; confidence_bounds: readonly [number, number]; prevents_inflation: boolean; integrity_hash: string }>;
export type ConfidenceRecord = Readonly<{ confidence_id: string; subject: string; confidence_score: number; confidence_range: readonly [number, number]; evidence_refs: readonly string[]; weighting_model: string; uncertainty: number; computation_timestamp: string; replay_ref: string; lineage_refs: readonly string[]; status: ConfidenceStatus; evidence_backed: boolean; trust_granting: boolean; authority_granting: boolean; integrity_hash: string }>;
export type EvidenceLineageRegistry = Readonly<{ registry_id: string; source_lineage: readonly string[]; transformation_lineage: readonly string[]; aggregation_lineage: readonly string[]; confidence_lineage: readonly string[]; replay_refs: readonly string[]; complete: boolean; deterministic: boolean; integrity_hash: string }>;
export type ConfidenceReport = Readonly<{ report_id: string; supporting_evidence: readonly string[]; confidence_score: number; uncertainty: number; evidence_gaps: readonly string[]; quality_assessment: string; lineage_refs: readonly string[]; explainable: boolean; evidence_backed: boolean; governance_visible: boolean; integrity_hash: string }>;
export type GovernanceConfidenceContracts = Readonly<{ contract_id: string; confidence_never_overrides_constitution: boolean; confidence_never_overrides_restrictions: boolean; confidence_never_overrides_authority: boolean; confidence_never_overrides_tenant_boundaries: boolean; confidence_never_overrides_operator_decisions: boolean; trust_decisions_not_based_solely_on_confidence: boolean; integrity_hash: string }>;
export type ConfidenceObservabilityModel = Readonly<{ dashboard_id: string; metrics: readonly string[]; monitors_ingestion: boolean; monitors_latency: boolean; monitors_freshness: boolean; monitors_aggregation: boolean; monitors_replay_consistency: boolean; monitors_lineage_completeness: boolean; monitors_quality_trends: boolean; integrity_hash: string }>;
export type TrustEvidenceRegistry = Readonly<{ registry_id: string; evidence_records: readonly TrustEvidenceRecord[]; taxonomy: readonly EvidenceType[]; categories: readonly EvidenceCategory[]; validation_rules: readonly string[]; operational: boolean; integrity_hash: string }>;
export type TrustEvidenceConfidenceCertification = Readonly<{ certification_id: string; outcome: TrustEvidenceConfidenceOutcome; phase_ready: boolean; evidence_registry_operational: boolean; evidence_lineage_complete: boolean; confidence_deterministic_replayable: boolean; aggregation_reproducible: boolean; confidence_models_documented: boolean; reports_explainable_evidence_backed: boolean; governance_prevents_override: boolean; immutable_lineage_referenced: boolean; invariants_valid: boolean; approved_for_p5_6: boolean; failures: readonly TrustEvidenceConfidenceFailure[]; integrity_hash: string }>;
export type TrustEvidenceConfidenceResult = Readonly<{ phase_version: "trust-evidence-confidence/v5.5"; phase_identifier: "TrustEvidenceConfidence"; trust_architecture_ref: "trust-architecture-alignment-foundation/v5.1"; trust_identity_boundary_ref: "trust-identity-domains-boundaries/v5.2"; trust_restriction_policy_ref: "trust-contracts-restriction-policy/v5.3"; autonomy_classification_ref: "autonomy-classification-framework/v5.4"; evidence_registry: TrustEvidenceRegistry; quality_model: EvidenceQualityModel; aggregation: EvidenceAggregationRecord; confidence_model: ConfidenceModel; confidence: ConfidenceRecord; lineage: EvidenceLineageRegistry; report: ConfidenceReport; governance: GovernanceConfidenceContracts; observability: ConfidenceObservabilityModel; certification: TrustEvidenceConfidenceCertification; replay_hash: string; integrity_hash: string }>;
export type TrustEvidenceConfidenceValidation = Readonly<{ valid: boolean; outcome: TrustEvidenceConfidenceOutcome; replay_hash_valid: boolean; integrity_hash_valid: boolean; evidence_registry_valid: boolean; quality_model_valid: boolean; aggregation_valid: boolean; confidence_model_valid: boolean; confidence_valid: boolean; lineage_valid: boolean; report_valid: boolean; governance_valid: boolean; observability_valid: boolean; certification_valid: boolean; failures: readonly TrustEvidenceConfidenceFailure[]; integrity_hash: string }>;
export type TrustEvidenceConfidenceBundle = Readonly<{ doctrine: Readonly<{ version: "trust-evidence-confidence/v5.5"; owns_trust_evidence: true; owns_confidence_modeling: true; owns_evidence_aggregation: true; owns_confidence_computation: true; owns_evidence_lineage: true; owns_confidence_reporting: true; owns_authority_decisions: false; owns_trust_contracts: false; confidence_is_trust: false; confidence_grants_authority: false }>; result: TrustEvidenceConfidenceResult; validation: TrustEvidenceConfidenceValidation }>;
