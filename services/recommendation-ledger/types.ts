import type {
  SealedDecisionGraphCertificationRecord,
  SealedDecisionGraphRecord,
  SealedGraphIntegrityVerificationRecord,
} from "@/services/decision-graph";
import type {
  SealedEscalationCertificationRecord,
  SealedEscalationIntelligenceRecord,
} from "@/services/escalation-intelligence";

export interface RecommendationLedgerRequest {
  recommendationId: string;
  tenantId: string;
  recommendationContext:
    | "OWNERSHIP"
    | "LINEAGE"
    | "GRAPH"
    | "ESCALATION"
    | "FULL";
  lineageReferences: string[];
  graphVersion: string;
}

export interface RecommendationLedgerResult {
  recommendationId: string;
  ledgerState:
    | "RECORDED"
    | "LIMITED"
    | "INVALID";
  ownershipVerified: boolean;
  lineageIntegrity: boolean;
  replayable: boolean;
  tenantIsolationVerified: boolean;
  ledgerHash: string;
  evidenceHash: string;
  deterministic: boolean;
}

export type RecommendationLedgerContext = RecommendationLedgerRequest["recommendationContext"];

export type RecommendationLedgerReasonCode =
  | "GRAPH_REQUIRED"
  | "GRAPH_UNSEALED"
  | "INTELLIGENCE_REQUIRED"
  | "INTELLIGENCE_UNSEALED"
  | "VERIFICATION_REQUIRED"
  | "VERIFICATION_UNSEALED"
  | "CERTIFICATION_REQUIRED"
  | "CERTIFICATION_UNSEALED"
  | "ESCALATION_CERTIFICATION_REQUIRED"
  | "ESCALATION_CERTIFICATION_UNSEALED"
  | "RECOMMENDATION_CONTEXT_VALID"
  | "RECOMMENDATION_CONTEXT_INVALID"
  | "RECOMMENDATION_ID_PRESENT"
  | "RECOMMENDATION_ID_MISSING"
  | "RECOMMENDATION_NODE_PRESENT"
  | "RECOMMENDATION_NODE_MISSING"
  | "RECOMMENDATION_NODE_TYPE_VALID"
  | "RECOMMENDATION_NODE_TYPE_INVALID"
  | "GRAPH_ID_MATCHED"
  | "GRAPH_ID_MISMATCH"
  | "GRAPH_VERSION_MATCHED"
  | "GRAPH_VERSION_MISMATCH"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_ARTIFACTS_BLOCKED"
  | "OWNERSHIP_VALID"
  | "OWNERSHIP_MISMATCH"
  | "LINEAGE_REFERENCES_PRESENT"
  | "LINEAGE_REFERENCES_MISSING"
  | "LINEAGE_INTEGRITY_VALID"
  | "LINEAGE_CORRUPTION_DETECTED"
  | "EVIDENCE_CHAIN_VALID"
  | "EVIDENCE_CHAIN_BROKEN"
  | "REPLAY_REFERENCES_PRESENT"
  | "REPLAY_REFERENCES_MISSING"
  | "EVIDENCE_HASH_VERIFIED"
  | "EVIDENCE_HASH_MISMATCH"
  | "APPEND_ONLY_VALID"
  | "APPEND_ONLY_VIOLATION"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "WORKFLOW_ROUTING_BLOCKED"
  | "WORKFLOW_ROUTING_DETECTED"
  | "RECOMMENDATION_GENERATION_BLOCKED"
  | "RECOMMENDATION_GENERATION_DETECTED"
  | "PRIORITIZATION_BLOCKED"
  | "PRIORITIZATION_DETECTED"
  | "LEDGER_MUTATION_BLOCKED"
  | "LEDGER_MUTATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "LEDGER_DEPTH_VALID"
  | "LEDGER_DEPTH_EXCEEDED"
  | "LEDGER_REFERENCE_LIMIT_VALID"
  | "LEDGER_REFERENCE_LIMIT_EXCEEDED"
  | "LINEAGE_REFERENCE_LIMIT_VALID"
  | "LINEAGE_REFERENCE_LIMIT_EXCEEDED"
  | "RECOMMENDATION_LEDGER_IS_NOT_ENGINE";

export type RecommendationLedgerEntry = Readonly<{
  ledgerEntryId: string;
  recommendationId: string;
  graphId: string;
  tenantId: string;
  lineageReferences: readonly string[];
  evidenceIds: readonly string[];
  evidenceHashes: readonly string[];
  immutableHash: string;
  recordOrder: number;
}>;

export type RecommendationLedgerEvidencePath = Readonly<{
  context: RecommendationLedgerContext;
  evidenceIds: readonly string[];
  evidenceHashes: readonly string[];
  lineageReferences: readonly string[];
}>;

export type RecommendationLedgerInput = Readonly<{
  request: RecommendationLedgerRequest;
  graph: SealedDecisionGraphRecord;
  intelligence: SealedEscalationIntelligenceRecord;
  verification: SealedGraphIntegrityVerificationRecord;
  certification: SealedDecisionGraphCertificationRecord;
  escalationCertification: SealedEscalationCertificationRecord;
  existingEntries?: readonly RecommendationLedgerEntry[];
  ledgerMutationAttempted?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  recommendationGenerationRequested?: boolean;
  prioritizationRequested?: boolean;
  authorityExpansionRequested?: boolean;
}>;

export type RecommendationLedgerValidation = Readonly<{
  valid: boolean;
  ledgerState: RecommendationLedgerResult["ledgerState"];
  reasonCodes: readonly RecommendationLedgerReasonCode[];
  ownershipVerified: boolean;
  lineageIntegrity: boolean;
  replayable: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: true;
  ledgerReferenceCount: number;
}>;

export type RecommendationLedgerObservability = Readonly<{
  recommendationId: string;
  ledgerState: RecommendationLedgerResult["ledgerState"];
  ownershipVerified: boolean;
  lineageIntegrity: boolean;
  ledgerHash: string;
  evidenceHash: string;
}>;

export type SealedRecommendationLedgerRecord = Readonly<{
  result: Readonly<RecommendationLedgerResult>;
  entry: RecommendationLedgerEntry;
  evidencePath: RecommendationLedgerEvidencePath;
  validation: RecommendationLedgerValidation;
  observability: RecommendationLedgerObservability;
  sealed: true;
  readOnly: true;
  ledgerOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  recommendationGenerationAllowed: false;
  prioritizationAllowed: false;
  authorityMutationAllowed: false;
  ledgerMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export interface LineageReconstructionRequest {
  recommendationId: string;
  tenantId: string;
  reconstructionContext:
    | "OWNERSHIP"
    | "LINEAGE"
    | "GRAPH"
    | "ESCALATION"
    | "FULL";
  lineageReferences: string[];
  graphVersion: string;
}

export interface LineageReconstructionResult {
  recommendationId: string;
  reconstructionState:
    | "RECONSTRUCTED"
    | "LIMITED"
    | "INVALID";
  lineageIntegrity: boolean;
  ancestryRebuilt: boolean;
  replayable: boolean;
  tenantIsolationVerified: boolean;
  reconstructionHash: string;
  lineageHash: string;
  deterministic: boolean;
}

export type LineageReconstructionContext = LineageReconstructionRequest["reconstructionContext"];

export type LineageReconstructionReasonCode =
  | "LEDGER_REQUIRED"
  | "LEDGER_UNSEALED"
  | "GRAPH_REQUIRED"
  | "GRAPH_UNSEALED"
  | "VERIFICATION_REQUIRED"
  | "VERIFICATION_UNSEALED"
  | "CERTIFICATION_REQUIRED"
  | "CERTIFICATION_UNSEALED"
  | "ESCALATION_CERTIFICATION_REQUIRED"
  | "ESCALATION_CERTIFICATION_UNSEALED"
  | "RECONSTRUCTION_CONTEXT_VALID"
  | "RECONSTRUCTION_CONTEXT_INVALID"
  | "RECOMMENDATION_ID_PRESENT"
  | "RECOMMENDATION_ID_MISSING"
  | "RECOMMENDATION_NODE_PRESENT"
  | "RECOMMENDATION_NODE_MISSING"
  | "RECOMMENDATION_NODE_TYPE_VALID"
  | "RECOMMENDATION_NODE_TYPE_INVALID"
  | "GRAPH_ID_MATCHED"
  | "GRAPH_ID_MISMATCH"
  | "GRAPH_VERSION_MATCHED"
  | "GRAPH_VERSION_MISMATCH"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_ARTIFACTS_BLOCKED"
  | "OWNERSHIP_VALID"
  | "OWNERSHIP_MISMATCH"
  | "LINEAGE_REFERENCES_PRESENT"
  | "LINEAGE_REFERENCES_MISSING"
  | "LINEAGE_INTEGRITY_VALID"
  | "LINEAGE_CORRUPTION_DETECTED"
  | "ANCESTRY_CHAIN_VALID"
  | "ANCESTRY_BROKEN"
  | "REPLAY_REFERENCES_PRESENT"
  | "REPLAY_REFERENCES_MISSING"
  | "EVIDENCE_HASH_VERIFIED"
  | "EVIDENCE_HASH_MISMATCH"
  | "LINEAGE_MUTATION_BLOCKED"
  | "LINEAGE_MUTATION_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "WORKFLOW_ROUTING_BLOCKED"
  | "WORKFLOW_ROUTING_DETECTED"
  | "RECOMMENDATION_GENERATION_BLOCKED"
  | "RECOMMENDATION_GENERATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "RECONSTRUCTION_DEPTH_VALID"
  | "RECONSTRUCTION_DEPTH_EXCEEDED"
  | "LINEAGE_REFERENCE_LIMIT_VALID"
  | "LINEAGE_REFERENCE_LIMIT_EXCEEDED"
  | "ANCESTRY_CHAIN_LIMIT_VALID"
  | "ANCESTRY_CHAIN_LIMIT_EXCEEDED"
  | "LINEAGE_RECONSTRUCTION_IS_NOT_ENGINE";

export type ReconstructedLineageNode = Readonly<{
  recommendationId: string;
  graphId: string;
  tenantId: string;
  lineageReference: string;
  ancestryOrder: number;
  immutableHash: string;
}>;

export type LineageReconstructionEvidencePath = Readonly<{
  context: LineageReconstructionContext;
  evidenceIds: readonly string[];
  evidenceHashes: readonly string[];
  lineageReferences: readonly string[];
}>;

export type LineageReconstructionInput = Readonly<{
  request: LineageReconstructionRequest;
  ledger: SealedRecommendationLedgerRecord;
  graph: SealedDecisionGraphRecord;
  verification: SealedGraphIntegrityVerificationRecord;
  certification: SealedDecisionGraphCertificationRecord;
  escalationCertification: SealedEscalationCertificationRecord;
  lineageMutationDetected?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  recommendationGenerationRequested?: boolean;
  authorityExpansionRequested?: boolean;
}>;

export type LineageReconstructionValidation = Readonly<{
  valid: boolean;
  reconstructionState: LineageReconstructionResult["reconstructionState"];
  reasonCodes: readonly LineageReconstructionReasonCode[];
  lineageIntegrity: boolean;
  ancestryRebuilt: boolean;
  replayable: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: true;
  ancestryNodeCount: number;
}>;

export type LineageReconstructionObservability = Readonly<{
  recommendationId: string;
  reconstructionState: LineageReconstructionResult["reconstructionState"];
  lineageIntegrity: boolean;
  ancestryRebuilt: boolean;
  reconstructionHash: string;
  lineageHash: string;
}>;

export type SealedLineageReconstructionRecord = Readonly<{
  result: Readonly<LineageReconstructionResult>;
  ancestryChain: readonly ReconstructedLineageNode[];
  evidencePath: LineageReconstructionEvidencePath;
  validation: LineageReconstructionValidation;
  observability: LineageReconstructionObservability;
  sealed: true;
  readOnly: true;
  reconstructionOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  recommendationGenerationAllowed: false;
  authorityMutationAllowed: false;
  lineageMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export interface RecommendationHistoryVerificationRequest {
  recommendationId: string;
  tenantId: string;
  verificationContext:
    | "OWNERSHIP"
    | "LINEAGE"
    | "REPLAY"
    | "LEDGER"
    | "FULL";
  lineageReferences: string[];
  graphVersion: string;
}

export interface RecommendationHistoryVerificationResult {
  recommendationId: string;
  verificationState:
    | "VERIFIED"
    | "LIMITED"
    | "INVALID";
  historyIntegrity: boolean;
  lineageIntegrity: boolean;
  replayConsistency: boolean;
  ownershipVerified: boolean;
  tenantIsolationVerified: boolean;
  verificationHash: string;
  deterministic: boolean;
}

export type RecommendationHistoryVerificationContext = RecommendationHistoryVerificationRequest["verificationContext"];

export type RecommendationHistoryVerificationReasonCode =
  | "LEDGER_REQUIRED"
  | "LEDGER_UNSEALED"
  | "LINEAGE_REQUIRED"
  | "LINEAGE_UNSEALED"
  | "GRAPH_REQUIRED"
  | "GRAPH_UNSEALED"
  | "VERIFICATION_REQUIRED"
  | "VERIFICATION_UNSEALED"
  | "CERTIFICATION_REQUIRED"
  | "CERTIFICATION_UNSEALED"
  | "ESCALATION_REQUIRED"
  | "ESCALATION_UNSEALED"
  | "VERIFICATION_CONTEXT_VALID"
  | "VERIFICATION_CONTEXT_INVALID"
  | "RECOMMENDATION_ID_PRESENT"
  | "RECOMMENDATION_ID_MISSING"
  | "RECOMMENDATION_NODE_PRESENT"
  | "RECOMMENDATION_NODE_MISSING"
  | "RECOMMENDATION_NODE_TYPE_VALID"
  | "RECOMMENDATION_NODE_TYPE_INVALID"
  | "GRAPH_ID_MATCHED"
  | "GRAPH_ID_MISMATCH"
  | "GRAPH_VERSION_MATCHED"
  | "GRAPH_VERSION_MISMATCH"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_ARTIFACTS_BLOCKED"
  | "OWNERSHIP_VALID"
  | "OWNERSHIP_MISMATCH"
  | "LINEAGE_REFERENCES_PRESENT"
  | "LINEAGE_REFERENCES_MISSING"
  | "LINEAGE_CONTINUITY_VALID"
  | "LINEAGE_CORRUPTION_DETECTED"
  | "LEDGER_INTEGRITY_VALID"
  | "LEDGER_CORRUPTION_DETECTED"
  | "HISTORY_REFERENCES_PRESENT"
  | "HISTORY_REFERENCES_MISSING"
  | "HISTORY_COMPLETENESS_VALID"
  | "HISTORY_COMPLETENESS_FAILED"
  | "REPLAY_CONSISTENCY_VALID"
  | "REPLAY_MISMATCH_DETECTED"
  | "EVIDENCE_HASH_VERIFIED"
  | "EVIDENCE_HASH_MISMATCH"
  | "VERIFICATION_MUTATION_BLOCKED"
  | "VERIFICATION_MUTATION_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "WORKFLOW_ROUTING_BLOCKED"
  | "WORKFLOW_ROUTING_DETECTED"
  | "RECOMMENDATION_GENERATION_BLOCKED"
  | "RECOMMENDATION_GENERATION_DETECTED"
  | "REPAIR_BLOCKED"
  | "REPAIR_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "VERIFICATION_DEPTH_VALID"
  | "VERIFICATION_DEPTH_EXCEEDED"
  | "HISTORY_REFERENCE_LIMIT_VALID"
  | "HISTORY_REFERENCE_LIMIT_EXCEEDED"
  | "LINEAGE_REFERENCE_LIMIT_VALID"
  | "LINEAGE_REFERENCE_LIMIT_EXCEEDED"
  | "RECOMMENDATION_HISTORY_VERIFICATION_IS_NOT_ENGINE";

export type RecommendationHistoryVerificationEvidencePath = Readonly<{
  context: RecommendationHistoryVerificationContext;
  evidenceIds: readonly string[];
  evidenceHashes: readonly string[];
  lineageReferences: readonly string[];
}>;

export type RecommendationHistoryVerificationInput = Readonly<{
  request: RecommendationHistoryVerificationRequest;
  ledger: SealedRecommendationLedgerRecord;
  lineage: SealedLineageReconstructionRecord;
  escalation: SealedEscalationIntelligenceRecord;
  graph: SealedDecisionGraphRecord;
  verification: SealedGraphIntegrityVerificationRecord;
  certification: SealedDecisionGraphCertificationRecord;
  historyReferences?: readonly string[];
  verificationMutationAttempted?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  recommendationGenerationRequested?: boolean;
  repairRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type RecommendationHistoryVerificationValidation = Readonly<{
  valid: boolean;
  verificationState: RecommendationHistoryVerificationResult["verificationState"];
  reasonCodes: readonly RecommendationHistoryVerificationReasonCode[];
  historyIntegrity: boolean;
  lineageIntegrity: boolean;
  replayConsistency: boolean;
  ownershipVerified: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: true;
  historyReferenceCount: number;
}>;

export type RecommendationHistoryVerificationObservability = Readonly<{
  recommendationId: string;
  verificationState: RecommendationHistoryVerificationResult["verificationState"];
  historyIntegrity: boolean;
  lineageIntegrity: boolean;
  replayConsistency: boolean;
  verificationHash: string;
}>;

export type SealedRecommendationHistoryVerificationRecord = Readonly<{
  result: Readonly<RecommendationHistoryVerificationResult>;
  evidencePath: RecommendationHistoryVerificationEvidencePath;
  validation: RecommendationHistoryVerificationValidation;
  observability: RecommendationHistoryVerificationObservability;
  sealed: true;
  readOnly: true;
  verificationOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  recommendationGenerationAllowed: false;
  repairAuthorized: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export interface RecommendationReplayRequest {
  recommendationId: string;
  tenantId: string;
  replayContext:
    | "OWNERSHIP"
    | "LINEAGE"
    | "REPLAY"
    | "LEDGER"
    | "FULL";
  lineageReferences: string[];
  graphVersion: string;
}

export interface RecommendationReplayResult {
  recommendationId: string;
  replayState:
    | "REPLAYABLE"
    | "LIMITED"
    | "INVALID";
  replayIntegrity: boolean;
  lineageIntegrity: boolean;
  reconstructionSuccessful: boolean;
  tenantIsolationVerified: boolean;
  replayHash: string;
  reconstructionHash: string;
  deterministic: boolean;
}

export type RecommendationReplayContext = RecommendationReplayRequest["replayContext"];

export type RecommendationReplayReasonCode =
  | "LEDGER_REQUIRED"
  | "LEDGER_UNSEALED"
  | "LINEAGE_REQUIRED"
  | "LINEAGE_UNSEALED"
  | "VERIFICATION_REQUIRED"
  | "VERIFICATION_UNSEALED"
  | "ESCALATION_REQUIRED"
  | "ESCALATION_UNSEALED"
  | "GRAPH_REQUIRED"
  | "GRAPH_UNSEALED"
  | "REPLAY_CONTEXT_VALID"
  | "REPLAY_CONTEXT_INVALID"
  | "RECOMMENDATION_ID_PRESENT"
  | "RECOMMENDATION_ID_MISSING"
  | "RECOMMENDATION_NODE_PRESENT"
  | "RECOMMENDATION_NODE_MISSING"
  | "RECOMMENDATION_NODE_TYPE_VALID"
  | "RECOMMENDATION_NODE_TYPE_INVALID"
  | "GRAPH_ID_MATCHED"
  | "GRAPH_ID_MISMATCH"
  | "GRAPH_VERSION_MATCHED"
  | "GRAPH_VERSION_MISMATCH"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_ARTIFACTS_BLOCKED"
  | "OWNERSHIP_VALID"
  | "OWNERSHIP_MISMATCH"
  | "LINEAGE_REFERENCES_PRESENT"
  | "LINEAGE_REFERENCES_MISSING"
  | "LINEAGE_INTEGRITY_VALID"
  | "LINEAGE_CORRUPTION_DETECTED"
  | "REPLAY_REFERENCES_PRESENT"
  | "REPLAY_REFERENCES_MISSING"
  | "REPLAY_CHAIN_VALID"
  | "REPLAY_CHAIN_BROKEN"
  | "RECONSTRUCTION_SUCCESSFUL"
  | "RECONSTRUCTION_MISMATCH"
  | "REPLAY_INTEGRITY_VALID"
  | "REPLAY_HASH_MISMATCH"
  | "EVIDENCE_HASH_VERIFIED"
  | "EVIDENCE_HASH_MISMATCH"
  | "REPLAY_MUTATION_BLOCKED"
  | "REPLAY_MUTATION_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "WORKFLOW_ROUTING_BLOCKED"
  | "WORKFLOW_ROUTING_DETECTED"
  | "RECOMMENDATION_GENERATION_BLOCKED"
  | "RECOMMENDATION_GENERATION_DETECTED"
  | "REPAIR_BLOCKED"
  | "REPAIR_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "REPLAY_DEPTH_VALID"
  | "REPLAY_DEPTH_EXCEEDED"
  | "REPLAY_REFERENCE_LIMIT_VALID"
  | "REPLAY_REFERENCE_LIMIT_EXCEEDED"
  | "LINEAGE_REFERENCE_LIMIT_VALID"
  | "LINEAGE_REFERENCE_LIMIT_EXCEEDED"
  | "RECOMMENDATION_REPLAY_IS_NOT_ENGINE";

export type RecommendationReplayEvidencePath = Readonly<{
  context: RecommendationReplayContext;
  evidenceIds: readonly string[];
  evidenceHashes: readonly string[];
  lineageReferences: readonly string[];
}>;

export type RecommendationReplayInput = Readonly<{
  request: RecommendationReplayRequest;
  ledger: SealedRecommendationLedgerRecord;
  lineage: SealedLineageReconstructionRecord;
  verification: SealedRecommendationHistoryVerificationRecord;
  escalation: SealedEscalationIntelligenceRecord;
  graph: SealedDecisionGraphRecord;
  replayReferences?: readonly string[];
  replayMutationAttempted?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  recommendationGenerationRequested?: boolean;
  repairRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type RecommendationReplayValidation = Readonly<{
  valid: boolean;
  replayState: RecommendationReplayResult["replayState"];
  reasonCodes: readonly RecommendationReplayReasonCode[];
  replayIntegrity: boolean;
  lineageIntegrity: boolean;
  reconstructionSuccessful: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: true;
  replayReferenceCount: number;
}>;

export type RecommendationReplayObservability = Readonly<{
  recommendationId: string;
  replayState: RecommendationReplayResult["replayState"];
  replayIntegrity: boolean;
  lineageIntegrity: boolean;
  replayHash: string;
  reconstructionHash: string;
}>;

export type SealedRecommendationReplayRecord = Readonly<{
  result: Readonly<RecommendationReplayResult>;
  evidencePath: RecommendationReplayEvidencePath;
  validation: RecommendationReplayValidation;
  observability: RecommendationReplayObservability;
  sealed: true;
  readOnly: true;
  replayOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  recommendationGenerationAllowed: false;
  repairAuthorized: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export interface RecommendationIntegrityRequest {
  recommendationId: string;
  tenantId: string;
  integrityContext:
    | "OWNERSHIP"
    | "LINEAGE"
    | "REPLAY"
    | "EVIDENCE"
    | "FULL";
  lineageReferences: string[];
  graphVersion: string;
}

export interface RecommendationIntegrityResult {
  recommendationId: string;
  integrityState:
    | "HEALTHY"
    | "DEGRADED"
    | "LIMITED"
    | "INVALID";
  historyIntegrity: boolean;
  lineageIntegrity: boolean;
  replayIntegrity: boolean;
  ownershipIntegrity: boolean;
  tenantIsolationVerified: boolean;
  integrityHash: string;
  deterministic: boolean;
}

export type RecommendationIntegrityContext = RecommendationIntegrityRequest["integrityContext"];

export type RecommendationIntegrityReasonCode =
  | "LEDGER_REQUIRED"
  | "LEDGER_UNSEALED"
  | "LINEAGE_REQUIRED"
  | "LINEAGE_UNSEALED"
  | "VERIFICATION_REQUIRED"
  | "VERIFICATION_UNSEALED"
  | "REPLAY_REQUIRED"
  | "REPLAY_UNSEALED"
  | "ESCALATION_REQUIRED"
  | "ESCALATION_UNSEALED"
  | "GRAPH_REQUIRED"
  | "GRAPH_UNSEALED"
  | "INTEGRITY_CONTEXT_VALID"
  | "INTEGRITY_CONTEXT_INVALID"
  | "RECOMMENDATION_ID_PRESENT"
  | "RECOMMENDATION_ID_MISSING"
  | "RECOMMENDATION_NODE_PRESENT"
  | "RECOMMENDATION_NODE_MISSING"
  | "RECOMMENDATION_NODE_TYPE_VALID"
  | "RECOMMENDATION_NODE_TYPE_INVALID"
  | "GRAPH_ID_MATCHED"
  | "GRAPH_ID_MISMATCH"
  | "GRAPH_VERSION_MATCHED"
  | "GRAPH_VERSION_MISMATCH"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_ARTIFACTS_BLOCKED"
  | "OWNERSHIP_VALID"
  | "OWNERSHIP_MISMATCH"
  | "HISTORY_REFERENCES_PRESENT"
  | "HISTORY_REFERENCES_MISSING"
  | "HISTORY_INTEGRITY_VALID"
  | "HISTORY_CORRUPTION_DETECTED"
  | "LINEAGE_REFERENCES_PRESENT"
  | "LINEAGE_REFERENCES_MISSING"
  | "LINEAGE_INTEGRITY_VALID"
  | "LINEAGE_CORRUPTION_DETECTED"
  | "REPLAY_INTEGRITY_VALID"
  | "REPLAY_HASH_MISMATCH"
  | "EVIDENCE_CHAIN_VALID"
  | "EVIDENCE_CHAIN_BROKEN"
  | "EVIDENCE_HASH_VERIFIED"
  | "EVIDENCE_HASH_MISMATCH"
  | "INTEGRITY_MUTATION_BLOCKED"
  | "INTEGRITY_MUTATION_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "WORKFLOW_ROUTING_BLOCKED"
  | "WORKFLOW_ROUTING_DETECTED"
  | "RECOMMENDATION_GENERATION_BLOCKED"
  | "RECOMMENDATION_GENERATION_DETECTED"
  | "REPAIR_BLOCKED"
  | "REPAIR_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "INTEGRITY_DEPTH_VALID"
  | "INTEGRITY_DEPTH_EXCEEDED"
  | "HISTORY_REFERENCE_LIMIT_VALID"
  | "HISTORY_REFERENCE_LIMIT_EXCEEDED"
  | "LINEAGE_REFERENCE_LIMIT_VALID"
  | "LINEAGE_REFERENCE_LIMIT_EXCEEDED"
  | "RECOMMENDATION_INTEGRITY_IS_NOT_ENGINE";

export type RecommendationIntegrityEvidencePath = Readonly<{
  context: RecommendationIntegrityContext;
  evidenceIds: readonly string[];
  evidenceHashes: readonly string[];
  lineageReferences: readonly string[];
}>;

export type RecommendationIntegrityInput = Readonly<{
  request: RecommendationIntegrityRequest;
  ledger: SealedRecommendationLedgerRecord;
  lineage: SealedLineageReconstructionRecord;
  verification: SealedRecommendationHistoryVerificationRecord;
  replay: SealedRecommendationReplayRecord;
  escalation: SealedEscalationIntelligenceRecord;
  graph: SealedDecisionGraphRecord;
  historyReferences?: readonly string[];
  integrityMutationAttempted?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  recommendationGenerationRequested?: boolean;
  repairRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type RecommendationIntegrityValidation = Readonly<{
  valid: boolean;
  integrityState: RecommendationIntegrityResult["integrityState"];
  reasonCodes: readonly RecommendationIntegrityReasonCode[];
  historyIntegrity: boolean;
  lineageIntegrity: boolean;
  replayIntegrity: boolean;
  ownershipIntegrity: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: true;
  historyReferenceCount: number;
}>;

export type RecommendationIntegrityObservability = Readonly<{
  recommendationId: string;
  integrityState: RecommendationIntegrityResult["integrityState"];
  historyIntegrity: boolean;
  lineageIntegrity: boolean;
  replayIntegrity: boolean;
  integrityHash: string;
}>;

export type SealedRecommendationIntegrityRecord = Readonly<{
  result: Readonly<RecommendationIntegrityResult>;
  evidencePath: RecommendationIntegrityEvidencePath;
  validation: RecommendationIntegrityValidation;
  observability: RecommendationIntegrityObservability;
  sealed: true;
  readOnly: true;
  integrityOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  recommendationGenerationAllowed: false;
  repairAuthorized: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export interface RecommendationCertificationRequest {
  recommendationId: string;
  tenantId: string;
  certificationContext:
    | "OWNERSHIP"
    | "LINEAGE"
    | "REPLAY"
    | "EVIDENCE"
    | "FULL";
  lineageReferences: string[];
  graphVersion: string;
}

export interface RecommendationCertificationResult {
  recommendationId: string;
  certificationState:
    | "PASS"
    | "CONDITIONAL_PASS"
    | "FAIL";
  historyCertified: boolean;
  lineageCertified: boolean;
  replayCertified: boolean;
  ownershipCertified: boolean;
  tenantIsolationVerified: boolean;
  certificationHash: string;
  deterministic: boolean;
}

export type RecommendationCertificationContext = RecommendationCertificationRequest["certificationContext"];

export type RecommendationCertificationReasonCode =
  | "LEDGER_REQUIRED"
  | "LEDGER_UNSEALED"
  | "LINEAGE_REQUIRED"
  | "LINEAGE_UNSEALED"
  | "VERIFICATION_REQUIRED"
  | "VERIFICATION_UNSEALED"
  | "REPLAY_REQUIRED"
  | "REPLAY_UNSEALED"
  | "INTEGRITY_REQUIRED"
  | "INTEGRITY_UNSEALED"
  | "ESCALATION_REQUIRED"
  | "ESCALATION_UNSEALED"
  | "GRAPH_REQUIRED"
  | "GRAPH_UNSEALED"
  | "CERTIFICATION_CONTEXT_VALID"
  | "CERTIFICATION_CONTEXT_INVALID"
  | "RECOMMENDATION_ID_PRESENT"
  | "RECOMMENDATION_ID_MISSING"
  | "RECOMMENDATION_NODE_PRESENT"
  | "RECOMMENDATION_NODE_MISSING"
  | "RECOMMENDATION_NODE_TYPE_VALID"
  | "RECOMMENDATION_NODE_TYPE_INVALID"
  | "GRAPH_ID_MATCHED"
  | "GRAPH_ID_MISMATCH"
  | "GRAPH_VERSION_MATCHED"
  | "GRAPH_VERSION_MISMATCH"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_ARTIFACTS_BLOCKED"
  | "OWNERSHIP_VALID"
  | "OWNERSHIP_MISMATCH"
  | "HISTORY_REFERENCES_PRESENT"
  | "HISTORY_REFERENCES_MISSING"
  | "HISTORY_CERTIFIED"
  | "HISTORY_INTEGRITY_FAILED"
  | "LINEAGE_REFERENCES_PRESENT"
  | "LINEAGE_REFERENCES_MISSING"
  | "LINEAGE_CERTIFIED"
  | "LINEAGE_CORRUPTION_DETECTED"
  | "REPLAY_CERTIFIED"
  | "REPLAY_HASH_MISMATCH"
  | "EVIDENCE_CHAIN_VALID"
  | "EVIDENCE_CHAIN_BROKEN"
  | "EVIDENCE_HASH_VERIFIED"
  | "EVIDENCE_HASH_MISMATCH"
  | "CERTIFICATION_MUTATION_BLOCKED"
  | "CERTIFICATION_MUTATION_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "WORKFLOW_ROUTING_BLOCKED"
  | "WORKFLOW_ROUTING_DETECTED"
  | "RECOMMENDATION_GENERATION_BLOCKED"
  | "RECOMMENDATION_GENERATION_DETECTED"
  | "PRIORITIZATION_BLOCKED"
  | "PRIORITIZATION_DETECTED"
  | "REPAIR_BLOCKED"
  | "REPAIR_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "CERTIFICATION_DEPTH_VALID"
  | "CERTIFICATION_DEPTH_EXCEEDED"
  | "HISTORY_REFERENCE_LIMIT_VALID"
  | "HISTORY_REFERENCE_LIMIT_EXCEEDED"
  | "LINEAGE_REFERENCE_LIMIT_VALID"
  | "LINEAGE_REFERENCE_LIMIT_EXCEEDED"
  | "RECOMMENDATION_CERTIFICATION_IS_NOT_ENGINE";

export type RecommendationCertificationEvidencePath = Readonly<{
  context: RecommendationCertificationContext;
  evidenceIds: readonly string[];
  evidenceHashes: readonly string[];
  lineageReferences: readonly string[];
}>;

export type RecommendationCertificationInput = Readonly<{
  request: RecommendationCertificationRequest;
  ledger: SealedRecommendationLedgerRecord;
  lineage: SealedLineageReconstructionRecord;
  verification: SealedRecommendationHistoryVerificationRecord;
  replay: SealedRecommendationReplayRecord;
  integrity: SealedRecommendationIntegrityRecord;
  escalation: SealedEscalationIntelligenceRecord;
  graph: SealedDecisionGraphRecord;
  historyReferences?: readonly string[];
  certificationMutationAttempted?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  recommendationGenerationRequested?: boolean;
  prioritizationRequested?: boolean;
  repairRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type RecommendationCertificationValidation = Readonly<{
  valid: boolean;
  certificationState: RecommendationCertificationResult["certificationState"];
  reasonCodes: readonly RecommendationCertificationReasonCode[];
  historyCertified: boolean;
  lineageCertified: boolean;
  replayCertified: boolean;
  ownershipCertified: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: true;
  historyReferenceCount: number;
}>;

export type RecommendationCertificationObservability = Readonly<{
  recommendationId: string;
  certificationState: RecommendationCertificationResult["certificationState"];
  historyCertified: boolean;
  lineageCertified: boolean;
  replayCertified: boolean;
  certificationHash: string;
}>;

export type SealedRecommendationCertificationRecord = Readonly<{
  result: Readonly<RecommendationCertificationResult>;
  evidencePath: RecommendationCertificationEvidencePath;
  validation: RecommendationCertificationValidation;
  observability: RecommendationCertificationObservability;
  sealed: true;
  readOnly: true;
  certificationOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  recommendationGenerationAllowed: false;
  prioritizationAllowed: false;
  repairAuthorized: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export interface RecommendationObservabilityRequest {
  recommendationId: string;
  tenantId: string;
  observabilityContext:
    | "OWNERSHIP"
    | "LINEAGE"
    | "REPLAY"
    | "INTEGRITY"
    | "CERTIFICATION"
    | "FULL";
  lineageReferences: string[];
  graphVersion: string;
}

export interface RecommendationObservabilityResult {
  recommendationId: string;
  observabilityState:
    | "VISIBLE"
    | "LIMITED"
    | "ESCALATED"
    | "INVALID";
  historyVisible: boolean;
  lineageVisible: boolean;
  replayVisible: boolean;
  integrityVisible: boolean;
  certificationVisible: boolean;
  tenantIsolationVerified: boolean;
  observabilityHash: string;
  deterministic: boolean;
}

export type RecommendationObservabilityContext = RecommendationObservabilityRequest["observabilityContext"];

export type RecommendationObservabilityReasonCode =
  | "LEDGER_REQUIRED"
  | "LEDGER_UNSEALED"
  | "LINEAGE_REQUIRED"
  | "LINEAGE_UNSEALED"
  | "VERIFICATION_REQUIRED"
  | "VERIFICATION_UNSEALED"
  | "REPLAY_REQUIRED"
  | "REPLAY_UNSEALED"
  | "INTEGRITY_REQUIRED"
  | "INTEGRITY_UNSEALED"
  | "CERTIFICATION_REQUIRED"
  | "CERTIFICATION_UNSEALED"
  | "ESCALATION_REQUIRED"
  | "ESCALATION_UNSEALED"
  | "GRAPH_REQUIRED"
  | "GRAPH_UNSEALED"
  | "OBSERVABILITY_CONTEXT_VALID"
  | "OBSERVABILITY_CONTEXT_INVALID"
  | "RECOMMENDATION_ID_PRESENT"
  | "RECOMMENDATION_ID_MISSING"
  | "RECOMMENDATION_NODE_PRESENT"
  | "RECOMMENDATION_NODE_MISSING"
  | "RECOMMENDATION_NODE_TYPE_VALID"
  | "RECOMMENDATION_NODE_TYPE_INVALID"
  | "GRAPH_ID_MATCHED"
  | "GRAPH_ID_MISMATCH"
  | "GRAPH_VERSION_MATCHED"
  | "GRAPH_VERSION_MISMATCH"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_ARTIFACTS_BLOCKED"
  | "OWNERSHIP_VALID"
  | "OWNERSHIP_MISMATCH"
  | "LINEAGE_REFERENCES_PRESENT"
  | "LINEAGE_REFERENCES_MISSING"
  | "LINEAGE_VISIBLE"
  | "LINEAGE_VISIBILITY_ESCALATED"
  | "REPLAY_VISIBLE"
  | "REPLAY_VISIBILITY_LIMITED"
  | "INTEGRITY_VISIBLE"
  | "INTEGRITY_VISIBILITY_LIMITED"
  | "CERTIFICATION_VISIBLE"
  | "CERTIFICATION_VISIBILITY_LIMITED"
  | "HISTORY_VISIBLE"
  | "HISTORY_VISIBILITY_LIMITED"
  | "EVIDENCE_HASH_VERIFIED"
  | "EVIDENCE_HASH_MISMATCH"
  | "OBSERVABILITY_MUTATION_BLOCKED"
  | "OBSERVABILITY_MUTATION_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "WORKFLOW_ROUTING_BLOCKED"
  | "WORKFLOW_ROUTING_DETECTED"
  | "RECOMMENDATION_GENERATION_BLOCKED"
  | "RECOMMENDATION_GENERATION_DETECTED"
  | "APPROVAL_CREATION_BLOCKED"
  | "APPROVAL_CREATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "OBSERVABILITY_DEPTH_VALID"
  | "OBSERVABILITY_DEPTH_EXCEEDED"
  | "VISIBLE_REFERENCE_LIMIT_VALID"
  | "VISIBLE_REFERENCE_LIMIT_EXCEEDED"
  | "LINEAGE_REFERENCE_LIMIT_VALID"
  | "LINEAGE_REFERENCE_LIMIT_EXCEEDED"
  | "RECOMMENDATION_OBSERVABILITY_IS_NOT_ENGINE";

export type RecommendationObservabilityEvidencePath = Readonly<{
  context: RecommendationObservabilityContext;
  evidenceIds: readonly string[];
  evidenceHashes: readonly string[];
  lineageReferences: readonly string[];
}>;

export type RecommendationObservabilityInput = Readonly<{
  request: RecommendationObservabilityRequest;
  ledger: SealedRecommendationLedgerRecord;
  lineage: SealedLineageReconstructionRecord;
  verification: SealedRecommendationHistoryVerificationRecord;
  replay: SealedRecommendationReplayRecord;
  integrity: SealedRecommendationIntegrityRecord;
  certification: SealedRecommendationCertificationRecord;
  escalation: SealedEscalationIntelligenceRecord;
  graph: SealedDecisionGraphRecord;
  observabilityMutationAttempted?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  recommendationGenerationRequested?: boolean;
  approvalCreationRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type RecommendationObservabilityValidation = Readonly<{
  valid: boolean;
  observabilityState: RecommendationObservabilityResult["observabilityState"];
  reasonCodes: readonly RecommendationObservabilityReasonCode[];
  historyVisible: boolean;
  lineageVisible: boolean;
  replayVisible: boolean;
  integrityVisible: boolean;
  certificationVisible: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: true;
  visibleReferenceCount: number;
}>;

export type RecommendationObservabilityObservability = Readonly<{
  recommendationId: string;
  observabilityState: RecommendationObservabilityResult["observabilityState"];
  historyVisible: boolean;
  lineageVisible: boolean;
  replayVisible: boolean;
  integrityVisible: boolean;
  certificationVisible: boolean;
  observabilityHash: string;
}>;

export type SealedRecommendationObservabilityRecord = Readonly<{
  result: Readonly<RecommendationObservabilityResult>;
  evidencePath: RecommendationObservabilityEvidencePath;
  validation: RecommendationObservabilityValidation;
  observability: RecommendationObservabilityObservability;
  sealed: true;
  readOnly: true;
  visibilityOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  recommendationGenerationAllowed: false;
  approvalCreationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export interface RecommendationInspectionRequest {
  recommendationId: string;
  tenantId: string;
  inspectionScope:
    | "SUMMARY"
    | "LINEAGE"
    | "REPLAY"
    | "INTEGRITY"
    | "CERTIFICATION"
    | "FULL";
  lineageReferences: string[];
  graphVersion: string;
  apiVersion: string;
}

export interface RecommendationInspectionResult {
  recommendationId: string;
  inspectionState:
    | "AVAILABLE"
    | "LIMITED"
    | "ESCALATED"
    | "INVALID";
  visibilityScope: string[];
  replayVisible: boolean;
  lineageVisible: boolean;
  integrityVisible: boolean;
  certificationVisible: boolean;
  tenantIsolationVerified: boolean;
  inspectionHash: string;
  deterministic: boolean;
}

export type RecommendationInspectionScope = RecommendationInspectionRequest["inspectionScope"];

export type RecommendationInspectionReasonCode =
  | "OBSERVABILITY_REQUIRED"
  | "OBSERVABILITY_UNSEALED"
  | "LEDGER_REQUIRED"
  | "LEDGER_UNSEALED"
  | "LINEAGE_REQUIRED"
  | "LINEAGE_UNSEALED"
  | "VERIFICATION_REQUIRED"
  | "VERIFICATION_UNSEALED"
  | "REPLAY_REQUIRED"
  | "REPLAY_UNSEALED"
  | "INTEGRITY_REQUIRED"
  | "INTEGRITY_UNSEALED"
  | "CERTIFICATION_REQUIRED"
  | "CERTIFICATION_UNSEALED"
  | "INSPECTION_SCOPE_VALID"
  | "INSPECTION_SCOPE_INVALID"
  | "API_VERSION_VALID"
  | "API_VERSION_INVALID"
  | "RECOMMENDATION_ID_PRESENT"
  | "RECOMMENDATION_ID_MISSING"
  | "RECOMMENDATION_NODE_PRESENT"
  | "RECOMMENDATION_NODE_MISSING"
  | "RECOMMENDATION_NODE_TYPE_VALID"
  | "RECOMMENDATION_NODE_TYPE_INVALID"
  | "GRAPH_ID_MATCHED"
  | "GRAPH_ID_MISMATCH"
  | "GRAPH_VERSION_MATCHED"
  | "GRAPH_VERSION_MISMATCH"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_ACCESS_BLOCKED"
  | "OWNERSHIP_VALID"
  | "OWNERSHIP_MISMATCH"
  | "LINEAGE_REFERENCES_PRESENT"
  | "LINEAGE_REFERENCES_MISSING"
  | "SCOPE_SUMMARY_ALLOWED"
  | "SCOPE_LINEAGE_ALLOWED"
  | "SCOPE_REPLAY_ALLOWED"
  | "SCOPE_INTEGRITY_ALLOWED"
  | "SCOPE_CERTIFICATION_ALLOWED"
  | "SCOPE_VIOLATION_ESCALATED"
  | "REPLAY_VISIBLE"
  | "REPLAY_VISIBILITY_LIMITED"
  | "LINEAGE_VISIBLE"
  | "LINEAGE_VISIBILITY_ESCALATED"
  | "INTEGRITY_VISIBLE"
  | "INTEGRITY_VISIBILITY_LIMITED"
  | "CERTIFICATION_VISIBLE"
  | "CERTIFICATION_VISIBILITY_LIMITED"
  | "EVIDENCE_HASH_VERIFIED"
  | "EVIDENCE_HASH_MISMATCH"
  | "INSPECTION_MUTATION_BLOCKED"
  | "INSPECTION_MUTATION_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "WRITE_BEHAVIOR_BLOCKED"
  | "WRITE_BEHAVIOR_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "INSPECTION_DEPTH_VALID"
  | "INSPECTION_DEPTH_EXCEEDED"
  | "VISIBLE_REFERENCE_LIMIT_VALID"
  | "VISIBLE_REFERENCE_LIMIT_EXCEEDED"
  | "LINEAGE_REFERENCE_LIMIT_VALID"
  | "LINEAGE_REFERENCE_LIMIT_EXCEEDED"
  | "RECOMMENDATION_INSPECTION_IS_NOT_CONTROL";

export type RecommendationInspectionEvidencePath = Readonly<{
  scope: RecommendationInspectionScope;
  visibilityScope: readonly string[];
  evidenceIds: readonly string[];
  evidenceHashes: readonly string[];
  lineageReferences: readonly string[];
}>;

export type RecommendationInspectionInput = Readonly<{
  request: RecommendationInspectionRequest;
  observability: SealedRecommendationObservabilityRecord;
  ledger: SealedRecommendationLedgerRecord;
  lineage: SealedLineageReconstructionRecord;
  verification: SealedRecommendationHistoryVerificationRecord;
  replay: SealedRecommendationReplayRecord;
  integrity: SealedRecommendationIntegrityRecord;
  certification: SealedRecommendationCertificationRecord;
  inspectionMutationAttempted?: boolean;
  executionRequested?: boolean;
  writeRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type RecommendationInspectionValidation = Readonly<{
  valid: boolean;
  inspectionState: RecommendationInspectionResult["inspectionState"];
  reasonCodes: readonly RecommendationInspectionReasonCode[];
  visibilityScope: readonly string[];
  replayVisible: boolean;
  lineageVisible: boolean;
  integrityVisible: boolean;
  certificationVisible: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: true;
  visibleReferenceCount: number;
}>;

export type RecommendationInspectionObservability = Readonly<{
  recommendationId: string;
  inspectionState: RecommendationInspectionResult["inspectionState"];
  visibilityScope: readonly string[];
  replayVisible: boolean;
  lineageVisible: boolean;
  integrityVisible: boolean;
  certificationVisible: boolean;
  inspectionHash: string;
}>;

export type SealedRecommendationInspectionRecord = Readonly<{
  result: Readonly<RecommendationInspectionResult>;
  evidencePath: RecommendationInspectionEvidencePath;
  validation: RecommendationInspectionValidation;
  observability: RecommendationInspectionObservability;
  sealed: true;
  readOnly: true;
  inspectionOnly: true;
  executionAuthorized: false;
  writeAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export interface OperatorVisibilityRequest {
  recommendationId: string;
  tenantId: string;
  operatorRole:
    | "VIEWER"
    | "ANALYST"
    | "AUDITOR"
    | "GOVERNANCE";
  visibilityScope:
    | "SUMMARY"
    | "LINEAGE"
    | "REPLAY"
    | "INTEGRITY"
    | "CERTIFICATION"
    | "FULL";
  graphVersion: string;
}

export interface OperatorVisibilityResult {
  recommendationId: string;
  visibilityState:
    | "VISIBLE"
    | "LIMITED"
    | "ESCALATED"
    | "INVALID";
  permittedScopes: string[];
  replayVisible: boolean;
  lineageVisible: boolean;
  integrityVisible: boolean;
  certificationVisible: boolean;
  tenantIsolationVerified: boolean;
  visibilityHash: string;
  deterministic: boolean;
}

export type OperatorVisibilityRole = OperatorVisibilityRequest["operatorRole"];
export type OperatorVisibilityScope = OperatorVisibilityRequest["visibilityScope"];

export type OperatorVisibilityReasonCode =
  | "OBSERVABILITY_REQUIRED"
  | "OBSERVABILITY_UNSEALED"
  | "INSPECTION_REQUIRED"
  | "INSPECTION_UNSEALED"
  | "LEDGER_REQUIRED"
  | "LEDGER_UNSEALED"
  | "LINEAGE_REQUIRED"
  | "LINEAGE_UNSEALED"
  | "VERIFICATION_REQUIRED"
  | "VERIFICATION_UNSEALED"
  | "REPLAY_REQUIRED"
  | "REPLAY_UNSEALED"
  | "INTEGRITY_REQUIRED"
  | "INTEGRITY_UNSEALED"
  | "CERTIFICATION_REQUIRED"
  | "CERTIFICATION_UNSEALED"
  | "ROLE_VALID"
  | "ROLE_INVALID"
  | "VISIBILITY_SCOPE_VALID"
  | "VISIBILITY_SCOPE_INVALID"
  | "RECOMMENDATION_ID_PRESENT"
  | "RECOMMENDATION_ID_MISSING"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_ACCESS_BLOCKED"
  | "OWNERSHIP_VALID"
  | "OWNERSHIP_MISMATCH"
  | "VIEWER_SCOPE_ENFORCED"
  | "ANALYST_SCOPE_ENFORCED"
  | "AUDITOR_SCOPE_ENFORCED"
  | "GOVERNANCE_SCOPE_ENFORCED"
  | "ROLE_VISIBILITY_VIOLATION"
  | "SCOPE_VIOLATION_ESCALATED"
  | "REPLAY_VISIBLE"
  | "REPLAY_VISIBILITY_LIMITED"
  | "LINEAGE_VISIBLE"
  | "LINEAGE_VISIBILITY_LIMITED"
  | "INTEGRITY_VISIBLE"
  | "INTEGRITY_VISIBILITY_LIMITED"
  | "CERTIFICATION_VISIBLE"
  | "CERTIFICATION_VISIBILITY_LIMITED"
  | "EVIDENCE_HASH_VERIFIED"
  | "EVIDENCE_HASH_MISMATCH"
  | "VISIBILITY_MUTATION_BLOCKED"
  | "VISIBILITY_MUTATION_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "WORKFLOW_ROUTING_BLOCKED"
  | "WORKFLOW_ROUTING_DETECTED"
  | "RECOMMENDATION_GENERATION_BLOCKED"
  | "RECOMMENDATION_GENERATION_DETECTED"
  | "PRIORITIZATION_BLOCKED"
  | "PRIORITIZATION_DETECTED"
  | "APPROVAL_BEHAVIOR_BLOCKED"
  | "APPROVAL_BEHAVIOR_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "VISIBILITY_DEPTH_VALID"
  | "VISIBILITY_DEPTH_EXCEEDED"
  | "VISIBLE_REFERENCE_LIMIT_VALID"
  | "VISIBLE_REFERENCE_LIMIT_EXCEEDED"
  | "LINEAGE_REFERENCE_LIMIT_VALID"
  | "LINEAGE_REFERENCE_LIMIT_EXCEEDED"
  | "OPERATOR_VISIBILITY_IS_NOT_CONTROL";

export type OperatorVisibilityEvidencePath = Readonly<{
  role: OperatorVisibilityRole;
  scope: OperatorVisibilityScope;
  permittedScopes: readonly string[];
  evidenceIds: readonly string[];
  evidenceHashes: readonly string[];
  lineageReferences: readonly string[];
}>;

export type OperatorVisibilityInput = Readonly<{
  request: OperatorVisibilityRequest;
  observability: SealedRecommendationObservabilityRecord;
  inspection: SealedRecommendationInspectionRecord;
  ledger: SealedRecommendationLedgerRecord;
  lineage: SealedLineageReconstructionRecord;
  verification: SealedRecommendationHistoryVerificationRecord;
  replay: SealedRecommendationReplayRecord;
  integrity: SealedRecommendationIntegrityRecord;
  certification: SealedRecommendationCertificationRecord;
  visibilityMutationAttempted?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  recommendationGenerationRequested?: boolean;
  prioritizationRequested?: boolean;
  approvalBehaviorRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type OperatorVisibilityValidation = Readonly<{
  valid: boolean;
  visibilityState: OperatorVisibilityResult["visibilityState"];
  reasonCodes: readonly OperatorVisibilityReasonCode[];
  permittedScopes: readonly string[];
  replayVisible: boolean;
  lineageVisible: boolean;
  integrityVisible: boolean;
  certificationVisible: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: true;
  visibleReferenceCount: number;
}>;

export type OperatorVisibilityObservability = Readonly<{
  recommendationId: string;
  visibilityState: OperatorVisibilityResult["visibilityState"];
  permittedScopes: readonly string[];
  replayVisible: boolean;
  lineageVisible: boolean;
  integrityVisible: boolean;
  certificationVisible: boolean;
  visibilityHash: string;
}>;

export type SealedOperatorVisibilityRecord = Readonly<{
  result: Readonly<OperatorVisibilityResult>;
  evidencePath: OperatorVisibilityEvidencePath;
  validation: OperatorVisibilityValidation;
  observability: OperatorVisibilityObservability;
  sealed: true;
  readOnly: true;
  visibilityOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  recommendationGenerationAllowed: false;
  prioritizationAllowed: false;
  approvalBehaviorAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export interface RecommendationAuditExportRequest {
  recommendationId: string;
  tenantId: string;
  exportScope:
    | "SUMMARY"
    | "LINEAGE"
    | "REPLAY"
    | "INTEGRITY"
    | "CERTIFICATION"
    | "FULL";
  exportFormat:
    | "JSON"
    | "NDJSON"
    | "BUNDLE";
  graphVersion: string;
}

export interface RecommendationAuditExportResult {
  recommendationId: string;
  exportState:
    | "EXPORTED"
    | "LIMITED"
    | "ESCALATED"
    | "INVALID";
  exportedArtifacts: string[];
  replayIncluded: boolean;
  lineageIncluded: boolean;
  certificationIncluded: boolean;
  tenantIsolationVerified: boolean;
  exportHash: string;
  deterministic: boolean;
}

export type RecommendationAuditExportScope = RecommendationAuditExportRequest["exportScope"];
export type RecommendationAuditExportFormat = RecommendationAuditExportRequest["exportFormat"];

export type RecommendationAuditExportReasonCode =
  | "OBSERVABILITY_REQUIRED"
  | "OBSERVABILITY_UNSEALED"
  | "INSPECTION_REQUIRED"
  | "INSPECTION_UNSEALED"
  | "VISIBILITY_REQUIRED"
  | "VISIBILITY_UNSEALED"
  | "LEDGER_REQUIRED"
  | "LEDGER_UNSEALED"
  | "LINEAGE_REQUIRED"
  | "LINEAGE_UNSEALED"
  | "VERIFICATION_REQUIRED"
  | "VERIFICATION_UNSEALED"
  | "REPLAY_REQUIRED"
  | "REPLAY_UNSEALED"
  | "INTEGRITY_REQUIRED"
  | "INTEGRITY_UNSEALED"
  | "CERTIFICATION_REQUIRED"
  | "CERTIFICATION_UNSEALED"
  | "EXPORT_SCOPE_VALID"
  | "EXPORT_SCOPE_INVALID"
  | "EXPORT_FORMAT_VALID"
  | "EXPORT_FORMAT_INVALID"
  | "RECOMMENDATION_ID_PRESENT"
  | "RECOMMENDATION_ID_MISSING"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_EXPORT_BLOCKED"
  | "OWNERSHIP_VALID"
  | "OWNERSHIP_MISMATCH"
  | "SCOPE_SUMMARY_EXPORTED"
  | "SCOPE_LINEAGE_EXPORTED"
  | "SCOPE_REPLAY_EXPORTED"
  | "SCOPE_INTEGRITY_EXPORTED"
  | "SCOPE_CERTIFICATION_EXPORTED"
  | "SCOPE_FULL_EXPORTED"
  | "EXPORT_SCOPE_ESCALATED"
  | "REPLAY_INCLUDED"
  | "REPLAY_UNAVAILABLE_LIMITED"
  | "LINEAGE_INCLUDED"
  | "LINEAGE_UNAVAILABLE_LIMITED"
  | "CERTIFICATION_INCLUDED"
  | "CERTIFICATION_UNAVAILABLE_LIMITED"
  | "EVIDENCE_HASH_VERIFIED"
  | "EVIDENCE_HASH_MISMATCH"
  | "EXPORT_MUTATION_BLOCKED"
  | "EXPORT_MUTATION_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "WORKFLOW_ROUTING_BLOCKED"
  | "WORKFLOW_ROUTING_DETECTED"
  | "APPROVAL_CREATION_BLOCKED"
  | "APPROVAL_CREATION_DETECTED"
  | "REPAIR_BLOCKED"
  | "REPAIR_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "EXPORT_DEPTH_VALID"
  | "EXPORT_DEPTH_EXCEEDED"
  | "EXPORTED_REFERENCE_LIMIT_VALID"
  | "EXPORTED_REFERENCE_LIMIT_EXCEEDED"
  | "LINEAGE_REFERENCE_LIMIT_VALID"
  | "LINEAGE_REFERENCE_LIMIT_EXCEEDED"
  | "RECOMMENDATION_AUDIT_EXPORT_IS_NOT_CONTROL";

export type RecommendationAuditExportEvidencePath = Readonly<{
  scope: RecommendationAuditExportScope;
  format: RecommendationAuditExportFormat;
  exportedArtifacts: readonly string[];
  evidenceIds: readonly string[];
  evidenceHashes: readonly string[];
  lineageReferences: readonly string[];
}>;

export type RecommendationAuditExportInput = Readonly<{
  request: RecommendationAuditExportRequest;
  observability: SealedRecommendationObservabilityRecord;
  inspection: SealedRecommendationInspectionRecord;
  visibility: SealedOperatorVisibilityRecord;
  ledger: SealedRecommendationLedgerRecord;
  lineage: SealedLineageReconstructionRecord;
  verification: SealedRecommendationHistoryVerificationRecord;
  replay: SealedRecommendationReplayRecord;
  integrity: SealedRecommendationIntegrityRecord;
  certification: SealedRecommendationCertificationRecord;
  exportMutationAttempted?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  approvalCreationRequested?: boolean;
  repairRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type RecommendationAuditExportValidation = Readonly<{
  valid: boolean;
  exportState: RecommendationAuditExportResult["exportState"];
  reasonCodes: readonly RecommendationAuditExportReasonCode[];
  exportedArtifacts: readonly string[];
  replayIncluded: boolean;
  lineageIncluded: boolean;
  certificationIncluded: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: true;
  exportedReferenceCount: number;
}>;

export type RecommendationAuditExportObservability = Readonly<{
  recommendationId: string;
  exportState: RecommendationAuditExportResult["exportState"];
  exportedArtifacts: readonly string[];
  replayIncluded: boolean;
  lineageIncluded: boolean;
  certificationIncluded: boolean;
  exportHash: string;
}>;

export type SealedRecommendationAuditExportRecord = Readonly<{
  result: Readonly<RecommendationAuditExportResult>;
  evidencePath: RecommendationAuditExportEvidencePath;
  validation: RecommendationAuditExportValidation;
  observability: RecommendationAuditExportObservability;
  sealed: true;
  readOnly: true;
  exportOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  approvalCreationAllowed: false;
  repairAuthorized: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export interface RecommendationObservabilityCertificationRequest {
  recommendationId: string;
  tenantId: string;
  certificationScope:
    | "VISIBILITY"
    | "INSPECTION"
    | "AUDIT"
    | "REPLAY"
    | "FULL";
  graphVersion: string;
}

export interface RecommendationObservabilityCertificationResult {
  recommendationId: string;
  certificationState:
    | "PASS"
    | "CONDITIONAL_PASS"
    | "FAIL";
  visibilityCertified: boolean;
  inspectionCertified: boolean;
  auditCertified: boolean;
  replayCertified: boolean;
  tenantIsolationVerified: boolean;
  certificationHash: string;
  deterministic: boolean;
}

export type RecommendationObservabilityCertificationScope = RecommendationObservabilityCertificationRequest["certificationScope"];

export type RecommendationObservabilityCertificationReasonCode =
  | "OBSERVABILITY_REQUIRED"
  | "OBSERVABILITY_UNSEALED"
  | "INSPECTION_REQUIRED"
  | "INSPECTION_UNSEALED"
  | "VISIBILITY_REQUIRED"
  | "VISIBILITY_UNSEALED"
  | "AUDIT_REQUIRED"
  | "AUDIT_UNSEALED"
  | "LEDGER_REQUIRED"
  | "LEDGER_UNSEALED"
  | "LINEAGE_REQUIRED"
  | "LINEAGE_UNSEALED"
  | "VERIFICATION_REQUIRED"
  | "VERIFICATION_UNSEALED"
  | "REPLAY_REQUIRED"
  | "REPLAY_UNSEALED"
  | "INTEGRITY_REQUIRED"
  | "INTEGRITY_UNSEALED"
  | "CERTIFICATION_REQUIRED"
  | "CERTIFICATION_UNSEALED"
  | "CERTIFICATION_SCOPE_VALID"
  | "CERTIFICATION_SCOPE_INVALID"
  | "RECOMMENDATION_ID_PRESENT"
  | "RECOMMENDATION_ID_MISSING"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_CERTIFICATION_BLOCKED"
  | "OWNERSHIP_VALID"
  | "OWNERSHIP_MISMATCH"
  | "VISIBILITY_CERTIFIED"
  | "VISIBILITY_INTEGRITY_BROKEN"
  | "INSPECTION_CERTIFIED"
  | "INSPECTION_INTEGRITY_BROKEN"
  | "OPERATOR_BOUNDARY_CERTIFIED"
  | "OPERATOR_VISIBILITY_BOUNDARY_BROKEN"
  | "AUDIT_CERTIFIED"
  | "AUDIT_INTEGRITY_BROKEN"
  | "REPLAY_CERTIFIED"
  | "REPLAY_VISIBILITY_UNAVAILABLE"
  | "EVIDENCE_CHAIN_VALID"
  | "EVIDENCE_CHAIN_BROKEN"
  | "EVIDENCE_HASH_VERIFIED"
  | "EVIDENCE_HASH_MISMATCH"
  | "CERTIFICATION_MUTATION_BLOCKED"
  | "CERTIFICATION_MUTATION_DETECTED"
  | "VISIBILITY_MUTATION_BLOCKED"
  | "VISIBILITY_MUTATION_DETECTED"
  | "AUDIT_MUTATION_BLOCKED"
  | "AUDIT_MUTATION_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "WORKFLOW_ROUTING_BLOCKED"
  | "WORKFLOW_ROUTING_DETECTED"
  | "RECOMMENDATION_GENERATION_BLOCKED"
  | "RECOMMENDATION_GENERATION_DETECTED"
  | "APPROVAL_CREATION_BLOCKED"
  | "APPROVAL_CREATION_DETECTED"
  | "REPAIR_BLOCKED"
  | "REPAIR_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "CERTIFICATION_DEPTH_VALID"
  | "CERTIFICATION_DEPTH_EXCEEDED"
  | "VISIBLE_REFERENCE_LIMIT_VALID"
  | "VISIBLE_REFERENCE_LIMIT_EXCEEDED"
  | "LINEAGE_REFERENCE_LIMIT_VALID"
  | "LINEAGE_REFERENCE_LIMIT_EXCEEDED"
  | "OBSERVABILITY_CERTIFICATION_IS_NOT_CONTROL";

export type RecommendationObservabilityCertificationEvidencePath = Readonly<{
  scope: RecommendationObservabilityCertificationScope;
  evidenceIds: readonly string[];
  evidenceHashes: readonly string[];
  lineageReferences: readonly string[];
}>;

export type RecommendationObservabilityCertificationInput = Readonly<{
  request: RecommendationObservabilityCertificationRequest;
  observability: SealedRecommendationObservabilityRecord;
  inspection: SealedRecommendationInspectionRecord;
  visibility: SealedOperatorVisibilityRecord;
  audit: SealedRecommendationAuditExportRecord;
  ledger: SealedRecommendationLedgerRecord;
  lineage: SealedLineageReconstructionRecord;
  verification: SealedRecommendationHistoryVerificationRecord;
  replay: SealedRecommendationReplayRecord;
  integrity: SealedRecommendationIntegrityRecord;
  certification: SealedRecommendationCertificationRecord;
  certificationMutationAttempted?: boolean;
  visibilityMutationAttempted?: boolean;
  auditMutationAttempted?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  recommendationGenerationRequested?: boolean;
  approvalCreationRequested?: boolean;
  repairRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type RecommendationObservabilityCertificationValidation = Readonly<{
  valid: boolean;
  certificationState: RecommendationObservabilityCertificationResult["certificationState"];
  reasonCodes: readonly RecommendationObservabilityCertificationReasonCode[];
  visibilityCertified: boolean;
  inspectionCertified: boolean;
  auditCertified: boolean;
  replayCertified: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: true;
  visibleReferenceCount: number;
}>;

export type RecommendationObservabilityCertificationObservability = Readonly<{
  recommendationId: string;
  certificationState: RecommendationObservabilityCertificationResult["certificationState"];
  visibilityCertified: boolean;
  inspectionCertified: boolean;
  auditCertified: boolean;
  replayCertified: boolean;
  certificationHash: string;
}>;

export type SealedRecommendationObservabilityCertificationRecord = Readonly<{
  result: Readonly<RecommendationObservabilityCertificationResult>;
  evidencePath: RecommendationObservabilityCertificationEvidencePath;
  validation: RecommendationObservabilityCertificationValidation;
  observability: RecommendationObservabilityCertificationObservability;
  sealed: true;
  readOnly: true;
  certificationOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  recommendationGenerationAllowed: false;
  approvalCreationAllowed: false;
  repairAuthorized: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;
