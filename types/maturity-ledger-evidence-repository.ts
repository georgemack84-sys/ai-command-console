import type { AutonomyMaturityDomain, AutonomyMaturityLevel } from "@/types/autonomy-maturity-assessment-contract";
import type { ImprovementRecommendationRepository } from "@/types/improvement-recommendation-engine";

export type MaturityLedgerScenario = "BASELINE" | "LEDGER_ENTRY_MODIFICATION" | "MISSING_EVIDENCE" | "INCOMPLETE_REPLAY_REFERENCES" | "BROKEN_LINEAGE" | "INTEGRITY_VERIFICATION_FAILURE" | "DUPLICATE_ASSESSMENT_IDENTIFIERS" | "REPLAY_RECONSTRUCTION_MISMATCH" | "MISSING_GOVERNANCE_EVIDENCE" | "MISSING_CONSTITUTIONAL_EVIDENCE" | "HIDDEN_LEDGER_ENTRIES" | "TENANT_ISOLATION_VIOLATION" | "APPEND_ONLY_COMPROMISE";
export type MaturityLedgerFailure = "LEDGER_ENTRY_MODIFIED" | "EVIDENCE_MISSING" | "REPLAY_REFERENCES_INCOMPLETE" | "LINEAGE_RELATIONSHIPS_BROKEN" | "INTEGRITY_VERIFICATION_FAILED" | "DUPLICATE_ASSESSMENT_IDENTIFIERS_EXIST" | "REPLAY_RECONSTRUCTION_MISMATCHED" | "GOVERNANCE_EVIDENCE_MISSING" | "CONSTITUTIONAL_EVIDENCE_MISSING" | "HIDDEN_LEDGER_ENTRIES_DETECTED" | "TENANT_ISOLATION_VIOLATED" | "APPEND_ONLY_BEHAVIOR_COMPROMISED";
export type EvidenceArtifactType = "RUNTIME" | "GOVERNANCE" | "CONSTITUTIONAL" | "REPLAY" | "CERTIFICATION" | "EXPLAINABILITY";
export type RepositoryLifecycleState = "CREATED" | "VALIDATED" | "RECORDED" | "VERIFIED" | "CERTIFIED" | "ARCHIVED";

export type MaturityAssessmentLedgerRecord = Readonly<{
  assessment_id: string;
  assessment_version: "autonomy-maturity-assessment-contract/v8ALT.11.1";
  tenant_id: string;
  mission_id: string;
  evaluation_scope: "PLATFORM";
  assessment_type: "CONTINUOUS";
  maturity_level: AutonomyMaturityLevel;
  overall_score: number;
  readiness_score: number;
  confidence_score: number;
  assessment_state: RepositoryLifecycleState;
  evaluator_version: "maturity-ledger-evidence-repository/v8ALT.11.8";
  immutable: boolean;
  append_only: boolean;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  timestamp: "1970-01-01T00:00:00.000Z";
}>;

export type DomainScoreRecord = Readonly<{
  domain: AutonomyMaturityDomain;
  score: number;
  confidence: number;
  readiness_contribution: number;
  weighting: number;
  evaluation_version: "maturity-domain-evaluation-engine/v8ALT.11.2";
  supporting_evidence: readonly string[];
  integrity_hash: string;
}>;

export type EvidenceArtifact = Readonly<{
  evidence_id: string;
  evidence_type: EvidenceArtifactType;
  originating_assessment: string;
  originating_domain: AutonomyMaturityDomain | "CROSS_DOMAIN";
  replay_reference: string;
  lineage_reference: string;
  governance_reference: string;
  constitutional_reference: string;
  integrity_hash: string;
  timestamp: "1970-01-01T00:00:00.000Z";
}>;

export type LineageRecord = Readonly<{
  lineage_id: string;
  assessment_id: string;
  parent_assessment_id: string;
  child_assessment_id: string;
  relationship: "ASSESSMENT_EVOLUTION" | "CERTIFICATION_LINEAGE" | "RECOMMENDATION_LINEAGE" | "REPLAY_LINEAGE" | "EVIDENCE_LINEAGE";
  replay_reference: string;
  integrity_hash: string;
}>;

export type ReplayRecord = Readonly<{
  replay_id: string;
  assessment_id: string;
  replay_version: "maturity-replay/v1";
  reconstruction_metadata: string;
  replay_validated: boolean;
  replay_reference: string;
  lineage_reference: string;
  timestamp: "1970-01-01T00:00:00.000Z";
  integrity_hash: string;
}>;

export type IntegrityRecord = Readonly<{
  integrity_id: string;
  assessment_id: string;
  integrity_hash: string;
  previous_hash: string;
  verification_status: "PASS" | "FAIL";
  verification_timestamp: "1970-01-01T00:00:00.000Z";
  verifier_version: "integrity-verifier/v1";
}>;

export type RepositoryIndexes = Readonly<{
  assessment_index: readonly string[];
  maturity_level_index: readonly AutonomyMaturityLevel[];
  domain_index: readonly AutonomyMaturityDomain[];
  tenant_index: readonly string[];
  mission_index: readonly string[];
  certification_index: readonly string[];
  governance_index: readonly string[];
  constitutional_index: readonly string[];
  replay_index: readonly string[];
  lineage_index: readonly string[];
  timestamp_index: readonly string[];
  integrity_hash: string;
}>;

export type MaturityLedgerEvidenceRepository = Readonly<{
  repository_id: string;
  final_state: "MATURITY_LEDGER_REPOSITORY_COMPLETE" | "MATURITY_LEDGER_REPOSITORY_FAILED";
  recommendation_repository: ImprovementRecommendationRepository;
  assessment_ledger: readonly MaturityAssessmentLedgerRecord[];
  domain_scores: readonly DomainScoreRecord[];
  evidence_repository: readonly EvidenceArtifact[];
  lineage_store: readonly LineageRecord[];
  replay_repository: readonly ReplayRecord[];
  integrity_records: readonly IntegrityRecord[];
  indexes: RepositoryIndexes;
  failures: readonly MaturityLedgerFailure[];
  append_only: boolean;
  immutable: boolean;
  tenant_isolated: boolean;
  mutation_authorized: false;
  repository_administration_mutation_authorized: false;
  integrity_hash: string;
}>;

export type MaturityLedgerValidationResult = Readonly<{
  repository_id: string;
  valid: boolean;
  ledger_immutable: boolean;
  evidence_complete: boolean;
  replay_references_complete: boolean;
  lineage_intact: boolean;
  integrity_verified: boolean;
  identifiers_unique: boolean;
  replay_reconstruction_verified: boolean;
  governance_evidence_present: boolean;
  constitutional_evidence_present: boolean;
  no_hidden_entries: boolean;
  tenant_isolated: boolean;
  append_only: boolean;
  failures: readonly MaturityLedgerFailure[];
  validation_hash: string;
}>;

export type MaturityLedgerObservabilitySurface = Readonly<{
  repository_id: string;
  final_state: string;
  assessment_count: number;
  domain_score_count: number;
  evidence_count: number;
  lineage_count: number;
  replay_count: number;
  integrity_record_count: number;
  failure_count: number;
  append_only: boolean;
  immutable: boolean;
  integrity_hash: string;
}>;

export type MaturityLedgerInput = Readonly<{ scenario?: MaturityLedgerScenario; repository?: MaturityLedgerEvidenceRepository; recommendation_repository?: ImprovementRecommendationRepository }>;

export type MaturityLedgerBundle = Readonly<{
  doctrine: Readonly<{
    engine_version: "maturity-ledger-evidence-repository/v8ALT.11.8";
    final_state: "MATURITY_LEDGER_REPOSITORY_READY";
    principles: readonly string[];
  }>;
  repository: MaturityLedgerEvidenceRepository;
  validation: MaturityLedgerValidationResult;
  observability: MaturityLedgerObservabilitySurface;
}>;
