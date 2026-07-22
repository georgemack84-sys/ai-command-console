import type { AutonomyMaturityDomain, AutonomyMaturityScoreCategory } from "@/types/autonomy-maturity-assessment-contract";
import type { MaturityDomainEvaluationRepository } from "@/types/maturity-domain-evaluation-engine";

export type DeterministicMaturityScoringScenario = "BASELINE" | "MISSING_WEIGHTING_PROFILE" | "WEIGHTING_PROFILE_MODIFIED" | "INCONSISTENT_NORMALIZATION_RULES" | "AGGREGATE_REPLAY_MISMATCH" | "NONDETERMINISTIC_CONFIDENCE" | "VARIABLE_READINESS" | "GOVERNANCE_VALIDATION_FAILURE" | "CONSTITUTIONAL_VALIDATION_FAILURE" | "INTEGRITY_VERIFICATION_FAILURE" | "REPLAY_RECONSTRUCTION_MISMATCH" | "HIDDEN_SCORING_LOGIC" | "TENANT_ISOLATION_VIOLATION" | "ADVISORY_ONLY_VIOLATION";
export type DeterministicMaturityScoringFailure = "WEIGHTING_PROFILE_MISSING" | "WEIGHTING_PROFILE_MODIFIED_DURING_ASSESSMENT" | "NORMALIZATION_RULES_INCONSISTENT" | "AGGREGATE_REPLAY_MISMATCHED" | "CONFIDENCE_CALCULATION_NONDETERMINISTIC" | "READINESS_CALCULATION_VARIABLE" | "GOVERNANCE_VALIDATION_FAILED" | "CONSTITUTIONAL_VALIDATION_FAILED" | "INTEGRITY_VERIFICATION_FAILED" | "REPLAY_RECONSTRUCTION_MISMATCHED" | "HIDDEN_SCORING_LOGIC_DETECTED" | "TENANT_ISOLATION_VIOLATED" | "ADVISORY_ONLY_BEHAVIOR_COMPROMISED";
export type MaturityConfidenceClassification = "LOW" | "MODERATE" | "HIGH" | "CERTIFIED";
export type MaturityReadinessClassification = "NOT_READY" | "PARTIAL" | "READY" | "CERTIFICATION_READY";

export type MaturityWeightingProfile = Readonly<{
  profile_id: string;
  profile_version: "maturity-weighting/v1";
  approved: boolean;
  immutable_during_assessment: boolean;
  governance_approved: boolean;
  constitutionally_compliant: boolean;
  weights: readonly MaturityDomainWeight[];
  integrity_hash: string;
}>;

export type MaturityDomainWeight = Readonly<{
  domain: AutonomyMaturityDomain;
  weight: number;
  order: number;
  rationale: string;
}>;

export type NormalizedMaturityDomainScore = Readonly<{
  domain: AutonomyMaturityDomain;
  order: number;
  raw_score: number;
  normalized_score: number;
  normalization_method: "CLAMP_0_100_FIXED_TWO_DECIMALS";
  evidence_reference: string;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
}>;

export type WeightedMaturityDomainContribution = Readonly<{
  domain: AutonomyMaturityDomain;
  order: number;
  normalized_score: number;
  weight: number;
  weighted_contribution: number;
  explanation: string;
  integrity_hash: string;
}>;

export type MaturityScoringResult = Readonly<{
  scoring_id: string;
  scoring_version: "deterministic-maturity-scoring-engine/v8ALT.11.3";
  weighting_profile_version: "maturity-weighting/v1";
  normalization_version: "normalization/v1";
  aggregation_version: "aggregation/v1";
  confidence_version: "confidence/v1";
  readiness_version: "readiness/v1";
  overall_maturity_score: number;
  maturity_classification: AutonomyMaturityScoreCategory;
  confidence_score: number;
  confidence_classification: MaturityConfidenceClassification;
  readiness_score: number;
  readiness_classification: MaturityReadinessClassification;
  scoring_explanation: readonly string[];
  replay_reference: string;
  lineage_reference: string;
  governance_validated: boolean;
  constitutional_validated: boolean;
  integrity_hash: string;
}>;

export type MaturityScoringLedgerEntry = Readonly<{
  ledger_id: string;
  scoring_id: string;
  assessment_id: string;
  scoring_version: "deterministic-maturity-scoring-engine/v8ALT.11.3";
  weighting_profile_version: "maturity-weighting/v1";
  normalization_version: "normalization/v1";
  aggregation_version: "aggregation/v1";
  confidence_version: "confidence/v1";
  readiness_version: "readiness/v1";
  evidence_references: readonly string[];
  governance_reference: string;
  constitutional_reference: string;
  replay_reference: string;
  lineage_reference: string;
  timestamp: "1970-01-01T00:00:00.000Z";
  append_only: true;
  integrity_hash: string;
}>;

export type DeterministicMaturityScoringRepository = Readonly<{
  scoring_id: string;
  final_state: "DETERMINISTIC_MATURITY_SCORING_COMPLETE" | "DETERMINISTIC_MATURITY_SCORING_FAILED";
  evaluation: MaturityDomainEvaluationRepository;
  weighting_profile: MaturityWeightingProfile | null;
  normalized_scores: readonly NormalizedMaturityDomainScore[];
  contributions: readonly WeightedMaturityDomainContribution[];
  result: MaturityScoringResult;
  ledger: readonly MaturityScoringLedgerEntry[];
  failures: readonly DeterministicMaturityScoringFailure[];
  advisory_only: true;
  maturity_advancement_authorized: false;
  production_certification_authorized: false;
  governance_modification_authorized: false;
  authority_change_authorized: false;
  execution_behavior_change_authorized: false;
  integrity_hash: string;
}>;

export type DeterministicMaturityScoringValidationResult = Readonly<{
  scoring_id: string;
  valid: boolean;
  weighting_profile_present: boolean;
  weighting_profile_immutable: boolean;
  normalization_consistent: boolean;
  aggregate_replay_verified: boolean;
  confidence_deterministic: boolean;
  readiness_deterministic: boolean;
  governance_validated: boolean;
  constitutional_validated: boolean;
  integrity_verified: boolean;
  replay_reconstruction_verified: boolean;
  no_hidden_scoring_logic: boolean;
  tenant_isolated: boolean;
  advisory_only: true;
  no_execution_authority: boolean;
  failures: readonly DeterministicMaturityScoringFailure[];
  validation_hash: string;
}>;

export type DeterministicMaturityScoringObservabilitySurface = Readonly<{
  scoring_id: string;
  final_state: string;
  domain_count: number;
  normalized_score_count: number;
  contribution_count: number;
  ledger_count: number;
  overall_maturity_score: number;
  maturity_classification: AutonomyMaturityScoreCategory;
  confidence_score: number;
  readiness_score: number;
  failure_count: number;
  advisory_only: true;
  execution_behavior_change_authorized: false;
  integrity_hash: string;
}>;

export type DeterministicMaturityScoringInput = Readonly<{ scenario?: DeterministicMaturityScoringScenario; repository?: DeterministicMaturityScoringRepository; evaluation?: MaturityDomainEvaluationRepository }>;

export type DeterministicMaturityScoringBundle = Readonly<{
  doctrine: Readonly<{
    engine_version: "deterministic-maturity-scoring-engine/v8ALT.11.3";
    final_state: "DETERMINISTIC_MATURITY_SCORING_ENGINE_READY";
    canonical_domain_count: 10;
    principles: readonly string[];
  }>;
  repository: DeterministicMaturityScoringRepository;
  validation: DeterministicMaturityScoringValidationResult;
  observability: DeterministicMaturityScoringObservabilitySurface;
}>;
