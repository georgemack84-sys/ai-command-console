import type { DriftHealthPackage } from "@/types/drift-health-intelligence";

export type InterventionRecommendationState = "GENERATED" | "VALIDATING" | "AUTHORIZED" | "PUBLISHED" | "ACKNOWLEDGED" | "REJECTED" | "SUPERSEDED" | "ARCHIVED";
export type InterventionRecommendationCategory = "INTERVENTION" | "PAUSE" | "ROLLBACK" | "CONFIDENCE";
export type InterventionRecommendationSeverity = "INFORMATIONAL" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type InterventionRecommendationPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT" | "IMMEDIATE";

export type InterventionRecommendationScenario =
  | "BASELINE"
  | "MINOR_EXECUTION_DRIFT"
  | "POLICY_INCONSISTENCY"
  | "EVIDENCE_UNCERTAINTY"
  | "CONFIDENCE_DEGRADATION"
  | "RECOMMENDATION_INSTABILITY"
  | "GOVERNANCE_UNCERTAINTY"
  | "EXECUTION_INSTABILITY"
  | "CHECKPOINT_FAILURE"
  | "DEPENDENCY_FAILURE"
  | "CRITICAL_EXECUTION_DRIFT"
  | "SEVERE_WORKFLOW_CORRUPTION"
  | "UNRECOVERABLE_DEGRADATION"
  | "NONDETERMINISTIC_RECOMMENDATION"
  | "MISSING_SUPPORTING_EVIDENCE"
  | "GOVERNANCE_REVIEW_INCOMPLETE"
  | "EVIDENCE_REVIEW_INCOMPLETE"
  | "UNSAFE_PAUSE"
  | "ROLLBACK_BOUNDARY_VIOLATION"
  | "CONFIDENCE_RESTORATION_UNJUSTIFIED"
  | "POLICY_REFERENCES_MISSING"
  | "CONSTITUTIONAL_REFERENCES_MISSING"
  | "AUTHORITY_UNDEFINED"
  | "REPLAY_MISMATCH"
  | "LINEAGE_INCOMPLETE"
  | "TENANT_VIOLATION"
  | "HIDDEN_LOGIC"
  | "AUTONOMOUS_INTERVENTION"
  | "GOVERNANCE_BYPASS"
  | "HASH_MISMATCH";

export type InterventionRecommendationFailureReason =
  | "RECOMMENDATION_NONDETERMINISTIC"
  | "SUPPORTING_EVIDENCE_MISSING"
  | "OPERATOR_REVIEW_NOT_GENERATED"
  | "GOVERNANCE_REVIEW_INCOMPLETE"
  | "EVIDENCE_REVIEW_OMITS_OBSERVATIONS"
  | "PAUSE_RECOMMENDATION_UNSAFE"
  | "ROLLBACK_BOUNDARY_VIOLATION"
  | "CONFIDENCE_RESTORATION_UNJUSTIFIED"
  | "POLICY_REFERENCES_MISSING"
  | "CONSTITUTIONAL_REFERENCES_MISSING"
  | "AUTHORITY_REQUIREMENTS_UNDEFINED"
  | "REPLAY_RECONSTRUCTION_MISMATCH"
  | "LINEAGE_INCOMPLETE"
  | "TENANT_ISOLATION_VIOLATION"
  | "HIDDEN_RECOMMENDATION_LOGIC"
  | "AUTONOMOUS_INTERVENTION_ATTEMPTED"
  | "GOVERNANCE_OR_OPERATOR_BYPASS"
  | "INTEGRITY_HASH_MISMATCH";

export type InterventionRecommendation = Readonly<{
  recommendation_id: string;
  supervision_id: string;
  execution_id: string;
  mission_id: string;
  tenant_id: string;
  recommendation_category: InterventionRecommendationCategory;
  recommendation_type: string;
  severity: InterventionRecommendationSeverity;
  priority: InterventionRecommendationPriority;
  recommended_action: string;
  justification: string;
  expected_outcome: string;
  authority_required: readonly string[];
  operator_required: boolean;
  timestamp: string;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
}>;

export type InterventionRecommendationEvidence = Readonly<{
  evidence_id: string;
  recommendation_id: string;
  supporting_observations: readonly string[];
  drift_assessments: readonly string[];
  health_assessments: readonly string[];
  confidence_assessments: readonly string[];
  governance_assessments: readonly string[];
  evidence_quality: "COMPLETE" | "PARTIAL" | "INSUFFICIENT";
  timestamp: string;
  integrity_hash: string;
}>;

export type InterventionRecommendationMetadata = Readonly<{
  metadata_id: string;
  evidence: string;
  confidence: number;
  explanation: readonly string[];
  policy_references: readonly string[];
  constitutional_references: readonly string[];
  authority_references: readonly string[];
  replay_references: readonly string[];
  lineage_reference: string;
  integrity_hash: string;
}>;

export type InterventionRecommendationValidationResult = Readonly<{
  validation_id: string;
  package_id: string;
  validation_state: "PASS" | "FAIL";
  failures: readonly InterventionRecommendationFailureReason[];
  evidence_exists: boolean;
  deterministic: boolean;
  reproducible: boolean;
  authority_identified: boolean;
  policy_references_complete: boolean;
  constitutional_references_complete: boolean;
  replay_ready: boolean;
  lineage_preserved: boolean;
  integrity_verified: boolean;
  advisory_only: boolean;
  tenant_isolated: boolean;
  ready_for_publication: boolean;
  validation_hash: string;
}>;

export type InterventionRecommendationReplayResult = Readonly<{
  replay_id: string;
  package_id: string;
  reconstructed_pipeline: readonly string[];
  reconstructed_recommendation_hash: string;
  reconstructed_evidence_hash: string;
  reconstructed_metadata_hash: string;
  validation_state: "PASS" | "FAIL";
  failure_reason: InterventionRecommendationFailureReason | null;
  replay_hash: string;
}>;

export type InterventionRecommendationPackage = Readonly<{
  package_id: string;
  engine_version: "intervention-recommendation-engine/v8E.D";
  source_drift_health_package: DriftHealthPackage;
  recommendation_state: InterventionRecommendationState;
  recommendation: InterventionRecommendation;
  recommendation_evidence: InterventionRecommendationEvidence;
  recommendation_metadata: InterventionRecommendationMetadata;
  validation: InterventionRecommendationValidationResult;
  replay: InterventionRecommendationReplayResult;
  advisory_only: true;
  execution_performed: false;
  rollback_performed: false;
  pause_performed: false;
  authority_granted: false;
  governance_bypassed: false;
  hidden_logic_used: false;
  package_hash: string;
}>;

export type InterventionRecommendationDashboardSurface = Readonly<{
  package_id: string;
  recommendation_id: string;
  execution_id: string;
  category: InterventionRecommendationCategory;
  severity: InterventionRecommendationSeverity;
  priority: InterventionRecommendationPriority;
  recommended_action: string;
  operator_required: boolean;
  validation_state: "PASS" | "FAIL";
  failures: readonly InterventionRecommendationFailureReason[];
  integrity_status: "VALID" | "INVALID";
}>;

export type InterventionRecommendationFramework = Readonly<{
  doctrine: Readonly<{
    principles: readonly string[];
    engine_version: "intervention-recommendation-engine/v8E.D";
    states: readonly InterventionRecommendationState[];
    categories: readonly InterventionRecommendationCategory[];
    priorities: readonly InterventionRecommendationPriority[];
  }>;
  package: InterventionRecommendationPackage;
  dashboard: InterventionRecommendationDashboardSurface;
}>;
