export interface DecisionGraphContract {
  graphId: string;
  tenantId: string;
  missionId: string;
  graphVersion: string;
  nodeCount: number;
  edgeCount: number;
  lineageReferences: string[];
  graphHash: string;
  graphState:
    | "INITIALIZED"
    | "VALIDATED"
    | "SEALED";
  sealed: boolean;
  createdAt: string;
}

export type CanonicalDecisionRelationshipType =
  | "depends_on"
  | "blocks"
  | "conflicts_with"
  | "supersedes"
  | "supports"
  | "weakens"
  | "escalates_to"
  | "requires_operator_approval"
  | "requires_governance_review"
  | "requires_simulation"
  | "requires_recovery_plan"
  | "requires_certification";

export type DecisionGraphNodeState =
  | "CREATED"
  | "REGISTERED"
  | "RELATIONSHIPS_PENDING"
  | "RELATIONSHIPS_RESOLVED"
  | "DEPENDENCY_VALIDATED"
  | "CONFLICT_DETECTED"
  | "BLOCKED"
  | "READY_FOR_ORDERING"
  | "ORDERED"
  | "SUPERSEDED"
  | "ESCALATED"
  | "CERTIFICATION_REQUIRED"
  | "REJECTED"
  | "ARCHIVED";

export type DecisionGraphHashState =
  | "MATCHED"
  | "MISMATCHED";

export interface DecisionDependencyGraphContract {
  contract_id: string;
  contract_version: string;
  graph_id: string;
  tenant_id: string;
  mission_id: string;
  graph_scope: "TENANT_MISSION";
  allowed_node_types: readonly DecisionGraphNodeType[];
  allowed_relationship_types: readonly CanonicalDecisionRelationshipType[];
  graph_state_model: readonly DecisionGraphNodeState[];
  integrity_rules_ref: string;
  replay_contract_ref: string;
  governance_contract_ref: string;
  certification_ref: string;
  created_at: string;
  integrity_hash: string;
}

export interface DecisionGraphNode {
  nodeId: string;
  graphId: string;
  nodeType:
    | "RECOMMENDATION"
    | "SIMULATION"
    | "CONSTRAINT"
    | "GOVERNANCE"
    | "ESCALATION"
    | "OBSERVABILITY";
  tenantId: string;
  lineageReference: string;
  node_id: string;
  decision_candidate_id: string;
  tenant_id: string;
  mission_id: string;
  decision_type: DecisionGraphNode["nodeType"];
  priority: number;
  state: DecisionGraphNodeState;
  dependency_refs: readonly string[];
  conflict_refs: readonly string[];
  blocker_refs: readonly string[];
  supporting_refs: readonly string[];
  weakening_refs: readonly string[];
  supersession_refs: readonly string[];
  escalation_refs: readonly string[];
  governance_refs: readonly string[];
  authority_refs: readonly string[];
  simulation_refs: readonly string[];
  recovery_refs: readonly string[];
  certification_refs: readonly string[];
  replay_refs: readonly string[];
  source_candidate_hash: string;
  created_at: string;
  updated_at: string;
  integrity_hash: string;
  immutableHash: string;
}

export interface DecisionGraphEdge {
  edgeId: string;
  graphId: string;
  sourceNodeId: string;
  targetNodeId: string;
  relationshipType:
    | "DEPENDS_ON"
    | "CONSTRAINED_BY"
    | "INFLUENCED_BY"
    | "ESCALATES_TO"
    | "OBSERVED_BY"
    | CanonicalDecisionRelationshipType;
  tenantId: string;
  immutableHash: string;
}

export type DecisionGraphNodeType = DecisionGraphNode["nodeType"];
export type DecisionGraphRelationshipType = DecisionGraphEdge["relationshipType"];

export type DecisionGraphNodeInput = Readonly<{
  nodeId: string;
  graphId: string;
  nodeType: DecisionGraphNodeType;
  tenantId: string;
  lineageReference: string;
  decisionCandidateId?: string;
  missionId?: string;
  priority?: number;
  state?: DecisionGraphNodeState;
  dependencyRefs?: readonly string[];
  conflictRefs?: readonly string[];
  blockerRefs?: readonly string[];
  supportingRefs?: readonly string[];
  weakeningRefs?: readonly string[];
  supersessionRefs?: readonly string[];
  escalationRefs?: readonly string[];
  governanceRefs?: readonly string[];
  authorityRefs?: readonly string[];
  simulationRefs?: readonly string[];
  recoveryRefs?: readonly string[];
  certificationRefs?: readonly string[];
  replayRefs?: readonly string[];
  sourceCandidateHash?: string;
  createdAt?: string;
  updatedAt?: string;
}>;

export type DecisionGraphEdgeInput = Readonly<{
  edgeId: string;
  graphId: string;
  sourceNodeId: string;
  targetNodeId: string;
  relationshipType: DecisionGraphRelationshipType;
  tenantId: string;
}>;

export type DecisionGraphContractInput = Readonly<{
  graphId: string;
  tenantId: string;
  missionId: string;
  graphVersion: string;
  createdAt: string;
  nodes: readonly DecisionGraphNodeInput[];
  edges: readonly DecisionGraphEdgeInput[];
  lineageReferences: readonly string[];
  graphState?: DecisionGraphContract["graphState"];
  sealed?: boolean;
  mutationAttempted?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  authorityExpansionRequested?: boolean;
}>;

export type DecisionRelationshipTypeRegistry = Readonly<{
  registry_id: string;
  registry_version: string;
  allowed_relationship_types: readonly CanonicalDecisionRelationshipType[];
  relationship_direction_rules: Readonly<Record<CanonicalDecisionRelationshipType, string>>;
  relationship_cardinality_rules: Readonly<Record<CanonicalDecisionRelationshipType, "ONE_TO_ONE" | "ONE_TO_MANY" | "MANY_TO_MANY">>;
  inverse_relationship_rules: Readonly<Record<CanonicalDecisionRelationshipType, CanonicalDecisionRelationshipType | null>>;
  prohibited_relationship_combinations: readonly string[];
  governance_required_types: readonly CanonicalDecisionRelationshipType[];
  replay_required_types: readonly CanonicalDecisionRelationshipType[];
  integrity_hash: string;
}>;

export type DecisionGraphRoadmapRelationshipInput = Readonly<{
  relationship_id: string;
  graph_id: string;
  tenant_id: string;
  mission_id: string;
  source_node_id: string;
  target_node_id: string;
  relationship_type: CanonicalDecisionRelationshipType;
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  hidden?: boolean;
  integrity_hash?: string;
}>;

export type DecisionGraphRoadmapNodeInput = Readonly<{
  node_id: string;
  decision_candidate_id: string;
  tenant_id: string;
  mission_id: string;
  decision_type: DecisionGraphNodeType;
  priority: number;
  state: DecisionGraphNodeState;
  dependency_refs: readonly string[];
  conflict_refs: readonly string[];
  blocker_refs: readonly string[];
  supporting_refs: readonly string[];
  weakening_refs?: readonly string[];
  supersession_refs?: readonly string[];
  escalation_refs?: readonly string[];
  governance_refs: readonly string[];
  authority_refs?: readonly string[];
  simulation_refs?: readonly string[];
  recovery_refs?: readonly string[];
  certification_refs?: readonly string[];
  replay_refs: readonly string[];
  source_candidate_hash: string;
  created_at: string;
  updated_at: string;
  integrity_hash?: string;
  previous_state?: DecisionGraphNodeState;
  hidden_relationship_refs?: readonly string[];
}>;

export type DecisionGraphIntegrityHash = Readonly<{
  hash_id: string;
  node_id: string;
  contract_version: string;
  hash_algorithm: "sha256";
  canonical_payload_ref: string;
  computed_hash: string;
  replay_computed_hash: string;
  hash_state: DecisionGraphHashState;
}>;

export type DecisionGraphReplayContract = Readonly<{
  replay_contract_id: string;
  graph_id: string;
  tenant_id: string;
  mission_id: string;
  contract_version: string;
  schema_version: string;
  relationship_registry_version: string;
  graph_state_model_version: string;
  candidate_refs: readonly string[];
  relationship_refs: readonly string[];
  governance_refs: readonly string[];
  integrity_hash_refs: readonly string[];
  expected_replay_hash: string;
}>;

export type DecisionGraphRoadmapReasonCode =
  | "GRAPH_CONTRACT_SCHEMA_DEFINED"
  | "GRAPH_CONTRACT_SCHEMA_INVALID"
  | "RELATIONSHIP_TYPES_REGISTERED"
  | "UNKNOWN_RELATIONSHIP_TYPE_REJECTED"
  | "NODE_SCHEMA_VALID"
  | "NODE_SCHEMA_INCOMPLETE"
  | "MISSING_CANDIDATE_LINK"
  | "GRAPH_STATE_MODEL_DEFINED"
  | "INVALID_GRAPH_STATE_REJECTED"
  | "INVALID_STATE_TRANSITION_REJECTED"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_RELATIONSHIP_REJECTED"
  | "MISSION_SCOPE_VALID"
  | "SELF_DEPENDENCY_REJECTED"
  | "GOVERNANCE_REFS_PRESENT"
  | "GOVERNANCE_REFS_MISSING"
  | "REPLAY_REFS_PRESENT"
  | "REPLAY_REFS_MISSING"
  | "NODE_INTEGRITY_HASH_REPRODUCIBLE"
  | "RELATIONSHIP_INTEGRITY_HASH_REPRODUCIBLE"
  | "MISSING_INTEGRITY_HASH_REJECTED"
  | "HASH_MISMATCH_DETECTED"
  | "HIDDEN_RELATIONSHIP_REJECTED"
  | "GRAPH_CONTRACT_REPLAY_COMPATIBLE"
  | "REPLAY_DIVERGENCE_REJECTED"
  | "NO_HIDDEN_GRAPH_CONTEXT_REQUIRED";

export type DecisionGraphRoadmapInput = Readonly<{
  contract: DecisionDependencyGraphContract;
  registry: DecisionRelationshipTypeRegistry;
  nodes: readonly DecisionGraphRoadmapNodeInput[];
  relationships: readonly DecisionGraphRoadmapRelationshipInput[];
  replay: DecisionGraphReplayContract;
}>;

export type DecisionGraphRoadmapValidation = Readonly<{
  valid: boolean;
  certificationStatus: "PASS" | "CONDITIONAL_PASS" | "FAIL";
  reasonCodes: readonly DecisionGraphRoadmapReasonCode[];
  contractHash: string;
  replayHash: string;
  graph_contract_schema_defined: boolean;
  relationship_types_registered: boolean;
  graph_state_model_defined: boolean;
  node_integrity_hash_reproducible: boolean;
  invalid_relationship_types_rejected: boolean;
  graph_contract_replay_compatible: boolean;
  failClosed: true;
  deterministic: true;
}>;

export type DecisionGraphNodeBuildReasonCode =
  | "CANDIDATE_RECEIVED"
  | "CANDIDATE_VALIDATION_STARTED"
  | "CANDIDATE_VALID"
  | "CANDIDATE_INVALID"
  | "CANDIDATE_INCOMPLETE"
  | "CANDIDATE_REJECTED"
  | "CANDIDATE_HASH_VERIFIED"
  | "CANDIDATE_HASH_MISMATCH"
  | "CANDIDATE_NODE_MAPPING_COMPLETE"
  | "NODE_ID_GENERATED"
  | "NODE_STATE_REGISTERED"
  | "GOVERNANCE_REFS_ATTACHED"
  | "MISSING_GOVERNANCE_REFS"
  | "REPLAY_REFS_ATTACHED"
  | "MISSING_REPLAY_REFS"
  | "TENANT_SCOPE_VALID"
  | "TENANT_MISMATCH"
  | "MISSION_SCOPE_VALID"
  | "MISSION_MISMATCH"
  | "NODE_INTEGRITY_HASH_COMPUTED"
  | "NODE_HASH_REPRODUCIBLE"
  | "NODE_HASH_MISMATCH"
  | "NODE_REGISTERED"
  | "DUPLICATE_NODE_ID"
  | "CROSS_TENANT_NODE_COLLISION_BLOCKED"
  | "ADVISORY_ONLY_STATUS_PRESERVED"
  | "ADVISORY_ONLY_STATUS_VIOLATED"
  | "HIDDEN_RUNTIME_CONTEXT_REJECTED"
  | "RANDOM_NODE_ID_REJECTED"
  | "REPLAY_RECONSTRUCTS_IDENTICAL_NODE";

export type DecisionGraphNodeRegistrationStatus =
  | "REGISTERED"
  | "REJECTED";

export type DecisionGraphNodeRecord = Readonly<{
  node_id: string;
  decision_candidate_id: string;
  tenant_id: string;
  mission_id: string;
  decision_type: DecisionGraphNodeType;
  priority: number;
  state: DecisionGraphNodeState;
  source_candidate_hash: string;
  graph_contract_version: string;
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  registration_status: DecisionGraphNodeRegistrationStatus;
  rejection_reason?: DecisionGraphNodeBuildReasonCode;
  created_from_candidate_ref: string;
  integrity_hash: string;
}>;

export type DecisionGraphNodeBuilderInput = Readonly<{
  candidate?: import("@/types/decision-input-normalization").DecisionCandidate;
  tenant_id?: string;
  mission_id?: string;
  normalized_version?: "decision-candidate-normalization/v1";
  graph_contract_version?: string;
  existing_node_records?: readonly DecisionGraphNodeRecord[];
  queue_relationship_resolution?: boolean;
  hidden_runtime_context?: unknown;
  requested_node_id?: string;
}>;

export type DecisionGraphNodeBuilderAuditRecord = Readonly<{
  audit_id: string;
  node_id: string;
  decision_candidate_id: string;
  audit_event: DecisionGraphNodeBuildReasonCode;
  result: "PASS" | "FAIL";
  replay_ref: string;
  integrity_hash: string;
}>;

export type DecisionGraphNodeBuilderResult = Readonly<{
  build_status: "PASS" | "FAIL";
  certificationStatus: "PASS" | "FAIL";
  reasonCodes: readonly DecisionGraphNodeBuildReasonCode[];
  node?: DecisionGraphRoadmapNodeInput;
  node_record: DecisionGraphNodeRecord;
  audit_records: readonly DecisionGraphNodeBuilderAuditRecord[];
  replay_ref: string;
  deterministic: true;
  failClosed: true;
  integrity_hash: string;
}>;

export type DecisionRelationshipDirection =
  | "SOURCE_TO_TARGET";

export type DecisionRelationshipTargetType =
  | "DECISION_NODE"
  | "OPERATOR"
  | "GOVERNANCE"
  | "SIMULATION"
  | "RECOVERY"
  | "CERTIFICATION"
  | "AUTHORITY";

export type DecisionRelationshipResolverReasonCode =
  | "GRAPH_NODES_RECEIVED"
  | "SCOPE_VALIDATED"
  | "CANDIDATE_LINEAGE_COMPARED"
  | "DEPENDENCY_MAPPING_COMPLETE"
  | "SUPPORT_WEAKENING_RESOLUTION_COMPLETE"
  | "SUPERSESSION_RESOLUTION_COMPLETE"
  | "ESCALATION_RESOLUTION_COMPLETE"
  | "RELATIONSHIP_COMBINATION_VALIDATED"
  | "DUPLICATE_RELATIONSHIPS_REMOVED"
  | "RELATIONSHIP_LINEAGE_RECORDED"
  | "GRAPH_NODE_REFS_UPDATED"
  | "RELATIONSHIP_LEDGER_PERSISTED"
  | "RELATIONSHIP_DIRECTION_PRESERVED"
  | "REPLAY_RECONSTRUCTS_IDENTICAL_RELATIONSHIPS"
  | "UNKNOWN_RELATIONSHIP_TYPE"
  | "AMBIGUOUS_RELATIONSHIP_DIRECTION"
  | "SELF_DEPENDENCY"
  | "SELF_SUPERSESSION"
  | "CROSS_TENANT_RELATIONSHIP"
  | "CROSS_MISSION_RELATIONSHIP"
  | "RELATIONSHIP_WITHOUT_REPLAY_REF"
  | "RELATIONSHIP_WITHOUT_GOVERNANCE_REF"
  | "DUPLICATE_RELATIONSHIP_CONFLICT"
  | "RELATIONSHIP_WITH_MISSING_SOURCE_NODE"
  | "RELATIONSHIP_WITH_MISSING_TARGET_NODE"
  | "HIDDEN_RELATIONSHIP"
  | "IMPLICIT_UNRECORDED_RELATIONSHIP"
  | "INVALID_RELATIONSHIP_COMBINATION"
  | "RELATIONSHIP_BASIS_MISSING"
  | "REPLAY_DIVERGENCE";

export type DecisionRelationshipHint = Readonly<{
  source_node_id: string;
  target_ref: string;
  target_type?: DecisionRelationshipTargetType;
  relationship_type: CanonicalDecisionRelationshipType;
  relationship_basis: readonly string[];
  confidence_basis: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  evidence_refs?: readonly string[];
  risk_refs?: readonly string[];
  hidden?: boolean;
  conflict_explanation_ref?: string;
}>;

export type DecisionRelationshipRecord = Readonly<{
  relationship_id: string;
  graph_id: string;
  source_node_id: string;
  target_node_id: string;
  target_type: DecisionRelationshipTargetType;
  relationship_type: CanonicalDecisionRelationshipType;
  direction: DecisionRelationshipDirection;
  relationship_basis: readonly string[];
  confidence_basis: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  source_candidate_refs: readonly string[];
  target_candidate_refs: readonly string[];
  resolver_version: string;
  integrity_hash: string;
}>;

export type DecisionRelationshipLineage = Readonly<{
  lineage_id: string;
  relationship_id: string;
  source_node_id: string;
  target_node_id: string;
  source_candidate_ref: string;
  target_candidate_ref: string;
  relationship_type: CanonicalDecisionRelationshipType;
  relationship_basis_refs: readonly string[];
  evidence_refs: readonly string[];
  risk_refs: readonly string[];
  confidence_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  resolver_version: string;
  integrity_hash: string;
}>;

export type DecisionRelationshipLedgerEvent = Readonly<{
  event_id: string;
  relationship_id: string;
  event_type: "RELATIONSHIP_RESOLVED" | "DUPLICATE_RELATIONSHIP_COLLAPSED" | "RELATIONSHIP_REJECTED";
  reason_code?: DecisionRelationshipResolverReasonCode;
  replay_ref: string;
  integrity_hash: string;
}>;

export type DecisionRelationshipResolverInput = Readonly<{
  graph_id: string;
  tenant_id: string;
  mission_id: string;
  nodes: readonly DecisionGraphRoadmapNodeInput[];
  relationship_hints: readonly DecisionRelationshipHint[];
  registry?: DecisionRelationshipTypeRegistry;
  resolver_version?: string;
  allow_implicit_relationships?: boolean;
  replay_expected_hash?: string;
}>;

export type DecisionRelationshipResolverResult = Readonly<{
  resolution_status: "PASS" | "FAIL";
  certificationStatus: "PASS" | "FAIL";
  reasonCodes: readonly DecisionRelationshipResolverReasonCode[];
  relationships: readonly DecisionRelationshipRecord[];
  lineage: readonly DecisionRelationshipLineage[];
  updated_nodes: readonly DecisionGraphRoadmapNodeInput[];
  ledger_events: readonly DecisionRelationshipLedgerEvent[];
  removed_duplicate_relationship_ids: readonly string[];
  replay_hash: string;
  deterministic: true;
  failClosed: true;
  integrity_hash: string;
}>;

export type DecisionDependencyValidationState =
  | "VALIDATED"
  | "MISSING"
  | "INVALID"
  | "UNAUTHORIZED"
  | "UNRESOLVED"
  | "REPLAY_FAILED";

export type DecisionDependencyStatus =
  | "COMPLETE"
  | "MISSING"
  | "INVALID"
  | "UNRESOLVED";

export type DependencyValidationReasonCode =
  | "DEPENDENCY_REFERENCES_LOADED"
  | "REFERENCE_VALIDATION_PASSED"
  | "INTEGRITY_VALIDATION_PASSED"
  | "GOVERNANCE_VALIDATION_PASSED"
  | "REPLAY_VALIDATION_PASSED"
  | "AUTHORITY_VALIDATION_PASSED"
  | "DEPENDENCY_READINESS_EVALUATED"
  | "DEPENDENCY_VALIDATION_LEDGER_PERSISTED"
  | "IMMUTABLE_VALIDATION_EVIDENCE_PRODUCED"
  | "REPLAY_RECONSTRUCTS_IDENTICAL_VALIDATION"
  | "MISSING_DEPENDENCY_DETECTED"
  | "PREREQUISITE_DECISION_MISSING"
  | "REQUIRED_APPROVAL_MISSING"
  | "REQUIRED_GOVERNANCE_REVIEW_MISSING"
  | "REQUIRED_SIMULATION_MISSING"
  | "REQUIRED_RECOVERY_PLAN_MISSING"
  | "REQUIRED_CERTIFICATION_MISSING"
  | "MISSING_REPLAY_DEPENDENCY"
  | "MISSING_AUTHORITY_DEPENDENCY"
  | "MISSING_EVIDENCE_DEPENDENCY"
  | "INVALID_DEPENDENCY_REFERENCE"
  | "MISSING_DEPENDENCY_NODE"
  | "DUPLICATE_DEPENDENCY"
  | "MALFORMED_DEPENDENCY_REFERENCE"
  | "UNAUTHORIZED_DEPENDENCY"
  | "GOVERNANCE_VIOLATION"
  | "CONSTITUTIONAL_VIOLATION"
  | "MISSING_REPLAY_REFERENCE"
  | "REPLAY_MISMATCH"
  | "UNAUTHORIZED_AUTHORITY"
  | "AUTHORITY_ESCALATION"
  | "OPERATOR_BYPASS"
  | "CROSS_TENANT_DEPENDENCY"
  | "CROSS_MISSION_DEPENDENCY"
  | "DEPENDENCY_CYCLE_DETECTED"
  | "DEPENDENCY_NOT_READY"
  | "DEPENDENCY_INTEGRITY_MISMATCH"
  | "RELATIONSHIP_LINEAGE_MISSING"
  | "REPLAY_DIVERGENCE";

export type DependencyValidationRecord = Readonly<{
  validation_id: string;
  graph_id: string;
  node_id: string;
  dependency_id: string;
  dependency_type: CanonicalDecisionRelationshipType;
  validation_state: DecisionDependencyValidationState;
  validation_reason: DependencyValidationReasonCode;
  dependency_status: DecisionDependencyStatus;
  governance_status: "VERIFIED" | "MISSING" | "VIOLATION";
  authority_status: "VERIFIED" | "UNAUTHORIZED" | "ESCALATED";
  replay_status: "VERIFIED" | "MISSING" | "MISMATCH";
  tenant_validation: "PASSED" | "FAILED";
  mission_validation: "PASSED" | "FAILED";
  validation_timestamp: string;
  validator_version: string;
  replay_refs: readonly string[];
  governance_refs: readonly string[];
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type MissingDependencyRecord = Readonly<{
  missing_dependency_id: string;
  node_id: string;
  expected_dependency: string;
  dependency_type: CanonicalDecisionRelationshipType;
  reason: DependencyValidationReasonCode;
  severity: "BLOCKING" | "WARNING";
  required_before_state: DecisionGraphNodeState;
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type ExpectedDependencyRequirement = Readonly<{
  node_id: string;
  expected_dependency: string;
  dependency_type: CanonicalDecisionRelationshipType;
  reason: DependencyValidationReasonCode;
  required_before_state: DecisionGraphNodeState;
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  evidence_refs?: readonly string[];
}>;

export type DependencyValidationLedgerEvent = Readonly<{
  event_id: string;
  validation_id: string;
  event_type: "DEPENDENCY_VALIDATED" | "DEPENDENCY_REJECTED" | "MISSING_DEPENDENCY_RECORDED";
  reason_code: DependencyValidationReasonCode;
  replay_ref: string;
  integrity_hash: string;
}>;

export type DependencyValidationReport = Readonly<{
  report_id: string;
  graph_id: string;
  tenant_id: string;
  mission_id: string;
  validation_status: "PASS" | "FAIL";
  ready_node_ids: readonly string[];
  blocked_node_ids: readonly string[];
  missing_dependency_count: number;
  invalid_dependency_count: number;
  validator_version: string;
  replay_hash: string;
  integrity_hash: string;
}>;

export type DependencyValidatorInput = Readonly<{
  graph_id: string;
  tenant_id: string;
  mission_id: string;
  nodes: readonly DecisionGraphRoadmapNodeInput[];
  relationships: readonly DecisionRelationshipRecord[];
  lineage: readonly DecisionRelationshipLineage[];
  expected_dependencies?: readonly ExpectedDependencyRequirement[];
  authorized_governance_refs?: readonly string[];
  authorized_authority_refs?: readonly string[];
  validator_version?: string;
  replay_expected_hash?: string;
}>;

export type DependencyValidatorResult = Readonly<{
  validation_status: "PASS" | "FAIL";
  certificationStatus: "PASS" | "FAIL";
  reasonCodes: readonly DependencyValidationReasonCode[];
  validation_records: readonly DependencyValidationRecord[];
  missing_dependencies: readonly MissingDependencyRecord[];
  updated_nodes: readonly DecisionGraphRoadmapNodeInput[];
  ledger_events: readonly DependencyValidationLedgerEvent[];
  report: DependencyValidationReport;
  replay_package: Readonly<{
    replay_id: string;
    graph_id: string;
    validator_version: string;
    validation_record_refs: readonly string[];
    missing_dependency_refs: readonly string[];
    expected_replay_hash: string;
  }>;
  deterministic: true;
  advisoryOnly: true;
  failClosed: true;
  integrity_hash: string;
}>;

export type DecisionConflictType =
  | "POLICY_CONFLICT"
  | "AUTHORITY_CONFLICT"
  | "MISSION_OBJECTIVE_CONFLICT"
  | "TENANT_SCOPE_CONFLICT"
  | "RISK_CONFLICT"
  | "ACTION_CONFLICT"
  | "GOVERNANCE_CONFLICT"
  | "CERTIFICATION_CONFLICT"
  | "RECOVERY_CONFLICT"
  | "DEPENDENCY_CONFLICT";

export type DecisionConflictSeverity =
  | "INFORMATIONAL"
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type DecisionConflictState =
  | "NONE"
  | "POTENTIAL"
  | "CONFIRMED"
  | "BLOCKING"
  | "ESCALATED"
  | "RESOLVED"
  | "ARCHIVED";

export type ConflictDetectorReasonCode =
  | "CONFLICT_RULE_REGISTRY_LOADED"
  | "GRAPH_NODES_EVALUATED"
  | "RELATIONSHIP_ANALYSIS_COMPLETE"
  | "CONFLICT_CLASSIFICATION_COMPLETE"
  | "SEVERITY_EVALUATION_COMPLETE"
  | "CONFLICT_EXPLANATION_GENERATED"
  | "CONFLICT_REFERENCES_ATTACHED"
  | "CONFLICTING_NODES_BLOCKED"
  | "CONFLICT_LEDGER_PERSISTED"
  | "IMMUTABLE_CONFLICT_EVIDENCE_RECORDED"
  | "REPLAY_RECONSTRUCTS_IDENTICAL_CONFLICTS"
  | "COMPETING_PROPOSED_ACTIONS_DETECTED"
  | "INCOMPATIBLE_GOVERNANCE_OUTCOMES_DETECTED"
  | "CONTRADICTORY_RISK_RESPONSES_DETECTED"
  | "AUTHORITY_MISMATCH_DETECTED"
  | "TENANT_BOUNDARY_CONFLICT_DETECTED"
  | "CERTIFICATION_CONFLICT_DETECTED"
  | "RECOVERY_POSTURE_CONFLICT_DETECTED"
  | "MISSION_OBJECTIVE_CONFLICT_DETECTED"
  | "DEPENDENCY_CONFLICT_DETECTED"
  | "CONFLICT_CANNOT_BE_CLASSIFIED"
  | "GOVERNANCE_REFERENCES_MISSING"
  | "REPLAY_REFERENCES_MISSING"
  | "AUTHORITY_VALIDATION_INCOMPLETE"
  | "GRAPH_INTEGRITY_MISMATCH"
  | "TENANT_BOUNDARY_VIOLATED"
  | "REPLAY_MISMATCH_DETECTED"
  | "HIDDEN_CONFLICT_DISCOVERED"
  | "RULE_AMBIGUITY_DETECTED"
  | "CONFLICT_EXPLANATION_INCOMPLETE"
  | "DUPLICATE_CONFLICT_REGISTRATION_PREVENTED";

export type ConflictSignal = Readonly<{
  source_node_id: string;
  target_node_id: string;
  conflict_type: DecisionConflictType;
  rule_id: string;
  conflict_reason: string;
  evidence_refs: readonly string[];
  risk_refs: readonly string[];
  governance_refs: readonly string[];
  authority_refs: readonly string[];
  replay_refs: readonly string[];
  severity?: DecisionConflictSeverity;
  hidden?: boolean;
  ambiguous?: boolean;
}>;

export type ConflictRecord = Readonly<{
  conflict_id: string;
  graph_id: string;
  source_node_id: string;
  target_node_id: string;
  conflict_type: DecisionConflictType;
  severity: DecisionConflictSeverity;
  conflict_state: DecisionConflictState;
  conflict_reason: string;
  evidence_refs: readonly string[];
  risk_refs: readonly string[];
  governance_refs: readonly string[];
  authority_refs: readonly string[];
  replay_refs: readonly string[];
  resolver_version: string;
  integrity_hash: string;
}>;

export type ConflictExplanation = Readonly<{
  explanation_id: string;
  conflict_id: string;
  conflict_type: DecisionConflictType;
  source_decision: string;
  target_decision: string;
  rule_triggered: string;
  evidence_chain: readonly string[];
  governance_rationale: string;
  authority_rationale: string;
  replay_refs: readonly string[];
  conflict_severity: DecisionConflictSeverity;
  orchestration_impact: "BLOCKED" | "ESCALATE" | "ADVISORY_ONLY";
  recommended_resolution_path: readonly string[];
  integrity_hash: string;
}>;

export type ConflictLedgerRecord = Readonly<{
  ledger_entry_id: string;
  conflict_id: string;
  graph_id: string;
  source_node: string;
  target_node: string;
  conflict_type: DecisionConflictType;
  severity: DecisionConflictSeverity;
  conflict_state: DecisionConflictState;
  governance_refs: readonly string[];
  authority_refs: readonly string[];
  replay_refs: readonly string[];
  evidence_refs: readonly string[];
  integrity_hash: string;
  timestamp: string;
}>;

export type ConflictDetectorInput = Readonly<{
  graph_id: string;
  tenant_id: string;
  mission_id: string;
  nodes: readonly DecisionGraphRoadmapNodeInput[];
  relationships: readonly DecisionRelationshipRecord[];
  lineage: readonly DecisionRelationshipLineage[];
  conflict_signals?: readonly ConflictSignal[];
  authorized_governance_refs?: readonly string[];
  authorized_authority_refs?: readonly string[];
  detector_version?: string;
  replay_expected_hash?: string;
}>;

export type ConflictDetectorResult = Readonly<{
  detection_status: "PASS" | "FAIL";
  certificationStatus: "PASS" | "FAIL";
  reasonCodes: readonly ConflictDetectorReasonCode[];
  conflicts: readonly ConflictRecord[];
  explanations: readonly ConflictExplanation[];
  updated_nodes: readonly DecisionGraphRoadmapNodeInput[];
  ledger_records: readonly ConflictLedgerRecord[];
  duplicate_conflict_ids: readonly string[];
  replay_package: Readonly<{
    replay_id: string;
    graph_id: string;
    detector_version: string;
    conflict_refs: readonly string[];
    explanation_refs: readonly string[];
    expected_replay_hash: string;
  }>;
  deterministic: true;
  advisoryOnly: true;
  failClosed: true;
  replay_hash: string;
  integrity_hash: string;
}>;

export type DecisionBlockerType =
  | "GOVERNANCE_BLOCKER"
  | "AUTHORITY_BLOCKER"
  | "REPLAY_BLOCKER"
  | "CERTIFICATION_BLOCKER"
  | "RECOVERY_BLOCKER"
  | "DEPENDENCY_BLOCKER"
  | "CONFLICT_BLOCKER"
  | "SIMULATION_BLOCKER"
  | "EVIDENCE_BLOCKER"
  | "MISSION_BLOCKER";

export type DecisionBlockerState =
  | "NONE"
  | "PENDING"
  | "CONFIRMED"
  | "BLOCKING"
  | "ESCALATED"
  | "RESOLVED"
  | "ARCHIVED";

export type BlockerDetectorReasonCode =
  | "BLOCKER_RULE_REGISTRY_LOADED"
  | "GRAPH_NODES_INSPECTED"
  | "DEPENDENCY_STATUS_EVALUATED"
  | "PREREQUISITE_VALIDATION_COMPLETE"
  | "BLOCKER_CLASSIFICATION_COMPLETE"
  | "SEVERITY_EVALUATION_COMPLETE"
  | "BLOCKER_REFERENCES_ATTACHED"
  | "BLOCKED_DECISIONS_EXCLUDED_FROM_RANKING"
  | "BLOCKED_DECISIONS_EXCLUDED_FROM_APPROVAL"
  | "BLOCKER_EXPLANATION_GENERATED"
  | "BLOCKER_LEDGER_PERSISTED"
  | "IMMUTABLE_BLOCKER_EVIDENCE_RECORDED"
  | "REPLAY_RECONSTRUCTS_IDENTICAL_BLOCKERS"
  | "OPERATOR_APPROVAL_PENDING_DETECTED"
  | "GOVERNANCE_REVIEW_PENDING_DETECTED"
  | "SIMULATION_NOT_EXECUTED_DETECTED"
  | "RECOVERY_PLAN_MISSING_DETECTED"
  | "CERTIFICATION_NOT_PASSED_DETECTED"
  | "REPLAY_REFERENCE_UNAVAILABLE_DETECTED"
  | "DEPENDENCY_UNRESOLVED_DETECTED"
  | "CONFLICT_UNRESOLVED_DETECTED"
  | "BLOCKER_CANNOT_BE_CLASSIFIED"
  | "GOVERNANCE_REFERENCES_MISSING"
  | "REPLAY_REFERENCES_MISSING"
  | "AUTHORITY_VALIDATION_INCOMPLETE"
  | "DEPENDENCY_VALIDATION_INCOMPLETE"
  | "INTEGRITY_MISMATCH_DETECTED"
  | "REPLAY_MISMATCH_DETECTED"
  | "TENANT_ISOLATION_VIOLATED"
  | "CONSTITUTIONAL_VIOLATION_DETECTED"
  | "HIDDEN_BLOCKER_DISCOVERED"
  | "BLOCKER_EXPLANATION_INCOMPLETE"
  | "CROSS_TENANT_BLOCKER_LEAKAGE_PREVENTED";

export type BlockerSignal = Readonly<{
  node_id: string;
  blocker_type: DecisionBlockerType;
  blocking_reason: string;
  required_action: string;
  blocking_dependency_refs: readonly string[];
  governance_refs: readonly string[];
  authority_refs: readonly string[];
  replay_refs: readonly string[];
  evidence_refs: readonly string[];
  severity?: DecisionConflictSeverity;
  hidden?: boolean;
  constitutional_violation?: boolean;
}>;

export type BlockerRecord = Readonly<{
  blocker_id: string;
  graph_id: string;
  node_id: string;
  blocker_type: DecisionBlockerType;
  severity: DecisionConflictSeverity;
  blocker_state: DecisionBlockerState;
  blocking_reason: string;
  required_action: string;
  blocking_dependency_refs: readonly string[];
  governance_refs: readonly string[];
  authority_refs: readonly string[];
  replay_refs: readonly string[];
  evidence_refs: readonly string[];
  validator_version: string;
  integrity_hash: string;
}>;

export type BlockerExplanation = Readonly<{
  explanation_id: string;
  blocker_id: string;
  blocker_type: DecisionBlockerType;
  affected_decision: string;
  blocking_prerequisite: string;
  validation_rule_triggered: string;
  evidence_chain: readonly string[];
  governance_rationale: string;
  authority_rationale: string;
  replay_refs: readonly string[];
  severity: DecisionConflictSeverity;
  required_resolution_actions: readonly string[];
  expected_completion_conditions: readonly string[];
  integrity_hash: string;
}>;

export type BlockerLedgerRecord = Readonly<{
  ledger_entry_id: string;
  blocker_id: string;
  graph_id: string;
  node_id: string;
  blocker_type: DecisionBlockerType;
  severity: DecisionConflictSeverity;
  blocker_state: DecisionBlockerState;
  required_action: string;
  governance_refs: readonly string[];
  authority_refs: readonly string[];
  replay_refs: readonly string[];
  evidence_refs: readonly string[];
  integrity_hash: string;
  timestamp: string;
}>;

export type BlockerDetectorInput = Readonly<{
  graph_id: string;
  tenant_id: string;
  mission_id: string;
  nodes: readonly DecisionGraphRoadmapNodeInput[];
  relationships?: readonly DecisionRelationshipRecord[];
  dependency_validation?: DependencyValidatorResult;
  conflict_detection?: ConflictDetectorResult;
  blocker_signals?: readonly BlockerSignal[];
  authorized_governance_refs?: readonly string[];
  authorized_authority_refs?: readonly string[];
  detector_version?: string;
  replay_expected_hash?: string;
}>;

export type BlockerDetectorResult = Readonly<{
  detection_status: "PASS" | "FAIL";
  certificationStatus: "PASS" | "FAIL";
  reasonCodes: readonly BlockerDetectorReasonCode[];
  blockers: readonly BlockerRecord[];
  explanations: readonly BlockerExplanation[];
  updated_nodes: readonly DecisionGraphRoadmapNodeInput[];
  ledger_records: readonly BlockerLedgerRecord[];
  blocked_node_ids: readonly string[];
  eligible_for_ordering_node_ids: readonly string[];
  eligible_for_approval_node_ids: readonly string[];
  replay_package: Readonly<{
    replay_id: string;
    graph_id: string;
    detector_version: string;
    blocker_refs: readonly string[];
    explanation_refs: readonly string[];
    expected_replay_hash: string;
  }>;
  deterministic: true;
  advisoryOnly: true;
  failClosed: true;
  replay_hash: string;
  integrity_hash: string;
}>;

export type DecisionCycleType =
  | "SELF_REFERENCE"
  | "DIRECT_CYCLE"
  | "INDIRECT_CYCLE"
  | "GOVERNANCE_DEADLOCK"
  | "AUTHORITY_DEADLOCK"
  | "CERTIFICATION_LOOP"
  | "RECOVERY_LOOP"
  | "SIMULATION_LOOP"
  | "ESCALATION_LOOP";

export type DecisionCycleState =
  | "DETECTED"
  | "BLOCKING"
  | "ESCALATED"
  | "RESOLVED"
  | "ARCHIVED";

export type GraphSafetyStatus =
  | "SAFE"
  | "UNSAFE"
  | "REPLAY_FAILED";

export type GraphSafetyReasonCode =
  | "DETERMINISTIC_GRAPH_TRAVERSAL_COMPLETE"
  | "RELATIONSHIP_EXPANSION_COMPLETE"
  | "CYCLE_DETECTION_COMPLETE"
  | "CYCLE_CLASSIFICATION_COMPLETE"
  | "SEVERITY_ASSESSMENT_COMPLETE"
  | "GRAPH_SAFETY_VALIDATION_COMPLETE"
  | "CYCLE_LEDGER_RECORDED"
  | "CYCLE_REPORTS_GENERATED"
  | "CYCLIC_NODES_BLOCKED"
  | "REPLAY_RECONSTRUCTS_IDENTICAL_CYCLES"
  | "GRAPH_CONNECTIVITY_VALIDATED"
  | "GRAPH_INTEGRITY_VALIDATED"
  | "ACYCLIC_DEPENDENCY_GRAPH_VALIDATED"
  | "RELATIONSHIP_DIRECTION_VALIDATED"
  | "TENANT_ISOLATION_VALIDATED"
  | "MISSION_ISOLATION_VALIDATED"
  | "GOVERNANCE_COMPLETENESS_VALIDATED"
  | "REPLAY_COMPLETENESS_VALIDATED"
  | "AUTHORITY_CONSISTENCY_VALIDATED"
  | "RELATIONSHIP_CONSISTENCY_VALIDATED"
  | "ORPHAN_NODE_DETECTED"
  | "UNREACHABLE_NODE_DETECTED"
  | "DUPLICATE_EDGE_DETECTED"
  | "GRAPH_VERSION_MISMATCH"
  | "SELF_REFERENTIAL_CYCLE_DETECTED"
  | "DIRECT_CYCLE_DETECTED"
  | "INDIRECT_CYCLE_DETECTED"
  | "GOVERNANCE_DEADLOCK_DETECTED"
  | "AUTHORITY_DEADLOCK_DETECTED"
  | "CERTIFICATION_LOOP_DETECTED"
  | "RECOVERY_LOOP_DETECTED"
  | "SIMULATION_LOOP_DETECTED"
  | "ESCALATION_LOOP_DETECTED"
  | "CROSS_TENANT_TOPOLOGY_DETECTED"
  | "CROSS_MISSION_TOPOLOGY_DETECTED"
  | "RELATIONSHIP_INTEGRITY_MISMATCH"
  | "REPLAY_MISMATCH_DETECTED"
  | "HIDDEN_TOPOLOGY_DETECTED"
  | "GRAPH_SAFETY_CANNOT_BE_GUARANTEED";

export type CycleDetectionRecord = Readonly<{
  cycle_id: string;
  graph_id: string;
  cycle_type: DecisionCycleType;
  participating_nodes: readonly string[];
  cycle_length: number;
  entry_node: string;
  exit_node: string;
  severity: DecisionConflictSeverity;
  cycle_state: DecisionCycleState;
  governance_refs: readonly string[];
  authority_refs: readonly string[];
  replay_refs: readonly string[];
  evidence_refs: readonly string[];
  validator_version: string;
  integrity_hash: string;
}>;

export type GraphSafetyRecord = Readonly<{
  graph_id: string;
  validation_id: string;
  graph_state: GraphSafetyStatus;
  cycle_count: number;
  orphan_nodes: readonly string[];
  unreachable_nodes: readonly string[];
  duplicate_edges: readonly string[];
  integrity_status: "PASSED" | "FAILED";
  replay_status: "PASSED" | "FAILED";
  governance_status: "PASSED" | "FAILED";
  authority_status: "PASSED" | "FAILED";
  validator_version: string;
  integrity_hash: string;
}>;

export type DependencyLoopReport = Readonly<{
  loop_id: string;
  participating_nodes: readonly string[];
  participating_decisions: readonly string[];
  relationship_chain: readonly string[];
  loop_entry_point: string;
  loop_exit_point: string;
  cycle_classification: DecisionCycleType;
  severity: DecisionConflictSeverity;
  governance_rationale: string;
  authority_rationale: string;
  replay_refs: readonly string[];
  recommended_remediation: string;
  expected_resolution_order: readonly string[];
  integrity_hash: string;
}>;

export type GraphSafetyLedgerRecord = Readonly<{
  ledger_entry_id: string;
  graph_id: string;
  cycle_id?: string;
  event_type: "CYCLE_DETECTED" | "GRAPH_SAFETY_VALIDATED" | "CYCLIC_NODE_BLOCKED";
  affected_nodes: readonly string[];
  reason_code: GraphSafetyReasonCode;
  replay_refs: readonly string[];
  integrity_hash: string;
  timestamp: string;
}>;

export type GraphSafetyValidatorInput = Readonly<{
  graph_id: string;
  tenant_id: string;
  mission_id: string;
  graph_version: string;
  nodes: readonly DecisionGraphRoadmapNodeInput[];
  relationships: readonly DecisionRelationshipRecord[];
  blocker_detection?: BlockerDetectorResult;
  validator_version?: string;
  expected_graph_version?: string;
  hidden_topology_refs?: readonly string[];
  replay_expected_hash?: string;
}>;

export type GraphSafetyValidatorResult = Readonly<{
  safety_status: GraphSafetyStatus;
  certificationStatus: "PASS" | "FAIL";
  reasonCodes: readonly GraphSafetyReasonCode[];
  cycles: readonly CycleDetectionRecord[];
  safety_record: GraphSafetyRecord;
  loop_reports: readonly DependencyLoopReport[];
  updated_nodes: readonly DecisionGraphRoadmapNodeInput[];
  ledger_records: readonly GraphSafetyLedgerRecord[];
  blocked_node_ids: readonly string[];
  eligible_for_ordering_node_ids: readonly string[];
  replay_package: Readonly<{
    replay_id: string;
    graph_id: string;
    validator_version: string;
    cycle_refs: readonly string[];
    safety_record_ref: string;
    expected_replay_hash: string;
  }>;
  deterministic: true;
  advisoryOnly: true;
  failClosed: true;
  replay_hash: string;
  integrity_hash: string;
}>;

export type GraphOrderingState =
  | "NOT_ELIGIBLE"
  | "ELIGIBLE"
  | "ORDERING"
  | "ORDERED"
  | "EXCLUDED"
  | "ARCHIVED";

export type GraphOrderingReasonCode =
  | "VALIDATED_GRAPH_LOADED"
  | "ELIGIBILITY_EVALUATION_COMPLETE"
  | "DEPENDENCY_ORDER_PRESERVED"
  | "GOVERNANCE_PRECEDENCE_PRESERVED"
  | "AUTHORITY_PRECEDENCE_PRESERVED"
  | "REPLAY_READINESS_ENFORCED"
  | "CERTIFICATION_READINESS_ENFORCED"
  | "TIE_BREAK_RESOLUTION_DETERMINISTIC"
  | "ORDERING_VALIDATION_COMPLETE"
  | "ORDERING_LEDGER_RECORDED"
  | "ORDERING_EXPLANATION_GENERATED"
  | "REPLAY_RECONSTRUCTS_IDENTICAL_ORDERING"
  | "ORDERING_HASH_REPRODUCIBLE"
  | "BLOCKED_NODES_EXCLUDED"
  | "CONFLICTED_NODES_EXCLUDED"
  | "SUPERSEDED_NODES_EXCLUDED"
  | "ARCHIVED_NODES_EXCLUDED"
  | "GRAPH_SAFETY_PREREQUISITE_ENFORCED"
  | "DEPENDENCY_ORDER_VIOLATED"
  | "BLOCKED_NODE_ENTERED_ORDERING"
  | "CONFLICTED_NODE_ENTERED_ORDERING"
  | "GOVERNANCE_INCOMPLETE"
  | "REPLAY_REFERENCES_MISSING"
  | "AUTHORITY_VALIDATION_INCOMPLETE"
  | "CERTIFICATION_INCOMPLETE"
  | "GRAPH_INTEGRITY_MISMATCH"
  | "REPLAY_MISMATCH_DETECTED"
  | "GRAPH_SAFETY_INVALID"
  | "DETERMINISTIC_ORDERING_NOT_PROVEN"
  | "HIDDEN_ORDERING_LOGIC_REJECTED"
  | "RANDOM_ORDERING_REJECTED";

export type GraphOrderingRecord = Readonly<{
  ordering_id: string;
  graph_id: string;
  ordered_nodes: readonly string[];
  excluded_nodes: readonly string[];
  ordering_algorithm: "deterministic_topological_sort";
  ordering_version: string;
  dependency_validation_ref: string;
  governance_refs: readonly string[];
  authority_refs: readonly string[];
  replay_refs: readonly string[];
  certification_refs: readonly string[];
  ordering_hash: string;
  integrity_hash: string;
}>;

export type ReplayOrderingRecord = Readonly<{
  replay_validation_id: string;
  graph_id: string;
  expected_order: readonly string[];
  replayed_order: readonly string[];
  ordering_hash: string;
  comparison_result: "MATCH" | "MISMATCH";
  validator_version: string;
  integrity_hash: string;
}>;

export type OrderingExplanation = Readonly<{
  explanation_id: string;
  graph_id: string;
  node_id: string;
  execution_position?: number;
  ordering_state: GraphOrderingState;
  dependency_justification: string;
  governance_rationale: string;
  authority_rationale: string;
  tie_break_rationale: string;
  replay_refs: readonly string[];
  certification_status: "COMPLETE" | "NOT_REQUIRED" | "INCOMPLETE";
  excluded_nodes: readonly string[];
  ordering_algorithm_version: string;
  integrity_evidence: string;
  integrity_hash: string;
}>;

export type OrderingLedgerRecord = Readonly<{
  ledger_entry_id: string;
  graph_id: string;
  ordering_position?: number;
  node_id: string;
  ordering_reason: string;
  dependency_refs: readonly string[];
  governance_refs: readonly string[];
  authority_refs: readonly string[];
  replay_refs: readonly string[];
  ordering_hash: string;
  integrity_hash: string;
  timestamp: string;
}>;

export type GraphOrderingEngineInput = Readonly<{
  graph_id: string;
  tenant_id: string;
  mission_id: string;
  graph_version: string;
  nodes: readonly DecisionGraphRoadmapNodeInput[];
  relationships: readonly DecisionRelationshipRecord[];
  graph_safety: GraphSafetyValidatorResult;
  dependency_validation?: DependencyValidatorResult;
  blocker_detection?: BlockerDetectorResult;
  conflict_detection?: ConflictDetectorResult;
  ordering_version?: string;
  expected_graph_version?: string;
  hidden_ordering_refs?: readonly string[];
  random_ordering_requested?: boolean;
  replay_expected_hash?: string;
}>;

export type GraphOrderingEngineResult = Readonly<{
  ordering_status: "PASS" | "FAIL";
  certificationStatus: "PASS" | "FAIL";
  reasonCodes: readonly GraphOrderingReasonCode[];
  ordering_record?: GraphOrderingRecord;
  replay_record?: ReplayOrderingRecord;
  explanations: readonly OrderingExplanation[];
  ledger_records: readonly OrderingLedgerRecord[];
  updated_nodes: readonly DecisionGraphRoadmapNodeInput[];
  ordered_node_ids: readonly string[];
  excluded_node_ids: readonly string[];
  deterministic: true;
  advisoryOnly: true;
  failClosed: true;
  replay_hash: string;
  integrity_hash: string;
}>;

export type DecisionGraphLedgerEntryType =
  | "GRAPH_CREATED"
  | "NODE_REGISTERED"
  | "RELATIONSHIP_CREATED"
  | "DEPENDENCY_VALIDATED"
  | "CONFLICT_DETECTED"
  | "BLOCKER_DETECTED"
  | "CYCLE_DETECTED"
  | "GRAPH_ORDERED"
  | "GRAPH_UPDATED"
  | "GRAPH_SNAPSHOT"
  | "GRAPH_CERTIFIED"
  | "GRAPH_ARCHIVED"
  | "REPLAY_VALIDATED";

export type DecisionGraphLedgerReasonCode =
  | "GRAPH_EVENT_SERIALIZED"
  | "GRAPH_CREATION_RECORDED"
  | "NODE_REGISTRATION_RECORDED"
  | "RELATIONSHIP_RECORDED"
  | "DEPENDENCY_VALIDATION_RECORDED"
  | "CONFLICT_RECORDED"
  | "BLOCKER_RECORDED"
  | "CYCLE_RECORDED"
  | "GRAPH_ORDERING_RECORDED"
  | "GRAPH_SNAPSHOT_RECORDED"
  | "REPLAY_LEDGER_RECORDED"
  | "APPEND_ONLY_HISTORY_VALIDATED"
  | "PREVIOUS_HASH_CHAIN_VALIDATED"
  | "ENTRY_HASH_REPRODUCIBLE"
  | "SNAPSHOT_HASH_REPRODUCIBLE"
  | "REPLAY_RECONSTRUCTS_IDENTICAL_GRAPH"
  | "TENANT_ISOLATION_VALIDATED"
  | "MISSION_ISOLATION_VALIDATED"
  | "GOVERNANCE_REFERENCES_PRESENT"
  | "REPLAY_REFERENCES_PRESENT"
  | "APPEND_ONLY_RULE_VIOLATED"
  | "GRAPH_MUTATION_ATTEMPTED"
  | "RELATIONSHIP_LINEAGE_MISSING"
  | "INTEGRITY_HASH_MISMATCH"
  | "PREVIOUS_HASH_MISMATCH"
  | "REPLAY_REFERENCES_MISSING"
  | "GOVERNANCE_REFERENCES_MISSING"
  | "GRAPH_VERSION_MISMATCH"
  | "TENANT_ISOLATION_VIOLATED"
  | "REPLAY_RECONSTRUCTION_IMPOSSIBLE"
  | "HIDDEN_LEDGER_MUTATION_DETECTED";

export type DecisionGraphLedgerRecord = Readonly<{
  ledger_entry_id: string;
  graph_id: string;
  entry_type: DecisionGraphLedgerEntryType;
  graph_version: string;
  tenant_id: string;
  mission_id: string;
  node_refs: readonly string[];
  relationship_refs: readonly string[];
  dependency_refs: readonly string[];
  conflict_refs: readonly string[];
  blocker_refs: readonly string[];
  cycle_refs: readonly string[];
  ordering_refs: readonly string[];
  replay_refs: readonly string[];
  governance_refs: readonly string[];
  evidence_refs: readonly string[];
  previous_entry_hash: string;
  timestamp: string;
  ledger_version: string;
  sequence: number;
  integrity_hash: string;
}>;

export type GraphSnapshotRecord = Readonly<{
  snapshot_id: string;
  graph_id: string;
  graph_version: string;
  snapshot_type: DecisionGraphLedgerEntryType;
  graph_state: "ACTIVE" | "ORDERED" | "ARCHIVED" | "CERTIFIED";
  node_count: number;
  relationship_count: number;
  dependency_count: number;
  conflict_count: number;
  blocker_count: number;
  cycle_count: number;
  ordering_state: "NOT_ORDERED" | "ORDERED";
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  snapshot_hash: string;
  timestamp: string;
  integrity_hash: string;
}>;

export type RelationshipGraphLedgerRecord = Readonly<{
  relationship_entry_id: string;
  relationship_id: string;
  graph_id: string;
  source_node: string;
  target_node: string;
  relationship_type: CanonicalDecisionRelationshipType;
  relationship_state: "CREATED" | "UPDATED" | "SUPERSEDED" | "ARCHIVED" | "INVALIDATED" | "REPLAY_VALIDATED";
  lineage_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  timestamp: string;
  integrity_hash: string;
}>;

export type GraphReplayLedgerRecord = Readonly<{
  replay_id: string;
  graph_id: string;
  graph_version: string;
  snapshot_refs: readonly string[];
  ledger_refs: readonly string[];
  ordering_refs: readonly string[];
  validator_versions: readonly string[];
  expected_graph_hash: string;
  replay_graph_hash: string;
  comparison_result: "MATCH" | "MISMATCH";
  integrity_hash: string;
}>;

export type LedgerIntegrityRecord = Readonly<{
  validation_id: string;
  graph_id: string;
  ledger_entry_id: string;
  validation_result: "PASS" | "FAIL";
  chain_validation: "PASS" | "FAIL";
  hash_validation: "PASS" | "FAIL";
  replay_validation: "PASS" | "FAIL";
  validator_version: string;
  integrity_hash: string;
}>;

export type DecisionGraphLedgerInput = Readonly<{
  graph_id: string;
  tenant_id: string;
  mission_id: string;
  graph_version: string;
  nodes: readonly DecisionGraphRoadmapNodeInput[];
  relationships: readonly DecisionRelationshipRecord[];
  existing_entries?: readonly DecisionGraphLedgerRecord[];
  dependency_validation?: DependencyValidatorResult;
  conflict_detection?: ConflictDetectorResult;
  blocker_detection?: BlockerDetectorResult;
  graph_safety?: GraphSafetyValidatorResult;
  graph_ordering?: GraphOrderingEngineResult;
  ledger_version?: string;
  expected_graph_version?: string;
  expected_previous_entry_hash?: string;
  hidden_mutation_refs?: readonly string[];
  replay_expected_hash?: string;
}>;

export type DecisionGraphLedgerResult = Readonly<{
  ledger_status: "PASS" | "FAIL";
  certificationStatus: "PASS" | "FAIL";
  reasonCodes: readonly DecisionGraphLedgerReasonCode[];
  ledger_entries: readonly DecisionGraphLedgerRecord[];
  snapshot_record?: GraphSnapshotRecord;
  relationship_ledger: readonly RelationshipGraphLedgerRecord[];
  integrity_records: readonly LedgerIntegrityRecord[];
  replay_record?: GraphReplayLedgerRecord;
  deterministic: true;
  advisoryOnly: true;
  failClosed: true;
  replay_hash: string;
  integrity_hash: string;
}>;

export type DecisionDependencyGraphCertificationState =
  | "PASS"
  | "CONDITIONAL_PASS"
  | "FAIL";

export type DecisionDependencyGraphCertificationReasonCode =
  | "CERTIFICATION_TESTS_EXECUTED"
  | "GRAPH_NODE_SCHEMA_VALID"
  | "DECISION_CANDIDATES_CONVERTED_TO_NODES"
  | "RELATIONSHIP_TYPES_REGISTERED"
  | "DEPENDENCIES_MODELED"
  | "CONFLICTS_DETECTED_DETERMINISTICALLY"
  | "BLOCKERS_DETECTED_DETERMINISTICALLY"
  | "CYCLES_DETECTED_AND_BLOCKED"
  | "GRAPH_ORDERING_REPRODUCIBLE"
  | "GOVERNANCE_REFERENCES_REQUIRED"
  | "REPLAY_REFERENCES_REQUIRED"
  | "INTEGRITY_HASHES_REPRODUCIBLE"
  | "LEDGER_APPEND_ONLY_VALIDATED"
  | "REPLAY_RECONSTRUCTS_IDENTICAL_GRAPH"
  | "CONSTITUTIONAL_COMPLIANCE_VERIFIED"
  | "AUTHORITY_BOUNDARIES_ENFORCED"
  | "TENANT_ISOLATION_ENFORCED"
  | "CERTIFICATION_EVIDENCE_GENERATED"
  | "CERTIFICATION_LEDGER_RECORDED"
  | "GRAPH_SAFE_FOR_ORCHESTRATION"
  | "NODE_SCHEMA_INVALID"
  | "CANDIDATE_NODE_CONVERSION_MISSING"
  | "UNKNOWN_RELATIONSHIP_TYPE"
  | "DEPENDENCY_VALIDATION_FAILURE"
  | "UNRESOLVED_CONFLICT_EXISTS"
  | "UNRESOLVED_BLOCKER_EXISTS"
  | "CYCLE_EXISTS"
  | "GRAPH_ORDERING_NOT_REPRODUCIBLE"
  | "GOVERNANCE_REFERENCE_MISSING"
  | "REPLAY_REFERENCE_MISSING"
  | "INTEGRITY_HASH_MISMATCH"
  | "LEDGER_INTEGRITY_FAILURE"
  | "REPLAY_MISMATCH_DETECTED"
  | "CONSTITUTIONAL_VALIDATION_FAILED"
  | "AUTHORITY_VALIDATION_FAILED"
  | "TENANT_ISOLATION_VIOLATED"
  | "GRAPH_SAFETY_FAILURE"
  | "HIDDEN_CERTIFICATION_LOGIC_REJECTED";

export type DecisionDependencyGraphCertificationTestResult = Readonly<{
  test_id: string;
  test_name: string;
  expected: "PASS" | "FAIL";
  actual: "PASS" | "FAIL";
  reason_code: DecisionDependencyGraphCertificationReasonCode;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type DecisionDependencyGraphCertificationRecord = Readonly<{
  certification_id: string;
  graph_id: string;
  graph_version: string;
  certification_state: DecisionDependencyGraphCertificationState;
  test_results: readonly DecisionDependencyGraphCertificationTestResult[];
  overall_score: number;
  failure_reasons: readonly DecisionDependencyGraphCertificationReasonCode[];
  governance_status: "PASS" | "FAIL";
  constitutional_status: "PASS" | "FAIL";
  authority_status: "PASS" | "FAIL";
  replay_status: "PASS" | "FAIL";
  ledger_status: "PASS" | "FAIL";
  validator_version: string;
  replay_refs: readonly string[];
  governance_refs: readonly string[];
  evidence_refs: readonly string[];
  timestamp: string;
  integrity_hash: string;
}>;

export type DecisionDependencyGraphCertificationReplayRecord = Readonly<{
  replay_validation_id: string;
  graph_id: string;
  expected_graph_hash: string;
  replayed_graph_hash: string;
  comparison_result: "MATCH" | "MISMATCH";
  ordering_result: "MATCH" | "MISMATCH";
  ledger_result: "MATCH" | "MISMATCH";
  validator_version: string;
  integrity_hash: string;
}>;

export type DecisionDependencyGraphCertificationEvidencePackage = Readonly<{
  evidence_package_id: string;
  graph_id: string;
  schema_validation_refs: readonly string[];
  node_validation_refs: readonly string[];
  relationship_validation_refs: readonly string[];
  dependency_validation_refs: readonly string[];
  conflict_validation_refs: readonly string[];
  blocker_validation_refs: readonly string[];
  cycle_validation_refs: readonly string[];
  ordering_validation_refs: readonly string[];
  ledger_validation_refs: readonly string[];
  replay_validation_refs: readonly string[];
  governance_evidence_refs: readonly string[];
  constitutional_evidence_refs: readonly string[];
  authority_evidence_refs: readonly string[];
  integrity_evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type DecisionDependencyGraphCertificationReport = Readonly<{
  report_id: string;
  graph_id: string;
  certification_state: DecisionDependencyGraphCertificationState;
  executive_summary: string;
  executed_tests: number;
  passed_tests: number;
  failed_tests: number;
  warnings: readonly string[];
  graph_statistics: Readonly<{
    node_count: number;
    relationship_count: number;
    dependency_count: number;
    conflict_count: number;
    blocker_count: number;
    cycle_count: number;
    ordered_node_count: number;
  }>;
  certification_decision: string;
  remediation_actions: readonly string[];
  integrity_hash: string;
}>;

export type DecisionDependencyGraphCertificationLedgerRecord = Readonly<{
  ledger_entry_id: string;
  certification_id: string;
  graph_id: string;
  graph_version: string;
  certification_state: DecisionDependencyGraphCertificationState;
  certification_score: number;
  test_results: readonly string[];
  validator_version: string;
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  evidence_refs: readonly string[];
  timestamp: string;
  integrity_hash: string;
}>;

export type DecisionDependencyGraphCertificationInput = Readonly<{
  graph_id: string;
  tenant_id: string;
  mission_id: string;
  graph_version: string;
  nodes: readonly DecisionGraphRoadmapNodeInput[];
  relationships: readonly DecisionRelationshipRecord[];
  graph_safety: GraphSafetyValidatorResult;
  graph_ordering: GraphOrderingEngineResult;
  graph_ledger: DecisionGraphLedgerResult;
  dependency_validation?: DependencyValidatorResult;
  conflict_detection?: ConflictDetectorResult;
  blocker_detection?: BlockerDetectorResult;
  constitutional_refs: readonly string[];
  authority_refs?: readonly string[];
  certification_version?: string;
  expected_graph_version?: string;
  hidden_certification_refs?: readonly string[];
  replay_expected_hash?: string;
}>;

export type DecisionDependencyGraphCertificationResult = Readonly<{
  certification_state: DecisionDependencyGraphCertificationState;
  certificationStatus: DecisionDependencyGraphCertificationState;
  reasonCodes: readonly DecisionDependencyGraphCertificationReasonCode[];
  certification_record: DecisionDependencyGraphCertificationRecord;
  test_results: readonly DecisionDependencyGraphCertificationTestResult[];
  replay_record: DecisionDependencyGraphCertificationReplayRecord;
  evidence_package: DecisionDependencyGraphCertificationEvidencePackage;
  report: DecisionDependencyGraphCertificationReport;
  ledger_record: DecisionDependencyGraphCertificationLedgerRecord;
  production_ready: boolean;
  deterministic: true;
  advisoryOnly: true;
  failClosed: true;
  replay_hash: string;
  integrity_hash: string;
}>;

export type DecisionGraphReasonCode =
  | "GRAPH_ID_PRESENT"
  | "GRAPH_ID_MISSING"
  | "TENANT_ID_PRESENT"
  | "TENANT_ID_MISSING"
  | "MISSION_ID_PRESENT"
  | "MISSION_ID_MISSING"
  | "GRAPH_VERSION_PRESENT"
  | "GRAPH_VERSION_MISSING"
  | "CREATED_AT_PRESENT"
  | "CREATED_AT_MISSING"
  | "NODES_PRESENT"
  | "NODES_MISSING"
  | "EDGES_PRESENT"
  | "NODE_TYPE_VALID"
  | "NODE_TYPE_INVALID"
  | "EDGE_RELATIONSHIP_VALID"
  | "EDGE_RELATIONSHIP_INVALID"
  | "NODE_OWNERSHIP_VALID"
  | "NODE_OWNERSHIP_INVALID"
  | "EDGE_OWNERSHIP_VALID"
  | "EDGE_OWNERSHIP_INVALID"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_NODES_BLOCKED"
  | "CROSS_TENANT_EDGES_BLOCKED"
  | "GRAPH_ID_CONSISTENT"
  | "GRAPH_ID_MISMATCH"
  | "LINEAGE_REFERENCES_PRESENT"
  | "LINEAGE_REFERENCES_MISSING"
  | "LINEAGE_PRESERVED"
  | "LINEAGE_MISSING"
  | "EDGE_REFERENCES_VALID"
  | "EDGE_SOURCE_NODE_MISSING"
  | "EDGE_TARGET_NODE_MISSING"
  | "MUTATION_BLOCKED"
  | "SEALED_GRAPH_IMMUTABLE"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "WORKFLOW_ROUTING_BLOCKED"
  | "WORKFLOW_ROUTING_DETECTED"
  | "AUTHORITY_BOUNDARY_PRESERVED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "GRAPH_IS_NOT_DECISION";

export type DecisionGraphValidationResult = Readonly<{
  valid: boolean;
  reasonCodes: readonly DecisionGraphReasonCode[];
  graphState: DecisionGraphContract["graphState"];
  nodeCount: number;
  edgeCount: number;
  graphHash: string;
  deterministic: true;
  readOnly: true;
  tenantScoped: boolean;
  lineagePreserved: boolean;
  executionImpossible: boolean;
  authorityBounded: boolean;
}>;

export type DecisionGraphObservability = Readonly<{
  graphId: string;
  graphState: DecisionGraphContract["graphState"];
  nodeCount: number;
  edgeCount: number;
  graphHash: string;
}>;

export type SealedDecisionGraphRecord = Readonly<{
  contract: Readonly<DecisionGraphContract>;
  nodes: readonly Readonly<DecisionGraphNode>[];
  edges: readonly Readonly<DecisionGraphEdge>[];
  validation: DecisionGraphValidationResult;
  observability: DecisionGraphObservability;
  sealed: true;
  readOnly: true;
  graphOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  decisionAuthorized: false;
  authorityMutationAllowed: false;
  graphMutationAllowed: false;
  selfExpansionAllowed: false;
}>;

export interface RecommendationDependencyRequest {
  graphId: string;
  tenantId: string;
  recommendationNodeIds: string[];
  dependencyNodeIds: string[];
  lineageReferences: string[];
}

export interface RecommendationDependencyEdge {
  edgeId: string;
  graphId: string;
  sourceRecommendationId: string;
  targetDependencyId: string;
  dependencyType:
    | "REQUIRES"
    | "BLOCKED_BY"
    | "SUPPORTED_BY"
    | "CONSTRAINED_BY"
    | "INFLUENCED_BY";
  tenantId: string;
  immutableHash: string;
}

export interface RecommendationDependencyGraphResult {
  graphId: string;
  dependencyCount: number;
  lineageIntegrity: boolean;
  tenantIsolationVerified: boolean;
  dependencyHash: string;
  graphState:
    | "VALIDATED"
    | "SEALED";
  sealed: boolean;
}

export type RecommendationDependencyType = RecommendationDependencyEdge["dependencyType"];

export type RecommendationDependencyReasonCode =
  | "SEALED_GRAPH_REQUIRED"
  | "GRAPH_UNSEALED"
  | "GRAPH_ID_MATCHED"
  | "GRAPH_ID_MISMATCH"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_NODES_BLOCKED"
  | "CROSS_TENANT_DEPENDENCIES_BLOCKED"
  | "RECOMMENDATION_NODE_IDS_PRESENT"
  | "RECOMMENDATION_NODE_IDS_MISSING"
  | "DEPENDENCY_NODE_IDS_PRESENT"
  | "DEPENDENCY_NODE_IDS_MISSING"
  | "RECOMMENDATION_NODES_VALID"
  | "RECOMMENDATION_NODE_MISSING"
  | "DEPENDENCY_NODES_VALID"
  | "DEPENDENCY_NODE_MISSING"
  | "RECOMMENDATION_NODE_TYPE_VALID"
  | "RECOMMENDATION_NODE_TYPE_INVALID"
  | "DEPENDENCY_REFERENCE_VALID"
  | "SELF_DEPENDENCY_DETECTED"
  | "DEPENDENCY_LOOP_DETECTED"
  | "DEPENDENCY_LIMIT_VALID"
  | "DEPENDENCY_COUNT_EXCEEDED"
  | "GRAPH_DEPTH_VALID"
  | "GRAPH_DEPTH_EXCEEDED"
  | "LINEAGE_REFERENCES_PRESENT"
  | "LINEAGE_REFERENCES_MISSING"
  | "LINEAGE_INTEGRITY_VALID"
  | "LINEAGE_INTEGRITY_FAILED"
  | "DEPENDENCY_HASH_GENERATED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "WORKFLOW_ROUTING_BLOCKED"
  | "WORKFLOW_ROUTING_DETECTED"
  | "PRIORITIZATION_BLOCKED"
  | "PRIORITIZATION_DETECTED"
  | "AUTHORITY_BOUNDARY_PRESERVED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "DEPENDENCY_GRAPH_IS_NOT_RECOMMENDATION_ENGINE";

export type RecommendationDependencyGraphInput = Readonly<{
  request: RecommendationDependencyRequest;
  graph: SealedDecisionGraphRecord;
  dependencyType?: RecommendationDependencyType;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  prioritizationRequested?: boolean;
  authorityExpansionRequested?: boolean;
}>;

export type RecommendationDependencyGraphValidation = Readonly<{
  valid: boolean;
  reasonCodes: readonly RecommendationDependencyReasonCode[];
  dependencyCount: number;
  lineageIntegrity: boolean;
  tenantIsolationVerified: boolean;
  graphDepth: number;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  authorityBounded: boolean;
}>;

export type RecommendationDependencyGraphObservability = Readonly<{
  graphId: string;
  dependencyCount: number;
  lineageIntegrity: boolean;
  tenantIsolationVerified: boolean;
  dependencyHash: string;
  graphState: RecommendationDependencyGraphResult["graphState"];
}>;

export type SealedRecommendationDependencyGraphRecord = Readonly<{
  result: Readonly<RecommendationDependencyGraphResult>;
  edges: readonly Readonly<RecommendationDependencyEdge>[];
  validation: RecommendationDependencyGraphValidation;
  observability: RecommendationDependencyGraphObservability;
  sealed: true;
  readOnly: true;
  dependencyOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  prioritizationAllowed: false;
  recommendationCreationAllowed: false;
  authorityMutationAllowed: false;
  dependencyMutationAllowed: false;
  selfExpansionAllowed: false;
}>;

export interface ProposalRelationshipRequest {
  graphId: string;
  tenantId: string;
  proposalNodeIds: string[];
  relationshipNodeIds: string[];
  lineageReferences: string[];
}

export interface ProposalNode {
  proposalId: string;
  graphId: string;
  tenantId: string;
  proposalType:
    | "MISSION"
    | "RECOMMENDATION"
    | "ESCALATION"
    | "CONSTRAINT"
    | "SIMULATION";
  lineageReference: string;
  immutableHash: string;
}

export interface ProposalRelationshipEdge {
  edgeId: string;
  graphId: string;
  sourceProposalId: string;
  targetRelationshipId: string;
  relationshipType:
    | "RELATED_TO"
    | "DEPENDS_ON"
    | "CONFLICTS_WITH"
    | "SUPPORTED_BY"
    | "CONSTRAINED_BY"
    | "INFLUENCED_BY"
    | "ESCALATES_TO";
  tenantId: string;
  immutableHash: string;
}

export interface ProposalRelationshipGraphResult {
  graphId: string;
  relationshipCount: number;
  lineageIntegrity: boolean;
  tenantIsolationVerified: boolean;
  relationshipHash: string;
  graphState:
    | "VALIDATED"
    | "SEALED";
  sealed: boolean;
}

export type ProposalNodeType = ProposalNode["proposalType"];
export type ProposalRelationshipType = ProposalRelationshipEdge["relationshipType"];

export type ProposalNodeInput = Readonly<{
  proposalId: string;
  graphId: string;
  tenantId: string;
  proposalType: ProposalNodeType;
  lineageReference: string;
}>;

export type ProposalRelationshipReasonCode =
  | "SEALED_GRAPH_REQUIRED"
  | "GRAPH_UNSEALED"
  | "DEPENDENCY_GRAPH_REQUIRED"
  | "DEPENDENCY_GRAPH_UNSEALED"
  | "GRAPH_ID_MATCHED"
  | "GRAPH_ID_MISMATCH"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_NODES_BLOCKED"
  | "CROSS_TENANT_RELATIONSHIPS_BLOCKED"
  | "PROPOSAL_NODE_IDS_PRESENT"
  | "PROPOSAL_NODE_IDS_MISSING"
  | "RELATIONSHIP_NODE_IDS_PRESENT"
  | "RELATIONSHIP_NODE_IDS_MISSING"
  | "PROPOSAL_NODES_VALID"
  | "PROPOSAL_NODE_MISSING"
  | "RELATIONSHIP_NODES_VALID"
  | "RELATIONSHIP_NODE_MISSING"
  | "PROPOSAL_TYPE_VALID"
  | "PROPOSAL_TYPE_INVALID"
  | "RELATIONSHIP_REFERENCE_VALID"
  | "SELF_RELATIONSHIP_DETECTED"
  | "CIRCULAR_RELATIONSHIP_DETECTED"
  | "RELATIONSHIP_TARGET_UNKNOWN_NODE"
  | "RELATIONSHIP_REFERENCES_IMMUTABLE"
  | "RELATIONSHIP_REFERENCES_MUTATED"
  | "RELATIONSHIP_LIMIT_VALID"
  | "RELATIONSHIP_COUNT_EXCEEDED"
  | "RELATIONSHIP_DEPTH_VALID"
  | "RELATIONSHIP_DEPTH_EXCEEDED"
  | "LINEAGE_REFERENCES_PRESENT"
  | "LINEAGE_REFERENCES_MISSING"
  | "LINEAGE_INTEGRITY_VALID"
  | "LINEAGE_INTEGRITY_FAILED"
  | "RELATIONSHIP_HASH_GENERATED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "WORKFLOW_ROUTING_BLOCKED"
  | "WORKFLOW_ROUTING_DETECTED"
  | "PRIORITIZATION_BLOCKED"
  | "PRIORITIZATION_DETECTED"
  | "PROPOSAL_SELECTION_BLOCKED"
  | "PROPOSAL_SELECTION_DETECTED"
  | "AUTHORITY_BOUNDARY_PRESERVED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "PROPOSAL_RELATIONSHIP_GRAPH_IS_NOT_WORKFLOW_ENGINE";

export type ProposalRelationshipGraphInput = Readonly<{
  request: ProposalRelationshipRequest;
  graph: SealedDecisionGraphRecord;
  dependencyGraph: SealedRecommendationDependencyGraphRecord;
  proposalNodes: readonly ProposalNodeInput[];
  relationshipType?: ProposalRelationshipType;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  prioritizationRequested?: boolean;
  proposalSelectionRequested?: boolean;
  authorityExpansionRequested?: boolean;
}>;

export type ProposalRelationshipGraphValidation = Readonly<{
  valid: boolean;
  reasonCodes: readonly ProposalRelationshipReasonCode[];
  relationshipCount: number;
  lineageIntegrity: boolean;
  tenantIsolationVerified: boolean;
  relationshipDepth: number;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  authorityBounded: boolean;
}>;

export type ProposalRelationshipGraphObservability = Readonly<{
  graphId: string;
  relationshipCount: number;
  lineageIntegrity: boolean;
  tenantIsolationVerified: boolean;
  relationshipHash: string;
  graphState: ProposalRelationshipGraphResult["graphState"];
}>;

export type SealedProposalRelationshipGraphRecord = Readonly<{
  result: Readonly<ProposalRelationshipGraphResult>;
  proposalNodes: readonly Readonly<ProposalNode>[];
  edges: readonly Readonly<ProposalRelationshipEdge>[];
  validation: ProposalRelationshipGraphValidation;
  observability: ProposalRelationshipGraphObservability;
  sealed: true;
  readOnly: true;
  relationshipOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  prioritizationAllowed: false;
  proposalSelectionAllowed: false;
  proposalCreationAllowed: false;
  authorityMutationAllowed: false;
  relationshipMutationAllowed: false;
  selfExpansionAllowed: false;
}>;

export interface GovernanceInfluenceRequest {
  graphId: string;
  tenantId: string;
  governanceNodeIds: string[];
  influencedNodeIds: string[];
  lineageReferences: string[];
}

export interface GovernanceNode {
  governanceId: string;
  graphId: string;
  tenantId: string;
  governanceType:
    | "POLICY"
    | "CONSTRAINT"
    | "APPROVAL_REFERENCE"
    | "ESCALATION_RULE"
    | "BOUNDARY";
  lineageReference: string;
  immutableHash: string;
}

export interface GovernanceInfluenceEdge {
  edgeId: string;
  graphId: string;
  governanceNodeId: string;
  influencedNodeId: string;
  influenceType:
    | "CONSTRAINS"
    | "LIMITS"
    | "REQUIRES_REVIEW"
    | "BOUNDS"
    | "INFORMS"
    | "ESCALATES";
  tenantId: string;
  immutableHash: string;
}

export interface GovernanceInfluenceGraphResult {
  graphId: string;
  influenceCount: number;
  lineageIntegrity: boolean;
  tenantIsolationVerified: boolean;
  governanceBounded: boolean;
  influenceHash: string;
  graphState:
    | "VALIDATED"
    | "SEALED";
  sealed: boolean;
}

export type GovernanceNodeType = GovernanceNode["governanceType"];
export type GovernanceInfluenceType = GovernanceInfluenceEdge["influenceType"];

export type GovernanceNodeInput = Readonly<{
  governanceId: string;
  graphId: string;
  tenantId: string;
  governanceType: GovernanceNodeType;
  lineageReference: string;
}>;

export type GovernanceInfluenceReasonCode =
  | "SEALED_GRAPH_REQUIRED"
  | "GRAPH_UNSEALED"
  | "DEPENDENCY_GRAPH_REQUIRED"
  | "DEPENDENCY_GRAPH_UNSEALED"
  | "PROPOSAL_GRAPH_REQUIRED"
  | "PROPOSAL_GRAPH_UNSEALED"
  | "GRAPH_ID_MATCHED"
  | "GRAPH_ID_MISMATCH"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_NODES_BLOCKED"
  | "CROSS_TENANT_INFLUENCE_BLOCKED"
  | "GOVERNANCE_NODE_IDS_PRESENT"
  | "GOVERNANCE_NODE_IDS_MISSING"
  | "INFLUENCED_NODE_IDS_PRESENT"
  | "INFLUENCED_NODE_IDS_MISSING"
  | "GOVERNANCE_NODES_VALID"
  | "GOVERNANCE_ARTIFACT_MISSING"
  | "INFLUENCED_NODES_VALID"
  | "INFLUENCED_NODE_MISSING"
  | "GOVERNANCE_TYPE_VALID"
  | "GOVERNANCE_TYPE_INVALID"
  | "INFLUENCE_REFERENCE_VALID"
  | "SELF_INFLUENCE_DETECTED"
  | "INFLUENCE_TARGET_UNKNOWN_NODE"
  | "INFLUENCE_LIMIT_VALID"
  | "INFLUENCE_COUNT_EXCEEDED"
  | "GOVERNANCE_DEPTH_VALID"
  | "GOVERNANCE_DEPTH_EXCEEDED"
  | "LINEAGE_REFERENCES_PRESENT"
  | "LINEAGE_REFERENCES_MISSING"
  | "LINEAGE_INTEGRITY_VALID"
  | "LINEAGE_INTEGRITY_FAILED"
  | "GOVERNANCE_BOUNDED"
  | "GOVERNANCE_CREATES_AUTHORITY"
  | "GOVERNANCE_POLICY_IMMUTABLE"
  | "GOVERNANCE_MUTATES_POLICY"
  | "INFLUENCE_HASH_GENERATED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "WORKFLOW_ROUTING_BLOCKED"
  | "WORKFLOW_ROUTING_DETECTED"
  | "AUTHORITY_BOUNDARY_PRESERVED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "GOVERNANCE_INFLUENCE_IS_NOT_EXECUTION";

export type GovernanceInfluenceGraphInput = Readonly<{
  request: GovernanceInfluenceRequest;
  graph: SealedDecisionGraphRecord;
  dependencyGraph: SealedRecommendationDependencyGraphRecord;
  proposalGraph: SealedProposalRelationshipGraphRecord;
  governanceNodes: readonly GovernanceNodeInput[];
  influenceType?: GovernanceInfluenceType;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  authorityExpansionRequested?: boolean;
  policyMutationRequested?: boolean;
  governanceCreatesAuthority?: boolean;
}>;

export type GovernanceInfluenceGraphValidation = Readonly<{
  valid: boolean;
  reasonCodes: readonly GovernanceInfluenceReasonCode[];
  influenceCount: number;
  lineageIntegrity: boolean;
  tenantIsolationVerified: boolean;
  governanceBounded: boolean;
  governanceDepth: number;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  authorityBounded: boolean;
}>;

export type GovernanceInfluenceGraphObservability = Readonly<{
  graphId: string;
  influenceCount: number;
  lineageIntegrity: boolean;
  governanceBounded: boolean;
  influenceHash: string;
  graphState: GovernanceInfluenceGraphResult["graphState"];
}>;

export type SealedGovernanceInfluenceGraphRecord = Readonly<{
  result: Readonly<GovernanceInfluenceGraphResult>;
  governanceNodes: readonly Readonly<GovernanceNode>[];
  edges: readonly Readonly<GovernanceInfluenceEdge>[];
  validation: GovernanceInfluenceGraphValidation;
  observability: GovernanceInfluenceGraphObservability;
  sealed: true;
  readOnly: true;
  influenceOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  policyMutationAllowed: false;
  governanceExecutionAllowed: false;
  authorityMutationAllowed: false;
  influenceMutationAllowed: false;
  selfExpansionAllowed: false;
}>;

export interface EscalationGraphRequest {
  graphId: string;
  tenantId: string;
  escalationNodeIds: string[];
  targetNodeIds: string[];
  lineageReferences: string[];
}

export interface EscalationNode {
  escalationId: string;
  graphId: string;
  tenantId: string;
  escalationType:
    | "REVIEW"
    | "GOVERNANCE"
    | "CONTAINMENT"
    | "BOUNDARY"
    | "SUPERVISION";
  lineageReference: string;
  immutableHash: string;
}

export interface EscalationEdge {
  edgeId: string;
  graphId: string;
  escalationNodeId: string;
  targetNodeId: string;
  escalationRelationship:
    | "ESCALATES_TO"
    | "REQUIRES_REVIEW"
    | "CONSTRAINED_BY"
    | "SUPERVISED_BY"
    | "BOUNDED_BY";
  tenantId: string;
  immutableHash: string;
}

export interface EscalationGraphResult {
  graphId: string;
  escalationCount: number;
  lineageIntegrity: boolean;
  tenantIsolationVerified: boolean;
  escalationBounded: boolean;
  escalationHash: string;
  graphState:
    | "VALIDATED"
    | "SEALED";
  sealed: boolean;
}

export type EscalationNodeType = EscalationNode["escalationType"];
export type EscalationRelationshipType = EscalationEdge["escalationRelationship"];

export type EscalationNodeInput = Readonly<{
  escalationId: string;
  graphId: string;
  tenantId: string;
  escalationType: EscalationNodeType;
  lineageReference: string;
}>;

export type EscalationGraphReasonCode =
  | "SEALED_GRAPH_REQUIRED"
  | "GRAPH_UNSEALED"
  | "DEPENDENCY_GRAPH_REQUIRED"
  | "DEPENDENCY_GRAPH_UNSEALED"
  | "PROPOSAL_GRAPH_REQUIRED"
  | "PROPOSAL_GRAPH_UNSEALED"
  | "GOVERNANCE_GRAPH_REQUIRED"
  | "GOVERNANCE_GRAPH_UNSEALED"
  | "GRAPH_ID_MATCHED"
  | "GRAPH_ID_MISMATCH"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_NODES_BLOCKED"
  | "CROSS_TENANT_ESCALATION_BLOCKED"
  | "ESCALATION_NODE_IDS_PRESENT"
  | "ESCALATION_NODE_IDS_MISSING"
  | "TARGET_NODE_IDS_PRESENT"
  | "TARGET_NODE_IDS_MISSING"
  | "ESCALATION_NODES_VALID"
  | "ESCALATION_ARTIFACT_MISSING"
  | "TARGET_NODES_VALID"
  | "TARGET_NODE_MISSING"
  | "ESCALATION_TYPE_VALID"
  | "ESCALATION_TYPE_INVALID"
  | "ESCALATION_REFERENCE_VALID"
  | "SELF_ESCALATION_DETECTED"
  | "ESCALATION_TARGET_UNKNOWN_NODE"
  | "ESCALATION_OWNERSHIP_IMMUTABLE"
  | "ESCALATION_MUTATES_OWNERSHIP"
  | "ESCALATION_LIMIT_VALID"
  | "ESCALATION_COUNT_EXCEEDED"
  | "ESCALATION_DEPTH_VALID"
  | "ESCALATION_DEPTH_EXCEEDED"
  | "LINEAGE_REFERENCES_PRESENT"
  | "LINEAGE_REFERENCES_MISSING"
  | "LINEAGE_INTEGRITY_VALID"
  | "LINEAGE_INTEGRITY_FAILED"
  | "ESCALATION_BOUNDED"
  | "ESCALATION_CREATES_AUTHORITY"
  | "ESCALATION_HASH_GENERATED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "WORKFLOW_ROUTING_BLOCKED"
  | "WORKFLOW_ROUTING_DETECTED"
  | "AUTHORITY_BOUNDARY_PRESERVED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "ESCALATION_GRAPH_IS_NOT_EXECUTION";

export type EscalationGraphInput = Readonly<{
  request: EscalationGraphRequest;
  graph: SealedDecisionGraphRecord;
  dependencyGraph: SealedRecommendationDependencyGraphRecord;
  proposalGraph: SealedProposalRelationshipGraphRecord;
  governanceGraph: SealedGovernanceInfluenceGraphRecord;
  escalationNodes: readonly EscalationNodeInput[];
  escalationRelationship?: EscalationRelationshipType;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  authorityExpansionRequested?: boolean;
  escalationCreatesAuthority?: boolean;
  ownershipMutationRequested?: boolean;
}>;

export type EscalationGraphValidation = Readonly<{
  valid: boolean;
  reasonCodes: readonly EscalationGraphReasonCode[];
  escalationCount: number;
  lineageIntegrity: boolean;
  tenantIsolationVerified: boolean;
  escalationBounded: boolean;
  escalationDepth: number;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  authorityBounded: boolean;
}>;

export type EscalationGraphObservability = Readonly<{
  graphId: string;
  escalationCount: number;
  lineageIntegrity: boolean;
  escalationBounded: boolean;
  escalationHash: string;
  graphState: EscalationGraphResult["graphState"];
}>;

export type SealedEscalationGraphRecord = Readonly<{
  result: Readonly<EscalationGraphResult>;
  escalationNodes: readonly Readonly<EscalationNode>[];
  edges: readonly Readonly<EscalationEdge>[];
  validation: EscalationGraphValidation;
  observability: EscalationGraphObservability;
  sealed: true;
  readOnly: true;
  escalationOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  runtimeDispatchAllowed: false;
  notificationAllowed: false;
  authorityMutationAllowed: false;
  escalationMutationAllowed: false;
  selfExpansionAllowed: false;
}>;

export interface ReplayableGraphTopologyRequest {
  graphId: string;
  tenantId: string;
  nodeHashes: string[];
  edgeHashes: string[];
  lineageReferences: string[];
  topologyVersion: string;
}

export interface ReplayableTopologyNode {
  nodeHash: string;
  nodeType: string;
  graphId: string;
  tenantId: string;
  topologyOrder: number;
}

export interface ReplayableTopologyEdge {
  edgeHash: string;
  sourceHash: string;
  targetHash: string;
  graphId: string;
  topologyOrder: number;
}

export interface ReplayableGraphTopologyResult {
  graphId: string;
  topologyHash: string;
  reconstructionHash: string;
  lineageIntegrity: boolean;
  tenantIsolationVerified: boolean;
  topologyDeterministic: boolean;
  graphState:
    | "VALIDATED"
    | "SEALED";
  sealed: boolean;
}

export type ReplayableGraphTopologyReasonCode =
  | "SEALED_GRAPH_REQUIRED"
  | "GRAPH_UNSEALED"
  | "DEPENDENCY_GRAPH_REQUIRED"
  | "DEPENDENCY_GRAPH_UNSEALED"
  | "PROPOSAL_GRAPH_REQUIRED"
  | "PROPOSAL_GRAPH_UNSEALED"
  | "GOVERNANCE_GRAPH_REQUIRED"
  | "GOVERNANCE_GRAPH_UNSEALED"
  | "ESCALATION_GRAPH_REQUIRED"
  | "ESCALATION_GRAPH_UNSEALED"
  | "GRAPH_ID_MATCHED"
  | "GRAPH_ID_MISMATCH"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_NODES_BLOCKED"
  | "NODE_HASHES_PRESENT"
  | "NODE_HASHES_MISSING"
  | "EDGE_HASHES_PRESENT"
  | "EDGE_HASHES_MISSING"
  | "NODE_HASHES_UNIQUE"
  | "DUPLICATE_NODE_HASHES"
  | "EDGE_HASHES_UNIQUE"
  | "DUPLICATE_EDGE_HASHES"
  | "RECONSTRUCTION_INPUTS_COMPLETE"
  | "RECONSTRUCTION_INPUTS_INCOMPLETE"
  | "TOPOLOGY_ORDERING_CONSISTENT"
  | "TOPOLOGY_ORDERING_INCONSISTENT"
  | "TOPOLOGY_MUTATION_BLOCKED"
  | "TOPOLOGY_MUTATION_DETECTED"
  | "LINEAGE_REFERENCES_PRESENT"
  | "LINEAGE_REFERENCES_MISSING"
  | "LINEAGE_INTEGRITY_VALID"
  | "LINEAGE_INTEGRITY_FAILED"
  | "NODE_LIMIT_VALID"
  | "TOPOLOGY_NODE_LIMIT_EXCEEDED"
  | "EDGE_LIMIT_VALID"
  | "TOPOLOGY_EDGE_LIMIT_EXCEEDED"
  | "DEPTH_VALID"
  | "TOPOLOGY_DEPTH_EXCEEDED"
  | "RECONSTRUCTION_HASH_GENERATED"
  | "TOPOLOGY_HASH_GENERATED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "WORKFLOW_ROUTING_BLOCKED"
  | "WORKFLOW_ROUTING_DETECTED"
  | "AUTHORITY_BOUNDARY_PRESERVED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "REPLAYABLE_TOPOLOGY_IS_NOT_EXECUTION";

export type ReplayableGraphTopologyInput = Readonly<{
  request: ReplayableGraphTopologyRequest;
  graph: SealedDecisionGraphRecord;
  dependencyGraph: SealedRecommendationDependencyGraphRecord;
  proposalGraph: SealedProposalRelationshipGraphRecord;
  governanceGraph: SealedGovernanceInfluenceGraphRecord;
  escalationGraph: SealedEscalationGraphRecord;
  topologyMutationDetected?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  authorityExpansionRequested?: boolean;
}>;

export type ReplayableGraphTopologyValidation = Readonly<{
  valid: boolean;
  reasonCodes: readonly ReplayableGraphTopologyReasonCode[];
  lineageIntegrity: boolean;
  tenantIsolationVerified: boolean;
  topologyDeterministic: boolean;
  reconstructionComplete: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  authorityBounded: boolean;
}>;

export type ReplayableGraphTopologyObservability = Readonly<{
  graphId: string;
  topologyHash: string;
  reconstructionHash: string;
  topologyDeterministic: boolean;
  lineageIntegrity: boolean;
}>;

export type SealedReplayableGraphTopologyRecord = Readonly<{
  result: Readonly<ReplayableGraphTopologyResult>;
  nodes: readonly Readonly<ReplayableTopologyNode>[];
  edges: readonly Readonly<ReplayableTopologyEdge>[];
  validation: ReplayableGraphTopologyValidation;
  observability: ReplayableGraphTopologyObservability;
  sealed: true;
  readOnly: true;
  topologyOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  topologyMutationAllowed: false;
  authorityMutationAllowed: false;
  graphOptimizationAllowed: false;
  selfExpansionAllowed: false;
}>;

export interface GraphInspectionRequest {
  graphId: string;
  tenantId: string;
  inspectionScope:
    | "HEALTH"
    | "LINEAGE"
    | "DEPENDENCIES"
    | "TOPOLOGY"
    | "FULL";
  lineageReferences: string[];
}

export interface GraphInspectionResult {
  graphId: string;
  inspectionState:
    | "HEALTHY"
    | "LIMITED"
    | "DEGRADED"
    | "ESCALATED";
  dependencyCount: number;
  nodeCount: number;
  edgeCount: number;
  topologyDeterministic: boolean;
  lineageIntegrity: boolean;
  tenantIsolationVerified: boolean;
  inspectionHash: string;
}

export type GraphInspectionScope = GraphInspectionRequest["inspectionScope"];

export type GraphInspectionReasonCode =
  | "SEALED_GRAPH_REQUIRED"
  | "GRAPH_UNSEALED"
  | "DEPENDENCY_GRAPH_REQUIRED"
  | "DEPENDENCY_GRAPH_UNSEALED"
  | "PROPOSAL_GRAPH_REQUIRED"
  | "PROPOSAL_GRAPH_UNSEALED"
  | "GOVERNANCE_GRAPH_REQUIRED"
  | "GOVERNANCE_GRAPH_UNSEALED"
  | "ESCALATION_GRAPH_REQUIRED"
  | "ESCALATION_GRAPH_UNSEALED"
  | "TOPOLOGY_REQUIRED"
  | "TOPOLOGY_UNSEALED"
  | "GRAPH_ID_MATCHED"
  | "GRAPH_ID_MISMATCH"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_ARTIFACTS_BLOCKED"
  | "OWNERSHIP_EXPLICIT"
  | "ARTIFACT_OWNERSHIP_MISMATCH"
  | "INSPECTION_SCOPE_VALID"
  | "INSPECTION_SCOPE_INVALID"
  | "LINEAGE_REFERENCES_PRESENT"
  | "LINEAGE_REFERENCES_MISSING"
  | "LINEAGE_INTEGRITY_VALID"
  | "LINEAGE_INTEGRITY_FAILED"
  | "GRAPH_INTEGRITY_HEALTHY"
  | "GRAPH_INTEGRITY_FAILURE"
  | "INSPECTION_MUTATION_BLOCKED"
  | "INSPECTION_ATTEMPTS_MUTATION"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "WORKFLOW_ROUTING_BLOCKED"
  | "WORKFLOW_ROUTING_DETECTED"
  | "RECOMMENDATION_CREATION_BLOCKED"
  | "RECOMMENDATION_CREATION_DETECTED"
  | "GRAPH_OPTIMIZATION_BLOCKED"
  | "GRAPH_OPTIMIZATION_DETECTED"
  | "AUTHORITY_BOUNDARY_PRESERVED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "OWNERSHIP_MUTATION_BLOCKED"
  | "OWNERSHIP_MUTATION_DETECTED"
  | "VISIBLE_NODE_LIMIT_APPLIED"
  | "VISIBLE_NODE_LIMIT_VALID"
  | "VISIBLE_EDGE_LIMIT_APPLIED"
  | "VISIBLE_EDGE_LIMIT_VALID"
  | "INSPECTION_DEPTH_LIMIT_APPLIED"
  | "INSPECTION_DEPTH_LIMIT_VALID"
  | "GRAPH_INSPECTION_IS_NOT_CONTROL";

export type GraphInspectionProjection = Readonly<{
  scope: GraphInspectionScope;
  nodeIds: readonly string[];
  edgeIds: readonly string[];
  dependencyIds: readonly string[];
  lineageReferences: readonly string[];
  topologyNodeHashes: readonly string[];
  topologyEdgeHashes: readonly string[];
  clipped: boolean;
}>;

export type GraphInspectionInput = Readonly<{
  request: GraphInspectionRequest;
  graph: SealedDecisionGraphRecord;
  dependencyGraph: SealedRecommendationDependencyGraphRecord;
  proposalGraph: SealedProposalRelationshipGraphRecord;
  governanceGraph: SealedGovernanceInfluenceGraphRecord;
  escalationGraph: SealedEscalationGraphRecord;
  topology: SealedReplayableGraphTopologyRecord;
  inspectionMutationAttempted?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  recommendationCreationRequested?: boolean;
  graphOptimizationRequested?: boolean;
  authorityExpansionRequested?: boolean;
  ownershipMutationRequested?: boolean;
}>;

export type GraphInspectionValidation = Readonly<{
  valid: boolean;
  validationState:
    | "VALID"
    | "INVALID"
    | "ESCALATED";
  reasonCodes: readonly GraphInspectionReasonCode[];
  inspectionState: GraphInspectionResult["inspectionState"];
  dependencyCount: number;
  nodeCount: number;
  edgeCount: number;
  topologyDeterministic: boolean;
  lineageIntegrity: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: true;
}>;

export type GraphInspectionObservability = Readonly<{
  graphId: string;
  inspectionState: GraphInspectionResult["inspectionState"];
  nodeCount: number;
  edgeCount: number;
  lineageIntegrity: boolean;
  inspectionHash: string;
}>;

export type SealedGraphInspectionRecord = Readonly<{
  result: Readonly<GraphInspectionResult>;
  projection: GraphInspectionProjection;
  validation: GraphInspectionValidation;
  observability: GraphInspectionObservability;
  sealed: true;
  readOnly: true;
  inspectionOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  graphMutationAllowed: false;
  recommendationCreationAllowed: false;
  graphOptimizationAllowed: false;
  authorityMutationAllowed: false;
  ownershipMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export interface GraphIntegrityVerificationRequest {
  graphId: string;
  tenantId: string;
  verificationScope:
    | "OWNERSHIP"
    | "LINEAGE"
    | "TOPOLOGY"
    | "AUTHORITY"
    | "FULL";
  lineageReferences: string[];
}

export interface GraphIntegrityVerificationResult {
  graphId: string;
  verificationStatus:
    | "PASS"
    | "LIMITED"
    | "ESCALATED"
    | "FAIL";
  ownershipIntegrity: boolean;
  lineageIntegrity: boolean;
  topologyIntegrity: boolean;
  authorityBounded: boolean;
  tenantIsolationVerified: boolean;
  deterministicReplayVerified: boolean;
  verificationHash: string;
}

export type GraphIntegrityVerificationScope = GraphIntegrityVerificationRequest["verificationScope"];

export type GraphIntegrityVerificationReasonCode =
  | "SEALED_GRAPH_REQUIRED"
  | "GRAPH_UNSEALED"
  | "DEPENDENCY_GRAPH_REQUIRED"
  | "DEPENDENCY_GRAPH_UNSEALED"
  | "PROPOSAL_GRAPH_REQUIRED"
  | "PROPOSAL_GRAPH_UNSEALED"
  | "GOVERNANCE_GRAPH_REQUIRED"
  | "GOVERNANCE_GRAPH_UNSEALED"
  | "ESCALATION_GRAPH_REQUIRED"
  | "ESCALATION_GRAPH_UNSEALED"
  | "TOPOLOGY_REQUIRED"
  | "TOPOLOGY_UNSEALED"
  | "INSPECTION_REQUIRED"
  | "INSPECTION_UNSEALED"
  | "GRAPH_ID_MATCHED"
  | "GRAPH_ID_MISMATCH"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_ARTIFACTS_BLOCKED"
  | "OWNERSHIP_EXPLICIT"
  | "OWNERSHIP_MISMATCH"
  | "VERIFICATION_SCOPE_VALID"
  | "VERIFICATION_SCOPE_INVALID"
  | "LINEAGE_REFERENCES_PRESENT"
  | "LINEAGE_REFERENCES_MISSING"
  | "LINEAGE_INTEGRITY_VALID"
  | "LINEAGE_CORRUPTION_DETECTED"
  | "TOPOLOGY_INTEGRITY_VALID"
  | "TOPOLOGY_CORRUPTION_DETECTED"
  | "DUPLICATE_ARTIFACTS_ABSENT"
  | "DUPLICATE_ARTIFACTS_DETECTED"
  | "REPLAY_DETERMINISM_VERIFIED"
  | "REPLAY_DETERMINISM_FAILURE"
  | "AUTHORITY_BOUNDARY_PRESERVED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "VERIFICATION_MUTATION_BLOCKED"
  | "VERIFICATION_ATTEMPTS_MUTATION"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "WORKFLOW_ROUTING_BLOCKED"
  | "WORKFLOW_ROUTING_DETECTED"
  | "GRAPH_OPTIMIZATION_BLOCKED"
  | "GRAPH_OPTIMIZATION_DETECTED"
  | "OWNERSHIP_MUTATION_BLOCKED"
  | "OWNERSHIP_MUTATION_DETECTED"
  | "VERIFICATION_DEPTH_VALID"
  | "VERIFICATION_DEPTH_EXCEEDED"
  | "VERIFIED_ARTIFACT_LIMIT_VALID"
  | "VERIFIED_ARTIFACT_LIMIT_EXCEEDED"
  | "GRAPH_VERIFICATION_IS_NOT_REPAIR";

export type GraphIntegrityVerificationPath = Readonly<{
  scope: GraphIntegrityVerificationScope;
  artifactIds: readonly string[];
  lineageReferences: readonly string[];
  topologyNodeHashes: readonly string[];
  topologyEdgeHashes: readonly string[];
}>;

export type GraphIntegrityVerificationInput = Readonly<{
  request: GraphIntegrityVerificationRequest;
  graph: SealedDecisionGraphRecord;
  dependencyGraph: SealedRecommendationDependencyGraphRecord;
  proposalGraph: SealedProposalRelationshipGraphRecord;
  governanceGraph: SealedGovernanceInfluenceGraphRecord;
  escalationGraph: SealedEscalationGraphRecord;
  topology: SealedReplayableGraphTopologyRecord;
  inspection: SealedGraphInspectionRecord;
  verificationMutationAttempted?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  graphOptimizationRequested?: boolean;
  authorityExpansionRequested?: boolean;
  ownershipMutationRequested?: boolean;
}>;

export type GraphIntegrityVerificationValidation = Readonly<{
  valid: boolean;
  validationState:
    | "PASS"
    | "LIMITED"
    | "ESCALATED"
    | "FAIL";
  reasonCodes: readonly GraphIntegrityVerificationReasonCode[];
  ownershipIntegrity: boolean;
  lineageIntegrity: boolean;
  topologyIntegrity: boolean;
  authorityBounded: boolean;
  tenantIsolationVerified: boolean;
  deterministicReplayVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  controlSurfaceAbsent: true;
  verifiedArtifactCount: number;
}>;

export type GraphIntegrityVerificationObservability = Readonly<{
  graphId: string;
  verificationStatus: GraphIntegrityVerificationResult["verificationStatus"];
  ownershipIntegrity: boolean;
  lineageIntegrity: boolean;
  topologyIntegrity: boolean;
  verificationHash: string;
}>;

export type SealedGraphIntegrityVerificationRecord = Readonly<{
  result: Readonly<GraphIntegrityVerificationResult>;
  verificationPath: GraphIntegrityVerificationPath;
  validation: GraphIntegrityVerificationValidation;
  observability: GraphIntegrityVerificationObservability;
  sealed: true;
  readOnly: true;
  verificationOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  graphMutationAllowed: false;
  graphOptimizationAllowed: false;
  authorityMutationAllowed: false;
  ownershipMutationAllowed: false;
  repairAuthorized: false;
  controlSurfacePresent: false;
}>;

export interface DecisionGraphCertificationRequest {
  graphId: string;
  tenantId: string;
  certificationScope:
    | "TOPOLOGY"
    | "OWNERSHIP"
    | "LINEAGE"
    | "AUTHORITY"
    | "FULL";
  lineageReferences: string[];
  graphVersion: string;
}

export interface DecisionGraphCertificationResult {
  graphId: string;
  certificationStatus:
    | "PASS"
    | "CONDITIONAL_PASS"
    | "FAIL";
  ownershipCertified: boolean;
  lineageCertified: boolean;
  topologyCertified: boolean;
  authorityBounded: boolean;
  tenantIsolationVerified: boolean;
  replayDeterministic: boolean;
  certificationHash: string;
}

export type DecisionGraphCertificationScope = DecisionGraphCertificationRequest["certificationScope"];

export type DecisionGraphCertificationReasonCode =
  | "SEALED_GRAPH_REQUIRED"
  | "GRAPH_UNSEALED"
  | "DEPENDENCY_GRAPH_REQUIRED"
  | "DEPENDENCY_GRAPH_UNSEALED"
  | "PROPOSAL_GRAPH_REQUIRED"
  | "PROPOSAL_GRAPH_UNSEALED"
  | "GOVERNANCE_GRAPH_REQUIRED"
  | "GOVERNANCE_GRAPH_UNSEALED"
  | "ESCALATION_GRAPH_REQUIRED"
  | "ESCALATION_GRAPH_UNSEALED"
  | "TOPOLOGY_REQUIRED"
  | "TOPOLOGY_UNSEALED"
  | "INSPECTION_REQUIRED"
  | "INSPECTION_UNSEALED"
  | "VERIFICATION_REQUIRED"
  | "VERIFICATION_MISSING"
  | "GRAPH_ID_MATCHED"
  | "GRAPH_ID_MISMATCH"
  | "GRAPH_VERSION_MATCHED"
  | "GRAPH_VERSION_MISMATCH"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_ARTIFACTS_BLOCKED"
  | "OWNERSHIP_CERTIFIED"
  | "OWNERSHIP_MISMATCH"
  | "CERTIFICATION_SCOPE_VALID"
  | "CERTIFICATION_SCOPE_INVALID"
  | "LINEAGE_REFERENCES_PRESENT"
  | "LINEAGE_REFERENCES_MISSING"
  | "LINEAGE_CERTIFIED"
  | "LINEAGE_CORRUPTION_DETECTED"
  | "TOPOLOGY_CERTIFIED"
  | "TOPOLOGY_CORRUPTION_DETECTED"
  | "AUTHORITY_BOUNDARY_PRESERVED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "VERIFICATION_EVIDENCE_PRESENT"
  | "VERIFICATION_EVIDENCE_MISSING"
  | "EVIDENCE_HASH_VERIFIED"
  | "EVIDENCE_HASH_MISMATCH"
  | "REPLAY_DETERMINISM_VERIFIED"
  | "REPLAY_DETERMINISM_FAILURE"
  | "CERTIFICATION_MUTATION_BLOCKED"
  | "CERTIFICATION_ATTEMPTS_MUTATION"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "WORKFLOW_ROUTING_BLOCKED"
  | "WORKFLOW_ROUTING_DETECTED"
  | "GRAPH_OPTIMIZATION_BLOCKED"
  | "GRAPH_OPTIMIZATION_DETECTED"
  | "OWNERSHIP_MUTATION_BLOCKED"
  | "OWNERSHIP_MUTATION_DETECTED"
  | "CERTIFICATION_DEPTH_VALID"
  | "CERTIFICATION_DEPTH_EXCEEDED"
  | "CERTIFIED_ARTIFACT_LIMIT_VALID"
  | "CERTIFIED_ARTIFACT_LIMIT_EXCEEDED"
  | "DECISION_GRAPH_CERTIFICATION_IS_NOT_CONTROL";

export type DecisionGraphCertificationEvidenceChain = Readonly<{
  scope: DecisionGraphCertificationScope;
  evidenceIds: readonly string[];
  evidenceHashes: readonly string[];
  lineageReferences: readonly string[];
  topologyNodeHashes: readonly string[];
  topologyEdgeHashes: readonly string[];
}>;

export type DecisionGraphCertificationInput = Readonly<{
  request: DecisionGraphCertificationRequest;
  graph: SealedDecisionGraphRecord;
  dependencyGraph: SealedRecommendationDependencyGraphRecord;
  proposalGraph: SealedProposalRelationshipGraphRecord;
  governanceGraph: SealedGovernanceInfluenceGraphRecord;
  escalationGraph: SealedEscalationGraphRecord;
  topology: SealedReplayableGraphTopologyRecord;
  inspection: SealedGraphInspectionRecord;
  verification: SealedGraphIntegrityVerificationRecord;
  certificationMutationAttempted?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  graphOptimizationRequested?: boolean;
  authorityExpansionRequested?: boolean;
  ownershipMutationRequested?: boolean;
}>;

export type DecisionGraphCertificationValidation = Readonly<{
  valid: boolean;
  certificationStatus: DecisionGraphCertificationResult["certificationStatus"];
  reasonCodes: readonly DecisionGraphCertificationReasonCode[];
  ownershipCertified: boolean;
  lineageCertified: boolean;
  topologyCertified: boolean;
  authorityBounded: boolean;
  tenantIsolationVerified: boolean;
  replayDeterministic: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  controlSurfaceAbsent: true;
  certifiedArtifactCount: number;
}>;

export type DecisionGraphCertificationObservability = Readonly<{
  graphId: string;
  certificationStatus: DecisionGraphCertificationResult["certificationStatus"];
  ownershipCertified: boolean;
  lineageCertified: boolean;
  topologyCertified: boolean;
  certificationHash: string;
}>;

export type SealedDecisionGraphCertificationRecord = Readonly<{
  result: Readonly<DecisionGraphCertificationResult>;
  evidenceChain: DecisionGraphCertificationEvidenceChain;
  validation: DecisionGraphCertificationValidation;
  observability: DecisionGraphCertificationObservability;
  sealed: true;
  readOnly: true;
  certificationOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  graphMutationAllowed: false;
  graphOptimizationAllowed: false;
  authorityMutationAllowed: false;
  ownershipMutationAllowed: false;
  repairAuthorized: false;
  controlSurfacePresent: false;
}>;
