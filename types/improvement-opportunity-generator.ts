import type { DimensionEvaluationResult } from "@/types/recommendation-dimension-evaluation";

export type ImprovementOpportunityCategory = "EVIDENCE" | "CONFIDENCE" | "EXPLAINABILITY" | "RISK" | "GOVERNANCE" | "WORKFLOW" | "DECISION_PACKAGE";
export type ImprovementClassification =
  | "EVIDENCE_COMPLETENESS"
  | "EVIDENCE_CREDIBILITY"
  | "EVIDENCE_RELEVANCE"
  | "EVIDENCE_SUFFICIENCY"
  | "CONFIDENCE_CALIBRATION"
  | "CONFIDENCE_TRANSPARENCY"
  | "UNCERTAINTY_COMMUNICATION"
  | "CLARITY"
  | "TRANSPARENCY"
  | "OPERATOR_READABILITY"
  | "RISK_ESTIMATION"
  | "MITIGATION_QUALITY"
  | "UNCERTAINTY_HANDLING"
  | "CONSTITUTIONAL_ALIGNMENT"
  | "POLICY_ALIGNMENT"
  | "AUTHORITY_ALIGNMENT"
  | "OPERATOR_USABILITY"
  | "DECISION_FLOW"
  | "EXECUTION_SUPPORT"
  | "CONTEXT_COMPLETENESS"
  | "ALTERNATIVE_QUALITY"
  | "ROLLBACK_QUALITY";
export type ImprovementPriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "MAINTAIN";
export type ImplementationComplexity = "LOW" | "MEDIUM" | "HIGH";
export type ImprovementStatus = "PROPOSED" | "GOVERNANCE_REVIEW_REQUIRED" | "REPLAY_VALIDATED" | "LEDGER_RECORDED" | "CERTIFIED" | "FAILED" | "PENDING_EVIDENCE";
export type ImprovementOpportunityState = "EVALUATION_COMPLETE" | "OPPORTUNITY_IDENTIFIED" | "CLASSIFICATION_COMPLETE" | "BENEFIT_ASSESSED" | "GOVERNANCE_REVIEW_REQUIRED" | "REPLAY_VALIDATED" | "LEDGER_RECORDED" | "CERTIFIED" | "FAILED" | "PENDING_EVIDENCE";

export type ImprovementOpportunityFailure =
  | "ORIGINATING_RECOMMENDATION_UNAVAILABLE"
  | "SUPPORTING_EVIDENCE_INCOMPLETE"
  | "EVALUATION_RESULTS_MISSING"
  | "GOVERNANCE_VALIDATION_MISSING"
  | "REPLAY_REFERENCES_MISSING"
  | "LINEAGE_INCOMPLETE"
  | "INTEGRITY_MISMATCH_DETECTED"
  | "TENANT_ISOLATION_VIOLATED"
  | "RECOMMENDATION_RECONSTRUCTION_FAILED"
  | "SUPPORTING_EVIDENCE_UNAVAILABLE"
  | "EVALUATION_VERIFICATION_FAILED"
  | "GOVERNANCE_VALIDATION_FAILED"
  | "CONSTITUTIONAL_VALIDATION_FAILED"
  | "REPLAY_DIVERGENCE"
  | "LEDGER_MUTATION_DETECTED"
  | "AUTOMATIC_ADAPTATION_ATTEMPTED"
  | "FAIL_OPEN_BEHAVIOR";

export type ImprovementOpportunityScenario =
  | "BASELINE"
  | "EXCEPTIONAL"
  | "HIGH"
  | "GOOD"
  | "ADEQUATE"
  | "LIMITED"
  | "POOR"
  | "UNACCEPTABLE"
  | "WEAK_EVIDENCE_ONLY"
  | "WEAK_RISK_ONLY"
  | "WEAK_CONFIDENCE_ONLY"
  | "WEAK_GOVERNANCE_ONLY"
  | "WEAK_EXPLAINABILITY_ONLY"
  | "WEAK_ALTERNATIVES_ONLY"
  | "WEAK_ROLLBACK_ONLY"
  | "MISSING_RECOMMENDATION"
  | "MISSING_EVALUATION"
  | "MISSING_EVIDENCE"
  | "MISSING_GOVERNANCE"
  | "MISSING_REPLAY"
  | "INCOMPLETE_LINEAGE"
  | "HASH_MISMATCH"
  | "CROSS_TENANT"
  | "RECONSTRUCTION_FAILURE"
  | "EVIDENCE_UNAVAILABLE"
  | "EVALUATION_VERIFICATION_FAILURE"
  | "GOVERNANCE_FAILURE"
  | "CONSTITUTIONAL_FAILURE"
  | "REPLAY_DIVERGENCE"
  | "LEDGER_MUTATION"
  | "ADAPTATION_ATTEMPT"
  | "FAIL_OPEN";

export type RecommendationImprovement = Readonly<{
  improvement_id: string;
  tenant_id: string;
  mission_id: string;
  decision_id: string;
  recommendation_id: string;
  category: ImprovementOpportunityCategory;
  classification: ImprovementClassification;
  rationale: string;
  supporting_evidence: readonly string[];
  expected_benefit: number;
  expected_benefit_summary: string;
  governance_required: true;
  governance_requirements: readonly string[];
  implementation_priority: ImprovementPriority;
  implementation_complexity: ImplementationComplexity;
  improvement_status: ImprovementStatus;
  supporting_evidence_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  lineage_refs: readonly string[];
  source_dimension_score_refs: readonly string[];
  ledger_refs: readonly string[];
  advisory_only: true;
  implementation_authorized: false;
  modifies_recommendation_behavior: false;
  integrity_hash: string;
}>;

export type ImprovementOpportunityRegistry = Readonly<{
  registry_id: string;
  tenant_id: string;
  opportunity_refs: readonly string[];
  category_index: Readonly<Record<ImprovementOpportunityCategory, readonly string[]>>;
  append_only: true;
  tenant_isolated: boolean;
  immutable: true;
  update_supported: false;
  delete_supported: false;
  integrity_hash: string;
}>;

export type ImprovementOpportunityValidation = Readonly<{
  validation_id: string;
  state: ImprovementOpportunityState;
  certified: boolean;
  failures: readonly ImprovementOpportunityFailure[];
  originating_recommendation_available: boolean;
  evaluation_results_verified: boolean;
  supporting_evidence_complete: boolean;
  governance_ready: boolean;
  governance_approval_required: boolean;
  replay_validated: boolean;
  ledger_recorded: boolean;
  lineage_complete: boolean;
  tenant_isolated: boolean;
  integrity_verified: boolean;
  advisory_only: boolean;
  no_automatic_adaptation: boolean;
  integrity_hash: string;
}>;

export type ImprovementOpportunityLedgerRecord = Readonly<{
  ledger_record_id: string;
  tenant_id: string;
  registry_id: string;
  opportunity_refs: readonly string[];
  recommendation_ref: string;
  decision_ref: string;
  evaluation_refs: readonly string[];
  evidence_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  append_only: true;
  deleted: boolean;
  ledger_sequence: number;
  integrity_hash: string;
}>;

export type ImprovementOpportunityApiSurface = Readonly<{
  api_id: string;
  generate_opportunities: "POST /improvement-opportunity-generator/generate";
  register_opportunities: "POST /improvement-opportunity-generator/registry";
  classify_opportunities: "POST /improvement-opportunity-generator/classify";
  assess_benefits: "POST /improvement-opportunity-generator/benefit";
  evaluate_governance_readiness: "POST /improvement-opportunity-generator/governance";
  validate_generation: "POST /improvement-opportunity-generator/validate";
  replay_generation: "POST /improvement-opportunity-generator/replay";
  retrieve_contract: "GET /improvement-opportunity-generator/contract";
  update_supported: false;
  delete_supported: false;
  adaptive_learning_supported: false;
  recommendation_modification_supported: false;
  integrity_hash: string;
}>;

export type ImprovementOpportunityInput = Readonly<{
  dimension_evaluation?: DimensionEvaluationResult;
  scenario?: ImprovementOpportunityScenario;
}>;

export type ImprovementOpportunityResult = Readonly<{
  improvement_opportunity_generator_version: "improvement-opportunity-generator/v1";
  dimension_evaluation: DimensionEvaluationResult;
  api_surface: ImprovementOpportunityApiSurface;
  opportunities: readonly RecommendationImprovement[];
  registry: ImprovementOpportunityRegistry;
  validation: ImprovementOpportunityValidation;
  ledger_record: ImprovementOpportunityLedgerRecord;
  deterministic: true;
  replayable: true;
  advisory_only: true;
  governance_controlled: true;
  adaptive_learning: false;
  modifies_recommendations: false;
  implementation_authorized: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type ImprovementOpportunityFoundation = Readonly<{
  improvement_opportunity_generator_version: "improvement-opportunity-generator/v1";
  categories: readonly ImprovementOpportunityCategory[];
  classifications: readonly ImprovementClassification[];
  api_surface: ImprovementOpportunityApiSurface;
  result: ImprovementOpportunityResult;
}>;
