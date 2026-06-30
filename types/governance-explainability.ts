import type { DecisionInfluenceAnalysis } from "@/types/decision-influence-analysis";
import type { GovernanceLineageRecord } from "@/types/governance-lineage";
import type { PolicyLineageReconstruction } from "@/types/policy-lineage-reconstruction";

export type GovernanceExplanationState = "CREATED" | "ASSEMBLED" | "VALIDATED" | "CERTIFIED" | "SUPERSEDED" | "ARCHIVED";

export type GovernanceExplanationReplayState = "REPRODUCED" | "MISMATCH" | "INCOMPLETE";

export type GovernanceExplanationValidationState = "VALID" | "INVALID" | "TENANT_SCOPE_VIOLATION" | "REPLAY_MISMATCH" | "CERTIFICATION_BLOCKED";

export type GovernanceExplanationScenario =
  | "BASELINE"
  | "MISSING_EXPLANATION_ID"
  | "MISSING_OBJECT"
  | "MISSING_LINEAGE"
  | "MISSING_POLICY"
  | "MISSING_EVIDENCE"
  | "MISSING_INFLUENCE_GRAPH"
  | "MISSING_CONSTITUTION"
  | "MISSING_CONFIDENCE"
  | "MISSING_REPLAY"
  | "HIDDEN_INFLUENCE"
  | "CROSS_TENANT"
  | "REPLAY_MISMATCH"
  | "UNSUPPORTED_INFERENCE"
  | "IMMUTABLE_MUTATION";

export type GovernanceExplanationLayer = Readonly<{
  layer_id: string;
  layer_type: "EXECUTIVE_SUMMARY" | "DETAILED_REASONING" | "TECHNICAL_TRACE";
  content: string;
  references: readonly string[];
  layer_hash: string;
}>;

export type GovernanceExplanationViews = Readonly<{
  executive_view: Readonly<{
    summary: string;
    recommendation: string;
    confidence: string;
    key_policies: readonly string[];
  }>;
  governance_view: Readonly<{
    policy_history: readonly string[];
    constitutional_rules: readonly string[];
    authority_decisions: readonly string[];
    governance_constraints: readonly string[];
  }>;
  audit_view: Readonly<{
    evidence_chain: readonly string[];
    lineage_graph: readonly string[];
    influence_graph: readonly string[];
    replay_references: readonly string[];
    integrity_hashes: readonly string[];
  }>;
  technical_view: Readonly<{
    identifiers: readonly string[];
    dependency_graph: readonly string[];
    state_transitions: readonly string[];
    replay_metadata: readonly string[];
    truth_ledger_references: readonly string[];
  }>;
}>;

export type GovernanceExplanationReplayRefs = Readonly<{
  replay_id: string;
  explanation_hash: string;
  summary_hash: string;
  reasoning_hash: string;
  references_hash: string;
  formatting_hash: string;
  ordering_hash: string;
  replay_output_hash: string;
}>;

export type GovernanceExplanation = Readonly<{
  explanation_id: string;
  tenant_id: string;
  mission_id: string;
  governance_object: string;
  object_identifier: string;
  lineage_reference: string;
  policy_references: readonly string[];
  evidence_references: readonly string[];
  risk_references: readonly string[];
  compliance_references: readonly string[];
  authority_references: readonly string[];
  escalation_references: readonly string[];
  summary: string;
  detailed_explanation: string;
  technical_trace: string;
  layers: readonly GovernanceExplanationLayer[];
  views: GovernanceExplanationViews;
  confidence_reference: string;
  replay_reference: string;
  truth_record_reference: string;
  source_governance_lineage_id: string;
  source_policy_reconstruction_id: string;
  source_decision_influence_analysis_id: string;
  replay_refs: GovernanceExplanationReplayRefs;
  inference_guard: Readonly<{
    verified_sources_only: true;
    unsupported_inference_detected: boolean;
    hidden_reasoning_detected: boolean;
  }>;
  state: GovernanceExplanationState;
  version: "governance-explainability/v7G.4";
  created_timestamp: string;
  explanation_hash: string;
}>;

export type GovernanceExplanationErrorCode = "GEE-001" | "GEE-002" | "GEE-003" | "GEE-004" | "GEE-005" | "GEE-006" | "GEE-007" | "GEE-008" | "GEE-009" | "GEE-010" | "GEE-011" | "GEE-012" | "GEE-013" | "GEE-014" | "GEE-015";

export type GovernanceExplanationFailureReason =
  | "MISSING_EXPLANATION_IDENTIFIER"
  | "GOVERNANCE_OBJECT_NOT_FOUND"
  | "LINEAGE_REFERENCE_MISSING"
  | "POLICY_REFERENCE_MISSING"
  | "EVIDENCE_REFERENCE_INCOMPLETE"
  | "INFLUENCE_GRAPH_INCOMPLETE"
  | "CONSTITUTIONAL_REFERENCE_MISSING"
  | "CONFIDENCE_REFERENCE_MISSING"
  | "REPLAY_METADATA_MISSING"
  | "HIDDEN_INFLUENCE_DETECTED"
  | "CROSS_TENANT_REFERENCE_DETECTED"
  | "EXPLANATION_REPLAY_MISMATCH"
  | "UNSUPPORTED_INFERENCE_ATTEMPTED"
  | "IMMUTABLE_EXPLANATION_MODIFIED"
  | "GOVERNANCE_EXPLANATION_VALIDATION_FAILED";

export type GovernanceExplanationValidationFailure = Readonly<{
  error_code: GovernanceExplanationErrorCode;
  reason: GovernanceExplanationFailureReason;
  field_path: string;
  message: string;
  fail_closed: true;
}>;

export type GovernanceExplanationValidationResult = Readonly<{
  explanation_id?: string;
  validation_state: GovernanceExplanationValidationState;
  validator_version: "GOVERNANCE-EXPLAINABILITY-VALIDATOR-V1";
  checks: Readonly<{
    identity_valid: boolean;
    object_present: boolean;
    lineage_complete: boolean;
    policy_complete: boolean;
    evidence_complete: boolean;
    influence_complete: boolean;
    constitution_present: boolean;
    confidence_present: boolean;
    replay_ready: boolean;
    hidden_reasoning_absent: boolean;
    tenant_isolated: boolean;
    no_unsupported_inference: boolean;
    immutable: boolean;
    hash_valid: boolean;
  }>;
  errors: readonly GovernanceExplanationValidationFailure[];
  warnings: readonly string[];
  validation_timestamp: string;
}>;

export type GovernanceExplanationReplayResult = Readonly<{
  replay_id: string;
  replay_state: GovernanceExplanationReplayState;
  reconstructed_hash: string;
  expected_hash: string;
  explanation_id: string;
  failure_reason: GovernanceExplanationFailureReason | null;
}>;

export type GovernanceExplainabilityEngineInput = Readonly<{
  scenario?: GovernanceExplanationScenario;
  tenant_id?: string;
  mission_id?: string;
  governance_lineage?: GovernanceLineageRecord;
  policy_lineage?: PolicyLineageReconstruction;
  decision_influence?: DecisionInfluenceAnalysis;
}>;

export type GovernanceExplainabilityEngineResult = Readonly<{
  engine_id: string;
  explanation: GovernanceExplanation;
  validation: GovernanceExplanationValidationResult;
  replay: GovernanceExplanationReplayResult;
}>;

export type GovernanceExplanationObservabilitySurface = Readonly<{
  explanation_id: string;
  object_identifier: string;
  state: GovernanceExplanationState;
  layer_count: number;
  replay_state: GovernanceExplanationReplayState;
  validation_failures: readonly GovernanceExplanationFailureReason[];
  executive_summary: string;
  advisory_only_notice: string;
}>;
