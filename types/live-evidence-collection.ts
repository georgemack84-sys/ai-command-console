export type LiveEvidenceCollectionOutcome = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type EvidenceLifecycleState = "EVIDENCE_GENERATED" | "VALIDATED" | "INTEGRITY_VERIFIED" | "STORED" | "LINKED_INTO_LINEAGE" | "REPLAY_REFERENCED" | "CERTIFICATION_REFERENCED" | "IMMUTABLE_ARCHIVE";
export type PilotEvidenceCategory = "OPERATIONAL" | "RECOMMENDATION" | "REPLAY" | "INCIDENT" | "CERTIFICATION" | "GOVERNANCE";
export type EvidenceDivergenceClassification = "NONE" | "EXPLAINED" | "UNEXPLAINED";
export type LiveEvidenceCollectionFailure = "EVIDENCE_NOT_IMMUTABLE" | "LINEAGE_NOT_UNIFIED" | "EVIDENCE_PLATFORM_NOT_REUSED" | "CERTIFICATION_EVIDENCE_NOT_INTEGRATED" | "DUPLICATE_EVIDENCE_INFRASTRUCTURE_CREATED" | "REPLAY_REFERENCES_NON_DETERMINISTIC" | "INTEGRITY_VALIDATION_NOT_OPERATIONAL" | "TENANT_ISOLATION_NOT_VERIFIED" | "GOVERNANCE_ENFORCEMENT_INCOMPLETE" | "OPERATIONAL_EVIDENCE_NOT_TRACEABLE" | "PHASE_16_3_RUNTIME_NOT_VALID" | "NON_CONSTITUTIONAL_EVIDENCE_WARNING";
export type LiveEvidenceCollectionScenario = "BASELINE" | LiveEvidenceCollectionFailure;

export type LiveEvidenceCollectionInput = Readonly<{ scenario?: LiveEvidenceCollectionScenario; tenant_id?: string; operator_id?: string; mission_id?: string; operation_id?: string }>;

export type PilotEvidenceRecord = Readonly<{
  evidence_id: string;
  tenant_id: string;
  mission_id: string;
  operation_id: string;
  generated_at: string;
  validated_at: string;
  evidence_category: PilotEvidenceCategory;
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  certification_refs: readonly string[];
  governance_refs: readonly string[];
  immutable: boolean;
  append_only: boolean;
  integrity_hash: string;
}>;

export type PilotOperationalEvidence = Readonly<{
  operational_evidence_id: string;
  runtime_state: string;
  operator_interactions: readonly string[];
  recommendation_lifecycle: readonly string[];
  policy_evaluations: readonly string[];
  authorization_decisions: readonly string[];
  deployment_state: string;
  advisory_outputs: readonly string[];
  runtime_metrics: readonly string[];
  system_health: string;
  fully_traceable: boolean;
  integrity_hash: string;
}>;

export type PilotRecommendationEvidence = Readonly<{
  recommendation_evidence_id: string;
  recommendation_id: string;
  recommendation_inputs: readonly string[];
  reasoning_refs: readonly string[];
  confidence: number;
  uncertainty: readonly string[];
  supporting_evidence: readonly string[];
  governance_evaluation: string;
  operator_review: string;
  operator_decision: "ACKNOWLEDGED" | "REJECTED" | "PENDING";
  final_outcome: string;
  integrity_hash: string;
}>;

export type PilotReplayEvidence = Readonly<{
  replay_evidence_id: string;
  replay_inputs: readonly string[];
  replay_outputs: readonly string[];
  deterministic_comparison: boolean;
  divergence_classification: EvidenceDivergenceClassification;
  divergence_explanation: string | null;
  replay_refs: readonly string[];
  replay_certification: string;
  integrity_hash: string;
}>;

export type PilotIncidentEvidence = Readonly<{
  incident_evidence_id: string;
  incident_id: string;
  severity: "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  classification: string;
  containment_actions: readonly string[];
  operator_response: string;
  governance_actions: readonly string[];
  remediation_refs: readonly string[];
  replay_refs: readonly string[];
  certification_impact: "NONE" | "REVIEW_REQUIRED" | "BLOCKING";
  integrity_hash: string;
}>;

export type EvidenceIntegrityValidationRecord = Readonly<{
  validation_id: string;
  immutable_identity: boolean;
  cryptographic_integrity: boolean;
  hash_consistency: boolean;
  lineage_complete: boolean;
  replay_references: boolean;
  certification_references: boolean;
  tenant_ownership: boolean;
  governance_metadata: boolean;
  timestamp_consistency: boolean;
  operational: boolean;
  integrity_hash: string;
}>;

export type ProductionEvidenceRegistryRecord = Readonly<{
  registry_id: string;
  reused_platform_ref: string;
  stored_evidence_refs: readonly string[];
  evidence_domains: readonly PilotEvidenceCategory[];
  append_only: boolean;
  centralized_persistence: boolean;
  duplicate_infrastructure_created: boolean;
  integrity_hash: string;
}>;

export type EvidenceLineageGraphExtension = Readonly<{
  lineage_graph_id: string;
  unified_platform_ref: string;
  nodes: readonly string[];
  edges: readonly string[];
  recommendation_to_certification_path: readonly string[];
  disconnected_lineage_count: number;
  unified: boolean;
  immutable: boolean;
  integrity_hash: string;
}>;

export type EvidencePlatformIntegrationLayer = Readonly<{
  integration_id: string;
  reused_capabilities: readonly string[];
  extended_capabilities: readonly string[];
  centralized_certification: boolean;
  governance_enforced: boolean;
  tenant_isolated: boolean;
  no_parallel_architecture: boolean;
  integrity_hash: string;
}>;

export type LiveEvidenceCollectionCertificationTest = Readonly<{
  test_id: string;
  name: string;
  expected: "PASS";
  actual: LiveEvidenceCollectionOutcome;
  passed: boolean;
  failure_reason: LiveEvidenceCollectionFailure | null;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type LiveEvidenceCollectionResult = Readonly<{
  phase_version: "live-evidence-collection/v16.4";
  phase_identifier: "LiveEvidenceCollection";
  production_advisory_runtime_ref: string;
  lifecycle: readonly EvidenceLifecycleState[];
  master_evidence: PilotEvidenceRecord;
  operational_evidence: PilotOperationalEvidence;
  recommendation_evidence: PilotRecommendationEvidence;
  replay_evidence: PilotReplayEvidence;
  incident_evidence: PilotIncidentEvidence;
  integrity_validation: EvidenceIntegrityValidationRecord;
  registry: ProductionEvidenceRegistryRecord;
  lineage: EvidenceLineageGraphExtension;
  integration: EvidencePlatformIntegrationLayer;
  certification_tests: readonly LiveEvidenceCollectionCertificationTest[];
  failures: readonly LiveEvidenceCollectionFailure[];
  outcome: LiveEvidenceCollectionOutcome;
  replay_hash: string;
  integrity_hash: string;
}>;

export type LiveEvidenceCollectionValidation = Readonly<{
  valid: boolean;
  outcome: LiveEvidenceCollectionOutcome;
  evidence_valid: boolean;
  operational_valid: boolean;
  recommendation_valid: boolean;
  replay_valid: boolean;
  incident_valid: boolean;
  integrity_valid: boolean;
  registry_valid: boolean;
  lineage_valid: boolean;
  integration_valid: boolean;
  certification_valid: boolean;
  result_replay_valid: boolean;
  failures: readonly LiveEvidenceCollectionFailure[];
  integrity_hash: string;
}>;

export type LiveEvidenceCollectionBundle = Readonly<{
  doctrine: Readonly<{
    version: "live-evidence-collection/v16.4";
    upstream_phase: "production-advisory-runtime/v16.3";
    lifecycle: readonly EvidenceLifecycleState[];
    evidence_categories: readonly PilotEvidenceCategory[];
    certification_outcomes: readonly LiveEvidenceCollectionOutcome[];
  }>;
  result: LiveEvidenceCollectionResult;
  validation: LiveEvidenceCollectionValidation;
}>;
