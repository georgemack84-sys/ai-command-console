import type { PatternAnalysisRepository } from "@/types/pattern-discovery-experience-analysis";

export type CandidateKnowledgeArtifactType = "PLANNING_TEMPLATE" | "EXECUTION_HEURISTIC" | "RECOVERY_TEMPLATE" | "DELEGATION_TEMPLATE" | "COORDINATION_TEMPLATE" | "CONFIDENCE_GUIDANCE" | "RECOMMENDATION_GUIDANCE" | "OPTIMIZATION_GUIDANCE";
export type CandidateArtifactLifecycleState = "GENERATED" | "NORMALIZED" | "EVIDENCE_LINKED" | "PRE_VALIDATED" | "READY_FOR_VALIDATION" | "SUPERSEDED" | "ARCHIVED" | "REJECTED";
export type CandidateArtifactActivationState = "INACTIVE" | "PENDING_VALIDATION" | "BLOCKED";
export type TemplateHeuristicGenerationScenario = "BASELINE" | "INVALID_PATTERN_REPOSITORY" | "NON_CERTIFIED_PATTERN" | "UNSTABLE_PATTERN" | "MISSING_EVIDENCE" | "REPLAY_INCONSISTENCY" | "GOVERNANCE_VIOLATION" | "CONSTITUTIONAL_VIOLATION" | "AUTHORITY_CONFLICT" | "INTEGRITY_FAILURE" | "DUPLICATE_DETERMINISTIC_ARTIFACT" | "AMBIGUOUS_TEMPLATE_GENERATION" | "CROSS_TENANT_LEARNING_ATTEMPT" | "ACTIVATION_ATTEMPTED" | "RUNTIME_MODIFICATION_ATTEMPTED" | "PLANNING_MODIFICATION_ATTEMPTED" | "GOVERNANCE_MODIFICATION_ATTEMPTED" | "HISTORICAL_OVERWRITE_ATTEMPTED" | "SELF_APPROVAL_ATTEMPTED";
export type TemplateHeuristicGenerationFailure = "INVALID_PATTERN_REPOSITORY" | "NON_CERTIFIED_PATTERN_REJECTED" | "UNSTABLE_PATTERN_REJECTED" | "MISSING_EVIDENCE_DETECTED" | "REPLAY_INCONSISTENCY_DETECTED" | "GOVERNANCE_VIOLATION_DETECTED" | "CONSTITUTIONAL_VIOLATION_DETECTED" | "AUTHORITY_CONFLICT_DETECTED" | "INTEGRITY_FAILURE_DETECTED" | "DUPLICATE_DETERMINISTIC_ARTIFACT_DETECTED" | "AMBIGUOUS_TEMPLATE_GENERATION_REJECTED" | "CROSS_TENANT_LEARNING_DETECTED" | "ACTIVATION_ATTEMPTED" | "RUNTIME_MODIFICATION_ATTEMPTED" | "PLANNING_MODIFICATION_ATTEMPTED" | "GOVERNANCE_MODIFICATION_ATTEMPTED" | "HISTORICAL_OVERWRITE_ATTEMPTED" | "SELF_APPROVAL_ATTEMPTED";

export type CandidateKnowledgeArtifact = Readonly<{
  artifact_id: string;
  artifact_name: string;
  artifact_type: CandidateKnowledgeArtifactType;
  version: string;
  tenant_id: string;
  source_patterns: readonly string[];
  contributing_missions: readonly string[];
  contributing_replays: readonly string[];
  contributing_knowledge_records: readonly string[];
  template_definition: readonly string[];
  heuristic_definition: readonly string[];
  intended_usage: string;
  applicability_conditions: readonly string[];
  stability_score: number;
  confidence_score: number;
  recurrence_frequency: number;
  expected_improvement: number;
  historical_success_rate: number;
  evidence_chain: readonly string[];
  lineage_reference: readonly string[];
  replay_reference: readonly string[];
  governance_status: "PRE_VALIDATED" | "BLOCKED";
  constitutional_status: "PRE_VALIDATED" | "BLOCKED";
  authority_status: "PRESERVED" | "CONFLICT";
  generation_timestamp: "1970-01-01T00:00:00.000Z";
  lifecycle_state: CandidateArtifactLifecycleState;
  activation_state: CandidateArtifactActivationState;
  explainability: readonly string[];
  rejected_generation_alternatives: readonly string[];
  advisory_only: true;
  activation_authorized: boolean;
  runtime_modification_authorized: boolean;
  planning_modification_authorized: boolean;
  governance_modification_authorized: boolean;
  self_approval_authorized: boolean;
  historical_truth_mutable: boolean;
  deterministic_signature: string;
  integrity_hash: string;
}>;

export type TemplateHeuristicAuditRecord = Readonly<{
  audit_id: string;
  artifact_id: string | null;
  rejection_reason: TemplateHeuristicGenerationFailure;
  immutable: true;
  append_only: true;
  replay_reference: string;
  integrity_hash: string;
}>;

export type CandidateKnowledgeRepository = Readonly<{
  repository_id: string;
  source_pattern_repository_id: string | null;
  source_pattern_repository_state: string;
  final_state: "CANDIDATE_KNOWLEDGE_GENERATED" | "CANDIDATE_KNOWLEDGE_REJECTED";
  artifacts: readonly CandidateKnowledgeArtifact[];
  audit_records: readonly TemplateHeuristicAuditRecord[];
  failures: readonly TemplateHeuristicGenerationFailure[];
  advisory_only: true;
  activation_authorized: false;
  runtime_modification_authorized: false;
  planning_modification_authorized: false;
  governance_modification_authorized: false;
  self_approval_authorized: false;
  historical_truth_mutable: false;
  integrity_hash: string;
}>;

export type TemplateHeuristicGenerationValidationResult = Readonly<{
  repository_id: string;
  valid: boolean;
  source_patterns_valid: boolean;
  evidence_complete: boolean;
  replay_compatible: boolean;
  lineage_complete: boolean;
  integrity_verified: boolean;
  governance_compatible: boolean;
  constitutional_compatible: boolean;
  authority_preserved: boolean;
  deterministic_generation: boolean;
  duplicate_artifacts_absent: boolean;
  tenant_isolated: boolean;
  inactive_until_approved: boolean;
  historical_truth_preserved: boolean;
  advisory_only: true;
  fail_closed: boolean;
  failures: readonly TemplateHeuristicGenerationFailure[];
  validation_hash: string;
}>;

export type TemplateHeuristicGenerationObservabilitySurface = Readonly<{
  repository_id: string;
  final_state: string;
  artifact_count: number;
  template_count: number;
  heuristic_count: number;
  audit_count: number;
  failure_count: number;
  ready_for_validation_count: number;
  advisory_only: true;
  activation_authorized: false;
  integrity_hash: string;
}>;

export type TemplateHeuristicGenerationInput = Readonly<{ scenario?: TemplateHeuristicGenerationScenario; patternRepository?: PatternAnalysisRepository; repository?: CandidateKnowledgeRepository }>;

export type TemplateHeuristicGenerationEngineBundle = Readonly<{
  doctrine: Readonly<{
    engine_version: "template-heuristic-generation-engine/v8ALT.9.4";
    final_state: "TEMPLATE_HEURISTIC_GENERATION_READY";
    artifact_types: readonly CandidateKnowledgeArtifactType[];
    lifecycle_states: readonly CandidateArtifactLifecycleState[];
    principles: readonly string[];
  }>;
  repository: CandidateKnowledgeRepository;
  validation: TemplateHeuristicGenerationValidationResult;
  observability: TemplateHeuristicGenerationObservabilitySurface;
}>;
