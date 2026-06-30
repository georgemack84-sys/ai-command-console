export type EscalationType = "CONSTITUTIONAL" | "AUTHORITY" | "POLICY" | "COMPLIANCE" | "GOVERNANCE" | "RISK" | "RECOMMENDATION" | "EVIDENCE" | "REPLAY" | "OPERATIONAL";
export type EscalationTriggerType = "CONSTITUTIONAL_CONFLICT" | "AUTHORITY_DRIFT" | "POLICY_VIOLATION" | "COMPLIANCE_GAP" | "GOVERNANCE_EXCEPTION" | "RISK_THRESHOLD" | "RECOMMENDATION_BLOCKER" | "EVIDENCE_INTEGRITY_FAILURE" | "REPLAY_MISMATCH" | "OPERATIONAL_FAILURE";
export type EscalationSeverity = "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type EscalationRoutingTarget = "OPERATOR_REVIEW" | "GOVERNANCE_REVIEW" | "COMPLIANCE_REVIEW" | "POLICY_REVIEW" | "CONSTITUTIONAL_REVIEW" | "EMERGENCY_GOVERNANCE_REVIEW";
export type EscalationRoutingPriority = "INFORMATIONAL" | "LOW" | "NORMAL" | "HIGH" | "URGENT";
export type EscalationConfidenceLevel = "LOW" | "MODERATE" | "HIGH" | "CERTIFICATION_READY";
export type EscalationState = "CREATED" | "VALIDATED" | "PRIORITIZED" | "ROUTED" | "RECORDED" | "REPLAYED" | "CERTIFIED" | "SUPERSEDED" | "ARCHIVED";
export type EscalationValidationState = "VALID" | "INVALID" | "TENANT_SCOPE_VIOLATION" | "REPLAY_MISMATCH" | "CERTIFICATION_BLOCKED";
export type EscalationReplayState = "REPRODUCED" | "MISMATCH" | "INCOMPLETE";

export type EscalationTriggerDefinition = Readonly<{
  trigger_id: string;
  trigger_type: EscalationTriggerType;
  trigger_name: string;
  trigger_reason: string;
  trigger_timestamp: string;
  trigger_source: string;
  deterministic_trigger_hash: string;
}>;

export type EscalationSeverityDefinition = Readonly<{
  severity: EscalationSeverity;
  severity_score: number;
  severity_reason: string;
  threshold_model_version: "ESCALATION-SEVERITY-V1";
}>;

export type EscalationRoutingDefinition = Readonly<{
  routing_target: EscalationRoutingTarget;
  routing_priority: EscalationRoutingPriority;
  routing_reason: string;
  routing_policy: string;
  deterministic_routing_hash: string;
}>;

export type EscalationEvidenceReferences = Readonly<{
  evidence_ids: readonly string[];
  truth_record_ids: readonly string[];
  recommendation_ids: readonly string[];
  policy_ids: readonly string[];
  risk_ids: readonly string[];
  compliance_ids: readonly string[];
  lineage_refs: readonly string[];
}>;

export type EscalationGovernanceContext = Readonly<{
  constitutional_context: readonly string[];
  authority_context: readonly string[];
  policy_context: readonly string[];
  compliance_context: readonly string[];
  risk_context: readonly string[];
}>;

export type EscalationConfidenceMetadata = Readonly<{
  confidence_score: number;
  confidence_level: EscalationConfidenceLevel;
  confidence_reason: string;
  confidence_inputs: Readonly<Record<string, number | string>>;
  confidence_hash: string;
}>;

export type EscalationLineageReferences = Readonly<{
  parent_escalation_id: string | null;
  root_escalation_id: string;
  lineage_chain: readonly string[];
  supersedes_escalation_ids: readonly string[];
  related_escalation_ids: readonly string[];
}>;

export type EscalationReplayMetadata = Readonly<{
  replay_id: string;
  replay_hash: string;
  reconstruction_hash: string;
  replay_timestamp: string;
}>;

export type EscalationTruthLedgerReference = Readonly<{
  truth_record_reference: string;
  ledger_hash: string;
  ledger_sequence: number;
}>;

export type EscalationCertificationMetadata = Readonly<{
  contract_version: "ESCALATION-CONTRACT-V1";
  schema_version: "ESCALATION-SCHEMA-V1";
  certification_version: "ESCALATION-CERTIFICATION-PREREQ-V1";
  validation_state: EscalationValidationState;
}>;

export type EscalationAdvisoryBoundary = Readonly<{
  advisory_only: true;
  execution_authority: false;
  mutation_authority: false;
  approval_authority: false;
  operator_override_authority: false;
  authority_expansion: false;
}>;

export type EscalationContractRecord = Readonly<{
  escalation_id: string;
  tenant_id: string;
  mission_id: string;
  governance_session_id: string;
  escalation_type: EscalationType;
  category: string;
  source: string;
  trigger_definition: EscalationTriggerDefinition;
  severity_definition: EscalationSeverityDefinition;
  routing_definition: EscalationRoutingDefinition;
  evidence_references: EscalationEvidenceReferences;
  governance_context: EscalationGovernanceContext;
  confidence_metadata: EscalationConfidenceMetadata;
  lineage_references: EscalationLineageReferences;
  replay_metadata: EscalationReplayMetadata;
  truth_ledger_reference: EscalationTruthLedgerReference;
  certification_metadata: EscalationCertificationMetadata;
  advisory_boundary: EscalationAdvisoryBoundary;
  state: EscalationState;
  created_timestamp: string;
  escalation_hash: string;
}>;

export type EscalationValidationFailureReason =
  | "CONTRACT_MISSING"
  | "UNSUPPORTED_CONTRACT_VERSION"
  | "ESCALATION_ID_MISSING"
  | "TENANT_ID_MISSING"
  | "MISSION_ID_MISSING"
  | "GOVERNANCE_SESSION_ID_MISSING"
  | "UNSUPPORTED_ESCALATION_TYPE"
  | "TRIGGER_MISSING"
  | "UNSUPPORTED_TRIGGER"
  | "TRIGGER_HASH_MISMATCH"
  | "INVALID_SEVERITY"
  | "SEVERITY_SCORE_INVALID"
  | "SEVERITY_REASON_MISSING"
  | "ROUTING_TARGET_MISSING"
  | "ROUTING_HASH_MISMATCH"
  | "EVIDENCE_INCOMPLETE"
  | "LINEAGE_BROKEN"
  | "GOVERNANCE_CONTEXT_MISSING"
  | "CONFIDENCE_INVALID"
  | "CONFIDENCE_HASH_MISMATCH"
  | "REPLAY_METADATA_MISSING"
  | "REPLAY_HASH_MISMATCH"
  | "TRUTH_LEDGER_MISSING"
  | "INVALID_LEDGER_SEQUENCE"
  | "ADVISORY_BOUNDARY_MISSING"
  | "EXECUTION_AUTHORITY_DETECTED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "TENANT_SCOPE_VIOLATION"
  | "IMMUTABLE_IDENTITY_MUTATION"
  | "INVALID_STATE"
  | "HIDDEN_STATE_DETECTED"
  | "ESCALATION_HASH_MISMATCH";

export type EscalationValidationFailure = Readonly<{
  failure_id: string;
  reason: EscalationValidationFailureReason;
  field_path: string;
  message: string;
  fail_closed: true;
}>;

export type EscalationValidationResult = Readonly<{
  escalation_id?: string;
  validation_state: EscalationValidationState;
  validator_version: "ESCALATION-CONTRACT-VALIDATOR-V1";
  checks: Readonly<{
    identity_valid: boolean;
    trigger_valid: boolean;
    severity_valid: boolean;
    routing_valid: boolean;
    evidence_valid: boolean;
    governance_context_valid: boolean;
    confidence_valid: boolean;
    lineage_valid: boolean;
    replay_valid: boolean;
    ledger_valid: boolean;
    advisory_only_enforced: boolean;
    tenant_isolated: boolean;
    state_valid: boolean;
    hash_valid: boolean;
  }>;
  errors: readonly EscalationValidationFailure[];
  warnings: readonly string[];
  validation_timestamp: string;
}>;

export type EscalationReplayResult = Readonly<{
  replay_id: string;
  escalation_id: string;
  replay_state: EscalationReplayState;
  reconstructed_hash: string;
  expected_hash: string;
  failure_reason: EscalationValidationFailureReason | null;
}>;

export type EscalationLifecycleTransitionResult = Readonly<{
  from_state: EscalationState;
  to_state: EscalationState;
  allowed: boolean;
  reason: string;
}>;

export type EscalationObservabilitySurface = Readonly<{
  escalation_id: string;
  escalation_type: EscalationType;
  severity: EscalationSeverity;
  severity_score: number;
  routing_target: EscalationRoutingTarget;
  trigger_reason: string;
  evidence_basis: readonly string[];
  governance_context: EscalationGovernanceContext;
  confidence: Readonly<{ score: number; level: EscalationConfidenceLevel; reason: string }>;
  replay_state: EscalationReplayState;
  ledger_reference: EscalationTruthLedgerReference;
  advisory_only_notice: string;
  validation_failures: readonly EscalationValidationFailureReason[];
}>;

export type EscalationContractDoctrine = Readonly<{
  principles: readonly ("canonical" | "deterministic" | "trigger-defined" | "severity-thresholded" | "route-governed" | "evidence-bound" | "confidence-reproducible" | "lineage-preserving" | "replayable" | "truth-ledger-recorded" | "constitutional-supremacy" | "advisory-only" | "tenant-safe" | "certification-ready" | "fail-closed")[];
  supported_types: readonly EscalationType[];
  supported_triggers: readonly EscalationTriggerType[];
  supported_severities: readonly EscalationSeverity[];
  supported_routing_targets: readonly EscalationRoutingTarget[];
  lifecycle_states: readonly EscalationState[];
  contract_version: "ESCALATION-CONTRACT-V1";
}>;
