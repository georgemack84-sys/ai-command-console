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
    | "OBSERVED_BY";
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
