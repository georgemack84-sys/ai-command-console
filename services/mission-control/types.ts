export type TruthEventType =
  | "OBSERVATION_CREATED"
  | "OBSERVATION_UPDATED"
  | "RECOMMENDATION_CREATED"
  | "RECOMMENDATION_APPROVED"
  | "RECOMMENDATION_REJECTED"
  | "GOVERNANCE_APPROVED"
  | "GOVERNANCE_DENIED"
  | "GOVERNANCE_ESCALATED"
  | "RUNTIME_STARTED"
  | "RUNTIME_STOPPED"
  | "RUNTIME_RESTRICTED"
  | "CERTIFICATION_PASSED"
  | "CERTIFICATION_FAILED"
  | "REPLAY_COMPLETED"
  | "REPLAY_FAILED"
  | "ESCALATION_OPENED"
  | "ESCALATION_CLOSED";

export type TruthEventSource =
  | "OPERATOR"
  | "MISSION_ENGINE"
  | "RUNTIME_ENGINE"
  | "GOVERNANCE_ENGINE"
  | "CERTIFICATION_ENGINE"
  | "REPLAY_ENGINE"
  | "SUPERVISION_ENGINE";

export type TruthLifecycleState =
  | "CREATED"
  | "VALIDATED"
  | "ACTIVE"
  | "SUPERSEDED"
  | "ARCHIVED"
  | "REVOKED";

export interface TruthRecord {
  truth_record_id: string;
  tenant_id: string;
  mission_id: string;
  timestamp: string;
  event_type: TruthEventType;
  event_source: TruthEventSource;
  lifecycle_state: TruthLifecycleState;
  evidence_references: readonly string[];
  replay_references: readonly string[];
}

export type TruthValidationState = "VALID" | "INVALID";

export type TruthReplayResult =
  | "REPRODUCED"
  | "MISMATCH"
  | "INCOMPLETE_EVIDENCE"
  | "UNREPLAYABLE";

export type TruthCertificationState = "PASS" | "CONDITIONAL_PASS" | "FAIL";

export type TruthRecordContractReasonCode =
  | "TRUTH_RECORD_ID_PRESENT"
  | "TRUTH_RECORD_ID_MISSING"
  | "TRUTH_RECORD_ID_UNIQUE"
  | "TRUTH_RECORD_ID_DUPLICATE"
  | "TENANT_ID_PRESENT"
  | "TENANT_ID_MISSING"
  | "TENANT_ID_KNOWN"
  | "TENANT_ID_UNKNOWN"
  | "MISSION_ID_PRESENT"
  | "MISSION_ID_MISSING"
  | "MISSION_ID_KNOWN"
  | "MISSION_ID_UNKNOWN"
  | "TIMESTAMP_PRESENT"
  | "TIMESTAMP_MISSING"
  | "TIMESTAMP_VALID"
  | "TIMESTAMP_INVALID"
  | "TIMESTAMP_WITHIN_TOLERANCE"
  | "TIMESTAMP_OUT_OF_TOLERANCE"
  | "EVENT_TYPE_VALID"
  | "EVENT_TYPE_INVALID"
  | "EVENT_SOURCE_VALID"
  | "EVENT_SOURCE_INVALID"
  | "LIFECYCLE_STATE_VALID"
  | "LIFECYCLE_STATE_INVALID"
  | "LIFECYCLE_TRANSITION_VALID"
  | "LIFECYCLE_TRANSITION_INVALID"
  | "EVIDENCE_REFERENCES_PRESENT"
  | "EVIDENCE_REFERENCES_MISSING"
  | "EVIDENCE_REFERENCES_VALID"
  | "EVIDENCE_REFERENCES_INVALID"
  | "REPLAY_REFERENCES_PRESENT"
  | "REPLAY_REFERENCES_MISSING"
  | "REPLAY_REFERENCES_VALID"
  | "REPLAY_REFERENCES_INVALID"
  | "TENANT_ISOLATION_VALID"
  | "TENANT_ISOLATION_FAILED"
  | "IMMUTABILITY_PRESERVED"
  | "IMMUTABILITY_VIOLATED"
  | "OPERATOR_VISIBILITY_AVAILABLE"
  | "OPERATOR_VISIBILITY_BLOCKED"
  | "REPLAY_REPRODUCED"
  | "REPLAY_MISMATCH"
  | "REPLAY_INCOMPLETE_EVIDENCE"
  | "REPLAY_UNREPLAYABLE"
  | "CERTIFICATION_PASS"
  | "CERTIFICATION_CONDITIONAL_PASS"
  | "CERTIFICATION_FAIL"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "APPROVAL_ABSENT"
  | "APPROVAL_DETECTED"
  | "RANKING_ABSENT"
  | "RANKING_DETECTED"
  | "PRIORITIZATION_ABSENT"
  | "PRIORITIZATION_DETECTED"
  | "SCORING_ABSENT"
  | "SCORING_DETECTED"
  | "RESOURCE_ALLOCATION_ABSENT"
  | "RESOURCE_ALLOCATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "TRUTH_RECORD_CONTRACT_IS_NOT_CONTROL";

export interface TruthCatalogReference {
  referenceId: string;
  tenantId: string;
  immutable: boolean;
  accessible: boolean;
  auditable: boolean;
  deterministic?: boolean;
  resolvable?: boolean;
}

export interface TruthRecordContractRequest {
  tenant_id: string;
  mission_id: string;
  now: string;
}

export type TruthRecordContractInput = Readonly<{
  request: TruthRecordContractRequest;
  record: TruthRecord;
  knownTenantIds: readonly string[];
  knownMissionIds: readonly string[];
  existingTruthRecordIds?: readonly string[];
  priorLifecycleState?: TruthLifecycleState | null;
  immutableBaseline?: Partial<TruthRecord> | null;
  evidenceCatalog: readonly TruthCatalogReference[];
  replayCatalog: readonly TruthCatalogReference[];
  accessTenantId?: string;
  executionRequested?: boolean;
  approvalRequested?: boolean;
  rankingRequested?: boolean;
  prioritizationRequested?: boolean;
  scoringRequested?: boolean;
  resourceAllocationRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type TruthRecordOperatorVisibility = Readonly<{
  truth_record_id: string;
  tenant_id: string;
  mission_id: string;
  timestamp: string;
  event_type: TruthEventType;
  event_source: TruthEventSource;
  lifecycle_state: TruthLifecycleState;
  evidence_references: readonly string[];
  replay_references: readonly string[];
  validation_status: TruthValidationState;
  readOnly: true;
  auditable: true;
  tenantScoped: boolean;
  replayLinked: boolean;
}>;

export type TruthRecordObservabilityMetrics = Readonly<{
  truth_records_created: number;
  truth_records_validated: number;
  truth_records_active: number;
  truth_records_superseded: number;
  truth_records_archived: number;
  truth_records_revoked: number;
  validation_failures: number;
  evidence_failures: number;
  replay_failures: number;
  tenant_isolation_failures: number;
  immutability_violations: number;
}>;

export type TruthRecordReplay = Readonly<{
  replayResult: TruthReplayResult;
  reconstructedRecord: TruthRecord;
}>;

export type TruthRecordCertification = Readonly<{
  certificationState: TruthCertificationState;
  completionReady: boolean;
  lifecycleDeterministic: boolean;
  evidenceBound: boolean;
  replayBound: boolean;
  tenantIsolationCertified: boolean;
  operatorVisibilityCertified: boolean;
}>;

export type TruthRecordContractValidation = Readonly<{
  valid: boolean;
  validationState: TruthValidationState;
  reasonCodes: readonly TruthRecordContractReasonCode[];
  tenantIsolationValid: boolean;
  immutabilityPreserved: boolean;
  evidenceValid: boolean;
  replayValid: boolean;
  lifecycleValid: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  approvalAbsent: boolean;
  rankingAbsent: boolean;
  prioritizationAbsent: boolean;
  scoringAbsent: boolean;
  resourceAllocationAbsent: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
}>;

export type SealedTruthRecordContract = Readonly<{
  request: TruthRecordContractRequest;
  record: TruthRecord;
  validation: TruthRecordContractValidation;
  replay: TruthRecordReplay;
  operatorVisibility: TruthRecordOperatorVisibility;
  observability: TruthRecordObservabilityMetrics;
  certification: TruthRecordCertification;
  sealed: true;
  readOnly: true;
  executionAuthorized: false;
  approvalAllowed: false;
  rankingAllowed: false;
  prioritizationAllowed: false;
  scoringAllowed: false;
  resourceAllocationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export type TruthClassificationType =
  | "INPUT"
  | "OUTPUT"
  | "DECISION"
  | "RECOMMENDATION"
  | "RISK"
  | "CONFIDENCE"
  | "VIOLATION"
  | "GOVERNANCE"
  | "ESCALATION"
  | "RUNTIME";

export type TruthClassificationSource =
  | "ASSIGNMENT_ENGINE"
  | "OPERATOR"
  | "GOVERNANCE_ENGINE"
  | "CERTIFICATION_ENGINE"
  | "REPLAY_ENGINE";

export type TruthClassificationState =
  | "ASSIGNED"
  | "VALIDATED"
  | "ACTIVE"
  | "SUPERSEDED"
  | "REVOKED";

export type TruthRiskSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type TruthConfidenceLevel = "VERY_LOW" | "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";
export type TruthViolationSeverity = "MINOR" | "MAJOR" | "CRITICAL";
export type TruthEscalationState = "OPEN" | "ACKNOWLEDGED" | "IN_REVIEW" | "RESOLVED" | "CLOSED";
export type TruthRuntimeState = "ACTIVE" | "RESTRICTED" | "SUSPENDED" | "RECOVERING" | "TERMINATED";

export interface TruthClassification {
  classification_id: string;
  truth_record_id: string;
  classification_type: TruthClassificationType;
  classification_source: TruthClassificationSource;
  classification_timestamp: string;
  classification_version: string;
  classification_confidence: number;
  classification_state: TruthClassificationState;
  evidence_references: readonly string[];
  lineage_references: readonly string[];
  details: Readonly<Record<string, string | number | boolean>>;
}

export type TruthClassificationValidationState = "VALID" | "INVALID";

export type TruthClassificationAssignmentReasonCode =
  | "CLASSIFICATION_PRESENT"
  | "CLASSIFICATION_MISSING"
  | "CLASSIFICATION_SUPPORTED"
  | "CLASSIFICATION_UNSUPPORTED"
  | "TRUTH_RECORD_ID_PRESENT"
  | "TRUTH_RECORD_ID_MISSING"
  | "CLASSIFICATION_SOURCE_VALID"
  | "CLASSIFICATION_SOURCE_INVALID"
  | "CLASSIFICATION_TIMESTAMP_VALID"
  | "CLASSIFICATION_TIMESTAMP_INVALID"
  | "CLASSIFICATION_VERSION_PRESENT"
  | "CLASSIFICATION_VERSION_MISSING"
  | "CLASSIFICATION_CONFIDENCE_VALID"
  | "CLASSIFICATION_CONFIDENCE_INVALID"
  | "CLASSIFICATION_STATE_VALID"
  | "CLASSIFICATION_STATE_INVALID"
  | "CLASSIFICATION_EVIDENCE_PRESENT"
  | "CLASSIFICATION_EVIDENCE_MISSING"
  | "CLASSIFICATION_EVIDENCE_VALID"
  | "CLASSIFICATION_EVIDENCE_INVALID"
  | "CLASSIFICATION_REPLAY_VALID"
  | "CLASSIFICATION_REPLAY_INVALID"
  | "CLASSIFICATION_LINEAGE_VALID"
  | "CLASSIFICATION_LINEAGE_INVALID"
  | "TENANT_ISOLATION_VALID"
  | "TENANT_ISOLATION_FAILED"
  | "ASSIGNMENT_DETERMINISTIC"
  | "ASSIGNMENT_INVALID"
  | "INPUT_SOURCE_VALID"
  | "INPUT_SOURCE_INVALID"
  | "OUTPUT_ORIGIN_PRESENT"
  | "OUTPUT_ORIGIN_MISSING"
  | "DECISION_AUTHORITY_PRESENT"
  | "DECISION_AUTHORITY_MISSING"
  | "DECISION_RATIONALE_PRESENT"
  | "DECISION_RATIONALE_MISSING"
  | "RECOMMENDATION_ACTION_PRESENT"
  | "RECOMMENDATION_ACTION_MISSING"
  | "RISK_SEVERITY_VALID"
  | "RISK_SEVERITY_INVALID"
  | "CONFIDENCE_RATIONALE_PRESENT"
  | "CONFIDENCE_RATIONALE_MISSING"
  | "VIOLATION_RULE_PRESENT"
  | "VIOLATION_RULE_MISSING"
  | "GOVERNANCE_AUTHORITY_PRESENT"
  | "GOVERNANCE_AUTHORITY_MISSING"
  | "GOVERNANCE_ACTION_PRESENT"
  | "GOVERNANCE_ACTION_MISSING"
  | "ESCALATION_TARGET_PRESENT"
  | "ESCALATION_TARGET_MISSING"
  | "ESCALATION_REASON_PRESENT"
  | "ESCALATION_REASON_MISSING"
  | "RUNTIME_STATE_VALID"
  | "RUNTIME_STATE_INVALID"
  | "RUNTIME_RATIONALE_PRESENT"
  | "RUNTIME_RATIONALE_MISSING"
  | "REPLAY_REPRODUCED"
  | "REPLAY_MISMATCH"
  | "REPLAY_INCOMPLETE_EVIDENCE"
  | "REPLAY_UNREPLAYABLE"
  | "CERTIFICATION_PASS"
  | "CERTIFICATION_CONDITIONAL_PASS"
  | "CERTIFICATION_FAIL"
  | "OPERATOR_VISIBILITY_AVAILABLE"
  | "OPERATOR_VISIBILITY_BLOCKED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "APPROVAL_ABSENT"
  | "APPROVAL_DETECTED"
  | "RANKING_ABSENT"
  | "RANKING_DETECTED"
  | "PRIORITIZATION_ABSENT"
  | "PRIORITIZATION_DETECTED"
  | "SCORING_ABSENT"
  | "SCORING_DETECTED"
  | "RESOURCE_ALLOCATION_ABSENT"
  | "RESOURCE_ALLOCATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "TRUTH_CLASSIFICATION_SYSTEM_IS_NOT_CONTROL";

export interface TruthClassificationSystemRequest {
  tenant_id: string;
  now: string;
}

export type TruthClassificationSystemInput = Readonly<{
  request: TruthClassificationSystemRequest;
  truthRecord: SealedTruthRecordContract;
  requestedClassifications?: readonly TruthClassificationType[];
  classificationTimestamp?: string;
  classificationVersion?: string;
  classificationSource?: TruthClassificationSource;
  classificationConfidence?: number;
  evidenceCatalog: readonly TruthCatalogReference[];
  replayCatalog: readonly TruthCatalogReference[];
  lineageCatalog?: readonly TruthCatalogReference[];
  details?: Readonly<Record<string, string | number | boolean>>;
  parentClassificationIds?: readonly string[];
  accessTenantId?: string;
  executionRequested?: boolean;
  approvalRequested?: boolean;
  rankingRequested?: boolean;
  prioritizationRequested?: boolean;
  scoringRequested?: boolean;
  resourceAllocationRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type TruthClassificationReplay = Readonly<{
  replayResult: TruthReplayResult;
  reconstructedClassifications: readonly TruthClassification[];
}>;

export type TruthClassificationOperatorVisibility = Readonly<{
  truth_record_id: string;
  classification_type: TruthClassificationType;
  classification_state: TruthClassificationState;
  classification_source: TruthClassificationSource;
  classification_timestamp: string;
  classification_confidence: number;
  evidence_references: readonly string[];
  lineage_references: readonly string[];
  validation_status: TruthClassificationValidationState;
  readOnly: true;
  auditable: true;
  replayLinked: true;
  tenantScoped: boolean;
}>;

export type TruthClassificationObservabilityMetrics = Readonly<{
  classification_assignments_total: number;
  input_classifications_total: number;
  output_classifications_total: number;
  decision_classifications_total: number;
  recommendation_classifications_total: number;
  risk_classifications_total: number;
  confidence_classifications_total: number;
  violation_classifications_total: number;
  governance_classifications_total: number;
  escalation_classifications_total: number;
  runtime_classifications_total: number;
  classification_validation_failures: number;
  classification_replay_failures: number;
  classification_lineage_failures: number;
  tenant_isolation_failures: number;
}>;

export type TruthClassificationCertification = Readonly<{
  certificationState: TruthCertificationState;
  assignmentDeterministic: boolean;
  validationOperational: boolean;
  lineageOperational: boolean;
  evidenceBindingOperational: boolean;
  replayOperational: boolean;
  tenantIsolationCertified: boolean;
  operatorVisibilityCertified: boolean;
  observabilityOperational: boolean;
}>;

export type TruthClassificationSystemValidation = Readonly<{
  valid: boolean;
  validationState: TruthClassificationValidationState;
  reasonCodes: readonly TruthClassificationAssignmentReasonCode[];
  tenantIsolationValid: boolean;
  evidenceValid: boolean;
  replayValid: boolean;
  lineageValid: boolean;
  assignmentDeterministic: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  approvalAbsent: boolean;
  rankingAbsent: boolean;
  prioritizationAbsent: boolean;
  scoringAbsent: boolean;
  resourceAllocationAbsent: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
}>;

export type SealedTruthClassificationSystem = Readonly<{
  request: TruthClassificationSystemRequest;
  truthRecordId: string;
  classifications: readonly TruthClassification[];
  validation: TruthClassificationSystemValidation;
  replay: TruthClassificationReplay;
  operatorVisibility: readonly TruthClassificationOperatorVisibility[];
  observability: TruthClassificationObservabilityMetrics;
  certification: TruthClassificationCertification;
  sealed: true;
  readOnly: true;
  executionAuthorized: false;
  approvalAllowed: false;
  rankingAllowed: false;
  prioritizationAllowed: false;
  scoringAllowed: false;
  resourceAllocationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export type TruthParentRelationshipType =
  | "DERIVED_FROM"
  | "INFLUENCED_BY"
  | "APPROVED_BY"
  | "RECOMMENDED_BY"
  | "CERTIFIED_BY"
  | "ESCALATED_BY"
  | "GENERATED_BY";

export type TruthChildRelationshipType =
  | "CREATED"
  | "DERIVED"
  | "AUTHORIZED"
  | "ESCALATED"
  | "CERTIFIED"
  | "RESTRICTED"
  | "GENERATED";

export type TruthIdentityState =
  | "CREATED"
  | "VALIDATED"
  | "ACTIVE"
  | "SUPERSEDED"
  | "REVOKED";

export interface TruthIdentityNodeReference {
  truth_record_id: string;
  tenant_id: string;
  lineage_root_id: string;
  parent_truth_ids: readonly string[];
  child_truth_ids: readonly string[];
  immutable: boolean;
  accessible: boolean;
  auditable: boolean;
  replayable: boolean;
}

export interface TruthIdentity {
  truth_record_id: string;
  lineage_root_id: string;
  parent_truth_ids: readonly string[];
  child_truth_ids: readonly string[];
  identity_version: string;
  identity_state: TruthIdentityState;
  created_timestamp: string;
  root_creation_timestamp: string;
  root_event_type: TruthEventType;
  root_source: TruthEventSource;
  parent_relationship_type: TruthParentRelationshipType;
  child_relationship_type: TruthChildRelationshipType;
  parent_count: number;
  child_count: number;
  ancestor_truth_ids: readonly string[];
  descendant_truth_ids: readonly string[];
  ancestor_count: number;
  descendant_count: number;
}

export type TruthIdentityValidationState = "VALID" | "INVALID";

export type TruthIdentityReasonCode =
  | "IDENTITY_PRESENT"
  | "IDENTITY_MISSING"
  | "IDENTITY_UNIQUE"
  | "IDENTITY_DUPLICATE"
  | "IDENTITY_IMMUTABLE"
  | "IDENTITY_MUTATION_DETECTED"
  | "IDENTITY_REUSE_BLOCKED"
  | "IDENTITY_OVERWRITE_BLOCKED"
  | "LINEAGE_ROOT_PRESENT"
  | "LINEAGE_ROOT_MISSING"
  | "LINEAGE_ROOT_UNIQUE"
  | "LINEAGE_ROOT_MULTIPLE"
  | "LINEAGE_ROOT_IMMUTABLE"
  | "LINEAGE_ROOT_MUTATION_DETECTED"
  | "PARENT_RELATIONSHIPS_VALID"
  | "PARENT_RELATIONSHIPS_INVALID"
  | "CHILD_RELATIONSHIPS_VALID"
  | "CHILD_RELATIONSHIPS_INVALID"
  | "PARENT_REFERENCES_KNOWN"
  | "PARENT_REFERENCES_UNKNOWN"
  | "CHILD_REFERENCES_KNOWN"
  | "CHILD_REFERENCES_UNKNOWN"
  | "PARENT_TENANT_ISOLATION_VALID"
  | "PARENT_TENANT_ISOLATION_FAILED"
  | "CHILD_TENANT_ISOLATION_VALID"
  | "CHILD_TENANT_ISOLATION_FAILED"
  | "GENEALOGY_VALID"
  | "GENEALOGY_INVALID"
  | "ANCESTORS_REACHABLE"
  | "ANCESTORS_UNREACHABLE"
  | "DESCENDANTS_REACHABLE"
  | "DESCENDANTS_ORPHANED"
  | "RELATIONSHIP_INTEGRITY_VALID"
  | "RELATIONSHIP_INTEGRITY_INVALID"
  | "CYCLE_NOT_DETECTED"
  | "CYCLE_DETECTED"
  | "TENANT_ISOLATION_VALID"
  | "TENANT_ISOLATION_FAILED"
  | "REPLAY_REPRODUCED"
  | "REPLAY_MISMATCH"
  | "REPLAY_INCOMPLETE_EVIDENCE"
  | "REPLAY_UNREPLAYABLE"
  | "OPERATOR_VISIBILITY_AVAILABLE"
  | "OPERATOR_VISIBILITY_BLOCKED"
  | "ANALYTICS_OPERATIONAL"
  | "ANALYTICS_FAILED"
  | "CERTIFICATION_PASS"
  | "CERTIFICATION_CONDITIONAL_PASS"
  | "CERTIFICATION_FAIL"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "APPROVAL_ABSENT"
  | "APPROVAL_DETECTED"
  | "RANKING_ABSENT"
  | "RANKING_DETECTED"
  | "PRIORITIZATION_ABSENT"
  | "PRIORITIZATION_DETECTED"
  | "SCORING_ABSENT"
  | "SCORING_DETECTED"
  | "RESOURCE_ALLOCATION_ABSENT"
  | "RESOURCE_ALLOCATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "TRUTH_IDENTITY_FRAMEWORK_IS_NOT_CONTROL";

export interface TruthIdentityFrameworkRequest {
  tenant_id: string;
  now: string;
}

export type TruthIdentityFrameworkInput = Readonly<{
  request: TruthIdentityFrameworkRequest;
  truthRecord: SealedTruthRecordContract;
  existingTruthRecordIds?: readonly string[];
  historicalTruthRecordIds?: readonly string[];
  lineageRootId?: string;
  parentTruthIds?: readonly string[];
  childTruthIds?: readonly string[];
  identityVersion?: string;
  identityState?: TruthIdentityState;
  createdTimestamp?: string;
  rootCreationTimestamp?: string;
  rootEventType?: TruthEventType;
  rootSource?: TruthEventSource;
  parentRelationshipType?: TruthParentRelationshipType;
  childRelationshipType?: TruthChildRelationshipType;
  identityCatalog: readonly TruthIdentityNodeReference[];
  accessTenantId?: string;
  executionRequested?: boolean;
  approvalRequested?: boolean;
  rankingRequested?: boolean;
  prioritizationRequested?: boolean;
  scoringRequested?: boolean;
  resourceAllocationRequested?: boolean;
  authorityExpansionDetected?: boolean;
  immutableBaseline?: Partial<TruthIdentity> | null;
}>;

export type TruthIdentityReplay = Readonly<{
  replayResult: TruthReplayResult;
  reconstructedIdentity: TruthIdentity;
}>;

export type TruthIdentityOperatorVisibility = Readonly<{
  truth_record_id: string;
  lineage_root_id: string;
  parent_truth_ids: readonly string[];
  child_truth_ids: readonly string[];
  ancestor_count: number;
  descendant_count: number;
  identity_state: TruthIdentityState;
  identity_version: string;
  validation_status: TruthIdentityValidationState;
  readOnly: true;
  tenantScoped: boolean;
  auditable: true;
  replayLinked: true;
}>;

export type TruthIdentityAnalytics = Readonly<{
  total_truth_records: number;
  total_lineages: number;
  average_lineage_depth: number;
  largest_lineage: number;
  orphaned_truth_records: number;
  lineage_validation_failures: number;
  identity_collisions: number;
  cycle_detection_failures: number;
  relationship_integrity_failures: number;
  genealogy_reconstruction_failures: number;
}>;

export type TruthIdentityCertification = Readonly<{
  certificationState: TruthCertificationState;
  uniquenessEnforced: boolean;
  lineageRootsValid: boolean;
  parentRelationshipsValid: boolean;
  childRelationshipsValid: boolean;
  genealogyIntact: boolean;
  relationshipIntegrityMaintained: boolean;
  replayReproducible: boolean;
  tenantIsolationCertified: boolean;
  operatorVisibilityCertified: boolean;
  analyticsOperational: boolean;
  failClosedVerified: boolean;
}>;

export type TruthIdentityFrameworkValidation = Readonly<{
  valid: boolean;
  validationState: TruthIdentityValidationState;
  reasonCodes: readonly TruthIdentityReasonCode[];
  uniquenessValid: boolean;
  lineageRootValid: boolean;
  parentRelationshipsValid: boolean;
  childRelationshipsValid: boolean;
  genealogyValid: boolean;
  relationshipIntegrityValid: boolean;
  cycleFree: boolean;
  tenantIsolationValid: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  approvalAbsent: boolean;
  rankingAbsent: boolean;
  prioritizationAbsent: boolean;
  scoringAbsent: boolean;
  resourceAllocationAbsent: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
}>;

export type SealedTruthIdentityFramework = Readonly<{
  request: TruthIdentityFrameworkRequest;
  identity: TruthIdentity;
  validation: TruthIdentityFrameworkValidation;
  replay: TruthIdentityReplay;
  operatorVisibility: TruthIdentityOperatorVisibility;
  analytics: TruthIdentityAnalytics;
  certification: TruthIdentityCertification;
  sealed: true;
  readOnly: true;
  executionAuthorized: false;
  approvalAllowed: false;
  rankingAllowed: false;
  prioritizationAllowed: false;
  scoringAllowed: false;
  resourceAllocationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export type TruthStateLifecycle =
  | "CREATED"
  | "VERIFIED"
  | "SUPERSEDED"
  | "RESTRICTED"
  | "ARCHIVED";

export type TruthStateAuthoritySource =
  | "OPERATOR"
  | "GOVERNANCE_ENGINE"
  | "CERTIFICATION_ENGINE"
  | "SUPERVISION_ENGINE";

export interface TruthStateModel {
  truth_record_id: string;
  current_state: TruthStateLifecycle;
  previous_state: TruthStateLifecycle | null;
  state_timestamp: string;
  state_reason: string;
  state_source: TruthStateAuthoritySource;
  state_version: string;
  replacement_truth_record_id?: string;
  supersession_reason?: string;
  supersession_timestamp?: string;
  restriction_reason?: string;
  restriction_authority?: TruthStateAuthoritySource;
  restriction_scope?: string;
  restriction_timestamp?: string;
}

export type TruthStateValidationState = "VALID" | "INVALID";

export type TruthStateReasonCode =
  | "STATE_PRESENT"
  | "STATE_MISSING"
  | "STATE_SUPPORTED"
  | "STATE_UNSUPPORTED"
  | "PREVIOUS_STATE_VALID"
  | "PREVIOUS_STATE_INVALID"
  | "TRANSITION_LEGAL"
  | "TRANSITION_ILLEGAL"
  | "STATE_AUTHORITY_PRESENT"
  | "STATE_AUTHORITY_MISSING"
  | "STATE_AUTHORITY_VALID"
  | "STATE_AUTHORITY_INVALID"
  | "STATE_EVIDENCE_PRESENT"
  | "STATE_EVIDENCE_MISSING"
  | "SUPERSESSION_TARGET_PRESENT"
  | "SUPERSESSION_TARGET_MISSING"
  | "RESTRICTION_AUTHORITY_PRESENT"
  | "RESTRICTION_AUTHORITY_MISSING"
  | "RESTRICTION_REASON_PRESENT"
  | "RESTRICTION_REASON_MISSING"
  | "ARCHIVE_MUTATION_BLOCKED"
  | "ARCHIVE_MUTATION_DETECTED"
  | "TENANT_ISOLATION_VALID"
  | "TENANT_ISOLATION_FAILED"
  | "REPLAY_REPRODUCED"
  | "REPLAY_MISMATCH"
  | "REPLAY_INCOMPLETE_EVIDENCE"
  | "REPLAY_UNREPLAYABLE"
  | "OPERATOR_VISIBILITY_AVAILABLE"
  | "OPERATOR_VISIBILITY_BLOCKED"
  | "ANALYTICS_OPERATIONAL"
  | "ANALYTICS_FAILED"
  | "CERTIFICATION_PASS"
  | "CERTIFICATION_CONDITIONAL_PASS"
  | "CERTIFICATION_FAIL"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "APPROVAL_ABSENT"
  | "APPROVAL_DETECTED"
  | "RANKING_ABSENT"
  | "RANKING_DETECTED"
  | "PRIORITIZATION_ABSENT"
  | "PRIORITIZATION_DETECTED"
  | "SCORING_ABSENT"
  | "SCORING_DETECTED"
  | "RESOURCE_ALLOCATION_ABSENT"
  | "RESOURCE_ALLOCATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "TRUTH_STATE_MODEL_IS_NOT_CONTROL";

export interface TruthStateFrameworkRequest {
  tenant_id: string;
  now: string;
}

export type TruthStateFrameworkInput = Readonly<{
  request: TruthStateFrameworkRequest;
  truthRecord: SealedTruthRecordContract;
  currentState: TruthStateLifecycle;
  previousState?: TruthStateLifecycle | null;
  stateTimestamp?: string;
  stateReason: string;
  stateSource: TruthStateAuthoritySource;
  stateVersion?: string;
  activeStates?: readonly TruthStateLifecycle[];
  replacementTruthRecordId?: string;
  supersessionReason?: string;
  supersessionTimestamp?: string;
  restrictionReason?: string;
  restrictionAuthority?: TruthStateAuthoritySource;
  restrictionScope?: string;
  restrictionTimestamp?: string;
  accessTenantId?: string;
  executionRequested?: boolean;
  approvalRequested?: boolean;
  rankingRequested?: boolean;
  prioritizationRequested?: boolean;
  scoringRequested?: boolean;
  resourceAllocationRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type TruthStateReplay = Readonly<{
  replayResult: TruthReplayResult;
  reconstructedState: TruthStateModel;
}>;

export type TruthStateOperatorVisibility = Readonly<{
  truth_record_id: string;
  current_state: TruthStateLifecycle;
  previous_state: TruthStateLifecycle | null;
  state_reason: string;
  state_source: TruthStateAuthoritySource;
  state_timestamp: string;
  state_version: string;
  validation_status: TruthStateValidationState;
  readOnly: true;
  tenantScoped: boolean;
  auditable: true;
  replayLinked: true;
}>;

export type TruthStateAnalytics = Readonly<{
  created_records: number;
  verified_records: number;
  superseded_records: number;
  restricted_records: number;
  archived_records: number;
  state_transition_count: number;
  illegal_transition_attempts: number;
  restriction_events: number;
  supersession_events: number;
  archive_events: number;
  authority_failures: number;
  validation_failures: number;
  replay_failures: number;
}>;

export type TruthStateCertification = Readonly<{
  certificationState: TruthCertificationState;
  statesImplemented: boolean;
  transitionEngineOperational: boolean;
  authorityFrameworkOperational: boolean;
  validationEngineOperational: boolean;
  historyLedgerOperational: boolean;
  replayOperational: boolean;
  operatorVisibilityFunctional: boolean;
  analyticsOperational: boolean;
  tenantIsolationEnforced: boolean;
  failClosedVerified: boolean;
}>;

export type TruthStateFrameworkValidation = Readonly<{
  valid: boolean;
  validationState: TruthStateValidationState;
  reasonCodes: readonly TruthStateReasonCode[];
  stateValid: boolean;
  previousStateValid: boolean;
  transitionLegal: boolean;
  authorityValid: boolean;
  evidenceValid: boolean;
  tenantIsolationValid: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  approvalAbsent: boolean;
  rankingAbsent: boolean;
  prioritizationAbsent: boolean;
  scoringAbsent: boolean;
  resourceAllocationAbsent: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
}>;

export type SealedTruthStateFramework = Readonly<{
  request: TruthStateFrameworkRequest;
  state: TruthStateModel;
  validation: TruthStateFrameworkValidation;
  replay: TruthStateReplay;
  operatorVisibility: TruthStateOperatorVisibility;
  analytics: TruthStateAnalytics;
  certification: TruthStateCertification;
  sealed: true;
  readOnly: true;
  executionAuthorized: false;
  approvalAllowed: false;
  rankingAllowed: false;
  prioritizationAllowed: false;
  scoringAllowed: false;
  resourceAllocationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export type TruthFoundationCertificationState =
  | "FOUNDATION_CERTIFIED"
  | "FOUNDATION_CONDITIONAL"
  | "FOUNDATION_FAILED";

export interface TruthFoundationCertification {
  certification_id: string;
  certification_timestamp: string;
  foundation_version: string;
  certification_scope: readonly string[];
  certification_state: TruthCertificationState;
  certification_reason: string;
  certification_authority: TruthStateAuthoritySource;
  evidence_references: readonly string[];
  replay_references: readonly string[];
}

export type TruthFoundationCertificationValidationState = "VALID" | "INVALID";

export type TruthFoundationCertificationReasonCode =
  | "CERTIFICATION_SCOPE_PRESENT"
  | "CERTIFICATION_SCOPE_MISSING"
  | "CERTIFICATION_AUTHORITY_PRESENT"
  | "CERTIFICATION_AUTHORITY_MISSING"
  | "CERTIFICATION_AUTHORITY_VALID"
  | "CERTIFICATION_AUTHORITY_INVALID"
  | "CERTIFICATION_EVIDENCE_PRESENT"
  | "CERTIFICATION_EVIDENCE_MISSING"
  | "CERTIFICATION_REPLAY_PRESENT"
  | "CERTIFICATION_REPLAY_MISSING"
  | "TRUTH_RECORD_CERTIFICATION_PASS"
  | "TRUTH_RECORD_CERTIFICATION_FAIL"
  | "CLASSIFICATION_CERTIFICATION_PASS"
  | "CLASSIFICATION_CERTIFICATION_FAIL"
  | "IDENTITY_CERTIFICATION_PASS"
  | "IDENTITY_CERTIFICATION_FAIL"
  | "STATE_CERTIFICATION_PASS"
  | "STATE_CERTIFICATION_FAIL"
  | "REPLAY_CERTIFICATION_PASS"
  | "REPLAY_CERTIFICATION_FAIL"
  | "TENANT_ISOLATION_CERTIFICATION_PASS"
  | "TENANT_ISOLATION_CERTIFICATION_FAIL"
  | "GOVERNANCE_CERTIFICATION_PASS"
  | "GOVERNANCE_CERTIFICATION_FAIL"
  | "VISIBILITY_CERTIFICATION_PASS"
  | "VISIBILITY_CERTIFICATION_FAIL"
  | "FOUNDATION_DECISION_PASS"
  | "FOUNDATION_DECISION_CONDITIONAL"
  | "FOUNDATION_DECISION_FAIL"
  | "FOUNDATION_COMPLETION_CERTIFIED"
  | "FOUNDATION_COMPLETION_CONDITIONAL"
  | "FOUNDATION_COMPLETION_FAILED"
  | "REPLAY_REPRODUCED"
  | "REPLAY_MISMATCH"
  | "REPLAY_INCOMPLETE_EVIDENCE"
  | "REPLAY_UNREPLAYABLE"
  | "TENANT_ISOLATION_VALID"
  | "TENANT_ISOLATION_FAILED"
  | "GOVERNANCE_COMPLIANCE_VALID"
  | "GOVERNANCE_COMPLIANCE_FAILED"
  | "VISIBILITY_VALID"
  | "VISIBILITY_FAILED"
  | "ANALYTICS_OPERATIONAL"
  | "ANALYTICS_FAILED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "APPROVAL_ABSENT"
  | "APPROVAL_DETECTED"
  | "RANKING_ABSENT"
  | "RANKING_DETECTED"
  | "PRIORITIZATION_ABSENT"
  | "PRIORITIZATION_DETECTED"
  | "SCORING_ABSENT"
  | "SCORING_DETECTED"
  | "RESOURCE_ALLOCATION_ABSENT"
  | "RESOURCE_ALLOCATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "FOUNDATION_CERTIFICATION_GATE_IS_NOT_CONTROL";

export interface TruthFoundationCertificationRequest {
  tenant_id: string;
  now: string;
}

export type TruthFoundationCertificationInput = Readonly<{
  request: TruthFoundationCertificationRequest;
  truthRecord: SealedTruthRecordContract;
  classification: SealedTruthClassificationSystem;
  identity: SealedTruthIdentityFramework;
  state: SealedTruthStateFramework;
  certificationScope?: readonly string[];
  certificationAuthority: TruthStateAuthoritySource;
  certificationReason: string;
  foundationVersion?: string;
  evidenceReferences?: readonly string[];
  replayReferences?: readonly string[];
  accessTenantId?: string;
  observabilityGapDetected?: boolean;
  analyticsGapDetected?: boolean;
  remediationPlanExists?: boolean;
  governanceApproved?: boolean;
  executionRequested?: boolean;
  approvalRequested?: boolean;
  rankingRequested?: boolean;
  prioritizationRequested?: boolean;
  scoringRequested?: boolean;
  resourceAllocationRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type TruthFoundationCertificationReplay = Readonly<{
  replayResult: TruthReplayResult;
  reconstructedCertification: TruthFoundationCertification;
}>;

export type TruthFoundationCertificationVisibility = Readonly<{
  certification_state: TruthCertificationState;
  foundation_version: string;
  certified_components: readonly string[];
  failed_components: readonly string[];
  replay_status: TruthReplayResult;
  tenant_status: "ISOLATED" | "VIOLATION";
  governance_status: "COMPLIANT" | "FAILED";
  visibility_status: "VISIBLE" | "HIDDEN";
  required_actions: readonly string[];
  certification_timestamp: string;
  certification_authority: TruthStateAuthoritySource;
  readOnly: true;
  tenantScoped: boolean;
  auditable: true;
  replayLinked: true;
}>;

export type TruthFoundationCertificationAnalytics = Readonly<{
  foundation_certifications_total: number;
  foundation_pass_total: number;
  foundation_conditional_total: number;
  foundation_fail_total: number;
  truth_record_failures: number;
  classification_failures: number;
  identity_failures: number;
  state_failures: number;
  replay_failures: number;
  tenant_isolation_failures: number;
  governance_failures: number;
  visibility_failures: number;
  certification_replay_failures: number;
}>;

export type TruthFoundationCertificationValidation = Readonly<{
  valid: boolean;
  validationState: TruthFoundationCertificationValidationState;
  reasonCodes: readonly TruthFoundationCertificationReasonCode[];
  truthRecordCertified: boolean;
  classificationCertified: boolean;
  identityCertified: boolean;
  stateCertified: boolean;
  replayCertified: boolean;
  tenantIsolationCertified: boolean;
  governanceCertified: boolean;
  visibilityCertified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  approvalAbsent: boolean;
  rankingAbsent: boolean;
  prioritizationAbsent: boolean;
  scoringAbsent: boolean;
  resourceAllocationAbsent: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
}>;

export type SealedTruthFoundationCertificationGate = Readonly<{
  request: TruthFoundationCertificationRequest;
  certification: TruthFoundationCertification;
  validation: TruthFoundationCertificationValidation;
  replay: TruthFoundationCertificationReplay;
  visibility: TruthFoundationCertificationVisibility;
  analytics: TruthFoundationCertificationAnalytics;
  completionGate: TruthFoundationCertificationState;
  sealed: true;
  readOnly: true;
  executionAuthorized: false;
  approvalAllowed: false;
  rankingAllowed: false;
  prioritizationAllowed: false;
  scoringAllowed: false;
  resourceAllocationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export type TruthStorageAdapterType =
  | "SQLITE"
  | "POSTGRESQL_FUTURE"
  | "DISTRIBUTED_FUTURE";

export type TruthStorageAdapterState =
  | "ACTIVE"
  | "AVAILABLE"
  | "PLANNED"
  | "DEPRECATED"
  | "DISABLED";

export type TruthStorageMigrationState =
  | "PENDING"
  | "APPLIED"
  | "FAILED"
  | "ROLLED_BACK";

export type TruthStorageErrorClass =
  | "ADAPTER_UNAVAILABLE"
  | "SCHEMA_MISMATCH"
  | "WRITE_FAILURE"
  | "READ_FAILURE"
  | "TRANSACTION_FAILURE"
  | "TENANT_SCOPE_VIOLATION"
  | "MIGRATION_FAILURE"
  | "REPLAY_READ_FAILURE";

export type TruthStorageOperation =
  | "create_truth_record"
  | "get_truth_record"
  | "update_truth_state"
  | "append_truth_event"
  | "list_truth_records"
  | "query_truth_records"
  | "get_lineage"
  | "get_children"
  | "get_parents"
  | "write_certification_result"
  | "read_certification_result";

export interface TruthStorageAdapterRegistryEntry {
  adapter_id: string;
  adapter_type: TruthStorageAdapterType;
  adapter_version: string;
  adapter_state: TruthStorageAdapterState;
  capabilities: readonly TruthStorageOperation[];
  migration_status: TruthStorageMigrationState;
  certification_status: TruthCertificationState;
}

export interface TruthStorageMigrationRecord {
  migration_id: string;
  from_schema_version: string;
  to_schema_version: string;
  migration_timestamp: string;
  migration_status: TruthStorageMigrationState;
  migration_checksum: string;
  rollback_available: boolean;
}

export interface TruthStorageSchemaFoundation {
  schema_version: string;
  tables: readonly string[];
  tenant_indexed: boolean;
  mission_indexed: boolean;
  replay_indexed: boolean;
  certification_indexed: boolean;
  append_only_history: boolean;
  migration_ready: boolean;
}

export interface TruthStorageRecordSnapshot {
  truth_record_id: string;
  tenant_id: string;
  mission_id: string;
  created_at: string;
  updated_at: string;
  record_state: string;
  schema_version: string;
  classification_types: readonly string[];
  lineage_root_id?: string;
  parent_truth_ids: readonly string[];
  child_truth_ids: readonly string[];
  certification_state?: TruthCertificationState;
}

export interface TruthStorageEvent {
  event_id: string;
  truth_record_id: string;
  tenant_id: string;
  timestamp: string;
  event_type: string;
  ordering_key: string;
}

export interface TruthStorageCertificationResult {
  truth_record_id: string;
  tenant_id: string;
  certification_id: string;
  certification_state: TruthCertificationState;
  certification_timestamp: string;
}

export interface TruthStorageFrameworkRequest {
  tenant_id: string;
  now: string;
}

export type TruthStorageFrameworkInput = Readonly<{
  request: TruthStorageFrameworkRequest;
  truthRecord: SealedTruthRecordContract;
  classification: SealedTruthClassificationSystem;
  identity: SealedTruthIdentityFramework;
  state: SealedTruthStateFramework;
  foundationCertification: SealedTruthFoundationCertificationGate;
  activeAdapterType?: TruthStorageAdapterType;
  adapterRegistry?: readonly TruthStorageAdapterRegistryEntry[];
  supportedOperations?: readonly TruthStorageOperation[];
  schemaVersion?: string;
  schemaMismatchDetected?: boolean;
  migrations?: readonly TruthStorageMigrationRecord[];
  storageRecords?: readonly TruthStorageRecordSnapshot[];
  storageEvents?: readonly TruthStorageEvent[];
  certificationResults?: readonly TruthStorageCertificationResult[];
  resolvableEvidenceReferences?: readonly string[];
  resolvableReplayReferences?: readonly string[];
  queryTenantId?: string;
  queryMissionId?: string;
  queryClassification?: string;
  queryState?: string;
  queryLineageRootId?: string;
  queryParentTruthId?: string;
  queryChildTruthId?: string;
  queryCertificationState?: TruthCertificationState;
  queryTimestampRange?: Readonly<{ start: string; end: string }> | null;
  paginationCursor?: string | null;
  paginationLimit?: number;
  nondeterministicOrderingDetected?: boolean;
  partialWriteDetected?: boolean;
  rollbackFailed?: boolean;
  adapterLeakageDetected?: boolean;
  nonIdempotentDistributedWriteDetected?: boolean;
  missingConflictMetadata?: boolean;
  adapterUnavailable?: boolean;
  writeFailureDetected?: boolean;
  readFailureDetected?: boolean;
  replayReadFailureDetected?: boolean;
  migrationFailureDetected?: boolean;
  unknownSchemaVersionDetected?: boolean;
  migrationChecksumMismatchDetected?: boolean;
  failedMigrationNotRecorded?: boolean;
  observabilityGapDetected?: boolean;
  futureAdapterLimitationDetected?: boolean;
  remediationDocumented?: boolean;
  accessTenantId?: string;
  executionRequested?: boolean;
  approvalRequested?: boolean;
  rankingRequested?: boolean;
  prioritizationRequested?: boolean;
  scoringRequested?: boolean;
  resourceAllocationRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type TruthStorageFrameworkValidationState = "VALID" | "INVALID";

export type TruthStorageFrameworkReasonCode =
  | "ADAPTER_PRESENT"
  | "ADAPTER_MISSING"
  | "ADAPTER_SUPPORTED"
  | "ADAPTER_UNSUPPORTED"
  | "ADAPTER_ACTIVE"
  | "ADAPTER_NOT_ACTIVE"
  | "ADAPTER_AVAILABLE"
  | "ADAPTER_DISABLED"
  | "OPERATION_SUPPORTED"
  | "OPERATION_UNSUPPORTED"
  | "SCHEMA_VALID"
  | "SCHEMA_MISMATCH"
  | "SCHEMA_VERSION_KNOWN"
  | "SCHEMA_VERSION_UNKNOWN"
  | "TRANSACTION_ATOMIC"
  | "PARTIAL_WRITE_DETECTED"
  | "ROLLBACK_SUCCEEDED"
  | "ROLLBACK_FAILED"
  | "QUERY_TENANT_SCOPED"
  | "QUERY_TENANT_UNSCOPED"
  | "QUERY_ORDERING_DETERMINISTIC"
  | "QUERY_ORDERING_NONDETERMINISTIC"
  | "MIGRATION_RECORDED"
  | "MIGRATION_FAILURE_RECORDED"
  | "MIGRATION_FAILURE_UNRECORDED"
  | "MIGRATION_CHECKSUM_VALID"
  | "MIGRATION_CHECKSUM_MISMATCH"
  | "POSTGRESQL_COMPATIBLE"
  | "POSTGRESQL_INCOMPATIBLE"
  | "DISTRIBUTED_COMPATIBLE"
  | "DISTRIBUTED_INCOMPATIBLE"
  | "ADAPTER_LEAKAGE_ABSENT"
  | "ADAPTER_LEAKAGE_DETECTED"
  | "IDEMPOTENT_DISTRIBUTED_WRITE"
  | "NON_IDEMPOTENT_DISTRIBUTED_WRITE"
  | "CONFLICT_METADATA_PRESENT"
  | "CONFLICT_METADATA_MISSING"
  | "REPLAY_SUPPORTED"
  | "REPLAY_RECONSTRUCTION_FAILED"
  | "EVENT_HISTORY_COMPLETE"
  | "EVENT_HISTORY_MISSING"
  | "EVIDENCE_REFERENCES_RESOLVABLE"
  | "EVIDENCE_REFERENCES_MISSING"
  | "REPLAY_REFERENCES_RESOLVABLE"
  | "REPLAY_REFERENCES_MISSING"
  | "TENANT_ISOLATION_VALID"
  | "TENANT_ISOLATION_FAILED"
  | "VISIBILITY_AVAILABLE"
  | "VISIBILITY_BLOCKED"
  | "OBSERVABILITY_OPERATIONAL"
  | "OBSERVABILITY_GAP_DETECTED"
  | "CERTIFICATION_PASS"
  | "CERTIFICATION_CONDITIONAL_PASS"
  | "CERTIFICATION_FAIL"
  | "REPLAY_REPRODUCED"
  | "REPLAY_MISMATCH"
  | "REPLAY_INCOMPLETE_EVIDENCE"
  | "REPLAY_UNREPLAYABLE"
  | "STORAGE_FAILURE_FAIL_CLOSED"
  | "STORAGE_FAILURE_FAIL_OPEN"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "APPROVAL_ABSENT"
  | "APPROVAL_DETECTED"
  | "RANKING_ABSENT"
  | "RANKING_DETECTED"
  | "PRIORITIZATION_ABSENT"
  | "PRIORITIZATION_DETECTED"
  | "SCORING_ABSENT"
  | "SCORING_DETECTED"
  | "RESOURCE_ALLOCATION_ABSENT"
  | "RESOURCE_ALLOCATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "STORAGE_ABSTRACTION_LAYER_IS_NOT_CONTROL";

export type TruthStorageFrameworkReplay = Readonly<{
  replayResult: TruthReplayResult;
  reconstructedSnapshot: TruthStorageRecordSnapshot;
}>;

export type TruthStorageFrameworkVisibility = Readonly<{
  active_storage_adapter: TruthStorageAdapterType;
  adapter_state: TruthStorageAdapterState;
  schema_version: string;
  migration_status: TruthStorageMigrationState;
  last_successful_write: string | null;
  last_successful_read: string | null;
  storage_error_state: TruthStorageErrorClass | "NONE";
  certification_status: TruthCertificationState;
  readOnly: true;
  tenantScoped: boolean;
  auditable: true;
  replayLinked: true;
}>;

export type TruthStorageFrameworkObservability = Readonly<{
  storage_reads_total: number;
  storage_writes_total: number;
  storage_write_failures: number;
  storage_read_failures: number;
  transaction_failures: number;
  migration_failures: number;
  tenant_scope_violations: number;
  replay_read_failures: number;
  active_adapter: TruthStorageAdapterType;
  schema_version: string;
}>;

export type TruthStorageFrameworkValidation = Readonly<{
  valid: boolean;
  validationState: TruthStorageFrameworkValidationState;
  reasonCodes: readonly TruthStorageFrameworkReasonCode[];
  adapterValid: boolean;
  schemaValid: boolean;
  transactionAtomic: boolean;
  queryScoped: boolean;
  deterministicOrdering: boolean;
  migrationValid: boolean;
  replaySupported: boolean;
  tenantIsolationValid: boolean;
  failClosed: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  approvalAbsent: boolean;
  rankingAbsent: boolean;
  prioritizationAbsent: boolean;
  scoringAbsent: boolean;
  resourceAllocationAbsent: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
}>;

export type SealedTruthStorageFramework = Readonly<{
  request: TruthStorageFrameworkRequest;
  adapterRegistry: readonly TruthStorageAdapterRegistryEntry[];
  schema: TruthStorageSchemaFoundation;
  primarySnapshot: TruthStorageRecordSnapshot;
  validation: TruthStorageFrameworkValidation;
  replay: TruthStorageFrameworkReplay;
  visibility: TruthStorageFrameworkVisibility;
  observability: TruthStorageFrameworkObservability;
  certification: TruthCertificationState;
  sealed: true;
  readOnly: true;
  executionAuthorized: false;
  approvalAllowed: false;
  rankingAllowed: false;
  prioritizationAllowed: false;
  scoringAllowed: false;
  resourceAllocationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export type TruthWriteType =
  | "CREATE_TRUTH_RECORD"
  | "APPEND_TRUTH_EVENT"
  | "APPEND_CLASSIFICATION"
  | "APPEND_IDENTITY_RELATIONSHIP"
  | "APPEND_STATE_TRANSITION"
  | "APPEND_CERTIFICATION_RESULT"
  | "APPEND_EVIDENCE_REFERENCE"
  | "APPEND_REPLAY_REFERENCE";

export type TruthWriteResult = "COMMITTED" | "REUSED" | "REJECTED";

export type TruthWriteTransactionStatus = "NOT_STARTED" | "COMMITTED" | "ROLLED_BACK";

export type TruthWriteErrorClass =
  | "WRITE_VALIDATION_FAILURE"
  | "WRITE_TRANSACTION_FAILURE"
  | "WRITE_STORAGE_FAILURE"
  | "WRITE_TENANT_SCOPE_FAILURE"
  | "WRITE_IDEMPOTENCY_FAILURE"
  | "WRITE_ORDERING_FAILURE"
  | "WRITE_REPLAY_BINDING_FAILURE";

export interface TruthWriteRequest {
  write_id: string;
  tenant_id: string;
  mission_id: string;
  truth_record_id: string;
  write_type: TruthWriteType;
  write_source: TruthStateAuthoritySource;
  write_timestamp: string;
  write_payload: Readonly<Record<string, string | number | boolean>>;
  evidence_references: readonly string[];
  replay_references: readonly string[];
  idempotency_key: string;
  schema_version: string;
}

export interface TruthWriteLedgerEntry {
  write_id: string;
  tenant_id: string;
  mission_id: string;
  write_type: TruthWriteType;
  write_source: TruthStateAuthoritySource;
  write_timestamp: string;
  write_result: TruthWriteResult;
  failure_reason: string | null;
  transaction_status: TruthWriteTransactionStatus;
  storage_commit_sequence: number;
  write_sequence: number;
  tenant_sequence: number;
  mission_sequence: number;
  evidence_references: readonly string[];
  replay_references: readonly string[];
}

export interface TruthWriteFrameworkRequest {
  tenant_id: string;
  now: string;
}

export type TruthWriteFrameworkInput = Readonly<{
  request: TruthWriteFrameworkRequest;
  storage: SealedTruthStorageFramework;
  writeRequest: TruthWriteRequest;
  knownTenantIds: readonly string[];
  knownMissionIds: readonly string[];
  allowedWriteTypes?: readonly TruthWriteType[];
  priorLedgerEntries?: readonly TruthWriteLedgerEntry[];
  previousWriteId?: string | null;
  priorWriteHash?: string | null;
  priorRequestHash?: string | null;
  writeSequence?: number;
  tenantSequence?: number;
  missionSequence?: number;
  storageCommitSequence?: number;
  payloadSchemaValid?: boolean;
  truthRecordExists?: boolean;
  truthRecordUniqueOnCreate?: boolean;
  stateTransitionLegal?: boolean;
  classificationValid?: boolean;
  identityRelationshipValid?: boolean;
  evidenceReferencesValid?: boolean;
  replayReferencesValid?: boolean;
  mutationAttempted?: boolean;
  deleteAttempted?: boolean;
  historyOverwriteAttempted?: boolean;
  removeEvidenceAttempted?: boolean;
  removeReplayAttempted?: boolean;
  partialWriteDetected?: boolean;
  rollbackFailed?: boolean;
  transactionLeakDetected?: boolean;
  duplicateSequenceDetected?: boolean;
  outOfOrderSequenceDetected?: boolean;
  unstableOrderingDetected?: boolean;
  duplicateCommitAttempted?: boolean;
  idempotencyKeySeen?: boolean;
  idempotencyPayloadMatches?: boolean;
  writesRetried?: number;
  writeLatencyMs?: number;
  crossTenantEvidenceDetected?: boolean;
  crossTenantReplayDetected?: boolean;
  storageFailureDetected?: boolean;
  replayBindingFailureDetected?: boolean;
  replayMismatchDetected?: boolean;
  accessTenantId?: string;
  observabilityGapDetected?: boolean;
  metricsLimitationDetected?: boolean;
  remediationDocumented?: boolean;
  executionRequested?: boolean;
  approvalRequested?: boolean;
  rankingRequested?: boolean;
  prioritizationRequested?: boolean;
  scoringRequested?: boolean;
  resourceAllocationRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type TruthWriteFrameworkValidationState = "VALID" | "INVALID";

export type TruthWriteFrameworkReasonCode =
  | "WRITE_ID_PRESENT"
  | "WRITE_ID_MISSING"
  | "WRITE_TENANT_PRESENT"
  | "WRITE_TENANT_MISSING"
  | "WRITE_MISSION_VALID"
  | "WRITE_MISSION_INVALID"
  | "WRITE_TYPE_PRESENT"
  | "WRITE_TYPE_MISSING"
  | "WRITE_TYPE_SUPPORTED"
  | "WRITE_TYPE_UNSUPPORTED"
  | "WRITE_PAYLOAD_PRESENT"
  | "WRITE_PAYLOAD_MISSING"
  | "WRITE_PAYLOAD_VALID"
  | "WRITE_PAYLOAD_INVALID"
  | "APPEND_ONLY_ENFORCED"
  | "MUTATION_ATTEMPT_DETECTED"
  | "DELETE_ATTEMPT_DETECTED"
  | "HISTORY_OVERWRITE_DETECTED"
  | "EVIDENCE_REMOVE_ATTEMPT_DETECTED"
  | "REPLAY_REMOVE_ATTEMPT_DETECTED"
  | "TRUTH_RECORD_EXISTENCE_VALID"
  | "TRUTH_RECORD_EXISTENCE_INVALID"
  | "TRUTH_RECORD_UNIQUENESS_VALID"
  | "TRUTH_RECORD_UNIQUENESS_INVALID"
  | "STATE_TRANSITION_VALID"
  | "STATE_TRANSITION_INVALID"
  | "CLASSIFICATION_VALID"
  | "CLASSIFICATION_INVALID"
  | "IDENTITY_RELATIONSHIP_VALID"
  | "IDENTITY_RELATIONSHIP_INVALID"
  | "EVIDENCE_REFERENCES_VALID"
  | "EVIDENCE_REFERENCES_INVALID"
  | "REPLAY_REFERENCES_VALID"
  | "REPLAY_REFERENCES_INVALID"
  | "TRANSACTION_PROTECTED"
  | "PARTIAL_WRITE_DETECTED"
  | "ROLLBACK_SUCCEEDED"
  | "ROLLBACK_FAILED"
  | "TRANSACTION_LEAK_DETECTED"
  | "ORDERING_VALID"
  | "ORDERING_OUT_OF_ORDER"
  | "ORDERING_DUPLICATE_SEQUENCE"
  | "ORDERING_UNSTABLE"
  | "IDEMPOTENCY_VALID"
  | "IDEMPOTENCY_CONFLICT"
  | "IDEMPOTENT_REUSE"
  | "DUPLICATE_COMMIT_ATTEMPT"
  | "TENANT_ISOLATION_VALID"
  | "TENANT_ISOLATION_FAILED"
  | "CROSS_TENANT_EVIDENCE_BLOCKED"
  | "CROSS_TENANT_REPLAY_BLOCKED"
  | "REPLAY_BINDING_VALID"
  | "REPLAY_BINDING_INVALID"
  | "WRITE_REPLAY_REPRODUCED"
  | "WRITE_REPLAY_MISMATCH"
  | "WRITE_REPLAY_INCOMPLETE_EVIDENCE"
  | "WRITE_REPLAY_UNREPLAYABLE"
  | "VISIBILITY_AVAILABLE"
  | "VISIBILITY_BLOCKED"
  | "OBSERVABILITY_OPERATIONAL"
  | "OBSERVABILITY_GAP_DETECTED"
  | "CERTIFICATION_PASS"
  | "CERTIFICATION_CONDITIONAL_PASS"
  | "CERTIFICATION_FAIL"
  | "FAIL_CLOSED_ENFORCED"
  | "FAIL_OPEN_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "APPROVAL_ABSENT"
  | "APPROVAL_DETECTED"
  | "RANKING_ABSENT"
  | "RANKING_DETECTED"
  | "PRIORITIZATION_ABSENT"
  | "PRIORITIZATION_DETECTED"
  | "SCORING_ABSENT"
  | "SCORING_DETECTED"
  | "RESOURCE_ALLOCATION_ABSENT"
  | "RESOURCE_ALLOCATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "WRITE_ENGINE_IS_NOT_CONTROL";

export type TruthWriteFrameworkReplay = Readonly<{
  replayResult: TruthReplayResult;
  reconstructedLedgerEntry: TruthWriteLedgerEntry;
}>;

export type TruthWriteFrameworkVisibility = Readonly<{
  write_id: string;
  write_type: TruthWriteType;
  write_result: TruthWriteResult;
  write_timestamp: string;
  tenant_id: string;
  mission_id: string;
  truth_record_id: string;
  failure_reason: string | null;
  transaction_status: TruthWriteTransactionStatus;
  storage_commit_sequence: number;
  readOnly: true;
  tenantScoped: boolean;
  auditable: true;
  replayLinked: true;
}>;

export type TruthWriteFrameworkObservability = Readonly<{
  writes_total: number;
  writes_successful: number;
  writes_failed: number;
  writes_retried: number;
  write_validation_failures: number;
  write_transaction_failures: number;
  write_storage_failures: number;
  write_tenant_scope_failures: number;
  write_idempotency_failures: number;
  write_ordering_failures: number;
  average_write_latency: number;
}>;

export type TruthWriteFrameworkValidation = Readonly<{
  valid: boolean;
  validationState: TruthWriteFrameworkValidationState;
  reasonCodes: readonly TruthWriteFrameworkReasonCode[];
  appendOnlyEnforced: boolean;
  integrityValid: boolean;
  transactionProtected: boolean;
  deterministicOrdering: boolean;
  idempotencyValid: boolean;
  tenantIsolationValid: boolean;
  replayBindingsValid: boolean;
  failClosed: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  approvalAbsent: boolean;
  rankingAbsent: boolean;
  prioritizationAbsent: boolean;
  scoringAbsent: boolean;
  resourceAllocationAbsent: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
}>;

export type SealedTruthWriteFramework = Readonly<{
  request: TruthWriteFrameworkRequest;
  writeRequest: TruthWriteRequest;
  ledgerEntry: TruthWriteLedgerEntry;
  validation: TruthWriteFrameworkValidation;
  replay: TruthWriteFrameworkReplay;
  visibility: TruthWriteFrameworkVisibility;
  observability: TruthWriteFrameworkObservability;
  certification: TruthCertificationState;
  sealed: true;
  readOnly: true;
  executionAuthorized: false;
  approvalAllowed: false;
  rankingAllowed: false;
  prioritizationAllowed: false;
  scoringAllowed: false;
  resourceAllocationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export type TruthReadType =
  | "DIRECT_LOOKUP"
  | "LINEAGE_LOOKUP"
  | "REPLAY_LOOKUP"
  | "CLASSIFICATION_LOOKUP"
  | "STATE_LOOKUP"
  | "CERTIFICATION_LOOKUP"
  | "EVIDENCE_LOOKUP";

export type TruthReadResult = "RETURNED" | "NOT_FOUND" | "REJECTED";

export type TruthReadErrorClass =
  | "READ_VALIDATION_FAILURE"
  | "READ_STORAGE_FAILURE"
  | "READ_TENANT_SCOPE_FAILURE"
  | "READ_NOT_FOUND"
  | "READ_LINEAGE_FAILURE"
  | "READ_REPLAY_FAILURE"
  | "READ_SCHEMA_FAILURE"
  | "READ_ORDERING_FAILURE";

export interface TruthReadRequest {
  read_id: string;
  tenant_id: string;
  mission_id: string;
  truth_record_id: string;
  read_type: TruthReadType;
  read_source: TruthStateAuthoritySource;
  read_timestamp: string;
  query_parameters: Readonly<Record<string, string | number | boolean>>;
  schema_version: string;
}

export interface TruthReadLedgerEntry {
  read_id: string;
  tenant_id: string;
  mission_id: string;
  truth_record_id: string;
  read_type: TruthReadType;
  read_source: TruthStateAuthoritySource;
  read_timestamp: string;
  read_result: TruthReadResult;
  failure_reason: string | null;
  result_count: number;
}

export interface TruthReadFrameworkRequest {
  tenant_id: string;
  now: string;
}

export type TruthReadFrameworkInput = Readonly<{
  request: TruthReadFrameworkRequest;
  storage: SealedTruthStorageFramework;
  write: SealedTruthWriteFramework;
  readRequest: TruthReadRequest;
  directLookupFound?: boolean;
  lineageNodes?: readonly string[];
  parentTruthIds?: readonly string[];
  childTruthIds?: readonly string[];
  ancestorTruthIds?: readonly string[];
  descendantTruthIds?: readonly string[];
  replayArtifactsPresent?: boolean;
  evidenceReferencesResolvable?: boolean;
  replayReferencesResolvable?: boolean;
  duplicateIdentityReturned?: boolean;
  lineageCycleDetected?: boolean;
  brokenLineageDetected?: boolean;
  incompleteReplayContextDetected?: boolean;
  corruptResultDetected?: boolean;
  schemaMismatchDetected?: boolean;
  nondeterministicOrderingDetected?: boolean;
  unstablePaginationDetected?: boolean;
  invalidCursorDetected?: boolean;
  unboundedQueryDetected?: boolean;
  storageFailureDetected?: boolean;
  replayMismatchDetected?: boolean;
  accessTenantId?: string;
  pageSize?: number;
  maxPageSize?: number;
  queryTenantScoped?: boolean;
  observabilityGapDetected?: boolean;
  analyticsLimitationDetected?: boolean;
  remediationDocumented?: boolean;
  executionRequested?: boolean;
  approvalRequested?: boolean;
  rankingRequested?: boolean;
  prioritizationRequested?: boolean;
  scoringRequested?: boolean;
  resourceAllocationRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type TruthReadFrameworkValidationState = "VALID" | "INVALID";

export type TruthReadFrameworkReasonCode =
  | "READ_ID_PRESENT"
  | "READ_ID_MISSING"
  | "READ_TENANT_PRESENT"
  | "READ_TENANT_MISSING"
  | "READ_TYPE_PRESENT"
  | "READ_TYPE_MISSING"
  | "READ_TYPE_SUPPORTED"
  | "READ_TYPE_UNSUPPORTED"
  | "DIRECT_LOOKUP_VALID"
  | "DIRECT_LOOKUP_NOT_FOUND"
  | "LINEAGE_LOOKUP_VALID"
  | "LINEAGE_LOOKUP_INVALID"
  | "REPLAY_LOOKUP_VALID"
  | "REPLAY_LOOKUP_INVALID"
  | "TENANT_ISOLATION_VALID"
  | "TENANT_ISOLATION_FAILED"
  | "IDENTITY_CONSISTENT"
  | "IDENTITY_MISMATCH"
  | "TENANT_CONSISTENT"
  | "TENANT_MISMATCH"
  | "SCHEMA_VALID"
  | "SCHEMA_MISMATCH"
  | "RESULT_INTEGRITY_VALID"
  | "RESULT_CORRUPT"
  | "ORDERING_DETERMINISTIC"
  | "ORDERING_NONDETERMINISTIC"
  | "PAGINATION_VALID"
  | "PAGINATION_INVALID"
  | "QUERY_SCOPED"
  | "QUERY_UNSCOPED"
  | "REPLAY_CONTEXT_COMPLETE"
  | "REPLAY_CONTEXT_INCOMPLETE"
  | "EVIDENCE_REFERENCES_RESOLVABLE"
  | "EVIDENCE_REFERENCES_MISSING"
  | "REPLAY_REFERENCES_RESOLVABLE"
  | "REPLAY_REFERENCES_MISSING"
  | "LINEAGE_CYCLE_ABSENT"
  | "LINEAGE_CYCLE_DETECTED"
  | "LINEAGE_INTACT"
  | "LINEAGE_BROKEN"
  | "VISIBILITY_AVAILABLE"
  | "VISIBILITY_BLOCKED"
  | "OBSERVABILITY_OPERATIONAL"
  | "OBSERVABILITY_GAP_DETECTED"
  | "READ_REPLAY_REPRODUCED"
  | "READ_REPLAY_MISMATCH"
  | "READ_REPLAY_INCOMPLETE_EVIDENCE"
  | "READ_REPLAY_UNREPLAYABLE"
  | "CERTIFICATION_PASS"
  | "CERTIFICATION_CONDITIONAL_PASS"
  | "CERTIFICATION_FAIL"
  | "FAIL_CLOSED_ENFORCED"
  | "FAIL_OPEN_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "APPROVAL_ABSENT"
  | "APPROVAL_DETECTED"
  | "RANKING_ABSENT"
  | "RANKING_DETECTED"
  | "PRIORITIZATION_ABSENT"
  | "PRIORITIZATION_DETECTED"
  | "SCORING_ABSENT"
  | "SCORING_DETECTED"
  | "RESOURCE_ALLOCATION_ABSENT"
  | "RESOURCE_ALLOCATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "READ_ENGINE_IS_NOT_CONTROL";

export type TruthReadFrameworkReplay = Readonly<{
  replayResult: TruthReplayResult;
  reconstructedLedgerEntry: TruthReadLedgerEntry;
}>;

export type TruthReadFrameworkVisibility = Readonly<{
  read_id: string;
  read_type: TruthReadType;
  read_result: TruthReadResult;
  read_timestamp: string;
  tenant_id: string;
  mission_id: string;
  truth_record_id: string;
  result_count: number;
  failure_reason: string | null;
  replay_status: TruthReplayResult;
  readOnly: true;
  tenantScoped: boolean;
  auditable: true;
  replayLinked: true;
}>;

export type TruthReadFrameworkObservability = Readonly<{
  reads_total: number;
  direct_lookups_total: number;
  lineage_lookups_total: number;
  replay_lookups_total: number;
  reads_failed: number;
  read_not_found_total: number;
  read_tenant_scope_failures: number;
  read_lineage_failures: number;
  read_replay_failures: number;
  read_ordering_failures: number;
  average_read_latency: number;
}>;

export type TruthReadFrameworkValidation = Readonly<{
  valid: boolean;
  validationState: TruthReadFrameworkValidationState;
  reasonCodes: readonly TruthReadFrameworkReasonCode[];
  directLookupValid: boolean;
  lineageLookupValid: boolean;
  replayLookupValid: boolean;
  tenantIsolationValid: boolean;
  resultIntegrityValid: boolean;
  deterministicOrdering: boolean;
  paginationValid: boolean;
  replayContextComplete: boolean;
  failClosed: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  approvalAbsent: boolean;
  rankingAbsent: boolean;
  prioritizationAbsent: boolean;
  scoringAbsent: boolean;
  resourceAllocationAbsent: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
}>;

export type SealedTruthReadFramework = Readonly<{
  request: TruthReadFrameworkRequest;
  readRequest: TruthReadRequest;
  ledgerEntry: TruthReadLedgerEntry;
  validation: TruthReadFrameworkValidation;
  replay: TruthReadFrameworkReplay;
  visibility: TruthReadFrameworkVisibility;
  observability: TruthReadFrameworkObservability;
  certification: TruthCertificationState;
  sealed: true;
  readOnly: true;
  executionAuthorized: false;
  approvalAllowed: false;
  rankingAllowed: false;
  prioritizationAllowed: false;
  scoringAllowed: false;
  resourceAllocationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export type TruthRetentionPolicyId =
  | "PERMANENT"
  | "LONG_TERM"
  | "STANDARD"
  | "SHORT_TERM"
  | "MISSION_BOUND";

export type TruthRetentionState =
  | "ACTIVE"
  | "RETENTION_PENDING"
  | "ARCHIVE_PENDING"
  | "ARCHIVED"
  | "EXPIRED"
  | "RESTRICTED";

export type TruthArchiveEligibilityState = "ELIGIBLE" | "NOT_ELIGIBLE" | "RESTRICTED";

export type TruthExpirationStatus = "EXPIRED" | "HELD" | "EXTENDED";

export type TruthGovernanceRetentionAction =
  | "EXTEND_RETENTION"
  | "BLOCK_ARCHIVE"
  | "FORCE_ARCHIVE"
  | "PLACE_HOLD"
  | "REMOVE_HOLD"
  | "RESTRICT_TRANSITION";

export interface TruthRetentionPolicy {
  policy_id: TruthRetentionPolicyId;
  policy_name: string;
  policy_scope: string;
  retention_period: number;
  archive_period: number;
  expiration_behavior: TruthExpirationStatus;
  governance_requirements: readonly string[];
}

export interface TruthRetentionRecord {
  retention_id: string;
  tenant_id: string;
  mission_id: string;
  truth_record_id: string;
  retention_policy_id: TruthRetentionPolicyId;
  retention_state: TruthRetentionState;
  retention_timestamp: string;
  retention_expiration: string;
  archive_eligibility: TruthArchiveEligibilityState;
  lifecycle_transition_reason: string;
}

export interface TruthRetentionLedgerEntry {
  retention_id: string;
  tenant_id: string;
  mission_id: string;
  truth_record_id: string;
  policy_assignment: TruthRetentionPolicyId;
  retention_evaluation: TruthRetentionState;
  archive_evaluation: TruthArchiveEligibilityState;
  archive_execution: boolean;
  expiration_evaluation: TruthExpirationStatus;
  governance_action: TruthGovernanceRetentionAction | null;
  validation_result: TruthCertificationState;
}

export interface TruthRetentionFrameworkRequest {
  tenant_id: string;
  now: string;
}

export type TruthRetentionFrameworkInput = Readonly<{
  request: TruthRetentionFrameworkRequest;
  storage: SealedTruthStorageFramework;
  write: SealedTruthWriteFramework;
  read: SealedTruthReadFramework;
  retentionId?: string;
  retentionPolicyId: TruthRetentionPolicyId;
  retentionState: TruthRetentionState;
  retentionTimestamp?: string;
  retentionExpiration: string;
  archiveEligibility: TruthArchiveEligibilityState;
  lifecycleTransitionReason: string;
  lifecycleState?: TruthStateLifecycle;
  policyActiveImmutable?: boolean;
  policyChangedAfterActivation?: boolean;
  archiveExecuted?: boolean;
  archiveDataLossDetected?: boolean;
  archiveReplayFailureDetected?: boolean;
  archiveLineageLossDetected?: boolean;
  recordAgeDays?: number;
  governanceRestricted?: boolean;
  certificationDependencyActive?: boolean;
  replayDependencyActive?: boolean;
  evidenceDependencyActive?: boolean;
  legalHoldActive?: boolean;
  investigationActive?: boolean;
  regulatoryRequirementActive?: boolean;
  expirationStatus?: TruthExpirationStatus;
  governanceAction?: TruthGovernanceRetentionAction | null;
  governanceActionAuthorized?: boolean;
  governanceEvidencePresent?: boolean;
  lifecycleTransitionLegal?: boolean;
  transitionAuthorityPresent?: boolean;
  transitionEvidencePresent?: boolean;
  replayMismatchDetected?: boolean;
  crossTenantAccessDetected?: boolean;
  crossTenantArchiveDetected?: boolean;
  crossTenantExpirationDetected?: boolean;
  crossTenantGovernanceDetected?: boolean;
  accessTenantId?: string;
  observabilityGapDetected?: boolean;
  reportingLimitationDetected?: boolean;
  remediationDocumented?: boolean;
  executionRequested?: boolean;
  approvalRequested?: boolean;
  rankingRequested?: boolean;
  prioritizationRequested?: boolean;
  scoringRequested?: boolean;
  resourceAllocationRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type TruthRetentionFrameworkValidationState = "VALID" | "INVALID";

export type TruthRetentionFrameworkReasonCode =
  | "RETENTION_POLICY_PRESENT"
  | "RETENTION_POLICY_MISSING"
  | "RETENTION_POLICY_SUPPORTED"
  | "RETENTION_POLICY_UNSUPPORTED"
  | "RETENTION_POLICY_IMMUTABLE"
  | "RETENTION_POLICY_MUTATED"
  | "RETENTION_STATE_PRESENT"
  | "RETENTION_STATE_MISSING"
  | "RETENTION_STATE_SUPPORTED"
  | "RETENTION_STATE_UNSUPPORTED"
  | "ARCHIVE_ELIGIBILITY_VALID"
  | "ARCHIVE_ELIGIBILITY_INVALID"
  | "ARCHIVE_EXECUTION_VALID"
  | "ARCHIVE_EXECUTION_INVALID"
  | "ARCHIVE_DATA_PRESERVED"
  | "ARCHIVE_DATA_LOSS_DETECTED"
  | "ARCHIVE_REPLAY_PRESERVED"
  | "ARCHIVE_REPLAY_FAILURE"
  | "ARCHIVE_LINEAGE_PRESERVED"
  | "ARCHIVE_LINEAGE_LOSS"
  | "EXPIRATION_VALID"
  | "EXPIRATION_INVALID"
  | "LEGAL_HOLD_ENFORCED"
  | "LEGAL_HOLD_VIOLATED"
  | "GOVERNANCE_HOLD_ENFORCED"
  | "GOVERNANCE_HOLD_VIOLATED"
  | "CERTIFICATION_DEPENDENCY_ENFORCED"
  | "CERTIFICATION_DEPENDENCY_VIOLATED"
  | "LIFECYCLE_TRANSITION_VALID"
  | "LIFECYCLE_TRANSITION_INVALID"
  | "TRANSITION_AUTHORITY_PRESENT"
  | "TRANSITION_AUTHORITY_MISSING"
  | "TRANSITION_EVIDENCE_PRESENT"
  | "TRANSITION_EVIDENCE_MISSING"
  | "GOVERNANCE_ACTION_AUTHORIZED"
  | "GOVERNANCE_ACTION_UNAUTHORIZED"
  | "GOVERNANCE_EVIDENCE_PRESENT"
  | "GOVERNANCE_EVIDENCE_MISSING"
  | "TENANT_ISOLATION_VALID"
  | "TENANT_ISOLATION_FAILED"
  | "RETENTION_REPLAY_REPRODUCED"
  | "RETENTION_REPLAY_MISMATCH"
  | "RETENTION_REPLAY_INCOMPLETE_EVIDENCE"
  | "RETENTION_REPLAY_UNREPLAYABLE"
  | "VISIBILITY_AVAILABLE"
  | "VISIBILITY_BLOCKED"
  | "OBSERVABILITY_OPERATIONAL"
  | "OBSERVABILITY_GAP_DETECTED"
  | "CERTIFICATION_PASS"
  | "CERTIFICATION_CONDITIONAL_PASS"
  | "CERTIFICATION_FAIL"
  | "FAIL_CLOSED_ENFORCED"
  | "FAIL_OPEN_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "APPROVAL_ABSENT"
  | "APPROVAL_DETECTED"
  | "RANKING_ABSENT"
  | "RANKING_DETECTED"
  | "PRIORITIZATION_ABSENT"
  | "PRIORITIZATION_DETECTED"
  | "SCORING_ABSENT"
  | "SCORING_DETECTED"
  | "RESOURCE_ALLOCATION_ABSENT"
  | "RESOURCE_ALLOCATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "RETENTION_MANAGER_IS_NOT_CONTROL";

export type TruthRetentionFrameworkReplay = Readonly<{
  replayResult: TruthReplayResult;
  reconstructedLedgerEntry: TruthRetentionLedgerEntry;
}>;

export type TruthRetentionFrameworkVisibility = Readonly<{
  retention_policy: TruthRetentionPolicyId;
  retention_state: TruthRetentionState;
  archive_eligibility: TruthArchiveEligibilityState;
  archive_status: "ARCHIVED" | "NOT_ARCHIVED";
  expiration_status: TruthExpirationStatus;
  governance_holds: readonly string[];
  lifecycle_state: TruthStateLifecycle;
  validation_status: TruthRetentionFrameworkValidationState;
  readOnly: true;
  tenantScoped: boolean;
  auditable: true;
  replayLinked: true;
}>;

export type TruthRetentionFrameworkObservability = Readonly<{
  active_records: number;
  retention_pending_records: number;
  archive_pending_records: number;
  archived_records: number;
  expired_records: number;
  restricted_records: number;
  archive_operations: number;
  archive_failures: number;
  expiration_failures: number;
  hold_operations: number;
  transition_failures: number;
}>;

export type TruthRetentionFrameworkValidation = Readonly<{
  valid: boolean;
  validationState: TruthRetentionFrameworkValidationState;
  reasonCodes: readonly TruthRetentionFrameworkReasonCode[];
  policyValid: boolean;
  stateValid: boolean;
  archiveEligibilityValid: boolean;
  lifecycleTransitionValid: boolean;
  governanceControlsValid: boolean;
  replayPreserved: boolean;
  tenantIsolationValid: boolean;
  failClosed: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  approvalAbsent: boolean;
  rankingAbsent: boolean;
  prioritizationAbsent: boolean;
  scoringAbsent: boolean;
  resourceAllocationAbsent: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
}>;

export type SealedTruthRetentionFramework = Readonly<{
  request: TruthRetentionFrameworkRequest;
  retentionRecord: TruthRetentionRecord;
  ledgerEntry: TruthRetentionLedgerEntry;
  validation: TruthRetentionFrameworkValidation;
  replay: TruthRetentionFrameworkReplay;
  visibility: TruthRetentionFrameworkVisibility;
  observability: TruthRetentionFrameworkObservability;
  certification: TruthCertificationState;
  sealed: true;
  readOnly: true;
  executionAuthorized: false;
  approvalAllowed: false;
  rankingAllowed: false;
  prioritizationAllowed: false;
  scoringAllowed: false;
  resourceAllocationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export type TruthPersistenceCertificationState =
  | "PERSISTENCE_CERTIFIED"
  | "PERSISTENCE_CONDITIONAL"
  | "PERSISTENCE_FAILED";

export interface TruthPersistenceCertification {
  certification_id: string;
  certification_timestamp: string;
  persistence_version: string;
  certification_scope: readonly string[];
  certification_state: TruthCertificationState;
  certification_reason: string;
  certification_authority: TruthStateAuthoritySource;
  evidence_references: readonly string[];
  replay_references: readonly string[];
}

export type TruthPersistenceCertificationValidationState = "VALID" | "INVALID";

export type TruthPersistenceCertificationReasonCode =
  | "CERTIFICATION_SCOPE_PRESENT"
  | "CERTIFICATION_SCOPE_MISSING"
  | "CERTIFICATION_AUTHORITY_PRESENT"
  | "CERTIFICATION_AUTHORITY_MISSING"
  | "CERTIFICATION_AUTHORITY_VALID"
  | "CERTIFICATION_AUTHORITY_INVALID"
  | "CERTIFICATION_EVIDENCE_PRESENT"
  | "CERTIFICATION_EVIDENCE_MISSING"
  | "CERTIFICATION_REPLAY_PRESENT"
  | "CERTIFICATION_REPLAY_MISSING"
  | "STORAGE_CERTIFICATION_PASS"
  | "STORAGE_CERTIFICATION_FAIL"
  | "WRITE_CERTIFICATION_PASS"
  | "WRITE_CERTIFICATION_FAIL"
  | "READ_CERTIFICATION_PASS"
  | "READ_CERTIFICATION_FAIL"
  | "RETENTION_CERTIFICATION_PASS"
  | "RETENTION_CERTIFICATION_FAIL"
  | "REPLAY_CERTIFICATION_PASS"
  | "REPLAY_CERTIFICATION_FAIL"
  | "TENANT_ISOLATION_CERTIFICATION_PASS"
  | "TENANT_ISOLATION_CERTIFICATION_FAIL"
  | "GOVERNANCE_CERTIFICATION_PASS"
  | "GOVERNANCE_CERTIFICATION_FAIL"
  | "VISIBILITY_CERTIFICATION_PASS"
  | "VISIBILITY_CERTIFICATION_FAIL"
  | "PERSISTENCE_DECISION_PASS"
  | "PERSISTENCE_DECISION_CONDITIONAL"
  | "PERSISTENCE_DECISION_FAIL"
  | "PERSISTENCE_COMPLETION_CERTIFIED"
  | "PERSISTENCE_COMPLETION_CONDITIONAL"
  | "PERSISTENCE_COMPLETION_FAILED"
  | "REPLAY_REPRODUCED"
  | "REPLAY_MISMATCH"
  | "REPLAY_INCOMPLETE_EVIDENCE"
  | "REPLAY_UNREPLAYABLE"
  | "TENANT_ISOLATION_VALID"
  | "TENANT_ISOLATION_FAILED"
  | "GOVERNANCE_COMPLIANCE_VALID"
  | "GOVERNANCE_COMPLIANCE_FAILED"
  | "VISIBILITY_VALID"
  | "VISIBILITY_FAILED"
  | "ANALYTICS_OPERATIONAL"
  | "ANALYTICS_FAILED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "APPROVAL_ABSENT"
  | "APPROVAL_DETECTED"
  | "RANKING_ABSENT"
  | "RANKING_DETECTED"
  | "PRIORITIZATION_ABSENT"
  | "PRIORITIZATION_DETECTED"
  | "SCORING_ABSENT"
  | "SCORING_DETECTED"
  | "RESOURCE_ALLOCATION_ABSENT"
  | "RESOURCE_ALLOCATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "PERSISTENCE_CERTIFICATION_GATE_IS_NOT_CONTROL";

export interface TruthPersistenceCertificationRequest {
  tenant_id: string;
  now: string;
}

export type TruthPersistenceCertificationInput = Readonly<{
  request: TruthPersistenceCertificationRequest;
  storage: SealedTruthStorageFramework;
  write: SealedTruthWriteFramework;
  read: SealedTruthReadFramework;
  retention: SealedTruthRetentionFramework;
  certificationScope?: readonly string[];
  certificationAuthority: TruthStateAuthoritySource;
  certificationReason: string;
  persistenceVersion?: string;
  evidenceReferences?: readonly string[];
  replayReferences?: readonly string[];
  accessTenantId?: string;
  observabilityGapDetected?: boolean;
  analyticsGapDetected?: boolean;
  remediationPlanExists?: boolean;
  governanceApproved?: boolean;
  executionRequested?: boolean;
  approvalRequested?: boolean;
  rankingRequested?: boolean;
  prioritizationRequested?: boolean;
  scoringRequested?: boolean;
  resourceAllocationRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type TruthPersistenceCertificationReplay = Readonly<{
  replayResult: TruthReplayResult;
  reconstructedCertification: TruthPersistenceCertification;
}>;

export type TruthPersistenceCertificationVisibility = Readonly<{
  certification_state: TruthCertificationState;
  persistence_version: string;
  certified_components: readonly string[];
  failed_components: readonly string[];
  replay_status: TruthReplayResult;
  tenant_status: "ISOLATED" | "VIOLATION";
  governance_status: "COMPLIANT" | "FAILED";
  visibility_status: "VISIBLE" | "HIDDEN";
  required_actions: readonly string[];
  certification_timestamp: string;
  certification_authority: TruthStateAuthoritySource;
  readOnly: true;
  tenantScoped: boolean;
  auditable: true;
  replayLinked: true;
}>;

export type TruthPersistenceCertificationAnalytics = Readonly<{
  persistence_certifications_total: number;
  persistence_pass_total: number;
  persistence_conditional_total: number;
  persistence_fail_total: number;
  storage_failures: number;
  write_failures: number;
  read_failures: number;
  retention_failures: number;
  replay_failures: number;
  tenant_isolation_failures: number;
  governance_failures: number;
  visibility_failures: number;
  certification_replay_failures: number;
}>;

export type TruthPersistenceCertificationValidation = Readonly<{
  valid: boolean;
  validationState: TruthPersistenceCertificationValidationState;
  reasonCodes: readonly TruthPersistenceCertificationReasonCode[];
  storageCertified: boolean;
  writeCertified: boolean;
  readCertified: boolean;
  retentionCertified: boolean;
  replayCertified: boolean;
  tenantIsolationCertified: boolean;
  governanceCertified: boolean;
  visibilityCertified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  approvalAbsent: boolean;
  rankingAbsent: boolean;
  prioritizationAbsent: boolean;
  scoringAbsent: boolean;
  resourceAllocationAbsent: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
}>;

export type SealedTruthPersistenceCertificationGate = Readonly<{
  request: TruthPersistenceCertificationRequest;
  certification: TruthPersistenceCertification;
  validation: TruthPersistenceCertificationValidation;
  replay: TruthPersistenceCertificationReplay;
  visibility: TruthPersistenceCertificationVisibility;
  analytics: TruthPersistenceCertificationAnalytics;
  completionGate: TruthPersistenceCertificationState;
  sealed: true;
  readOnly: true;
  executionAuthorized: false;
  approvalAllowed: false;
  rankingAllowed: false;
  prioritizationAllowed: false;
  scoringAllowed: false;
  resourceAllocationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export type TruthEventContractType =
  | "TRUTH_CREATED"
  | "TRUTH_VERIFIED"
  | "TRUTH_SUPERSEDED"
  | "TRUTH_RESTRICTED"
  | "TRUTH_ARCHIVED"
  | "CLASSIFICATION_ASSIGNED"
  | "IDENTITY_LINKED"
  | "STATE_TRANSITIONED"
  | "EVIDENCE_ATTACHED"
  | "REPLAY_ATTACHED"
  | "CERTIFICATION_COMPLETED"
  | "RETENTION_UPDATED"
  | "GOVERNANCE_ACTION"
  | "ESCALATION_CREATED"
  | "RUNTIME_EVENT";

export type TruthEventCategory =
  | "TRUTH"
  | "CLASSIFICATION"
  | "IDENTITY"
  | "STATE"
  | "EVIDENCE"
  | "REPLAY"
  | "RETENTION"
  | "GOVERNANCE"
  | "CERTIFICATION"
  | "ESCALATION"
  | "RUNTIME";

export type TruthEventContractSource =
  | "WRITE_ENGINE"
  | "READ_ENGINE"
  | "RETENTION_MANAGER"
  | "GOVERNANCE_ENGINE"
  | "CERTIFICATION_ENGINE"
  | "REPLAY_ENGINE"
  | "OPERATOR"
  | "SYSTEM_RUNTIME";

export interface TruthEventPayload {
  payload_type: string;
  payload_version: string;
  payload_data: Readonly<Record<string, string | number | boolean>>;
  payload_hash: string;
}

export interface TruthEventContract {
  event_id: string;
  tenant_id: string;
  mission_id: string;
  truth_record_id: string;
  event_type: TruthEventContractType;
  event_category: TruthEventCategory;
  event_source: TruthEventContractSource;
  event_timestamp: string;
  event_version: string;
  event_payload: TruthEventPayload;
  event_hash: string;
  event_creation_timestamp: string;
  parent_event_id?: string;
  child_event_ids: readonly string[];
  related_truth_record_id?: string;
  related_lineage_root_id?: string;
  evidence_reference_ids: readonly string[];
  evidence_count: number;
  evidence_hash: string;
  replay_reference_ids: readonly string[];
  replay_bundle_id?: string;
  replay_hash: string;
}

export interface TruthEventFrameworkRequest {
  tenant_id: string;
  now: string;
}

export type TruthEventFrameworkInput = Readonly<{
  request: TruthEventFrameworkRequest;
  persistence: SealedTruthPersistenceCertificationGate;
  eventId?: string;
  missionId: string;
  truthRecordId: string;
  eventType: TruthEventContractType;
  eventCategory: TruthEventCategory;
  eventSource: TruthEventContractSource;
  eventTimestamp?: string;
  eventVersion?: string;
  eventPayload: Readonly<Record<string, string | number | boolean>>;
  payloadType: string;
  payloadVersion: string;
  parentEventId?: string;
  childEventIds?: readonly string[];
  relatedTruthRecordId?: string;
  relatedLineageRootId?: string;
  evidenceReferenceIds: readonly string[];
  replayReferenceIds: readonly string[];
  replayBundleId?: string;
  priorEventIds?: readonly string[];
  knownParentEventIds?: readonly string[];
  categoryMatchesType?: boolean;
  payloadSchemaValid?: boolean;
  evidenceReferencesResolvable?: boolean;
  replayReferencesResolvable?: boolean;
  identityMutated?: boolean;
  hashMismatchDetected?: boolean;
  payloadHashMismatchDetected?: boolean;
  evidenceHashMismatchDetected?: boolean;
  replayHashMismatchDetected?: boolean;
  crossTenantRelationshipDetected?: boolean;
  replayMismatchDetected?: boolean;
  accessTenantId?: string;
  observabilityGapDetected?: boolean;
  remediationDocumented?: boolean;
  executionRequested?: boolean;
  approvalRequested?: boolean;
  rankingRequested?: boolean;
  prioritizationRequested?: boolean;
  scoringRequested?: boolean;
  resourceAllocationRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type TruthEventFrameworkValidationState = "VALID" | "INVALID";

export type TruthEventFrameworkReasonCode =
  | "EVENT_ID_PRESENT"
  | "EVENT_ID_MISSING"
  | "EVENT_ID_UNIQUE"
  | "EVENT_ID_DUPLICATE"
  | "EVENT_ID_IMMUTABLE"
  | "EVENT_ID_MUTATED"
  | "EVENT_HASH_VALID"
  | "EVENT_HASH_MISMATCH"
  | "EVENT_TYPE_PRESENT"
  | "EVENT_TYPE_MISSING"
  | "EVENT_TYPE_SUPPORTED"
  | "EVENT_TYPE_UNSUPPORTED"
  | "EVENT_CATEGORY_VALID"
  | "EVENT_CATEGORY_MISMATCH"
  | "EVENT_SOURCE_PRESENT"
  | "EVENT_SOURCE_MISSING"
  | "EVENT_SOURCE_VALID"
  | "EVENT_SOURCE_INVALID"
  | "EVENT_TIMESTAMP_VALID"
  | "EVENT_TIMESTAMP_INVALID"
  | "PAYLOAD_SCHEMA_VALID"
  | "PAYLOAD_SCHEMA_INVALID"
  | "PAYLOAD_HASH_VALID"
  | "PAYLOAD_HASH_MISMATCH"
  | "RELATIONSHIPS_VALID"
  | "RELATIONSHIPS_INVALID"
  | "PARENT_EVENT_KNOWN"
  | "PARENT_EVENT_UNKNOWN"
  | "RELATIONSHIP_TENANT_VALID"
  | "RELATIONSHIP_TENANT_FAILED"
  | "EVIDENCE_BINDING_VALID"
  | "EVIDENCE_BINDING_INVALID"
  | "EVIDENCE_HASH_VALID"
  | "EVIDENCE_HASH_MISMATCH"
  | "REPLAY_BINDING_VALID"
  | "REPLAY_BINDING_INVALID"
  | "REPLAY_HASH_VALID"
  | "REPLAY_HASH_MISMATCH"
  | "EVENT_REPLAY_REPRODUCED"
  | "EVENT_REPLAY_MISMATCH"
  | "EVENT_REPLAY_INCOMPLETE_EVIDENCE"
  | "EVENT_REPLAY_UNREPLAYABLE"
  | "VISIBILITY_AVAILABLE"
  | "VISIBILITY_BLOCKED"
  | "CERTIFICATION_PASS"
  | "CERTIFICATION_CONDITIONAL_PASS"
  | "CERTIFICATION_FAIL"
  | "FAIL_CLOSED_ENFORCED"
  | "FAIL_OPEN_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "APPROVAL_ABSENT"
  | "APPROVAL_DETECTED"
  | "RANKING_ABSENT"
  | "RANKING_DETECTED"
  | "PRIORITIZATION_ABSENT"
  | "PRIORITIZATION_DETECTED"
  | "SCORING_ABSENT"
  | "SCORING_DETECTED"
  | "RESOURCE_ALLOCATION_ABSENT"
  | "RESOURCE_ALLOCATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "EVENT_CONTRACT_IS_NOT_CONTROL";

export type TruthEventFrameworkReplay = Readonly<{
  replayResult: TruthReplayResult;
  reconstructedEvent: TruthEventContract;
}>;

export type TruthEventFrameworkVisibility = Readonly<{
  event_id: string;
  event_type: TruthEventContractType;
  event_category: TruthEventCategory;
  event_source: TruthEventContractSource;
  event_timestamp: string;
  event_version: string;
  validation_status: TruthEventFrameworkValidationState;
  replay_status: TruthReplayResult;
  readOnly: true;
  tenantScoped: boolean;
  auditable: true;
  replayLinked: true;
}>;

export type TruthEventFrameworkValidation = Readonly<{
  valid: boolean;
  validationState: TruthEventFrameworkValidationState;
  reasonCodes: readonly TruthEventFrameworkReasonCode[];
  identityValid: boolean;
  typeValid: boolean;
  categoryValid: boolean;
  sourceValid: boolean;
  payloadValid: boolean;
  relationshipsValid: boolean;
  evidenceValid: boolean;
  replayValid: boolean;
  failClosed: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  approvalAbsent: boolean;
  rankingAbsent: boolean;
  prioritizationAbsent: boolean;
  scoringAbsent: boolean;
  resourceAllocationAbsent: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
}>;

export type SealedTruthEventFramework = Readonly<{
  request: TruthEventFrameworkRequest;
  event: TruthEventContract;
  validation: TruthEventFrameworkValidation;
  replay: TruthEventFrameworkReplay;
  visibility: TruthEventFrameworkVisibility;
  certification: TruthCertificationState;
  sealed: true;
  readOnly: true;
  executionAuthorized: false;
  approvalAllowed: false;
  rankingAllowed: false;
  prioritizationAllowed: false;
  scoringAllowed: false;
  resourceAllocationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export type TruthEventRecorderKind = "USER" | "SYSTEM" | "GOVERNANCE" | "RUNTIME";

export type TruthEventRecorderValidationState = "VALID" | "INVALID";

export type TruthEventRecordingState = "RECORDED" | "REJECTED";

export type TruthEventRecordingTransactionStatus = "COMMITTED" | "ROLLED_BACK" | "NOT_STARTED";

export type TruthRuntimeEventState =
  | "STARTED"
  | "STOPPED"
  | "RESTRICTED"
  | "SUSPENDED"
  | "RECOVERED"
  | "ERROR"
  | "HEALTH_CHANGED"
  | "BOUNDARY_EVENT";

export interface TruthEventRecorderRequest {
  tenant_id: string;
  now: string;
}

export type TruthEventRecorderPayload = Readonly<Record<string, string | number | boolean>>;

export type TruthEventRecorderRawEvent = Readonly<{
  recordingId?: string;
  missionId: string;
  truthRecordId: string;
  eventType: string;
  eventCategory?: string;
  eventSource?: string;
  eventTimestamp?: string;
  payload: TruthEventRecorderPayload;
  payloadType: string;
  payloadVersion: string;
  evidenceReferenceIds: readonly string[];
  replayReferenceIds: readonly string[];
  replayBundleId?: string;
  parentEventId?: string;
  childEventIds?: readonly string[];
  relatedTruthRecordId?: string;
  relatedLineageRootId?: string;
  actorId?: string;
  actorTenantId?: string;
  action?: string;
  systemSource?: string;
  componentId?: string;
  operation?: string;
  operationResult?: string;
  governanceAuthority?: string;
  governanceRationale?: string;
  governanceScope?: string;
  runtimeIdentity?: string;
  runtimeState?: string;
  runtimeSource?: string;
  runtimeResult?: string;
  unknownFields?: Readonly<Record<string, string | number | boolean>>;
}>;

export interface TruthEventRecordingContract {
  recording_id: string;
  event_id: string;
  tenant_id: string;
  mission_id: string;
  truth_record_id: string;
  event_type: TruthEventContractType;
  event_category: TruthEventCategory;
  event_source: TruthEventContractSource;
  recording_timestamp: string;
  recording_payload: TruthEventRecorderPayload;
  evidence_references: readonly string[];
  replay_references: readonly string[];
  recording_state: TruthEventRecordingState;
}

export interface TruthEventRecorderLedgerEntry {
  recording_id: string;
  recording_kind: TruthEventRecorderKind;
  event_id: string;
  tenant_id: string;
  mission_id: string;
  truth_record_id: string;
  event_type: TruthEventContractType;
  event_category: TruthEventCategory;
  event_source: TruthEventContractSource;
  recording_timestamp: string;
  recording_state: TruthEventRecordingState;
  transaction_status: TruthEventRecordingTransactionStatus;
  validation_status: TruthEventRecorderValidationState;
  failure_reason: string | null;
  event_sequence: number;
  tenant_sequence: number;
  mission_sequence: number;
  storage_commit_sequence: number;
  evidence_references: readonly string[];
  replay_references: readonly string[];
}

export type TruthEventRecorderReasonCode =
  | "RECORDING_ID_PRESENT"
  | "RECORDING_ID_MISSING"
  | "EVENT_ID_PRESENT"
  | "EVENT_ID_MISSING"
  | "EVENT_SOURCE_PRESENT"
  | "EVENT_SOURCE_MISSING"
  | "EVENT_SOURCE_VALID"
  | "EVENT_SOURCE_INVALID"
  | "EVENT_CATEGORY_PRESENT"
  | "EVENT_CATEGORY_MISSING"
  | "EVENT_CATEGORY_VALID"
  | "EVENT_CATEGORY_INVALID"
  | "TENANT_VALID"
  | "TENANT_INVALID"
  | "MISSION_VALID"
  | "MISSION_INVALID"
  | "USER_ACTOR_PRESENT"
  | "USER_ACTOR_MISSING"
  | "USER_ACTOR_TENANT_VALID"
  | "USER_ACTOR_TENANT_FAILED"
  | "USER_ACTION_PRESENT"
  | "USER_ACTION_MISSING"
  | "SYSTEM_SOURCE_VALID"
  | "SYSTEM_SOURCE_INVALID"
  | "SYSTEM_COMPONENT_PRESENT"
  | "SYSTEM_COMPONENT_MISSING"
  | "SYSTEM_OPERATION_PRESENT"
  | "SYSTEM_OPERATION_MISSING"
  | "SYSTEM_RESULT_PRESENT"
  | "SYSTEM_RESULT_MISSING"
  | "GOVERNANCE_AUTHORITY_PRESENT"
  | "GOVERNANCE_AUTHORITY_MISSING"
  | "GOVERNANCE_RATIONALE_PRESENT"
  | "GOVERNANCE_RATIONALE_MISSING"
  | "GOVERNANCE_EVIDENCE_PRESENT"
  | "GOVERNANCE_EVIDENCE_MISSING"
  | "GOVERNANCE_SCOPE_PRESENT"
  | "GOVERNANCE_SCOPE_MISSING"
  | "RUNTIME_IDENTITY_PRESENT"
  | "RUNTIME_IDENTITY_MISSING"
  | "RUNTIME_STATE_VALID"
  | "RUNTIME_STATE_INVALID"
  | "RUNTIME_RESULT_PRESENT"
  | "RUNTIME_RESULT_MISSING"
  | "NORMALIZATION_VALID"
  | "NORMALIZATION_FAILED"
  | "EVENT_CONTRACT_VALID"
  | "EVENT_CONTRACT_MISMATCH"
  | "EVENT_INTEGRITY_VALID"
  | "EVENT_INTEGRITY_INVALID"
  | "EVIDENCE_REFERENCES_VALID"
  | "EVIDENCE_REFERENCES_INVALID"
  | "REPLAY_REFERENCES_VALID"
  | "REPLAY_REFERENCES_INVALID"
  | "ORDERING_VALID"
  | "ORDERING_DUPLICATE_SEQUENCE"
  | "ORDERING_OUT_OF_ORDER"
  | "ORDERING_UNSTABLE"
  | "TRANSACTION_PROTECTED"
  | "PARTIAL_RECORD_DETECTED"
  | "ROLLBACK_FAILED"
  | "TRANSACTION_LEAK_DETECTED"
  | "TENANT_ISOLATION_VALID"
  | "TENANT_ISOLATION_FAILED"
  | "LEDGER_APPEND_ONLY"
  | "LEDGER_IMMUTABLE"
  | "REPLAY_REPRODUCED"
  | "REPLAY_MISMATCH"
  | "REPLAY_INCOMPLETE_EVIDENCE"
  | "REPLAY_UNREPLAYABLE"
  | "VISIBILITY_AVAILABLE"
  | "VISIBILITY_BLOCKED"
  | "OBSERVABILITY_OPERATIONAL"
  | "OBSERVABILITY_GAP_DETECTED"
  | "CERTIFICATION_PASS"
  | "CERTIFICATION_CONDITIONAL_PASS"
  | "CERTIFICATION_FAIL"
  | "FAIL_CLOSED_ENFORCED"
  | "FAIL_OPEN_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "APPROVAL_ABSENT"
  | "APPROVAL_DETECTED"
  | "RANKING_ABSENT"
  | "RANKING_DETECTED"
  | "PRIORITIZATION_ABSENT"
  | "PRIORITIZATION_DETECTED"
  | "SCORING_ABSENT"
  | "SCORING_DETECTED"
  | "RESOURCE_ALLOCATION_ABSENT"
  | "RESOURCE_ALLOCATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "EVENT_RECORDER_IS_NOT_CONTROL";

export type TruthEventRecorderValidation = Readonly<{
  valid: boolean;
  validationState: TruthEventRecorderValidationState;
  reasonCodes: readonly TruthEventRecorderReasonCode[];
  normalizationValid: boolean;
  contractValid: boolean;
  integrityValid: boolean;
  orderingValid: boolean;
  transactionProtected: boolean;
  tenantIsolationValid: boolean;
  replayValid: boolean;
  failClosed: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  approvalAbsent: boolean;
  rankingAbsent: boolean;
  prioritizationAbsent: boolean;
  scoringAbsent: boolean;
  resourceAllocationAbsent: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
}>;

export type TruthEventRecorderReplay = Readonly<{
  replayResult: TruthReplayResult;
  rawEvent: TruthEventRecorderRawEvent;
  normalizedEvent: TruthEventContract;
  reconstructedRecording: TruthEventRecordingContract;
}>;

export type TruthEventRecorderVisibility = Readonly<{
  recording_id: string;
  event_id: string;
  event_category: TruthEventCategory;
  event_source: TruthEventContractSource;
  recording_state: TruthEventRecordingState;
  recording_timestamp: string;
  validation_status: TruthEventRecorderValidationState;
  failure_reason: string | null;
  replay_status: TruthReplayResult;
  readOnly: true;
  tenantScoped: boolean;
  auditable: true;
  replayLinked: true;
}>;

export type TruthEventRecorderObservability = Readonly<{
  events_recorded_total: number;
  user_events_recorded: number;
  system_events_recorded: number;
  governance_events_recorded: number;
  runtime_events_recorded: number;
  event_recording_failures: number;
  normalization_failures: number;
  validation_failures: number;
  transaction_failures: number;
  tenant_scope_failures: number;
  replay_failures: number;
}>;

export type TruthEventRecorderInput = Readonly<{
  request: TruthEventRecorderRequest;
  persistence: SealedTruthPersistenceCertificationGate;
  recorderKind: TruthEventRecorderKind;
  rawEvent: TruthEventRecorderRawEvent;
  knownTenantIds: readonly string[];
  knownMissionIds: readonly string[];
  evidenceCatalog: readonly TruthCatalogReference[];
  replayCatalog: readonly TruthCatalogReference[];
  priorRecordings?: readonly TruthEventRecorderLedgerEntry[];
  priorEventIds?: readonly string[];
  knownParentEventIds?: readonly string[];
  accessTenantId?: string;
  eventSequence?: number;
  tenantSequence?: number;
  missionSequence?: number;
  storageCommitSequence?: number;
  normalizationFailureDetected?: boolean;
  eventContractMismatchDetected?: boolean;
  payloadSchemaValid?: boolean;
  duplicateSequenceDetected?: boolean;
  unstableOrderingDetected?: boolean;
  outOfOrderSequenceDetected?: boolean;
  partialRecordDetected?: boolean;
  rollbackFailed?: boolean;
  transactionLeakDetected?: boolean;
  recordingMismatchDetected?: boolean;
  normalizationMismatchDetected?: boolean;
  sequenceMismatchDetected?: boolean;
  observabilityGapDetected?: boolean;
  remediationDocumented?: boolean;
  executionRequested?: boolean;
  approvalRequested?: boolean;
  rankingRequested?: boolean;
  prioritizationRequested?: boolean;
  scoringRequested?: boolean;
  resourceAllocationRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type SealedTruthEventRecorderFramework = Readonly<{
  request: TruthEventRecorderRequest;
  recorderKind: TruthEventRecorderKind;
  rawEvent: TruthEventRecorderRawEvent;
  normalizedEvent: SealedTruthEventFramework;
  recording: TruthEventRecordingContract;
  ledgerEntry: TruthEventRecorderLedgerEntry;
  validation: TruthEventRecorderValidation;
  replay: TruthEventRecorderReplay;
  visibility: TruthEventRecorderVisibility;
  observability: TruthEventRecorderObservability;
  certification: TruthCertificationState;
  sealed: true;
  readOnly: true;
  executionAuthorized: false;
  approvalAllowed: false;
  rankingAllowed: false;
  prioritizationAllowed: false;
  scoringAllowed: false;
  resourceAllocationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export type TruthOrderingNamespace = "GLOBAL" | "TENANT" | "MISSION" | "TRUTH_RECORD" | "LINEAGE";

export type TruthEventOrderingValidationState = "VALID" | "INVALID";

export type TruthEventOrderingStatus = "ORDERED" | "REJECTED";

export interface TruthEventOrderingRequest {
  tenant_id: string;
  now: string;
}

export interface TruthEventOrderingContract {
  event_id: string;
  tenant_id: string;
  mission_id: string;
  truth_record_id: string;
  event_timestamp: string;
  recorded_timestamp: string;
  write_timestamp: string;
  storage_commit_timestamp: string;
  event_sequence: number;
  tenant_sequence: number;
  mission_sequence: number;
  global_sequence: number;
  ordering_version: string;
}

export type TruthEventOrderingNamespaceAssignments = Readonly<{
  GLOBAL: number;
  TENANT: number;
  MISSION: number;
  TRUTH_RECORD: number;
  LINEAGE: number;
}>;

export type TruthEventOrderingConflictResolution = Readonly<{
  resolutionKey: readonly [number, string, string, string];
  usedStorageCommitSequence: true;
  usedRecordedTimestamp: true;
  usedEventTimestamp: true;
  usedEventId: true;
  deterministic: true;
}>;

export type TruthEventChronology = Readonly<{
  first_event_id: string;
  latest_event_id: string;
  previous_event_id?: string;
  next_event_id?: string;
  event_chain: readonly string[];
  event_gap_detected: boolean;
  chronology_window: readonly string[];
}>;

export interface TruthEventOrderingLedgerEntry {
  event_id: string;
  tenant_id: string;
  mission_id: string;
  truth_record_id: string;
  ordering_status: TruthEventOrderingStatus;
  event_sequence: number;
  tenant_sequence: number;
  mission_sequence: number;
  global_sequence: number;
  ordering_timestamp: string;
  conflict_resolution_key: string;
  chronology_status: "VALID" | "INVALID";
  replay_status: TruthReplayResult;
  failure_reason: string | null;
}

export type TruthEventOrderingReasonCode =
  | "EVENT_SEQUENCE_PRESENT"
  | "EVENT_SEQUENCE_MISSING"
  | "EVENT_SEQUENCE_UNIQUE"
  | "EVENT_SEQUENCE_DUPLICATE"
  | "TENANT_SEQUENCE_PRESENT"
  | "TENANT_SEQUENCE_MISSING"
  | "MISSION_SEQUENCE_PRESENT"
  | "MISSION_SEQUENCE_MISSING"
  | "GLOBAL_SEQUENCE_PRESENT"
  | "GLOBAL_SEQUENCE_MISSING"
  | "TIMESTAMPS_VALID"
  | "TIMESTAMPS_INVALID"
  | "DETERMINISTIC_ASSIGNMENT_VALID"
  | "SEQUENCE_DRIFT_DETECTED"
  | "TEMPORAL_ORDERING_VALID"
  | "CHRONOLOGY_VIOLATION_DETECTED"
  | "NAMESPACE_ASSIGNMENT_VALID"
  | "NAMESPACE_COLLISION_DETECTED"
  | "CONFLICT_RESOLUTION_VALID"
  | "CONFLICT_RESOLUTION_NON_DETERMINISTIC"
  | "CHRONOLOGY_VALID"
  | "CHRONOLOGY_CORRUPTED"
  | "INTEGRITY_VALID"
  | "INTEGRITY_INVALID"
  | "TENANT_ISOLATION_VALID"
  | "TENANT_ISOLATION_FAILED"
  | "QUERY_FRAMEWORK_OPERATIONAL"
  | "QUERY_FRAMEWORK_UNSTABLE"
  | "LEDGER_APPEND_ONLY"
  | "LEDGER_IMMUTABLE"
  | "REPLAY_REPRODUCED"
  | "REPLAY_MISMATCH"
  | "REPLAY_INCOMPLETE_EVIDENCE"
  | "REPLAY_UNREPLAYABLE"
  | "VISIBILITY_AVAILABLE"
  | "VISIBILITY_BLOCKED"
  | "OBSERVABILITY_OPERATIONAL"
  | "OBSERVABILITY_GAP_DETECTED"
  | "CERTIFICATION_PASS"
  | "CERTIFICATION_CONDITIONAL_PASS"
  | "CERTIFICATION_FAIL"
  | "FAIL_CLOSED_ENFORCED"
  | "FAIL_OPEN_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "APPROVAL_ABSENT"
  | "APPROVAL_DETECTED"
  | "RANKING_ABSENT"
  | "RANKING_DETECTED"
  | "PRIORITIZATION_ABSENT"
  | "PRIORITIZATION_DETECTED"
  | "SCORING_ABSENT"
  | "SCORING_DETECTED"
  | "RESOURCE_ALLOCATION_ABSENT"
  | "RESOURCE_ALLOCATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "EVENT_ORDERING_ENGINE_IS_NOT_CONTROL";

export type TruthEventOrderingValidation = Readonly<{
  valid: boolean;
  validationState: TruthEventOrderingValidationState;
  reasonCodes: readonly TruthEventOrderingReasonCode[];
  deterministicOrdering: boolean;
  temporalOrderingValid: boolean;
  namespaceIntegrityValid: boolean;
  chronologyValid: boolean;
  integrityValid: boolean;
  tenantIsolationValid: boolean;
  queryFrameworkOperational: boolean;
  failClosed: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  approvalAbsent: boolean;
  rankingAbsent: boolean;
  prioritizationAbsent: boolean;
  scoringAbsent: boolean;
  resourceAllocationAbsent: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
}>;

export type TruthEventOrderingReplay = Readonly<{
  replayResult: TruthReplayResult;
  reconstructedOrdering: TruthEventOrderingContract;
  chronology: TruthEventChronology;
}>;

export type TruthEventOrderingVisibility = Readonly<{
  event_id: string;
  event_sequence: number;
  tenant_sequence: number;
  mission_sequence: number;
  global_sequence: number;
  event_timestamp: string;
  ordering_status: TruthEventOrderingStatus;
  chronology_status: "VALID" | "INVALID";
  replay_status: TruthReplayResult;
  readOnly: true;
  tenantScoped: boolean;
  auditable: true;
  replayLinked: true;
}>;

export type TruthEventOrderingObservability = Readonly<{
  events_ordered_total: number;
  ordering_conflicts: number;
  conflicts_resolved: number;
  sequence_collisions: number;
  chronology_violations: number;
  ordering_validation_failures: number;
  replay_ordering_failures: number;
  tenant_isolation_failures: number;
}>;

export type TruthEventOrderingQueries = Readonly<{
  by_global_sequence: readonly string[];
  by_tenant_sequence: readonly string[];
  by_mission_sequence: readonly string[];
  by_truth_record_sequence: readonly string[];
  by_lineage_sequence: readonly string[];
  by_time_range: readonly string[];
  by_chronology_window: readonly string[];
}>;

export type TruthEventOrderingInput = Readonly<{
  request: TruthEventOrderingRequest;
  persistence: SealedTruthPersistenceCertificationGate;
  recorder: SealedTruthEventRecorderFramework;
  priorOrderings?: readonly TruthEventOrderingLedgerEntry[];
  lineageRootId?: string;
  accessTenantId?: string;
  writeTimestamp?: string;
  storageCommitTimestamp?: string;
  eventSequence?: number;
  tenantSequence?: number;
  missionSequence?: number;
  globalSequence?: number;
  lineageSequence?: number;
  sequenceDriftDetected?: boolean;
  chronologyViolationDetected?: boolean;
  namespaceCollisionDetected?: boolean;
  nonDeterministicResolutionDetected?: boolean;
  chronologyCorruptionDetected?: boolean;
  replayMismatchDetected?: boolean;
  queryInstabilityDetected?: boolean;
  crossTenantSequenceLeakageDetected?: boolean;
  crossTenantChronologyAccessDetected?: boolean;
  observabilityGapDetected?: boolean;
  remediationDocumented?: boolean;
  executionRequested?: boolean;
  approvalRequested?: boolean;
  rankingRequested?: boolean;
  prioritizationRequested?: boolean;
  scoringRequested?: boolean;
  resourceAllocationRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type SealedTruthEventOrderingFramework = Readonly<{
  request: TruthEventOrderingRequest;
  recorder: SealedTruthEventRecorderFramework;
  ordering: TruthEventOrderingContract;
  namespaces: TruthEventOrderingNamespaceAssignments;
  conflictResolution: TruthEventOrderingConflictResolution;
  chronology: TruthEventChronology;
  ledgerEntry: TruthEventOrderingLedgerEntry;
  queries: TruthEventOrderingQueries;
  validation: TruthEventOrderingValidation;
  replay: TruthEventOrderingReplay;
  visibility: TruthEventOrderingVisibility;
  observability: TruthEventOrderingObservability;
  certification: TruthCertificationState;
  sealed: true;
  readOnly: true;
  executionAuthorized: false;
  approvalAllowed: false;
  rankingAllowed: false;
  prioritizationAllowed: false;
  scoringAllowed: false;
  resourceAllocationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export type TruthEventCorrelationType =
  | "RELATED_TO"
  | "SAME_LINEAGE"
  | "SAME_MISSION"
  | "SAME_EVIDENCE"
  | "SAME_REPLAY"
  | "SAME_RUNTIME"
  | "SAME_ESCALATION"
  | "SAME_GOVERNANCE_SCOPE"
  | "CAUSED_BY"
  | "RESULTED_IN"
  | "TRIGGERED_BY"
  | "TRIGGERED"
  | "BLOCKED_BY"
  | "ESCALATED_FROM"
  | "ESCALATED_TO"
  | "AUTHORIZED_BY"
  | "RESTRICTED_BY"
  | "SUPERSEDED_BY";

export type TruthCorrelationConfidence = "LOW" | "MEDIUM" | "HIGH" | "CERTAIN";

export type TruthCausalChainState = "ACTIVE" | "TERMINAL" | "BLOCKED";

export type TruthEventCorrelationValidationState = "VALID" | "INVALID";

export interface TruthEventCorrelationRequest {
  tenant_id: string;
  now: string;
}

export interface TruthEventCorrelationContract {
  correlation_id: string;
  tenant_id: string;
  mission_id: string;
  source_event_id: string;
  target_event_id: string;
  correlation_type: TruthEventCorrelationType;
  correlation_reason: string;
  correlation_confidence: TruthCorrelationConfidence;
  correlation_timestamp: string;
  evidence_references: readonly string[];
  replay_references: readonly string[];
}

export type TruthEventCausalChain = Readonly<{
  chain_id: string;
  root_event_id: string;
  current_event_id: string;
  previous_event_id?: string;
  next_event_ids: readonly string[];
  chain_depth: number;
  chain_state: TruthCausalChainState;
}>;

export interface TruthEventCorrelationLedgerEntry {
  correlation_id: string;
  tenant_id: string;
  mission_id: string;
  source_event_id: string;
  target_event_id: string;
  correlation_type: TruthEventCorrelationType;
  chain_id: string;
  validation_status: TruthEventCorrelationValidationState;
  replay_status: TruthReplayResult;
  failure_reason: string | null;
}

export type TruthEventCorrelationReasonCode =
  | "SOURCE_EVENT_PRESENT"
  | "SOURCE_EVENT_MISSING"
  | "SOURCE_EVENT_KNOWN"
  | "SOURCE_EVENT_UNKNOWN"
  | "TARGET_EVENT_PRESENT"
  | "TARGET_EVENT_MISSING"
  | "TARGET_EVENT_KNOWN"
  | "TARGET_EVENT_UNKNOWN"
  | "CORRELATION_TYPE_PRESENT"
  | "CORRELATION_TYPE_MISSING"
  | "CORRELATION_TYPE_VALID"
  | "CORRELATION_TYPE_INVALID"
  | "RELATED_LINK_VALID"
  | "RELATED_LINK_INVALID"
  | "CAUSAL_CHAIN_VALID"
  | "CAUSAL_CHAIN_BROKEN"
  | "CAUSAL_ROOT_PRESENT"
  | "CAUSAL_ROOT_MISSING"
  | "CAUSAL_DIRECTION_VALID"
  | "CAUSAL_DIRECTION_INVALID"
  | "CAUSAL_CYCLE_ABSENT"
  | "CAUSAL_CYCLE_DETECTED"
  | "RULES_DETERMINISTIC"
  | "RULES_NON_DETERMINISTIC"
  | "CONFIDENCE_VALID"
  | "CONFIDENCE_INVALID"
  | "CONFIDENCE_RATIONALE_PRESENT"
  | "CONFIDENCE_RATIONALE_MISSING"
  | "EVIDENCE_REFERENCES_VALID"
  | "EVIDENCE_REFERENCES_INVALID"
  | "REPLAY_REFERENCES_VALID"
  | "REPLAY_REFERENCES_INVALID"
  | "ORDERING_COMPATIBLE"
  | "ORDERING_MISMATCH"
  | "TENANT_ISOLATION_VALID"
  | "TENANT_ISOLATION_FAILED"
  | "QUERY_FRAMEWORK_OPERATIONAL"
  | "QUERY_FRAMEWORK_UNSTABLE"
  | "LEDGER_APPEND_ONLY"
  | "LEDGER_IMMUTABLE"
  | "REPLAY_REPRODUCED"
  | "REPLAY_MISMATCH"
  | "REPLAY_INCOMPLETE_EVIDENCE"
  | "REPLAY_UNREPLAYABLE"
  | "VISIBILITY_AVAILABLE"
  | "VISIBILITY_BLOCKED"
  | "OBSERVABILITY_OPERATIONAL"
  | "OBSERVABILITY_GAP_DETECTED"
  | "CERTIFICATION_PASS"
  | "CERTIFICATION_CONDITIONAL_PASS"
  | "CERTIFICATION_FAIL"
  | "FAIL_CLOSED_ENFORCED"
  | "FAIL_OPEN_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "APPROVAL_ABSENT"
  | "APPROVAL_DETECTED"
  | "RANKING_ABSENT"
  | "RANKING_DETECTED"
  | "PRIORITIZATION_ABSENT"
  | "PRIORITIZATION_DETECTED"
  | "SCORING_ABSENT"
  | "SCORING_DETECTED"
  | "RESOURCE_ALLOCATION_ABSENT"
  | "RESOURCE_ALLOCATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "EVENT_CORRELATION_ENGINE_IS_NOT_CONTROL";

export type TruthEventCorrelationValidation = Readonly<{
  valid: boolean;
  validationState: TruthEventCorrelationValidationState;
  reasonCodes: readonly TruthEventCorrelationReasonCode[];
  relatedLinkValid: boolean;
  causalChainValid: boolean;
  confidenceValid: boolean;
  orderingCompatible: boolean;
  tenantIsolationValid: boolean;
  queryFrameworkOperational: boolean;
  failClosed: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  approvalAbsent: boolean;
  rankingAbsent: boolean;
  prioritizationAbsent: boolean;
  scoringAbsent: boolean;
  resourceAllocationAbsent: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
}>;

export type TruthEventCorrelationReplay = Readonly<{
  replayResult: TruthReplayResult;
  reconstructedCorrelation: TruthEventCorrelationContract;
  causalChain: TruthEventCausalChain;
}>;

export type TruthEventCorrelationQueries = Readonly<{
  related_by_event_id: readonly string[];
  causal_chain_by_chain_id: readonly string[];
  causal_root_by_event_id: readonly string[];
  downstream_effects_by_event_id: readonly string[];
  upstream_causes_by_event_id: readonly string[];
  governance_linked_events: readonly string[];
  replay_linked_events: readonly string[];
  evidence_linked_events: readonly string[];
}>;

export type TruthEventCorrelationVisibility = Readonly<{
  correlation_id: string;
  source_event_id: string;
  target_event_id: string;
  correlation_type: TruthEventCorrelationType;
  correlation_confidence: TruthCorrelationConfidence;
  correlation_reason: string;
  chain_id: string;
  root_event_id: string;
  chain_depth: number;
  validation_status: TruthEventCorrelationValidationState;
  replay_status: TruthReplayResult;
  readOnly: true;
  tenantScoped: boolean;
  auditable: true;
  replayLinked: true;
}>;

export type TruthEventCorrelationObservability = Readonly<{
  correlations_created_total: number;
  related_event_links_total: number;
  causal_chains_created_total: number;
  correlation_validation_failures: number;
  causal_chain_failures: number;
  cycle_detection_failures: number;
  cross_tenant_correlation_failures: number;
  correlation_replay_failures: number;
}>;

export type TruthEventCorrelationInput = Readonly<{
  request: TruthEventCorrelationRequest;
  persistence: SealedTruthPersistenceCertificationGate;
  sourceOrdering: SealedTruthEventOrderingFramework;
  targetOrdering: SealedTruthEventOrderingFramework;
  knownEventIds?: readonly string[];
  knownChainIds?: readonly string[];
  lineageRootId?: string;
  correlationType?: TruthEventCorrelationType;
  correlationReason?: string;
  confidenceRationale?: string;
  priorCorrelations?: readonly TruthEventCorrelationLedgerEntry[];
  accessTenantId?: string;
  invalidRelationshipDetected?: boolean;
  invalidCausalDirectionDetected?: boolean;
  causalCycleDetected?: boolean;
  brokenCausalChainDetected?: boolean;
  nonDeterministicRuleDetected?: boolean;
  missingConfidenceRationale?: boolean;
  unsupportedConfidenceState?: boolean;
  orderingMismatchDetected?: boolean;
  replayMismatchDetected?: boolean;
  queryInstabilityDetected?: boolean;
  crossTenantCorrelationDetected?: boolean;
  crossTenantCausalChainDetected?: boolean;
  observabilityGapDetected?: boolean;
  remediationDocumented?: boolean;
  executionRequested?: boolean;
  approvalRequested?: boolean;
  rankingRequested?: boolean;
  prioritizationRequested?: boolean;
  scoringRequested?: boolean;
  resourceAllocationRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type SealedTruthEventCorrelationFramework = Readonly<{
  request: TruthEventCorrelationRequest;
  sourceOrdering: SealedTruthEventOrderingFramework;
  targetOrdering: SealedTruthEventOrderingFramework;
  correlation: TruthEventCorrelationContract;
  causalChain: TruthEventCausalChain;
  queries: TruthEventCorrelationQueries;
  ledgerEntry: TruthEventCorrelationLedgerEntry;
  validation: TruthEventCorrelationValidation;
  replay: TruthEventCorrelationReplay;
  visibility: TruthEventCorrelationVisibility;
  observability: TruthEventCorrelationObservability;
  certification: TruthCertificationState;
  sealed: true;
  readOnly: true;
  executionAuthorized: false;
  approvalAllowed: false;
  rankingAllowed: false;
  prioritizationAllowed: false;
  scoringAllowed: false;
  resourceAllocationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export type TruthEventInfrastructureCertificationState =
  | "EVENT_INFRASTRUCTURE_CERTIFIED"
  | "EVENT_INFRASTRUCTURE_CONDITIONAL"
  | "EVENT_INFRASTRUCTURE_FAILED";

export type TruthEventCertificationDomain =
  | "6C.1 Event Contract"
  | "6C.2 Event Recorder"
  | "6C.3 Event Ordering Engine"
  | "6C.4 Event Correlation Engine"
  | "Replay Preservation"
  | "Tenant Isolation"
  | "Governance Compliance"
  | "Operator Visibility";

export interface TruthEventCertificationRequest {
  tenant_id: string;
  now: string;
}

export interface TruthEventCertificationContract {
  certification_id: string;
  certification_timestamp: string;
  event_infrastructure_version: string;
  certification_scope: readonly TruthEventCertificationDomain[];
  certification_state: TruthCertificationState;
  certification_reason: string;
  certification_authority: string;
  evidence_references: readonly string[];
  replay_references: readonly string[];
}

export type TruthEventCertificationValidationState = "VALID" | "INVALID";

export type TruthEventCertificationReasonCode =
  | "CERTIFICATION_SCOPE_PRESENT"
  | "CERTIFICATION_SCOPE_MISSING"
  | "CERTIFICATION_AUTHORITY_PRESENT"
  | "CERTIFICATION_AUTHORITY_MISSING"
  | "EVIDENCE_REFERENCES_PRESENT"
  | "EVIDENCE_REFERENCES_MISSING"
  | "REPLAY_REFERENCES_PRESENT"
  | "REPLAY_REFERENCES_MISSING"
  | "EVENT_CONTRACT_CERTIFIED"
  | "EVENT_CONTRACT_FAILED"
  | "EVENT_RECORDER_CERTIFIED"
  | "EVENT_RECORDER_FAILED"
  | "EVENT_ORDERING_CERTIFIED"
  | "EVENT_ORDERING_FAILED"
  | "EVENT_CORRELATION_CERTIFIED"
  | "EVENT_CORRELATION_FAILED"
  | "EVENT_REPLAY_CERTIFIED"
  | "EVENT_REPLAY_FAILED"
  | "TENANT_ISOLATION_CERTIFIED"
  | "TENANT_ISOLATION_FAILED"
  | "GOVERNANCE_CERTIFIED"
  | "GOVERNANCE_FAILED"
  | "VISIBILITY_CERTIFIED"
  | "VISIBILITY_FAILED"
  | "DECISION_ENGINE_PASS"
  | "DECISION_ENGINE_CONDITIONAL"
  | "DECISION_ENGINE_FAIL"
  | "LEDGER_APPEND_ONLY"
  | "LEDGER_IMMUTABLE"
  | "REPLAY_REPRODUCED"
  | "REPLAY_MISMATCH"
  | "REPLAY_INCOMPLETE_EVIDENCE"
  | "REPLAY_UNREPLAYABLE"
  | "VISIBILITY_AVAILABLE"
  | "VISIBILITY_BLOCKED"
  | "ANALYTICS_OPERATIONAL"
  | "ANALYTICS_FAILED"
  | "FAIL_CLOSED_ENFORCED"
  | "FAIL_OPEN_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "APPROVAL_ABSENT"
  | "APPROVAL_DETECTED"
  | "RANKING_ABSENT"
  | "RANKING_DETECTED"
  | "PRIORITIZATION_ABSENT"
  | "PRIORITIZATION_DETECTED"
  | "SCORING_ABSENT"
  | "SCORING_DETECTED"
  | "RESOURCE_ALLOCATION_ABSENT"
  | "RESOURCE_ALLOCATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "EVENT_CERTIFICATION_GATE_IS_NOT_CONTROL";

export interface TruthEventCertificationLedgerEntry {
  certification_id: string;
  tenant_id: string;
  certification_state: TruthCertificationState;
  completion_gate: TruthEventInfrastructureCertificationState;
  replay_status: TruthReplayResult;
  failed_components: readonly string[];
  required_actions: readonly string[];
}

export type TruthEventCertificationReplay = Readonly<{
  replayResult: TruthReplayResult;
  executedTests: readonly string[];
  decisionState: TruthCertificationState;
}>;

export type TruthEventCertificationVisibility = Readonly<{
  certification_state: TruthCertificationState;
  event_infrastructure_version: string;
  certified_components: readonly string[];
  failed_components: readonly string[];
  replay_status: TruthReplayResult;
  tenant_status: "PASS" | "FAIL";
  governance_status: "PASS" | "FAIL";
  visibility_status: "PASS" | "FAIL";
  required_actions: readonly string[];
  certification_timestamp: string;
  certification_authority: string;
  readOnly: true;
  tenantScoped: boolean;
  auditable: true;
  replayLinked: true;
}>;

export type TruthEventCertificationAnalytics = Readonly<{
  event_certifications_total: number;
  event_pass_total: number;
  event_conditional_total: number;
  event_fail_total: number;
  event_contract_failures: number;
  event_recorder_failures: number;
  event_ordering_failures: number;
  event_correlation_failures: number;
  event_replay_failures: number;
  tenant_isolation_failures: number;
  governance_failures: number;
  visibility_failures: number;
  certification_replay_failures: number;
}>;

export type TruthEventCertificationValidation = Readonly<{
  valid: boolean;
  validationState: TruthEventCertificationValidationState;
  reasonCodes: readonly TruthEventCertificationReasonCode[];
  scopeValid: boolean;
  authorityValid: boolean;
  evidenceValid: boolean;
  replayReferencesValid: boolean;
  eventContractCertified: boolean;
  eventRecorderCertified: boolean;
  eventOrderingCertified: boolean;
  eventCorrelationCertified: boolean;
  replayCertified: boolean;
  tenantIsolationCertified: boolean;
  governanceCertified: boolean;
  visibilityCertified: boolean;
  failClosed: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  approvalAbsent: boolean;
  rankingAbsent: boolean;
  prioritizationAbsent: boolean;
  scoringAbsent: boolean;
  resourceAllocationAbsent: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
}>;

export type TruthEventCertificationInput = Readonly<{
  request: TruthEventCertificationRequest;
  persistence: SealedTruthPersistenceCertificationGate;
  eventContract: SealedTruthEventFramework;
  eventRecorder: SealedTruthEventRecorderFramework;
  eventOrdering: SealedTruthEventOrderingFramework;
  eventCorrelation: SealedTruthEventCorrelationFramework;
  certificationAuthority: string;
  certificationReason: string;
  certificationScope?: readonly TruthEventCertificationDomain[];
  evidenceReferences?: readonly string[];
  replayReferences?: readonly string[];
  accessTenantId?: string;
  observabilityGapDetected?: boolean;
  analyticsGapDetected?: boolean;
  remediationPlanExists?: boolean;
  governanceApproved?: boolean;
  governanceBypassDetected?: boolean;
  hiddenFailureDetected?: boolean;
  executionRequested?: boolean;
  approvalRequested?: boolean;
  rankingRequested?: boolean;
  prioritizationRequested?: boolean;
  scoringRequested?: boolean;
  resourceAllocationRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type SealedTruthEventCertificationGate = Readonly<{
  request: TruthEventCertificationRequest;
  certification: TruthEventCertificationContract;
  validation: TruthEventCertificationValidation;
  replay: TruthEventCertificationReplay;
  visibility: TruthEventCertificationVisibility;
  analytics: TruthEventCertificationAnalytics;
  ledgerEntry: TruthEventCertificationLedgerEntry;
  completionGate: TruthEventInfrastructureCertificationState;
  sealed: true;
  readOnly: true;
  executionAuthorized: false;
  approvalAllowed: false;
  rankingAllowed: false;
  prioritizationAllowed: false;
  scoringAllowed: false;
  resourceAllocationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export type TruthEvidenceType =
  | "DOCUMENT"
  | "DATASET"
  | "SYSTEM_LOG"
  | "EVENT_RECORD"
  | "TRUTH_RECORD"
  | "GOVERNANCE_RECORD"
  | "CERTIFICATION_RECORD"
  | "RUNTIME_RECORD"
  | "AUDIT_RECORD"
  | "OPERATOR_INPUT"
  | "EXTERNAL_REFERENCE";

export type TruthEvidenceCategory =
  | "TRUTH"
  | "EVENT"
  | "GOVERNANCE"
  | "CERTIFICATION"
  | "RUNTIME"
  | "AUDIT"
  | "SECURITY"
  | "OPERATOR"
  | "EXTERNAL";

export type TruthEvidenceSource =
  | "MISSION_CONTROL"
  | "WRITE_ENGINE"
  | "READ_ENGINE"
  | "EVENT_RECORDER"
  | "GOVERNANCE_ENGINE"
  | "CERTIFICATION_ENGINE"
  | "REPLAY_ENGINE"
  | "OPERATOR"
  | "EXTERNAL_SYSTEM";

export type TruthEvidenceRelationshipType =
  | "SUPPORTS"
  | "REFUTES"
  | "DERIVED_FROM"
  | "GENERATED_FROM"
  | "ATTACHED_TO"
  | "VALIDATES"
  | "CORROBORATES"
  | "SUPERSEDES";

export interface TruthEvidenceContractRequest {
  tenant_id: string;
  now: string;
}

export interface TruthEvidencePayload {
  payload_type: string;
  payload_version: string;
  payload_data: Readonly<Record<string, string | number | boolean>>;
  payload_hash: string;
  payload_size: number;
}

export interface TruthEvidenceProvenance {
  origin_system: string;
  origin_reference: string;
  collection_method: string;
  collection_timestamp: string;
  collector_identity: string;
  provenance_hash: string;
}

export interface TruthEvidenceRelationship {
  source_evidence_id: string;
  target_evidence_id: string;
  relationship_type: TruthEvidenceRelationshipType;
  relationship_reason: string;
}

export interface TruthEvidenceContract {
  evidence_id: string;
  tenant_id: string;
  mission_id: string;
  evidence_type: TruthEvidenceType;
  evidence_category: TruthEvidenceCategory;
  evidence_source: TruthEvidenceSource;
  evidence_timestamp: string;
  evidence_version: string;
  evidence_payload: TruthEvidencePayload;
  evidence_hash: string;
  created_timestamp: string;
  provenance: TruthEvidenceProvenance;
  relationships: readonly TruthEvidenceRelationship[];
  replay_reference_ids: readonly string[];
  replay_bundle_id?: string;
  replay_hash: string;
}

export type TruthEvidenceContractValidationState = "VALID" | "INVALID";

export type TruthEvidenceContractReasonCode =
  | "EVIDENCE_ID_PRESENT"
  | "EVIDENCE_ID_MISSING"
  | "EVIDENCE_ID_UNIQUE"
  | "EVIDENCE_ID_DUPLICATE"
  | "EVIDENCE_ID_IMMUTABLE"
  | "EVIDENCE_ID_MUTATED"
  | "EVIDENCE_HASH_VALID"
  | "EVIDENCE_HASH_MISMATCH"
  | "EVIDENCE_TYPE_PRESENT"
  | "EVIDENCE_TYPE_MISSING"
  | "EVIDENCE_TYPE_VALID"
  | "EVIDENCE_TYPE_INVALID"
  | "EVIDENCE_CATEGORY_VALID"
  | "EVIDENCE_CATEGORY_MISMATCH"
  | "EVIDENCE_SOURCE_PRESENT"
  | "EVIDENCE_SOURCE_MISSING"
  | "EVIDENCE_SOURCE_VALID"
  | "EVIDENCE_SOURCE_INVALID"
  | "EVIDENCE_TIMESTAMP_VALID"
  | "EVIDENCE_TIMESTAMP_INVALID"
  | "PAYLOAD_SCHEMA_VALID"
  | "PAYLOAD_SCHEMA_INVALID"
  | "PAYLOAD_HASH_VALID"
  | "PAYLOAD_HASH_MISMATCH"
  | "PROVENANCE_VALID"
  | "PROVENANCE_MISSING"
  | "PROVENANCE_HASH_VALID"
  | "PROVENANCE_HASH_MISMATCH"
  | "RELATIONSHIPS_VALID"
  | "RELATIONSHIPS_INVALID"
  | "RELATIONSHIP_TENANT_VALID"
  | "RELATIONSHIP_TENANT_FAILED"
  | "REPLAY_BINDING_VALID"
  | "REPLAY_BINDING_INVALID"
  | "REPLAY_HASH_VALID"
  | "REPLAY_HASH_MISMATCH"
  | "EVIDENCE_REPLAY_REPRODUCED"
  | "EVIDENCE_REPLAY_MISMATCH"
  | "EVIDENCE_REPLAY_INCOMPLETE_EVIDENCE"
  | "EVIDENCE_REPLAY_UNREPLAYABLE"
  | "VISIBILITY_AVAILABLE"
  | "VISIBILITY_BLOCKED"
  | "CERTIFICATION_PASS"
  | "CERTIFICATION_CONDITIONAL_PASS"
  | "CERTIFICATION_FAIL"
  | "FAIL_CLOSED_ENFORCED"
  | "FAIL_OPEN_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "APPROVAL_ABSENT"
  | "APPROVAL_DETECTED"
  | "RANKING_ABSENT"
  | "RANKING_DETECTED"
  | "PRIORITIZATION_ABSENT"
  | "PRIORITIZATION_DETECTED"
  | "SCORING_ABSENT"
  | "SCORING_DETECTED"
  | "RESOURCE_ALLOCATION_ABSENT"
  | "RESOURCE_ALLOCATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "EVIDENCE_CONTRACT_IS_NOT_CONTROL";

export type TruthEvidenceContractValidation = Readonly<{
  valid: boolean;
  validationState: TruthEvidenceContractValidationState;
  reasonCodes: readonly TruthEvidenceContractReasonCode[];
  identityValid: boolean;
  typeValid: boolean;
  categoryValid: boolean;
  sourceValid: boolean;
  payloadValid: boolean;
  provenanceValid: boolean;
  relationshipsValid: boolean;
  replayValid: boolean;
  failClosed: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  approvalAbsent: boolean;
  rankingAbsent: boolean;
  prioritizationAbsent: boolean;
  scoringAbsent: boolean;
  resourceAllocationAbsent: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
}>;

export type TruthEvidenceContractReplay = Readonly<{
  replayResult: TruthReplayResult;
  reconstructedEvidence: TruthEvidenceContract;
}>;

export type TruthEvidenceContractVisibility = Readonly<{
  evidence_id: string;
  evidence_type: TruthEvidenceType;
  evidence_category: TruthEvidenceCategory;
  evidence_source: TruthEvidenceSource;
  evidence_timestamp: string;
  evidence_version: string;
  validation_status: TruthEvidenceContractValidationState;
  provenance_status: TruthEvidenceContractValidationState;
  replay_status: TruthReplayResult;
  readOnly: true;
  tenantScoped: boolean;
  auditable: true;
  replayLinked: true;
}>;

export type TruthEvidenceContractInput = Readonly<{
  request: TruthEvidenceContractRequest;
  evidenceId?: string;
  missionId: string;
  evidenceType: TruthEvidenceType;
  evidenceCategory: TruthEvidenceCategory;
  evidenceSource: TruthEvidenceSource;
  evidenceTimestamp?: string;
  evidenceVersion?: string;
  evidencePayload: Readonly<Record<string, string | number | boolean>>;
  payloadType: string;
  payloadVersion: string;
  provenance: Omit<TruthEvidenceProvenance, "provenance_hash">;
  relationships?: readonly TruthEvidenceRelationship[];
  replayReferenceIds: readonly string[];
  replayBundleId?: string;
  priorEvidenceIds?: readonly string[];
  knownEvidenceIds?: readonly string[];
  typeCategoryMatches?: boolean;
  payloadSchemaValid?: boolean;
  provenanceValid?: boolean;
  replayReferencesResolvable?: boolean;
  identityMutated?: boolean;
  hashMismatchDetected?: boolean;
  payloadHashMismatchDetected?: boolean;
  provenanceHashMismatchDetected?: boolean;
  replayHashMismatchDetected?: boolean;
  crossTenantRelationshipDetected?: boolean;
  replayMismatchDetected?: boolean;
  accessTenantId?: string;
  observabilityGapDetected?: boolean;
  remediationDocumented?: boolean;
  executionRequested?: boolean;
  approvalRequested?: boolean;
  rankingRequested?: boolean;
  prioritizationRequested?: boolean;
  scoringRequested?: boolean;
  resourceAllocationRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type SealedTruthEvidenceContract = Readonly<{
  request: TruthEvidenceContractRequest;
  evidence: TruthEvidenceContract;
  validation: TruthEvidenceContractValidation;
  replay: TruthEvidenceContractReplay;
  visibility: TruthEvidenceContractVisibility;
  certification: TruthCertificationState;
  sealed: true;
  readOnly: true;
  executionAuthorized: false;
  approvalAllowed: false;
  rankingAllowed: false;
  prioritizationAllowed: false;
  scoringAllowed: false;
  resourceAllocationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export type TruthEvidenceRegistrationType =
  | "INPUT"
  | "REFERENCE"
  | "SUPPORTING_SIGNAL"
  | "OBSERVATION";

export type TruthEvidenceRegistrationState = "REGISTERED" | "REJECTED";

export type TruthEvidenceRegistrationValidationState = "VALID" | "INVALID";

export type TruthEvidenceRegistrationTransactionStatus = "COMMITTED" | "ROLLED_BACK" | "NOT_STARTED";

export interface TruthEvidenceRegistrationRequest {
  tenant_id: string;
  now: string;
}

export interface TruthEvidenceRegistrationContract {
  registration_id: string;
  evidence_id: string;
  tenant_id: string;
  mission_id: string;
  registration_timestamp: string;
  registration_source: TruthEvidenceSource;
  registration_type: TruthEvidenceRegistrationType;
  registration_state: TruthEvidenceRegistrationState;
  evidence_hash: string;
  evidence_references: readonly string[];
  replay_references: readonly string[];
}

export interface TruthEvidenceRegistrationLedgerEntry {
  registration_id: string;
  evidence_id: string;
  tenant_id: string;
  mission_id: string;
  registration_source: TruthEvidenceSource;
  registration_type: TruthEvidenceRegistrationType;
  registration_state: TruthEvidenceRegistrationState;
  validation_status: TruthEvidenceRegistrationValidationState;
  transaction_status: TruthEvidenceRegistrationTransactionStatus;
  failure_reason: string | null;
}

export type TruthEvidenceRegistrationReasonCode =
  | "REGISTRATION_ID_PRESENT"
  | "REGISTRATION_ID_MISSING"
  | "EVIDENCE_ID_PRESENT"
  | "EVIDENCE_ID_MISSING"
  | "REGISTRATION_TYPE_PRESENT"
  | "REGISTRATION_TYPE_MISSING"
  | "REGISTRATION_TYPE_VALID"
  | "REGISTRATION_TYPE_INVALID"
  | "REGISTRATION_SOURCE_PRESENT"
  | "REGISTRATION_SOURCE_MISSING"
  | "REGISTRATION_SOURCE_VALID"
  | "REGISTRATION_SOURCE_INVALID"
  | "INPUT_SOURCE_PRESENT"
  | "INPUT_SOURCE_MISSING"
  | "INPUT_TENANT_PRESENT"
  | "INPUT_TENANT_MISSING"
  | "INPUT_PAYLOAD_PRESENT"
  | "INPUT_PAYLOAD_MISSING"
  | "REFERENCE_RESOLVABLE"
  | "REFERENCE_UNRESOLVABLE"
  | "REFERENCE_TARGET_PRESENT"
  | "REFERENCE_TARGET_MISSING"
  | "SIGNAL_TYPE_VALID"
  | "SIGNAL_TYPE_INVALID"
  | "SIGNAL_SOURCE_PRESENT"
  | "SIGNAL_SOURCE_MISSING"
  | "OBSERVATION_CONTEXT_PRESENT"
  | "OBSERVATION_CONTEXT_MISSING"
  | "OBSERVATION_SOURCE_PRESENT"
  | "OBSERVATION_SOURCE_MISSING"
  | "NORMALIZATION_VALID"
  | "NORMALIZATION_FAILED"
  | "CLASSIFICATION_ASSIGNED"
  | "CLASSIFICATION_INVALID"
  | "CLASSIFICATION_MULTIPLE_DETECTED"
  | "INTEGRITY_VALID"
  | "INTEGRITY_INVALID"
  | "TRANSACTION_PROTECTED"
  | "PARTIAL_REGISTRATION_DETECTED"
  | "ROLLBACK_FAILED"
  | "TENANT_ISOLATION_VALID"
  | "TENANT_ISOLATION_FAILED"
  | "REPLAY_REPRODUCED"
  | "REPLAY_MISMATCH"
  | "REPLAY_INCOMPLETE_EVIDENCE"
  | "REPLAY_UNREPLAYABLE"
  | "VISIBILITY_AVAILABLE"
  | "VISIBILITY_BLOCKED"
  | "OBSERVABILITY_OPERATIONAL"
  | "OBSERVABILITY_GAP_DETECTED"
  | "CERTIFICATION_PASS"
  | "CERTIFICATION_CONDITIONAL_PASS"
  | "CERTIFICATION_FAIL"
  | "FAIL_CLOSED_ENFORCED"
  | "FAIL_OPEN_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "APPROVAL_ABSENT"
  | "APPROVAL_DETECTED"
  | "RANKING_ABSENT"
  | "RANKING_DETECTED"
  | "PRIORITIZATION_ABSENT"
  | "PRIORITIZATION_DETECTED"
  | "SCORING_ABSENT"
  | "SCORING_DETECTED"
  | "RESOURCE_ALLOCATION_ABSENT"
  | "RESOURCE_ALLOCATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "EVIDENCE_REGISTRATION_IS_NOT_CONTROL";

export type TruthEvidenceRegistrationValidation = Readonly<{
  valid: boolean;
  validationState: TruthEvidenceRegistrationValidationState;
  reasonCodes: readonly TruthEvidenceRegistrationReasonCode[];
  normalizationValid: boolean;
  classificationValid: boolean;
  integrityValid: boolean;
  transactionProtected: boolean;
  tenantIsolationValid: boolean;
  replayValid: boolean;
  failClosed: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  approvalAbsent: boolean;
  rankingAbsent: boolean;
  prioritizationAbsent: boolean;
  scoringAbsent: boolean;
  resourceAllocationAbsent: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
}>;

export type TruthEvidenceRegistrationReplay = Readonly<{
  replayResult: TruthReplayResult;
  normalizedEvidence: TruthEvidenceContract;
  reconstructedRegistration: TruthEvidenceRegistrationContract;
}>;

export type TruthEvidenceRegistrationVisibility = Readonly<{
  registration_id: string;
  evidence_id: string;
  registration_type: TruthEvidenceRegistrationType;
  registration_state: TruthEvidenceRegistrationState;
  registration_source: TruthEvidenceSource;
  classification: TruthEvidenceRegistrationType;
  validation_status: TruthEvidenceRegistrationValidationState;
  replay_status: TruthReplayResult;
  timestamp: string;
  readOnly: true;
  tenantScoped: boolean;
  auditable: true;
  replayLinked: true;
}>;

export type TruthEvidenceRegistrationObservability = Readonly<{
  registrations_total: number;
  inputs_registered: number;
  references_registered: number;
  signals_registered: number;
  observations_registered: number;
  validation_failures: number;
  normalization_failures: number;
  transaction_failures: number;
  tenant_isolation_failures: number;
  registration_replay_failures: number;
}>;

export type TruthEvidenceRegistrationInput = Readonly<{
  request: TruthEvidenceRegistrationRequest;
  evidence: SealedTruthEvidenceContract;
  registrationId?: string;
  registrationSource: TruthEvidenceSource;
  registrationType: TruthEvidenceRegistrationType;
  evidenceReferences?: readonly string[];
  replayReferences?: readonly string[];
  priorRegistrations?: readonly TruthEvidenceRegistrationLedgerEntry[];
  knownReferenceTargets?: readonly string[];
  signalType?: string;
  observationContext?: string;
  observationScope?: string;
  accessTenantId?: string;
  normalizationFailureDetected?: boolean;
  evidenceContractMismatchDetected?: boolean;
  unknownClassificationDetected?: boolean;
  multipleClassificationsDetected?: boolean;
  invalidPayloadDetected?: boolean;
  unresolvableReferenceDetected?: boolean;
  crossTenantRegistrationDetected?: boolean;
  crossTenantReferenceDetected?: boolean;
  partialRegistrationDetected?: boolean;
  rollbackFailed?: boolean;
  replayMismatchDetected?: boolean;
  observabilityGapDetected?: boolean;
  remediationDocumented?: boolean;
  executionRequested?: boolean;
  approvalRequested?: boolean;
  rankingRequested?: boolean;
  prioritizationRequested?: boolean;
  scoringRequested?: boolean;
  resourceAllocationRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type SealedTruthEvidenceRegistration = Readonly<{
  request: TruthEvidenceRegistrationRequest;
  evidence: SealedTruthEvidenceContract;
  registration: TruthEvidenceRegistrationContract;
  ledgerEntry: TruthEvidenceRegistrationLedgerEntry;
  validation: TruthEvidenceRegistrationValidation;
  replay: TruthEvidenceRegistrationReplay;
  visibility: TruthEvidenceRegistrationVisibility;
  observability: TruthEvidenceRegistrationObservability;
  certification: TruthCertificationState;
  sealed: true;
  readOnly: true;
  executionAuthorized: false;
  approvalAllowed: false;
  rankingAllowed: false;
  prioritizationAllowed: false;
  scoringAllowed: false;
  resourceAllocationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export type TruthEvidenceCompletenessState = "COMPLETE" | "PARTIAL" | "INCOMPLETE";
export type TruthEvidenceConsistencyState = "CONSISTENT" | "INCONSISTENT" | "CONFLICTING";
export type TruthEvidenceAuthenticityState = "AUTHENTIC" | "SUSPECT" | "UNVERIFIED" | "INVALID";
export type TruthEvidenceTrustState = "TRUSTED" | "CONDITIONALLY_TRUSTED" | "UNTRUSTED" | "RESTRICTED";
export type TruthEvidenceVerificationState = "VERIFIED" | "REJECTED";
export type TruthEvidenceVerificationValidationState = "VALID" | "INVALID";

export interface TruthEvidenceVerificationRequest {
  tenant_id: string;
  now: string;
}

export interface TruthEvidenceVerificationContract {
  verification_id: string;
  evidence_id: string;
  tenant_id: string;
  mission_id: string;
  verification_timestamp: string;
  verification_state: TruthEvidenceVerificationState;
  verification_score: number;
  verification_reason: string;
  evidence_hash: string;
  evidence_version: string;
  replay_references: readonly string[];
}

export interface TruthEvidenceVerificationLedgerEntry {
  verification_id: string;
  evidence_id: string;
  tenant_id: string;
  mission_id: string;
  verification_state: TruthEvidenceVerificationState;
  completeness_state: TruthEvidenceCompletenessState;
  consistency_state: TruthEvidenceConsistencyState;
  authenticity_state: TruthEvidenceAuthenticityState;
  trust_state: TruthEvidenceTrustState;
  verification_score: number;
  validation_status: TruthEvidenceVerificationValidationState;
  replay_status: TruthReplayResult;
  failure_reason: string | null;
}

export type TruthEvidenceVerificationReasonCode =
  | "VERIFICATION_ID_PRESENT"
  | "VERIFICATION_ID_MISSING"
  | "EVIDENCE_ID_PRESENT"
  | "EVIDENCE_ID_MISSING"
  | "VERIFICATION_STATE_PRESENT"
  | "VERIFICATION_STATE_MISSING"
  | "COMPLETENESS_COMPLETE"
  | "COMPLETENESS_PARTIAL"
  | "COMPLETENESS_INCOMPLETE"
  | "CONSISTENCY_CONSISTENT"
  | "CONSISTENCY_INCONSISTENT"
  | "CONSISTENCY_CONFLICTING"
  | "AUTHENTICITY_AUTHENTIC"
  | "AUTHENTICITY_SUSPECT"
  | "AUTHENTICITY_UNVERIFIED"
  | "AUTHENTICITY_INVALID"
  | "TRUST_TRUSTED"
  | "TRUST_CONDITIONAL"
  | "TRUST_UNTRUSTED"
  | "TRUST_RESTRICTED"
  | "TRUST_RATIONALE_PRESENT"
  | "TRUST_RATIONALE_MISSING"
  | "INTEGRITY_SCORE_VALID"
  | "INTEGRITY_SCORE_INVALID"
  | "RULES_DETERMINISTIC"
  | "RULES_NON_DETERMINISTIC"
  | "TENANT_ISOLATION_VALID"
  | "TENANT_ISOLATION_FAILED"
  | "VERIFICATION_VALID"
  | "VERIFICATION_INVALID"
  | "REPLAY_REPRODUCED"
  | "REPLAY_MISMATCH"
  | "REPLAY_INCOMPLETE_EVIDENCE"
  | "REPLAY_UNREPLAYABLE"
  | "VISIBILITY_AVAILABLE"
  | "VISIBILITY_BLOCKED"
  | "OBSERVABILITY_OPERATIONAL"
  | "OBSERVABILITY_GAP_DETECTED"
  | "CERTIFICATION_PASS"
  | "CERTIFICATION_CONDITIONAL_PASS"
  | "CERTIFICATION_FAIL"
  | "FAIL_CLOSED_ENFORCED"
  | "FAIL_OPEN_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "APPROVAL_ABSENT"
  | "APPROVAL_DETECTED"
  | "RANKING_ABSENT"
  | "RANKING_DETECTED"
  | "PRIORITIZATION_ABSENT"
  | "PRIORITIZATION_DETECTED"
  | "SCORING_ABSENT"
  | "SCORING_DETECTED"
  | "RESOURCE_ALLOCATION_ABSENT"
  | "RESOURCE_ALLOCATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "EVIDENCE_INTEGRITY_VERIFICATION_IS_NOT_CONTROL";

export type TruthEvidenceVerificationValidation = Readonly<{
  valid: boolean;
  validationState: TruthEvidenceVerificationValidationState;
  reasonCodes: readonly TruthEvidenceVerificationReasonCode[];
  completenessValid: boolean;
  consistencyValid: boolean;
  authenticityValid: boolean;
  trustValid: boolean;
  scoreValid: boolean;
  tenantIsolationValid: boolean;
  replayValid: boolean;
  failClosed: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  approvalAbsent: boolean;
  rankingAbsent: boolean;
  prioritizationAbsent: boolean;
  scoringAbsent: boolean;
  resourceAllocationAbsent: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
}>;

export type TruthEvidenceVerificationReplay = Readonly<{
  replayResult: TruthReplayResult;
  reconstructedVerification: TruthEvidenceVerificationContract;
}>;

export type TruthEvidenceVerificationVisibility = Readonly<{
  verification_id: string;
  evidence_id: string;
  verification_state: TruthEvidenceVerificationState;
  completeness_state: TruthEvidenceCompletenessState;
  consistency_state: TruthEvidenceConsistencyState;
  authenticity_state: TruthEvidenceAuthenticityState;
  trust_state: TruthEvidenceTrustState;
  integrity_score: number;
  validation_status: TruthEvidenceVerificationValidationState;
  replay_status: TruthReplayResult;
  readOnly: true;
  tenantScoped: boolean;
  auditable: true;
  replayLinked: true;
}>;

export type TruthEvidenceVerificationObservability = Readonly<{
  verifications_total: number;
  complete_evidence_count: number;
  partial_evidence_count: number;
  incomplete_evidence_count: number;
  consistent_evidence_count: number;
  conflicting_evidence_count: number;
  authentic_evidence_count: number;
  suspect_evidence_count: number;
  verification_failures: number;
  trust_failures: number;
  replay_failures: number;
}>;

export type TruthEvidenceVerificationInput = Readonly<{
  request: TruthEvidenceVerificationRequest;
  registration: SealedTruthEvidenceRegistration;
  verificationId?: string;
  trustRationale?: string;
  sourceConfidence?: number;
  lineageConfidence?: number;
  verificationHistoryScore?: number;
  missingRequiredFieldDetected?: boolean;
  missingProvenanceDetected?: boolean;
  hashMismatchDetected?: boolean;
  relationshipConflictDetected?: boolean;
  timestampConflictDetected?: boolean;
  sourceSpoofingDetected?: boolean;
  provenanceTamperingDetected?: boolean;
  signatureMismatchDetected?: boolean;
  originUnverifiableDetected?: boolean;
  nonDeterministicScoreDetected?: boolean;
  unsupportedTrustStateDetected?: boolean;
  replayMismatchDetected?: boolean;
  crossTenantVerificationDetected?: boolean;
  crossTenantTrustCalculationDetected?: boolean;
  observabilityGapDetected?: boolean;
  remediationDocumented?: boolean;
  accessTenantId?: string;
  executionRequested?: boolean;
  approvalRequested?: boolean;
  rankingRequested?: boolean;
  prioritizationRequested?: boolean;
  scoringRequested?: boolean;
  resourceAllocationRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type SealedTruthEvidenceVerification = Readonly<{
  request: TruthEvidenceVerificationRequest;
  registration: SealedTruthEvidenceRegistration;
  verification: TruthEvidenceVerificationContract;
  ledgerEntry: TruthEvidenceVerificationLedgerEntry;
  validation: TruthEvidenceVerificationValidation;
  replay: TruthEvidenceVerificationReplay;
  visibility: TruthEvidenceVerificationVisibility;
  observability: TruthEvidenceVerificationObservability;
  certification: TruthCertificationState;
  sealed: true;
  readOnly: true;
  executionAuthorized: false;
  approvalAllowed: false;
  rankingAllowed: false;
  prioritizationAllowed: false;
  scoringAllowed: false;
  resourceAllocationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export type TruthEvidenceGraphRelationshipType =
  | "DEPENDS_ON"
  | "DERIVED_FROM"
  | "GENERATED_FROM"
  | "REFERENCES"
  | "REQUIRES"
  | "SUPPORTS"
  | "VALIDATES"
  | "CORROBORATES"
  | "CONFIRMS"
  | "STRENGTHENS"
  | "CONFLICTS_WITH"
  | "REFUTES"
  | "CONTRADICTS"
  | "WEAKENS"
  | "SUPERSEDES";

export type TruthEvidenceGraphConfidence = "LOW" | "MEDIUM" | "HIGH" | "CERTAIN";
export type TruthEvidenceConflictSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type TruthEvidenceGraphValidationState = "VALID" | "INVALID";

export interface TruthEvidenceRelationshipGraphRequest {
  tenant_id: string;
  now: string;
}

export interface TruthEvidenceRelationshipGraphContract {
  graph_id: string;
  relationship_id: string;
  tenant_id: string;
  mission_id: string;
  source_evidence_id: string;
  target_evidence_id: string;
  relationship_type: TruthEvidenceGraphRelationshipType;
  relationship_reason: string;
  relationship_confidence: TruthEvidenceGraphConfidence;
  relationship_timestamp: string;
  evidence_references: readonly string[];
  replay_references: readonly string[];
}

export interface TruthEvidenceRelationshipGraphLedgerEntry {
  graph_id: string;
  relationship_id: string;
  tenant_id: string;
  mission_id: string;
  source_evidence_id: string;
  target_evidence_id: string;
  relationship_type: TruthEvidenceGraphRelationshipType;
  conflict_severity?: TruthEvidenceConflictSeverity;
  validation_status: TruthEvidenceGraphValidationState;
  replay_status: TruthReplayResult;
  failure_reason: string | null;
}

export type TruthEvidenceRelationshipGraphQueries = Readonly<{
  dependencies_by_evidence_id: readonly string[];
  supporting_evidence_by_evidence_id: readonly string[];
  conflicting_evidence_by_evidence_id: readonly string[];
  evidence_graph_by_mission_id: readonly string[];
  evidence_graph_by_truth_record_id: readonly string[];
  evidence_path_between_ids: readonly string[];
  evidence_conflict_neighborhood: readonly string[];
  evidence_support_neighborhood: readonly string[];
}>;

export type TruthEvidenceRelationshipGraphReplay = Readonly<{
  replayResult: TruthReplayResult;
  reconstructedRelationship: TruthEvidenceRelationshipGraphContract;
}>;

export type TruthEvidenceRelationshipGraphVisibility = Readonly<{
  graph_id: string;
  relationship_id: string;
  source_evidence_id: string;
  target_evidence_id: string;
  relationship_type: TruthEvidenceGraphRelationshipType;
  relationship_confidence: TruthEvidenceGraphConfidence;
  relationship_reason: string;
  conflict_severity?: TruthEvidenceConflictSeverity;
  validation_status: TruthEvidenceGraphValidationState;
  replay_status: TruthReplayResult;
  readOnly: true;
  tenantScoped: boolean;
  auditable: true;
  replayLinked: true;
}>;

export type TruthEvidenceRelationshipGraphObservability = Readonly<{
  evidence_nodes_total: number;
  evidence_relationships_total: number;
  dependency_edges_total: number;
  support_edges_total: number;
  conflict_edges_total: number;
  graph_validation_failures: number;
  cycle_detection_failures: number;
  conflict_detection_failures: number;
  tenant_isolation_failures: number;
  graph_replay_failures: number;
}>;

export type TruthEvidenceRelationshipGraphReasonCode =
  | "SOURCE_EVIDENCE_PRESENT"
  | "SOURCE_EVIDENCE_MISSING"
  | "SOURCE_EVIDENCE_KNOWN"
  | "SOURCE_EVIDENCE_UNKNOWN"
  | "TARGET_EVIDENCE_PRESENT"
  | "TARGET_EVIDENCE_MISSING"
  | "TARGET_EVIDENCE_KNOWN"
  | "TARGET_EVIDENCE_UNKNOWN"
  | "RELATIONSHIP_TYPE_PRESENT"
  | "RELATIONSHIP_TYPE_MISSING"
  | "RELATIONSHIP_TYPE_VALID"
  | "RELATIONSHIP_TYPE_INVALID"
  | "DEPENDENCY_MAPPED"
  | "DEPENDENCY_INVALID"
  | "SUPPORT_MAPPED"
  | "SUPPORT_INVALID"
  | "CONFLICT_MAPPED"
  | "CONFLICT_INVALID"
  | "SUPPORT_RATIONALE_PRESENT"
  | "SUPPORT_RATIONALE_MISSING"
  | "CONFLICT_RATIONALE_PRESENT"
  | "CONFLICT_RATIONALE_MISSING"
  | "CONFLICT_SEVERITY_ASSIGNED"
  | "CONFLICT_SEVERITY_MISSING"
  | "RULES_DETERMINISTIC"
  | "RULES_NON_DETERMINISTIC"
  | "GRAPH_VALID"
  | "GRAPH_CORRUPTED"
  | "CYCLE_ABSENT"
  | "CYCLE_DETECTED"
  | "TRAVERSAL_BOUNDED"
  | "TRAVERSAL_UNBOUNDED"
  | "TENANT_ISOLATION_VALID"
  | "TENANT_ISOLATION_FAILED"
  | "REPLAY_REPRODUCED"
  | "REPLAY_MISMATCH"
  | "REPLAY_INCOMPLETE_EVIDENCE"
  | "REPLAY_UNREPLAYABLE"
  | "VISIBILITY_AVAILABLE"
  | "VISIBILITY_BLOCKED"
  | "OBSERVABILITY_OPERATIONAL"
  | "OBSERVABILITY_GAP_DETECTED"
  | "CERTIFICATION_PASS"
  | "CERTIFICATION_CONDITIONAL_PASS"
  | "CERTIFICATION_FAIL"
  | "FAIL_CLOSED_ENFORCED"
  | "FAIL_OPEN_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "APPROVAL_ABSENT"
  | "APPROVAL_DETECTED"
  | "RANKING_ABSENT"
  | "RANKING_DETECTED"
  | "PRIORITIZATION_ABSENT"
  | "PRIORITIZATION_DETECTED"
  | "SCORING_ABSENT"
  | "SCORING_DETECTED"
  | "RESOURCE_ALLOCATION_ABSENT"
  | "RESOURCE_ALLOCATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "EVIDENCE_RELATIONSHIP_GRAPH_IS_NOT_CONTROL";

export type TruthEvidenceRelationshipGraphValidation = Readonly<{
  valid: boolean;
  validationState: TruthEvidenceGraphValidationState;
  reasonCodes: readonly TruthEvidenceRelationshipGraphReasonCode[];
  relationshipValid: boolean;
  graphValid: boolean;
  traversalValid: boolean;
  tenantIsolationValid: boolean;
  replayValid: boolean;
  failClosed: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  approvalAbsent: boolean;
  rankingAbsent: boolean;
  prioritizationAbsent: boolean;
  scoringAbsent: boolean;
  resourceAllocationAbsent: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
}>;

export type TruthEvidenceRelationshipGraphInput = Readonly<{
  request: TruthEvidenceRelationshipGraphRequest;
  sourceVerification: SealedTruthEvidenceVerification;
  targetVerification: SealedTruthEvidenceVerification;
  relationshipType?: TruthEvidenceGraphRelationshipType;
  relationshipReason?: string;
  confidenceRationale?: string;
  conflictSeverity?: TruthEvidenceConflictSeverity;
  priorRelationships?: readonly TruthEvidenceRelationshipGraphLedgerEntry[];
  knownEvidenceIds?: readonly string[];
  truthRecordId?: string;
  accessTenantId?: string;
  invalidRelationshipDetected?: boolean;
  relationshipDirectionErrorDetected?: boolean;
  missingSupportRationaleDetected?: boolean;
  missingConflictRationaleDetected?: boolean;
  missingConflictSeverityDetected?: boolean;
  unsupportedRelationshipOutputDetected?: boolean;
  nonDeterministicRelationshipDetected?: boolean;
  orphanedEdgeDetected?: boolean;
  graphCorruptionDetected?: boolean;
  cycleDetected?: boolean;
  unboundedTraversalDetected?: boolean;
  crossTenantEdgeDetected?: boolean;
  crossTenantTraversalDetected?: boolean;
  conflictUndetected?: boolean;
  replayMismatchDetected?: boolean;
  observabilityGapDetected?: boolean;
  remediationDocumented?: boolean;
  executionRequested?: boolean;
  approvalRequested?: boolean;
  rankingRequested?: boolean;
  prioritizationRequested?: boolean;
  scoringRequested?: boolean;
  resourceAllocationRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type SealedTruthEvidenceRelationshipGraph = Readonly<{
  request: TruthEvidenceRelationshipGraphRequest;
  sourceVerification: SealedTruthEvidenceVerification;
  targetVerification: SealedTruthEvidenceVerification;
  relationship: TruthEvidenceRelationshipGraphContract;
  ledgerEntry: TruthEvidenceRelationshipGraphLedgerEntry;
  queries: TruthEvidenceRelationshipGraphQueries;
  validation: TruthEvidenceRelationshipGraphValidation;
  replay: TruthEvidenceRelationshipGraphReplay;
  visibility: TruthEvidenceRelationshipGraphVisibility;
  observability: TruthEvidenceRelationshipGraphObservability;
  certification: TruthCertificationState;
  sealed: true;
  readOnly: true;
  executionAuthorized: false;
  approvalAllowed: false;
  rankingAllowed: false;
  prioritizationAllowed: false;
  scoringAllowed: false;
  resourceAllocationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export type TruthEvidenceCertificationDomain =
  | "6D.1 Evidence Contract"
  | "6D.2 Evidence Registration Engine"
  | "6D.3 Evidence Integrity Verification"
  | "6D.4 Evidence Relationship Graph"
  | "Replay Preservation"
  | "Tenant Isolation"
  | "Governance Compliance"
  | "Operator Visibility";

export type TruthEvidenceLayerCertificationState =
  | "EVIDENCE_LAYER_CERTIFIED"
  | "EVIDENCE_LAYER_CONDITIONAL"
  | "EVIDENCE_LAYER_FAILED";

export interface TruthEvidenceCertificationRequest {
  tenant_id: string;
  now: string;
}

export interface TruthEvidenceCertificationContract {
  certification_id: string;
  certification_timestamp: string;
  evidence_layer_version: string;
  certification_scope: readonly TruthEvidenceCertificationDomain[];
  certification_state: TruthCertificationState;
  certification_reason: string;
  certification_authority: string;
  evidence_references: readonly string[];
  replay_references: readonly string[];
}

export type TruthEvidenceCertificationValidationState = "VALID" | "INVALID";

export type TruthEvidenceCertificationReasonCode =
  | "CERTIFICATION_SCOPE_PRESENT"
  | "CERTIFICATION_SCOPE_MISSING"
  | "CERTIFICATION_AUTHORITY_PRESENT"
  | "CERTIFICATION_AUTHORITY_MISSING"
  | "EVIDENCE_REFERENCES_PRESENT"
  | "EVIDENCE_REFERENCES_MISSING"
  | "REPLAY_REFERENCES_PRESENT"
  | "REPLAY_REFERENCES_MISSING"
  | "EVIDENCE_CONTRACT_CERTIFIED"
  | "EVIDENCE_CONTRACT_FAILED"
  | "EVIDENCE_REGISTRATION_CERTIFIED"
  | "EVIDENCE_REGISTRATION_FAILED"
  | "EVIDENCE_INTEGRITY_CERTIFIED"
  | "EVIDENCE_INTEGRITY_FAILED"
  | "EVIDENCE_GRAPH_CERTIFIED"
  | "EVIDENCE_GRAPH_FAILED"
  | "EVIDENCE_REPLAY_CERTIFIED"
  | "EVIDENCE_REPLAY_FAILED"
  | "TENANT_ISOLATION_CERTIFIED"
  | "TENANT_ISOLATION_FAILED"
  | "GOVERNANCE_CERTIFIED"
  | "GOVERNANCE_FAILED"
  | "VISIBILITY_CERTIFIED"
  | "VISIBILITY_FAILED"
  | "REPLAY_REPRODUCED"
  | "REPLAY_MISMATCH"
  | "REPLAY_INCOMPLETE_EVIDENCE"
  | "REPLAY_UNREPLAYABLE"
  | "VISIBILITY_AVAILABLE"
  | "VISIBILITY_BLOCKED"
  | "OBSERVABILITY_OPERATIONAL"
  | "OBSERVABILITY_GAP_DETECTED"
  | "REPORTING_LIMITATIONS_ABSENT"
  | "REPORTING_LIMITATIONS_PRESENT"
  | "DECISION_ENGINE_PASS"
  | "DECISION_ENGINE_CONDITIONAL"
  | "DECISION_ENGINE_FAIL"
  | "FAIL_CLOSED_ENFORCED"
  | "FAIL_OPEN_DETECTED"
  | "LEDGER_APPEND_ONLY"
  | "LEDGER_IMMUTABLE"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "APPROVAL_ABSENT"
  | "APPROVAL_DETECTED"
  | "RANKING_ABSENT"
  | "RANKING_DETECTED"
  | "PRIORITIZATION_ABSENT"
  | "PRIORITIZATION_DETECTED"
  | "SCORING_ABSENT"
  | "SCORING_DETECTED"
  | "RESOURCE_ALLOCATION_ABSENT"
  | "RESOURCE_ALLOCATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "EVIDENCE_CERTIFICATION_GATE_IS_NOT_CONTROL";

export interface TruthEvidenceCertificationLedgerEntry {
  certification_id: string;
  tenant_id: string;
  certification_state: TruthCertificationState;
  completion_gate: TruthEvidenceLayerCertificationState;
  replay_status: TruthReplayResult;
  failed_components: readonly string[];
  required_actions: readonly string[];
}

export type TruthEvidenceCertificationReplay = Readonly<{
  replayResult: TruthReplayResult;
  executedTests: readonly string[];
  decisionState: TruthCertificationState;
}>;

export type TruthEvidenceCertificationVisibility = Readonly<{
  certification_state: TruthCertificationState;
  evidence_layer_version: string;
  certified_components: readonly string[];
  failed_components: readonly string[];
  trust_status: TruthCertificationState;
  replay_status: TruthReplayResult;
  tenant_status: "PASS" | "FAIL";
  governance_status: "PASS" | "FAIL";
  visibility_status: "PASS" | "FAIL";
  required_actions: readonly string[];
  certification_timestamp: string;
  certification_authority: string;
  readOnly: true;
  tenantScoped: boolean;
  auditable: true;
  replayLinked: true;
}>;

export type TruthEvidenceCertificationObservability = Readonly<{
  evidence_certifications_total: number;
  evidence_pass_total: number;
  evidence_conditional_total: number;
  evidence_fail_total: number;
  contract_failures: number;
  registration_failures: number;
  verification_failures: number;
  graph_failures: number;
  replay_failures: number;
  tenant_isolation_failures: number;
  governance_failures: number;
  visibility_failures: number;
  certification_replay_failures: number;
}>;

export type TruthEvidenceCertificationValidation = Readonly<{
  valid: boolean;
  validationState: TruthEvidenceCertificationValidationState;
  reasonCodes: readonly TruthEvidenceCertificationReasonCode[];
  scopeValid: boolean;
  authorityValid: boolean;
  evidenceValid: boolean;
  replayReferencesValid: boolean;
  evidenceContractCertified: boolean;
  evidenceRegistrationCertified: boolean;
  evidenceIntegrityCertified: boolean;
  evidenceGraphCertified: boolean;
  replayCertified: boolean;
  tenantIsolationCertified: boolean;
  governanceCertified: boolean;
  visibilityCertified: boolean;
  failClosed: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  approvalAbsent: boolean;
  rankingAbsent: boolean;
  prioritizationAbsent: boolean;
  scoringAbsent: boolean;
  resourceAllocationAbsent: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
}>;

export type TruthEvidenceCertificationInput = Readonly<{
  request: TruthEvidenceCertificationRequest;
  evidenceContract: SealedTruthEvidenceContract;
  evidenceRegistration: SealedTruthEvidenceRegistration;
  evidenceIntegrity: SealedTruthEvidenceVerification;
  evidenceGraph: SealedTruthEvidenceRelationshipGraph;
  certificationAuthority: string;
  certificationReason: string;
  certificationScope?: readonly TruthEvidenceCertificationDomain[];
  evidenceReferences?: readonly string[];
  replayReferences?: readonly string[];
  accessTenantId?: string;
  governanceBypassDetected?: boolean;
  hiddenFailureDetected?: boolean;
  observabilityGapDetected?: boolean;
  reportingLimitationDetected?: boolean;
  remediationPlanExists?: boolean;
  governanceApproved?: boolean;
  executionRequested?: boolean;
  approvalRequested?: boolean;
  rankingRequested?: boolean;
  prioritizationRequested?: boolean;
  scoringRequested?: boolean;
  resourceAllocationRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type SealedTruthEvidenceCertificationGate = Readonly<{
  request: TruthEvidenceCertificationRequest;
  certification: TruthEvidenceCertificationContract;
  validation: TruthEvidenceCertificationValidation;
  replay: TruthEvidenceCertificationReplay;
  visibility: TruthEvidenceCertificationVisibility;
  observability: TruthEvidenceCertificationObservability;
  ledgerEntry: TruthEvidenceCertificationLedgerEntry;
  completionGate: TruthEvidenceLayerCertificationState;
  sealed: true;
  readOnly: true;
  executionAuthorized: false;
  approvalAllowed: false;
  rankingAllowed: false;
  prioritizationAllowed: false;
  scoringAllowed: false;
  resourceAllocationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export type TruthRecommendationType =
  | "OPERATIONAL"
  | "GOVERNANCE"
  | "RISK"
  | "CONFIDENCE"
  | "ESCALATION"
  | "MITIGATION"
  | "CERTIFICATION"
  | "RECOVERY"
  | "OPTIMIZATION"
  | "INVESTIGATION";

export type TruthRecommendationCategory =
  | "TRUTH"
  | "EVENT"
  | "EVIDENCE"
  | "GOVERNANCE"
  | "RUNTIME"
  | "SECURITY"
  | "CERTIFICATION"
  | "AUDIT"
  | "ESCALATION"
  | "OPERATIONS";

export type TruthRecommendationState =
  | "CREATED"
  | "VALIDATED"
  | "ACTIVE"
  | "SUPERSEDED"
  | "RESTRICTED"
  | "ARCHIVED";

export type TruthRecommendationConfidenceState = "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";
export type TruthRecommendationValidationState = "VALID" | "INVALID";

export interface TruthRecommendationContractRequest {
  tenant_id: string;
  now: string;
}

export interface TruthRecommendationGovernanceBinding {
  governance_policy_ids: readonly string[];
  governance_constraints: readonly string[];
  authority_scope: string;
  approval_requirements: readonly string[];
  governance_references: readonly string[];
}

export interface TruthRecommendationConfidenceBinding {
  confidence_score: number;
  confidence_state: TruthRecommendationConfidenceState;
  confidence_rationale: string;
  confidence_evidence: readonly string[];
}

export interface TruthRecommendationPayload {
  recommendation_rationale: string;
  recommendation_summary: string;
  recommendation_reasoning: readonly string[];
  recommendation_assumptions: readonly string[];
  recommendation_constraints: readonly string[];
}

export interface TruthRecommendationContract {
  recommendation_id: string;
  tenant_id: string;
  mission_id: string;
  recommendation_type: TruthRecommendationType;
  recommendation_category: TruthRecommendationCategory;
  recommendation_timestamp: string;
  recommendation_version: string;
  recommendation_state: TruthRecommendationState;
  recommendation_payload: TruthRecommendationPayload;
  recommendation_hash: string;
  created_timestamp: string;
  supporting_evidence_ids: readonly string[];
  supporting_truth_record_ids: readonly string[];
  supporting_event_ids: readonly string[];
  supporting_graph_references: readonly string[];
  governance_binding: TruthRecommendationGovernanceBinding;
  confidence_binding: TruthRecommendationConfidenceBinding;
  replay_reference_ids: readonly string[];
  replay_bundle_id?: string;
  replay_hash: string;
}

export interface TruthRecommendationLedgerEntry {
  recommendation_id: string;
  tenant_id: string;
  mission_id: string;
  recommendation_state: TruthRecommendationState;
  recommendation_type: TruthRecommendationType;
  recommendation_category: TruthRecommendationCategory;
  confidence_state: TruthRecommendationConfidenceState;
  validation_status: TruthRecommendationValidationState;
  replay_status: TruthReplayResult;
  failure_reason: string | null;
}

export type TruthRecommendationContractReasonCode =
  | "RECOMMENDATION_ID_PRESENT"
  | "RECOMMENDATION_ID_MISSING"
  | "RECOMMENDATION_ID_UNIQUE"
  | "RECOMMENDATION_ID_DUPLICATE"
  | "RECOMMENDATION_ID_IMMUTABLE"
  | "RECOMMENDATION_ID_MUTATED"
  | "RECOMMENDATION_HASH_VALID"
  | "RECOMMENDATION_HASH_MISMATCH"
  | "TENANT_ID_PRESENT"
  | "TENANT_ID_MISSING"
  | "MISSION_ID_PRESENT"
  | "MISSION_ID_MISSING"
  | "RECOMMENDATION_TYPE_PRESENT"
  | "RECOMMENDATION_TYPE_MISSING"
  | "RECOMMENDATION_TYPE_VALID"
  | "RECOMMENDATION_TYPE_INVALID"
  | "RECOMMENDATION_TYPE_NOT_DEPRECATED"
  | "RECOMMENDATION_TYPE_DEPRECATED"
  | "RECOMMENDATION_CATEGORY_VALID"
  | "RECOMMENDATION_CATEGORY_MISMATCH"
  | "RECOMMENDATION_CATEGORY_SINGLE"
  | "RECOMMENDATION_CATEGORY_MULTIPLE"
  | "RECOMMENDATION_TIMESTAMP_VALID"
  | "RECOMMENDATION_TIMESTAMP_INVALID"
  | "RECOMMENDATION_VERSION_PRESENT"
  | "RECOMMENDATION_VERSION_MISSING"
  | "RATIONALE_PRESENT"
  | "RATIONALE_MISSING"
  | "REASONING_PRESENT"
  | "REASONING_MISSING"
  | "SUPPORTING_EVIDENCE_PRESENT"
  | "SUPPORTING_EVIDENCE_MISSING"
  | "SUPPORTING_EVIDENCE_RESOLVABLE"
  | "SUPPORTING_EVIDENCE_UNRESOLVABLE"
  | "GOVERNANCE_BINDING_PRESENT"
  | "GOVERNANCE_BINDING_MISSING"
  | "AUTHORITY_SCOPE_VALID"
  | "AUTHORITY_SCOPE_VIOLATION"
  | "CONFIDENCE_SCORE_PRESENT"
  | "CONFIDENCE_SCORE_MISSING"
  | "CONFIDENCE_STATE_VALID"
  | "CONFIDENCE_STATE_INVALID"
  | "CONFIDENCE_RATIONALE_PRESENT"
  | "CONFIDENCE_RATIONALE_MISSING"
  | "STATE_VALID"
  | "STATE_INVALID"
  | "STATE_TRANSITION_VALID"
  | "STATE_TRANSITION_INVALID"
  | "REPLAY_BINDING_VALID"
  | "REPLAY_BINDING_INVALID"
  | "REPLAY_HASH_VALID"
  | "REPLAY_HASH_MISMATCH"
  | "TENANT_ISOLATION_VALID"
  | "TENANT_ISOLATION_FAILED"
  | "ADVISORY_ONLY_ENFORCED"
  | "EXECUTION_AUTHORITY_DETECTED"
  | "REPLAY_REPRODUCED"
  | "REPLAY_MISMATCH"
  | "REPLAY_INCOMPLETE_EVIDENCE"
  | "REPLAY_UNREPLAYABLE"
  | "VISIBILITY_AVAILABLE"
  | "VISIBILITY_BLOCKED"
  | "OBSERVABILITY_OPERATIONAL"
  | "OBSERVABILITY_GAP_DETECTED"
  | "CERTIFICATION_PASS"
  | "CERTIFICATION_CONDITIONAL_PASS"
  | "CERTIFICATION_FAIL"
  | "FAIL_CLOSED_ENFORCED"
  | "FAIL_OPEN_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "APPROVAL_ABSENT"
  | "APPROVAL_DETECTED"
  | "RANKING_ABSENT"
  | "RANKING_DETECTED"
  | "PRIORITIZATION_ABSENT"
  | "PRIORITIZATION_DETECTED"
  | "SCORING_ABSENT"
  | "SCORING_DETECTED"
  | "RESOURCE_ALLOCATION_ABSENT"
  | "RESOURCE_ALLOCATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "RECOMMENDATION_CONTRACT_IS_NOT_CONTROL";

export type TruthRecommendationContractValidation = Readonly<{
  valid: boolean;
  validationState: TruthRecommendationValidationState;
  reasonCodes: readonly TruthRecommendationContractReasonCode[];
  identityValid: boolean;
  typeValid: boolean;
  categoryValid: boolean;
  rationaleValid: boolean;
  evidenceValid: boolean;
  governanceValid: boolean;
  confidenceValid: boolean;
  stateValid: boolean;
  replayValid: boolean;
  failClosed: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  approvalAbsent: boolean;
  rankingAbsent: boolean;
  prioritizationAbsent: boolean;
  scoringAbsent: boolean;
  resourceAllocationAbsent: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
}>;

export type TruthRecommendationContractReplay = Readonly<{
  replayResult: TruthReplayResult;
  reconstructedRecommendation: TruthRecommendationContract;
}>;

export type TruthRecommendationContractVisibility = Readonly<{
  recommendation_id: string;
  recommendation_type: TruthRecommendationType;
  recommendation_category: TruthRecommendationCategory;
  recommendation_state: TruthRecommendationState;
  confidence_state: TruthRecommendationConfidenceState;
  confidence_score: number;
  governance_scope: string;
  validation_status: TruthRecommendationValidationState;
  replay_status: TruthReplayResult;
  timestamp: string;
  readOnly: true;
  tenantScoped: boolean;
  auditable: true;
  replayLinked: true;
}>;

export type TruthRecommendationContractObservability = Readonly<{
  recommendations_created_total: number;
  recommendations_validated_total: number;
  recommendations_active_total: number;
  recommendations_superseded_total: number;
  recommendation_validation_failures: number;
  governance_binding_failures: number;
  confidence_binding_failures: number;
  replay_failures: number;
  state_transition_failures: number;
}>;

export type TruthRecommendationContractInput = Readonly<{
  request: TruthRecommendationContractRequest;
  missionId: string;
  recommendationType: TruthRecommendationType;
  recommendationCategory: TruthRecommendationCategory;
  recommendationState?: TruthRecommendationState;
  recommendationTimestamp?: string;
  recommendationVersion?: string;
  recommendationPayload: {
    recommendation_rationale: string;
    recommendation_summary: string;
    recommendation_reasoning: readonly string[];
    recommendation_assumptions?: readonly string[];
    recommendation_constraints?: readonly string[];
  };
  supportingEvidenceIds: readonly string[];
  supportingTruthRecordIds?: readonly string[];
  supportingEventIds?: readonly string[];
  supportingGraphReferences?: readonly string[];
  governanceBinding: TruthRecommendationGovernanceBinding;
  confidenceBinding: TruthRecommendationConfidenceBinding;
  replayReferenceIds: readonly string[];
  replayBundleId?: string;
  recommendationId?: string;
  priorRecommendationIds?: readonly string[];
  priorState?: TruthRecommendationState | null;
  knownEvidenceIds?: readonly string[];
  accessTenantId?: string;
  typeCategoryMatches?: boolean;
  multipleCategoriesDetected?: boolean;
  identityMutated?: boolean;
  hashMismatchDetected?: boolean;
  deprecatedRecommendationTypeDetected?: boolean;
  missingRationaleDetected?: boolean;
  emptyReasoningDetected?: boolean;
  missingSupportingEvidenceDetected?: boolean;
  unresolvableEvidenceDetected?: boolean;
  missingGovernanceBindingDetected?: boolean;
  authorityScopeViolationDetected?: boolean;
  missingConfidenceScoreDetected?: boolean;
  unsupportedConfidenceStateDetected?: boolean;
  confidenceCorruptionDetected?: boolean;
  invalidStateTransitionDetected?: boolean;
  unknownStateDetected?: boolean;
  replayReferencesResolvable?: boolean;
  replayHashMismatchDetected?: boolean;
  replayMismatchDetected?: boolean;
  executionAuthorityDetected?: boolean;
  observabilityGapDetected?: boolean;
  remediationDocumented?: boolean;
  executionRequested?: boolean;
  approvalRequested?: boolean;
  rankingRequested?: boolean;
  prioritizationRequested?: boolean;
  scoringRequested?: boolean;
  resourceAllocationRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type SealedTruthRecommendationContract = Readonly<{
  request: TruthRecommendationContractRequest;
  recommendation: TruthRecommendationContract;
  ledgerEntry: TruthRecommendationLedgerEntry;
  validation: TruthRecommendationContractValidation;
  replay: TruthRecommendationContractReplay;
  visibility: TruthRecommendationContractVisibility;
  observability: TruthRecommendationContractObservability;
  certification: TruthCertificationState;
  sealed: true;
  readOnly: true;
  executionAuthorized: false;
  approvalAllowed: false;
  rankingAllowed: false;
  prioritizationAllowed: false;
  scoringAllowed: false;
  resourceAllocationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export type TruthRecommendationRecordType = "RECOMMENDATION" | "ALTERNATIVE" | "REJECTED_OPTION";
export type TruthRecommendationRecordState = "RECORDED" | "REJECTED";
export type TruthRecommendationRecordClassification = "PRIMARY" | "ALTERNATIVE" | "REJECTED";
export type TruthRecommendationRelationshipType =
  | "ALTERNATIVE_TO"
  | "REJECTED_FROM"
  | "SUPERSEDES"
  | "DERIVED_FROM"
  | "SUPPORTS";
export type TruthRecommendationRecorderValidationState = "VALID" | "INVALID";

export interface TruthRecommendationRecorderRequest {
  tenant_id: string;
  now: string;
}

export interface TruthRecommendationRecordRelationship {
  target_recommendation_id: string;
  relationship_type: TruthRecommendationRelationshipType;
  relationship_rationale: string;
}

export interface TruthRecommendationLineage {
  origin_recommendation_id: string;
  parent_recommendation_id?: string;
  superseded_by_recommendation_id?: string;
  alternative_lineage_ids: readonly string[];
  rejected_lineage_ids: readonly string[];
}

export interface TruthRecommendationRecordContract {
  record_id: string;
  recommendation_id: string;
  tenant_id: string;
  mission_id: string;
  record_timestamp: string;
  record_type: TruthRecommendationRecordType;
  record_state: TruthRecommendationRecordState;
  recommendation_hash: string;
  evidence_references: readonly string[];
  replay_references: readonly string[];
}

export interface TruthRecommendationRecorderLedgerEntry {
  record_id: string;
  recommendation_id: string;
  tenant_id: string;
  mission_id: string;
  record_type: TruthRecommendationRecordType;
  classification: TruthRecommendationRecordClassification;
  record_state: TruthRecommendationRecordState;
  validation_status: TruthRecommendationRecorderValidationState;
  lineage_status: "VALID" | "INVALID";
  replay_status: TruthReplayResult;
  transaction_status: "COMMITTED" | "ROLLED_BACK" | "NOT_STARTED";
  failure_reason: string | null;
}

export type TruthRecommendationRecorderReasonCode =
  | "RECORD_ID_PRESENT"
  | "RECORD_ID_MISSING"
  | "RECOMMENDATION_ID_PRESENT"
  | "RECOMMENDATION_ID_MISSING"
  | "RECORD_TYPE_PRESENT"
  | "RECORD_TYPE_MISSING"
  | "RECORD_TYPE_VALID"
  | "RECORD_TYPE_INVALID"
  | "RECORD_TIMESTAMP_VALID"
  | "RECORD_TIMESTAMP_INVALID"
  | "RECOMMENDATION_CONTENT_PRESENT"
  | "RECOMMENDATION_CONTENT_MISSING"
  | "RECOMMENDATION_RATIONALE_PRESENT"
  | "RECOMMENDATION_RATIONALE_MISSING"
  | "ALTERNATIVE_LINKED"
  | "ALTERNATIVE_UNLINKED"
  | "REJECTION_RATIONALE_PRESENT"
  | "REJECTION_RATIONALE_MISSING"
  | "REJECTION_EVIDENCE_PRESENT"
  | "REJECTION_EVIDENCE_MISSING"
  | "CLASSIFICATION_SINGLE"
  | "CLASSIFICATION_MULTIPLE"
  | "CLASSIFICATION_VALID"
  | "CLASSIFICATION_INVALID"
  | "LINEAGE_VALID"
  | "LINEAGE_BROKEN"
  | "LINEAGE_ORPHANED"
  | "RECOMMENDATION_VALID"
  | "RECOMMENDATION_INVALID"
  | "EVIDENCE_VALID"
  | "EVIDENCE_INVALID"
  | "GOVERNANCE_VALID"
  | "GOVERNANCE_INVALID"
  | "CONFIDENCE_VALID"
  | "CONFIDENCE_INVALID"
  | "RELATIONSHIPS_VALID"
  | "RELATIONSHIPS_INVALID"
  | "REPLAY_BINDING_VALID"
  | "REPLAY_BINDING_INVALID"
  | "TRANSACTION_PROTECTED"
  | "PARTIAL_RECORD_DETECTED"
  | "ROLLBACK_FAILED"
  | "TENANT_ISOLATION_VALID"
  | "TENANT_ISOLATION_FAILED"
  | "REPLAY_REPRODUCED"
  | "REPLAY_MISMATCH"
  | "REPLAY_INCOMPLETE_EVIDENCE"
  | "REPLAY_UNREPLAYABLE"
  | "VISIBILITY_AVAILABLE"
  | "VISIBILITY_BLOCKED"
  | "OBSERVABILITY_OPERATIONAL"
  | "OBSERVABILITY_GAP_DETECTED"
  | "CERTIFICATION_PASS"
  | "CERTIFICATION_CONDITIONAL_PASS"
  | "CERTIFICATION_FAIL"
  | "FAIL_CLOSED_ENFORCED"
  | "FAIL_OPEN_DETECTED"
  | "LEDGER_APPEND_ONLY"
  | "LEDGER_IMMUTABLE"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "APPROVAL_ABSENT"
  | "APPROVAL_DETECTED"
  | "RANKING_ABSENT"
  | "RANKING_DETECTED"
  | "PRIORITIZATION_ABSENT"
  | "PRIORITIZATION_DETECTED"
  | "SCORING_ABSENT"
  | "SCORING_DETECTED"
  | "RESOURCE_ALLOCATION_ABSENT"
  | "RESOURCE_ALLOCATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "RECOMMENDATION_RECORDER_IS_NOT_CONTROL";

export type TruthRecommendationRecorderValidation = Readonly<{
  valid: boolean;
  validationState: TruthRecommendationRecorderValidationState;
  reasonCodes: readonly TruthRecommendationRecorderReasonCode[];
  recommendationValid: boolean;
  classificationValid: boolean;
  lineageValid: boolean;
  transactionProtected: boolean;
  tenantIsolationValid: boolean;
  replayValid: boolean;
  failClosed: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  approvalAbsent: boolean;
  rankingAbsent: boolean;
  prioritizationAbsent: boolean;
  scoringAbsent: boolean;
  resourceAllocationAbsent: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
}>;

export type TruthRecommendationRecorderReplay = Readonly<{
  replayResult: TruthReplayResult;
  reconstructedRecord: TruthRecommendationRecordContract;
  reconstructedLineage: TruthRecommendationLineage;
  reconstructedRelationships: readonly TruthRecommendationRecordRelationship[];
}>;

export type TruthRecommendationRecorderVisibility = Readonly<{
  recommendation_id: string;
  record_type: TruthRecommendationRecordType;
  classification: TruthRecommendationRecordClassification;
  record_state: TruthRecommendationRecordState;
  confidence_state: TruthRecommendationConfidenceState;
  validation_status: TruthRecommendationRecorderValidationState;
  lineage_status: "VALID" | "INVALID";
  replay_status: TruthReplayResult;
  timestamp: string;
  readOnly: true;
  tenantScoped: boolean;
  auditable: true;
  replayLinked: true;
}>;

export type TruthRecommendationRecorderObservability = Readonly<{
  recommendations_recorded_total: number;
  alternatives_recorded_total: number;
  rejected_options_recorded_total: number;
  classification_failures: number;
  validation_failures: number;
  lineage_failures: number;
  transaction_failures: number;
  replay_failures: number;
  tenant_isolation_failures: number;
}>;

export type TruthRecommendationRecorderInput = Readonly<{
  request: TruthRecommendationRecorderRequest;
  recommendation: SealedTruthRecommendationContract;
  recordType: TruthRecommendationRecordType;
  classification?: TruthRecommendationRecordClassification;
  recordTimestamp?: string;
  recordId?: string;
  recommendationContent?: Record<string, string | number | boolean>;
  alternativeRecommendationId?: string;
  rejectionRationale?: string;
  rejectionEvidenceIds?: readonly string[];
  lineage?: Partial<TruthRecommendationLineage>;
  relationships?: readonly TruthRecommendationRecordRelationship[];
  priorRecords?: readonly TruthRecommendationRecorderLedgerEntry[];
  knownRecommendationIds?: readonly string[];
  knownEvidenceIds?: readonly string[];
  accessTenantId?: string;
  missingRecommendationContentDetected?: boolean;
  missingRationaleDetected?: boolean;
  unlinkedAlternativeDetected?: boolean;
  missingRejectionRationaleDetected?: boolean;
  missingRejectionEvidenceDetected?: boolean;
  brokenLineageChainDetected?: boolean;
  orphanedRecommendationDetected?: boolean;
  multipleClassificationsDetected?: boolean;
  unknownClassificationDetected?: boolean;
  invalidRecommendationDetected?: boolean;
  invalidEvidenceDetected?: boolean;
  invalidGovernanceDetected?: boolean;
  invalidConfidenceDetected?: boolean;
  partialRecordDetected?: boolean;
  rollbackFailed?: boolean;
  replayMismatchDetected?: boolean;
  classificationMismatchDetected?: boolean;
  lineageMismatchDetected?: boolean;
  crossTenantRecommendationAccessDetected?: boolean;
  crossTenantLineageTraversalDetected?: boolean;
  unknownRelationshipTypeDetected?: boolean;
  relationshipCorruptionDetected?: boolean;
  replayReferencesResolvable?: boolean;
  observabilityGapDetected?: boolean;
  remediationDocumented?: boolean;
  executionRequested?: boolean;
  approvalRequested?: boolean;
  rankingRequested?: boolean;
  prioritizationRequested?: boolean;
  scoringRequested?: boolean;
  resourceAllocationRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type SealedTruthRecommendationRecorder = Readonly<{
  request: TruthRecommendationRecorderRequest;
  recommendation: SealedTruthRecommendationContract;
  record: TruthRecommendationRecordContract;
  classification: TruthRecommendationRecordClassification;
  lineage: TruthRecommendationLineage;
  relationships: readonly TruthRecommendationRecordRelationship[];
  ledgerEntry: TruthRecommendationRecorderLedgerEntry;
  validation: TruthRecommendationRecorderValidation;
  replay: TruthRecommendationRecorderReplay;
  visibility: TruthRecommendationRecorderVisibility;
  observability: TruthRecommendationRecorderObservability;
  certification: TruthCertificationState;
  sealed: true;
  readOnly: true;
  executionAuthorized: false;
  approvalAllowed: false;
  rankingAllowed: false;
  prioritizationAllowed: false;
  scoringAllowed: false;
  resourceAllocationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export type TruthRecommendationReconstructionScope =
  | "FULL_CONTEXT"
  | "RATIONALE_ONLY"
  | "EVIDENCE_ONLY"
  | "GOVERNANCE_ONLY"
  | "CONFIDENCE_ONLY"
  | "ALTERNATIVES_ONLY"
  | "ENVIRONMENT_ONLY";

export type TruthRecommendationReconstructionState = "RECONSTRUCTED" | "REJECTED";
export type TruthRecommendationReconstructionValidationState = "VALID" | "INVALID";

export interface TruthRecommendationReconstructionRequest {
  tenant_id: string;
  now: string;
}

export interface TruthRecommendationEnvironmentContext {
  runtime_conditions: readonly string[];
  mission_conditions: readonly string[];
  tenant_conditions: readonly string[];
  risk_conditions: readonly string[];
  escalation_conditions: readonly string[];
  certification_conditions: readonly string[];
}

export interface TruthRecommendationContextBundle {
  recommendation_rationale: string;
  recommendation_assumptions: readonly string[];
  recommendation_constraints: readonly string[];
  recommendation_objectives: readonly string[];
  recommendation_state: TruthRecommendationState;
  supporting_evidence_ids: readonly string[];
  supporting_event_ids: readonly string[];
  supporting_truth_record_ids: readonly string[];
  governance_policy_ids: readonly string[];
  authority_scope: string;
  approval_requirements: readonly string[];
  confidence_score: number;
  confidence_state: TruthRecommendationConfidenceState;
  confidence_rationale: string;
  accepted_recommendation_id: string;
  alternative_recommendation_ids: readonly string[];
  rejected_recommendation_ids: readonly string[];
  rejection_rationales: readonly string[];
  environment: TruthRecommendationEnvironmentContext;
}

export interface TruthRecommendationReconstructionContract {
  reconstruction_id: string;
  recommendation_id: string;
  tenant_id: string;
  mission_id: string;
  reconstruction_timestamp: string;
  reconstruction_scope: TruthRecommendationReconstructionScope;
  reconstruction_state: TruthRecommendationReconstructionState;
  reconstruction_reason: string;
  evidence_references: readonly string[];
  replay_references: readonly string[];
}

export interface TruthRecommendationReconstructionLedgerEntry {
  reconstruction_id: string;
  recommendation_id: string;
  tenant_id: string;
  mission_id: string;
  reconstruction_scope: TruthRecommendationReconstructionScope;
  reconstruction_state: TruthRecommendationReconstructionState;
  validation_status: TruthRecommendationReconstructionValidationState;
  replay_status: TruthReplayResult;
  failure_reason: string | null;
}

export type TruthRecommendationReconstructionReasonCode =
  | "RECONSTRUCTION_ID_PRESENT"
  | "RECONSTRUCTION_ID_MISSING"
  | "RECOMMENDATION_ID_PRESENT"
  | "RECOMMENDATION_ID_MISSING"
  | "RECONSTRUCTION_SCOPE_PRESENT"
  | "RECONSTRUCTION_SCOPE_MISSING"
  | "RECONSTRUCTION_SCOPE_VALID"
  | "RECONSTRUCTION_SCOPE_INVALID"
  | "RECOMMENDATION_CONTEXT_PRESENT"
  | "RECOMMENDATION_CONTEXT_MISSING"
  | "RECOMMENDATION_CONTEXT_COMPLETE"
  | "RECOMMENDATION_CONTEXT_INCOMPLETE"
  | "EVIDENCE_RECONSTRUCTED"
  | "EVIDENCE_MISSING"
  | "EVIDENCE_MISMATCH"
  | "GOVERNANCE_RECONSTRUCTED"
  | "GOVERNANCE_MISSING"
  | "GOVERNANCE_MISMATCH"
  | "CONFIDENCE_RECONSTRUCTED"
  | "CONFIDENCE_RATIONALE_MISSING"
  | "CONFIDENCE_MISMATCH"
  | "ALTERNATIVES_RECONSTRUCTED"
  | "ALTERNATIVES_MISSING"
  | "REJECTION_RATIONALE_MISSING"
  | "ENVIRONMENT_RECONSTRUCTED"
  | "ENVIRONMENT_MISSING"
  | "ENVIRONMENT_MISMATCH"
  | "BUNDLE_ASSEMBLED"
  | "BUNDLE_ASSEMBLY_FAILED"
  | "BUNDLE_COMPLETE"
  | "BUNDLE_INCOMPLETE"
  | "RECOMMENDATION_VALID"
  | "RECOMMENDATION_INVALID"
  | "EVIDENCE_VALID"
  | "EVIDENCE_INVALID"
  | "GOVERNANCE_VALID"
  | "GOVERNANCE_INVALID"
  | "CONFIDENCE_VALID"
  | "CONFIDENCE_INVALID"
  | "ALTERNATIVE_VALID"
  | "ALTERNATIVE_INVALID"
  | "ENVIRONMENT_VALID"
  | "ENVIRONMENT_INVALID"
  | "TENANT_ISOLATION_VALID"
  | "TENANT_ISOLATION_FAILED"
  | "REPLAY_REPRODUCED"
  | "REPLAY_MISMATCH"
  | "REPLAY_INCOMPLETE_EVIDENCE"
  | "REPLAY_UNREPLAYABLE"
  | "VISIBILITY_AVAILABLE"
  | "VISIBILITY_BLOCKED"
  | "OBSERVABILITY_OPERATIONAL"
  | "OBSERVABILITY_GAP_DETECTED"
  | "CERTIFICATION_PASS"
  | "CERTIFICATION_CONDITIONAL_PASS"
  | "CERTIFICATION_FAIL"
  | "FAIL_CLOSED_ENFORCED"
  | "FAIL_OPEN_DETECTED"
  | "LEDGER_APPEND_ONLY"
  | "LEDGER_IMMUTABLE"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "APPROVAL_ABSENT"
  | "APPROVAL_DETECTED"
  | "RANKING_ABSENT"
  | "RANKING_DETECTED"
  | "PRIORITIZATION_ABSENT"
  | "PRIORITIZATION_DETECTED"
  | "SCORING_ABSENT"
  | "SCORING_DETECTED"
  | "RESOURCE_ALLOCATION_ABSENT"
  | "RESOURCE_ALLOCATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "RECOMMENDATION_RECONSTRUCTION_ENGINE_IS_NOT_CONTROL";

export type TruthRecommendationReconstructionValidation = Readonly<{
  valid: boolean;
  validationState: TruthRecommendationReconstructionValidationState;
  reasonCodes: readonly TruthRecommendationReconstructionReasonCode[];
  contextValid: boolean;
  evidenceValid: boolean;
  governanceValid: boolean;
  confidenceValid: boolean;
  alternativeValid: boolean;
  environmentValid: boolean;
  bundleValid: boolean;
  tenantIsolationValid: boolean;
  replayValid: boolean;
  failClosed: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  approvalAbsent: boolean;
  rankingAbsent: boolean;
  prioritizationAbsent: boolean;
  scoringAbsent: boolean;
  resourceAllocationAbsent: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
}>;

export type TruthRecommendationReconstructionReplay = Readonly<{
  replayResult: TruthReplayResult;
  reconstructedBundle: TruthRecommendationContextBundle;
  reconstructedContract: TruthRecommendationReconstructionContract;
}>;

export type TruthRecommendationReconstructionVisibility = Readonly<{
  recommendation_id: string;
  reconstruction_state: TruthRecommendationReconstructionState;
  context_bundle_status: "VALID" | "INVALID";
  evidence_status: "VALID" | "INVALID";
  governance_status: "VALID" | "INVALID";
  confidence_status: "VALID" | "INVALID";
  alternative_status: "VALID" | "INVALID";
  environment_status: "VALID" | "INVALID";
  validation_status: TruthRecommendationReconstructionValidationState;
  replay_status: TruthReplayResult;
  readOnly: true;
  tenantScoped: boolean;
  auditable: true;
  replayLinked: true;
}>;

export type TruthRecommendationReconstructionObservability = Readonly<{
  reconstructions_total: number;
  successful_reconstructions: number;
  failed_reconstructions: number;
  context_retrieval_failures: number;
  bundle_assembly_failures: number;
  validation_failures: number;
  replay_failures: number;
  tenant_isolation_failures: number;
}>;

export type TruthRecommendationReconstructionInput = Readonly<{
  request: TruthRecommendationReconstructionRequest;
  recommendation: SealedTruthRecommendationContract;
  acceptedRecord: SealedTruthRecommendationRecorder;
  alternativeRecords?: readonly SealedTruthRecommendationRecorder[];
  rejectedRecords?: readonly SealedTruthRecommendationRecorder[];
  reconstructionScope?: TruthRecommendationReconstructionScope;
  reconstructionReason?: string;
  recommendationObjectives?: readonly string[];
  environment?: Partial<TruthRecommendationEnvironmentContext>;
  knownEvidenceIds?: readonly string[];
  accessTenantId?: string;
  missingContextComponentDetected?: boolean;
  incompleteContextDetected?: boolean;
  evidenceMismatchDetected?: boolean;
  policyMismatchDetected?: boolean;
  confidenceMismatchDetected?: boolean;
  missingAlternativeDetected?: boolean;
  missingRejectionRationaleDetected?: boolean;
  environmentMismatchDetected?: boolean;
  missingEnvironmentStateDetected?: boolean;
  contextAssemblyFailureDetected?: boolean;
  incompleteBundleDetected?: boolean;
  replayMismatchDetected?: boolean;
  crossTenantReconstructionDetected?: boolean;
  crossTenantContextAccessDetected?: boolean;
  observabilityGapDetected?: boolean;
  remediationDocumented?: boolean;
  executionRequested?: boolean;
  approvalRequested?: boolean;
  rankingRequested?: boolean;
  prioritizationRequested?: boolean;
  scoringRequested?: boolean;
  resourceAllocationRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type SealedTruthRecommendationReconstruction = Readonly<{
  request: TruthRecommendationReconstructionRequest;
  recommendation: SealedTruthRecommendationContract;
  acceptedRecord: SealedTruthRecommendationRecorder;
  alternativeRecords: readonly SealedTruthRecommendationRecorder[];
  rejectedRecords: readonly SealedTruthRecommendationRecorder[];
  reconstruction: TruthRecommendationReconstructionContract;
  contextBundle: TruthRecommendationContextBundle;
  ledgerEntry: TruthRecommendationReconstructionLedgerEntry;
  validation: TruthRecommendationReconstructionValidation;
  replay: TruthRecommendationReconstructionReplay;
  visibility: TruthRecommendationReconstructionVisibility;
  observability: TruthRecommendationReconstructionObservability;
  certification: TruthCertificationState;
  sealed: true;
  readOnly: true;
  executionAuthorized: false;
  approvalAllowed: false;
  rankingAllowed: false;
  prioritizationAllowed: false;
  scoringAllowed: false;
  resourceAllocationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export type TruthRecommendationCertificationDomain =
  | "6E.1 Recommendation Contract"
  | "6E.2 Recommendation Recorder"
  | "6E.3 Recommendation Evolution Tracker"
  | "6E.4 Recommendation Reconstruction Engine"
  | "Replay Preservation"
  | "Confidence Integrity"
  | "Governance Compliance"
  | "Tenant Isolation"
  | "Operator Visibility"
  | "Advisory-Only Enforcement";

export type TruthRecommendationLayerCertificationState =
  | "RECOMMENDATION_LAYER_CERTIFIED"
  | "RECOMMENDATION_LAYER_CONDITIONAL"
  | "RECOMMENDATION_LAYER_FAILED";

export interface TruthRecommendationCertificationRequest {
  tenant_id: string;
  now: string;
}

export interface TruthRecommendationEvolutionCertificationEvidence {
  certification: TruthCertificationState;
  replayResult: TruthReplayResult;
  lineagePreserved: boolean;
  versionManagementValid: boolean;
  supersessionManagementValid: boolean;
  impactAnalysisValid: boolean;
  tenantScoped: boolean;
  visibilityOperational: boolean;
  governanceCompliant: boolean;
  confidencePreserved: boolean;
  advisoryOnly: boolean;
  deterministic: boolean;
}

export interface TruthRecommendationCertificationContract {
  certification_id: string;
  certification_timestamp: string;
  recommendation_layer_version: string;
  certification_scope: readonly TruthRecommendationCertificationDomain[];
  certification_state: TruthCertificationState;
  certification_reason: string;
  certification_authority: string;
  evidence_references: readonly string[];
  replay_references: readonly string[];
}

export type TruthRecommendationCertificationValidationState = "VALID" | "INVALID";

export type TruthRecommendationCertificationReasonCode =
  | "CERTIFICATION_SCOPE_PRESENT"
  | "CERTIFICATION_SCOPE_MISSING"
  | "CERTIFICATION_AUTHORITY_PRESENT"
  | "CERTIFICATION_AUTHORITY_MISSING"
  | "EVIDENCE_REFERENCES_PRESENT"
  | "EVIDENCE_REFERENCES_MISSING"
  | "REPLAY_REFERENCES_PRESENT"
  | "REPLAY_REFERENCES_MISSING"
  | "RECOMMENDATION_CONTRACT_CERTIFIED"
  | "RECOMMENDATION_CONTRACT_FAILED"
  | "RECOMMENDATION_RECORDER_CERTIFIED"
  | "RECOMMENDATION_RECORDER_FAILED"
  | "RECOMMENDATION_EVOLUTION_CERTIFIED"
  | "RECOMMENDATION_EVOLUTION_FAILED"
  | "RECOMMENDATION_RECONSTRUCTION_CERTIFIED"
  | "RECOMMENDATION_RECONSTRUCTION_FAILED"
  | "REPLAY_CERTIFIED"
  | "REPLAY_FAILED"
  | "CONFIDENCE_CERTIFIED"
  | "CONFIDENCE_FAILED"
  | "GOVERNANCE_CERTIFIED"
  | "GOVERNANCE_FAILED"
  | "TENANT_ISOLATION_CERTIFIED"
  | "TENANT_ISOLATION_FAILED"
  | "VISIBILITY_CERTIFIED"
  | "VISIBILITY_FAILED"
  | "ADVISORY_ONLY_CERTIFIED"
  | "ADVISORY_ONLY_FAILED"
  | "REPLAY_REPRODUCED"
  | "REPLAY_MISMATCH"
  | "REPLAY_INCOMPLETE_EVIDENCE"
  | "REPLAY_UNREPLAYABLE"
  | "VISIBILITY_AVAILABLE"
  | "VISIBILITY_BLOCKED"
  | "OBSERVABILITY_OPERATIONAL"
  | "OBSERVABILITY_GAP_DETECTED"
  | "REPORTING_LIMITATIONS_ABSENT"
  | "REPORTING_LIMITATIONS_PRESENT"
  | "DECISION_ENGINE_PASS"
  | "DECISION_ENGINE_CONDITIONAL"
  | "DECISION_ENGINE_FAIL"
  | "FAIL_CLOSED_ENFORCED"
  | "FAIL_OPEN_DETECTED"
  | "LEDGER_APPEND_ONLY"
  | "LEDGER_IMMUTABLE"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "APPROVAL_ABSENT"
  | "APPROVAL_DETECTED"
  | "RANKING_ABSENT"
  | "RANKING_DETECTED"
  | "PRIORITIZATION_ABSENT"
  | "PRIORITIZATION_DETECTED"
  | "SCORING_ABSENT"
  | "SCORING_DETECTED"
  | "RESOURCE_ALLOCATION_ABSENT"
  | "RESOURCE_ALLOCATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "RECOMMENDATION_CERTIFICATION_GATE_IS_NOT_CONTROL";

export interface TruthRecommendationCertificationLedgerEntry {
  certification_id: string;
  tenant_id: string;
  certification_state: TruthCertificationState;
  completion_gate: TruthRecommendationLayerCertificationState;
  replay_status: TruthReplayResult;
  failed_components: readonly string[];
  required_actions: readonly string[];
}

export type TruthRecommendationCertificationReplay = Readonly<{
  replayResult: TruthReplayResult;
  executedTests: readonly string[];
  decisionState: TruthCertificationState;
}>;

export type TruthRecommendationCertificationVisibility = Readonly<{
  certification_state: TruthCertificationState;
  recommendation_layer_version: string;
  certified_components: readonly string[];
  failed_components: readonly string[];
  confidence_status: "PASS" | "FAIL";
  governance_status: "PASS" | "FAIL";
  tenant_status: "PASS" | "FAIL";
  replay_status: TruthReplayResult;
  advisory_status: "PASS" | "FAIL";
  visibility_status: "PASS" | "FAIL";
  required_actions: readonly string[];
  certification_timestamp: string;
  certification_authority: string;
  readOnly: true;
  tenantScoped: boolean;
  auditable: true;
  replayLinked: true;
}>;

export type TruthRecommendationCertificationObservability = Readonly<{
  recommendation_certifications_total: number;
  recommendation_pass_total: number;
  recommendation_conditional_total: number;
  recommendation_fail_total: number;
  contract_failures: number;
  recorder_failures: number;
  evolution_failures: number;
  reconstruction_failures: number;
  confidence_failures: number;
  governance_failures: number;
  tenant_isolation_failures: number;
  visibility_failures: number;
  replay_failures: number;
  certification_replay_failures: number;
}>;

export type TruthRecommendationCertificationValidation = Readonly<{
  valid: boolean;
  validationState: TruthRecommendationCertificationValidationState;
  reasonCodes: readonly TruthRecommendationCertificationReasonCode[];
  scopeValid: boolean;
  authorityValid: boolean;
  evidenceValid: boolean;
  replayReferencesValid: boolean;
  recommendationContractCertified: boolean;
  recommendationRecorderCertified: boolean;
  recommendationEvolutionCertified: boolean;
  recommendationReconstructionCertified: boolean;
  replayCertified: boolean;
  confidenceCertified: boolean;
  governanceCertified: boolean;
  tenantIsolationCertified: boolean;
  visibilityCertified: boolean;
  advisoryOnlyCertified: boolean;
  failClosed: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  approvalAbsent: boolean;
  rankingAbsent: boolean;
  prioritizationAbsent: boolean;
  scoringAbsent: boolean;
  resourceAllocationAbsent: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
}>;

export type TruthRecommendationCertificationInput = Readonly<{
  request: TruthRecommendationCertificationRequest;
  recommendationContract: SealedTruthRecommendationContract;
  recommendationRecorder: SealedTruthRecommendationRecorder;
  recommendationEvolution: TruthRecommendationEvolutionCertificationEvidence;
  recommendationReconstruction: SealedTruthRecommendationReconstruction;
  certificationAuthority: string;
  certificationReason: string;
  recommendationLayerVersion?: string;
  certificationScope?: readonly TruthRecommendationCertificationDomain[];
  evidenceReferences?: readonly string[];
  replayReferences?: readonly string[];
  accessTenantId?: string;
  duplicateRecommendationIdentityDetected?: boolean;
  missingRecommendationRationaleDetected?: boolean;
  alternativeLostDetected?: boolean;
  brokenEvolutionLineageDetected?: boolean;
  incompleteReconstructionBundleDetected?: boolean;
  confidenceCorruptionDetected?: boolean;
  governanceBypassDetected?: boolean;
  executionAuthorityDetected?: boolean;
  replayMismatchDetected?: boolean;
  crossTenantAccessDetected?: boolean;
  hiddenRecommendationDetected?: boolean;
  hiddenConfidenceIssueDetected?: boolean;
  hiddenGovernanceIssueDetected?: boolean;
  hiddenCertificationFailureDetected?: boolean;
  observabilityGapDetected?: boolean;
  reportingLimitationDetected?: boolean;
  remediationPlanExists?: boolean;
  governanceApproved?: boolean;
  executionRequested?: boolean;
  approvalRequested?: boolean;
  rankingRequested?: boolean;
  prioritizationRequested?: boolean;
  scoringRequested?: boolean;
  resourceAllocationRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type SealedTruthRecommendationCertificationGate = Readonly<{
  request: TruthRecommendationCertificationRequest;
  certification: TruthRecommendationCertificationContract;
  validation: TruthRecommendationCertificationValidation;
  replay: TruthRecommendationCertificationReplay;
  visibility: TruthRecommendationCertificationVisibility;
  observability: TruthRecommendationCertificationObservability;
  ledgerEntry: TruthRecommendationCertificationLedgerEntry;
  completionGate: TruthRecommendationLayerCertificationState;
  sealed: true;
  readOnly: true;
  executionAuthorized: false;
  approvalAllowed: false;
  rankingAllowed: false;
  prioritizationAllowed: false;
  scoringAllowed: false;
  resourceAllocationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export type TruthDecisionType =
  | "APPROVAL"
  | "REJECTION"
  | "RESTRICTION"
  | "ESCALATION"
  | "CERTIFICATION"
  | "RISK"
  | "GOVERNANCE"
  | "OPERATIONAL"
  | "RECOVERY"
  | "INVESTIGATION";

export type TruthDecisionCategory =
  | "TRUTH"
  | "EVENT"
  | "EVIDENCE"
  | "RECOMMENDATION"
  | "GOVERNANCE"
  | "CERTIFICATION"
  | "RUNTIME"
  | "AUDIT"
  | "SECURITY"
  | "OPERATIONS";

export type TruthDecisionAuthorityType =
  | "OPERATOR"
  | "GOVERNANCE_ENGINE"
  | "CERTIFICATION_ENGINE"
  | "SUPERVISION_ENGINE";

export type TruthDecisionConfidenceState = "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";
export type TruthDecisionState = "CREATED" | "VALIDATED" | "ACTIVE" | "SUPERSEDED" | "RESTRICTED" | "ARCHIVED";
export type TruthDecisionValidationState = "VALID" | "INVALID";

export interface TruthDecisionContractRequest {
  tenant_id: string;
  now: string;
}

export interface TruthDecisionPayload {
  decision_rationale: string;
  decision_summary: string;
  decision_reasoning: readonly string[];
  decision_assumptions: readonly string[];
  decision_constraints: readonly string[];
}

export interface TruthDecisionGovernanceBinding {
  governance_policy_ids: readonly string[];
  governance_constraints: readonly string[];
  authority_scope: string;
  approval_requirements: readonly string[];
  governance_references: readonly string[];
}

export interface TruthDecisionAuthorityBinding {
  decision_authority: string;
  authority_type: TruthDecisionAuthorityType;
  authority_scope: string;
  authority_timestamp: string;
  authority_evidence: readonly string[];
}

export interface TruthDecisionConfidenceBinding {
  confidence_score: number;
  confidence_state: TruthDecisionConfidenceState;
  confidence_rationale: string;
  confidence_evidence: readonly string[];
}

export interface TruthDecisionContract {
  decision_id: string;
  tenant_id: string;
  mission_id: string;
  decision_type: TruthDecisionType;
  decision_category: TruthDecisionCategory;
  decision_timestamp: string;
  decision_version: string;
  decision_state: TruthDecisionState;
  decision_payload: TruthDecisionPayload;
  decision_hash: string;
  created_timestamp: string;
  supporting_evidence_ids: readonly string[];
  supporting_truth_record_ids: readonly string[];
  supporting_event_ids: readonly string[];
  supporting_recommendation_ids: readonly string[];
  supporting_graph_references: readonly string[];
  governance_binding: TruthDecisionGovernanceBinding;
  authority_binding: TruthDecisionAuthorityBinding;
  confidence_binding: TruthDecisionConfidenceBinding;
  replay_reference_ids: readonly string[];
  replay_bundle_id?: string;
  replay_hash: string;
}

export interface TruthDecisionLedgerEntry {
  decision_id: string;
  tenant_id: string;
  mission_id: string;
  decision_state: TruthDecisionState;
  decision_type: TruthDecisionType;
  decision_category: TruthDecisionCategory;
  authority_type: TruthDecisionAuthorityType;
  confidence_state: TruthDecisionConfidenceState;
  validation_status: TruthDecisionValidationState;
  replay_status: TruthReplayResult;
  failure_reason: string | null;
}

export type TruthDecisionContractReasonCode =
  | "DECISION_ID_PRESENT"
  | "DECISION_ID_MISSING"
  | "DECISION_ID_UNIQUE"
  | "DECISION_ID_DUPLICATE"
  | "DECISION_ID_IMMUTABLE"
  | "DECISION_ID_MUTATED"
  | "DECISION_HASH_VALID"
  | "DECISION_HASH_MISMATCH"
  | "TENANT_ID_PRESENT"
  | "TENANT_ID_MISSING"
  | "MISSION_ID_PRESENT"
  | "MISSION_ID_MISSING"
  | "DECISION_TYPE_PRESENT"
  | "DECISION_TYPE_MISSING"
  | "DECISION_TYPE_VALID"
  | "DECISION_TYPE_INVALID"
  | "DECISION_TYPE_NOT_DEPRECATED"
  | "DECISION_TYPE_DEPRECATED"
  | "DECISION_CATEGORY_SINGLE"
  | "DECISION_CATEGORY_MULTIPLE"
  | "DECISION_CATEGORY_VALID"
  | "DECISION_CATEGORY_MISMATCH"
  | "DECISION_TIMESTAMP_VALID"
  | "DECISION_TIMESTAMP_INVALID"
  | "DECISION_VERSION_PRESENT"
  | "DECISION_VERSION_MISSING"
  | "RATIONALE_PRESENT"
  | "RATIONALE_MISSING"
  | "REASONING_PRESENT"
  | "REASONING_MISSING"
  | "SUPPORTING_EVIDENCE_PRESENT"
  | "SUPPORTING_EVIDENCE_MISSING"
  | "SUPPORTING_EVIDENCE_RESOLVABLE"
  | "SUPPORTING_EVIDENCE_UNRESOLVABLE"
  | "GOVERNANCE_BINDING_PRESENT"
  | "GOVERNANCE_BINDING_MISSING"
  | "AUTHORITY_SCOPE_VALID"
  | "AUTHORITY_SCOPE_VIOLATION"
  | "AUTHORITY_BINDING_PRESENT"
  | "AUTHORITY_BINDING_MISSING"
  | "AUTHORITY_TYPE_VALID"
  | "AUTHORITY_TYPE_INVALID"
  | "AUTHORITY_EVIDENCE_PRESENT"
  | "AUTHORITY_EVIDENCE_MISSING"
  | "CONFIDENCE_SCORE_PRESENT"
  | "CONFIDENCE_SCORE_MISSING"
  | "CONFIDENCE_STATE_VALID"
  | "CONFIDENCE_STATE_INVALID"
  | "CONFIDENCE_RATIONALE_PRESENT"
  | "CONFIDENCE_RATIONALE_MISSING"
  | "STATE_VALID"
  | "STATE_INVALID"
  | "STATE_TRANSITION_VALID"
  | "STATE_TRANSITION_INVALID"
  | "REPLAY_BINDING_VALID"
  | "REPLAY_BINDING_INVALID"
  | "REPLAY_HASH_VALID"
  | "REPLAY_HASH_MISMATCH"
  | "TENANT_ISOLATION_VALID"
  | "TENANT_ISOLATION_FAILED"
  | "REPLAY_REPRODUCED"
  | "REPLAY_MISMATCH"
  | "REPLAY_INCOMPLETE_EVIDENCE"
  | "REPLAY_UNREPLAYABLE"
  | "VISIBILITY_AVAILABLE"
  | "VISIBILITY_BLOCKED"
  | "OBSERVABILITY_OPERATIONAL"
  | "OBSERVABILITY_GAP_DETECTED"
  | "CERTIFICATION_PASS"
  | "CERTIFICATION_CONDITIONAL_PASS"
  | "CERTIFICATION_FAIL"
  | "FAIL_CLOSED_ENFORCED"
  | "FAIL_OPEN_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "APPROVAL_ABSENT"
  | "APPROVAL_DETECTED"
  | "RANKING_ABSENT"
  | "RANKING_DETECTED"
  | "PRIORITIZATION_ABSENT"
  | "PRIORITIZATION_DETECTED"
  | "SCORING_ABSENT"
  | "SCORING_DETECTED"
  | "RESOURCE_ALLOCATION_ABSENT"
  | "RESOURCE_ALLOCATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "DECISION_CONTRACT_IS_NOT_CONTROL";

export type TruthDecisionContractValidation = Readonly<{
  valid: boolean;
  validationState: TruthDecisionValidationState;
  reasonCodes: readonly TruthDecisionContractReasonCode[];
  identityValid: boolean;
  typeValid: boolean;
  categoryValid: boolean;
  rationaleValid: boolean;
  evidenceValid: boolean;
  governanceValid: boolean;
  authorityValid: boolean;
  confidenceValid: boolean;
  stateValid: boolean;
  replayValid: boolean;
  failClosed: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  approvalAbsent: boolean;
  rankingAbsent: boolean;
  prioritizationAbsent: boolean;
  scoringAbsent: boolean;
  resourceAllocationAbsent: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
}>;

export type TruthDecisionContractReplay = Readonly<{
  replayResult: TruthReplayResult;
  reconstructedDecision: TruthDecisionContract;
}>;

export type TruthDecisionContractVisibility = Readonly<{
  decision_id: string;
  decision_type: TruthDecisionType;
  decision_category: TruthDecisionCategory;
  decision_state: TruthDecisionState;
  decision_authority: string;
  authority_type: TruthDecisionAuthorityType;
  confidence_state: TruthDecisionConfidenceState;
  confidence_score: number;
  governance_scope: string;
  validation_status: TruthDecisionValidationState;
  replay_status: TruthReplayResult;
  timestamp: string;
  readOnly: true;
  tenantScoped: boolean;
  auditable: true;
  replayLinked: true;
}>;

export type TruthDecisionContractObservability = Readonly<{
  decisions_created_total: number;
  decisions_validated_total: number;
  decisions_active_total: number;
  decisions_superseded_total: number;
  decision_validation_failures: number;
  authority_binding_failures: number;
  governance_binding_failures: number;
  confidence_binding_failures: number;
  replay_failures: number;
  state_transition_failures: number;
}>;

export type TruthDecisionContractInput = Readonly<{
  request: TruthDecisionContractRequest;
  missionId: string;
  decisionType: TruthDecisionType;
  decisionCategory: TruthDecisionCategory;
  decisionPayload: TruthDecisionPayload;
  governanceBinding: TruthDecisionGovernanceBinding;
  authorityBinding: TruthDecisionAuthorityBinding;
  confidenceBinding: TruthDecisionConfidenceBinding;
  supportingEvidenceIds: readonly string[];
  supportingTruthRecordIds?: readonly string[];
  supportingEventIds?: readonly string[];
  supportingRecommendationIds?: readonly string[];
  supportingGraphReferences?: readonly string[];
  replayReferenceIds: readonly string[];
  decisionId?: string;
  decisionTimestamp?: string;
  decisionVersion?: string;
  decisionState?: TruthDecisionState;
  replayBundleId?: string;
  priorDecisionIds?: readonly string[];
  priorState?: TruthDecisionState | null;
  accessTenantId?: string;
  knownEvidenceIds?: readonly string[];
  identityMutated?: boolean;
  hashMismatchDetected?: boolean;
  deprecatedDecisionTypeDetected?: boolean;
  multipleCategoriesDetected?: boolean;
  typeCategoryMatches?: boolean;
  missingRationaleDetected?: boolean;
  emptyReasoningDetected?: boolean;
  missingSupportingEvidenceDetected?: boolean;
  unresolvableEvidenceDetected?: boolean;
  missingGovernanceBindingDetected?: boolean;
  authorityScopeViolationDetected?: boolean;
  missingAuthorityBindingDetected?: boolean;
  unknownAuthorityDetected?: boolean;
  missingAuthorityEvidenceDetected?: boolean;
  missingConfidenceScoreDetected?: boolean;
  unsupportedConfidenceStateDetected?: boolean;
  confidenceCorruptionDetected?: boolean;
  invalidStateTransitionDetected?: boolean;
  unknownStateDetected?: boolean;
  replayReferencesResolvable?: boolean;
  replayHashMismatchDetected?: boolean;
  replayMismatchDetected?: boolean;
  observabilityGapDetected?: boolean;
  remediationDocumented?: boolean;
  executionRequested?: boolean;
  approvalRequested?: boolean;
  rankingRequested?: boolean;
  prioritizationRequested?: boolean;
  scoringRequested?: boolean;
  resourceAllocationRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type SealedTruthDecisionContract = Readonly<{
  request: TruthDecisionContractRequest;
  decision: TruthDecisionContract;
  ledgerEntry: TruthDecisionLedgerEntry;
  validation: TruthDecisionContractValidation;
  replay: TruthDecisionContractReplay;
  visibility: TruthDecisionContractVisibility;
  observability: TruthDecisionContractObservability;
  certification: TruthCertificationState;
  sealed: true;
  readOnly: true;
  executionAuthorized: false;
  approvalAllowed: false;
  rankingAllowed: false;
  prioritizationAllowed: false;
  scoringAllowed: false;
  resourceAllocationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export type TruthDecisionRecordType =
  | "ACCEPTED_RECOMMENDATION"
  | "REJECTED_RECOMMENDATION"
  | "OPERATOR_ACTION";
export type TruthDecisionRecordState = "RECORDED" | "REJECTED";
export type TruthDecisionRecordClassification =
  | "ACCEPTED"
  | "REJECTED"
  | "OPERATOR_INITIATED"
  | "GOVERNANCE_INITIATED"
  | "CERTIFICATION_INITIATED";
export type TruthDecisionRelationshipType =
  | "ACCEPTS"
  | "REJECTS"
  | "OVERRIDES"
  | "ESCALATES"
  | "RESTRICTS"
  | "DERIVED_FROM"
  | "SUPERSEDES";
export type TruthDecisionOperatorAction =
  | "APPROVAL_ACTION"
  | "REJECTION_ACTION"
  | "OVERRIDE_ACTION"
  | "RESTRICTION_ACTION"
  | "ESCALATION_ACTION"
  | "REVIEW_ACTION"
  | "AUTHORIZATION_ACTION";
export type TruthDecisionRecorderValidationState = "VALID" | "INVALID";

export interface TruthDecisionRecorderRequest {
  tenant_id: string;
  now: string;
}

export interface TruthDecisionRecordRelationship {
  target_id: string;
  relationship_type: TruthDecisionRelationshipType;
  relationship_rationale: string;
}

export interface TruthDecisionLineage {
  source_recommendation_id?: string;
  parent_decision_id?: string;
  influenced_by_operator_id?: string;
  governance_parent_id?: string;
  certification_parent_id?: string;
  superseded_by_decision_id?: string;
}

export interface TruthDecisionRecordContract {
  record_id: string;
  decision_id: string;
  tenant_id: string;
  mission_id: string;
  record_timestamp: string;
  record_type: TruthDecisionRecordType;
  record_state: TruthDecisionRecordState;
  decision_hash: string;
  evidence_references: readonly string[];
  replay_references: readonly string[];
}

export interface TruthDecisionRecorderLedgerEntry {
  record_id: string;
  decision_id: string;
  tenant_id: string;
  mission_id: string;
  record_type: TruthDecisionRecordType;
  classification: TruthDecisionRecordClassification;
  decision_authority: string;
  record_state: TruthDecisionRecordState;
  validation_status: TruthDecisionRecorderValidationState;
  lineage_status: "VALID" | "INVALID";
  replay_status: TruthReplayResult;
  transaction_status: "COMMITTED" | "ROLLED_BACK" | "NOT_STARTED";
  failure_reason: string | null;
}

export type TruthDecisionRecorderReasonCode =
  | "RECORD_ID_PRESENT"
  | "RECORD_ID_MISSING"
  | "DECISION_ID_PRESENT"
  | "DECISION_ID_MISSING"
  | "RECORD_TYPE_PRESENT"
  | "RECORD_TYPE_MISSING"
  | "RECORD_TYPE_VALID"
  | "RECORD_TYPE_INVALID"
  | "RECORD_TIMESTAMP_VALID"
  | "RECORD_TIMESTAMP_INVALID"
  | "DECISION_CONTENT_PRESENT"
  | "DECISION_CONTENT_MISSING"
  | "ACCEPTED_RECOMMENDATION_PRESENT"
  | "ACCEPTED_RECOMMENDATION_MISSING"
  | "REJECTION_RATIONALE_PRESENT"
  | "REJECTION_RATIONALE_MISSING"
  | "REJECTION_AUTHORITY_PRESENT"
  | "REJECTION_AUTHORITY_MISSING"
  | "ALTERNATIVE_SELECTED_PRESENT"
  | "ALTERNATIVE_SELECTED_MISSING"
  | "OPERATOR_IDENTITY_PRESENT"
  | "OPERATOR_IDENTITY_MISSING"
  | "OPERATOR_ACTION_PRESENT"
  | "OPERATOR_ACTION_MISSING"
  | "CLASSIFICATION_SINGLE"
  | "CLASSIFICATION_MULTIPLE"
  | "CLASSIFICATION_VALID"
  | "CLASSIFICATION_INVALID"
  | "LINEAGE_VALID"
  | "LINEAGE_BROKEN"
  | "LINEAGE_ORPHANED"
  | "DECISION_VALID"
  | "DECISION_INVALID"
  | "AUTHORITY_VALID"
  | "AUTHORITY_INVALID"
  | "OPERATOR_VALID"
  | "OPERATOR_INVALID"
  | "EVIDENCE_VALID"
  | "EVIDENCE_INVALID"
  | "GOVERNANCE_VALID"
  | "GOVERNANCE_INVALID"
  | "CONFIDENCE_VALID"
  | "CONFIDENCE_INVALID"
  | "RELATIONSHIPS_VALID"
  | "RELATIONSHIPS_INVALID"
  | "REPLAY_BINDING_VALID"
  | "REPLAY_BINDING_INVALID"
  | "TRANSACTION_PROTECTED"
  | "PARTIAL_RECORD_DETECTED"
  | "ROLLBACK_FAILED"
  | "TENANT_ISOLATION_VALID"
  | "TENANT_ISOLATION_FAILED"
  | "REPLAY_REPRODUCED"
  | "REPLAY_MISMATCH"
  | "REPLAY_INCOMPLETE_EVIDENCE"
  | "REPLAY_UNREPLAYABLE"
  | "VISIBILITY_AVAILABLE"
  | "VISIBILITY_BLOCKED"
  | "OBSERVABILITY_OPERATIONAL"
  | "OBSERVABILITY_GAP_DETECTED"
  | "CERTIFICATION_PASS"
  | "CERTIFICATION_CONDITIONAL_PASS"
  | "CERTIFICATION_FAIL"
  | "FAIL_CLOSED_ENFORCED"
  | "FAIL_OPEN_DETECTED"
  | "LEDGER_APPEND_ONLY"
  | "LEDGER_IMMUTABLE"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "APPROVAL_ABSENT"
  | "APPROVAL_DETECTED"
  | "RANKING_ABSENT"
  | "RANKING_DETECTED"
  | "PRIORITIZATION_ABSENT"
  | "PRIORITIZATION_DETECTED"
  | "SCORING_ABSENT"
  | "SCORING_DETECTED"
  | "RESOURCE_ALLOCATION_ABSENT"
  | "RESOURCE_ALLOCATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "DECISION_RECORDER_IS_NOT_CONTROL";

export type TruthDecisionRecorderValidation = Readonly<{
  valid: boolean;
  validationState: TruthDecisionRecorderValidationState;
  reasonCodes: readonly TruthDecisionRecorderReasonCode[];
  decisionValid: boolean;
  classificationValid: boolean;
  lineageValid: boolean;
  transactionProtected: boolean;
  tenantIsolationValid: boolean;
  replayValid: boolean;
  failClosed: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  approvalAbsent: boolean;
  rankingAbsent: boolean;
  prioritizationAbsent: boolean;
  scoringAbsent: boolean;
  resourceAllocationAbsent: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
}>;

export type TruthDecisionRecorderReplay = Readonly<{
  replayResult: TruthReplayResult;
  reconstructedRecord: TruthDecisionRecordContract;
  reconstructedLineage: TruthDecisionLineage;
  reconstructedRelationships: readonly TruthDecisionRecordRelationship[];
}>;

export type TruthDecisionRecorderVisibility = Readonly<{
  decision_id: string;
  record_type: TruthDecisionRecordType;
  classification: TruthDecisionRecordClassification;
  decision_authority: string;
  record_state: TruthDecisionRecordState;
  validation_status: TruthDecisionRecorderValidationState;
  lineage_status: "VALID" | "INVALID";
  replay_status: TruthReplayResult;
  timestamp: string;
  readOnly: true;
  tenantScoped: boolean;
  auditable: true;
  replayLinked: true;
}>;

export type TruthDecisionRecorderObservability = Readonly<{
  decisions_recorded_total: number;
  accepted_recommendations_total: number;
  rejected_recommendations_total: number;
  operator_actions_total: number;
  classification_failures: number;
  validation_failures: number;
  lineage_failures: number;
  transaction_failures: number;
  replay_failures: number;
  tenant_isolation_failures: number;
}>;

export type TruthDecisionRecorderInput = Readonly<{
  request: TruthDecisionRecorderRequest;
  decision: SealedTruthDecisionContract;
  recordType: TruthDecisionRecordType;
  classification?: TruthDecisionRecordClassification;
  recordTimestamp?: string;
  recordId?: string;
  decisionContent?: Record<string, string | number | boolean>;
  acceptedRecommendationId?: string;
  acceptanceRationale?: string;
  rejectionRationale?: string;
  alternativeSelectedId?: string;
  operatorId?: string;
  operatorAction?: TruthDecisionOperatorAction;
  lineage?: Partial<TruthDecisionLineage>;
  relationships?: readonly TruthDecisionRecordRelationship[];
  priorRecords?: readonly TruthDecisionRecorderLedgerEntry[];
  knownDecisionIds?: readonly string[];
  knownRecommendationIds?: readonly string[];
  knownEvidenceIds?: readonly string[];
  accessTenantId?: string;
  missingDecisionContentDetected?: boolean;
  missingAcceptedRecommendationDetected?: boolean;
  missingRejectionRationaleDetected?: boolean;
  missingRejectionAuthorityDetected?: boolean;
  missingAlternativeSelectedDetected?: boolean;
  missingOperatorIdentityDetected?: boolean;
  missingOperatorActionDetected?: boolean;
  brokenLineageChainDetected?: boolean;
  orphanedDecisionDetected?: boolean;
  multipleClassificationsDetected?: boolean;
  unknownClassificationDetected?: boolean;
  invalidDecisionDetected?: boolean;
  invalidAuthorityDetected?: boolean;
  invalidOperatorDetected?: boolean;
  invalidEvidenceDetected?: boolean;
  invalidGovernanceDetected?: boolean;
  invalidConfidenceDetected?: boolean;
  partialRecordDetected?: boolean;
  rollbackFailed?: boolean;
  replayMismatchDetected?: boolean;
  classificationMismatchDetected?: boolean;
  lineageMismatchDetected?: boolean;
  crossTenantDecisionAccessDetected?: boolean;
  crossTenantLineageTraversalDetected?: boolean;
  unknownRelationshipTypeDetected?: boolean;
  relationshipCorruptionDetected?: boolean;
  replayReferencesResolvable?: boolean;
  observabilityGapDetected?: boolean;
  remediationDocumented?: boolean;
  executionRequested?: boolean;
  approvalRequested?: boolean;
  rankingRequested?: boolean;
  prioritizationRequested?: boolean;
  scoringRequested?: boolean;
  resourceAllocationRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type SealedTruthDecisionRecorder = Readonly<{
  request: TruthDecisionRecorderRequest;
  decision: SealedTruthDecisionContract;
  record: TruthDecisionRecordContract;
  classification: TruthDecisionRecordClassification;
  lineage: TruthDecisionLineage;
  relationships: readonly TruthDecisionRecordRelationship[];
  ledgerEntry: TruthDecisionRecorderLedgerEntry;
  validation: TruthDecisionRecorderValidation;
  replay: TruthDecisionRecorderReplay;
  visibility: TruthDecisionRecorderVisibility;
  observability: TruthDecisionRecorderObservability;
  certification: TruthCertificationState;
  sealed: true;
  readOnly: true;
  executionAuthorized: false;
  approvalAllowed: false;
  rankingAllowed: false;
  prioritizationAllowed: false;
  scoringAllowed: false;
  resourceAllocationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export type TruthDecisionEvolutionType = "CHANGE_TRACKED" | "REVISION_CREATED" | "VERSION_CREATED" | "SUPERSESSION_RECORDED";
export type TruthDecisionRevisionType =
  | "MINOR_REVISION"
  | "MAJOR_REVISION"
  | "GOVERNANCE_REVISION"
  | "AUTHORITY_REVISION"
  | "CONFIDENCE_REVISION"
  | "EVIDENCE_REVISION"
  | "STATE_REVISION";
export type TruthDecisionVersionState = "CURRENT" | "SUPERSEDED" | "ARCHIVED";
export type TruthDecisionImpactState = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type TruthDecisionEvolutionValidationState = "VALID" | "INVALID";

export interface TruthDecisionEvolutionRequest {
  tenant_id: string;
  now: string;
}

export interface TruthDecisionVersionReference {
  decision_version: string;
  version_number: number;
  version_state: TruthDecisionVersionState;
  version_timestamp: string;
  superseded_by?: string;
  supersedes?: string;
}

export interface TruthDecisionChangeSet {
  before_state: Readonly<Record<string, unknown>>;
  after_state: Readonly<Record<string, unknown>>;
  changed_fields: readonly string[];
  change_rationale: string;
}

export interface TruthDecisionImpactAssessment {
  impact_state: TruthDecisionImpactState;
  impact_rationale: string;
  evidence_impact: readonly string[];
  governance_impact: readonly string[];
  authority_impact: readonly string[];
  confidence_impact: readonly string[];
  state_impact: readonly string[];
  operator_impact: readonly string[];
  replay_impact: readonly string[];
}

export interface TruthDecisionEvolutionContract {
  evolution_id: string;
  decision_id: string;
  tenant_id: string;
  mission_id: string;
  evolution_timestamp: string;
  evolution_type: TruthDecisionEvolutionType;
  previous_version: string;
  current_version: string;
  evolution_reason: string;
  evidence_references: readonly string[];
  replay_references: readonly string[];
}

export interface TruthDecisionEvolutionLedgerEntry {
  evolution_id: string;
  decision_id: string;
  tenant_id: string;
  mission_id: string;
  evolution_type: TruthDecisionEvolutionType;
  revision_type: TruthDecisionRevisionType;
  current_version: string;
  impact_state: TruthDecisionImpactState;
  validation_status: TruthDecisionEvolutionValidationState;
  lineage_status: "VALID" | "INVALID";
  replay_status: TruthReplayResult;
  transaction_status: "COMMITTED" | "ROLLED_BACK" | "NOT_STARTED";
  failure_reason: string | null;
}

export type TruthDecisionEvolutionReasonCode =
  | "EVOLUTION_ID_PRESENT"
  | "EVOLUTION_ID_MISSING"
  | "DECISION_ID_PRESENT"
  | "DECISION_ID_MISSING"
  | "VERSION_REFERENCES_PRESENT"
  | "VERSION_REFERENCES_MISSING"
  | "EVOLUTION_TYPE_VALID"
  | "EVOLUTION_TYPE_INVALID"
  | "REVISION_TYPE_VALID"
  | "REVISION_TYPE_INVALID"
  | "CHANGE_HISTORY_PRESENT"
  | "CHANGE_HISTORY_MISSING"
  | "PREVIOUS_STATE_PRESENT"
  | "PREVIOUS_STATE_MISSING"
  | "REVISION_RATIONALE_PRESENT"
  | "REVISION_RATIONALE_MISSING"
  | "VERSION_VALID"
  | "VERSION_INVALID"
  | "VERSION_ORDERING_VALID"
  | "VERSION_ORDERING_CORRUPTED"
  | "VERSION_UNIQUE"
  | "VERSION_DUPLICATE"
  | "RATIONALE_PRESENT"
  | "RATIONALE_MISSING"
  | "LINEAGE_VALID"
  | "LINEAGE_BROKEN"
  | "LINEAGE_ORPHANED"
  | "IMPACT_VALID"
  | "IMPACT_INVALID"
  | "IMPACT_RATIONALE_PRESENT"
  | "IMPACT_RATIONALE_MISSING"
  | "SUPERSESSION_TARGET_PRESENT"
  | "SUPERSESSION_TARGET_MISSING"
  | "SUPERSESSION_RATIONALE_PRESENT"
  | "SUPERSESSION_RATIONALE_MISSING"
  | "DECISION_VALID"
  | "DECISION_INVALID"
  | "RECORDER_VALID"
  | "RECORDER_INVALID"
  | "EVIDENCE_VALID"
  | "EVIDENCE_INVALID"
  | "GOVERNANCE_VALID"
  | "GOVERNANCE_INVALID"
  | "AUTHORITY_VALID"
  | "AUTHORITY_INVALID"
  | "CONFIDENCE_VALID"
  | "CONFIDENCE_INVALID"
  | "REPLAY_BINDING_VALID"
  | "REPLAY_BINDING_INVALID"
  | "TRANSACTION_PROTECTED"
  | "PARTIAL_EVOLUTION_DETECTED"
  | "ROLLBACK_FAILED"
  | "TENANT_ISOLATION_VALID"
  | "TENANT_ISOLATION_FAILED"
  | "REPLAY_REPRODUCED"
  | "REPLAY_MISMATCH"
  | "REPLAY_INCOMPLETE_EVIDENCE"
  | "REPLAY_UNREPLAYABLE"
  | "VISIBILITY_AVAILABLE"
  | "VISIBILITY_BLOCKED"
  | "OBSERVABILITY_OPERATIONAL"
  | "OBSERVABILITY_GAP_DETECTED"
  | "CERTIFICATION_PASS"
  | "CERTIFICATION_CONDITIONAL_PASS"
  | "CERTIFICATION_FAIL"
  | "FAIL_CLOSED_ENFORCED"
  | "FAIL_OPEN_DETECTED"
  | "LEDGER_APPEND_ONLY"
  | "LEDGER_IMMUTABLE"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "APPROVAL_ABSENT"
  | "APPROVAL_DETECTED"
  | "RANKING_ABSENT"
  | "RANKING_DETECTED"
  | "PRIORITIZATION_ABSENT"
  | "PRIORITIZATION_DETECTED"
  | "SCORING_ABSENT"
  | "SCORING_DETECTED"
  | "RESOURCE_ALLOCATION_ABSENT"
  | "RESOURCE_ALLOCATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "DECISION_EVOLUTION_TRACKER_IS_NOT_CONTROL";

export type TruthDecisionEvolutionValidation = Readonly<{
  valid: boolean;
  validationState: TruthDecisionEvolutionValidationState;
  reasonCodes: readonly TruthDecisionEvolutionReasonCode[];
  revisionValid: boolean;
  versionValid: boolean;
  lineageValid: boolean;
  impactValid: boolean;
  transactionProtected: boolean;
  tenantIsolationValid: boolean;
  replayValid: boolean;
  failClosed: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  approvalAbsent: boolean;
  rankingAbsent: boolean;
  prioritizationAbsent: boolean;
  scoringAbsent: boolean;
  resourceAllocationAbsent: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
}>;

export type TruthDecisionEvolutionReplay = Readonly<{
  replayResult: TruthReplayResult;
  reconstructedEvolution: TruthDecisionEvolutionContract;
  reconstructedVersion: TruthDecisionVersionReference;
  reconstructedLineage: TruthDecisionLineage;
  reconstructedImpact: TruthDecisionImpactAssessment;
}>;

export type TruthDecisionEvolutionVisibility = Readonly<{
  decision_id: string;
  decision_version: string;
  evolution_type: TruthDecisionEvolutionType;
  revision_type: TruthDecisionRevisionType;
  impact_state: TruthDecisionImpactState;
  authority_state: string;
  lineage_status: "VALID" | "INVALID";
  validation_status: TruthDecisionEvolutionValidationState;
  replay_status: TruthReplayResult;
  timestamp: string;
  readOnly: true;
  tenantScoped: boolean;
  auditable: true;
  replayLinked: true;
}>;

export type TruthDecisionEvolutionObservability = Readonly<{
  decision_changes_total: number;
  decision_revisions_total: number;
  major_revisions_total: number;
  minor_revisions_total: number;
  supersessions_total: number;
  lineage_failures: number;
  version_failures: number;
  validation_failures: number;
  replay_failures: number;
  tenant_isolation_failures: number;
}>;

export type TruthDecisionEvolutionInput = Readonly<{
  request: TruthDecisionEvolutionRequest;
  decision: SealedTruthDecisionContract;
  recordedDecision: SealedTruthDecisionRecorder;
  evolutionType: TruthDecisionEvolutionType;
  revisionType: TruthDecisionRevisionType;
  previousVersion: string;
  currentVersion: string;
  versionNumber: number;
  versionState?: TruthDecisionVersionState;
  versionTimestamp?: string;
  evolutionReason: string;
  changeSet: TruthDecisionChangeSet;
  impactAssessment: TruthDecisionImpactAssessment;
  lineage?: Partial<TruthDecisionLineage>;
  evidenceReferences?: readonly string[];
  replayReferences?: readonly string[];
  supersededByDecisionId?: string;
  supersedesDecisionId?: string;
  priorVersionNumbers?: readonly number[];
  knownDecisionIds?: readonly string[];
  knownEvidenceIds?: readonly string[];
  accessTenantId?: string;
  missingChangeHistoryDetected?: boolean;
  missingPreviousStateDetected?: boolean;
  unknownRevisionTypeDetected?: boolean;
  duplicateVersionDetected?: boolean;
  versionOrderingCorruptionDetected?: boolean;
  missingRationaleDetected?: boolean;
  emptyExplanationDetected?: boolean;
  brokenLineageDetected?: boolean;
  orphanedRevisionDetected?: boolean;
  missingImpactRationaleDetected?: boolean;
  unsupportedImpactStateDetected?: boolean;
  missingReplacementDecisionDetected?: boolean;
  missingSupersessionRationaleDetected?: boolean;
  invalidDecisionDetected?: boolean;
  invalidRecorderDetected?: boolean;
  invalidEvidenceDetected?: boolean;
  invalidGovernanceDetected?: boolean;
  invalidAuthorityDetected?: boolean;
  invalidConfidenceDetected?: boolean;
  partialEvolutionDetected?: boolean;
  rollbackFailed?: boolean;
  replayMismatchDetected?: boolean;
  crossTenantVersionAccessDetected?: boolean;
  crossTenantLineageTraversalDetected?: boolean;
  replayReferencesResolvable?: boolean;
  observabilityGapDetected?: boolean;
  remediationDocumented?: boolean;
  executionRequested?: boolean;
  approvalRequested?: boolean;
  rankingRequested?: boolean;
  prioritizationRequested?: boolean;
  scoringRequested?: boolean;
  resourceAllocationRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type SealedTruthDecisionEvolutionTracker = Readonly<{
  request: TruthDecisionEvolutionRequest;
  decision: SealedTruthDecisionContract;
  recordedDecision: SealedTruthDecisionRecorder;
  evolution: TruthDecisionEvolutionContract;
  version: TruthDecisionVersionReference;
  lineage: TruthDecisionLineage;
  impactAssessment: TruthDecisionImpactAssessment;
  ledgerEntry: TruthDecisionEvolutionLedgerEntry;
  validation: TruthDecisionEvolutionValidation;
  replay: TruthDecisionEvolutionReplay;
  visibility: TruthDecisionEvolutionVisibility;
  observability: TruthDecisionEvolutionObservability;
  certification: TruthCertificationState;
  sealed: true;
  readOnly: true;
  executionAuthorized: false;
  approvalAllowed: false;
  rankingAllowed: false;
  prioritizationAllowed: false;
  scoringAllowed: false;
  resourceAllocationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export type TruthDecisionReplayScope =
  | "FULL_DECISION"
  | "CONTEXT_ONLY"
  | "EVIDENCE_ONLY"
  | "GOVERNANCE_ONLY"
  | "AUTHORITY_ONLY"
  | "CONFIDENCE_ONLY"
  | "ENVIRONMENT_ONLY"
  | "LINEAGE_ONLY";
export type TruthDecisionReplayState = "REPLAYED" | "REJECTED";
export type TruthDecisionVerificationState = "MATCH" | "MISMATCH" | "PARTIAL_MATCH" | "UNVERIFIABLE";
export type TruthDecisionReplayValidationState = "VALID" | "INVALID";

export interface TruthDecisionReplayRequest {
  tenant_id: string;
  now: string;
}

export interface TruthDecisionReplayEnvironmentContext {
  runtime_conditions: readonly string[];
  mission_state: readonly string[];
  tenant_state: readonly string[];
  risk_state: readonly string[];
  escalation_state: readonly string[];
  certification_state: readonly string[];
}

export interface TruthDecisionReplayBundle {
  decision_rationale: string;
  decision_assumptions: readonly string[];
  decision_constraints: readonly string[];
  decision_objectives: readonly string[];
  decision_state: TruthDecisionState;
  supporting_evidence_ids: readonly string[];
  supporting_event_ids: readonly string[];
  supporting_truth_record_ids: readonly string[];
  supporting_recommendation_ids: readonly string[];
  governance_policy_ids: readonly string[];
  governance_constraints: readonly string[];
  authority_scope: string;
  approval_requirements: readonly string[];
  decision_authority: string;
  authority_type: TruthDecisionAuthorityType;
  authority_evidence: readonly string[];
  confidence_score: number;
  confidence_state: TruthDecisionConfidenceState;
  confidence_rationale: string;
  confidence_evidence: readonly string[];
  decision_version: string;
  version_number: number;
  revision_type: TruthDecisionRevisionType;
  lineage: TruthDecisionLineage;
  environment: TruthDecisionReplayEnvironmentContext;
}

export interface TruthDecisionReplayContract {
  replay_id: string;
  decision_id: string;
  tenant_id: string;
  mission_id: string;
  replay_timestamp: string;
  replay_scope: TruthDecisionReplayScope;
  replay_state: TruthDecisionReplayState;
  replay_hash: string;
  evidence_references: readonly string[];
  reconstruction_bundle_id: string;
}

export interface TruthDecisionReplayLedgerEntry {
  replay_id: string;
  decision_id: string;
  tenant_id: string;
  mission_id: string;
  replay_scope: TruthDecisionReplayScope;
  replay_state: TruthDecisionReplayState;
  verification_status: TruthDecisionVerificationState;
  validation_status: TruthDecisionReplayValidationState;
  replay_status: TruthReplayResult;
  failure_reason: string | null;
}

export type TruthDecisionReplayReasonCode =
  | "REPLAY_ID_PRESENT"
  | "REPLAY_ID_MISSING"
  | "DECISION_ID_PRESENT"
  | "DECISION_ID_MISSING"
  | "REPLAY_SCOPE_PRESENT"
  | "REPLAY_SCOPE_MISSING"
  | "REPLAY_SCOPE_VALID"
  | "REPLAY_SCOPE_INVALID"
  | "DECISION_CONTEXT_PRESENT"
  | "DECISION_CONTEXT_MISSING"
  | "DECISION_CONTEXT_COMPLETE"
  | "DECISION_CONTEXT_INCOMPLETE"
  | "EVIDENCE_RECONSTRUCTED"
  | "EVIDENCE_MISSING"
  | "EVIDENCE_MISMATCH"
  | "GOVERNANCE_RECONSTRUCTED"
  | "GOVERNANCE_MISSING"
  | "GOVERNANCE_MISMATCH"
  | "AUTHORITY_RECONSTRUCTED"
  | "AUTHORITY_MISSING"
  | "AUTHORITY_MISMATCH"
  | "CONFIDENCE_RECONSTRUCTED"
  | "CONFIDENCE_RATIONALE_MISSING"
  | "CONFIDENCE_MISMATCH"
  | "ENVIRONMENT_RECONSTRUCTED"
  | "ENVIRONMENT_MISSING"
  | "ENVIRONMENT_MISMATCH"
  | "BUNDLE_ASSEMBLED"
  | "BUNDLE_ASSEMBLY_FAILED"
  | "BUNDLE_COMPLETE"
  | "BUNDLE_INCOMPLETE"
  | "DECISION_VALID"
  | "DECISION_INVALID"
  | "RECORDER_VALID"
  | "RECORDER_INVALID"
  | "EVOLUTION_VALID"
  | "EVOLUTION_INVALID"
  | "EVIDENCE_VALID"
  | "EVIDENCE_INVALID"
  | "GOVERNANCE_VALID"
  | "GOVERNANCE_INVALID"
  | "AUTHORITY_VALID"
  | "AUTHORITY_INVALID"
  | "CONFIDENCE_VALID"
  | "CONFIDENCE_INVALID"
  | "ENVIRONMENT_VALID"
  | "ENVIRONMENT_INVALID"
  | "TENANT_ISOLATION_VALID"
  | "TENANT_ISOLATION_FAILED"
  | "VERIFICATION_MATCH"
  | "VERIFICATION_MISMATCH"
  | "VERIFICATION_PARTIAL_MATCH"
  | "VERIFICATION_UNVERIFIABLE"
  | "REPLAY_REPRODUCED"
  | "REPLAY_MISMATCH"
  | "REPLAY_INCOMPLETE_EVIDENCE"
  | "REPLAY_UNREPLAYABLE"
  | "VISIBILITY_AVAILABLE"
  | "VISIBILITY_BLOCKED"
  | "OBSERVABILITY_OPERATIONAL"
  | "OBSERVABILITY_GAP_DETECTED"
  | "CERTIFICATION_PASS"
  | "CERTIFICATION_CONDITIONAL_PASS"
  | "CERTIFICATION_FAIL"
  | "FAIL_CLOSED_ENFORCED"
  | "FAIL_OPEN_DETECTED"
  | "LEDGER_APPEND_ONLY"
  | "LEDGER_IMMUTABLE"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "APPROVAL_ABSENT"
  | "APPROVAL_DETECTED"
  | "RANKING_ABSENT"
  | "RANKING_DETECTED"
  | "PRIORITIZATION_ABSENT"
  | "PRIORITIZATION_DETECTED"
  | "SCORING_ABSENT"
  | "SCORING_DETECTED"
  | "RESOURCE_ALLOCATION_ABSENT"
  | "RESOURCE_ALLOCATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "DECISION_REPLAY_BINDER_IS_NOT_CONTROL";

export type TruthDecisionReplayValidation = Readonly<{
  valid: boolean;
  validationState: TruthDecisionReplayValidationState;
  reasonCodes: readonly TruthDecisionReplayReasonCode[];
  contextValid: boolean;
  evidenceValid: boolean;
  governanceValid: boolean;
  authorityValid: boolean;
  confidenceValid: boolean;
  environmentValid: boolean;
  bundleValid: boolean;
  tenantIsolationValid: boolean;
  verificationValid: boolean;
  replayValid: boolean;
  failClosed: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  approvalAbsent: boolean;
  rankingAbsent: boolean;
  prioritizationAbsent: boolean;
  scoringAbsent: boolean;
  resourceAllocationAbsent: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
}>;

export type TruthDecisionReplayReplay = Readonly<{
  replayResult: TruthReplayResult;
  verificationState: TruthDecisionVerificationState;
  reconstructedBundle: TruthDecisionReplayBundle;
  reconstructedContract: TruthDecisionReplayContract;
}>;

export type TruthDecisionReplayVisibility = Readonly<{
  decision_id: string;
  replay_state: TruthDecisionReplayState;
  bundle_status: "VALID" | "INVALID";
  verification_status: TruthDecisionVerificationState;
  authority_status: "VALID" | "INVALID";
  confidence_status: "VALID" | "INVALID";
  environment_status: "VALID" | "INVALID";
  validation_status: TruthDecisionReplayValidationState;
  timestamp: string;
  readOnly: true;
  tenantScoped: boolean;
  auditable: true;
  replayLinked: true;
}>;

export type TruthDecisionReplayObservability = Readonly<{
  replays_total: number;
  successful_replays: number;
  failed_replays: number;
  bundle_assembly_failures: number;
  verification_failures: number;
  validation_failures: number;
  authority_mismatches: number;
  confidence_mismatches: number;
  tenant_isolation_failures: number;
}>;

export type TruthDecisionReplayInput = Readonly<{
  request: TruthDecisionReplayRequest;
  decision: SealedTruthDecisionContract;
  recordedDecision: SealedTruthDecisionRecorder;
  evolution: SealedTruthDecisionEvolutionTracker;
  replayScope?: TruthDecisionReplayScope;
  decisionObjectives?: readonly string[];
  environment?: Partial<TruthDecisionReplayEnvironmentContext>;
  knownEvidenceIds?: readonly string[];
  accessTenantId?: string;
  missingContextComponentDetected?: boolean;
  contextMismatchDetected?: boolean;
  evidenceMismatchDetected?: boolean;
  policyMismatchDetected?: boolean;
  authorityMismatchDetected?: boolean;
  missingAuthorityEvidenceDetected?: boolean;
  confidenceMismatchDetected?: boolean;
  environmentMismatchDetected?: boolean;
  missingEnvironmentStateDetected?: boolean;
  bundleAssemblyFailureDetected?: boolean;
  incompleteBundleDetected?: boolean;
  decisionMismatchDetected?: boolean;
  verificationMismatchDetected?: boolean;
  unverifiableReplayDetected?: boolean;
  crossTenantReplayDetected?: boolean;
  crossTenantContextAccessDetected?: boolean;
  observabilityGapDetected?: boolean;
  remediationDocumented?: boolean;
  executionRequested?: boolean;
  approvalRequested?: boolean;
  rankingRequested?: boolean;
  prioritizationRequested?: boolean;
  scoringRequested?: boolean;
  resourceAllocationRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type SealedTruthDecisionReplayBinder = Readonly<{
  request: TruthDecisionReplayRequest;
  decision: SealedTruthDecisionContract;
  recordedDecision: SealedTruthDecisionRecorder;
  evolution: SealedTruthDecisionEvolutionTracker;
  replay: TruthDecisionReplayContract;
  reconstructionBundle: TruthDecisionReplayBundle;
  ledgerEntry: TruthDecisionReplayLedgerEntry;
  validation: TruthDecisionReplayValidation;
  replayResult: TruthDecisionReplayReplay;
  visibility: TruthDecisionReplayVisibility;
  observability: TruthDecisionReplayObservability;
  certification: TruthCertificationState;
  sealed: true;
  readOnly: true;
  executionAuthorized: false;
  approvalAllowed: false;
  rankingAllowed: false;
  prioritizationAllowed: false;
  scoringAllowed: false;
  resourceAllocationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export type TruthDecisionReplayBinderCertificationComponent =
  | "Decision Replay Contract"
  | "Decision Context Reconstruction Engine"
  | "Evidence Replay Binder"
  | "Governance Replay Binder"
  | "Authority Replay Binder"
  | "Confidence Replay Binder"
  | "Environmental Replay Binder"
  | "Decision Bundle Assembly Engine"
  | "Replay Integrity Validation"
  | "Replay Verification Engine"
  | "Replay Ledger"
  | "Tenant Replay Isolation"
  | "Operator Visibility Surface"
  | "Replay Observability"
  | "Exact Decision Reconstruction"
  | "Fail-Closed Replay Behavior";

export type TruthDecisionReplayBinderCompletionGate =
  | "DECISION_REPLAY_BINDER_CERTIFIED"
  | "DECISION_REPLAY_BINDER_CONDITIONAL"
  | "DECISION_REPLAY_BINDER_FAILED";

export interface TruthDecisionReplayBinderCertificationRequest {
  tenant_id: string;
  now: string;
}

export interface TruthDecisionReplayBinderCertificationContract {
  certification_id: string;
  certification_timestamp: string;
  decision_replay_binder_version: string;
  certification_scope: readonly TruthDecisionReplayBinderCertificationComponent[];
  certification_state: TruthCertificationState;
  certification_reason: string;
  certification_authority: string;
  replay_id: string;
  decision_id: string;
  evidence_references: readonly string[];
}

export interface TruthDecisionReplayBinderCertificationLedgerEntry {
  certification_id: string;
  tenant_id: string;
  decision_id: string;
  replay_id: string;
  certification_state: TruthCertificationState;
  completion_gate: TruthDecisionReplayBinderCompletionGate;
  replay_status: TruthReplayResult;
  failed_components: readonly string[];
  required_actions: readonly string[];
}

export type TruthDecisionReplayBinderCertificationReasonCode =
  | "CERTIFICATION_SCOPE_PRESENT"
  | "CERTIFICATION_SCOPE_MISSING"
  | "CERTIFICATION_AUTHORITY_PRESENT"
  | "CERTIFICATION_AUTHORITY_MISSING"
  | "DECISION_REPLAY_CONTRACT_CERTIFIED"
  | "DECISION_REPLAY_CONTRACT_FAILED"
  | "CONTEXT_RECONSTRUCTION_CERTIFIED"
  | "CONTEXT_RECONSTRUCTION_FAILED"
  | "EVIDENCE_REPLAY_CERTIFIED"
  | "EVIDENCE_REPLAY_FAILED"
  | "GOVERNANCE_REPLAY_CERTIFIED"
  | "GOVERNANCE_REPLAY_FAILED"
  | "AUTHORITY_REPLAY_CERTIFIED"
  | "AUTHORITY_REPLAY_FAILED"
  | "CONFIDENCE_REPLAY_CERTIFIED"
  | "CONFIDENCE_REPLAY_FAILED"
  | "ENVIRONMENT_REPLAY_CERTIFIED"
  | "ENVIRONMENT_REPLAY_FAILED"
  | "BUNDLE_ASSEMBLY_CERTIFIED"
  | "BUNDLE_ASSEMBLY_FAILED"
  | "REPLAY_INTEGRITY_CERTIFIED"
  | "REPLAY_INTEGRITY_FAILED"
  | "REPLAY_VERIFICATION_CERTIFIED"
  | "REPLAY_VERIFICATION_FAILED"
  | "REPLAY_LEDGER_CERTIFIED"
  | "REPLAY_LEDGER_FAILED"
  | "TENANT_REPLAY_ISOLATION_CERTIFIED"
  | "TENANT_REPLAY_ISOLATION_FAILED"
  | "OPERATOR_VISIBILITY_CERTIFIED"
  | "OPERATOR_VISIBILITY_FAILED"
  | "REPLAY_OBSERVABILITY_OPERATIONAL"
  | "REPLAY_OBSERVABILITY_GAP_DETECTED"
  | "EXACT_RECONSTRUCTION_CERTIFIED"
  | "EXACT_RECONSTRUCTION_FAILED"
  | "FAIL_CLOSED_CERTIFIED"
  | "FAIL_OPEN_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "APPROVAL_ABSENT"
  | "APPROVAL_DETECTED"
  | "RANKING_ABSENT"
  | "RANKING_DETECTED"
  | "PRIORITIZATION_ABSENT"
  | "PRIORITIZATION_DETECTED"
  | "SCORING_ABSENT"
  | "SCORING_DETECTED"
  | "RESOURCE_ALLOCATION_ABSENT"
  | "RESOURCE_ALLOCATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "DECISION_REPLAY_BINDER_CERTIFICATION_IS_NOT_CONTROL"
  | "CERTIFICATION_PASS"
  | "CERTIFICATION_CONDITIONAL_PASS"
  | "CERTIFICATION_FAIL"
  | "LEDGER_APPEND_ONLY"
  | "LEDGER_IMMUTABLE"
  | "VISIBILITY_AVAILABLE"
  | "VISIBILITY_BLOCKED";

export type TruthDecisionReplayBinderCertificationValidation = Readonly<{
  valid: boolean;
  validationState: TruthDecisionReplayValidationState;
  reasonCodes: readonly TruthDecisionReplayBinderCertificationReasonCode[];
  contractCertified: boolean;
  contextCertified: boolean;
  evidenceCertified: boolean;
  governanceCertified: boolean;
  authorityCertified: boolean;
  confidenceCertified: boolean;
  environmentCertified: boolean;
  bundleCertified: boolean;
  integrityCertified: boolean;
  verificationCertified: boolean;
  ledgerCertified: boolean;
  tenantIsolationCertified: boolean;
  visibilityCertified: boolean;
  observabilityCertified: boolean;
  exactReconstructionCertified: boolean;
  failClosedCertified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  approvalAbsent: boolean;
  rankingAbsent: boolean;
  prioritizationAbsent: boolean;
  scoringAbsent: boolean;
  resourceAllocationAbsent: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
}>;

export type TruthDecisionReplayBinderCertificationVisibility = Readonly<{
  certification_state: TruthCertificationState;
  decision_replay_binder_version: string;
  certified_components: readonly TruthDecisionReplayBinderCertificationComponent[];
  failed_components: readonly string[];
  replay_status: TruthReplayResult;
  verification_status: TruthDecisionVerificationState;
  authority_status: "PASS" | "FAIL";
  confidence_status: "PASS" | "FAIL";
  environment_status: "PASS" | "FAIL";
  tenant_status: "PASS" | "FAIL";
  visibility_status: "PASS" | "FAIL";
  required_actions: readonly string[];
  certification_timestamp: string;
  certification_authority: string;
  readOnly: true;
  tenantScoped: boolean;
  auditable: true;
  replayLinked: true;
}>;

export type TruthDecisionReplayBinderCertificationObservability = Readonly<{
  decision_replay_certifications_total: number;
  decision_replay_pass_total: number;
  decision_replay_conditional_total: number;
  decision_replay_fail_total: number;
  contract_failures: number;
  context_failures: number;
  evidence_failures: number;
  governance_failures: number;
  authority_failures: number;
  confidence_failures: number;
  environment_failures: number;
  bundle_failures: number;
  verification_failures: number;
  tenant_isolation_failures: number;
  fail_closed_failures: number;
}>;

export type TruthDecisionReplayBinderCertificationReplay = Readonly<{
  replayResult: TruthReplayResult;
  executedTests: readonly string[];
  decisionState: TruthCertificationState;
}>;

export type TruthDecisionReplayBinderCertificationInput = Readonly<{
  request: TruthDecisionReplayBinderCertificationRequest;
  replayBinder: SealedTruthDecisionReplayBinder;
  certificationAuthority: string;
  certificationReason: string;
  certificationScope?: readonly TruthDecisionReplayBinderCertificationComponent[];
  decisionReplayBinderVersion?: string;
  accessTenantId?: string;
  observabilityGapDetected?: boolean;
  reportingLimitationDetected?: boolean;
  remediationPlanExists?: boolean;
  governanceApproved?: boolean;
  replayLedgerMutationDetected?: boolean;
  hiddenReplayFailureDetected?: boolean;
  executionRequested?: boolean;
  approvalRequested?: boolean;
  rankingRequested?: boolean;
  prioritizationRequested?: boolean;
  scoringRequested?: boolean;
  resourceAllocationRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type SealedTruthDecisionReplayBinderCertificationGate = Readonly<{
  request: TruthDecisionReplayBinderCertificationRequest;
  certification: TruthDecisionReplayBinderCertificationContract;
  validation: TruthDecisionReplayBinderCertificationValidation;
  replay: TruthDecisionReplayBinderCertificationReplay;
  visibility: TruthDecisionReplayBinderCertificationVisibility;
  observability: TruthDecisionReplayBinderCertificationObservability;
  ledgerEntry: TruthDecisionReplayBinderCertificationLedgerEntry;
  completionGate: TruthDecisionReplayBinderCompletionGate;
  sealed: true;
  readOnly: true;
  executionAuthorized: false;
  approvalAllowed: false;
  rankingAllowed: false;
  prioritizationAllowed: false;
  scoringAllowed: false;
  resourceAllocationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export type TruthDecisionCertificationDomain =
  | "6F.1 Decision Contract"
  | "6F.2 Decision Recorder"
  | "6F.3 Decision Evolution Tracker"
  | "6F.4 Decision Replay Binder"
  | "Replay Preservation"
  | "Authority Integrity"
  | "Governance Compliance"
  | "Confidence Integrity"
  | "Tenant Isolation"
  | "Operator Visibility";

export type TruthDecisionLayerCompletionGate =
  | "DECISION_LAYER_CERTIFIED"
  | "DECISION_LAYER_CONDITIONAL"
  | "DECISION_LAYER_FAILED";

export interface TruthDecisionCertificationRequest {
  tenant_id: string;
  now: string;
}

export interface TruthDecisionCertificationContract {
  certification_id: string;
  certification_timestamp: string;
  decision_layer_version: string;
  certification_scope: readonly TruthDecisionCertificationDomain[];
  certification_state: TruthCertificationState;
  certification_reason: string;
  certification_authority: string;
  evidence_references: readonly string[];
  replay_references: readonly string[];
}

export interface TruthDecisionCertificationLedgerEntry {
  certification_id: string;
  tenant_id: string;
  decision_id: string;
  certification_state: TruthCertificationState;
  completion_gate: TruthDecisionLayerCompletionGate;
  replay_status: TruthReplayResult;
  failed_components: readonly string[];
  required_actions: readonly string[];
}

export type TruthDecisionCertificationReasonCode =
  | "CERTIFICATION_SCOPE_PRESENT"
  | "CERTIFICATION_SCOPE_MISSING"
  | "CERTIFICATION_AUTHORITY_PRESENT"
  | "CERTIFICATION_AUTHORITY_MISSING"
  | "EVIDENCE_REFERENCES_PRESENT"
  | "EVIDENCE_REFERENCES_MISSING"
  | "REPLAY_REFERENCES_PRESENT"
  | "REPLAY_REFERENCES_MISSING"
  | "DECISION_CONTRACT_CERTIFIED"
  | "DECISION_CONTRACT_FAILED"
  | "DECISION_RECORDER_CERTIFIED"
  | "DECISION_RECORDER_FAILED"
  | "DECISION_EVOLUTION_CERTIFIED"
  | "DECISION_EVOLUTION_FAILED"
  | "DECISION_REPLAY_CERTIFIED"
  | "DECISION_REPLAY_FAILED"
  | "REPLAY_PRESERVATION_CERTIFIED"
  | "REPLAY_PRESERVATION_FAILED"
  | "AUTHORITY_INTEGRITY_CERTIFIED"
  | "AUTHORITY_INTEGRITY_FAILED"
  | "GOVERNANCE_COMPLIANCE_CERTIFIED"
  | "GOVERNANCE_COMPLIANCE_FAILED"
  | "CONFIDENCE_INTEGRITY_CERTIFIED"
  | "CONFIDENCE_INTEGRITY_FAILED"
  | "TENANT_ISOLATION_CERTIFIED"
  | "TENANT_ISOLATION_FAILED"
  | "OPERATOR_VISIBILITY_CERTIFIED"
  | "OPERATOR_VISIBILITY_FAILED"
  | "OBSERVABILITY_OPERATIONAL"
  | "OBSERVABILITY_GAP_DETECTED"
  | "REPORTING_LIMITATIONS_ABSENT"
  | "REPORTING_LIMITATIONS_PRESENT"
  | "FAIL_CLOSED_ENFORCED"
  | "FAIL_OPEN_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "APPROVAL_ABSENT"
  | "APPROVAL_DETECTED"
  | "RANKING_ABSENT"
  | "RANKING_DETECTED"
  | "PRIORITIZATION_ABSENT"
  | "PRIORITIZATION_DETECTED"
  | "SCORING_ABSENT"
  | "SCORING_DETECTED"
  | "RESOURCE_ALLOCATION_ABSENT"
  | "RESOURCE_ALLOCATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "DECISION_CERTIFICATION_GATE_IS_NOT_CONTROL"
  | "REPLAY_REPRODUCED"
  | "REPLAY_MISMATCH"
  | "REPLAY_INCOMPLETE_EVIDENCE"
  | "REPLAY_UNREPLAYABLE"
  | "CERTIFICATION_PASS"
  | "CERTIFICATION_CONDITIONAL_PASS"
  | "CERTIFICATION_FAIL"
  | "LEDGER_APPEND_ONLY"
  | "LEDGER_IMMUTABLE"
  | "VISIBILITY_AVAILABLE"
  | "VISIBILITY_BLOCKED";

export type TruthDecisionCertificationValidation = Readonly<{
  valid: boolean;
  validationState: TruthDecisionReplayValidationState;
  reasonCodes: readonly TruthDecisionCertificationReasonCode[];
  scopeValid: boolean;
  authorityValid: boolean;
  evidenceValid: boolean;
  replayReferencesValid: boolean;
  decisionContractCertified: boolean;
  decisionRecorderCertified: boolean;
  decisionEvolutionCertified: boolean;
  decisionReplayCertified: boolean;
  replayPreservationCertified: boolean;
  authorityIntegrityCertified: boolean;
  governanceComplianceCertified: boolean;
  confidenceIntegrityCertified: boolean;
  tenantIsolationCertified: boolean;
  operatorVisibilityCertified: boolean;
  failClosed: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  approvalAbsent: boolean;
  rankingAbsent: boolean;
  prioritizationAbsent: boolean;
  scoringAbsent: boolean;
  resourceAllocationAbsent: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
}>;

export type TruthDecisionCertificationVisibility = Readonly<{
  certification_state: TruthCertificationState;
  decision_layer_version: string;
  certified_components: readonly TruthDecisionCertificationDomain[];
  failed_components: readonly string[];
  authority_status: "PASS" | "FAIL";
  confidence_status: "PASS" | "FAIL";
  governance_status: "PASS" | "FAIL";
  tenant_status: "PASS" | "FAIL";
  replay_status: TruthReplayResult;
  visibility_status: "PASS" | "FAIL";
  required_actions: readonly string[];
  certification_timestamp: string;
  certification_authority: string;
  readOnly: true;
  tenantScoped: boolean;
  auditable: true;
  replayLinked: true;
}>;

export type TruthDecisionCertificationObservability = Readonly<{
  decision_certifications_total: number;
  decision_pass_total: number;
  decision_conditional_total: number;
  decision_fail_total: number;
  contract_failures: number;
  recorder_failures: number;
  evolution_failures: number;
  replay_failures: number;
  authority_failures: number;
  confidence_failures: number;
  governance_failures: number;
  tenant_isolation_failures: number;
  visibility_failures: number;
  certification_replay_failures: number;
}>;

export type TruthDecisionCertificationReplay = Readonly<{
  replayResult: TruthReplayResult;
  executedTests: readonly TruthDecisionCertificationDomain[];
  decisionState: TruthCertificationState;
}>;

export type TruthDecisionCertificationInput = Readonly<{
  request: TruthDecisionCertificationRequest;
  decisionContract: SealedTruthDecisionContract;
  decisionRecorder: SealedTruthDecisionRecorder;
  decisionEvolution: SealedTruthDecisionEvolutionTracker;
  decisionReplayBinder: SealedTruthDecisionReplayBinder;
  decisionReplayCertification: SealedTruthDecisionReplayBinderCertificationGate;
  certificationAuthority: string;
  certificationReason: string;
  certificationScope?: readonly TruthDecisionCertificationDomain[];
  decisionLayerVersion?: string;
  evidenceReferences?: readonly string[];
  replayReferences?: readonly string[];
  accessTenantId?: string;
  duplicateDecisionIdentityDetected?: boolean;
  acceptedRecommendationLostDetected?: boolean;
  rejectedRecommendationLostDetected?: boolean;
  operatorActionLostDetected?: boolean;
  brokenDecisionLineageDetected?: boolean;
  partialCommitDetected?: boolean;
  duplicateVersionDetected?: boolean;
  missingSupersessionTargetDetected?: boolean;
  replayMismatchDetected?: boolean;
  authorityMismatchDetected?: boolean;
  authorityExpansionDetected?: boolean;
  authorityCorruptionDetected?: boolean;
  governanceBypassDetected?: boolean;
  policyViolationDetected?: boolean;
  confidenceCorruptionDetected?: boolean;
  unsupportedConfidenceStateDetected?: boolean;
  crossTenantAccessDetected?: boolean;
  crossTenantReplayAccessDetected?: boolean;
  crossTenantLineageAccessDetected?: boolean;
  crossTenantVisibilityDetected?: boolean;
  hiddenDecisionDetected?: boolean;
  hiddenAuthorityIssueDetected?: boolean;
  hiddenGovernanceIssueDetected?: boolean;
  hiddenCertificationFailureDetected?: boolean;
  observabilityGapDetected?: boolean;
  reportingLimitationDetected?: boolean;
  remediationPlanExists?: boolean;
  governanceApproved?: boolean;
  executionRequested?: boolean;
  approvalRequested?: boolean;
  rankingRequested?: boolean;
  prioritizationRequested?: boolean;
  scoringRequested?: boolean;
  resourceAllocationRequested?: boolean;
}>;

export type SealedTruthDecisionCertificationGate = Readonly<{
  request: TruthDecisionCertificationRequest;
  certification: TruthDecisionCertificationContract;
  validation: TruthDecisionCertificationValidation;
  replay: TruthDecisionCertificationReplay;
  visibility: TruthDecisionCertificationVisibility;
  observability: TruthDecisionCertificationObservability;
  ledgerEntry: TruthDecisionCertificationLedgerEntry;
  completionGate: TruthDecisionLayerCompletionGate;
  sealed: true;
  readOnly: true;
  executionAuthorized: false;
  approvalAllowed: false;
  rankingAllowed: false;
  prioritizationAllowed: false;
  scoringAllowed: false;
  resourceAllocationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export type TruthPolicyType =
  | "FILESYSTEM_POLICY"
  | "NETWORK_POLICY"
  | "TOOL_POLICY"
  | "CAPABILITY_POLICY"
  | "AUTHORITY_POLICY"
  | "GOVERNANCE_POLICY"
  | "TENANT_POLICY"
  | "FEDERATION_POLICY";
export type TruthPolicyState = "DRAFT" | "ACTIVE" | "SUSPENDED" | "RETIRED";
export type TruthPolicyAction = "ALLOW" | "DENY" | "ESCALATE" | "CONTAIN";
export type TruthPolicyScopeType = "GLOBAL" | "TENANT" | "MISSION" | "SYSTEM" | "AGENT" | "RESOURCE" | "FEDERATION";
export type TruthPolicyAuthorityType = "OPERATOR" | "GOVERNANCE_ENGINE" | "CERTIFICATION_ENGINE" | "SUPERVISION_ENGINE";
export type TruthPolicyValidationState = "VALID" | "INVALID";

export interface TruthPolicyContractRequest {
  tenant_id: string;
  now: string;
}

export interface TruthPolicyScope {
  scope_type: TruthPolicyScopeType;
  scope_id: string;
  scope_description: string;
}

export interface TruthPolicyAuthority {
  authority_id: string;
  authority_type: TruthPolicyAuthorityType;
  authority_scope: string;
  authority_timestamp: string;
  authority_evidence: readonly string[];
}

export interface TruthPolicyRule {
  rule_id: string;
  rule_condition: string;
  rule_action: TruthPolicyAction;
  rule_priority: number;
  rule_scope: TruthPolicyScopeType;
}

export interface TruthPolicyContract {
  policy_id: string;
  tenant_id: string;
  policy_type: TruthPolicyType;
  policy_name: string;
  policy_description: string;
  policy_scope: TruthPolicyScope;
  policy_version: string;
  policy_state: TruthPolicyState;
  policy_action: TruthPolicyAction;
  policy_priority: number;
  policy_authority: TruthPolicyAuthority;
  policy_timestamp: string;
  policy_hash: string;
  created_timestamp: string;
  policy_rules: readonly TruthPolicyRule[];
  replay_reference_ids: readonly string[];
}

export interface TruthPolicyLedgerEntry {
  policy_id: string;
  tenant_id: string;
  policy_type: TruthPolicyType;
  policy_state: TruthPolicyState;
  policy_action: TruthPolicyAction;
  policy_version: string;
  validation_status: TruthPolicyValidationState;
  replay_status: TruthReplayResult;
  certification_state: TruthCertificationState;
  failure_reason: string | null;
}

export type TruthPolicyContractReasonCode =
  | "POLICY_ID_PRESENT"
  | "POLICY_ID_MISSING"
  | "POLICY_ID_UNIQUE"
  | "POLICY_ID_DUPLICATE"
  | "POLICY_ID_IMMUTABLE"
  | "POLICY_ID_MUTATED"
  | "POLICY_HASH_VALID"
  | "POLICY_HASH_MISMATCH"
  | "TENANT_ID_PRESENT"
  | "TENANT_ID_MISSING"
  | "POLICY_TYPE_PRESENT"
  | "POLICY_TYPE_MISSING"
  | "POLICY_TYPE_VALID"
  | "POLICY_TYPE_INVALID"
  | "POLICY_TYPE_NOT_DEPRECATED"
  | "POLICY_TYPE_DEPRECATED"
  | "POLICY_STATE_PRESENT"
  | "POLICY_STATE_MISSING"
  | "POLICY_STATE_VALID"
  | "POLICY_STATE_INVALID"
  | "POLICY_STATE_TRANSITION_VALID"
  | "POLICY_STATE_TRANSITION_INVALID"
  | "POLICY_ACTION_PRESENT"
  | "POLICY_ACTION_MISSING"
  | "POLICY_ACTION_VALID"
  | "POLICY_ACTION_INVALID"
  | "POLICY_ACTION_SINGLE"
  | "POLICY_ACTION_MULTIPLE"
  | "POLICY_SCOPE_PRESENT"
  | "POLICY_SCOPE_MISSING"
  | "POLICY_SCOPE_VALID"
  | "POLICY_SCOPE_INVALID"
  | "POLICY_AUTHORITY_PRESENT"
  | "POLICY_AUTHORITY_MISSING"
  | "POLICY_AUTHORITY_VALID"
  | "POLICY_AUTHORITY_INVALID"
  | "POLICY_RULES_PRESENT"
  | "POLICY_RULES_MISSING"
  | "POLICY_RULES_VALID"
  | "POLICY_RULES_INVALID"
  | "RULE_CONDITION_PRESENT"
  | "RULE_CONDITION_MISSING"
  | "RULE_ACTION_PRESENT"
  | "RULE_ACTION_MISSING"
  | "REPLAY_BINDING_VALID"
  | "REPLAY_BINDING_INVALID"
  | "TENANT_ISOLATION_VALID"
  | "TENANT_ISOLATION_FAILED"
  | "REPLAY_REPRODUCED"
  | "REPLAY_MISMATCH"
  | "REPLAY_INCOMPLETE_EVIDENCE"
  | "REPLAY_UNREPLAYABLE"
  | "LEDGER_APPEND_ONLY"
  | "LEDGER_IMMUTABLE"
  | "VISIBILITY_AVAILABLE"
  | "VISIBILITY_BLOCKED"
  | "OBSERVABILITY_OPERATIONAL"
  | "OBSERVABILITY_GAP_DETECTED"
  | "FAIL_CLOSED_ENFORCED"
  | "FAIL_OPEN_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "APPROVAL_ABSENT"
  | "APPROVAL_DETECTED"
  | "RANKING_ABSENT"
  | "RANKING_DETECTED"
  | "PRIORITIZATION_ABSENT"
  | "PRIORITIZATION_DETECTED"
  | "SCORING_ABSENT"
  | "SCORING_DETECTED"
  | "RESOURCE_ALLOCATION_ABSENT"
  | "RESOURCE_ALLOCATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "POLICY_CONTRACT_IS_NOT_CONTROL"
  | "CERTIFICATION_PASS"
  | "CERTIFICATION_CONDITIONAL_PASS"
  | "CERTIFICATION_FAIL";

export type TruthPolicyContractValidation = Readonly<{
  valid: boolean;
  validationState: TruthPolicyValidationState;
  reasonCodes: readonly TruthPolicyContractReasonCode[];
  identityValid: boolean;
  typeValid: boolean;
  stateValid: boolean;
  actionValid: boolean;
  scopeValid: boolean;
  authorityValid: boolean;
  rulesValid: boolean;
  replayValid: boolean;
  tenantIsolationValid: boolean;
  failClosed: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  approvalAbsent: boolean;
  rankingAbsent: boolean;
  prioritizationAbsent: boolean;
  scoringAbsent: boolean;
  resourceAllocationAbsent: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
}>;

export type TruthPolicyContractReplay = Readonly<{
  replayResult: TruthReplayResult;
  reconstructedPolicy: TruthPolicyContract;
  reconstructedRules: readonly TruthPolicyRule[];
  reconstructedAuthority: TruthPolicyAuthority;
}>;

export type TruthPolicyContractVisibility = Readonly<{
  policy_id: string;
  policy_type: TruthPolicyType;
  policy_state: TruthPolicyState;
  policy_action: TruthPolicyAction;
  policy_scope: TruthPolicyScopeType;
  policy_authority: string;
  validation_status: TruthPolicyValidationState;
  replay_status: TruthReplayResult;
  timestamp: string;
  readOnly: true;
  tenantScoped: boolean;
  auditable: true;
  replayLinked: true;
}>;

export type TruthPolicyContractObservability = Readonly<{
  policies_total: number;
  active_policies: number;
  draft_policies: number;
  suspended_policies: number;
  retired_policies: number;
  validation_failures: number;
  authority_failures: number;
  replay_failures: number;
  tenant_isolation_failures: number;
}>;

export type TruthPolicyContractInput = Readonly<{
  request: TruthPolicyContractRequest;
  policyType: TruthPolicyType;
  policyName: string;
  policyDescription: string;
  policyScope: TruthPolicyScope;
  policyVersion: string;
  policyState: TruthPolicyState;
  policyAction: TruthPolicyAction;
  policyPriority: number;
  policyAuthority: TruthPolicyAuthority;
  policyRules: readonly TruthPolicyRule[];
  policyId?: string;
  policyTimestamp?: string;
  priorPolicyIds?: readonly string[];
  priorState?: TruthPolicyState | null;
  replayReferenceIds?: readonly string[];
  accessTenantId?: string;
  identityMutated?: boolean;
  hashMismatchDetected?: boolean;
  deprecatedPolicyTypeDetected?: boolean;
  unknownPolicyTypeDetected?: boolean;
  unknownPolicyStateDetected?: boolean;
  invalidStateTransitionDetected?: boolean;
  unknownPolicyActionDetected?: boolean;
  multipleActionsDetected?: boolean;
  missingScopeDetected?: boolean;
  unknownScopeDetected?: boolean;
  missingAuthorityDetected?: boolean;
  unknownAuthorityDetected?: boolean;
  missingAuthorityEvidenceDetected?: boolean;
  missingRuleConditionDetected?: boolean;
  missingRuleActionDetected?: boolean;
  invalidRuleDetected?: boolean;
  replayReferencesResolvable?: boolean;
  replayMismatchDetected?: boolean;
  ruleMismatchDetected?: boolean;
  authorityMismatchDetected?: boolean;
  crossTenantPolicyAccessDetected?: boolean;
  crossTenantPolicyReplayDetected?: boolean;
  observabilityGapDetected?: boolean;
  remediationDocumented?: boolean;
  executionRequested?: boolean;
  approvalRequested?: boolean;
  rankingRequested?: boolean;
  prioritizationRequested?: boolean;
  scoringRequested?: boolean;
  resourceAllocationRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type SealedTruthPolicyContract = Readonly<{
  request: TruthPolicyContractRequest;
  policy: TruthPolicyContract;
  ledgerEntry: TruthPolicyLedgerEntry;
  validation: TruthPolicyContractValidation;
  replay: TruthPolicyContractReplay;
  visibility: TruthPolicyContractVisibility;
  observability: TruthPolicyContractObservability;
  certification: TruthCertificationState;
  sealed: true;
  readOnly: true;
  executionAuthorized: false;
  approvalAllowed: false;
  rankingAllowed: false;
  prioritizationAllowed: false;
  scoringAllowed: false;
  resourceAllocationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export type TruthFilesystemPermissionType = "READ" | "WRITE" | "EXECUTE" | "MOUNT";
export type TruthFilesystemScope = "FILE" | "DIRECTORY" | "METADATA" | "ENUMERATION" | "MOUNT" | "QUOTA";
export type TruthFilesystemState = "EVALUATED" | "REJECTED";
export type TruthFilesystemQuotaStatus = "WITHIN_LIMIT" | "WARNING" | "EXCEEDED" | "CONTAINED";
export type TruthFilesystemEvaluationStatus = "VALID" | "INVALID";

export interface TruthFilesystemGovernanceRequest {
  tenant_id: string;
  now: string;
}

export interface TruthFilesystemQuotaPolicy {
  quota_status: TruthFilesystemQuotaStatus;
  quota_limit_bytes: number;
  quota_used_bytes: number;
  quota_scope: string;
}

export interface TruthFilesystemGovernanceContract {
  filesystem_policy_id: string;
  tenant_id: string;
  filesystem_scope: TruthFilesystemScope;
  filesystem_action: TruthPolicyAction;
  filesystem_state: TruthFilesystemState;
  path_pattern: string;
  request_path: string;
  permission_type: TruthFilesystemPermissionType;
  quota_policy: TruthFilesystemQuotaPolicy;
  governance_policy_id: string;
  replay_references: readonly string[];
}

export interface TruthFilesystemGovernanceLedgerEntry {
  filesystem_policy_id: string;
  tenant_id: string;
  request_path: string;
  permission_type: TruthFilesystemPermissionType;
  filesystem_action: TruthPolicyAction;
  quota_status: TruthFilesystemQuotaStatus;
  evaluation_status: TruthFilesystemEvaluationStatus;
  replay_status: TruthReplayResult;
  failure_reason: string | null;
}

export type TruthFilesystemGovernanceReasonCode =
  | "FILESYSTEM_POLICY_ID_PRESENT"
  | "FILESYSTEM_POLICY_ID_MISSING"
  | "PATH_PATTERN_PRESENT"
  | "PATH_PATTERN_MISSING"
  | "PERMISSION_TYPE_PRESENT"
  | "PERMISSION_TYPE_MISSING"
  | "PERMISSION_TYPE_VALID"
  | "PERMISSION_TYPE_INVALID"
  | "GOVERNANCE_POLICY_REFERENCE_PRESENT"
  | "GOVERNANCE_POLICY_REFERENCE_MISSING"
  | "READ_GOVERNANCE_OPERATIONAL"
  | "READ_GOVERNANCE_FAILED"
  | "WRITE_GOVERNANCE_OPERATIONAL"
  | "WRITE_GOVERNANCE_FAILED"
  | "EXECUTE_GOVERNANCE_OPERATIONAL"
  | "EXECUTE_GOVERNANCE_FAILED"
  | "MOUNT_GOVERNANCE_OPERATIONAL"
  | "MOUNT_GOVERNANCE_FAILED"
  | "QUOTA_WITHIN_LIMIT"
  | "QUOTA_WARNING"
  | "QUOTA_EXCEEDED_CONTAINED"
  | "QUOTA_ABUSE_ESCALATED"
  | "QUOTA_CONTAINMENT_FAILED"
  | "TENANT_STORAGE_ISOLATION_VALID"
  | "TENANT_STORAGE_ISOLATION_FAILED"
  | "PATH_ALLOWED"
  | "PATH_RESTRICTED_DENIED"
  | "PATH_UNKNOWN_ESCALATED"
  | "PATH_RESTRICTION_BYPASS"
  | "POLICY_EVALUATION_DETERMINISTIC"
  | "POLICY_EVALUATION_NONDETERMINISTIC"
  | "REPLAY_REPRODUCED"
  | "REPLAY_MISMATCH"
  | "REPLAY_INCOMPLETE_EVIDENCE"
  | "REPLAY_UNREPLAYABLE"
  | "LEDGER_APPEND_ONLY"
  | "LEDGER_IMMUTABLE"
  | "VISIBILITY_AVAILABLE"
  | "VISIBILITY_BLOCKED"
  | "OBSERVABILITY_OPERATIONAL"
  | "OBSERVABILITY_GAP_DETECTED"
  | "FAIL_CLOSED_ENFORCED"
  | "FAIL_OPEN_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "APPROVAL_ABSENT"
  | "APPROVAL_DETECTED"
  | "RANKING_ABSENT"
  | "RANKING_DETECTED"
  | "PRIORITIZATION_ABSENT"
  | "PRIORITIZATION_DETECTED"
  | "SCORING_ABSENT"
  | "SCORING_DETECTED"
  | "RESOURCE_ALLOCATION_ABSENT"
  | "RESOURCE_ALLOCATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "FILESYSTEM_GOVERNANCE_IS_NOT_CONTROL"
  | "CERTIFICATION_PASS"
  | "CERTIFICATION_CONDITIONAL_PASS"
  | "CERTIFICATION_FAIL";

export type TruthFilesystemGovernanceValidation = Readonly<{
  valid: boolean;
  validationState: TruthFilesystemEvaluationStatus;
  reasonCodes: readonly TruthFilesystemGovernanceReasonCode[];
  contractValid: boolean;
  readGovernanceValid: boolean;
  writeGovernanceValid: boolean;
  executeGovernanceValid: boolean;
  mountGovernanceValid: boolean;
  quotaGovernanceValid: boolean;
  tenantIsolationValid: boolean;
  pathRestrictionValid: boolean;
  policyEvaluationValid: boolean;
  replayValid: boolean;
  failClosed: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  approvalAbsent: boolean;
  rankingAbsent: boolean;
  prioritizationAbsent: boolean;
  scoringAbsent: boolean;
  resourceAllocationAbsent: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
}>;

export type TruthFilesystemGovernanceReplay = Readonly<{
  replayResult: TruthReplayResult;
  reconstructedContract: TruthFilesystemGovernanceContract;
  reconstructedPolicy: TruthPolicyContract;
  reconstructedDecision: TruthPolicyAction;
}>;

export type TruthFilesystemGovernanceVisibility = Readonly<{
  filesystem_policy_id: string;
  path_pattern: string;
  permission_type: TruthFilesystemPermissionType;
  policy_action: TruthPolicyAction;
  quota_status: TruthFilesystemQuotaStatus;
  tenant_status: "VALID" | "INVALID";
  evaluation_status: TruthFilesystemEvaluationStatus;
  replay_status: TruthReplayResult;
  readOnly: true;
  tenantScoped: boolean;
  auditable: true;
  replayLinked: true;
}>;

export type TruthFilesystemGovernanceObservability = Readonly<{
  filesystem_requests_total: number;
  allowed_requests: number;
  denied_requests: number;
  escalated_requests: number;
  contained_requests: number;
  quota_violations: number;
  path_violations: number;
  tenant_isolation_failures: number;
  replay_failures: number;
}>;

export type TruthFilesystemGovernanceInput = Readonly<{
  request: TruthFilesystemGovernanceRequest;
  policy: SealedTruthPolicyContract;
  filesystemScope: TruthFilesystemScope;
  requestPath: string;
  pathPattern: string;
  permissionType: TruthFilesystemPermissionType;
  quotaPolicy: TruthFilesystemQuotaPolicy;
  replayReferences?: readonly string[];
  accessTenantId?: string;
  authorized?: boolean;
  restrictedPathDetected?: boolean;
  unknownPathDetected?: boolean;
  externalMountViolationDetected?: boolean;
  quotaAbuseDetected?: boolean;
  quotaContainmentFailureDetected?: boolean;
  crossTenantFilesystemAccessDetected?: boolean;
  crossTenantMountAccessDetected?: boolean;
  pathRestrictionBypassDetected?: boolean;
  nondeterministicOutcomeDetected?: boolean;
  replayMismatchDetected?: boolean;
  policyMismatchDetected?: boolean;
  observabilityGapDetected?: boolean;
  reportingLimitationDetected?: boolean;
  remediationDocumented?: boolean;
  executionRequested?: boolean;
  approvalRequested?: boolean;
  rankingRequested?: boolean;
  prioritizationRequested?: boolean;
  scoringRequested?: boolean;
  resourceAllocationRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type SealedTruthFilesystemGovernance = Readonly<{
  request: TruthFilesystemGovernanceRequest;
  governance: TruthFilesystemGovernanceContract;
  ledgerEntry: TruthFilesystemGovernanceLedgerEntry;
  validation: TruthFilesystemGovernanceValidation;
  replay: TruthFilesystemGovernanceReplay;
  visibility: TruthFilesystemGovernanceVisibility;
  observability: TruthFilesystemGovernanceObservability;
  certification: TruthCertificationState;
  sealed: true;
  readOnly: true;
  executionAuthorized: false;
  approvalAllowed: false;
  rankingAllowed: false;
  prioritizationAllowed: false;
  scoringAllowed: false;
  resourceAllocationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export type TruthNetworkScope = "DOMAIN" | "IP" | "CIDR" | "PROTOCOL" | "OUTBOUND" | "INBOUND" | "FEDERATION";
export type TruthNetworkState = "EVALUATED" | "REJECTED";
export type TruthNetworkProtocolType =
  | "HTTPS"
  | "HTTP"
  | "SSH"
  | "SFTP"
  | "FTP"
  | "SMTP"
  | "DNS"
  | "TCP"
  | "UDP"
  | "GRPC"
  | "WEBSOCKET";
export type TruthNetworkRoutingScope = "OUTBOUND" | "INBOUND" | "INTERNAL" | "FEDERATION";

export interface TruthNetworkGovernanceRequest {
  tenant_id: string;
  now: string;
}

export interface TruthNetworkGovernanceContract {
  network_policy_id: string;
  tenant_id: string;
  network_scope: TruthNetworkScope;
  network_action: TruthPolicyAction;
  network_state: TruthNetworkState;
  target_domain?: string;
  target_ip?: string;
  target_cidr?: string;
  protocol_type: TruthNetworkProtocolType;
  routing_scope: TruthNetworkRoutingScope;
  governance_policy_id: string;
  replay_references: readonly string[];
}

export interface TruthNetworkGovernanceLedgerEntry {
  network_policy_id: string;
  tenant_id: string;
  target: string;
  protocol_type: TruthNetworkProtocolType;
  routing_scope: TruthNetworkRoutingScope;
  network_action: TruthPolicyAction;
  evaluation_status: TruthFilesystemEvaluationStatus;
  replay_status: TruthReplayResult;
  failure_reason: string | null;
}

export type TruthNetworkGovernanceReasonCode =
  | "NETWORK_POLICY_ID_PRESENT"
  | "NETWORK_POLICY_ID_MISSING"
  | "NETWORK_TARGET_PRESENT"
  | "NETWORK_TARGET_MISSING"
  | "PROTOCOL_TYPE_PRESENT"
  | "PROTOCOL_TYPE_MISSING"
  | "PROTOCOL_TYPE_VALID"
  | "PROTOCOL_TYPE_INVALID"
  | "GOVERNANCE_POLICY_REFERENCE_PRESENT"
  | "GOVERNANCE_POLICY_REFERENCE_MISSING"
  | "DOMAIN_GOVERNANCE_OPERATIONAL"
  | "DOMAIN_GOVERNANCE_FAILED"
  | "IP_GOVERNANCE_OPERATIONAL"
  | "IP_GOVERNANCE_FAILED"
  | "CIDR_GOVERNANCE_OPERATIONAL"
  | "CIDR_GOVERNANCE_FAILED"
  | "PROTOCOL_GOVERNANCE_OPERATIONAL"
  | "PROTOCOL_GOVERNANCE_FAILED"
  | "OUTBOUND_GOVERNANCE_OPERATIONAL"
  | "OUTBOUND_GOVERNANCE_FAILED"
  | "INBOUND_GOVERNANCE_OPERATIONAL"
  | "INBOUND_GOVERNANCE_FAILED"
  | "FEDERATION_ROUTING_OPERATIONAL"
  | "FEDERATION_ROUTING_FAILED"
  | "TENANT_NETWORK_ISOLATION_VALID"
  | "TENANT_NETWORK_ISOLATION_FAILED"
  | "POLICY_EVALUATION_DETERMINISTIC"
  | "POLICY_EVALUATION_NONDETERMINISTIC"
  | "REPLAY_REPRODUCED"
  | "REPLAY_MISMATCH"
  | "REPLAY_INCOMPLETE_EVIDENCE"
  | "REPLAY_UNREPLAYABLE"
  | "LEDGER_APPEND_ONLY"
  | "LEDGER_IMMUTABLE"
  | "VISIBILITY_AVAILABLE"
  | "VISIBILITY_BLOCKED"
  | "OBSERVABILITY_OPERATIONAL"
  | "OBSERVABILITY_GAP_DETECTED"
  | "FAIL_CLOSED_ENFORCED"
  | "FAIL_OPEN_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "APPROVAL_ABSENT"
  | "APPROVAL_DETECTED"
  | "RANKING_ABSENT"
  | "RANKING_DETECTED"
  | "PRIORITIZATION_ABSENT"
  | "PRIORITIZATION_DETECTED"
  | "SCORING_ABSENT"
  | "SCORING_DETECTED"
  | "RESOURCE_ALLOCATION_ABSENT"
  | "RESOURCE_ALLOCATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "NETWORK_GOVERNANCE_IS_NOT_CONTROL"
  | "CERTIFICATION_PASS"
  | "CERTIFICATION_CONDITIONAL_PASS"
  | "CERTIFICATION_FAIL";

export type TruthNetworkGovernanceValidation = Readonly<{
  valid: boolean;
  validationState: TruthFilesystemEvaluationStatus;
  reasonCodes: readonly TruthNetworkGovernanceReasonCode[];
  contractValid: boolean;
  domainGovernanceValid: boolean;
  ipGovernanceValid: boolean;
  cidrGovernanceValid: boolean;
  protocolGovernanceValid: boolean;
  outboundGovernanceValid: boolean;
  inboundGovernanceValid: boolean;
  federationRoutingValid: boolean;
  tenantIsolationValid: boolean;
  policyEvaluationValid: boolean;
  replayValid: boolean;
  failClosed: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  approvalAbsent: boolean;
  rankingAbsent: boolean;
  prioritizationAbsent: boolean;
  scoringAbsent: boolean;
  resourceAllocationAbsent: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
}>;

export type TruthNetworkGovernanceReplay = Readonly<{
  replayResult: TruthReplayResult;
  reconstructedContract: TruthNetworkGovernanceContract;
  reconstructedPolicy: TruthPolicyContract;
  reconstructedDecision: TruthPolicyAction;
}>;

export type TruthNetworkGovernanceVisibility = Readonly<{
  network_policy_id: string;
  target_domain?: string;
  target_ip?: string;
  protocol_type: TruthNetworkProtocolType;
  policy_action: TruthPolicyAction;
  routing_status: TruthNetworkRoutingScope;
  tenant_status: "VALID" | "INVALID";
  evaluation_status: TruthFilesystemEvaluationStatus;
  replay_status: TruthReplayResult;
  readOnly: true;
  tenantScoped: boolean;
  auditable: true;
  replayLinked: true;
}>;

export type TruthNetworkGovernanceObservability = Readonly<{
  network_requests_total: number;
  allowed_requests: number;
  denied_requests: number;
  escalated_requests: number;
  contained_requests: number;
  domain_violations: number;
  IP_violations: number;
  protocol_violations: number;
  routing_violations: number;
  tenant_isolation_failures: number;
  replay_failures: number;
}>;

export type TruthNetworkGovernanceInput = Readonly<{
  request: TruthNetworkGovernanceRequest;
  policy: SealedTruthPolicyContract;
  networkScope: TruthNetworkScope;
  targetDomain?: string;
  targetIp?: string;
  targetCidr?: string;
  protocolType: TruthNetworkProtocolType;
  routingScope: TruthNetworkRoutingScope;
  replayReferences?: readonly string[];
  accessTenantId?: string;
  authorized?: boolean;
  domainApproved?: boolean;
  domainUnknownDetected?: boolean;
  ipApproved?: boolean;
  restrictedIpDetected?: boolean;
  cidrApproved?: boolean;
  restrictedCidrDetected?: boolean;
  unknownCidrDetected?: boolean;
  protocolAuthorized?: boolean;
  restrictedProtocolDetected?: boolean;
  outboundAuthorized?: boolean;
  inboundAuthorized?: boolean;
  federationAuthorized?: boolean;
  federationTrustViolationDetected?: boolean;
  routingContainmentFailureDetected?: boolean;
  crossTenantTrafficDetected?: boolean;
  crossTenantRoutingDetected?: boolean;
  nondeterministicOutcomeDetected?: boolean;
  replayMismatchDetected?: boolean;
  policyMismatchDetected?: boolean;
  observabilityGapDetected?: boolean;
  reportingLimitationDetected?: boolean;
  remediationDocumented?: boolean;
  executionRequested?: boolean;
  approvalRequested?: boolean;
  rankingRequested?: boolean;
  prioritizationRequested?: boolean;
  scoringRequested?: boolean;
  resourceAllocationRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type SealedTruthNetworkGovernance = Readonly<{
  request: TruthNetworkGovernanceRequest;
  governance: TruthNetworkGovernanceContract;
  ledgerEntry: TruthNetworkGovernanceLedgerEntry;
  validation: TruthNetworkGovernanceValidation;
  replay: TruthNetworkGovernanceReplay;
  visibility: TruthNetworkGovernanceVisibility;
  observability: TruthNetworkGovernanceObservability;
  certification: TruthCertificationState;
  sealed: true;
  readOnly: true;
  executionAuthorized: false;
  approvalAllowed: false;
  rankingAllowed: false;
  prioritizationAllowed: false;
  scoringAllowed: false;
  resourceAllocationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export type TruthCapabilityScope = "TOOL" | "CAPABILITY" | "AGENT" | "MISSION" | "TENANT";
export type TruthCapabilityState = "EVALUATED" | "REJECTED";
export type TruthCapabilityName =
  | "OBSERVE"
  | "COLLECT"
  | "CLASSIFY"
  | "ANALYZE"
  | "CORRELATE"
  | "SIMULATE"
  | "RECOMMEND"
  | "DECIDE"
  | "EXECUTE"
  | "MODIFY"
  | "DELETE"
  | "CONFIGURE";
export type TruthCapabilityTrustState = "TRUSTED" | "CONDITIONALLY_TRUSTED" | "RESTRICTED" | "UNTRUSTED";
export type TruthCapabilityCertificationState = "VALID" | "MISSING" | "EXPIRED";
export type TruthCapabilityAuthorityState = "AUTHORIZED" | "INSUFFICIENT" | "MISMATCH";

export interface TruthCapabilityGovernanceRequest {
  tenant_id: string;
  now: string;
}

export interface TruthAgentCapabilityProfile {
  agent_id: string;
  allowed_capabilities: readonly TruthCapabilityName[];
  denied_capabilities: readonly TruthCapabilityName[];
  required_certifications: readonly string[];
  required_trust_state: TruthCapabilityTrustState;
  required_authority_scope: string;
}

export interface TruthCapabilityGovernanceContract {
  capability_policy_id: string;
  tenant_id: string;
  agent_id: string;
  capability_scope: TruthCapabilityScope;
  capability_action: TruthPolicyAction;
  capability_state: TruthCapabilityState;
  tool_name: string;
  capability_name: TruthCapabilityName;
  trust_requirement: TruthCapabilityTrustState;
  trust_state: TruthCapabilityTrustState;
  certification_requirement: string;
  certification_state: TruthCapabilityCertificationState;
  authority_requirement: TruthPolicyAuthorityType;
  authority_state: TruthCapabilityAuthorityState;
  governance_policy_id: string;
  replay_references: readonly string[];
}

export interface TruthCapabilityGovernanceLedgerEntry {
  capability_policy_id: string;
  tenant_id: string;
  agent_id: string;
  tool_name: string;
  capability_name: TruthCapabilityName;
  capability_action: TruthPolicyAction;
  evaluation_status: TruthFilesystemEvaluationStatus;
  replay_status: TruthReplayResult;
  failure_reason: string | null;
}

export type TruthCapabilityGovernanceReasonCode =
  | "CAPABILITY_POLICY_ID_PRESENT"
  | "CAPABILITY_POLICY_ID_MISSING"
  | "TOOL_NAME_PRESENT"
  | "TOOL_NAME_MISSING"
  | "CAPABILITY_NAME_PRESENT"
  | "CAPABILITY_NAME_MISSING"
  | "GOVERNANCE_POLICY_REFERENCE_PRESENT"
  | "GOVERNANCE_POLICY_REFERENCE_MISSING"
  | "APPROVED_TOOL_GOVERNANCE_OPERATIONAL"
  | "APPROVED_TOOL_GOVERNANCE_FAILED"
  | "PROHIBITED_TOOL_GOVERNANCE_OPERATIONAL"
  | "PROHIBITED_TOOL_GOVERNANCE_FAILED"
  | "CAPABILITY_RESTRICTION_OPERATIONAL"
  | "CAPABILITY_RESTRICTION_FAILED"
  | "CERTIFICATION_REQUIREMENT_OPERATIONAL"
  | "CERTIFICATION_REQUIREMENT_FAILED"
  | "TRUST_REQUIREMENT_OPERATIONAL"
  | "TRUST_REQUIREMENT_FAILED"
  | "AUTHORITY_REQUIREMENT_OPERATIONAL"
  | "AUTHORITY_REQUIREMENT_FAILED"
  | "AGENT_PROFILE_OPERATIONAL"
  | "AGENT_PROFILE_FAILED"
  | "TENANT_CAPABILITY_ISOLATION_VALID"
  | "TENANT_CAPABILITY_ISOLATION_FAILED"
  | "POLICY_EVALUATION_DETERMINISTIC"
  | "POLICY_EVALUATION_NONDETERMINISTIC"
  | "REPLAY_REPRODUCED"
  | "REPLAY_MISMATCH"
  | "REPLAY_INCOMPLETE_EVIDENCE"
  | "REPLAY_UNREPLAYABLE"
  | "LEDGER_APPEND_ONLY"
  | "LEDGER_IMMUTABLE"
  | "VISIBILITY_AVAILABLE"
  | "VISIBILITY_BLOCKED"
  | "OBSERVABILITY_OPERATIONAL"
  | "OBSERVABILITY_GAP_DETECTED"
  | "FAIL_CLOSED_ENFORCED"
  | "FAIL_OPEN_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "APPROVAL_ABSENT"
  | "APPROVAL_DETECTED"
  | "RANKING_ABSENT"
  | "RANKING_DETECTED"
  | "PRIORITIZATION_ABSENT"
  | "PRIORITIZATION_DETECTED"
  | "SCORING_ABSENT"
  | "SCORING_DETECTED"
  | "RESOURCE_ALLOCATION_ABSENT"
  | "RESOURCE_ALLOCATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "CAPABILITY_GOVERNANCE_IS_NOT_CONTROL"
  | "CERTIFICATION_PASS"
  | "CERTIFICATION_CONDITIONAL_PASS"
  | "CERTIFICATION_FAIL";

export type TruthCapabilityGovernanceValidation = Readonly<{
  valid: boolean;
  validationState: TruthFilesystemEvaluationStatus;
  reasonCodes: readonly TruthCapabilityGovernanceReasonCode[];
  contractValid: boolean;
  approvedToolGovernanceValid: boolean;
  prohibitedToolGovernanceValid: boolean;
  capabilityRestrictionValid: boolean;
  certificationRequirementValid: boolean;
  trustRequirementValid: boolean;
  authorityRequirementValid: boolean;
  agentProfileValid: boolean;
  tenantIsolationValid: boolean;
  policyEvaluationValid: boolean;
  replayValid: boolean;
  failClosed: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  approvalAbsent: boolean;
  rankingAbsent: boolean;
  prioritizationAbsent: boolean;
  scoringAbsent: boolean;
  resourceAllocationAbsent: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
}>;

export type TruthCapabilityGovernanceReplay = Readonly<{
  replayResult: TruthReplayResult;
  reconstructedContract: TruthCapabilityGovernanceContract;
  reconstructedPolicy: TruthPolicyContract;
  reconstructedDecision: TruthPolicyAction;
}>;

export type TruthCapabilityGovernanceVisibility = Readonly<{
  agent_id: string;
  tool_name: string;
  capability_name: TruthCapabilityName;
  trust_state: TruthCapabilityTrustState;
  authority_state: TruthCapabilityAuthorityState;
  certification_state: TruthCapabilityCertificationState;
  policy_action: TruthPolicyAction;
  evaluation_status: TruthFilesystemEvaluationStatus;
  replay_status: TruthReplayResult;
  readOnly: true;
  tenantScoped: boolean;
  auditable: true;
  replayLinked: true;
}>;

export type TruthCapabilityGovernanceObservability = Readonly<{
  capability_requests_total: number;
  allowed_capabilities: number;
  denied_capabilities: number;
  escalated_capabilities: number;
  contained_capabilities: number;
  trust_violations: number;
  authority_violations: number;
  certification_violations: number;
  tenant_isolation_failures: number;
  replay_failures: number;
}>;

export type TruthCapabilityGovernanceInput = Readonly<{
  request: TruthCapabilityGovernanceRequest;
  policy: SealedTruthPolicyContract;
  agentProfile: TruthAgentCapabilityProfile;
  capabilityScope: TruthCapabilityScope;
  toolName: string;
  capabilityName: TruthCapabilityName;
  trustRequirement: TruthCapabilityTrustState;
  trustState: TruthCapabilityTrustState;
  certificationRequirement: string;
  certificationState: TruthCapabilityCertificationState;
  authorityRequirement: TruthPolicyAuthorityType;
  authorityState: TruthCapabilityAuthorityState;
  replayReferences?: readonly string[];
  accessTenantId?: string;
  toolApproved?: boolean;
  toolCertified?: boolean;
  toolAuthorized?: boolean;
  prohibitedToolDetected?: boolean;
  capabilityAuthorized?: boolean;
  restrictedCapabilityDetected?: boolean;
  profileMismatchDetected?: boolean;
  trustViolationDetected?: boolean;
  crossTenantCapabilityAccessDetected?: boolean;
  crossTenantTrustAccessDetected?: boolean;
  nondeterministicOutcomeDetected?: boolean;
  replayMismatchDetected?: boolean;
  policyMismatchDetected?: boolean;
  observabilityGapDetected?: boolean;
  reportingLimitationDetected?: boolean;
  remediationDocumented?: boolean;
  executionRequested?: boolean;
  approvalRequested?: boolean;
  rankingRequested?: boolean;
  prioritizationRequested?: boolean;
  scoringRequested?: boolean;
  resourceAllocationRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type SealedTruthCapabilityGovernance = Readonly<{
  request: TruthCapabilityGovernanceRequest;
  governance: TruthCapabilityGovernanceContract;
  ledgerEntry: TruthCapabilityGovernanceLedgerEntry;
  validation: TruthCapabilityGovernanceValidation;
  replay: TruthCapabilityGovernanceReplay;
  visibility: TruthCapabilityGovernanceVisibility;
  observability: TruthCapabilityGovernanceObservability;
  certification: TruthCertificationState;
  sealed: true;
  readOnly: true;
  executionAuthorized: false;
  approvalAllowed: false;
  rankingAllowed: false;
  prioritizationAllowed: false;
  scoringAllowed: false;
  resourceAllocationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export type TruthRuntimeActionType =
  | "FILESYSTEM_ACTION"
  | "NETWORK_ACTION"
  | "TOOL_ACTION"
  | "CAPABILITY_ACTION"
  | "GOVERNANCE_ACTION"
  | "FEDERATION_ACTION"
  | "RUNTIME_ACTION"
  | "OPERATOR_ACTION";
export type TruthRuntimeEvaluationResult = TruthPolicyAction;
export type TruthRuntimeEvaluationState = "EVALUATED" | "REJECTED";
export type TruthRuntimeAuthorityState = "AUTHORIZED" | "UNKNOWN" | "INSUFFICIENT" | "SCOPE_VIOLATION";
export type TruthRuntimeGovernanceState = "COMPLIANT" | "VIOLATION" | "CONSTITUTIONAL_VIOLATION";
export type TruthRuntimePolicyState = "COMPLIANT" | "VIOLATION" | "BYPASSED";
export type TruthRuntimeTrustState = TruthCapabilityTrustState;
export type TruthRuntimeCertificationState = "VALID" | "MISSING" | "EXPIRED";
export type TruthRuntimeContainmentState = "NOT_REQUIRED" | "TRIGGERED" | "FAILED";

export interface TruthRuntimePolicyEngineRequest {
  tenant_id: string;
  now: string;
}

export interface TruthRuntimePolicyEngineContract {
  evaluation_id: string;
  action_id: string;
  tenant_id: string;
  mission_id: string;
  agent_id: string;
  requested_action: TruthRuntimeActionType;
  authority_state: TruthRuntimeAuthorityState;
  governance_state: TruthRuntimeGovernanceState;
  policy_state: TruthRuntimePolicyState;
  trust_state: TruthRuntimeTrustState;
  certification_state: TruthRuntimeCertificationState;
  containment_state: TruthRuntimeContainmentState;
  evaluation_timestamp: string;
  evaluation_result: TruthRuntimeEvaluationResult;
  replay_references: readonly string[];
}

export interface TruthRuntimeGovernanceLedgerEntry {
  evaluation_id: string;
  action_id: string;
  tenant_id: string;
  mission_id: string;
  agent_id: string;
  requested_action: TruthRuntimeActionType;
  evaluation_result: TruthRuntimeEvaluationResult;
  validation_status: TruthFilesystemEvaluationStatus;
  replay_status: TruthReplayResult;
  failure_reason: string | null;
}

export type TruthRuntimePolicyEngineReasonCode =
  | "EVALUATION_ID_PRESENT"
  | "EVALUATION_ID_MISSING"
  | "ACTION_ID_PRESENT"
  | "ACTION_ID_MISSING"
  | "REQUESTED_ACTION_PRESENT"
  | "REQUESTED_ACTION_MISSING"
  | "REQUESTED_ACTION_VALID"
  | "REQUESTED_ACTION_INVALID"
  | "EVALUATION_RESULT_PRESENT"
  | "EVALUATION_RESULT_MISSING"
  | "ACTION_INTAKE_OPERATIONAL"
  | "ACTION_INTAKE_FAILED"
  | "AUTHORITY_VALIDATION_OPERATIONAL"
  | "AUTHORITY_VALIDATION_FAILED"
  | "GOVERNANCE_VALIDATION_OPERATIONAL"
  | "GOVERNANCE_VALIDATION_FAILED"
  | "POLICY_EVALUATION_OPERATIONAL"
  | "POLICY_EVALUATION_FAILED"
  | "TRUST_VALIDATION_OPERATIONAL"
  | "TRUST_VALIDATION_FAILED"
  | "CERTIFICATION_VALIDATION_OPERATIONAL"
  | "CERTIFICATION_VALIDATION_FAILED"
  | "CONTAINMENT_OPERATIONAL"
  | "CONTAINMENT_FAILED"
  | "RUNTIME_DECISION_DETERMINISTIC"
  | "RUNTIME_DECISION_NONDETERMINISTIC"
  | "TENANT_RUNTIME_ISOLATION_VALID"
  | "TENANT_RUNTIME_ISOLATION_FAILED"
  | "REPLAY_REPRODUCED"
  | "REPLAY_MISMATCH"
  | "REPLAY_INCOMPLETE_EVIDENCE"
  | "REPLAY_UNREPLAYABLE"
  | "LEDGER_APPEND_ONLY"
  | "LEDGER_IMMUTABLE"
  | "VISIBILITY_AVAILABLE"
  | "VISIBILITY_BLOCKED"
  | "OBSERVABILITY_OPERATIONAL"
  | "OBSERVABILITY_GAP_DETECTED"
  | "FAIL_CLOSED_ENFORCED"
  | "FAIL_OPEN_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "APPROVAL_ABSENT"
  | "APPROVAL_DETECTED"
  | "RANKING_ABSENT"
  | "RANKING_DETECTED"
  | "PRIORITIZATION_ABSENT"
  | "PRIORITIZATION_DETECTED"
  | "SCORING_ABSENT"
  | "SCORING_DETECTED"
  | "RESOURCE_ALLOCATION_ABSENT"
  | "RESOURCE_ALLOCATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "RUNTIME_POLICY_ENGINE_IS_NOT_CONTROL"
  | "CERTIFICATION_PASS"
  | "CERTIFICATION_CONDITIONAL_PASS"
  | "CERTIFICATION_FAIL";

export type TruthRuntimePolicyEngineValidation = Readonly<{
  valid: boolean;
  validationState: TruthFilesystemEvaluationStatus;
  reasonCodes: readonly TruthRuntimePolicyEngineReasonCode[];
  contractValid: boolean;
  actionIntakeValid: boolean;
  authorityValidationValid: boolean;
  governanceValidationValid: boolean;
  policyEvaluationValid: boolean;
  trustValidationValid: boolean;
  certificationValidationValid: boolean;
  containmentValid: boolean;
  runtimeDecisionValid: boolean;
  tenantIsolationValid: boolean;
  replayValid: boolean;
  failClosed: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  approvalAbsent: boolean;
  rankingAbsent: boolean;
  prioritizationAbsent: boolean;
  scoringAbsent: boolean;
  resourceAllocationAbsent: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
}>;

export type TruthRuntimePolicyEngineReplay = Readonly<{
  replayResult: TruthReplayResult;
  reconstructedEvaluation: TruthRuntimePolicyEngineContract;
  reconstructedDecision: TruthRuntimeEvaluationResult;
}>;

export type TruthRuntimePolicyEngineVisibility = Readonly<{
  action_id: string;
  requested_action: TruthRuntimeActionType;
  authority_status: TruthRuntimeAuthorityState;
  governance_status: TruthRuntimeGovernanceState;
  policy_status: TruthRuntimePolicyState;
  trust_status: TruthRuntimeTrustState;
  certification_status: TruthRuntimeCertificationState;
  evaluation_result: TruthRuntimeEvaluationResult;
  replay_status: TruthReplayResult;
  readOnly: true;
  tenantScoped: boolean;
  auditable: true;
  replayLinked: true;
}>;

export type TruthRuntimePolicyEngineObservability = Readonly<{
  actions_total: number;
  allowed_actions: number;
  denied_actions: number;
  escalated_actions: number;
  contained_actions: number;
  authority_violations: number;
  governance_violations: number;
  trust_violations: number;
  certification_violations: number;
  tenant_isolation_failures: number;
  replay_failures: number;
}>;

export type TruthRuntimePolicyEngineInput = Readonly<{
  request: TruthRuntimePolicyEngineRequest;
  actionId: string;
  missionId: string;
  agentId: string;
  requestedAction: TruthRuntimeActionType;
  authorityState: TruthRuntimeAuthorityState;
  governanceState: TruthRuntimeGovernanceState;
  policyState: TruthRuntimePolicyState;
  trustState: TruthRuntimeTrustState;
  certificationState: TruthRuntimeCertificationState;
  containmentState?: TruthRuntimeContainmentState;
  replayReferences?: readonly string[];
  accessTenantId?: string;
  authenticated?: boolean;
  unknownActionDetected?: boolean;
  policyBypassDetected?: boolean;
  nondeterministicOutcomeDetected?: boolean;
  multipleOutcomesDetected?: boolean;
  crossTenantActionExecutionDetected?: boolean;
  crossTenantEvaluationAccessDetected?: boolean;
  replayMismatchDetected?: boolean;
  decisionMismatchDetected?: boolean;
  observabilityGapDetected?: boolean;
  reportingLimitationDetected?: boolean;
  remediationDocumented?: boolean;
  executionRequested?: boolean;
  approvalRequested?: boolean;
  rankingRequested?: boolean;
  prioritizationRequested?: boolean;
  scoringRequested?: boolean;
  resourceAllocationRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type SealedTruthRuntimePolicyEngine = Readonly<{
  request: TruthRuntimePolicyEngineRequest;
  evaluation: TruthRuntimePolicyEngineContract;
  ledgerEntry: TruthRuntimeGovernanceLedgerEntry;
  validation: TruthRuntimePolicyEngineValidation;
  replay: TruthRuntimePolicyEngineReplay;
  visibility: TruthRuntimePolicyEngineVisibility;
  observability: TruthRuntimePolicyEngineObservability;
  certification: TruthCertificationState;
  sealed: true;
  readOnly: true;
  executionAuthorized: false;
  approvalAllowed: false;
  rankingAllowed: false;
  prioritizationAllowed: false;
  scoringAllowed: false;
  resourceAllocationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export type TruthEnforcementTargetType =
  | "FILESYSTEM"
  | "NETWORK"
  | "TOOL"
  | "CAPABILITY"
  | "FEDERATION_ROUTE"
  | "RUNTIME_ACTION";
export type TruthEnforcementAction = "ALLOW" | "DENY" | "ESCALATE" | "CONTAIN";
export type TruthEnforcementState = "ENFORCED" | "REJECTED";
export type TruthEnforcementTargetState = "ALLOWED" | "BLOCKED" | "ESCALATED" | "CONTAINED" | "EXECUTED";

export interface TruthEnforcementLayerRequest {
  tenant_id: string;
  now: string;
}

export interface TruthEnforcementLayerContract {
  enforcement_id: string;
  action_id: string;
  tenant_id: string;
  mission_id: string;
  target_type: TruthEnforcementTargetType;
  target_id: string;
  policy_decision: TruthRuntimeEvaluationResult;
  enforcement_action: TruthEnforcementAction;
  enforcement_timestamp: string;
  enforcement_state: TruthEnforcementState;
  replay_references: readonly string[];
}

export interface TruthEnforcementLedgerEntry {
  enforcement_id: string;
  action_id: string;
  tenant_id: string;
  mission_id: string;
  target_type: TruthEnforcementTargetType;
  policy_decision: TruthRuntimeEvaluationResult;
  enforcement_action: TruthEnforcementAction;
  validation_status: TruthFilesystemEvaluationStatus;
  replay_status: TruthReplayResult;
  failure_reason: string | null;
}

export type TruthEnforcementLayerReasonCode =
  | "ENFORCEMENT_ID_PRESENT"
  | "ENFORCEMENT_ID_MISSING"
  | "ACTION_ID_PRESENT"
  | "ACTION_ID_MISSING"
  | "POLICY_DECISION_PRESENT"
  | "POLICY_DECISION_MISSING"
  | "ENFORCEMENT_ACTION_PRESENT"
  | "ENFORCEMENT_ACTION_MISSING"
  | "FILESYSTEM_ENFORCEMENT_OPERATIONAL"
  | "FILESYSTEM_ENFORCEMENT_FAILED"
  | "NETWORK_ENFORCEMENT_OPERATIONAL"
  | "NETWORK_ENFORCEMENT_FAILED"
  | "TOOL_ENFORCEMENT_OPERATIONAL"
  | "TOOL_ENFORCEMENT_FAILED"
  | "CAPABILITY_ENFORCEMENT_OPERATIONAL"
  | "CAPABILITY_ENFORCEMENT_FAILED"
  | "FEDERATION_ENFORCEMENT_OPERATIONAL"
  | "FEDERATION_ENFORCEMENT_FAILED"
  | "RUNTIME_ENFORCEMENT_OPERATIONAL"
  | "RUNTIME_ENFORCEMENT_FAILED"
  | "CONTAINMENT_ENFORCEMENT_OPERATIONAL"
  | "CONTAINMENT_ENFORCEMENT_FAILED"
  | "ESCALATION_ENFORCEMENT_OPERATIONAL"
  | "ESCALATION_ENFORCEMENT_FAILED"
  | "ENFORCEMENT_TRANSLATION_DETERMINISTIC"
  | "ENFORCEMENT_TRANSLATION_AMBIGUOUS"
  | "ENFORCEMENT_VALIDATION_VALID"
  | "ENFORCEMENT_VALIDATION_INVALID"
  | "TENANT_ENFORCEMENT_ISOLATION_VALID"
  | "TENANT_ENFORCEMENT_ISOLATION_FAILED"
  | "REPLAY_REPRODUCED"
  | "REPLAY_MISMATCH"
  | "REPLAY_INCOMPLETE_EVIDENCE"
  | "REPLAY_UNREPLAYABLE"
  | "LEDGER_APPEND_ONLY"
  | "LEDGER_IMMUTABLE"
  | "VISIBILITY_AVAILABLE"
  | "VISIBILITY_BLOCKED"
  | "OBSERVABILITY_OPERATIONAL"
  | "OBSERVABILITY_GAP_DETECTED"
  | "FAIL_CLOSED_ENFORCED"
  | "FAIL_OPEN_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "APPROVAL_ABSENT"
  | "APPROVAL_DETECTED"
  | "RANKING_ABSENT"
  | "RANKING_DETECTED"
  | "PRIORITIZATION_ABSENT"
  | "PRIORITIZATION_DETECTED"
  | "SCORING_ABSENT"
  | "SCORING_DETECTED"
  | "RESOURCE_ALLOCATION_ABSENT"
  | "RESOURCE_ALLOCATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "ENFORCEMENT_LAYER_IS_NOT_CONTROL"
  | "CERTIFICATION_PASS"
  | "CERTIFICATION_CONDITIONAL_PASS"
  | "CERTIFICATION_FAIL";

export type TruthEnforcementLayerValidation = Readonly<{
  valid: boolean;
  validationState: TruthFilesystemEvaluationStatus;
  reasonCodes: readonly TruthEnforcementLayerReasonCode[];
  contractValid: boolean;
  filesystemEnforcementValid: boolean;
  networkEnforcementValid: boolean;
  toolEnforcementValid: boolean;
  capabilityEnforcementValid: boolean;
  federationEnforcementValid: boolean;
  runtimeEnforcementValid: boolean;
  containmentEnforcementValid: boolean;
  escalationEnforcementValid: boolean;
  translatorValid: boolean;
  enforcementValidationValid: boolean;
  tenantIsolationValid: boolean;
  replayValid: boolean;
  failClosed: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  approvalAbsent: boolean;
  rankingAbsent: boolean;
  prioritizationAbsent: boolean;
  scoringAbsent: boolean;
  resourceAllocationAbsent: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
}>;

export type TruthEnforcementReplay = Readonly<{
  replayResult: TruthReplayResult;
  reconstructedEnforcement: TruthEnforcementLayerContract;
  reconstructedTargetState: TruthEnforcementTargetState;
}>;

export type TruthEnforcementVisibility = Readonly<{
  action_id: string;
  policy_decision: TruthRuntimeEvaluationResult;
  enforcement_action: TruthEnforcementAction;
  target_type: TruthEnforcementTargetType;
  target_state: TruthEnforcementTargetState;
  validation_status: TruthFilesystemEvaluationStatus;
  replay_status: TruthReplayResult;
  timestamp: string;
  readOnly: true;
  tenantScoped: boolean;
  auditable: true;
  replayLinked: true;
}>;

export type TruthEnforcementObservability = Readonly<{
  enforcements_total: number;
  allowed_actions: number;
  blocked_actions: number;
  contained_actions: number;
  escalated_actions: number;
  validation_failures: number;
  containment_failures: number;
  escalation_failures: number;
  tenant_isolation_failures: number;
  replay_failures: number;
}>;

export type TruthEnforcementLayerInput = Readonly<{
  request: TruthEnforcementLayerRequest;
  runtimeEvaluation: SealedTruthRuntimePolicyEngine;
  targetType: TruthEnforcementTargetType;
  targetId: string;
  targetState?: TruthEnforcementTargetState;
  replayReferences?: readonly string[];
  accessTenantId?: string;
  policyViolationExecuted?: boolean;
  filesystemViolationExecuted?: boolean;
  networkViolationExecuted?: boolean;
  toolViolationExecuted?: boolean;
  capabilityViolationExecuted?: boolean;
  federationViolationExecuted?: boolean;
  runtimeViolationExecuted?: boolean;
  containmentFailureDetected?: boolean;
  escalationNotGeneratedDetected?: boolean;
  ambiguousOutcomeDetected?: boolean;
  crossTenantEnforcementDetected?: boolean;
  replayMismatchDetected?: boolean;
  observabilityGapDetected?: boolean;
  reportingLimitationDetected?: boolean;
  remediationDocumented?: boolean;
  executionRequested?: boolean;
  approvalRequested?: boolean;
  rankingRequested?: boolean;
  prioritizationRequested?: boolean;
  scoringRequested?: boolean;
  resourceAllocationRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type SealedTruthEnforcementLayer = Readonly<{
  request: TruthEnforcementLayerRequest;
  enforcement: TruthEnforcementLayerContract;
  ledgerEntry: TruthEnforcementLedgerEntry;
  validation: TruthEnforcementLayerValidation;
  replay: TruthEnforcementReplay;
  visibility: TruthEnforcementVisibility;
  observability: TruthEnforcementObservability;
  certification: TruthCertificationState;
  sealed: true;
  readOnly: true;
  executionAuthorized: false;
  approvalAllowed: false;
  rankingAllowed: false;
  prioritizationAllowed: false;
  scoringAllowed: false;
  resourceAllocationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export type TruthPolicyLedgerEventType =
  | "POLICY_CREATED"
  | "POLICY_UPDATED"
  | "POLICY_EVALUATED"
  | "POLICY_VIOLATION"
  | "POLICY_ESCALATION"
  | "CONTAINMENT_ACTION";
export type TruthPolicyLedgerActorType = "OPERATOR" | "AGENT" | "GOVERNANCE_ENGINE" | "CERTIFICATION_ENGINE" | "SUPERVISION_ENGINE";
export type TruthPolicyViolationSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type TruthPolicyLedgerValidationState = "VALID" | "INVALID";

export interface TruthPolicyLedgerRequest {
  tenant_id: string;
  now: string;
}

export interface TruthPolicyLedgerEvidenceBinding {
  evidence_id: string;
  evidence_type: string;
  evidence_hash: string;
  evidence_scope: string;
}

export interface TruthPolicyLedgerReplayBinding {
  replay_id: string;
  replay_bundle_id: string;
  replay_hash: string;
}

export interface TruthPolicyLedgerContract {
  ledger_entry_id: string;
  policy_id: string;
  tenant_id: string;
  mission_id: string;
  event_type: TruthPolicyLedgerEventType;
  event_timestamp: string;
  actor_id: string;
  actor_type: TruthPolicyLedgerActorType;
  rationale: string;
  evidence_references: readonly TruthPolicyLedgerEvidenceBinding[];
  replay_references: readonly TruthPolicyLedgerReplayBinding[];
  entry_hash: string;
  evaluation_result?: TruthPolicyAction;
  violation_severity?: TruthPolicyViolationSeverity;
}

export type TruthPolicyLedgerReasonCode =
  | "LEDGER_ENTRY_ID_PRESENT"
  | "LEDGER_ENTRY_ID_MISSING"
  | "POLICY_ID_PRESENT"
  | "POLICY_ID_MISSING"
  | "EVENT_TYPE_PRESENT"
  | "EVENT_TYPE_MISSING"
  | "EVENT_TIMESTAMP_PRESENT"
  | "EVENT_TIMESTAMP_MISSING"
  | "ACTOR_VALID"
  | "ACTOR_INVALID"
  | "RATIONALE_PRESENT"
  | "RATIONALE_MISSING"
  | "CREATION_RECORDED"
  | "CREATION_MISSING"
  | "UPDATE_RECORDED"
  | "UPDATE_MISSING"
  | "EVALUATION_RECORDED"
  | "EVALUATION_MISSING"
  | "VIOLATION_RECORDED"
  | "VIOLATION_MISSING"
  | "ESCALATION_RECORDED"
  | "ESCALATION_MISSING"
  | "CONTAINMENT_RECORDED"
  | "CONTAINMENT_MISSING"
  | "EVIDENCE_BINDING_VALID"
  | "EVIDENCE_BINDING_MISSING"
  | "REPLAY_BINDING_VALID"
  | "REPLAY_BINDING_MISSING"
  | "LEDGER_INTEGRITY_VALID"
  | "LEDGER_INTEGRITY_INVALID"
  | "IMMUTABLE_STORAGE_VALID"
  | "ENTRY_MODIFICATION_DETECTED"
  | "TENANT_LEDGER_ISOLATION_VALID"
  | "TENANT_LEDGER_ISOLATION_FAILED"
  | "REPLAY_REPRODUCED"
  | "REPLAY_MISMATCH"
  | "REPLAY_INCOMPLETE_EVIDENCE"
  | "REPLAY_UNREPLAYABLE"
  | "LEDGER_APPEND_ONLY"
  | "LEDGER_IMMUTABLE"
  | "VISIBILITY_AVAILABLE"
  | "VISIBILITY_BLOCKED"
  | "OBSERVABILITY_OPERATIONAL"
  | "OBSERVABILITY_GAP_DETECTED"
  | "FAIL_CLOSED_ENFORCED"
  | "FAIL_OPEN_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "APPROVAL_ABSENT"
  | "APPROVAL_DETECTED"
  | "RANKING_ABSENT"
  | "RANKING_DETECTED"
  | "PRIORITIZATION_ABSENT"
  | "PRIORITIZATION_DETECTED"
  | "SCORING_ABSENT"
  | "SCORING_DETECTED"
  | "RESOURCE_ALLOCATION_ABSENT"
  | "RESOURCE_ALLOCATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "POLICY_LEDGER_IS_NOT_CONTROL"
  | "CERTIFICATION_PASS"
  | "CERTIFICATION_CONDITIONAL_PASS"
  | "CERTIFICATION_FAIL";

export type TruthPolicyLedgerValidation = Readonly<{
  valid: boolean;
  validationState: TruthPolicyLedgerValidationState;
  reasonCodes: readonly TruthPolicyLedgerReasonCode[];
  contractValid: boolean;
  recorderValid: boolean;
  evidenceBindingValid: boolean;
  replayBindingValid: boolean;
  integrityValid: boolean;
  immutableStorageValid: boolean;
  tenantIsolationValid: boolean;
  replayValid: boolean;
  failClosed: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  approvalAbsent: boolean;
  rankingAbsent: boolean;
  prioritizationAbsent: boolean;
  scoringAbsent: boolean;
  resourceAllocationAbsent: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
}>;

export type TruthPolicyLedgerReplay = Readonly<{
  replayResult: TruthReplayResult;
  reconstructedEntry: TruthPolicyLedgerContract;
}>;

export type TruthPolicyLedgerVisibility = Readonly<{
  ledger_entry_id: string;
  policy_id: string;
  event_type: TruthPolicyLedgerEventType;
  actor: string;
  timestamp: string;
  evidence_status: "VALID" | "INVALID";
  replay_status: TruthReplayResult;
  validation_status: TruthPolicyLedgerValidationState;
  readOnly: true;
  tenantScoped: boolean;
  auditable: true;
  replayLinked: true;
}>;

export type TruthPolicyLedgerObservability = Readonly<{
  ledger_entries_total: number;
  policy_creations: number;
  policy_updates: number;
  policy_evaluations: number;
  policy_violations: number;
  policy_escalations: number;
  containment_actions: number;
  validation_failures: number;
  tamper_detections: number;
  tenant_isolation_failures: number;
  replay_failures: number;
}>;

export type TruthPolicyLedgerInput = Readonly<{
  request: TruthPolicyLedgerRequest;
  policyId: string;
  missionId: string;
  eventType: TruthPolicyLedgerEventType;
  actorId: string;
  actorType: TruthPolicyLedgerActorType;
  rationale: string;
  evidenceReferences: readonly TruthPolicyLedgerEvidenceBinding[];
  replayReferences: readonly TruthPolicyLedgerReplayBinding[];
  eventTimestamp?: string;
  evaluationResult?: TruthPolicyAction;
  violationSeverity?: TruthPolicyViolationSeverity;
  accessTenantId?: string;
  missingEventRecordDetected?: boolean;
  evidenceMissingDetected?: boolean;
  replayReferenceMissingDetected?: boolean;
  tamperedEntryDetected?: boolean;
  entryModificationDetected?: boolean;
  orderingInvalidDetected?: boolean;
  crossTenantLedgerAccessDetected?: boolean;
  crossTenantReplayAccessDetected?: boolean;
  replayMismatchDetected?: boolean;
  observabilityGapDetected?: boolean;
  reportingLimitationDetected?: boolean;
  remediationDocumented?: boolean;
  executionRequested?: boolean;
  approvalRequested?: boolean;
  rankingRequested?: boolean;
  prioritizationRequested?: boolean;
  scoringRequested?: boolean;
  resourceAllocationRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type SealedTruthPolicyLedger = Readonly<{
  request: TruthPolicyLedgerRequest;
  entry: TruthPolicyLedgerContract;
  validation: TruthPolicyLedgerValidation;
  replay: TruthPolicyLedgerReplay;
  visibility: TruthPolicyLedgerVisibility;
  observability: TruthPolicyLedgerObservability;
  certification: TruthCertificationState;
  sealed: true;
  readOnly: true;
  executionAuthorized: false;
  approvalAllowed: false;
  rankingAllowed: false;
  prioritizationAllowed: false;
  scoringAllowed: false;
  resourceAllocationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export type TruthPolicyReplayScope =
  | "FULL_POLICY"
  | "ACTIVE_POLICY"
  | "EVALUATION"
  | "DENIED_ACTION"
  | "ALLOWED_ACTION"
  | "CONTAINMENT"
  | "ESCALATION"
  | "AUTHORITY";
export type TruthPolicyReplayState = "REPLAYED" | "REJECTED";
export type TruthPolicyReplayValidationState = "VALID" | "INVALID";
export type TruthPolicyReplayBundleStatus = "ASSEMBLED" | "INCOMPLETE";

export interface TruthPolicyReplayRequest {
  tenant_id: string;
  now: string;
}

export type TruthPolicyReplayExplanation = Readonly<{
  why_action: string;
  policy_applied: string;
  authority_involved: string;
  evidence_summary: string;
  evidence_references: readonly string[];
}>;

export type TruthPolicyReplayBundle = Readonly<{
  reconstruction_bundle_id: string;
  active_policy: TruthPolicyContract;
  ledger_entries: readonly TruthPolicyLedgerContract[];
  evaluation_result: TruthPolicyAction;
  decision_rationale: string;
  containment_rationale?: string;
  escalation_path: readonly string[];
  authority_id: string;
  authority_scope: string;
  explanation: TruthPolicyReplayExplanation;
  bundle_status: TruthPolicyReplayBundleStatus;
  bundle_hash: string;
}>;

export interface TruthPolicyReplayContract {
  replay_id: string;
  policy_id: string;
  tenant_id: string;
  mission_id: string;
  replay_timestamp: string;
  replay_scope: TruthPolicyReplayScope;
  replay_state: TruthPolicyReplayState;
  replay_hash: string;
  evidence_references: readonly string[];
  reconstruction_bundle_id: string;
}

export type TruthPolicyReplayLedgerEntry = Readonly<{
  replay_id: string;
  policy_id: string;
  tenant_id: string;
  mission_id: string;
  replay_scope: TruthPolicyReplayScope;
  replay_state: TruthPolicyReplayState;
  validation_status: TruthPolicyReplayValidationState;
  replay_result: TruthReplayResult;
  certification_state: TruthCertificationState;
  failure_reason: string | null;
  entry_hash: string;
}>;

export type TruthPolicyReplayReasonCode =
  | "REPLAY_ID_PRESENT"
  | "REPLAY_ID_MISSING"
  | "POLICY_ID_PRESENT"
  | "POLICY_ID_MISSING"
  | "REPLAY_SCOPE_PRESENT"
  | "REPLAY_SCOPE_MISSING"
  | "POLICY_REPLAY_CONTRACT_VALID"
  | "POLICY_REPLAY_CONTRACT_INVALID"
  | "ACTIVE_POLICY_RECONSTRUCTED"
  | "ACTIVE_POLICY_MISSING"
  | "POLICY_VERSION_REPRODUCED"
  | "POLICY_VERSION_MISMATCH"
  | "EVALUATION_REPLAY_REPRODUCED"
  | "EVALUATION_MISMATCH"
  | "DENIAL_RECONSTRUCTED"
  | "DENIAL_RATIONALE_MISSING"
  | "ALLOWANCE_RECONSTRUCTED"
  | "APPROVAL_RATIONALE_MISSING"
  | "CONTAINMENT_RECONSTRUCTED"
  | "CONTAINMENT_RATIONALE_MISSING"
  | "CONTAINMENT_MISMATCH"
  | "ESCALATION_RECONSTRUCTED"
  | "ESCALATION_CHAIN_BROKEN"
  | "AUTHORITY_RECONSTRUCTED"
  | "AUTHORITY_MISMATCH"
  | "EXPLANATION_GENERATED"
  | "EXPLANATION_MISSING"
  | "BUNDLE_ASSEMBLED"
  | "BUNDLE_INCOMPLETE"
  | "REPLAY_INTEGRITY_VALID"
  | "REPLAY_INTEGRITY_INVALID"
  | "REPLAY_REPRODUCED"
  | "REPLAY_MISMATCH"
  | "REPLAY_INCOMPLETE_EVIDENCE"
  | "TENANT_REPLAY_ISOLATION_VALID"
  | "TENANT_REPLAY_ISOLATION_FAILED"
  | "LEDGER_APPEND_ONLY"
  | "LEDGER_IMMUTABLE"
  | "VISIBILITY_AVAILABLE"
  | "VISIBILITY_BLOCKED"
  | "OBSERVABILITY_OPERATIONAL"
  | "OBSERVABILITY_GAP_DETECTED"
  | "FAIL_CLOSED_ENFORCED"
  | "FAIL_OPEN_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "APPROVAL_ABSENT"
  | "APPROVAL_DETECTED"
  | "RANKING_ABSENT"
  | "RANKING_DETECTED"
  | "PRIORITIZATION_ABSENT"
  | "PRIORITIZATION_DETECTED"
  | "SCORING_ABSENT"
  | "SCORING_DETECTED"
  | "RESOURCE_ALLOCATION_ABSENT"
  | "RESOURCE_ALLOCATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "POLICY_REPLAY_IS_NOT_CONTROL"
  | "CERTIFICATION_PASS"
  | "CERTIFICATION_CONDITIONAL_PASS"
  | "CERTIFICATION_FAIL";

export type TruthPolicyReplayValidation = Readonly<{
  valid: boolean;
  validationState: TruthPolicyReplayValidationState;
  reasonCodes: readonly TruthPolicyReplayReasonCode[];
  contractValid: boolean;
  activePolicyReconstructed: boolean;
  policyVersionReproduced: boolean;
  evaluationReplayed: boolean;
  denialReconstructed: boolean;
  allowanceReconstructed: boolean;
  containmentReconstructed: boolean;
  escalationReconstructed: boolean;
  authorityReconstructed: boolean;
  explanationGenerated: boolean;
  bundleAssembled: boolean;
  integrityValid: boolean;
  ledgerImmutable: boolean;
  tenantIsolationValid: boolean;
  failClosed: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  approvalAbsent: boolean;
  rankingAbsent: boolean;
  prioritizationAbsent: boolean;
  scoringAbsent: boolean;
  resourceAllocationAbsent: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
}>;

export type TruthPolicyReplayReplay = Readonly<{
  replayResult: TruthReplayResult;
  reconstructedPolicy: TruthPolicyContract;
  reconstructedLedgerEntries: readonly TruthPolicyLedgerContract[];
  reconstructedBundle: TruthPolicyReplayBundle;
  explanation: TruthPolicyReplayExplanation;
}>;

export type TruthPolicyReplayVisibility = Readonly<{
  policy_id: string;
  replay_state: TruthPolicyReplayState;
  bundle_status: TruthPolicyReplayBundleStatus;
  authority_status: TruthPolicyReplayValidationState;
  containment_status: TruthPolicyReplayValidationState;
  escalation_status: TruthPolicyReplayValidationState;
  validation_status: TruthPolicyReplayValidationState;
  replay_timestamp: string;
  readOnly: true;
  tenantScoped: boolean;
  auditable: true;
  replayLinked: true;
}>;

export type TruthPolicyReplayObservability = Readonly<{
  replays_total: number;
  successful_replays: number;
  failed_replays: number;
  bundle_failures: number;
  authority_mismatches: number;
  evaluation_mismatches: number;
  containment_mismatches: number;
  escalation_mismatches: number;
  tenant_isolation_failures: number;
}>;

export type TruthPolicyReplayInput = Readonly<{
  request: TruthPolicyReplayRequest;
  policy: SealedTruthPolicyContract;
  ledgerEntries: readonly SealedTruthPolicyLedger[];
  missionId: string;
  replayScope?: TruthPolicyReplayScope;
  replayTimestamp?: string;
  evaluationResult?: TruthPolicyAction;
  denialRationale?: string;
  approvalRationale?: string;
  containmentRationale?: string;
  escalationPath?: readonly string[];
  authorityId?: string;
  authorityScope?: string;
  explanation?: TruthPolicyReplayExplanation;
  accessTenantId?: string;
  missingPolicyDetected?: boolean;
  policyVersionMismatchDetected?: boolean;
  evaluationMismatchDetected?: boolean;
  missingDenialRationaleDetected?: boolean;
  missingApprovalRationaleDetected?: boolean;
  containmentMismatchDetected?: boolean;
  missingContainmentRationaleDetected?: boolean;
  brokenEscalationChainDetected?: boolean;
  authorityMismatchDetected?: boolean;
  missingExplanationDetected?: boolean;
  bundleAssemblyFailureDetected?: boolean;
  incompleteBundleDetected?: boolean;
  crossTenantReplayAccessDetected?: boolean;
  crossTenantVisibilityDetected?: boolean;
  replayInconsistencyDetected?: boolean;
  observabilityGapDetected?: boolean;
  reportingLimitationDetected?: boolean;
  remediationDocumented?: boolean;
  executionRequested?: boolean;
  approvalRequested?: boolean;
  rankingRequested?: boolean;
  prioritizationRequested?: boolean;
  scoringRequested?: boolean;
  resourceAllocationRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type SealedTruthPolicyReplayFramework = Readonly<{
  request: TruthPolicyReplayRequest;
  replayContract: TruthPolicyReplayContract;
  reconstructionBundle: TruthPolicyReplayBundle;
  ledgerEntry: TruthPolicyReplayLedgerEntry;
  validation: TruthPolicyReplayValidation;
  replay: TruthPolicyReplayReplay;
  visibility: TruthPolicyReplayVisibility;
  observability: TruthPolicyReplayObservability;
  certification: TruthCertificationState;
  sealed: true;
  readOnly: true;
  executionAuthorized: false;
  approvalAllowed: false;
  rankingAllowed: false;
  prioritizationAllowed: false;
  scoringAllowed: false;
  resourceAllocationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export type TruthPolicyObservabilityEventType =
  | "POLICY_EVALUATION"
  | "POLICY_VIOLATION"
  | "DENIED_ACTION"
  | "CONTAINMENT_ACTION"
  | "FILESYSTEM_VIOLATION"
  | "NETWORK_VIOLATION"
  | "CAPABILITY_VIOLATION"
  | "AUTHORITY_EVENT";
export type TruthPolicyObservabilityState = "VISIBLE" | "HIDDEN";
export type TruthPolicyObservabilityValidationState = "VALID" | "INVALID";
export type TruthPolicyObservabilityDashboardType =
  | "POLICY_DASHBOARD"
  | "VIOLATION_DASHBOARD"
  | "CONTAINMENT_DASHBOARD"
  | "AUTHORITY_DASHBOARD"
  | "TENANT_DASHBOARD";

export interface TruthPolicyObservabilityRequest {
  tenant_id: string;
  now: string;
}

export interface TruthPolicyObservabilityReplayReference {
  replay_id: string;
  replay_bundle_id: string;
  replay_hash: string;
  replay_status: TruthReplayResult;
}

export type TruthPolicyObservabilityExplanation = Readonly<{
  what_happened: string;
  why: string;
  policy_id: string;
  authority_id: string;
  evidence_references: readonly string[];
}>;

export type TruthPolicyObservabilityDetails = Readonly<{
  requested_action?: string;
  violation_type?: string;
  violation_severity?: TruthPolicyViolationSeverity;
  violation_source?: string;
  containment_trigger?: string;
  containment_target?: string;
  containment_scope?: string;
  filesystem_path?: string;
  filesystem_permission?: string;
  filesystem_containment_status?: string;
  network_domain?: string;
  network_ip?: string;
  network_cidr?: string;
  network_protocol?: string;
  network_routing_outcome?: string;
  capability_agent_id?: string;
  capability_requested?: string;
  capability_trust_status?: string;
  evaluation_input?: string;
  evaluation_output?: TruthPolicyAction;
  authority_type?: TruthPolicyAuthorityType;
  authority_scope?: string;
  authority_decision?: TruthPolicyAction;
  authority_rationale?: string;
}>;

export interface TruthPolicyObservabilityContract {
  observability_id: string;
  tenant_id: string;
  mission_id: string;
  event_id: string;
  event_type: TruthPolicyObservabilityEventType;
  policy_id: string;
  authority_id: string;
  observability_timestamp: string;
  observability_state: TruthPolicyObservabilityState;
  replay_reference: TruthPolicyObservabilityReplayReference;
}

export type TruthPolicyObservabilityDashboard = Readonly<{
  dashboard_id: string;
  dashboard_type: TruthPolicyObservabilityDashboardType;
  tenant_id: string;
  visible_events: readonly TruthPolicyObservabilityEventType[];
  replay_linked: boolean;
  realTimeCapable: true;
  readOnly: true;
}>;

export type TruthPolicyObservabilityLedgerEntry = Readonly<{
  observability_id: string;
  tenant_id: string;
  mission_id: string;
  event_id: string;
  event_type: TruthPolicyObservabilityEventType;
  observability_state: TruthPolicyObservabilityState;
  validation_status: TruthPolicyObservabilityValidationState;
  certification_state: TruthCertificationState;
  failure_reason: string | null;
  entry_hash: string;
}>;

export type TruthPolicyObservabilityReasonCode =
  | "OBSERVABILITY_ID_PRESENT"
  | "OBSERVABILITY_ID_MISSING"
  | "POLICY_ID_PRESENT"
  | "POLICY_ID_MISSING"
  | "EVENT_TYPE_PRESENT"
  | "EVENT_TYPE_MISSING"
  | "POLICY_OBSERVABILITY_CONTRACT_VALID"
  | "POLICY_OBSERVABILITY_CONTRACT_INVALID"
  | "POLICY_EVALUATION_VISIBLE"
  | "POLICY_EVALUATION_HIDDEN"
  | "POLICY_VIOLATION_VISIBLE"
  | "POLICY_VIOLATION_HIDDEN"
  | "DENIED_ACTION_VISIBLE"
  | "DENIED_ACTION_HIDDEN"
  | "CONTAINMENT_VISIBLE"
  | "CONTAINMENT_HIDDEN"
  | "FILESYSTEM_VIOLATION_VISIBLE"
  | "FILESYSTEM_VIOLATION_HIDDEN"
  | "NETWORK_VIOLATION_VISIBLE"
  | "NETWORK_VIOLATION_HIDDEN"
  | "CAPABILITY_VIOLATION_VISIBLE"
  | "CAPABILITY_VIOLATION_HIDDEN"
  | "AUTHORITY_VISIBLE"
  | "AUTHORITY_HIDDEN"
  | "EXPLANATION_GENERATED"
  | "EXPLANATION_MISSING"
  | "REPLAY_LINK_AVAILABLE"
  | "REPLAY_LINK_MISSING"
  | "DASHBOARD_AVAILABLE"
  | "DASHBOARD_UNAVAILABLE"
  | "TENANT_OBSERVABILITY_ISOLATION_VALID"
  | "TENANT_OBSERVABILITY_ISOLATION_FAILED"
  | "LEDGER_APPEND_ONLY"
  | "LEDGER_IMMUTABLE"
  | "METRICS_OPERATIONAL"
  | "METRICS_GAP_DETECTED"
  | "FAIL_CLOSED_ENFORCED"
  | "FAIL_OPEN_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "APPROVAL_ABSENT"
  | "APPROVAL_DETECTED"
  | "RANKING_ABSENT"
  | "RANKING_DETECTED"
  | "PRIORITIZATION_ABSENT"
  | "PRIORITIZATION_DETECTED"
  | "SCORING_ABSENT"
  | "SCORING_DETECTED"
  | "RESOURCE_ALLOCATION_ABSENT"
  | "RESOURCE_ALLOCATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "POLICY_OBSERVABILITY_IS_NOT_CONTROL"
  | "CERTIFICATION_PASS"
  | "CERTIFICATION_CONDITIONAL_PASS"
  | "CERTIFICATION_FAIL";

export type TruthPolicyObservabilityValidation = Readonly<{
  valid: boolean;
  validationState: TruthPolicyObservabilityValidationState;
  reasonCodes: readonly TruthPolicyObservabilityReasonCode[];
  contractValid: boolean;
  evaluationVisible: boolean;
  violationVisible: boolean;
  deniedActionVisible: boolean;
  containmentVisible: boolean;
  filesystemViolationVisible: boolean;
  networkViolationVisible: boolean;
  capabilityViolationVisible: boolean;
  authorityVisible: boolean;
  explanationGenerated: boolean;
  replayLinked: boolean;
  dashboardAvailable: boolean;
  ledgerImmutable: boolean;
  metricsOperational: boolean;
  tenantIsolationValid: boolean;
  failClosed: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  approvalAbsent: boolean;
  rankingAbsent: boolean;
  prioritizationAbsent: boolean;
  scoringAbsent: boolean;
  resourceAllocationAbsent: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
}>;

export type TruthPolicyObservabilityVisibility = Readonly<{
  observability_id: string;
  event_type: TruthPolicyObservabilityEventType;
  policy_id: string;
  authority_id: string;
  observability_state: TruthPolicyObservabilityState;
  replay_status: TruthReplayResult;
  dashboard_status: TruthPolicyObservabilityValidationState;
  validation_status: TruthPolicyObservabilityValidationState;
  timestamp: string;
  readOnly: true;
  tenantScoped: boolean;
  auditable: true;
  replayLinked: boolean;
}>;

export type TruthPolicyObservabilityMetrics = Readonly<{
  policy_evaluations_visible: number;
  policy_violations_visible: number;
  denied_actions_visible: number;
  containment_actions_visible: number;
  filesystem_violations_visible: number;
  network_violations_visible: number;
  capability_violations_visible: number;
  authority_events_visible: number;
  dashboard_availability: number;
  tenant_isolation_failures: number;
}>;

export type TruthPolicyObservabilityInput = Readonly<{
  request: TruthPolicyObservabilityRequest;
  missionId: string;
  eventId: string;
  eventType: TruthPolicyObservabilityEventType;
  policyId: string;
  authorityId: string;
  replayReference: TruthPolicyObservabilityReplayReference;
  explanation: TruthPolicyObservabilityExplanation;
  details?: TruthPolicyObservabilityDetails;
  dashboardTypes?: readonly TruthPolicyObservabilityDashboardType[];
  observabilityTimestamp?: string;
  accessTenantId?: string;
  hiddenEvaluationDetected?: boolean;
  hiddenViolationDetected?: boolean;
  hiddenDeniedActionDetected?: boolean;
  hiddenContainmentDetected?: boolean;
  hiddenFilesystemViolationDetected?: boolean;
  hiddenNetworkViolationDetected?: boolean;
  hiddenCapabilityViolationDetected?: boolean;
  hiddenAuthorityDetected?: boolean;
  missingExplanationDetected?: boolean;
  missingReplayLinkDetected?: boolean;
  dashboardUnavailableDetected?: boolean;
  crossTenantObservabilityAccessDetected?: boolean;
  observabilityGapDetected?: boolean;
  reportingLimitationDetected?: boolean;
  remediationDocumented?: boolean;
  executionRequested?: boolean;
  approvalRequested?: boolean;
  rankingRequested?: boolean;
  prioritizationRequested?: boolean;
  scoringRequested?: boolean;
  resourceAllocationRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type SealedTruthPolicyObservabilitySurface = Readonly<{
  request: TruthPolicyObservabilityRequest;
  contract: TruthPolicyObservabilityContract;
  dashboards: readonly TruthPolicyObservabilityDashboard[];
  ledgerEntry: TruthPolicyObservabilityLedgerEntry;
  validation: TruthPolicyObservabilityValidation;
  visibility: TruthPolicyObservabilityVisibility;
  metrics: TruthPolicyObservabilityMetrics;
  explanation: TruthPolicyObservabilityExplanation;
  certification: TruthCertificationState;
  sealed: true;
  readOnly: true;
  executionAuthorized: false;
  approvalAllowed: false;
  rankingAllowed: false;
  prioritizationAllowed: false;
  scoringAllowed: false;
  resourceAllocationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export type TruthPolicyCertificationScope =
  | "POLICY_CONTRACT"
  | "FILESYSTEM_GOVERNANCE"
  | "NETWORK_GOVERNANCE"
  | "CAPABILITY_GOVERNANCE"
  | "RUNTIME_POLICY_ENGINE"
  | "ENFORCEMENT_LAYER"
  | "POLICY_LEDGER"
  | "POLICY_REPLAY_FRAMEWORK"
  | "POLICY_OBSERVABILITY_SURFACE"
  | "GOVERNANCE_COMPLIANCE"
  | "CONSTITUTIONAL_COMPLIANCE"
  | "TENANT_ISOLATION";
export type TruthPolicyLayerAdvancementState =
  | "POLICY_LAYER_CERTIFIED"
  | "POLICY_LAYER_CONDITIONAL"
  | "POLICY_LAYER_FAILED";

export interface TruthPolicyCertificationRequest {
  tenant_id: string;
  now: string;
}

export interface TruthPolicyCertificationAuthority {
  authority_id: string;
  authority_type: TruthPolicyAuthorityType;
  authority_scope: string;
  authority_evidence: readonly string[];
}

export interface TruthPolicyCertificationContract {
  certification_id: string;
  certification_timestamp: string;
  policy_layer_version: string;
  certification_scope: readonly TruthPolicyCertificationScope[];
  certification_state: TruthCertificationState;
  certification_reason: string;
  certification_authority: TruthPolicyCertificationAuthority;
  evidence_references: readonly string[];
  replay_references: readonly string[];
}

export type TruthPolicyCertificationDomainResult = Readonly<{
  scope: TruthPolicyCertificationScope;
  certification_state: TruthCertificationState;
  certified: boolean;
  failure_reason: string | null;
}>;

export type TruthPolicyCertificationLedgerEntry = Readonly<{
  certification_id: string;
  tenant_id: string;
  policy_layer_version: string;
  certification_state: TruthCertificationState;
  advancement_state: TruthPolicyLayerAdvancementState;
  evidence_references: readonly string[];
  replay_references: readonly string[];
  failure_reason: string | null;
  entry_hash: string;
}>;

export type TruthPolicyCertificationReplay = Readonly<{
  replayResult: TruthReplayResult;
  reproducedContract: TruthPolicyCertificationContract;
  reproducedDomains: readonly TruthPolicyCertificationDomainResult[];
}>;

export type TruthPolicyCertificationReasonCode =
  | "CERTIFICATION_SCOPE_PRESENT"
  | "CERTIFICATION_SCOPE_MISSING"
  | "CERTIFICATION_AUTHORITY_PRESENT"
  | "CERTIFICATION_AUTHORITY_MISSING"
  | "EVIDENCE_REFERENCES_PRESENT"
  | "EVIDENCE_REFERENCES_MISSING"
  | "REPLAY_REFERENCES_PRESENT"
  | "REPLAY_REFERENCES_MISSING"
  | "POLICY_CONTRACT_CERTIFIED"
  | "POLICY_CONTRACT_FAILED"
  | "FILESYSTEM_GOVERNANCE_CERTIFIED"
  | "FILESYSTEM_GOVERNANCE_FAILED"
  | "NETWORK_GOVERNANCE_CERTIFIED"
  | "NETWORK_GOVERNANCE_FAILED"
  | "CAPABILITY_GOVERNANCE_CERTIFIED"
  | "CAPABILITY_GOVERNANCE_FAILED"
  | "RUNTIME_POLICY_ENGINE_CERTIFIED"
  | "RUNTIME_POLICY_ENGINE_FAILED"
  | "ENFORCEMENT_LAYER_CERTIFIED"
  | "ENFORCEMENT_LAYER_FAILED"
  | "POLICY_LEDGER_CERTIFIED"
  | "POLICY_LEDGER_FAILED"
  | "POLICY_REPLAY_CERTIFIED"
  | "POLICY_REPLAY_FAILED"
  | "POLICY_OBSERVABILITY_CERTIFIED"
  | "POLICY_OBSERVABILITY_FAILED"
  | "GOVERNANCE_COMPLIANCE_VERIFIED"
  | "GOVERNANCE_COMPLIANCE_FAILED"
  | "CONSTITUTIONAL_COMPLIANCE_VERIFIED"
  | "CONSTITUTIONAL_COMPLIANCE_FAILED"
  | "TENANT_ISOLATION_CERTIFIED"
  | "TENANT_ISOLATION_FAILED"
  | "AUTHORIZED_FILESYSTEM_ACCESS_CERTIFIED"
  | "UNAUTHORIZED_FILESYSTEM_ACCESS_DETECTED"
  | "AUTHORIZED_NETWORK_ACCESS_CERTIFIED"
  | "UNAUTHORIZED_NETWORK_ACCESS_DETECTED"
  | "APPROVED_TOOL_USE_CERTIFIED"
  | "PROHIBITED_TOOL_USE_DETECTED"
  | "AUTHORITY_VALIDATION_ENFORCED"
  | "AUTHORITY_VALIDATION_BYPASSED"
  | "GOVERNANCE_VALIDATION_ENFORCED"
  | "GOVERNANCE_VALIDATION_BYPASSED"
  | "POLICY_BYPASS_DETECTED"
  | "HIDDEN_POLICY_STATE_DETECTED"
  | "CERTIFICATION_REPLAY_REPRODUCED"
  | "CERTIFICATION_REPLAY_MISMATCH"
  | "CERTIFICATION_REPLAY_INCOMPLETE_EVIDENCE"
  | "LEDGER_APPEND_ONLY"
  | "LEDGER_IMMUTABLE"
  | "FAIL_CLOSED_ENFORCED"
  | "FAIL_OPEN_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "APPROVAL_ABSENT"
  | "APPROVAL_DETECTED"
  | "RANKING_ABSENT"
  | "RANKING_DETECTED"
  | "PRIORITIZATION_ABSENT"
  | "PRIORITIZATION_DETECTED"
  | "SCORING_ABSENT"
  | "SCORING_DETECTED"
  | "RESOURCE_ALLOCATION_ABSENT"
  | "RESOURCE_ALLOCATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "POLICY_CERTIFICATION_IS_NOT_CONTROL"
  | "CERTIFICATION_PASS"
  | "CERTIFICATION_CONDITIONAL_PASS"
  | "CERTIFICATION_FAIL";

export type TruthPolicyCertificationValidation = Readonly<{
  valid: boolean;
  reasonCodes: readonly TruthPolicyCertificationReasonCode[];
  contractValid: boolean;
  policyContractCertified: boolean;
  filesystemGovernanceCertified: boolean;
  networkGovernanceCertified: boolean;
  capabilityGovernanceCertified: boolean;
  runtimePolicyEngineCertified: boolean;
  enforcementLayerCertified: boolean;
  policyLedgerCertified: boolean;
  policyReplayCertified: boolean;
  policyObservabilityCertified: boolean;
  governanceComplianceVerified: boolean;
  constitutionalComplianceVerified: boolean;
  tenantIsolationCertified: boolean;
  certificationReplayReproduced: boolean;
  ledgerImmutable: boolean;
  failClosed: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  approvalAbsent: boolean;
  rankingAbsent: boolean;
  prioritizationAbsent: boolean;
  scoringAbsent: boolean;
  resourceAllocationAbsent: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
}>;

export type TruthPolicyCertificationInput = Readonly<{
  request: TruthPolicyCertificationRequest;
  policyLayerVersion: string;
  certificationScope: readonly TruthPolicyCertificationScope[];
  certificationAuthority: TruthPolicyCertificationAuthority;
  evidenceReferences: readonly string[];
  replayReferences: readonly string[];
  policyContract: SealedTruthPolicyContract;
  filesystemGovernance: SealedTruthFilesystemGovernance;
  networkGovernance: SealedTruthNetworkGovernance;
  capabilityGovernance: SealedTruthCapabilityGovernance;
  runtimePolicyEngine: SealedTruthRuntimePolicyEngine;
  enforcementLayer: SealedTruthEnforcementLayer;
  policyLedger: SealedTruthPolicyLedger;
  policyReplay: SealedTruthPolicyReplayFramework;
  policyObservability: SealedTruthPolicyObservabilitySurface;
  unauthorizedFilesystemAccessDetected?: boolean;
  unauthorizedNetworkAccessDetected?: boolean;
  prohibitedToolUseDetected?: boolean;
  policyBypassDetected?: boolean;
  authorityBypassDetected?: boolean;
  governanceBypassDetected?: boolean;
  enforcementBypassDetected?: boolean;
  containmentFailureDetected?: boolean;
  ledgerTamperingDetected?: boolean;
  replayMismatchDetected?: boolean;
  hiddenPolicyStateDetected?: boolean;
  hiddenViolationDetected?: boolean;
  hiddenAuthorityDetected?: boolean;
  constitutionalViolationDetected?: boolean;
  governanceViolationDetected?: boolean;
  crossTenantAccessDetected?: boolean;
  crossTenantReplayDetected?: boolean;
  crossTenantObservabilityDetected?: boolean;
  observabilityGapDetected?: boolean;
  reportingLimitationDetected?: boolean;
  remediationDocumented?: boolean;
  executionRequested?: boolean;
  approvalRequested?: boolean;
  rankingRequested?: boolean;
  prioritizationRequested?: boolean;
  scoringRequested?: boolean;
  resourceAllocationRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type SealedTruthPolicyCertificationGate = Readonly<{
  request: TruthPolicyCertificationRequest;
  contract: TruthPolicyCertificationContract;
  domainResults: readonly TruthPolicyCertificationDomainResult[];
  ledgerEntry: TruthPolicyCertificationLedgerEntry;
  replay: TruthPolicyCertificationReplay;
  validation: TruthPolicyCertificationValidation;
  advancementState: TruthPolicyLayerAdvancementState;
  certification: TruthCertificationState;
  sealed: true;
  readOnly: true;
  executionAuthorized: false;
  approvalAllowed: false;
  rankingAllowed: false;
  prioritizationAllowed: false;
  scoringAllowed: false;
  resourceAllocationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export type TruthLineageObjectType =
  | "POLICY"
  | "RULE"
  | "AUTHORITY"
  | "EVALUATION"
  | "ENFORCEMENT"
  | "VIOLATION"
  | "ESCALATION"
  | "CONTAINMENT"
  | "CERTIFICATION"
  | "REPLAY";
export type TruthLineageDependencyType =
  | "DEPENDS_ON"
  | "DERIVED_FROM"
  | "INHERITS_FROM"
  | "INFLUENCED_BY"
  | "CERTIFIED_BY"
  | "AUTHORIZED_BY";
export type TruthLineageValidationState = "VALID" | "INVALID";

export interface TruthLineageRequest {
  tenant_id: string;
  now: string;
}

export interface TruthLineageParentRelationship {
  parent_lineage_id: string;
  parent_object_id: string;
  relationship_reason: string;
}

export interface TruthLineageChildRelationship {
  child_lineage_id: string;
  child_object_id: string;
  child_relationship: string;
}

export interface TruthLineageDependency {
  dependency_id: string;
  dependency_type: TruthLineageDependencyType;
  dependency_lineage_id: string;
  dependency_object_id: string;
  dependency_reason: string;
}

export interface TruthLineageGovernanceInfluence {
  influence_id: string;
  influence_type: string;
  influence_source_id: string;
  influence_rationale: string;
}

export interface TruthLineageOwnership {
  owner_id: string;
  owner_type: TruthPolicyAuthorityType;
  ownership_timestamp: string;
  ownership_scope: string;
}

export interface TruthLineageContract {
  lineage_id: string;
  tenant_id: string;
  mission_id: string;
  object_id: string;
  object_type: TruthLineageObjectType;
  lineage_root_id: string;
  parent_lineage_id: string | null;
  lineage_version: string;
  lineage_timestamp: string;
  lineage_hash: string;
}

export type TruthLineageLedgerEntry = Readonly<{
  lineage_id: string;
  tenant_id: string;
  mission_id: string;
  object_id: string;
  object_type: TruthLineageObjectType;
  validation_status: TruthLineageValidationState;
  replay_status: TruthReplayResult;
  certification_state: TruthCertificationState;
  failure_reason: string | null;
  entry_hash: string;
}>;

export type TruthLineageReasonCode =
  | "LINEAGE_ID_PRESENT"
  | "LINEAGE_ID_MISSING"
  | "OBJECT_ID_PRESENT"
  | "OBJECT_ID_MISSING"
  | "OBJECT_TYPE_PRESENT"
  | "OBJECT_TYPE_MISSING"
  | "LINEAGE_ID_UNIQUE"
  | "LINEAGE_ID_DUPLICATE"
  | "LINEAGE_ID_IMMUTABLE"
  | "LINEAGE_ID_MUTATED"
  | "LINEAGE_HASH_VALID"
  | "LINEAGE_HASH_MISMATCH"
  | "OBJECT_TYPE_VALID"
  | "OBJECT_TYPE_UNKNOWN"
  | "PARENT_RELATIONSHIP_VALID"
  | "PARENT_RELATIONSHIP_BROKEN"
  | "CHILD_RELATIONSHIP_VALID"
  | "ORPHANED_CHILD_DETECTED"
  | "DEPENDENCY_VALID"
  | "DEPENDENCY_UNKNOWN"
  | "DEPENDENCY_CYCLE_DETECTED"
  | "GOVERNANCE_INFLUENCE_PRESENT"
  | "GOVERNANCE_INFLUENCE_MISSING"
  | "OWNERSHIP_TRACEABLE"
  | "OWNER_MISSING"
  | "OWNERSHIP_MISMATCH"
  | "LINEAGE_INTEGRITY_VALID"
  | "LINEAGE_INTEGRITY_INVALID"
  | "LINEAGE_REPLAY_REPRODUCED"
  | "LINEAGE_REPLAY_MISMATCH"
  | "LINEAGE_REPLAY_INCOMPLETE_EVIDENCE"
  | "LINEAGE_REPLAY_UNREPLAYABLE"
  | "TENANT_LINEAGE_ISOLATION_VALID"
  | "TENANT_LINEAGE_ISOLATION_FAILED"
  | "LEDGER_APPEND_ONLY"
  | "LEDGER_IMMUTABLE"
  | "VISIBILITY_AVAILABLE"
  | "VISIBILITY_BLOCKED"
  | "OBSERVABILITY_OPERATIONAL"
  | "OBSERVABILITY_GAP_DETECTED"
  | "FAIL_CLOSED_ENFORCED"
  | "FAIL_OPEN_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "APPROVAL_ABSENT"
  | "APPROVAL_DETECTED"
  | "RANKING_ABSENT"
  | "RANKING_DETECTED"
  | "PRIORITIZATION_ABSENT"
  | "PRIORITIZATION_DETECTED"
  | "SCORING_ABSENT"
  | "SCORING_DETECTED"
  | "RESOURCE_ALLOCATION_ABSENT"
  | "RESOURCE_ALLOCATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "LINEAGE_CONTRACT_IS_NOT_CONTROL"
  | "CERTIFICATION_PASS"
  | "CERTIFICATION_CONDITIONAL_PASS"
  | "CERTIFICATION_FAIL";

export type TruthLineageValidation = Readonly<{
  valid: boolean;
  validationState: TruthLineageValidationState;
  reasonCodes: readonly TruthLineageReasonCode[];
  contractValid: boolean;
  identityValid: boolean;
  objectTypeValid: boolean;
  parentValid: boolean;
  childValid: boolean;
  dependencyValid: boolean;
  governanceInfluenceValid: boolean;
  ownershipValid: boolean;
  integrityValid: boolean;
  replayValid: boolean;
  tenantIsolationValid: boolean;
  failClosed: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  approvalAbsent: boolean;
  rankingAbsent: boolean;
  prioritizationAbsent: boolean;
  scoringAbsent: boolean;
  resourceAllocationAbsent: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
}>;

export type TruthLineageReplay = Readonly<{
  replayResult: TruthReplayResult;
  reconstructedContract: TruthLineageContract;
  reconstructedParent: TruthLineageParentRelationship | null;
  reconstructedChildren: readonly TruthLineageChildRelationship[];
  reconstructedDependencies: readonly TruthLineageDependency[];
  reconstructedOwnership: TruthLineageOwnership;
  reconstructedGovernanceInfluence: readonly TruthLineageGovernanceInfluence[];
}>;

export type TruthLineageVisibility = Readonly<{
  lineage_id: string;
  lineage_root_id: string;
  object_id: string;
  object_type: TruthLineageObjectType;
  parent_lineage_id: string | null;
  dependency_count: number;
  owner: string;
  validation_status: TruthLineageValidationState;
  replay_status: TruthReplayResult;
  readOnly: true;
  tenantScoped: boolean;
  auditable: true;
  replayLinked: true;
}>;

export type TruthLineageObservability = Readonly<{
  lineages_total: number;
  parent_relationships: number;
  child_relationships: number;
  dependencies: number;
  governance_influences: number;
  ownership_records: number;
  validation_failures: number;
  replay_failures: number;
  tenant_isolation_failures: number;
}>;

export type TruthLineageInput = Readonly<{
  request: TruthLineageRequest;
  missionId: string;
  objectId: string;
  objectType: TruthLineageObjectType;
  lineageVersion: string;
  parent?: TruthLineageParentRelationship | null;
  children?: readonly TruthLineageChildRelationship[];
  dependencies?: readonly TruthLineageDependency[];
  governanceInfluences: readonly TruthLineageGovernanceInfluence[];
  ownership: TruthLineageOwnership;
  lineageTimestamp?: string;
  lineageId?: string;
  lineageRootId?: string;
  priorLineageIds?: readonly string[];
  accessTenantId?: string;
  missingLineageIdDetected?: boolean;
  missingObjectIdDetected?: boolean;
  missingObjectTypeDetected?: boolean;
  duplicateLineageIdDetected?: boolean;
  identityMutated?: boolean;
  hashMismatchDetected?: boolean;
  unknownObjectTypeDetected?: boolean;
  missingParentDetected?: boolean;
  invalidParentDetected?: boolean;
  orphanedChildDetected?: boolean;
  unknownDependencyDetected?: boolean;
  dependencyCycleDetected?: boolean;
  missingGovernanceInfluenceDetected?: boolean;
  missingOwnerDetected?: boolean;
  ownershipMismatchDetected?: boolean;
  brokenLineageDetected?: boolean;
  orphanedObjectDetected?: boolean;
  replayMismatchDetected?: boolean;
  crossTenantLineageAccessDetected?: boolean;
  crossTenantDependencyDetected?: boolean;
  crossTenantOwnershipDetected?: boolean;
  crossTenantReplayDetected?: boolean;
  observabilityGapDetected?: boolean;
  reportingLimitationDetected?: boolean;
  remediationDocumented?: boolean;
  executionRequested?: boolean;
  approvalRequested?: boolean;
  rankingRequested?: boolean;
  prioritizationRequested?: boolean;
  scoringRequested?: boolean;
  resourceAllocationRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type SealedTruthLineageContract = Readonly<{
  request: TruthLineageRequest;
  contract: TruthLineageContract;
  ledgerEntry: TruthLineageLedgerEntry;
  validation: TruthLineageValidation;
  replay: TruthLineageReplay;
  visibility: TruthLineageVisibility;
  observability: TruthLineageObservability;
  certification: TruthCertificationState;
  sealed: true;
  readOnly: true;
  executionAuthorized: false;
  approvalAllowed: false;
  rankingAllowed: false;
  prioritizationAllowed: false;
  scoringAllowed: false;
  resourceAllocationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export type TruthParentChildObjectType =
  | "POLICY"
  | "RULE"
  | "AUTHORITY"
  | "EVALUATION"
  | "ENFORCEMENT"
  | "CONTAINMENT"
  | "CERTIFICATION"
  | "REPLAY";
export type TruthParentChildRelationshipType =
  | "PARENT_OF"
  | "CHILD_OF"
  | "OWNS"
  | "GENERATES"
  | "AUTHORIZES"
  | "CERTIFIES"
  | "CONTAINS"
  | "ESCALATES"
  | "INHERITS";
export type TruthParentChildValidationState = "VALID" | "INVALID";

export interface TruthParentChildRelationshipRequest {
  tenant_id: string;
  now: string;
}

export interface TruthParentChildTraversalNode {
  object_id: string;
  object_type: TruthParentChildObjectType;
  relationship_id: string;
}

export interface TruthParentChildRelationshipContract {
  relationship_id: string;
  tenant_id: string;
  mission_id: string;
  parent_object_id: string;
  parent_object_type: TruthParentChildObjectType;
  child_object_id: string;
  child_object_type: TruthParentChildObjectType;
  relationship_type: TruthParentChildRelationshipType;
  relationship_timestamp: string;
  relationship_hash: string;
  replay_references: readonly string[];
}

export type TruthParentChildRelationshipLedgerEntry = Readonly<{
  relationship_id: string;
  tenant_id: string;
  mission_id: string;
  parent_object_id: string;
  child_object_id: string;
  relationship_type: TruthParentChildRelationshipType;
  hierarchy_depth: number;
  validation_status: TruthParentChildValidationState;
  replay_status: TruthReplayResult;
  certification_state: TruthCertificationState;
  failure_reason: string | null;
  entry_hash: string;
}>;

export type TruthParentChildRelationshipReasonCode =
  | "PARENT_OBJECT_ID_PRESENT"
  | "PARENT_OBJECT_ID_MISSING"
  | "CHILD_OBJECT_ID_PRESENT"
  | "CHILD_OBJECT_ID_MISSING"
  | "RELATIONSHIP_TYPE_PRESENT"
  | "RELATIONSHIP_TYPE_MISSING"
  | "RELATIONSHIP_CONTRACT_VALID"
  | "RELATIONSHIP_CONTRACT_INVALID"
  | "PARENT_REGISTERED"
  | "PARENT_MISSING"
  | "PARENT_INVALID"
  | "CHILD_REGISTERED"
  | "CHILD_MISSING"
  | "CHILD_INVALID"
  | "RELATIONSHIP_CLASSIFIED"
  | "RELATIONSHIP_TYPE_UNKNOWN"
  | "RELATIONSHIP_TYPE_MULTIPLE"
  | "HIERARCHY_BUILT"
  | "HIERARCHY_CORRUPTION"
  | "ANCESTRY_RESOLVED"
  | "ANCESTRY_FAILURE"
  | "DESCENDANTS_RESOLVED"
  | "DESCENDANT_FAILURE"
  | "RELATIONSHIP_INTEGRITY_VALID"
  | "RELATIONSHIP_INTEGRITY_INVALID"
  | "ORPHANED_CHILD_DETECTED"
  | "RELATIONSHIP_REPLAY_REPRODUCED"
  | "RELATIONSHIP_REPLAY_MISMATCH"
  | "RELATIONSHIP_REPLAY_INCOMPLETE_EVIDENCE"
  | "RELATIONSHIP_REPLAY_UNREPLAYABLE"
  | "TENANT_RELATIONSHIP_ISOLATION_VALID"
  | "TENANT_RELATIONSHIP_ISOLATION_FAILED"
  | "LEDGER_APPEND_ONLY"
  | "LEDGER_IMMUTABLE"
  | "VISIBILITY_AVAILABLE"
  | "VISIBILITY_BLOCKED"
  | "OBSERVABILITY_OPERATIONAL"
  | "OBSERVABILITY_GAP_DETECTED"
  | "FAIL_CLOSED_ENFORCED"
  | "FAIL_OPEN_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "APPROVAL_ABSENT"
  | "APPROVAL_DETECTED"
  | "RANKING_ABSENT"
  | "RANKING_DETECTED"
  | "PRIORITIZATION_ABSENT"
  | "PRIORITIZATION_DETECTED"
  | "SCORING_ABSENT"
  | "SCORING_DETECTED"
  | "RESOURCE_ALLOCATION_ABSENT"
  | "RESOURCE_ALLOCATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "PARENT_CHILD_RELATIONSHIP_IS_NOT_CONTROL"
  | "CERTIFICATION_PASS"
  | "CERTIFICATION_CONDITIONAL_PASS"
  | "CERTIFICATION_FAIL";

export type TruthParentChildRelationshipValidation = Readonly<{
  valid: boolean;
  validationState: TruthParentChildValidationState;
  reasonCodes: readonly TruthParentChildRelationshipReasonCode[];
  contractValid: boolean;
  parentRegistered: boolean;
  childRegistered: boolean;
  relationshipClassified: boolean;
  hierarchyBuilt: boolean;
  ancestryResolved: boolean;
  descendantsResolved: boolean;
  integrityValid: boolean;
  replayValid: boolean;
  tenantIsolationValid: boolean;
  failClosed: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  approvalAbsent: boolean;
  rankingAbsent: boolean;
  prioritizationAbsent: boolean;
  scoringAbsent: boolean;
  resourceAllocationAbsent: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
}>;

export type TruthParentChildRelationshipReplay = Readonly<{
  replayResult: TruthReplayResult;
  reconstructedContract: TruthParentChildRelationshipContract;
  reconstructedAncestry: readonly TruthParentChildTraversalNode[];
  reconstructedDescendants: readonly TruthParentChildTraversalNode[];
}>;

export type TruthParentChildRelationshipVisibility = Readonly<{
  relationship_id: string;
  parent_object_id: string;
  child_object_id: string;
  relationship_type: TruthParentChildRelationshipType;
  hierarchy_depth: number;
  validation_status: TruthParentChildValidationState;
  replay_status: TruthReplayResult;
  timestamp: string;
  readOnly: true;
  tenantScoped: boolean;
  auditable: true;
  replayLinked: true;
}>;

export type TruthParentChildRelationshipObservability = Readonly<{
  relationships_total: number;
  parent_assignments: number;
  child_assignments: number;
  hierarchy_depth: number;
  relationship_failures: number;
  orphaned_objects: number;
  tenant_isolation_failures: number;
  replay_failures: number;
}>;

export type TruthParentChildRelationshipInput = Readonly<{
  request: TruthParentChildRelationshipRequest;
  missionId: string;
  parentObjectId: string;
  parentObjectType: TruthParentChildObjectType;
  childObjectId: string;
  childObjectType: TruthParentChildObjectType;
  relationshipType: TruthParentChildRelationshipType;
  replayReferences: readonly string[];
  ancestryPath: readonly TruthParentChildTraversalNode[];
  descendantPath: readonly TruthParentChildTraversalNode[];
  relationshipTimestamp?: string;
  hierarchyDepth?: number;
  accessTenantId?: string;
  missingParentDetected?: boolean;
  invalidParentDetected?: boolean;
  missingChildDetected?: boolean;
  invalidChildDetected?: boolean;
  orphanedChildDetected?: boolean;
  unknownRelationshipTypeDetected?: boolean;
  multipleRelationshipTypesDetected?: boolean;
  hierarchyCorruptionDetected?: boolean;
  ancestryFailureDetected?: boolean;
  descendantFailureDetected?: boolean;
  brokenRelationshipDetected?: boolean;
  replayMismatchDetected?: boolean;
  crossTenantRelationshipAccessDetected?: boolean;
  crossTenantAncestryDetected?: boolean;
  crossTenantDescendantDetected?: boolean;
  crossTenantReplayDetected?: boolean;
  observabilityGapDetected?: boolean;
  reportingLimitationDetected?: boolean;
  remediationDocumented?: boolean;
  executionRequested?: boolean;
  approvalRequested?: boolean;
  rankingRequested?: boolean;
  prioritizationRequested?: boolean;
  scoringRequested?: boolean;
  resourceAllocationRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type SealedTruthParentChildRelationshipEngine = Readonly<{
  request: TruthParentChildRelationshipRequest;
  contract: TruthParentChildRelationshipContract;
  ledgerEntry: TruthParentChildRelationshipLedgerEntry;
  validation: TruthParentChildRelationshipValidation;
  replay: TruthParentChildRelationshipReplay;
  visibility: TruthParentChildRelationshipVisibility;
  observability: TruthParentChildRelationshipObservability;
  certification: TruthCertificationState;
  sealed: true;
  readOnly: true;
  executionAuthorized: false;
  approvalAllowed: false;
  rankingAllowed: false;
  prioritizationAllowed: false;
  scoringAllowed: false;
  resourceAllocationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export type TruthCausalityObjectType =
  | "POLICY"
  | "RULE"
  | "AUTHORITY"
  | "EVALUATION"
  | "ENFORCEMENT"
  | "VIOLATION"
  | "ESCALATION"
  | "CONTAINMENT"
  | "CERTIFICATION"
  | "RUNTIME_ACTION";
export type TruthCausalityType =
  | "CAUSES"
  | "INFLUENCES"
  | "DEPENDS_ON"
  | "TRIGGERS"
  | "BLOCKS"
  | "ENABLES"
  | "ESCALATES"
  | "CONTAINS"
  | "CERTIFIES"
  | "AUTHORIZES";
export type TruthCausalityDependencyType =
  | "DIRECT_DEPENDENCY"
  | "INDIRECT_DEPENDENCY"
  | "RUNTIME_DEPENDENCY"
  | "POLICY_DEPENDENCY"
  | "AUTHORITY_DEPENDENCY"
  | "CERTIFICATION_DEPENDENCY";
export type TruthCausalityValidationState = "VALID" | "INVALID";

export interface TruthCausalityGraphRequest {
  tenant_id: string;
  now: string;
}

export interface TruthCausalityGraphNode {
  object_id: string;
  object_type: TruthCausalityObjectType;
  causality_id: string;
}

export interface TruthCausalityInfluenceMapping {
  influence_id: string;
  influence_type: string;
  influence_source_id: string;
  influence_target_id: string;
  influence_rationale: string;
}

export interface TruthCausalityDependencyMapping {
  dependency_id: string;
  dependency_type: TruthCausalityDependencyType;
  dependency_source_id: string;
  dependency_target_id: string;
  dependency_rationale: string;
}

export interface TruthCausalityRootCause {
  root_cause_id: string;
  root_object_id: string;
  root_object_type: TruthCausalityObjectType;
  root_cause_rationale: string;
}

export interface TruthCausalityGraphContract {
  causality_id: string;
  tenant_id: string;
  mission_id: string;
  source_object_id: string;
  source_object_type: TruthCausalityObjectType;
  target_object_id: string;
  target_object_type: TruthCausalityObjectType;
  causality_type: TruthCausalityType;
  causality_timestamp: string;
  causality_hash: string;
  replay_references: readonly string[];
}

export type TruthCausalityGraphLedgerEntry = Readonly<{
  causality_id: string;
  tenant_id: string;
  mission_id: string;
  source_object_id: string;
  target_object_id: string;
  causality_type: TruthCausalityType;
  root_cause_status: TruthCausalityValidationState;
  validation_status: TruthCausalityValidationState;
  replay_status: TruthReplayResult;
  certification_state: TruthCertificationState;
  failure_reason: string | null;
  entry_hash: string;
}>;

export type TruthCausalityGraphReasonCode =
  | "SOURCE_OBJECT_ID_PRESENT"
  | "SOURCE_OBJECT_ID_MISSING"
  | "TARGET_OBJECT_ID_PRESENT"
  | "TARGET_OBJECT_ID_MISSING"
  | "CAUSALITY_TYPE_PRESENT"
  | "CAUSALITY_TYPE_MISSING"
  | "CAUSALITY_CONTRACT_VALID"
  | "CAUSALITY_CONTRACT_INVALID"
  | "SOURCE_REGISTERED"
  | "SOURCE_MISSING"
  | "SOURCE_INVALID"
  | "TARGET_REGISTERED"
  | "TARGET_MISSING"
  | "TARGET_INVALID"
  | "CAUSALITY_CLASSIFIED"
  | "CAUSALITY_TYPE_UNKNOWN"
  | "CAUSALITY_TYPE_MULTIPLE"
  | "INFLUENCE_MAPPED"
  | "INFLUENCE_MISSING"
  | "DEPENDENCY_MAPPED"
  | "DEPENDENCY_UNKNOWN"
  | "DEPENDENCY_CYCLE_DETECTED"
  | "ROOT_CAUSE_IDENTIFIED"
  | "ROOT_CAUSE_UNRESOLVED"
  | "CAUSAL_CHAIN_RESOLVED"
  | "CAUSAL_CHAIN_FAILURE"
  | "CAUSALITY_INTEGRITY_VALID"
  | "CAUSALITY_INTEGRITY_INVALID"
  | "ORPHANED_TARGET_DETECTED"
  | "CAUSALITY_REPLAY_REPRODUCED"
  | "CAUSALITY_REPLAY_MISMATCH"
  | "CAUSALITY_REPLAY_INCOMPLETE_EVIDENCE"
  | "CAUSALITY_REPLAY_UNREPLAYABLE"
  | "TENANT_CAUSALITY_ISOLATION_VALID"
  | "TENANT_CAUSALITY_ISOLATION_FAILED"
  | "LEDGER_APPEND_ONLY"
  | "LEDGER_IMMUTABLE"
  | "VISIBILITY_AVAILABLE"
  | "VISIBILITY_BLOCKED"
  | "OBSERVABILITY_OPERATIONAL"
  | "OBSERVABILITY_GAP_DETECTED"
  | "FAIL_CLOSED_ENFORCED"
  | "FAIL_OPEN_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "APPROVAL_ABSENT"
  | "APPROVAL_DETECTED"
  | "RANKING_ABSENT"
  | "RANKING_DETECTED"
  | "PRIORITIZATION_ABSENT"
  | "PRIORITIZATION_DETECTED"
  | "SCORING_ABSENT"
  | "SCORING_DETECTED"
  | "RESOURCE_ALLOCATION_ABSENT"
  | "RESOURCE_ALLOCATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "CAUSALITY_GRAPH_IS_NOT_CONTROL"
  | "CERTIFICATION_PASS"
  | "CERTIFICATION_CONDITIONAL_PASS"
  | "CERTIFICATION_FAIL";

export type TruthCausalityGraphValidation = Readonly<{
  valid: boolean;
  validationState: TruthCausalityValidationState;
  reasonCodes: readonly TruthCausalityGraphReasonCode[];
  contractValid: boolean;
  sourceRegistered: boolean;
  targetRegistered: boolean;
  causalityClassified: boolean;
  influenceMapped: boolean;
  dependencyMapped: boolean;
  rootCauseIdentified: boolean;
  causalChainResolved: boolean;
  integrityValid: boolean;
  replayValid: boolean;
  tenantIsolationValid: boolean;
  failClosed: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  approvalAbsent: boolean;
  rankingAbsent: boolean;
  prioritizationAbsent: boolean;
  scoringAbsent: boolean;
  resourceAllocationAbsent: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
}>;

export type TruthCausalityGraphReplay = Readonly<{
  replayResult: TruthReplayResult;
  reconstructedContract: TruthCausalityGraphContract;
  reconstructedInfluences: readonly TruthCausalityInfluenceMapping[];
  reconstructedDependencies: readonly TruthCausalityDependencyMapping[];
  reconstructedRootCause: TruthCausalityRootCause;
  reconstructedCausalChain: readonly TruthCausalityGraphNode[];
}>;

export type TruthCausalityGraphVisibility = Readonly<{
  causality_id: string;
  source_object_id: string;
  target_object_id: string;
  causality_type: TruthCausalityType;
  root_cause_status: TruthCausalityValidationState;
  dependency_count: number;
  influence_count: number;
  validation_status: TruthCausalityValidationState;
  replay_status: TruthReplayResult;
  readOnly: true;
  tenantScoped: boolean;
  auditable: true;
  replayLinked: true;
}>;

export type TruthCausalityGraphObservability = Readonly<{
  causal_relationships_total: number;
  influence_relationships_total: number;
  dependency_relationships_total: number;
  root_causes_identified: number;
  causal_chain_depth: number;
  causality_failures: number;
  tenant_isolation_failures: number;
  replay_failures: number;
}>;

export type TruthCausalityGraphInput = Readonly<{
  request: TruthCausalityGraphRequest;
  missionId: string;
  sourceObjectId: string;
  sourceObjectType: TruthCausalityObjectType;
  targetObjectId: string;
  targetObjectType: TruthCausalityObjectType;
  causalityType: TruthCausalityType;
  replayReferences: readonly string[];
  influences: readonly TruthCausalityInfluenceMapping[];
  dependencies: readonly TruthCausalityDependencyMapping[];
  rootCause: TruthCausalityRootCause;
  causalChain: readonly TruthCausalityGraphNode[];
  causalityTimestamp?: string;
  accessTenantId?: string;
  missingSourceDetected?: boolean;
  invalidSourceDetected?: boolean;
  missingTargetDetected?: boolean;
  invalidTargetDetected?: boolean;
  orphanedTargetDetected?: boolean;
  unknownCausalityTypeDetected?: boolean;
  multipleCausalityTypesDetected?: boolean;
  missingInfluenceMappingDetected?: boolean;
  unknownDependencyDetected?: boolean;
  dependencyCycleDetected?: boolean;
  rootCauseUnresolvedDetected?: boolean;
  causalChainFailureDetected?: boolean;
  brokenCausalityDetected?: boolean;
  replayMismatchDetected?: boolean;
  crossTenantCausalityAccessDetected?: boolean;
  crossTenantDependencyDetected?: boolean;
  crossTenantInfluenceDetected?: boolean;
  crossTenantReplayDetected?: boolean;
  observabilityGapDetected?: boolean;
  reportingLimitationDetected?: boolean;
  remediationDocumented?: boolean;
  executionRequested?: boolean;
  approvalRequested?: boolean;
  rankingRequested?: boolean;
  prioritizationRequested?: boolean;
  scoringRequested?: boolean;
  resourceAllocationRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type SealedTruthCausalityGraph = Readonly<{
  request: TruthCausalityGraphRequest;
  contract: TruthCausalityGraphContract;
  ledgerEntry: TruthCausalityGraphLedgerEntry;
  validation: TruthCausalityGraphValidation;
  replay: TruthCausalityGraphReplay;
  visibility: TruthCausalityGraphVisibility;
  observability: TruthCausalityGraphObservability;
  certification: TruthCertificationState;
  sealed: true;
  readOnly: true;
  executionAuthorized: false;
  approvalAllowed: false;
  rankingAllowed: false;
  prioritizationAllowed: false;
  scoringAllowed: false;
  resourceAllocationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export type TruthEvolutionType = "MODIFICATION" | "SUPERSESSION" | "BRANCH" | "VERSION_CREATED";
export type TruthEvolutionBranchType =
  | "EVIDENCE_BRANCH"
  | "GOVERNANCE_BRANCH"
  | "CONFIDENCE_BRANCH"
  | "CLASSIFICATION_BRANCH"
  | "INVESTIGATION_BRANCH";
export type TruthEvolutionVersionState = "ACTIVE" | "SUPERSEDED" | "RETIRED" | "BRANCHED";
export type TruthEvolutionValidationState = "VALID" | "INVALID";

export interface TruthEvolutionRequest {
  tenant_id: string;
  now: string;
}

export interface TruthEvolutionVersion {
  truth_version: string;
  version_number: number;
  version_state: TruthEvolutionVersionState;
  version_timestamp: string;
  superseded_by?: string | null;
  supersedes?: string | null;
}

export interface TruthEvolutionModification {
  before_state: string;
  after_state: string;
  change_summary: string;
  change_rationale: string;
}

export interface TruthEvolutionSupersession {
  replacement_truth_record_id: string;
  supersession_rationale: string;
}

export interface TruthEvolutionBranch {
  branch_id: string;
  branch_type: TruthEvolutionBranchType;
  branch_origin_truth_id: string;
  branch_rationale: string;
}

export interface TruthEvolutionLineage {
  origin_truth_record_id: string;
  prior_evolution_id: string | null;
  modification_chain: readonly string[];
  supersession_chain: readonly string[];
  branch_ancestry: readonly string[];
  branch_descendants: readonly string[];
}

export interface TruthEvolutionContract {
  evolution_id: string;
  truth_record_id: string;
  tenant_id: string;
  mission_id: string;
  evolution_timestamp: string;
  evolution_type: TruthEvolutionType;
  previous_version: string;
  current_version: string;
  evolution_reason: string;
  evidence_references: readonly string[];
  replay_references: readonly string[];
}

export type TruthEvolutionLedgerEntry = Readonly<{
  evolution_id: string;
  truth_record_id: string;
  tenant_id: string;
  mission_id: string;
  evolution_type: TruthEvolutionType;
  truth_version: string;
  validation_status: TruthEvolutionValidationState;
  replay_status: TruthReplayResult;
  certification_state: TruthCertificationState;
  failure_reason: string | null;
  entry_hash: string;
}>;

export type TruthEvolutionReasonCode =
  | "TRUTH_RECORD_ID_PRESENT"
  | "TRUTH_RECORD_ID_MISSING"
  | "EVOLUTION_TYPE_PRESENT"
  | "EVOLUTION_TYPE_MISSING"
  | "VERSION_REFERENCE_PRESENT"
  | "VERSION_REFERENCE_MISSING"
  | "EVOLUTION_CONTRACT_VALID"
  | "EVOLUTION_CONTRACT_INVALID"
  | "MODIFICATION_RECORDED"
  | "MODIFICATION_HISTORY_MISSING"
  | "PRIOR_STATE_MISSING"
  | "SUPERSESSION_RECORDED"
  | "REPLACEMENT_TRUTH_MISSING"
  | "SUPERSESSION_RATIONALE_MISSING"
  | "BRANCH_RECORDED"
  | "ORPHANED_BRANCH_DETECTED"
  | "BRANCH_TYPE_UNKNOWN"
  | "VERSION_CREATED"
  | "VERSION_DUPLICATE"
  | "VERSION_ORDERING_CORRUPTION"
  | "RATIONALE_PRESENT"
  | "RATIONALE_MISSING"
  | "EXPLANATION_EMPTY"
  | "LINEAGE_PRESERVED"
  | "LINEAGE_BROKEN"
  | "ORPHANED_TRUTH_DETECTED"
  | "EVOLUTION_INTEGRITY_VALID"
  | "EVOLUTION_INTEGRITY_INVALID"
  | "TRUTH_EVOLUTION_REPLAY_REPRODUCED"
  | "TRUTH_EVOLUTION_REPLAY_MISMATCH"
  | "TRUTH_EVOLUTION_REPLAY_INCOMPLETE_EVIDENCE"
  | "TRUTH_EVOLUTION_REPLAY_UNREPLAYABLE"
  | "TENANT_TRUTH_ISOLATION_VALID"
  | "TENANT_TRUTH_ISOLATION_FAILED"
  | "LEDGER_APPEND_ONLY"
  | "LEDGER_IMMUTABLE"
  | "VISIBILITY_AVAILABLE"
  | "VISIBILITY_BLOCKED"
  | "OBSERVABILITY_OPERATIONAL"
  | "OBSERVABILITY_GAP_DETECTED"
  | "FAIL_CLOSED_ENFORCED"
  | "FAIL_OPEN_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "APPROVAL_ABSENT"
  | "APPROVAL_DETECTED"
  | "RANKING_ABSENT"
  | "RANKING_DETECTED"
  | "PRIORITIZATION_ABSENT"
  | "PRIORITIZATION_DETECTED"
  | "SCORING_ABSENT"
  | "SCORING_DETECTED"
  | "RESOURCE_ALLOCATION_ABSENT"
  | "RESOURCE_ALLOCATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "TRUTH_EVOLUTION_IS_NOT_CONTROL"
  | "CERTIFICATION_PASS"
  | "CERTIFICATION_CONDITIONAL_PASS"
  | "CERTIFICATION_FAIL";

export type TruthEvolutionValidation = Readonly<{
  valid: boolean;
  validationState: TruthEvolutionValidationState;
  reasonCodes: readonly TruthEvolutionReasonCode[];
  contractValid: boolean;
  modificationTracked: boolean;
  supersessionTracked: boolean;
  branchTracked: boolean;
  versionValid: boolean;
  rationaleValid: boolean;
  lineagePreserved: boolean;
  integrityValid: boolean;
  replayValid: boolean;
  tenantIsolationValid: boolean;
  failClosed: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  approvalAbsent: boolean;
  rankingAbsent: boolean;
  prioritizationAbsent: boolean;
  scoringAbsent: boolean;
  resourceAllocationAbsent: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
}>;

export type TruthEvolutionReplay = Readonly<{
  replayResult: TruthReplayResult;
  reconstructedContract: TruthEvolutionContract;
  reconstructedVersion: TruthEvolutionVersion;
  reconstructedLineage: TruthEvolutionLineage;
}>;

export type TruthEvolutionVisibility = Readonly<{
  truth_record_id: string;
  truth_version: string;
  evolution_type: TruthEvolutionType;
  branch_type: TruthEvolutionBranchType | null;
  supersession_status: TruthEvolutionValidationState;
  lineage_status: TruthEvolutionValidationState;
  validation_status: TruthEvolutionValidationState;
  replay_status: TruthReplayResult;
  timestamp: string;
  readOnly: true;
  tenantScoped: boolean;
  auditable: true;
  replayLinked: true;
}>;

export type TruthEvolutionObservability = Readonly<{
  truth_modifications_total: number;
  truth_supersessions_total: number;
  truth_branches_total: number;
  version_failures: number;
  lineage_failures: number;
  validation_failures: number;
  tenant_isolation_failures: number;
  replay_failures: number;
}>;

export type TruthEvolutionInput = Readonly<{
  request: TruthEvolutionRequest;
  truthRecordId: string;
  missionId: string;
  evolutionType: TruthEvolutionType;
  previousVersion: string;
  currentVersion: string;
  evolutionReason: string;
  evidenceReferences: readonly string[];
  replayReferences: readonly string[];
  version: TruthEvolutionVersion;
  lineage: TruthEvolutionLineage;
  modification?: TruthEvolutionModification;
  supersession?: TruthEvolutionSupersession;
  branch?: TruthEvolutionBranch;
  evolutionTimestamp?: string;
  priorVersions?: readonly string[];
  accessTenantId?: string;
  missingModificationHistoryDetected?: boolean;
  missingPriorStateDetected?: boolean;
  missingReplacementTruthDetected?: boolean;
  missingSupersessionRationaleDetected?: boolean;
  orphanedBranchDetected?: boolean;
  unknownBranchTypeDetected?: boolean;
  duplicateVersionDetected?: boolean;
  versionOrderingCorruptionDetected?: boolean;
  missingRationaleDetected?: boolean;
  emptyExplanationDetected?: boolean;
  brokenLineageDetected?: boolean;
  orphanedTruthDetected?: boolean;
  invalidEvolutionDetected?: boolean;
  replayMismatchDetected?: boolean;
  crossTenantTruthAccessDetected?: boolean;
  crossTenantBranchDetected?: boolean;
  crossTenantLineageDetected?: boolean;
  crossTenantReplayDetected?: boolean;
  observabilityGapDetected?: boolean;
  reportingLimitationDetected?: boolean;
  remediationDocumented?: boolean;
  executionRequested?: boolean;
  approvalRequested?: boolean;
  rankingRequested?: boolean;
  prioritizationRequested?: boolean;
  scoringRequested?: boolean;
  resourceAllocationRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type SealedTruthEvolutionTracker = Readonly<{
  request: TruthEvolutionRequest;
  contract: TruthEvolutionContract;
  ledgerEntry: TruthEvolutionLedgerEntry;
  validation: TruthEvolutionValidation;
  replay: TruthEvolutionReplay;
  visibility: TruthEvolutionVisibility;
  observability: TruthEvolutionObservability;
  certification: TruthCertificationState;
  sealed: true;
  readOnly: true;
  executionAuthorized: false;
  approvalAllowed: false;
  rankingAllowed: false;
  prioritizationAllowed: false;
  scoringAllowed: false;
  resourceAllocationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export type TruthLineageCertificationScope =
  | "LINEAGE_CONTRACT"
  | "PARENT_CHILD_RELATIONSHIP_ENGINE"
  | "CAUSALITY_GRAPH"
  | "TRUTH_EVOLUTION_TRACKER"
  | "REPLAY_PRESERVATION"
  | "OWNERSHIP_INTEGRITY"
  | "GOVERNANCE_TRACEABILITY"
  | "TENANT_ISOLATION"
  | "OPERATOR_VISIBILITY";
export type TruthLineageLayerAdvancementState =
  | "LINEAGE_LAYER_CERTIFIED"
  | "LINEAGE_LAYER_CONDITIONAL"
  | "LINEAGE_LAYER_FAILED";

export interface TruthLineageCertificationRequest {
  tenant_id: string;
  now: string;
}

export interface TruthLineageCertificationAuthority {
  authority_id: string;
  authority_type: TruthPolicyAuthorityType;
  authority_scope: string;
  authority_evidence: readonly string[];
}

export interface TruthLineageCertificationContract {
  certification_id: string;
  certification_timestamp: string;
  lineage_layer_version: string;
  certification_scope: readonly TruthLineageCertificationScope[];
  certification_state: TruthCertificationState;
  certification_reason: string;
  certification_authority: TruthLineageCertificationAuthority;
  evidence_references: readonly string[];
  replay_references: readonly string[];
}

export type TruthLineageCertificationDomainResult = Readonly<{
  scope: TruthLineageCertificationScope;
  certification_state: TruthCertificationState;
  certified: boolean;
  failure_reason: string | null;
}>;

export type TruthLineageCertificationLedgerEntry = Readonly<{
  certification_id: string;
  tenant_id: string;
  lineage_layer_version: string;
  certification_state: TruthCertificationState;
  advancement_state: TruthLineageLayerAdvancementState;
  evidence_references: readonly string[];
  replay_references: readonly string[];
  failure_reason: string | null;
  entry_hash: string;
}>;

export type TruthLineageCertificationReplay = Readonly<{
  replayResult: TruthReplayResult;
  reproducedContract: TruthLineageCertificationContract;
  reproducedDomains: readonly TruthLineageCertificationDomainResult[];
}>;

export type TruthLineageCertificationReasonCode =
  | "CERTIFICATION_SCOPE_PRESENT"
  | "CERTIFICATION_SCOPE_MISSING"
  | "CERTIFICATION_AUTHORITY_PRESENT"
  | "CERTIFICATION_AUTHORITY_MISSING"
  | "EVIDENCE_REFERENCES_PRESENT"
  | "EVIDENCE_REFERENCES_MISSING"
  | "REPLAY_REFERENCES_PRESENT"
  | "REPLAY_REFERENCES_MISSING"
  | "LINEAGE_CONTRACT_CERTIFIED"
  | "LINEAGE_CONTRACT_FAILED"
  | "RELATIONSHIP_ENGINE_CERTIFIED"
  | "RELATIONSHIP_ENGINE_FAILED"
  | "CAUSALITY_GRAPH_CERTIFIED"
  | "CAUSALITY_GRAPH_FAILED"
  | "TRUTH_EVOLUTION_CERTIFIED"
  | "TRUTH_EVOLUTION_FAILED"
  | "REPLAY_PRESERVATION_VERIFIED"
  | "REPLAY_PRESERVATION_FAILED"
  | "OWNERSHIP_INTEGRITY_VERIFIED"
  | "OWNERSHIP_INTEGRITY_FAILED"
  | "GOVERNANCE_TRACEABILITY_VERIFIED"
  | "GOVERNANCE_TRACEABILITY_FAILED"
  | "TENANT_ISOLATION_CERTIFIED"
  | "TENANT_ISOLATION_FAILED"
  | "OPERATOR_VISIBILITY_CERTIFIED"
  | "OPERATOR_VISIBILITY_FAILED"
  | "ORPHANED_CHILD_DETECTED"
  | "DEPENDENCY_CYCLE_DETECTED"
  | "ROOT_CAUSE_UNRESOLVED"
  | "OWNERSHIP_CORRUPTION_DETECTED"
  | "GOVERNANCE_INFLUENCE_MISSING"
  | "CROSS_TENANT_LINEAGE_ACCESS_DETECTED"
  | "REPLAY_MISMATCH_DETECTED"
  | "HIDDEN_LINEAGE_STATE_DETECTED"
  | "CERTIFICATION_REPLAY_REPRODUCED"
  | "CERTIFICATION_REPLAY_MISMATCH"
  | "CERTIFICATION_REPLAY_INCOMPLETE_EVIDENCE"
  | "LEDGER_APPEND_ONLY"
  | "LEDGER_IMMUTABLE"
  | "FAIL_CLOSED_ENFORCED"
  | "FAIL_OPEN_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "APPROVAL_ABSENT"
  | "APPROVAL_DETECTED"
  | "RANKING_ABSENT"
  | "RANKING_DETECTED"
  | "PRIORITIZATION_ABSENT"
  | "PRIORITIZATION_DETECTED"
  | "SCORING_ABSENT"
  | "SCORING_DETECTED"
  | "RESOURCE_ALLOCATION_ABSENT"
  | "RESOURCE_ALLOCATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "LINEAGE_CERTIFICATION_IS_NOT_CONTROL"
  | "CERTIFICATION_PASS"
  | "CERTIFICATION_CONDITIONAL_PASS"
  | "CERTIFICATION_FAIL";

export type TruthLineageCertificationValidation = Readonly<{
  valid: boolean;
  reasonCodes: readonly TruthLineageCertificationReasonCode[];
  contractValid: boolean;
  lineageContractCertified: boolean;
  relationshipEngineCertified: boolean;
  causalityGraphCertified: boolean;
  truthEvolutionCertified: boolean;
  replayPreservationVerified: boolean;
  ownershipIntegrityVerified: boolean;
  governanceTraceabilityVerified: boolean;
  tenantIsolationCertified: boolean;
  operatorVisibilityCertified: boolean;
  certificationReplayReproduced: boolean;
  ledgerImmutable: boolean;
  failClosed: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  approvalAbsent: boolean;
  rankingAbsent: boolean;
  prioritizationAbsent: boolean;
  scoringAbsent: boolean;
  resourceAllocationAbsent: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
}>;

export type TruthLineageCertificationInput = Readonly<{
  request: TruthLineageCertificationRequest;
  lineageLayerVersion: string;
  certificationScope: readonly TruthLineageCertificationScope[];
  certificationAuthority: TruthLineageCertificationAuthority;
  evidenceReferences: readonly string[];
  replayReferences: readonly string[];
  lineageContract: SealedTruthLineageContract;
  relationshipEngine: SealedTruthParentChildRelationshipEngine;
  causalityGraph: SealedTruthCausalityGraph;
  truthEvolution: SealedTruthEvolutionTracker;
  orphanedChildDetected?: boolean;
  dependencyCycleDetected?: boolean;
  rootCauseUnresolvedDetected?: boolean;
  ownershipCorruptionDetected?: boolean;
  ownershipMismatchDetected?: boolean;
  governanceInfluenceMissingDetected?: boolean;
  traceabilityCorruptionDetected?: boolean;
  crossTenantLineageAccessDetected?: boolean;
  crossTenantCausalityAccessDetected?: boolean;
  crossTenantTruthAccessDetected?: boolean;
  crossTenantReplayDetected?: boolean;
  replayMismatchDetected?: boolean;
  lineageMismatchDetected?: boolean;
  relationshipMismatchDetected?: boolean;
  causalityMismatchDetected?: boolean;
  evolutionMismatchDetected?: boolean;
  hiddenLineageStateDetected?: boolean;
  hiddenCausalityStateDetected?: boolean;
  hiddenOwnershipStateDetected?: boolean;
  observabilityGapDetected?: boolean;
  reportingLimitationDetected?: boolean;
  remediationDocumented?: boolean;
  executionRequested?: boolean;
  approvalRequested?: boolean;
  rankingRequested?: boolean;
  prioritizationRequested?: boolean;
  scoringRequested?: boolean;
  resourceAllocationRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type SealedTruthLineageCertificationGate = Readonly<{
  request: TruthLineageCertificationRequest;
  contract: TruthLineageCertificationContract;
  domainResults: readonly TruthLineageCertificationDomainResult[];
  ledgerEntry: TruthLineageCertificationLedgerEntry;
  replay: TruthLineageCertificationReplay;
  validation: TruthLineageCertificationValidation;
  advancementState: TruthLineageLayerAdvancementState;
  certification: TruthCertificationState;
  sealed: true;
  readOnly: true;
  executionAuthorized: false;
  approvalAllowed: false;
  rankingAllowed: false;
  prioritizationAllowed: false;
  scoringAllowed: false;
  resourceAllocationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export type TruthReplayContractType =
  | "TRUTH_RECORD_REPLAY"
  | "EVENT_REPLAY"
  | "EVIDENCE_REPLAY"
  | "RECOMMENDATION_REPLAY"
  | "GOVERNANCE_REPLAY"
  | "LINEAGE_REPLAY"
  | "MISSION_REPLAY"
  | "FULL_CONTEXT_REPLAY";

export type TruthReplayTargetType =
  | "TRUTH_RECORD"
  | "EVENT"
  | "EVIDENCE_CHAIN"
  | "RECOMMENDATION"
  | "GOVERNANCE_DECISION"
  | "LINEAGE_GRAPH"
  | "MISSION_HISTORY";

export type TruthReplayScopeType = "RECORD" | "CHAIN" | "MISSION" | "TENANT" | "POLICY" | "FORENSIC";
export type TruthReplayRequesterType = "OPERATOR" | "SYSTEM" | "AUDITOR" | "CERTIFICATION_SUITE";
export type TruthReplayOrderingStrategy = "TIMESTAMP_THEN_ID" | "LEDGER_SEQUENCE" | "CAUSAL_ORDER" | "LINEAGE_ORDER" | "GOVERNANCE_ORDER";
export type TruthReplayTieBreaker = "TRUTH_RECORD_ID" | "EVENT_ID" | "HASH";
export type TruthReplayExecutionAuthority = "NONE";
export type TruthReplayAllowedWrites = "NONE" | "REPLAY_AUDIT_ONLY";
export type TruthReplayHashAlgorithm = "SHA256";
export type TruthReplayCanonicalSerialization = "STABLE_JSON";
export type TruthReplayMismatchPolicy = "FAIL" | "FLAG" | "ESCALATE";
export type TruthReplayOutputType = "REPLAY_RESULT" | "REPLAY_MISMATCH" | "REPLAY_FAILURE" | "REPLAY_CERTIFICATION_RESULT";
export type TruthReplayAuditRecordType = "REPLAY_AUDIT";

export type TruthReplayLifecycleState =
  | "REQUESTED"
  | "VALIDATED"
  | "REJECTED"
  | "READY"
  | "RUNNING"
  | "COMPLETED"
  | "MISMATCH"
  | "FAILED"
  | "ESCALATED"
  | "CERTIFIED"
  | "ARCHIVED";

export type TruthReplayCertificationState =
  | "UNCERTIFIED"
  | "CONTRACT_VALIDATED"
  | "REPLAYABLE"
  | "REPLAY_MATCHED"
  | "REPLAY_MISMATCHED"
  | "REPLAY_FAILED"
  | "CERTIFIED";

export type TruthReplayValidationState = "VALID" | "INVALID" | "REJECTED" | "ESCALATION_REQUIRED";
export type TruthReplayValidationSeverity = "ERROR" | "WARNING" | "ESCALATION";

export type TruthReplayContractEventName =
  | "REPLAY_CONTRACT_CREATED"
  | "REPLAY_CONTRACT_VALIDATED"
  | "REPLAY_CONTRACT_REJECTED"
  | "REPLAY_SCOPE_VERIFIED"
  | "REPLAY_SOURCE_BOUND"
  | "REPLAY_GOVERNANCE_BOUND"
  | "REPLAY_AUTHORITY_VERIFIED"
  | "REPLAY_DETERMINISM_VERIFIED"
  | "REPLAY_READY"
  | "REPLAY_FAILED_CONTRACT_VALIDATION";

export type TruthReplayContractErrorCode =
  | "REPLAY_CONTRACT_MISSING"
  | "REPLAY_ID_MISSING"
  | "TENANT_ID_MISSING"
  | "MISSION_ID_MISSING"
  | "REPLAY_TYPE_INVALID"
  | "REPLAY_TARGET_MISSING"
  | "REPLAY_TARGET_INVALID"
  | "REPLAY_TYPE_TARGET_INCOMPATIBLE"
  | "REPLAY_SCOPE_MISSING"
  | "TENANT_SCOPE_VIOLATION"
  | "MISSION_SCOPE_VIOLATION"
  | "REQUESTER_MISSING"
  | "REQUESTER_INVALID"
  | "SOURCE_TRUTH_RECORDS_MISSING"
  | "EVIDENCE_REQUIRED_MISSING"
  | "LINEAGE_REQUIRED_MISSING"
  | "GOVERNANCE_CONTEXT_REQUIRED_MISSING"
  | "POLICY_SNAPSHOT_REQUIRED_MISSING"
  | "GOVERNANCE_BYPASS_DETECTED"
  | "AUTHORITY_CONTEXT_INVALID"
  | "EXECUTION_AUTHORITY_DETECTED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "READ_AUTHORITY_UNVERIFIED"
  | "WRITE_AUTHORITY_UNVERIFIED"
  | "SOURCE_MUTATION_ATTEMPTED"
  | "NON_DETERMINISTIC_ORDERING"
  | "INPUT_HASH_MISSING"
  | "INPUT_HASH_MISMATCH"
  | "MISSING_INPUT_DETECTED"
  | "CORRUPTED_INPUT_DETECTED"
  | "SUPERSEDED_INPUT_UNAUTHORIZED"
  | "WALL_CLOCK_DEPENDENCY_DETECTED"
  | "RANDOM_DEPENDENCY_DETECTED"
  | "NETWORK_DEPENDENCY_DETECTED"
  | "UNCONTROLLED_TOOL_USE_DETECTED"
  | "DETERMINISTIC_REQUIREMENTS_INVALID"
  | "EXPECTED_RESULT_INVALID"
  | "MISMATCH_POLICY_INVALID"
  | "FAILURE_POLICY_INVALID"
  | "PARTIAL_REPLAY_REQUIRES_ESCALATION"
  | "OUTPUT_POLICY_INVALID"
  | "AUDIT_POLICY_INVALID"
  | "CONTRACT_HASH_MISMATCH"
  | "LIFECYCLE_STATE_INVALID"
  | "CERTIFICATION_STATE_INVALID"
  | "INVALID_LIFECYCLE_TRANSITION";

export type TruthReplayRequester = Readonly<{
  requester_id: string;
  requester_type: TruthReplayRequesterType;
}>;

export type TruthReplayTarget = Readonly<{
  target_type: TruthReplayTargetType;
  target_ids: readonly string[];
  target_description?: string;
}>;

export type TruthReplayTimeRange = Readonly<{
  starts_at: string;
  ends_at: string;
}>;

export type TruthReplayScope = Readonly<{
  scope_type: TruthReplayScopeType;
  allowed_record_types: readonly string[];
  allowed_event_types: readonly string[];
  allowed_tenant_ids: readonly string[];
  allowed_mission_ids?: readonly string[];
  allowed_time_range?: TruthReplayTimeRange;
  redaction_required: boolean;
  restricted_fields?: readonly string[];
}>;

export type TruthReplayWindow = Readonly<{
  starts_at: string;
  ends_at: string;
}>;

export type TruthReplayOrdering = Readonly<{
  ordering_strategy: TruthReplayOrderingStrategy;
  tie_breaker: TruthReplayTieBreaker;
  require_total_order: boolean;
}>;

export type TruthReplayGovernanceContext = Readonly<{
  policy_snapshot_id?: string;
  constitution_version?: string;
  governance_ruleset_id?: string;
  governance_decision_ids?: readonly string[];
  escalation_ids?: readonly string[];
  enforce_original_policy_context: boolean;
  enforce_current_policy_context?: boolean;
  fail_on_policy_missing: boolean;
  fail_on_governance_mismatch: boolean;
  governance_mismatch_detected?: boolean;
}>;

export type TruthReplayAuthorityContext = Readonly<{
  requester_id: string;
  requester_type: TruthReplayRequesterType;
  authority_scope: readonly string[];
  execution_authority: TruthReplayExecutionAuthority;
  read_authority_verified: boolean;
  write_authority_verified: boolean;
  allowed_writes: TruthReplayAllowedWrites;
  authority_expansion_allowed: boolean;
}>;

export type TruthReplayInputIntegrity = Readonly<{
  required_truth_records_present: boolean;
  required_events_present?: boolean;
  required_evidence_present?: boolean;
  required_lineage_present?: boolean;
  required_policy_present?: boolean;
  input_hash?: string;
  evidence_hash?: string;
  lineage_hash?: string;
  governance_hash?: string;
  missing_inputs?: readonly string[];
  corrupted_inputs?: readonly string[];
  superseded_inputs?: readonly string[];
  superseded_inputs_authorized?: boolean;
  input_hash_mismatch_detected?: boolean;
}>;

export type TruthReplayDeterministicRequirements = Readonly<{
  deterministic_serialization: boolean;
  deterministic_ordering_required: boolean;
  deterministic_hashing_required: boolean;
  random_seed_allowed: boolean;
  wall_clock_time_allowed: boolean;
  external_network_allowed: boolean;
  uncontrolled_tool_use_allowed: boolean;
  canonical_hash_algorithm: TruthReplayHashAlgorithm;
  canonical_serialization: TruthReplayCanonicalSerialization;
}>;

export type TruthReplayExpectedResult = Readonly<{
  expected_output_hash?: string;
  expected_truth_state?: string;
  expected_governance_decision?: string;
  expected_recommendation_id?: string;
  expected_confidence_value?: number;
  expected_risk_state?: string;
  mismatch_policy: TruthReplayMismatchPolicy;
}>;

export type TruthReplayFailurePolicy = Readonly<{
  fail_on_missing_truth_record: boolean;
  fail_on_missing_evidence: boolean;
  fail_on_missing_lineage: boolean;
  fail_on_missing_policy: boolean;
  fail_on_hash_mismatch: boolean;
  fail_on_authority_violation: boolean;
  fail_on_tenant_violation: boolean;
  fail_on_governance_violation: boolean;
  allow_partial_replay: boolean;
  partial_replay_requires_escalation: boolean;
}>;

export type TruthReplayOutputPolicy = Readonly<{
  output_type: TruthReplayOutputType;
  write_to_ledger: boolean;
  mutate_source_records: boolean;
  include_evidence_refs: boolean;
  include_lineage_refs: boolean;
  include_governance_refs: boolean;
  include_hashes: boolean;
  include_failure_reason: boolean;
}>;

export type TruthReplayAuditPolicy = Readonly<{
  audit_required: boolean;
  audit_record_type: TruthReplayAuditRecordType;
  include_requester: boolean;
  include_scope: boolean;
  include_inputs: boolean;
  include_outputs: boolean;
  include_hashes: boolean;
  include_failures: boolean;
  include_governance_context: boolean;
  include_authority_context: boolean;
}>;

export type TruthReplayContract = Readonly<{
  replay_id: string;
  tenant_id: string;
  mission_id?: string;
  replay_type: TruthReplayContractType;
  replay_scope: TruthReplayScope;
  replay_target: TruthReplayTarget;
  requested_by: TruthReplayRequester;
  requested_at: string;
  source_truth_record_ids: readonly string[];
  source_event_ids?: readonly string[];
  source_evidence_refs?: readonly string[];
  source_lineage_refs?: readonly string[];
  source_policy_refs?: readonly string[];
  source_replay_refs?: readonly string[];
  replay_window?: TruthReplayWindow;
  replay_ordering: TruthReplayOrdering;
  governance_context: TruthReplayGovernanceContext;
  authority_context: TruthReplayAuthorityContext;
  input_integrity: TruthReplayInputIntegrity;
  deterministic_requirements: TruthReplayDeterministicRequirements;
  expected_result?: TruthReplayExpectedResult;
  failure_policy: TruthReplayFailurePolicy;
  output_policy: TruthReplayOutputPolicy;
  audit_policy: TruthReplayAuditPolicy;
  lifecycle_state: TruthReplayLifecycleState;
  certification_state: TruthReplayCertificationState;
  contract_hash?: string;
  created_at: string;
  updated_at?: string;
}>;

export type TruthReplayValidationIssue = Readonly<{
  code: TruthReplayContractErrorCode;
  message: string;
  path: string;
  severity: TruthReplayValidationSeverity;
}>;

export type TruthReplayContractValidationResult = Readonly<{
  state: TruthReplayValidationState;
  errors: readonly TruthReplayValidationIssue[];
  warnings: readonly TruthReplayValidationIssue[];
  escalation_reasons: readonly TruthReplayValidationIssue[];
  normalized_contract?: TruthReplayContract;
  contract_hash?: string;
  checked_at?: string;
}>;

export type TruthReplayLifecycleTransitionValidation = Readonly<{
  valid: boolean;
  from_state: TruthReplayLifecycleState;
  to_state: TruthReplayLifecycleState;
  error?: TruthReplayValidationIssue;
}>;

export type TruthReplayContractStorageRecord = Readonly<{
  replay_id: string;
  tenant_id: string;
  mission_id?: string;
  replay_type: TruthReplayContractType;
  replay_scope_json: string;
  replay_target_json: string;
  source_truth_record_ids_json: string;
  source_event_ids_json?: string;
  source_evidence_refs_json?: string;
  source_lineage_refs_json?: string;
  source_policy_refs_json?: string;
  governance_context_json: string;
  authority_context_json: string;
  input_integrity_json: string;
  deterministic_requirements_json: string;
  expected_result_json?: string;
  failure_policy_json: string;
  output_policy_json: string;
  audit_policy_json: string;
  lifecycle_state: TruthReplayLifecycleState;
  certification_state: TruthReplayCertificationState;
  contract_hash: string;
  created_at: string;
  updated_at?: string;
}>;

export type TruthReplayInputReconstructionType =
  | "TRUTH_RECORD_INPUT_RECONSTRUCTION"
  | "EVENT_INPUT_RECONSTRUCTION"
  | "EVIDENCE_INPUT_RECONSTRUCTION"
  | "RECOMMENDATION_INPUT_RECONSTRUCTION"
  | "GOVERNANCE_INPUT_RECONSTRUCTION"
  | "LINEAGE_INPUT_RECONSTRUCTION"
  | "MISSION_INPUT_RECONSTRUCTION"
  | "FULL_CONTEXT_INPUT_RECONSTRUCTION";

export type TruthReplayInputReconstructionState =
  | "REQUESTED"
  | "CONTRACT_LOADED"
  | "SCOPE_VERIFIED"
  | "SOURCES_DISCOVERED"
  | "SOURCES_LOADED"
  | "ORDERED"
  | "CANONICALIZED"
  | "INTEGRITY_VERIFIED"
  | "BUNDLE_CREATED"
  | "FAILED"
  | "ESCALATED"
  | "ARCHIVED";

export type TruthReplayInputCertificationState =
  | "UNCERTIFIED"
  | "CONTRACT_VERIFIED"
  | "SCOPE_CERTIFIED"
  | "SOURCES_CERTIFIED"
  | "ORDER_CERTIFIED"
  | "INTEGRITY_CERTIFIED"
  | "INPUT_BUNDLE_CERTIFIED"
  | "RECONSTRUCTION_FAILED";

export type TruthReplayInputIntegrityState =
  | "VERIFIED"
  | "MISMATCH"
  | "CORRUPTED"
  | "UNAUTHORIZED"
  | "INCOMPLETE"
  | "ESCALATION_REQUIRED";

export type TruthReplayInputFailureCode =
  | "REPLAY_CONTRACT_MISSING"
  | "REPLAY_CONTRACT_HASH_MISMATCH"
  | "REPLAY_CONTRACT_UNVALIDATED"
  | "RECONSTRUCTION_SCOPE_MISSING"
  | "TENANT_SCOPE_VIOLATION"
  | "MISSION_SCOPE_VIOLATION"
  | "RECORD_TYPE_UNAUTHORIZED"
  | "EVENT_TYPE_UNAUTHORIZED"
  | "RESTRICTED_INPUT_UNAUTHORIZED"
  | "REQUIRED_TRUTH_RECORD_MISSING"
  | "TRUTH_RECORD_HASH_MISMATCH"
  | "TRUTH_RECORD_CORRUPTED"
  | "TRUTH_RECORD_UNAUTHORIZED"
  | "REQUIRED_EVENT_MISSING"
  | "EVENT_HASH_MISMATCH"
  | "EVENT_ORDERING_AMBIGUOUS"
  | "REQUIRED_EVIDENCE_MISSING"
  | "EVIDENCE_HASH_MISMATCH"
  | "EVIDENCE_RELATIONSHIP_BROKEN"
  | "REQUIRED_LINEAGE_MISSING"
  | "LINEAGE_HASH_MISMATCH"
  | "CAUSAL_CHAIN_BROKEN"
  | "REQUIRED_GOVERNANCE_MISSING"
  | "POLICY_SNAPSHOT_MISSING"
  | "GOVERNANCE_DECISION_MISSING"
  | "CURRENT_POLICY_SUBSTITUTED"
  | "EXECUTION_AUTHORITY_DETECTED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "REQUIRED_SCHEMA_MISSING"
  | "SCHEMA_HASH_MISMATCH"
  | "UNSUPPORTED_SCHEMA_VERSION"
  | "SILENT_SCHEMA_MIGRATION_ATTEMPTED"
  | "NON_DETERMINISTIC_ORDERING"
  | "UNSTABLE_SERIALIZATION_DETECTED"
  | "WALL_CLOCK_VALUE_INJECTED"
  | "ENVIRONMENT_VALUE_INJECTED"
  | "INPUT_HASH_MISMATCH"
  | "CORRUPTED_INPUT_DETECTED"
  | "UNAUTHORIZED_INPUT_DETECTED"
  | "PARTIAL_RECONSTRUCTION_REQUIRES_ESCALATION"
  | "INCOMPLETE_BUNDLE_CERTIFICATION_BLOCKED";

export type TruthReplayInputAuditEventName =
  | "REPLAY_INPUT_RECONSTRUCTION_REQUESTED"
  | "REPLAY_INPUT_CONTRACT_LOADED"
  | "REPLAY_INPUT_SCOPE_VERIFIED"
  | "REPLAY_INPUT_MANIFEST_CREATED"
  | "REPLAY_INPUT_TRUTH_RECORDS_LOADED"
  | "REPLAY_INPUT_EVENTS_LOADED"
  | "REPLAY_INPUT_EVIDENCE_LOADED"
  | "REPLAY_INPUT_LINEAGE_LOADED"
  | "REPLAY_INPUT_GOVERNANCE_LOADED"
  | "REPLAY_INPUT_AUTHORITY_VERIFIED"
  | "REPLAY_INPUT_SCHEMA_CONTEXT_LOADED"
  | "REPLAY_INPUT_ORDERED"
  | "REPLAY_INPUT_CANONICALIZED"
  | "REPLAY_INPUT_INTEGRITY_VERIFIED"
  | "REPLAY_INPUT_BUNDLE_CREATED"
  | "REPLAY_INPUT_RECONSTRUCTION_FAILED"
  | "REPLAY_INPUT_RECONSTRUCTION_ESCALATED";

export type TruthReplayInputFailureReason = Readonly<{
  code: TruthReplayInputFailureCode;
  message: string;
  input_ref?: string;
  path: string;
}>;

export type TruthReplayRequiredInput = Readonly<{
  input_type: "TRUTH_RECORD" | "EVENT" | "EVIDENCE" | "LINEAGE" | "GOVERNANCE" | "POLICY" | "AUTHORITY" | "SCHEMA";
  input_ref: string;
}>;

export type TruthReplayOptionalInput = TruthReplayRequiredInput;
export type TruthReplayMissingInput = TruthReplayRequiredInput;
export type TruthReplayRestrictedInput = TruthReplayRequiredInput & Readonly<{ authorization_ref?: string }>;
export type TruthReplaySupersededInput = TruthReplayRequiredInput & Readonly<{ superseded_by?: string; superseded_at?: string }>;
export type TruthReplayHashMismatch = Readonly<{ input_type: string; input_ref: string; expected_hash?: string; actual_hash?: string }>;
export type TruthReplayCorruptedInput = Readonly<{ input_type: string; input_ref: string; reason: string }>;
export type TruthReplayUnauthorizedInput = Readonly<{ input_type: string; input_ref: string; reason: string }>;

export type ReconstructedTruthRecord = Readonly<{
  truth_record_id: string;
  tenant_id: string;
  mission_id?: string;
  record_type: string;
  payload: unknown;
  record_hash: string;
  expected_hash?: string;
  lifecycle_state?: string;
  superseded_by?: string;
  superseded_at?: string;
  archived?: boolean;
  restricted?: boolean;
  authorized?: boolean;
  corrupted?: boolean;
}>;

export type ReconstructedEvent = Readonly<{
  event_id: string;
  tenant_id: string;
  mission_id?: string;
  event_type: string;
  event_timestamp?: string;
  ledger_sequence?: number;
  payload: unknown;
  event_hash: string;
  expected_hash?: string;
  restricted?: boolean;
  authorized?: boolean;
  corrupted?: boolean;
}>;

export type ReconstructedEvidenceInput = Readonly<{
  evidence_ref: string;
  tenant_id: string;
  payload_metadata: unknown;
  evidence_hash: string;
  expected_hash?: string;
  relationship_preserved: boolean;
  supporting_evidence_refs?: readonly string[];
  conflicting_evidence_refs?: readonly string[];
  restricted?: boolean;
  authorized?: boolean;
  corrupted?: boolean;
}>;

export type ReconstructedLineageInput = Readonly<{
  lineage_ref: string;
  tenant_id: string;
  lineage_type: string;
  lineage_hash: string;
  expected_hash?: string;
  causal_chain_preserved: boolean;
  supersession_preserved?: boolean;
  parent_refs?: readonly string[];
  child_refs?: readonly string[];
  restricted?: boolean;
  authorized?: boolean;
  corrupted?: boolean;
}>;

export type ReconstructedGovernanceInput = Readonly<{
  governance_ref: string;
  tenant_id: string;
  governance_type: "POLICY_SNAPSHOT" | "GOVERNANCE_DECISION" | "CONSTITUTION" | "ESCALATION" | "RULESET";
  governance_hash: string;
  expected_hash?: string;
  original_context_preserved: boolean;
  current_policy_substituted?: boolean;
  restricted?: boolean;
  authorized?: boolean;
  corrupted?: boolean;
}>;

export type ReconstructedAuthorityInput = Readonly<{
  authority_ref: string;
  tenant_id: string;
  requester_id: string;
  execution_authority: TruthReplayExecutionAuthority;
  authority_expansion_allowed: boolean;
  authority_hash: string;
  expected_hash?: string;
}>;

export type TruthReplaySchemaInput = Readonly<{
  schema_ref: string;
  schema_type: string;
  schema_version: string;
  schema_hash: string;
  expected_hash?: string;
  supported: boolean;
  deprecated?: boolean;
  silent_migration_attempted?: boolean;
}>;

export type TruthReplaySchemaContext = Readonly<{
  schema_refs: readonly string[];
  schemas: readonly TruthReplaySchemaInput[];
  schema_context_hash: string;
}>;

export type TruthReplayOrderingContext = Readonly<{
  ordering_strategy: TruthReplayOrderingStrategy;
  tie_breaker: TruthReplayTieBreaker;
  require_total_order: boolean;
  ordered_input_refs: readonly string[];
  ordering_hash: string;
}>;

export type TruthReplaySerializationContext = Readonly<{
  canonical_serialization: TruthReplayCanonicalSerialization;
  stable_key_ordering: true;
  stable_array_ordering: true;
  wall_clock_injected: false;
  environment_values_injected: false;
  serialization_hash: string;
}>;

export type TruthReplayInputCompletenessReport = Readonly<{
  complete: boolean;
  required_truth_records_complete: boolean;
  required_events_complete: boolean;
  required_evidence_complete: boolean;
  required_lineage_complete: boolean;
  required_governance_complete: boolean;
  required_authority_complete: boolean;
  required_schema_context_complete: boolean;
  missing_required_inputs: readonly TruthReplayMissingInput[];
  missing_optional_inputs?: readonly TruthReplayMissingInput[];
  partial_reconstruction: boolean;
  escalation_required: boolean;
}>;

export type TruthReplayInputIntegrityReport = Readonly<{
  integrity_verified: boolean;
  truth_records_integrity_verified: boolean;
  events_integrity_verified: boolean;
  evidence_integrity_verified: boolean;
  lineage_integrity_verified: boolean;
  governance_integrity_verified: boolean;
  authority_integrity_verified: boolean;
  schema_integrity_verified: boolean;
  hash_mismatches: readonly TruthReplayHashMismatch[];
  corrupted_inputs: readonly TruthReplayCorruptedInput[];
  unauthorized_inputs: readonly TruthReplayUnauthorizedInput[];
  superseded_inputs: readonly TruthReplaySupersededInput[];
  integrity_state: TruthReplayInputIntegrityState;
}>;

export type TruthReplayInputManifest = Readonly<{
  manifest_id: string;
  replay_id: string;
  tenant_id: string;
  mission_id?: string;
  truth_record_ids: readonly string[];
  event_ids: readonly string[];
  evidence_refs: readonly string[];
  lineage_refs: readonly string[];
  governance_refs: readonly string[];
  policy_refs: readonly string[];
  authority_refs: readonly string[];
  schema_refs: readonly string[];
  required_inputs: readonly TruthReplayRequiredInput[];
  optional_inputs?: readonly TruthReplayOptionalInput[];
  missing_inputs: readonly TruthReplayMissingInput[];
  restricted_inputs: readonly TruthReplayRestrictedInput[];
  superseded_inputs: readonly TruthReplaySupersededInput[];
  manifest_hash: string;
}>;

export type TruthReplayInputHashSet = Readonly<{
  contract_hash: string;
  manifest_hash: string;
  truth_records_hash: string;
  events_hash?: string;
  evidence_hash?: string;
  lineage_hash?: string;
  governance_hash?: string;
  authority_hash?: string;
  schema_context_hash?: string;
  full_input_bundle_hash: string;
}>;

export type TruthReplayInputBundle = Readonly<{
  bundle_id: string;
  replay_id: string;
  tenant_id: string;
  mission_id?: string;
  replay_contract_ref: string;
  replay_contract_hash: string;
  reconstruction_type: TruthReplayInputReconstructionType;
  reconstruction_scope: TruthReplayScope;
  truth_records: readonly ReconstructedTruthRecord[];
  events: readonly ReconstructedEvent[];
  evidence_inputs: readonly ReconstructedEvidenceInput[];
  lineage_inputs: readonly ReconstructedLineageInput[];
  governance_inputs: readonly ReconstructedGovernanceInput[];
  authority_inputs: readonly ReconstructedAuthorityInput[];
  schema_context: TruthReplaySchemaContext;
  ordering_context: TruthReplayOrderingContext;
  serialization_context: TruthReplaySerializationContext;
  completeness_report: TruthReplayInputCompletenessReport;
  integrity_report: TruthReplayInputIntegrityReport;
  input_manifest: TruthReplayInputManifest;
  input_hashes: TruthReplayInputHashSet;
  reconstruction_state: TruthReplayInputReconstructionState;
  certification_state: TruthReplayInputCertificationState;
  failure_reasons?: readonly TruthReplayInputFailureReason[];
  audit_events: readonly TruthReplayInputAuditEventName[];
  created_at: string;
  readOnly: true;
  executionAuthorized: false;
  sourceMutationAllowed: false;
}>;

export type TruthReplayInputReconstructionRequest = Readonly<{
  bundle_id: string;
  replay_contract: TruthReplayContract;
  tenant_id: string;
  mission_id?: string;
  truth_records: readonly ReconstructedTruthRecord[];
  events?: readonly ReconstructedEvent[];
  evidence_inputs?: readonly ReconstructedEvidenceInput[];
  lineage_inputs?: readonly ReconstructedLineageInput[];
  governance_inputs?: readonly ReconstructedGovernanceInput[];
  authority_inputs?: readonly ReconstructedAuthorityInput[];
  schema_inputs: readonly TruthReplaySchemaInput[];
  created_at: string;
  restricted_input_authorization_refs?: readonly string[];
  optional_inputs?: readonly TruthReplayOptionalInput[];
  force_unstable_serialization?: boolean;
  force_wall_clock_injection?: boolean;
  force_environment_value_injection?: boolean;
  force_ambiguous_ordering?: boolean;
}>;

export type TruthReplayInputReconstructionTransitionValidation = Readonly<{
  valid: boolean;
  from_state: TruthReplayInputReconstructionState;
  to_state: TruthReplayInputReconstructionState;
  error?: TruthReplayInputFailureReason;
}>;

export type TruthReplayInputBundleStorageRecord = Readonly<{
  bundle_id: string;
  replay_id: string;
  tenant_id: string;
  mission_id?: string;
  replay_contract_ref: string;
  replay_contract_hash: string;
  reconstruction_type: TruthReplayInputReconstructionType;
  reconstruction_scope_json: string;
  input_manifest_json: string;
  truth_records_json: string;
  events_json: string;
  evidence_inputs_json: string;
  lineage_inputs_json: string;
  governance_inputs_json: string;
  authority_inputs_json: string;
  schema_context_json: string;
  ordering_context_json: string;
  serialization_context_json: string;
  completeness_report_json: string;
  integrity_report_json: string;
  input_hashes_json: string;
  reconstruction_state: TruthReplayInputReconstructionState;
  certification_state: TruthReplayInputCertificationState;
  failure_reasons_json?: string;
  full_input_bundle_hash: string;
  created_at: string;
}>;

export type TruthReplayStateReconstructionType =
  | "TRUTH_RECORD_STATE_RECONSTRUCTION"
  | "EVENT_STATE_RECONSTRUCTION"
  | "EVIDENCE_STATE_RECONSTRUCTION"
  | "RECOMMENDATION_STATE_RECONSTRUCTION"
  | "GOVERNANCE_STATE_RECONSTRUCTION"
  | "LINEAGE_STATE_RECONSTRUCTION"
  | "MISSION_STATE_RECONSTRUCTION"
  | "FULL_CONTEXT_STATE_RECONSTRUCTION";

export type TruthReplayStateBoundaryType =
  | "BEFORE_TARGET"
  | "AT_TARGET"
  | "AFTER_TARGET"
  | "AT_EVENT"
  | "AT_LEDGER_SEQUENCE"
  | "AT_TIMESTAMP"
  | "MISSION_START"
  | "MISSION_END";

export type TruthReplayStateComponentType =
  | "TRUTH_STATE"
  | "EVENT_STATE"
  | "EVIDENCE_STATE"
  | "LINEAGE_STATE"
  | "GOVERNANCE_STATE"
  | "AUTHORITY_STATE"
  | "RECOMMENDATION_STATE"
  | "RISK_STATE"
  | "CONFIDENCE_STATE"
  | "ESCALATION_STATE"
  | "RUNTIME_STATE"
  | "MISSION_STATE"
  | "OPERATOR_STATE"
  | "SCHEMA_STATE";

export type TruthReplayStateReconstructionMethod =
  | "DIRECT_LEDGER_STATE"
  | "EVENT_DERIVED_STATE"
  | "LINEAGE_DERIVED_STATE"
  | "GOVERNANCE_DERIVED_STATE"
  | "INPUT_BUNDLE_DERIVED_STATE";

export type TruthReplayStateComponentCompleteness = "COMPLETE" | "PARTIAL" | "MISSING" | "RESTRICTED";
export type TruthReplayStateComponentIntegrity = "VERIFIED" | "MISMATCH" | "CORRUPTED" | "UNAUTHORIZED" | "UNKNOWN";

export type TruthReplayStateTransitionType =
  | "TRUTH_LIFECYCLE_TRANSITION"
  | "EVENT_SEQUENCE_TRANSITION"
  | "EVIDENCE_STATE_TRANSITION"
  | "LINEAGE_TRANSITION"
  | "GOVERNANCE_DECISION_TRANSITION"
  | "AUTHORITY_STATE_TRANSITION"
  | "RECOMMENDATION_STATE_TRANSITION"
  | "RISK_STATE_TRANSITION"
  | "CONFIDENCE_STATE_TRANSITION"
  | "ESCALATION_STATE_TRANSITION"
  | "RUNTIME_STATE_TRANSITION"
  | "MISSION_STATE_TRANSITION";

export type TruthReplayStateReconstructionState =
  | "REQUESTED"
  | "INPUT_BUNDLE_LOADED"
  | "BOUNDARY_RESOLVED"
  | "COMPONENT_STATES_BUILT"
  | "TIMELINE_RECONSTRUCTED"
  | "TRANSITIONS_RECONSTRUCTED"
  | "STATE_GRAPH_RECONSTRUCTED"
  | "INVARIANTS_VERIFIED"
  | "CONSISTENCY_VERIFIED"
  | "STATE_HASHED"
  | "STATE_PACKAGE_CREATED"
  | "FAILED"
  | "ESCALATED"
  | "ARCHIVED";

export type TruthReplayStateCertificationState =
  | "UNCERTIFIED"
  | "INPUT_BUNDLE_VERIFIED"
  | "BOUNDARY_CERTIFIED"
  | "COMPONENT_STATE_CERTIFIED"
  | "TIMELINE_CERTIFIED"
  | "TRANSITION_CERTIFIED"
  | "INVARIANT_CERTIFIED"
  | "CONSISTENCY_CERTIFIED"
  | "STATE_PACKAGE_CERTIFIED"
  | "STATE_RECONSTRUCTION_FAILED";

export type TruthReplayStateConsistencyState = "CONSISTENT" | "INCONSISTENT" | "PARTIAL" | "ESCALATION_REQUIRED" | "FAILED";
export type TruthReplayStateInvariantState = "VERIFIED" | "FAILED" | "ESCALATION_REQUIRED";

export type TruthReplayStateFailureCode =
  | "INPUT_BUNDLE_MISSING"
  | "INPUT_BUNDLE_HASH_MISMATCH"
  | "INPUT_BUNDLE_UNCERTIFIED"
  | "INPUT_BUNDLE_INCOMPLETE"
  | "UNRESOLVED_ESCALATION_PRESENT"
  | "STATE_BOUNDARY_MISSING"
  | "STATE_BOUNDARY_AMBIGUOUS"
  | "BOUNDARY_TENANT_SCOPE_VIOLATION"
  | "BOUNDARY_MISSION_SCOPE_VIOLATION"
  | "BOUNDARY_SEQUENCE_NOT_FOUND"
  | "BOUNDARY_HASH_MISSING"
  | "TRUTH_STATE_MISSING"
  | "INVALID_TRUTH_LIFECYCLE"
  | "EVENT_ORDER_AMBIGUOUS"
  | "EVENT_SEQUENCE_GAP"
  | "EVIDENCE_STATE_MISSING"
  | "EVIDENCE_RELATIONSHIP_BROKEN"
  | "LINEAGE_STATE_MISSING"
  | "BROKEN_LINEAGE_DETECTED"
  | "GOVERNANCE_STATE_MISSING"
  | "POLICY_SNAPSHOT_MISSING"
  | "CURRENT_POLICY_SUBSTITUTED"
  | "GOVERNANCE_DECISION_MISSING"
  | "EXECUTION_AUTHORITY_DETECTED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "RECOMMENDATION_RECOMPUTATION_ATTEMPTED"
  | "RISK_RECOMPUTATION_ATTEMPTED"
  | "CONFIDENCE_RECOMPUTATION_ATTEMPTED"
  | "UNAUTHORIZED_RUNTIME_STATE"
  | "MISSION_SCOPE_VIOLATION"
  | "OPERATOR_APPROVAL_MISSING"
  | "INVALID_STATE_TRANSITION"
  | "STATE_GRAPH_NODE_MISSING"
  | "STATE_GRAPH_EDGE_MISSING"
  | "CROSS_TENANT_STATE_EDGE_DETECTED"
  | "TENANT_INVARIANT_VIOLATION"
  | "GOVERNANCE_INVARIANT_VIOLATION"
  | "AUTHORITY_INVARIANT_VIOLATION"
  | "HISTORICAL_POLICY_INVARIANT_VIOLATION"
  | "TRUTH_EVENT_MISMATCH"
  | "EVIDENCE_RECOMMENDATION_MISMATCH"
  | "GOVERNANCE_POLICY_MISMATCH"
  | "AUTHORITY_REQUESTER_MISMATCH"
  | "SCHEMA_SOURCE_MISMATCH"
  | "UNSTABLE_STATE_SERIALIZATION_DETECTED"
  | "STATE_HASH_MISSING"
  | "INCOMPLETE_STATE_PACKAGE_CERTIFICATION_BLOCKED"
  | "PARTIAL_STATE_REQUIRES_ESCALATION"
  | "UNCERTIFIED_STATE_PACKAGE_EXECUTION_BLOCKED";

export type TruthReplayStateAuditEventName =
  | "REPLAY_STATE_RECONSTRUCTION_REQUESTED"
  | "REPLAY_STATE_INPUT_BUNDLE_LOADED"
  | "REPLAY_STATE_BOUNDARY_RESOLVED"
  | "REPLAY_STATE_COMPONENTS_BUILT"
  | "REPLAY_STATE_TIMELINE_RECONSTRUCTED"
  | "REPLAY_STATE_TRANSITIONS_RECONSTRUCTED"
  | "REPLAY_STATE_GRAPH_RECONSTRUCTED"
  | "REPLAY_STATE_INVARIANTS_VERIFIED"
  | "REPLAY_STATE_CONSISTENCY_VERIFIED"
  | "REPLAY_STATE_HASHED"
  | "REPLAY_STATE_PACKAGE_CREATED"
  | "REPLAY_STATE_RECONSTRUCTION_FAILED"
  | "REPLAY_STATE_RECONSTRUCTION_ESCALATED";

export type TruthReplayStateFailureReason = Readonly<{
  code: TruthReplayStateFailureCode;
  message: string;
  path: string;
  source_ref?: string;
}>;

export type TruthReplayStateEscalationReason = TruthReplayStateFailureReason;

export type TruthReplayStateBoundary = Readonly<{
  boundary_type: TruthReplayStateBoundaryType;
  target_id?: string;
  target_event_id?: string;
  target_truth_record_id?: string;
  target_ledger_sequence?: number;
  target_timestamp?: string;
  include_prior_state: boolean;
  include_target_state: boolean;
  include_following_state: boolean;
  boundary_hash: string;
}>;

export type TruthReplayStateComponent<T = unknown> = Readonly<{
  component_id: string;
  component_type: TruthReplayStateComponentType;
  tenant_id: string;
  mission_id?: string;
  source_refs: readonly string[];
  source_hashes: readonly string[];
  reconstructed_value: T;
  reconstruction_method: TruthReplayStateReconstructionMethod;
  completeness_state: TruthReplayStateComponentCompleteness;
  integrity_state: TruthReplayStateComponentIntegrity;
  component_hash: string;
}>;

export type ReconstructedTruthState = TruthReplayStateComponent<unknown>;
export type ReconstructedEventState = TruthReplayStateComponent<unknown>;
export type ReconstructedEvidenceState = TruthReplayStateComponent<unknown>;
export type ReconstructedLineageState = TruthReplayStateComponent<unknown>;
export type ReconstructedGovernanceState = TruthReplayStateComponent<unknown>;
export type ReconstructedAuthorityState = TruthReplayStateComponent<unknown>;
export type ReconstructedRecommendationState = TruthReplayStateComponent<unknown>;
export type ReconstructedRiskState = TruthReplayStateComponent<unknown>;
export type ReconstructedConfidenceState = TruthReplayStateComponent<unknown>;
export type ReconstructedEscalationState = TruthReplayStateComponent<unknown>;
export type ReconstructedRuntimeState = TruthReplayStateComponent<unknown>;
export type ReconstructedMissionState = TruthReplayStateComponent<unknown>;
export type ReconstructedOperatorState = TruthReplayStateComponent<unknown>;
export type TruthReplaySchemaState = TruthReplayStateComponent<unknown>;
export type TruthReplaySerializationState = TruthReplayStateComponent<unknown>;

export type TruthReplayStateCheckpoint = Readonly<{
  checkpoint_id: string;
  sequence_index: number;
  source_event_id?: string;
  source_truth_record_id?: string;
  timestamp?: string;
  ledger_sequence?: number;
  state_before_hash?: string;
  state_after_hash?: string;
  transition_refs: readonly string[];
  checkpoint_hash: string;
}>;

export type TruthReplayStateTimeline = Readonly<{
  timeline_id: string;
  replay_id: string;
  tenant_id: string;
  mission_id?: string;
  ordering_strategy: TruthReplayOrderingStrategy;
  checkpoints: readonly TruthReplayStateCheckpoint[];
  total_order_verified: boolean;
  timeline_hash: string;
}>;

export type TruthReplayStateTransition = Readonly<{
  transition_id: string;
  transition_type: TruthReplayStateTransitionType;
  source_ref: string;
  from_state?: string;
  to_state?: string;
  transition_allowed: boolean;
  transition_reason?: string;
  transition_hash: string;
}>;

export type TruthReplayInvalidStateTransition = TruthReplayStateTransition;

export type TruthReplayStateTransitionLog = Readonly<{
  transition_log_id: string;
  replay_id: string;
  tenant_id: string;
  mission_id?: string;
  transitions: readonly TruthReplayStateTransition[];
  transition_order_verified: boolean;
  invalid_transitions: readonly TruthReplayInvalidStateTransition[];
  transition_log_hash: string;
}>;

export type TruthReplayStateGraphNode = Readonly<{
  node_id: string;
  node_type: TruthReplayStateComponentType | "INPUT" | "BOUNDARY";
  tenant_id: string;
  mission_id?: string;
  node_hash: string;
}>;

export type TruthReplayStateGraphEdge = Readonly<{
  edge_id: string;
  from_node_id: string;
  to_node_id: string;
  relationship_type: string;
  tenant_id: string;
  mission_id?: string;
  edge_hash: string;
}>;

export type TruthReplayStateGraph = Readonly<{
  graph_id: string;
  replay_id: string;
  tenant_id: string;
  mission_id?: string;
  nodes: readonly TruthReplayStateGraphNode[];
  edges: readonly TruthReplayStateGraphEdge[];
  graph_complete: boolean;
  state_graph_hash: string;
}>;

export type TruthReplayFailedInvariant = Readonly<{ invariant: string; reason: string }>;
export type TruthReplayStateContradiction = Readonly<{ contradiction_id: string; reason: string; source_refs: readonly string[] }>;
export type TruthReplayUnresolvedStateReference = Readonly<{ reference_id: string; reference_type: string }>;

export type TruthReplayStateInvariantReport = Readonly<{
  invariants_verified: boolean;
  tenant_isolation_preserved: boolean;
  mission_scope_preserved: boolean;
  governance_supremacy_preserved: boolean;
  operator_authority_preserved: boolean;
  execution_authority_absent: boolean;
  source_immutability_preserved: boolean;
  evidence_lineage_preserved: boolean;
  historical_policy_context_preserved: boolean;
  deterministic_ordering_preserved: boolean;
  schema_context_preserved: boolean;
  failed_invariants: readonly TruthReplayFailedInvariant[];
  invariant_state: TruthReplayStateInvariantState;
}>;

export type TruthReplayStateConsistencyReport = Readonly<{
  consistent: boolean;
  truth_event_consistency: boolean;
  evidence_recommendation_consistency: boolean;
  lineage_event_consistency: boolean;
  governance_policy_consistency: boolean;
  authority_requester_consistency: boolean;
  mission_scope_consistency: boolean;
  runtime_governance_consistency: boolean;
  schema_source_consistency: boolean;
  contradictions: readonly TruthReplayStateContradiction[];
  unresolved_references: readonly TruthReplayUnresolvedStateReference[];
  invalid_state_transitions: readonly TruthReplayInvalidStateTransition[];
  consistency_state: TruthReplayStateConsistencyState;
}>;

export type TruthReplayStateHashSet = Readonly<{
  replay_contract_hash: string;
  input_bundle_hash: string;
  truth_state_hash: string;
  event_state_hash: string;
  evidence_state_hash: string;
  lineage_state_hash: string;
  governance_state_hash: string;
  authority_state_hash: string;
  recommendation_state_hash?: string;
  risk_state_hash?: string;
  confidence_state_hash?: string;
  escalation_state_hash?: string;
  runtime_state_hash?: string;
  mission_state_hash?: string;
  operator_state_hash?: string;
  schema_state_hash: string;
  timeline_hash: string;
  transition_log_hash: string;
  state_graph_hash: string;
  full_state_package_hash: string;
}>;

export type TruthReplayStatePackage = Readonly<{
  state_package_id: string;
  replay_id: string;
  bundle_id: string;
  tenant_id: string;
  mission_id?: string;
  replay_contract_ref: string;
  replay_contract_hash: string;
  input_bundle_hash: string;
  state_reconstruction_type: TruthReplayStateReconstructionType;
  replay_state_boundary: TruthReplayStateBoundary;
  truth_state: ReconstructedTruthState;
  event_state: ReconstructedEventState;
  evidence_state: ReconstructedEvidenceState;
  lineage_state: ReconstructedLineageState;
  governance_state: ReconstructedGovernanceState;
  authority_state: ReconstructedAuthorityState;
  recommendation_state?: ReconstructedRecommendationState;
  risk_state?: ReconstructedRiskState;
  confidence_state?: ReconstructedConfidenceState;
  escalation_state?: ReconstructedEscalationState;
  runtime_state?: ReconstructedRuntimeState;
  mission_state?: ReconstructedMissionState;
  operator_state?: ReconstructedOperatorState;
  schema_state: TruthReplaySchemaState;
  serialization_state: TruthReplaySerializationState;
  state_timeline: TruthReplayStateTimeline;
  state_transition_log: TruthReplayStateTransitionLog;
  state_graph: TruthReplayStateGraph;
  state_invariants: TruthReplayStateInvariantReport;
  state_consistency_report: TruthReplayStateConsistencyReport;
  state_hashes: TruthReplayStateHashSet;
  reconstruction_state: TruthReplayStateReconstructionState;
  certification_state: TruthReplayStateCertificationState;
  failure_reasons?: readonly TruthReplayStateFailureReason[];
  escalation_reasons?: readonly TruthReplayStateEscalationReason[];
  audit_events: readonly TruthReplayStateAuditEventName[];
  created_at: string;
  readOnly: true;
  executionAuthorized: false;
  inputBundleMutationAllowed: false;
  sourceMutationAllowed: false;
}>;

export type TruthReplayStateReconstructionRequest = Readonly<{
  state_package_id: string;
  input_bundle: TruthReplayInputBundle;
  replay_state_boundary: TruthReplayStateBoundary;
  created_at: string;
  force_input_bundle_hash_mismatch?: boolean;
  force_boundary_ambiguous?: boolean;
  force_boundary_tenant_violation?: boolean;
  force_boundary_mission_violation?: boolean;
  force_boundary_sequence_missing?: boolean;
  force_missing_truth_state?: boolean;
  force_invalid_truth_lifecycle?: boolean;
  force_ambiguous_event_order?: boolean;
  force_event_sequence_gap?: boolean;
  force_missing_evidence_state?: boolean;
  force_evidence_relationship_broken?: boolean;
  force_missing_lineage_state?: boolean;
  force_broken_lineage?: boolean;
  force_missing_governance_state?: boolean;
  force_policy_snapshot_missing?: boolean;
  force_current_policy_substituted?: boolean;
  force_governance_decision_missing?: boolean;
  force_execution_authority?: boolean;
  force_authority_expansion?: boolean;
  force_recommendation_recomputation?: boolean;
  force_risk_recomputation?: boolean;
  force_confidence_recomputation?: boolean;
  force_unauthorized_runtime_state?: boolean;
  force_operator_approval_missing?: boolean;
  force_invalid_state_transition?: boolean;
  force_graph_node_missing?: boolean;
  force_graph_edge_missing?: boolean;
  force_cross_tenant_state_edge?: boolean;
  force_tenant_invariant_violation?: boolean;
  force_governance_invariant_violation?: boolean;
  force_authority_invariant_violation?: boolean;
  force_historical_policy_invariant_violation?: boolean;
  force_truth_event_mismatch?: boolean;
  force_evidence_recommendation_mismatch?: boolean;
  force_governance_policy_mismatch?: boolean;
  force_authority_requester_mismatch?: boolean;
  force_schema_source_mismatch?: boolean;
  force_unstable_state_serialization?: boolean;
  force_partial_state?: boolean;
}>;

export type TruthReplayStateReconstructionTransitionValidation = Readonly<{
  valid: boolean;
  from_state: TruthReplayStateReconstructionState;
  to_state: TruthReplayStateReconstructionState;
  error?: TruthReplayStateFailureReason;
}>;

export type TruthReplayStatePackageStorageRecord = Readonly<{
  state_package_id: string;
  replay_id: string;
  bundle_id: string;
  tenant_id: string;
  mission_id?: string;
  replay_contract_ref: string;
  replay_contract_hash: string;
  input_bundle_hash: string;
  state_reconstruction_type: TruthReplayStateReconstructionType;
  replay_state_boundary_json: string;
  truth_state_json: string;
  event_state_json: string;
  evidence_state_json: string;
  lineage_state_json: string;
  governance_state_json: string;
  authority_state_json: string;
  recommendation_state_json?: string;
  risk_state_json?: string;
  confidence_state_json?: string;
  escalation_state_json?: string;
  runtime_state_json?: string;
  mission_state_json?: string;
  operator_state_json?: string;
  schema_state_json: string;
  serialization_state_json: string;
  state_timeline_json: string;
  state_transition_log_json: string;
  state_graph_json: string;
  state_invariants_json: string;
  state_consistency_report_json: string;
  state_hashes_json: string;
  reconstruction_state: TruthReplayStateReconstructionState;
  certification_state: TruthReplayStateCertificationState;
  failure_reasons_json?: string;
  escalation_reasons_json?: string;
  full_state_package_hash: string;
  created_at: string;
}>;

export type TruthReplayProducedOutputType =
  | "TRUTH_RECORD_OUTPUT"
  | "EVENT_SEQUENCE_OUTPUT"
  | "EVIDENCE_CHAIN_OUTPUT"
  | "RECOMMENDATION_OUTPUT"
  | "GOVERNANCE_DECISION_OUTPUT"
  | "LINEAGE_GRAPH_OUTPUT"
  | "MISSION_HISTORY_OUTPUT"
  | "FULL_CONTEXT_OUTPUT";

export type TruthReplayOutputVerificationType =
  | "TRUTH_RECORD_OUTPUT_VERIFICATION"
  | "EVENT_OUTPUT_VERIFICATION"
  | "EVIDENCE_OUTPUT_VERIFICATION"
  | "RECOMMENDATION_OUTPUT_VERIFICATION"
  | "GOVERNANCE_OUTPUT_VERIFICATION"
  | "LINEAGE_OUTPUT_VERIFICATION"
  | "MISSION_OUTPUT_VERIFICATION"
  | "FULL_CONTEXT_OUTPUT_VERIFICATION";

export type TruthReplayOutputComparisonMode = "HASH_ONLY" | "STRUCTURAL" | "FIELD_LEVEL" | "GOVERNANCE_AWARE" | "FULL_CONTEXT";
export type TruthReplayOutputEqualityRequirement = "EXACT_HASH_MATCH" | "EXACT_STRUCTURAL_MATCH" | "DECLARED_FIELD_MATCH" | "GOVERNANCE_EQUIVALENT_MATCH";
export type TruthReplayOutputVerificationResultState = "MATCHED" | "MISMATCHED" | "FAILED" | "UNVERIFIABLE" | "ESCALATION_REQUIRED";
export type TruthReplayOutputVerificationLifecycleState = "REQUESTED" | "STATE_LOADED" | "OUTPUT_LOADED" | "EXPECTED_RESOLVED" | "VERIFIED" | "FAILED" | "ESCALATED" | "ARCHIVED";
export type TruthReplayOutputVerificationCertificationState = "UNCERTIFIED" | "OUTPUT_VERIFIED" | "OUTPUT_MATCHED" | "OUTPUT_MISMATCHED" | "OUTPUT_FAILED" | "OUTPUT_ESCALATED";
export type TruthReplayOutputMismatchSeverity = "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type TruthReplayOutputVerificationFailureCode =
  | "OUTPUT_VERIFICATION_CONTRACT_MISSING"
  | "VERIFICATION_ID_MISSING"
  | "REPLAY_ID_MISSING"
  | "TENANT_ID_MISSING"
  | "STATE_PACKAGE_MISSING"
  | "STATE_PACKAGE_HASH_MISMATCH"
  | "STATE_PACKAGE_UNCERTIFIED"
  | "UNRESOLVED_STATE_ESCALATION_PRESENT"
  | "REPLAY_OUTPUT_MISSING"
  | "REPLAY_OUTPUT_HASH_MISSING"
  | "REPLAY_OUTPUT_HASH_MISMATCH"
  | "REPLAY_OUTPUT_TENANT_MISMATCH"
  | "REPLAY_OUTPUT_MISSION_MISMATCH"
  | "REPLAY_OUTPUT_PROVENANCE_MISMATCH"
  | "EXPECTED_OUTPUT_MISSING"
  | "EXPECTED_OUTPUT_HASH_MISSING"
  | "EXPECTED_SCHEMA_MISMATCH"
  | "MISMATCH_POLICY_INVALID"
  | "VERIFICATION_SCOPE_MISSING"
  | "OUTPUT_TYPE_UNAUTHORIZED"
  | "RESTRICTED_FIELD_EXPOSED"
  | "REDACTION_MISMATCH"
  | "UNSTABLE_OUTPUT_SERIALIZATION_DETECTED"
  | "WALL_CLOCK_OUTPUT_FIELD_DETECTED"
  | "ENVIRONMENT_OUTPUT_FIELD_DETECTED"
  | "OUTPUT_TYPE_MISMATCH"
  | "OUTPUT_SCHEMA_MISMATCH"
  | "REQUIRED_FIELD_MISSING"
  | "UNEXPECTED_FIELD_PRESENT"
  | "FIELD_VALUE_MISMATCH"
  | "POLICY_SNAPSHOT_CHANGED"
  | "CURRENT_POLICY_SUBSTITUTED"
  | "GOVERNANCE_DECISION_MISMATCH"
  | "GOVERNANCE_BYPASS_DETECTED"
  | "EXECUTION_AUTHORITY_DETECTED"
  | "SOURCE_MUTATION_ATTEMPTED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "EVIDENCE_REF_MISSING"
  | "UNEXPECTED_EVIDENCE_ADDED"
  | "EVIDENCE_HASH_MISMATCH"
  | "LINEAGE_RELATIONSHIP_MISSING"
  | "CAUSAL_CHAIN_CHANGED"
  | "SUPERSESSION_CHAIN_CHANGED"
  | "RECOMMENDATION_PAYLOAD_MISMATCH"
  | "RECOMMENDATION_RATIONALE_REFS_MISMATCH"
  | "ADVISORY_ONLY_STATE_CHANGED"
  | "RISK_MISMATCH_DETECTED"
  | "CONFIDENCE_MISMATCH_DETECTED"
  | "VERIFICATION_HASH_MISSING";

export type TruthReplayOutputVerificationAuditEventName =
  | "REPLAY_OUTPUT_VERIFICATION_REQUESTED"
  | "REPLAY_OUTPUT_STATE_PACKAGE_LOADED"
  | "REPLAY_OUTPUT_ARTIFACT_LOADED"
  | "REPLAY_EXPECTED_OUTPUT_RESOLVED"
  | "REPLAY_OUTPUT_SCOPE_VERIFIED"
  | "REPLAY_OUTPUT_CANONICALIZED"
  | "REPLAY_OUTPUT_HASH_VERIFIED"
  | "REPLAY_OUTPUT_STRUCTURE_VERIFIED"
  | "REPLAY_OUTPUT_FIELDS_VERIFIED"
  | "REPLAY_OUTPUT_GOVERNANCE_VERIFIED"
  | "REPLAY_OUTPUT_AUTHORITY_VERIFIED"
  | "REPLAY_OUTPUT_EVIDENCE_VERIFIED"
  | "REPLAY_OUTPUT_LINEAGE_VERIFIED"
  | "REPLAY_OUTPUT_RECOMMENDATION_VERIFIED"
  | "REPLAY_OUTPUT_RISK_CONFIDENCE_VERIFIED"
  | "REPLAY_OUTPUT_MISMATCH_DETECTED"
  | "REPLAY_OUTPUT_VERIFICATION_MATCHED"
  | "REPLAY_OUTPUT_VERIFICATION_MISMATCHED"
  | "REPLAY_OUTPUT_VERIFICATION_FAILED"
  | "REPLAY_OUTPUT_VERIFICATION_ESCALATED"
  | "REPLAY_OUTPUT_VERIFICATION_REPORT_CREATED";

export type TruthReplayProducedOutput = Readonly<{
  replay_output_id: string;
  replay_id: string;
  tenant_id: string;
  mission_id?: string;
  output_type: TruthReplayProducedOutputType;
  output_payload: unknown;
  produced_from_contract_hash: string;
  produced_from_input_bundle_hash: string;
  produced_from_state_package_hash: string;
  evidence_refs?: readonly string[];
  lineage_refs?: readonly string[];
  governance_refs?: readonly string[];
  authority_refs?: readonly string[];
  risk_refs?: readonly string[];
  confidence_refs?: readonly string[];
  output_schema_version: string;
  output_hash: string;
  advisory_only: boolean;
  execution_authority: TruthReplayExecutionAuthority;
  created_at: string;
}>;

export type TruthReplayExpectedOutput = Readonly<{
  expected_output_id?: string;
  expected_output_ref?: string;
  expected_output_type: TruthReplayProducedOutputType;
  expected_payload?: unknown;
  expected_output_hash?: string;
  expected_schema_version?: string;
  expected_truth_state?: string;
  expected_governance_decision?: string;
  expected_recommendation_id?: string;
  expected_confidence_value?: number;
  expected_confidence_band?: string;
  expected_risk_state?: string;
  expected_escalation_state?: string;
  expected_evidence_refs?: readonly string[];
  expected_lineage_refs?: readonly string[];
  expected_governance_refs?: readonly string[];
  expected_authority_refs?: readonly string[];
  mismatch_policy: TruthReplayMismatchPolicy;
}>;

export type TruthReplayOutputVerificationScope = Readonly<{
  tenant_id: string;
  mission_id?: string;
  allowed_output_types: readonly TruthReplayProducedOutputType[];
  allowed_fields?: readonly string[];
  restricted_fields?: readonly string[];
  verify_hash: boolean;
  verify_structure: boolean;
  verify_fields: boolean;
  verify_evidence_refs: boolean;
  verify_lineage_refs: boolean;
  verify_governance_refs: boolean;
  verify_authority: boolean;
  verify_redaction: boolean;
  allow_metadata_differences: boolean;
  metadata_fields_excluded_from_payload_hash?: readonly string[];
}>;

export type TruthReplayOutputCanonicalizationContext = Readonly<{
  canonical_serialization: TruthReplayCanonicalSerialization;
  canonical_hash_algorithm: TruthReplayHashAlgorithm;
  stable_key_ordering: true;
  stable_array_ordering: true;
  stable_null_handling: true;
  stable_timestamp_representation: true;
  excluded_metadata_fields: readonly string[];
  canonicalization_hash: string;
}>;

export type TruthReplayOutputComparisonContext = Readonly<{
  comparison_mode: TruthReplayOutputComparisonMode;
  equality_requirement: TruthReplayOutputEqualityRequirement;
  allowed_tolerance?: string;
  fail_on_unexpected_fields: boolean;
  fail_on_missing_fields: boolean;
  fail_on_type_mismatch: boolean;
  fail_on_schema_mismatch: boolean;
}>;

export type TruthReplayOutputVerificationFailureReason = Readonly<{
  code: TruthReplayOutputVerificationFailureCode;
  message: string;
  path: string;
}>;

export type TruthReplayOutputVerificationEscalationReason = TruthReplayOutputVerificationFailureReason;
export type TruthReplayOutputHashMismatch = Readonly<{ expected_hash?: string; produced_hash?: string; canonical_hash?: string }>;
export type TruthReplayStructuralMismatch = Readonly<{ field: string; reason: string }>;
export type TruthReplayFieldMismatch = Readonly<{ field: string; expected_value?: unknown; produced_value?: unknown; mismatch_type: "MISSING" | "UNEXPECTED" | "VALUE" | "TYPE" }>;

export type TruthReplayOutputHashVerification = Readonly<{
  hash_verified: boolean;
  expected_output_hash?: string;
  produced_output_hash: string;
  canonical_produced_output_hash: string;
  hash_match: boolean;
  hash_algorithm: TruthReplayHashAlgorithm;
  hash_mismatches: readonly TruthReplayOutputHashMismatch[];
  hash_verification_hash: string;
}>;

export type TruthReplayStructuralVerification = Readonly<{
  structure_verified: boolean;
  schema_version_match: boolean;
  output_type_match: boolean;
  required_fields_present: boolean;
  unexpected_fields_absent: boolean;
  field_types_match: boolean;
  array_order_valid: boolean;
  structural_mismatches: readonly TruthReplayStructuralMismatch[];
  structural_verification_hash: string;
}>;

export type TruthReplayFieldVerificationReport = Readonly<{
  fields_verified: boolean;
  matched_fields: readonly string[];
  missing_fields: readonly TruthReplayFieldMismatch[];
  unexpected_fields: readonly TruthReplayFieldMismatch[];
  mismatched_fields: readonly TruthReplayFieldMismatch[];
  field_verification_hash: string;
}>;

export type TruthReplayNamedOutputVerification = Readonly<{
  verified: boolean;
  mismatch_reasons: readonly string[];
  verification_hash: string;
}>;

export type TruthReplayOutputMismatchReport = Readonly<{
  mismatch_detected: boolean;
  mismatch_categories: readonly string[];
  mismatch_severity: TruthReplayOutputMismatchSeverity;
  mismatch_policy: TruthReplayMismatchPolicy;
  mismatch_report_hash: string;
}>;

export type TruthReplayOutputVerificationResult = Readonly<{
  result_state: TruthReplayOutputVerificationResultState;
  matched: boolean;
  mismatched: boolean;
  failed: boolean;
  unverifiable: boolean;
  certification_eligible: boolean;
  result_hash: string;
}>;

export type TruthReplayOutputVerification = Readonly<{
  verification_id: string;
  replay_id: string;
  tenant_id: string;
  mission_id?: string;
  replay_contract_ref: string;
  replay_contract_hash: string;
  input_bundle_ref: string;
  input_bundle_hash: string;
  state_package_ref: string;
  state_package_hash: string;
  replay_output_ref: string;
  replay_output_hash: string;
  original_output_ref?: string;
  original_output_hash?: string;
  expected_output: TruthReplayExpectedOutput;
  produced_output: TruthReplayProducedOutput;
  verification_type: TruthReplayOutputVerificationType;
  verification_scope: TruthReplayOutputVerificationScope;
  canonicalization_context: TruthReplayOutputCanonicalizationContext;
  comparison_context: TruthReplayOutputComparisonContext;
  hash_verification: TruthReplayOutputHashVerification;
  structural_verification: TruthReplayStructuralVerification;
  field_verification: TruthReplayFieldVerificationReport;
  governance_verification: TruthReplayNamedOutputVerification;
  authority_verification: TruthReplayNamedOutputVerification;
  evidence_verification: TruthReplayNamedOutputVerification;
  lineage_verification: TruthReplayNamedOutputVerification;
  recommendation_verification?: TruthReplayNamedOutputVerification;
  risk_verification?: TruthReplayNamedOutputVerification;
  confidence_verification?: TruthReplayNamedOutputVerification;
  escalation_verification?: TruthReplayNamedOutputVerification;
  runtime_verification?: TruthReplayNamedOutputVerification;
  mismatch_report: TruthReplayOutputMismatchReport;
  verification_result: TruthReplayOutputVerificationResult;
  lifecycle_state: TruthReplayOutputVerificationLifecycleState;
  certification_state: TruthReplayOutputVerificationCertificationState;
  failure_reasons?: readonly TruthReplayOutputVerificationFailureReason[];
  escalation_reasons?: readonly TruthReplayOutputVerificationEscalationReason[];
  audit_events: readonly TruthReplayOutputVerificationAuditEventName[];
  verification_hash: string;
  created_at: string;
  readOnly: true;
  executionAuthorized: false;
  sourceMutationAllowed: false;
  statePackageMutationAllowed: false;
  replayOutputMutationAllowed: false;
}>;

export type TruthReplayOutputVerificationRequest = Readonly<{
  verification_id: string;
  state_package: TruthReplayStatePackage;
  produced_output: TruthReplayProducedOutput;
  expected_output: TruthReplayExpectedOutput;
  verification_scope: TruthReplayOutputVerificationScope;
  comparison_context: TruthReplayOutputComparisonContext;
  created_at: string;
  original_output_ref?: string;
  original_output_hash?: string;
  force_state_package_hash_mismatch?: boolean;
  force_output_hash_mismatch?: boolean;
  force_provenance_mismatch?: boolean;
  force_expected_output_missing?: boolean;
  force_expected_hash_missing?: boolean;
  force_tenant_scope_violation?: boolean;
  force_mission_scope_violation?: boolean;
  force_restricted_field_exposed?: boolean;
  force_redaction_mismatch?: boolean;
  force_unstable_serialization?: boolean;
  force_wall_clock_field?: boolean;
  force_environment_field?: boolean;
  force_output_type_mismatch?: boolean;
  force_schema_mismatch?: boolean;
  force_required_field_missing?: boolean;
  force_unexpected_field_present?: boolean;
  force_field_value_mismatch?: boolean;
  force_policy_snapshot_changed?: boolean;
  force_current_policy_substituted?: boolean;
  force_governance_decision_mismatch?: boolean;
  force_governance_bypass?: boolean;
  force_execution_authority?: boolean;
  force_source_mutation?: boolean;
  force_authority_expansion?: boolean;
  force_evidence_ref_missing?: boolean;
  force_unexpected_evidence_added?: boolean;
  force_evidence_hash_mismatch?: boolean;
  force_lineage_relationship_missing?: boolean;
  force_causal_chain_changed?: boolean;
  force_supersession_chain_changed?: boolean;
  force_recommendation_payload_mismatch?: boolean;
  force_recommendation_rationale_mismatch?: boolean;
  force_advisory_only_changed?: boolean;
  force_risk_mismatch?: boolean;
  force_confidence_mismatch?: boolean;
  force_escalation?: boolean;
}>;

export type TruthReplayOutputVerificationStorageRecord = Readonly<{
  verification_id: string;
  replay_id: string;
  tenant_id: string;
  mission_id?: string;
  replay_contract_ref: string;
  replay_contract_hash: string;
  input_bundle_ref: string;
  input_bundle_hash: string;
  state_package_ref: string;
  state_package_hash: string;
  replay_output_ref: string;
  replay_output_hash: string;
  original_output_ref?: string;
  original_output_hash?: string;
  expected_output_json: string;
  produced_output_json: string;
  verification_type: TruthReplayOutputVerificationType;
  verification_scope_json: string;
  canonicalization_context_json: string;
  comparison_context_json: string;
  hash_verification_json: string;
  structural_verification_json: string;
  field_verification_json: string;
  governance_verification_json: string;
  authority_verification_json: string;
  evidence_verification_json: string;
  lineage_verification_json: string;
  recommendation_verification_json?: string;
  risk_verification_json?: string;
  confidence_verification_json?: string;
  mismatch_report_json: string;
  verification_result_json: string;
  lifecycle_state: TruthReplayOutputVerificationLifecycleState;
  certification_state: TruthReplayOutputVerificationCertificationState;
  failure_reasons_json?: string;
  escalation_reasons_json?: string;
  verification_hash: string;
  created_at: string;
}>;

export type TruthReplayDeterminismGateState = "REPRODUCED" | "MISMATCH" | "INCOMPLETE" | "INVALID";

export type TruthReplayDeterminismGateType =
  | "TRUTH_RECORD_DETERMINISM_GATE"
  | "EVENT_DETERMINISM_GATE"
  | "EVIDENCE_DETERMINISM_GATE"
  | "RECOMMENDATION_DETERMINISM_GATE"
  | "GOVERNANCE_DETERMINISM_GATE"
  | "LINEAGE_DETERMINISM_GATE"
  | "MISSION_DETERMINISM_GATE"
  | "FULL_CONTEXT_DETERMINISM_GATE";

export type TruthReplayDeterminismGateLifecycleState = "REQUESTED" | "EVALUATED" | "DECISION_RECORDED" | "FAILED" | "ESCALATED" | "ARCHIVED";
export type TruthReplayDeterminismGateCertificationState = "UNCERTIFIED" | "REPLAY_REPRODUCED" | "REPLAY_MISMATCHED" | "REPLAY_INCOMPLETE" | "REPLAY_INVALID";

export type TruthReplayRequiredGateArtifact = "REPLAY_CONTRACT" | "INPUT_BUNDLE" | "STATE_PACKAGE" | "OUTPUT_VERIFICATION" | "REPLAY_OUTPUT" | "EXPECTED_OUTPUT";
export type TruthReplayGateTrustState = "HIGH" | "REVIEW_REQUIRED" | "INSUFFICIENT" | "REJECTED";

export type TruthReplayDeterminismGateAuditEventName =
  | "REPLAY_DETERMINISM_GATE_REQUESTED"
  | "REPLAY_DETERMINISM_ARTIFACTS_LOADED"
  | "REPLAY_DETERMINISM_ARTIFACTS_VERIFIED"
  | "REPLAY_DETERMINISM_HASH_CHAIN_VERIFIED"
  | "REPLAY_DETERMINISM_COMPLETENESS_VERIFIED"
  | "REPLAY_DETERMINISM_VERIFIED"
  | "REPLAY_DETERMINISM_GOVERNANCE_VERIFIED"
  | "REPLAY_DETERMINISM_AUTHORITY_VERIFIED"
  | "REPLAY_DETERMINISM_EVIDENCE_VERIFIED"
  | "REPLAY_DETERMINISM_LINEAGE_VERIFIED"
  | "REPLAY_DETERMINISM_OUTPUT_STATUS_VERIFIED"
  | "REPLAY_DETERMINISM_REPRODUCED"
  | "REPLAY_DETERMINISM_MISMATCH"
  | "REPLAY_DETERMINISM_INCOMPLETE"
  | "REPLAY_DETERMINISM_INVALID"
  | "REPLAY_DETERMINISM_GATE_DECISION_RECORDED"
  | "REPLAY_DETERMINISM_GATE_ESCALATED";

export type TruthReplayGateDecisionFactorCode =
  | "ARTIFACTS_CERTIFIED"
  | "ARTIFACT_MISSING"
  | "ARTIFACT_UNCERTIFIED"
  | "HASH_CHAIN_VALID"
  | "HASH_CHAIN_INVALID"
  | "COMPLETENESS_VERIFIED"
  | "MATERIAL_INCOMPLETE"
  | "DETERMINISM_VERIFIED"
  | "NONDETERMINISM_DETECTED"
  | "GOVERNANCE_PRESERVED"
  | "GOVERNANCE_VIOLATION"
  | "AUTHORITY_PRESERVED"
  | "AUTHORITY_VIOLATION"
  | "EVIDENCE_PRESERVED"
  | "EVIDENCE_INCOMPLETE"
  | "LINEAGE_PRESERVED"
  | "LINEAGE_INCOMPLETE"
  | "OUTPUT_MATCHED"
  | "OUTPUT_MISMATCHED"
  | "OUTPUT_UNVERIFIABLE"
  | "OUTPUT_FAILED"
  | "TENANT_SCOPE_VIOLATION"
  | "MISSION_SCOPE_VIOLATION"
  | "REPLAY_TARGET_MISMATCH";

export type TruthReplayGateDecisionFactor = Readonly<{
  code: TruthReplayGateDecisionFactorCode;
  message: string;
  severity: "INFO" | "MISMATCH" | "INCOMPLETE" | "INVALID";
}>;

export type TruthReplayDeterminismGateScope = Readonly<{
  tenant_id: string;
  mission_id?: string;
  replay_type: string;
  replay_target_type: string;
  replay_target_ids: readonly string[];
  required_artifacts: readonly TruthReplayRequiredGateArtifact[];
  require_contract_certified: boolean;
  require_input_bundle_certified: boolean;
  require_state_package_certified: boolean;
  require_output_verification_certified: boolean;
  require_governance_preserved: boolean;
  require_authority_preserved: boolean;
  require_evidence_preserved: boolean;
  require_lineage_preserved: boolean;
  fail_on_unresolved_escalation: boolean;
}>;

export type TruthReplayMissingGateArtifact = Readonly<{ artifact_type: TruthReplayRequiredGateArtifact; reason: string }>;
export type TruthReplayUncertifiedGateArtifact = Readonly<{ artifact_type: TruthReplayRequiredGateArtifact; certification_state?: string }>;
export type TruthReplayGateHashMismatch = Readonly<{ artifact_type: string; expected_hash?: string; actual_hash?: string; reason: string }>;
export type TruthReplayGateMissingItem = Readonly<{ item_type: string; item_ref?: string; reason: string }>;
export type TruthReplayGateNondeterminism = Readonly<{ source: string; reason: string }>;

export type TruthReplayGateArtifactStatus = Readonly<{
  replay_contract_present: boolean;
  input_bundle_present: boolean;
  state_package_present: boolean;
  output_verification_present: boolean;
  replay_contract_certified: boolean;
  input_bundle_certified: boolean;
  state_package_certified: boolean;
  output_verification_certified: boolean;
  replay_output_present: boolean;
  expected_output_present: boolean;
  missing_artifacts: readonly TruthReplayMissingGateArtifact[];
  uncertified_artifacts: readonly TruthReplayUncertifiedGateArtifact[];
}>;

export type TruthReplayGateHashStatus = Readonly<{
  contract_hash_valid: boolean;
  input_bundle_hash_valid: boolean;
  state_package_hash_valid: boolean;
  output_verification_hash_valid: boolean;
  produced_output_hash_valid: boolean;
  expected_output_hash_valid: boolean;
  hash_chain_consistent: boolean;
  hash_mismatches: readonly TruthReplayGateHashMismatch[];
}>;

export type TruthReplayGateCompletenessStatus = Readonly<{
  complete: boolean;
  contract_complete: boolean;
  input_bundle_complete: boolean;
  state_package_complete: boolean;
  output_verification_complete: boolean;
  expected_output_complete: boolean;
  produced_output_complete: boolean;
  evidence_complete: boolean;
  lineage_complete: boolean;
  governance_complete: boolean;
  authority_complete: boolean;
  schema_complete: boolean;
  missing_required_items: readonly TruthReplayGateMissingItem[];
}>;

export type TruthReplayGateDeterminismStatus = Readonly<{
  deterministic: boolean;
  contract_deterministic: boolean;
  input_reconstruction_deterministic: boolean;
  state_reconstruction_deterministic: boolean;
  output_verification_deterministic: boolean;
  gate_decision_deterministic: boolean;
  stable_serialization_verified: boolean;
  stable_ordering_verified: boolean;
  stable_hashing_verified: boolean;
  nondeterminism_detected: readonly TruthReplayGateNondeterminism[];
}>;

export type TruthReplayGateDomainStatus = Readonly<{
  preserved: boolean;
  violations: readonly string[];
}>;

export type TruthReplayGateOutputStatus = Readonly<{
  verification_completed: boolean;
  output_matched: boolean;
  output_mismatched: boolean;
  output_unverifiable: boolean;
  output_failed: boolean;
  mismatch_categories: readonly string[];
}>;

export type TruthReplayGateMismatchSummary = Readonly<{ mismatch_categories: readonly string[]; mismatch_severity: TruthReplayOutputMismatchSeverity; mismatch_count: number }>;
export type TruthReplayGateInvaliditySummary = Readonly<{ invalidity_reasons: readonly TruthReplayGateDecisionFactor[] }>;
export type TruthReplayGateIncompletenessSummary = Readonly<{ missing_items: readonly TruthReplayGateMissingItem[]; unresolved_escalations: readonly string[] }>;

export type TruthReplayDeterminismGate = Readonly<{
  gate_id: string;
  replay_id: string;
  tenant_id: string;
  mission_id?: string;
  replay_contract_ref: string;
  replay_contract_hash: string;
  input_bundle_ref: string;
  input_bundle_hash: string;
  state_package_ref: string;
  state_package_hash: string;
  output_verification_ref: string;
  output_verification_hash: string;
  gate_type: TruthReplayDeterminismGateType;
  gate_scope: TruthReplayDeterminismGateScope;
  artifact_status: TruthReplayGateArtifactStatus;
  hash_status: TruthReplayGateHashStatus;
  completeness_status: TruthReplayGateCompletenessStatus;
  determinism_status: TruthReplayGateDeterminismStatus;
  governance_status: TruthReplayGateDomainStatus;
  authority_status: TruthReplayGateDomainStatus;
  evidence_status: TruthReplayGateDomainStatus;
  lineage_status: TruthReplayGateDomainStatus;
  output_status: TruthReplayGateOutputStatus;
  mismatch_summary?: TruthReplayGateMismatchSummary;
  invalidity_summary?: TruthReplayGateInvaliditySummary;
  incompleteness_summary?: TruthReplayGateIncompletenessSummary;
  final_state: TruthReplayDeterminismGateState;
  certification_eligible: boolean;
  operator_review_required: boolean;
  escalation_required: boolean;
  replay_execution_trust: TruthReplayGateTrustState;
  decision_reason: string;
  decision_factors: readonly TruthReplayGateDecisionFactor[];
  gate_hash: string;
  lifecycle_state: TruthReplayDeterminismGateLifecycleState;
  certification_state: TruthReplayDeterminismGateCertificationState;
  audit_events: readonly TruthReplayDeterminismGateAuditEventName[];
  created_at: string;
  readOnly: true;
  executionAuthorized: false;
  artifactMutationAllowed: false;
}>;

export type TruthReplayDeterminismGateRequest = Readonly<{
  gate_id: string;
  output_verification: TruthReplayOutputVerification;
  gate_scope: TruthReplayDeterminismGateScope;
  created_at: string;
  force_gate_contract_missing?: boolean;
  force_gate_id_missing?: boolean;
  force_replay_id_missing?: boolean;
  force_tenant_id_missing?: boolean;
  force_invalid_gate_state?: boolean;
  force_replay_contract_missing?: boolean;
  force_replay_contract_invalid?: boolean;
  force_input_bundle_missing?: boolean;
  force_input_bundle_uncertified?: boolean;
  force_state_package_missing?: boolean;
  force_state_package_uncertified?: boolean;
  force_output_verification_missing?: boolean;
  force_output_verification_uncertified?: boolean;
  force_replay_output_missing?: boolean;
  force_expected_output_missing?: boolean;
  force_contract_hash_mismatch?: boolean;
  force_input_bundle_hash_mismatch?: boolean;
  force_state_package_hash_mismatch?: boolean;
  force_output_verification_hash_mismatch?: boolean;
  force_hash_chain_broken?: boolean;
  force_artifact_provenance_mismatch?: boolean;
  force_tenant_scope_violation?: boolean;
  force_mission_scope_violation?: boolean;
  force_replay_target_mismatch?: boolean;
  force_missing_evidence?: boolean;
  force_missing_lineage?: boolean;
  force_missing_governance?: boolean;
  force_missing_schema?: boolean;
  force_unstable_serialization?: boolean;
  force_nondeterministic_ordering?: boolean;
  force_unsupported_hash_algorithm?: boolean;
  force_wall_clock_dependency?: boolean;
  force_random_dependency?: boolean;
  force_external_network_dependency?: boolean;
  force_uncontrolled_tool_dependency?: boolean;
  force_policy_snapshot_missing?: boolean;
  force_current_policy_substitution?: boolean;
  force_governance_bypass?: boolean;
  force_governance_decision_mismatch?: boolean;
  force_execution_authority?: boolean;
  force_authority_expansion?: boolean;
  force_source_mutation?: boolean;
  force_unauthorized_write?: boolean;
  force_evidence_ref_mismatch?: boolean;
  force_evidence_hash_mismatch?: boolean;
  force_lineage_ref_mismatch?: boolean;
  force_cross_tenant_lineage_edge?: boolean;
  force_unverifiable_output?: boolean;
  force_output_failed_missing_expected?: boolean;
  force_output_failed_hard_violation?: boolean;
  force_reproduced_with_mismatch_report?: boolean;
  force_reproduced_with_missing_artifact?: boolean;
  force_mismatch_without_summary?: boolean;
  force_incomplete_without_summary?: boolean;
  force_invalid_without_reason?: boolean;
  decision_factor_nonce?: string;
}>;

export type TruthReplayDeterminismGateStorageRecord = Readonly<{
  gate_id: string;
  replay_id: string;
  tenant_id: string;
  mission_id?: string;
  replay_contract_ref: string;
  replay_contract_hash: string;
  input_bundle_ref: string;
  input_bundle_hash: string;
  state_package_ref: string;
  state_package_hash: string;
  output_verification_ref: string;
  output_verification_hash: string;
  gate_type: TruthReplayDeterminismGateType;
  gate_scope_json: string;
  artifact_status_json: string;
  hash_status_json: string;
  completeness_status_json: string;
  determinism_status_json: string;
  governance_status_json: string;
  authority_status_json: string;
  evidence_status_json: string;
  lineage_status_json: string;
  output_status_json: string;
  mismatch_summary_json?: string;
  invalidity_summary_json?: string;
  incompleteness_summary_json?: string;
  final_state: TruthReplayDeterminismGateState;
  certification_eligible: boolean;
  operator_review_required: boolean;
  escalation_required: boolean;
  decision_reason: string;
  decision_factors_json: string;
  gate_hash: string;
  lifecycle_state: TruthReplayDeterminismGateLifecycleState;
  certification_state: TruthReplayDeterminismGateCertificationState;
  created_at: string;
}>;

export type TruthIntegrityType =
  | "TRUTH_RECORD_INTEGRITY"
  | "EVENT_INTEGRITY"
  | "EVIDENCE_INTEGRITY"
  | "LINEAGE_INTEGRITY"
  | "GOVERNANCE_INTEGRITY"
  | "RECOMMENDATION_INTEGRITY"
  | "RISK_INTEGRITY"
  | "CONFIDENCE_INTEGRITY"
  | "REPLAY_CONTRACT_INTEGRITY"
  | "REPLAY_INPUT_BUNDLE_INTEGRITY"
  | "REPLAY_STATE_PACKAGE_INTEGRITY"
  | "REPLAY_OUTPUT_VERIFICATION_INTEGRITY"
  | "REPLAY_DETERMINISM_GATE_INTEGRITY"
  | "SCHEMA_INTEGRITY"
  | "MISSION_INTEGRITY"
  | "FULL_CONTEXT_INTEGRITY";

export type TruthIntegrityScopeType = "RECORD" | "EVENT" | "CHAIN" | "GRAPH" | "MISSION" | "REPLAY" | "TENANT" | "FULL_CONTEXT";
export type TruthIntegrityTargetType =
  | "TRUTH_RECORD"
  | "EVENT"
  | "EVIDENCE"
  | "EVIDENCE_CHAIN"
  | "LINEAGE_GRAPH"
  | "GOVERNANCE_DECISION"
  | "POLICY_SNAPSHOT"
  | "RECOMMENDATION"
  | "RISK_RECORD"
  | "CONFIDENCE_RECORD"
  | "REPLAY_CONTRACT"
  | "REPLAY_INPUT_BUNDLE"
  | "REPLAY_STATE_PACKAGE"
  | "REPLAY_OUTPUT_VERIFICATION"
  | "REPLAY_DETERMINISM_GATE"
  | "SCHEMA"
  | "MISSION"
  | "FULL_CONTEXT";

export type TruthIntegrityRequesterType = "OPERATOR" | "SYSTEM" | "AUDITOR" | "CERTIFICATION_SUITE" | "GOVERNANCE_ENGINE";
export type TruthIntegrityResultState = "VERIFIED" | "MISMATCH" | "INCOMPLETE" | "CORRUPTED" | "UNAUTHORIZED" | "INVALID";
export type TruthIntegrityLifecycleState = "REQUESTED" | "VALIDATED" | "REJECTED" | "READY" | "ARCHIVED";
export type TruthIntegrityCertificationState = "UNCERTIFIED" | "CONTRACT_VALIDATED" | "INTEGRITY_READY" | "CONTRACT_REJECTED";
export type TruthIntegrityValidationState = "VALID" | "INVALID" | "REJECTED" | "ESCALATION_REQUIRED";

export type TruthIntegrityContractEventName =
  | "INTEGRITY_CONTRACT_CREATED"
  | "INTEGRITY_CONTRACT_VALIDATED"
  | "INTEGRITY_CONTRACT_REJECTED"
  | "INTEGRITY_TARGET_BOUND"
  | "INTEGRITY_SCOPE_VERIFIED"
  | "INTEGRITY_SOURCES_BOUND"
  | "INTEGRITY_HASH_REQUIREMENTS_BOUND"
  | "INTEGRITY_SCHEMA_REQUIREMENTS_BOUND"
  | "INTEGRITY_GOVERNANCE_BOUND"
  | "INTEGRITY_AUTHORITY_VERIFIED"
  | "INTEGRITY_EVIDENCE_CONTEXT_BOUND"
  | "INTEGRITY_LINEAGE_CONTEXT_BOUND"
  | "INTEGRITY_REPLAY_CONTEXT_BOUND"
  | "INTEGRITY_READY"
  | "INTEGRITY_CONTRACT_VALIDATION_FAILED";

export type TruthIntegrityFailureCode =
  | "INTEGRITY_CONTRACT_MISSING"
  | "INTEGRITY_CONTRACT_ID_MISSING"
  | "TENANT_ID_MISSING"
  | "MISSION_ID_MISSING"
  | "INTEGRITY_TYPE_INVALID"
  | "INTEGRITY_TARGET_MISSING"
  | "INTEGRITY_TARGET_INVALID"
  | "INTEGRITY_TYPE_TARGET_INCOMPATIBLE"
  | "INTEGRITY_SCOPE_MISSING"
  | "TENANT_SCOPE_VIOLATION"
  | "MISSION_SCOPE_VIOLATION"
  | "REDACTION_REQUIRED"
  | "REQUESTER_INVALID"
  | "READ_AUTHORITY_UNVERIFIED"
  | "SOURCE_REFS_MISSING"
  | "EXPECTED_INTEGRITY_MISSING"
  | "EXPECTED_TENANT_MISSING"
  | "EXPECTED_HASH_MISSING"
  | "EXPECTED_SCHEMA_VERSION_MISSING"
  | "EXPECTED_STATE_INVALID"
  | "OBSERVED_TENANT_MISMATCH"
  | "OBSERVED_MISSION_MISMATCH"
  | "HASH_REQUIREMENTS_INVALID"
  | "UNSUPPORTED_HASH_ALGORITHM"
  | "UNSTABLE_SERIALIZATION_ALLOWED"
  | "SCHEMA_REQUIREMENTS_INVALID"
  | "SCHEMA_SUBSTITUTION_ALLOWED"
  | "GOVERNANCE_CONTEXT_MISSING"
  | "POLICY_SNAPSHOT_MISSING"
  | "CURRENT_POLICY_SUBSTITUTION_ALLOWED"
  | "GOVERNANCE_BYPASS_ALLOWED"
  | "AUTHORITY_CONTEXT_INVALID"
  | "EXECUTION_AUTHORITY_DETECTED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "SOURCE_MUTATION_ATTEMPTED"
  | "UNAUTHORIZED_WRITE_ATTEMPTED"
  | "EVIDENCE_CONTEXT_MISSING"
  | "LINEAGE_CONTEXT_MISSING"
  | "REPLAY_CONTEXT_MISSING"
  | "REPLAY_HASH_CHAIN_MISSING"
  | "REPLAY_PROVENANCE_POLICY_MISSING"
  | "REPLAY_GATE_STATE_INVALID"
  | "FAILURE_POLICY_INVALID"
  | "PARTIAL_INTEGRITY_REQUIRES_ESCALATION"
  | "OUTPUT_POLICY_INVALID"
  | "AUDIT_POLICY_INVALID"
  | "LIFECYCLE_STATE_INVALID"
  | "CERTIFICATION_STATE_INVALID"
  | "CONTRACT_HASH_MISMATCH";

export type TruthIntegrityRequester = Readonly<{
  requester_id: string;
  requester_type: TruthIntegrityRequesterType;
  requester_reason?: string;
}>;

export type TruthIntegrityScope = Readonly<{
  scope_type: TruthIntegrityScopeType;
  allowed_tenant_ids: readonly string[];
  allowed_mission_ids?: readonly string[];
  allowed_target_types: readonly TruthIntegrityTargetType[];
  allowed_record_types?: readonly string[];
  allowed_event_types?: readonly string[];
  allowed_time_range?: Readonly<{ start: string; end: string }>;
  include_evidence: boolean;
  include_lineage: boolean;
  include_governance: boolean;
  include_replay_artifacts: boolean;
  include_schema_context: boolean;
  redaction_required: boolean;
  restricted_fields?: readonly string[];
}>;

export type TruthIntegrityTarget = Readonly<{
  target_type: TruthIntegrityTargetType;
  target_ids: readonly string[];
  target_description?: string;
}>;

export type TruthIntegritySourceRefs = Readonly<{
  truth_record_ids?: readonly string[];
  event_ids?: readonly string[];
  evidence_refs?: readonly string[];
  lineage_refs?: readonly string[];
  governance_refs?: readonly string[];
  policy_refs?: readonly string[];
  recommendation_refs?: readonly string[];
  risk_refs?: readonly string[];
  confidence_refs?: readonly string[];
  replay_refs?: readonly string[];
  schema_refs?: readonly string[];
}>;

export type TruthIntegrityExpectedHash = Readonly<{ ref: string; hash: string; algorithm: "SHA256"; canonical_serialization: "STABLE_JSON" }>;
export type TruthIntegrityObservedHash = Readonly<{ ref: string; hash: string; algorithm: "SHA256"; canonical_serialization: "STABLE_JSON"; matches_expected?: boolean }>;
export type TruthIntegrityExpectedSchemaVersion = Readonly<{ schema_ref: string; schema_version: string; schema_hash?: string }>;
export type TruthIntegrityObservedSchemaVersion = Readonly<{ schema_ref: string; schema_version: string; schema_hash?: string; matches_expected?: boolean }>;

export type TruthExpectedIntegrityState = Readonly<{
  expected_hashes: readonly TruthIntegrityExpectedHash[];
  expected_schema_versions?: readonly TruthIntegrityExpectedSchemaVersion[];
  expected_lifecycle_state?: string;
  expected_certification_state?: string;
  expected_tenant_id: string;
  expected_mission_id?: string;
  expected_governance_refs?: readonly string[];
  expected_evidence_refs?: readonly string[];
  expected_lineage_refs?: readonly string[];
  expected_replay_refs?: readonly string[];
  expected_record_count?: number;
  expected_event_count?: number;
  expected_evidence_count?: number;
  expected_lineage_edge_count?: number;
  expected_integrity_result: TruthIntegrityResultState;
}>;

export type TruthObservedIntegrityState = Readonly<{
  observed_hashes: readonly TruthIntegrityObservedHash[];
  observed_schema_versions?: readonly TruthIntegrityObservedSchemaVersion[];
  observed_lifecycle_state?: string;
  observed_certification_state?: string;
  observed_tenant_id: string;
  observed_mission_id?: string;
  observed_governance_refs?: readonly string[];
  observed_evidence_refs?: readonly string[];
  observed_lineage_refs?: readonly string[];
  observed_replay_refs?: readonly string[];
  observed_record_count?: number;
  observed_event_count?: number;
  observed_evidence_count?: number;
  observed_lineage_edge_count?: number;
  observed_integrity_result?: TruthIntegrityResultState;
}>;

export type TruthIntegrityHashRequirements = Readonly<{
  required_hash_algorithm: "SHA256";
  canonical_serialization: "STABLE_JSON";
  expected_hash_required: boolean;
  observed_hash_required: boolean;
  hash_chain_required: boolean;
  fail_on_hash_mismatch: boolean;
  unsupported_hash_algorithm_detected?: boolean;
  unstable_serialization_allowed?: boolean;
}>;

export type TruthIntegritySchemaRequirements = Readonly<{
  schema_version_required: boolean;
  schema_hash_required: boolean;
  expected_schema_versions: readonly string[];
  schema_mismatch_policy: "FAIL" | "ESCALATE";
  allow_silent_schema_substitution: boolean;
  allow_deprecated_schema: boolean;
}>;

export type TruthIntegrityGovernanceContext = Readonly<{
  policy_snapshot_id?: string;
  constitution_version?: string;
  governance_ruleset_id?: string;
  governance_decision_refs: readonly string[];
  restriction_refs?: readonly string[];
  escalation_refs?: readonly string[];
  historical_policy_required: boolean;
  current_policy_substitution_allowed: boolean;
  governance_bypass_allowed: boolean;
  fail_on_governance_mismatch: boolean;
}>;

export type TruthIntegrityAuthorityContext = Readonly<{
  requester_id: string;
  requester_type: TruthIntegrityRequesterType;
  execution_authority: "NONE";
  read_authority_verified: boolean;
  tenant_authority_verified: boolean;
  mission_authority_verified: boolean;
  write_authority_verified: boolean;
  allowed_writes: "NONE" | "INTEGRITY_AUDIT_ONLY";
  authority_expansion_allowed: boolean;
  source_mutation_allowed: boolean;
}>;

export type TruthIntegrityEvidenceContext = Readonly<{
  required_evidence_refs: readonly string[];
  supporting_evidence_refs: readonly string[];
  conflicting_evidence_refs?: readonly string[];
  evidence_hashes_required: boolean;
  relationship_policy_required: boolean;
}>;

export type TruthIntegrityLineageContext = Readonly<{
  required_lineage_refs: readonly string[];
  causal_chain_required: boolean;
  supersession_required: boolean;
  cross_tenant_lineage_fail_policy: boolean;
}>;

export type TruthIntegrityReplayContext = Readonly<{
  replay_refs: readonly string[];
  replay_hash_chain_required: boolean;
  provenance_mismatch_policy: "FAIL" | "ESCALATE";
  required_gate_state?: TruthReplayDeterminismGateState;
}>;

export type TruthIntegrityFailurePolicy = Readonly<{
  fail_on_missing_source: boolean;
  fail_on_hash_mismatch: boolean;
  fail_on_schema_mismatch: boolean;
  fail_on_governance_mismatch: boolean;
  fail_on_authority_violation: boolean;
  fail_on_tenant_violation: boolean;
  allow_partial_integrity_check: boolean;
  partial_check_requires_escalation: boolean;
}>;

export type TruthIntegrityOutputPolicy = Readonly<{
  output_type: "INTEGRITY_RESULT" | "INTEGRITY_FAILURE" | "INTEGRITY_AUDIT";
  write_to_ledger: boolean;
  mutate_source_records: boolean;
  include_expected_hashes: boolean;
  include_observed_hashes: boolean;
  include_failure_reasons: boolean;
  include_governance_context: boolean;
  include_authority_context: boolean;
}>;

export type TruthIntegrityAuditPolicy = Readonly<{
  audit_required: boolean;
  audit_record_type: "INTEGRITY_AUDIT";
  include_requester: boolean;
  include_scope: boolean;
  include_target: boolean;
  include_sources: boolean;
  include_expected_integrity: boolean;
  include_observed_integrity: boolean;
  include_hashes: boolean;
  include_schemas: boolean;
  include_governance_context: boolean;
  include_authority_context: boolean;
  include_failures: boolean;
}>;

export type TruthIntegrityContract = Readonly<{
  integrity_contract_id: string;
  tenant_id: string;
  mission_id?: string;
  integrity_type: TruthIntegrityType;
  integrity_scope: TruthIntegrityScope;
  integrity_target: TruthIntegrityTarget;
  requested_by: TruthIntegrityRequester;
  requested_at: string;
  source_refs: TruthIntegritySourceRefs;
  expected_integrity: TruthExpectedIntegrityState;
  observed_integrity?: TruthObservedIntegrityState;
  hash_requirements: TruthIntegrityHashRequirements;
  schema_requirements: TruthIntegritySchemaRequirements;
  governance_context: TruthIntegrityGovernanceContext;
  authority_context: TruthIntegrityAuthorityContext;
  evidence_context?: TruthIntegrityEvidenceContext;
  lineage_context?: TruthIntegrityLineageContext;
  replay_context?: TruthIntegrityReplayContext;
  failure_policy: TruthIntegrityFailurePolicy;
  output_policy: TruthIntegrityOutputPolicy;
  audit_policy: TruthIntegrityAuditPolicy;
  lifecycle_state: TruthIntegrityLifecycleState;
  certification_state: TruthIntegrityCertificationState;
  contract_hash?: string;
  created_at: string;
  updated_at?: string;
}>;

export type TruthIntegrityValidationIssue = Readonly<{
  code: TruthIntegrityFailureCode;
  message: string;
  path: string;
  severity: "ERROR" | "WARNING" | "ESCALATION";
}>;

export type TruthIntegrityContractValidationResult = Readonly<{
  state: TruthIntegrityValidationState;
  errors: readonly TruthIntegrityValidationIssue[];
  warnings: readonly TruthIntegrityValidationIssue[];
  escalation_reasons: readonly TruthIntegrityValidationIssue[];
  normalized_contract?: TruthIntegrityContract;
  contract_hash?: string;
  checked_at?: string;
}>;

export type TruthIntegrityContractStorageRecord = Readonly<{
  integrity_contract_id: string;
  tenant_id: string;
  mission_id?: string;
  integrity_type: TruthIntegrityType;
  integrity_scope_json: string;
  integrity_target_json: string;
  requested_by_json: string;
  requested_at: string;
  source_refs_json: string;
  expected_integrity_json: string;
  observed_integrity_json?: string;
  hash_requirements_json: string;
  schema_requirements_json: string;
  governance_context_json: string;
  authority_context_json: string;
  evidence_context_json?: string;
  lineage_context_json?: string;
  replay_context_json?: string;
  failure_policy_json: string;
  output_policy_json: string;
  audit_policy_json: string;
  lifecycle_state: TruthIntegrityLifecycleState;
  certification_state: TruthIntegrityCertificationState;
  contract_hash: string;
  created_at: string;
  updated_at?: string;
}>;

export type TruthHashChainType =
  | "TRUTH_RECORD_HASH_CHAIN"
  | "EVENT_HASH_CHAIN"
  | "EVIDENCE_HASH_CHAIN"
  | "LINEAGE_HASH_CHAIN"
  | "GOVERNANCE_HASH_CHAIN"
  | "RECOMMENDATION_HASH_CHAIN"
  | "RISK_HASH_CHAIN"
  | "CONFIDENCE_HASH_CHAIN"
  | "REPLAY_ARTIFACT_HASH_CHAIN"
  | "SCHEMA_HASH_CHAIN"
  | "MISSION_HASH_CHAIN"
  | "FULL_CONTEXT_HASH_CHAIN";

export type TruthHashChainScopeType = "RECORD" | "EVENT" | "CHAIN" | "GRAPH" | "REPLAY" | "MISSION" | "FULL_CONTEXT";
export type TruthHashChainTargetType = "TRUTH_RECORD" | "EVENT" | "EVIDENCE_CHAIN" | "LINEAGE_GRAPH" | "GOVERNANCE_DECISION" | "REPLAY_CHAIN" | "SCHEMA" | "MISSION" | "FULL_CONTEXT";
export type TruthHashChainNodeType =
  | "TRUTH_RECORD"
  | "EVENT"
  | "EVIDENCE"
  | "LINEAGE_REF"
  | "GOVERNANCE_REF"
  | "POLICY_SNAPSHOT"
  | "RECOMMENDATION"
  | "RISK_RECORD"
  | "CONFIDENCE_RECORD"
  | "REPLAY_CONTRACT"
  | "REPLAY_INPUT_BUNDLE"
  | "REPLAY_STATE_PACKAGE"
  | "REPLAY_OUTPUT_VERIFICATION"
  | "REPLAY_DETERMINISM_GATE"
  | "SCHEMA"
  | "MISSION";

export type TruthHashChainEdgeType =
  | "SEQUENCE_NEXT"
  | "PARENT_CHILD"
  | "SOURCE_OF"
  | "INFLUENCES"
  | "DEPENDS_ON"
  | "CAUSED_BY"
  | "SUPERSEDES"
  | "BRANCHES_FROM"
  | "GOVERNED_BY"
  | "SUPPORTED_BY"
  | "CONFLICTED_BY"
  | "REPLAY_DERIVES"
  | "SCHEMA_APPLIES";

export type TruthHashChainRootStrategy = "LINEAR_CHAIN_ROOT" | "MERKLE_ROOT" | "GRAPH_ROOT" | "REPLAY_CHAIN_ROOT" | "MISSION_CONTEXT_ROOT" | "FULL_CONTEXT_ROOT";
export type TruthHashChainOrderingStrategy = "LEDGER_SEQUENCE" | "TIMESTAMP_THEN_ID" | "CAUSAL_ORDER" | "LINEAGE_ORDER" | "GOVERNANCE_ORDER" | "REPLAY_ARTIFACT_ORDER" | "SCHEMA_VERSION_ORDER";
export type TruthHashChainTieBreaker = "TRUTH_RECORD_ID" | "EVENT_ID" | "SOURCE_REF" | "NODE_ID" | "HASH";
export type TruthHashChainResultState = "VERIFIED" | "MISMATCH" | "INCOMPLETE" | "CORRUPTED" | "UNAUTHORIZED" | "INVALID";
export type TruthHashChainLifecycleState = "REQUESTED" | "BUILT" | "VERIFIED" | "FAILED" | "ESCALATED" | "ARCHIVED";
export type TruthHashChainCertificationState = "UNCERTIFIED" | "CHAIN_VERIFIED" | "CHAIN_MISMATCHED" | "CHAIN_INCOMPLETE" | "CHAIN_CORRUPTED" | "CHAIN_UNAUTHORIZED" | "CHAIN_INVALID";

export type TruthHashChainAuditEventName =
  | "HASH_CHAIN_REQUESTED"
  | "HASH_CHAIN_INTEGRITY_CONTRACT_LOADED"
  | "HASH_CHAIN_SCOPE_RESOLVED"
  | "HASH_CHAIN_SOURCES_LOADED"
  | "HASH_CHAIN_ARTIFACTS_CANONICALIZED"
  | "HASH_CHAIN_NODES_BUILT"
  | "HASH_CHAIN_EDGES_BUILT"
  | "HASH_CHAIN_ORDERED"
  | "HASH_CHAIN_ROOT_COMPUTED"
  | "HASH_CHAIN_VERIFIED"
  | "HASH_CHAIN_MISMATCH_DETECTED"
  | "HASH_CHAIN_INCOMPLETE_DETECTED"
  | "HASH_CHAIN_CORRUPTION_DETECTED"
  | "HASH_CHAIN_UNAUTHORIZED_DETECTED"
  | "HASH_CHAIN_INVALID_DETECTED"
  | "HASH_CHAIN_PROOF_CREATED"
  | "HASH_CHAIN_RESULT_RECORDED"
  | "HASH_CHAIN_ESCALATED";

export type TruthHashChainFailureCode =
  | "INTEGRITY_CONTRACT_MISSING"
  | "INTEGRITY_CONTRACT_INVALID"
  | "INTEGRITY_CONTRACT_HASH_MISMATCH"
  | "HASH_CHAIN_SCOPE_MISSING"
  | "TENANT_SCOPE_VIOLATION"
  | "MISSION_SCOPE_VIOLATION"
  | "HASH_CHAIN_TARGET_MISSING"
  | "HASH_CHAIN_TARGET_INVALID"
  | "HASH_CHAIN_TYPE_TARGET_INCOMPATIBLE"
  | "SOURCE_ARTIFACT_MISSING"
  | "SOURCE_TENANT_MISMATCH"
  | "SOURCE_ARTIFACT_UNAUTHORIZED"
  | "UNSTABLE_SERIALIZATION_DETECTED"
  | "WALL_CLOCK_INJECTION_DETECTED"
  | "ENVIRONMENT_VALUE_DETECTED"
  | "NODE_INVALID"
  | "EXPECTED_NODE_HASH_MISSING"
  | "NODE_HASH_MISMATCH"
  | "CORRUPTED_NODE_DETECTED"
  | "EDGE_INVALID"
  | "EDGE_HASH_MISMATCH"
  | "EDGE_MISSING"
  | "CROSS_TENANT_EDGE_DETECTED"
  | "ORDERING_INVALID"
  | "AMBIGUOUS_ORDERING_DETECTED"
  | "CHAIN_GAP_DETECTED"
  | "REPLAY_ARTIFACT_MISSING"
  | "REPLAY_HASH_MISMATCH"
  | "REPLAY_PROVENANCE_MISMATCH"
  | "POLICY_SUBSTITUTION_DETECTED"
  | "GOVERNANCE_BYPASS_DETECTED"
  | "EVIDENCE_MISSING"
  | "EVIDENCE_HASH_MISMATCH"
  | "LINEAGE_BROKEN"
  | "SCHEMA_HASH_MISMATCH"
  | "SILENT_SCHEMA_MIGRATION_DETECTED"
  | "ROOT_HASH_MISSING"
  | "ROOT_HASH_MISMATCH"
  | "PROOF_HASH_MISMATCH"
  | "EXECUTION_AUTHORITY_DETECTED"
  | "SOURCE_MUTATION_ATTEMPTED"
  | "UNSUPPORTED_HASH_ALGORITHM";

export type TruthHashChainScope = Readonly<{
  scope_type: TruthHashChainScopeType;
  allowed_tenant_ids: readonly string[];
  allowed_mission_ids?: readonly string[];
  allowed_target_types: readonly TruthHashChainTargetType[];
  allowed_record_types?: readonly string[];
  allowed_event_types?: readonly string[];
  include_evidence: boolean;
  include_lineage: boolean;
  include_governance: boolean;
  include_replay_artifacts: boolean;
  include_schema_context: boolean;
  allowed_time_range?: Readonly<{ start: string; end: string }>;
  redaction_required: boolean;
  restricted_fields?: readonly string[];
}>;

export type TruthHashChainTarget = Readonly<{
  target_type: TruthHashChainTargetType;
  target_ids: readonly string[];
  target_description?: string;
}>;

export type TruthHashChainRequester = TruthIntegrityRequester;
export type TruthHashChainSourceRefs = TruthIntegritySourceRefs;

export type TruthHashChainCanonicalizationContext = Readonly<{
  canonical_serialization: "STABLE_JSON";
  canonical_hash_algorithm: "SHA256";
  stable_key_ordering: true;
  stable_array_ordering: true;
  stable_null_handling: true;
  stable_timestamp_representation: true;
  excluded_metadata_fields: readonly string[];
  fail_on_unstable_serialization: true;
  fail_on_wall_clock_injection: true;
  fail_on_environment_specific_values: true;
}>;

export type TruthHashChainOrderingContext = Readonly<{
  ordering_strategy: TruthHashChainOrderingStrategy;
  tie_breaker: TruthHashChainTieBreaker;
  require_total_order: true;
  ordering_hash: string;
}>;

export type TruthHashChainHashContext = Readonly<{
  hash_algorithm: "SHA256";
  canonical_serialization: "STABLE_JSON";
  require_node_hashes: boolean;
  require_edge_hashes: boolean;
  require_root_hash: boolean;
  require_schema_hashes: boolean;
  require_governance_hashes: boolean;
  require_evidence_hashes: boolean;
  require_lineage_hashes: boolean;
  require_replay_hashes: boolean;
  allow_missing_hashes: false;
  allow_hash_recalculation: boolean;
  fail_on_hash_mismatch: boolean;
  fail_on_hash_chain_gap: boolean;
  fail_on_provenance_mismatch: boolean;
}>;

export type TruthHashChainSourceArtifact = Readonly<{
  source_ref: string;
  node_type: TruthHashChainNodeType;
  tenant_id: string;
  mission_id?: string;
  payload: unknown;
  stored_hash?: string;
  observed_hash?: string;
  expected_hash?: string;
  schema_ref?: string;
  schema_hash?: string;
  governance_refs?: readonly string[];
  evidence_refs?: readonly string[];
  lineage_refs?: readonly string[];
  lifecycle_state?: string;
  certification_state?: string;
  source_order?: number;
  missing?: boolean;
  unauthorized?: boolean;
  corrupted?: boolean;
  provenance_mismatch?: boolean;
  policy_substituted?: boolean;
  governance_bypass?: boolean;
  silent_schema_migration?: boolean;
}>;

export type TruthHashChainNode = Readonly<{
  node_id: string;
  node_type: TruthHashChainNodeType;
  source_ref: string;
  tenant_id: string;
  mission_id?: string;
  canonical_payload_hash: string;
  stored_hash?: string;
  observed_hash: string;
  expected_hash?: string;
  hash_match: boolean;
  schema_ref?: string;
  schema_hash?: string;
  governance_refs?: readonly string[];
  evidence_refs?: readonly string[];
  lineage_refs?: readonly string[];
  lifecycle_state?: string;
  certification_state?: string;
  node_order: number;
  node_hash: string;
}>;

export type TruthHashChainEdge = Readonly<{
  edge_id: string;
  edge_type: TruthHashChainEdgeType;
  from_node_id: string;
  to_node_id: string;
  tenant_id: string;
  mission_id?: string;
  edge_order: number;
  edge_payload_hash: string;
  edge_hash: string;
  expected_edge_hash?: string;
  observed_edge_hash: string;
  edge_hash_match: boolean;
}>;

export type TruthHashChainEdgeSpec = Readonly<{
  edge_id?: string;
  edge_type: TruthHashChainEdgeType;
  from_source_ref: string;
  to_source_ref: string;
  tenant_id?: string;
  mission_id?: string;
  edge_order?: number;
  expected_edge_hash?: string;
  observed_edge_hash?: string;
  missing?: boolean;
  unauthorized?: boolean;
}>;

export type TruthHashChainRoot = Readonly<{
  root_id: string;
  hash_chain_id: string;
  root_strategy: TruthHashChainRootStrategy;
  node_hashes: readonly string[];
  edge_hashes: readonly string[];
  expected_root_hash?: string;
  observed_root_hash: string;
  root_hash_match: boolean;
  root_hash_algorithm: "SHA256";
  canonical_serialization: "STABLE_JSON";
}>;

export type TruthExpectedHashChainState = Readonly<{
  expected_root_hash?: string;
  expected_node_count: number;
  expected_edge_count: number;
  expected_node_hashes?: readonly string[];
  expected_edge_hashes?: readonly string[];
}>;

export type TruthObservedHashChainState = Readonly<{
  observed_root_hash: string;
  observed_node_count: number;
  observed_edge_count: number;
  observed_node_hashes: readonly string[];
  observed_edge_hashes: readonly string[];
}>;

export type TruthHashChainFailureReason = Readonly<{
  code: TruthHashChainFailureCode;
  message: string;
  result_state: TruthHashChainResultState;
  path: string;
}>;

export type TruthHashChainEscalationReason = Readonly<{
  code: TruthHashChainFailureCode;
  message: string;
  path: string;
}>;

export type TruthHashChainCompletenessReport = Readonly<{
  complete: boolean;
  required_node_count: number;
  observed_node_count: number;
  required_edge_count: number;
  observed_edge_count: number;
  missing_nodes: readonly string[];
  missing_edges: readonly string[];
  missing_hashes: readonly string[];
}>;

export type TruthHashChainIntegrityReport = Readonly<{
  deterministic: boolean;
  canonical_serialization_verified: boolean;
  ordering_verified: boolean;
  tenant_scope_preserved: boolean;
  mission_scope_preserved: boolean;
  governance_preserved: boolean;
  authority_preserved: boolean;
  evidence_preserved: boolean;
  lineage_preserved: boolean;
  replay_provenance_preserved: boolean;
  schema_context_preserved: boolean;
  node_hash_mismatches: readonly string[];
  edge_hash_mismatches: readonly string[];
  corrupted_nodes: readonly string[];
  unauthorized_nodes: readonly string[];
  invalid_edges: readonly string[];
}>;

export type TruthHashChainProof = Readonly<{
  proof_id: string;
  hash_chain_id: string;
  root_hash: string;
  node_count: number;
  edge_count: number;
  proof_path_hashes: readonly string[];
  canonicalization_context_hash: string;
  ordering_context_hash: string;
  hash_context_hash: string;
  proof_hash: string;
}>;

export type TruthHashChainExecution = Readonly<{
  hash_chain_id: string;
  integrity_contract_id: string;
  tenant_id: string;
  mission_id?: string;
  hash_chain_type: TruthHashChainType;
  hash_chain_scope: TruthHashChainScope;
  hash_chain_target: TruthHashChainTarget;
  requested_by: TruthHashChainRequester;
  requested_at: string;
  source_refs: TruthHashChainSourceRefs;
  canonicalization_context: TruthHashChainCanonicalizationContext;
  ordering_context: TruthHashChainOrderingContext;
  hash_context: TruthHashChainHashContext;
  expected_chain?: TruthExpectedHashChainState;
  observed_chain?: TruthObservedHashChainState;
  hash_nodes: readonly TruthHashChainNode[];
  hash_edges: readonly TruthHashChainEdge[];
  chain_root: TruthHashChainRoot;
  chain_proof: TruthHashChainProof;
  completeness_report: TruthHashChainCompletenessReport;
  integrity_report: TruthHashChainIntegrityReport;
  chain_result_state: TruthHashChainResultState;
  lifecycle_state: TruthHashChainLifecycleState;
  certification_state: TruthHashChainCertificationState;
  failure_reasons?: readonly TruthHashChainFailureReason[];
  escalation_reasons?: readonly TruthHashChainEscalationReason[];
  audit_events: readonly TruthHashChainAuditEventName[];
  chain_execution_hash: string;
  created_at: string;
  readOnly: true;
  sourceMutationAllowed: false;
}>;

export type TruthHashChainExecutionRequest = Readonly<{
  hash_chain_id: string;
  integrity_contract: TruthIntegrityContract;
  hash_chain_type?: TruthHashChainType;
  hash_chain_scope?: TruthHashChainScope;
  hash_chain_target?: TruthHashChainTarget;
  source_artifacts: readonly TruthHashChainSourceArtifact[];
  edge_specs?: readonly TruthHashChainEdgeSpec[];
  expected_root_hash?: string;
  expected_node_count?: number;
  expected_edge_count?: number;
  ordering_strategy?: TruthHashChainOrderingStrategy;
  tie_breaker?: TruthHashChainTieBreaker;
  root_strategy?: TruthHashChainRootStrategy;
  created_at: string;
  force_integrity_contract_missing?: boolean;
  force_integrity_contract_hash_mismatch?: boolean;
  force_hash_chain_scope_missing?: boolean;
  force_hash_chain_target_missing?: boolean;
  force_unstable_serialization?: boolean;
  force_wall_clock_injection?: boolean;
  force_environment_value?: boolean;
  force_ambiguous_ordering?: boolean;
  force_unsupported_hash_algorithm?: boolean;
  force_source_mutation?: boolean;
  force_execution_authority?: boolean;
  force_chain_gap?: boolean;
  force_missing_edge?: boolean;
  force_root_hash_mismatch?: boolean;
  force_proof_hash_mismatch?: boolean;
}>;

export type TruthHashChainExecutionStorageRecord = Readonly<{
  hash_chain_id: string;
  integrity_contract_id: string;
  tenant_id: string;
  mission_id?: string;
  hash_chain_type: TruthHashChainType;
  hash_chain_scope_json: string;
  hash_chain_target_json: string;
  requested_by_json: string;
  requested_at: string;
  source_refs_json: string;
  canonicalization_context_json: string;
  ordering_context_json: string;
  hash_context_json: string;
  expected_chain_json?: string;
  observed_chain_json?: string;
  hash_nodes_json: string;
  hash_edges_json: string;
  chain_root_json: string;
  chain_proof_json: string;
  completeness_report_json: string;
  integrity_report_json: string;
  chain_result_state: TruthHashChainResultState;
  lifecycle_state: TruthHashChainLifecycleState;
  certification_state: TruthHashChainCertificationState;
  failure_reasons_json?: string;
  escalation_reasons_json?: string;
  audit_events_json: string;
  chain_execution_hash: string;
  created_at: string;
}>;

export type TruthTamperProtectedRecordType =
  | "TRUTH_RECORD"
  | "EVENT_RECORD"
  | "EVIDENCE_RECORD"
  | "RECOMMENDATION_RECORD"
  | "GOVERNANCE_RECORD"
  | "ESCALATION_RECORD"
  | "LINEAGE_RECORD"
  | "REPLAY_RECORD"
  | "HASH_CHAIN_ENTRY"
  | "INTEGRITY_RECORD"
  | "TENANT_LEDGER_SEGMENT"
  | "ARCHIVAL_RECORD";

export type TruthTamperType =
  | "CONTENT_MUTATION"
  | "METADATA_MUTATION"
  | "HASH_MISMATCH"
  | "CHAIN_BREAK"
  | "CHAIN_REORDERING"
  | "RECORD_INSERTION"
  | "RECORD_DELETION"
  | "DUPLICATE_RECORD"
  | "LINEAGE_DRIFT"
  | "REPLAY_DIVERGENCE"
  | "EVIDENCE_REFERENCE_DRIFT"
  | "GOVERNANCE_REFERENCE_DRIFT"
  | "TENANT_BOUNDARY_DRIFT"
  | "UNAUTHORIZED_WRITE"
  | "UNAUTHORIZED_SUPERSESSION"
  | "ARCHIVAL_MISMATCH"
  | "INDEX_MISMATCH"
  | "UNKNOWN_INTEGRITY_STATE";

export type TruthTamperDetectionState = "CLEAN" | "SUSPECT" | "TAMPERED" | "INCOMPLETE" | "UNVERIFIABLE" | "INVALID";
export type TruthTamperSeverity = "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type TruthTamperScanScope = "SINGLE_RECORD" | "CHAIN_SEGMENT" | "MISSION_LEDGER" | "TENANT_LEDGER" | "REPLAY_BUNDLE" | "GOVERNANCE_SCOPE" | "FULL_INTEGRITY_SCAN";
export type TruthTamperRequesterType = "SYSTEM" | "OPERATOR" | "GOVERNANCE_ENGINE" | "CERTIFICATION_GATE";
export type TruthTamperReplayStatus = "REPLAY_VALID" | "REPLAY_MISMATCH" | "REPLAY_INCOMPLETE" | "REPLAY_NOT_TESTED";
export type TruthTamperGovernanceStatus = "GOVERNANCE_VALID" | "GOVERNANCE_VIOLATED" | "GOVERNANCE_UNVERIFIABLE";

export type TruthTamperAffectedRefs = Readonly<{
  evidence_refs?: readonly string[];
  replay_refs?: readonly string[];
  lineage_refs?: readonly string[];
  governance_refs?: readonly string[];
  recommendation_refs?: readonly string[];
}>;

export type TruthTamperDetectionFinding = Readonly<{
  finding_id: string;
  tenant_id: string;
  mission_id?: string;
  scan_id: string;
  scan_timestamp: string;
  protected_record_type: TruthTamperProtectedRecordType;
  protected_record_id: string;
  detection_state: TruthTamperDetectionState;
  tamper_type?: TruthTamperType;
  severity: TruthTamperSeverity;
  expected_hash?: string;
  observed_hash?: string;
  expected_parent_hash?: string;
  observed_parent_hash?: string;
  expected_sequence?: number;
  observed_sequence?: number;
  affected_chain_id?: string;
  affected_chain_segment?: Readonly<{ start_record_id: string; end_record_id: string }>;
  affected_refs?: TruthTamperAffectedRefs;
  replay_status?: TruthTamperReplayStatus;
  governance_status?: TruthTamperGovernanceStatus;
  escalation_required: boolean;
  operator_review_required: boolean;
  rationale: readonly string[];
  created_at: string;
}>;

export type TruthTamperScanRequest = Readonly<{
  scan_id: string;
  tenant_id: string;
  scope: TruthTamperScanScope;
  target_record_id?: string;
  target_chain_id?: string;
  mission_id?: string;
  start_record_id?: string;
  end_record_id?: string;
  include_replay_check: boolean;
  include_lineage_check: boolean;
  include_evidence_check: boolean;
  include_governance_check: boolean;
  include_tenant_boundary_check: boolean;
  requested_by: TruthTamperRequesterType;
  requested_at: string;
}>;

export type TruthTamperProtectedRecord = Readonly<{
  protected_record_type: TruthTamperProtectedRecordType;
  protected_record_id: string;
  tenant_id: string;
  mission_id?: string;
  chain_id?: string;
  sequence?: number;
  parent_hash?: string;
  payload: unknown;
  metadata?: Record<string, unknown>;
  stored_hash?: string;
  expected_hash?: string;
  expected_parent_hash?: string;
  expected_sequence?: number;
  evidence_refs?: readonly string[];
  expected_evidence_refs?: readonly string[];
  replay_refs?: readonly string[];
  expected_replay_refs?: readonly string[];
  lineage_refs?: readonly string[];
  expected_lineage_refs?: readonly string[];
  governance_refs?: readonly string[];
  expected_governance_refs?: readonly string[];
  recommendation_refs?: readonly string[];
  expected_recommendation_refs?: readonly string[];
  lifecycle_state?: string;
  expected_lifecycle_state?: string;
  supersession_authorized?: boolean;
  archival_hash?: string;
  archive_manifest_present?: boolean;
  index_record_hash?: string;
  index_tenant_id?: string;
  replay_status?: TruthTamperReplayStatus;
  governance_status?: TruthTamperGovernanceStatus;
  missing?: boolean;
  inserted?: boolean;
  duplicate?: boolean;
  unauthorized_write?: boolean;
  unauthorized_supersession?: boolean;
  canonicalization_failed?: boolean;
  unknown_integrity_state?: boolean;
}>;

export type TruthTamperFindingLedgerRecord = Readonly<{
  finding_record_id: string;
  finding_id: string;
  tenant_id: string;
  mission_id?: string;
  detection_state: TruthTamperDetectionState;
  tamper_type?: TruthTamperType;
  severity: TruthTamperSeverity;
  protected_record_id: string;
  protected_record_type: TruthTamperProtectedRecordType;
  expected_hash?: string;
  observed_hash?: string;
  affected_chain_id?: string;
  affected_replay_refs?: readonly string[];
  affected_lineage_refs?: readonly string[];
  affected_evidence_refs?: readonly string[];
  affected_governance_refs?: readonly string[];
  escalation_required: boolean;
  operator_review_required: boolean;
  scan_id: string;
  created_at: string;
}>;

export type TruthTamperScanResult = Readonly<{
  scan_id: string;
  tenant_id: string;
  mission_id?: string;
  scope: TruthTamperScanScope;
  detection_state: TruthTamperDetectionState;
  findings: readonly TruthTamperDetectionFinding[];
  ledger_records: readonly TruthTamperFindingLedgerRecord[];
  certification_blocked: boolean;
  escalation_required: boolean;
  operator_review_required: boolean;
  scan_hash: string;
  created_at: string;
  appendOnly: true;
  sourceMutationAllowed: false;
}>;

export type TruthIntegrityVerificationScope =
  | "SINGLE_RECORD"
  | "CHAIN_SEGMENT"
  | "MISSION_LEDGER"
  | "TENANT_LEDGER"
  | "REPLAY_BUNDLE"
  | "EVIDENCE_BUNDLE"
  | "LINEAGE_GRAPH"
  | "GOVERNANCE_SCOPE"
  | "ARCHIVE_PACKAGE"
  | "CERTIFICATION_SCOPE"
  | "FULL_INTEGRITY_SCOPE";

export type TruthIntegrityVerificationTrigger =
  | "ON_WRITE"
  | "ON_READ"
  | "ON_REPLAY"
  | "ON_CERTIFICATION"
  | "ON_OPERATOR_REQUEST"
  | "ON_GOVERNANCE_REVIEW"
  | "ON_TAMPER_ALERT"
  | "ON_ARCHIVAL_RESTORE"
  | "ON_SCHEDULED_SCAN"
  | "ON_DEPLOYMENT_GATE";

export type TruthIntegrityVerificationState = "VERIFIED" | "PARTIALLY_VERIFIED" | "DEGRADED" | "FAILED" | "INCOMPLETE" | "UNVERIFIABLE" | "INVALID";
export type TruthIntegrityCertificationDecision = "CERTIFIABLE" | "CONDITIONAL_CERTIFICATION" | "NOT_CERTIFIABLE" | "CERTIFICATION_BLOCKED";
export type TruthIntegrityVerificationMode = "STRICT" | "STANDARD" | "FAST" | "CERTIFICATION" | "FORENSIC";
export type TruthIntegrityVerificationRequesterType = "SYSTEM" | "OPERATOR" | "GOVERNANCE_ENGINE" | "REPLAY_ENGINE" | "CERTIFICATION_GATE" | "TAMPER_DETECTION_ENGINE";
export type TruthVerificationCheckStatus = "PASS" | "WARN" | "FAIL" | "SKIPPED" | "INCOMPLETE" | "UNVERIFIABLE" | "INVALID";

export type TruthIntegrityVerificationOptions = Readonly<{
  include_schema_validation: boolean;
  include_hash_validation: boolean;
  include_chain_validation: boolean;
  include_tamper_detection: boolean;
  include_lineage_validation: boolean;
  include_replay_validation: boolean;
  include_evidence_validation: boolean;
  include_governance_validation: boolean;
  include_tenant_boundary_validation: boolean;
  include_archive_validation: boolean;
  include_index_validation: boolean;
  fail_closed: boolean;
}>;

export type TruthIntegrityVerificationRequest = Readonly<{
  verification_request_id: string;
  tenant_id: string;
  mission_id?: string;
  scope: TruthIntegrityVerificationScope;
  trigger: TruthIntegrityVerificationTrigger;
  mode?: TruthIntegrityVerificationMode;
  target_record_id?: string;
  target_record_ids?: readonly string[];
  target_chain_id?: string;
  start_record_id?: string;
  end_record_id?: string;
  replay_bundle_id?: string;
  evidence_bundle_id?: string;
  lineage_graph_id?: string;
  governance_scope_id?: string;
  archive_package_id?: string;
  certification_scope_id?: string;
  requested_by: TruthIntegrityVerificationRequesterType;
  requested_at: string;
  options: TruthIntegrityVerificationOptions;
}>;

export type TruthVerificationCheckResult = Readonly<{
  status: TruthVerificationCheckStatus;
  required: boolean;
  finding_refs?: readonly string[];
  expected_value?: string;
  observed_value?: string;
  rationale: readonly string[];
}>;

export type TruthIntegrityVerificationChecks = Readonly<{
  schema_check: TruthVerificationCheckResult;
  identity_check: TruthVerificationCheckResult;
  hash_check: TruthVerificationCheckResult;
  chain_check: TruthVerificationCheckResult;
  tamper_check: TruthVerificationCheckResult;
  lineage_check: TruthVerificationCheckResult;
  replay_check: TruthVerificationCheckResult;
  evidence_check: TruthVerificationCheckResult;
  governance_check: TruthVerificationCheckResult;
  tenant_boundary_check: TruthVerificationCheckResult;
  archive_check: TruthVerificationCheckResult;
  index_check: TruthVerificationCheckResult;
}>;

export type TruthIntegrityVerificationResult = Readonly<{
  verification_result_id: string;
  verification_request_id: string;
  tenant_id: string;
  mission_id?: string;
  scope: TruthIntegrityVerificationScope;
  trigger: TruthIntegrityVerificationTrigger;
  verification_state: TruthIntegrityVerificationState;
  certification_decision: TruthIntegrityCertificationDecision;
  verified_record_ids: readonly string[];
  failed_record_ids: readonly string[];
  unverifiable_record_ids: readonly string[];
  checks: TruthIntegrityVerificationChecks;
  tamper_findings?: readonly string[];
  integrity_findings?: readonly string[];
  replay_findings?: readonly string[];
  governance_findings?: readonly string[];
  lineage_findings?: readonly string[];
  affected_chain_ids?: readonly string[];
  affected_replay_refs?: readonly string[];
  affected_evidence_refs?: readonly string[];
  affected_lineage_refs?: readonly string[];
  affected_governance_refs?: readonly string[];
  escalation_required: boolean;
  operator_review_required: boolean;
  certification_blocked: boolean;
  rationale: readonly string[];
  started_at: string;
  completed_at: string;
  result_hash: string;
  appendOnly: true;
  sourceMutationAllowed: false;
}>;

export type TruthIntegrityVerificationLedgerRecord = Readonly<{
  verification_record_id: string;
  verification_result_id: string;
  verification_request_id: string;
  tenant_id: string;
  mission_id?: string;
  scope: TruthIntegrityVerificationScope;
  trigger: TruthIntegrityVerificationTrigger;
  verification_state: TruthIntegrityVerificationState;
  certification_decision: TruthIntegrityCertificationDecision;
  failed_record_ids_json: string;
  unverifiable_record_ids_json: string;
  checks_json: string;
  rationale_json: string;
  result_hash: string;
  created_at: string;
}>;

export type TruthIntegrityOperatorVisibilityReport = Readonly<{
  verification_result_id: string;
  summary: string;
  checked_scope: TruthIntegrityVerificationScope;
  checked_records: readonly string[];
  failed_checks: readonly string[];
  unverifiable_checks: readonly string[];
  certification_decision: TruthIntegrityCertificationDecision;
  escalation_required: boolean;
  operator_review_required: boolean;
  rationale: readonly string[];
}>;

export type TruthIntegrityFinalCertificationState = "VALID" | "DEGRADED" | "CORRUPTED";

export type TruthIntegrityCertificationScope =
  | "SINGLE_RECORD"
  | "CHAIN_SEGMENT"
  | "MISSION_LEDGER"
  | "TENANT_LEDGER"
  | "REPLAY_BUNDLE"
  | "EVIDENCE_BUNDLE"
  | "LINEAGE_GRAPH"
  | "GOVERNANCE_SCOPE"
  | "ARCHIVE_PACKAGE"
  | "FULL_INTEGRITY_SCOPE";

export type TruthIntegrityCertificationRequesterType =
  | "SYSTEM"
  | "OPERATOR"
  | "GOVERNANCE_ENGINE"
  | "REPLAY_ENGINE"
  | "CERTIFICATION_GATE"
  | "DEPLOYMENT_GATE";

export type TruthIntegrityCertificationCategory =
  | "Contract Integrity"
  | "Identity Integrity"
  | "Hash Integrity"
  | "Chain Integrity"
  | "Tamper Integrity"
  | "Lineage Integrity"
  | "Evidence Integrity"
  | "Replay Integrity"
  | "Governance Integrity"
  | "Tenant Integrity"
  | "Archive Integrity"
  | "Index Integrity"
  | "Certification Result Integrity";

export type TruthIntegrityCertificationGateInput = Readonly<{
  certification_request_id: string;
  tenant_id: string;
  mission_id?: string;
  certification_scope: TruthIntegrityCertificationScope;
  target_record_ids?: readonly string[];
  target_chain_ids?: readonly string[];
  replay_bundle_ids?: readonly string[];
  evidence_bundle_ids?: readonly string[];
  lineage_graph_ids?: readonly string[];
  governance_scope_ids?: readonly string[];
  archive_package_ids?: readonly string[];
  verification_result_ids: readonly string[];
  tamper_finding_ids?: readonly string[];
  integrity_finding_ids?: readonly string[];
  replay_finding_ids?: readonly string[];
  governance_finding_ids?: readonly string[];
  lineage_finding_ids?: readonly string[];
  requested_by: TruthIntegrityCertificationRequesterType;
  requested_at: string;
  require_full_verification: boolean;
  allow_degraded_state: boolean;
  fail_closed: boolean;
}>;

export type TruthIntegrityCertificationGateResult = Readonly<{
  certification_result_id: string;
  certification_request_id: string;
  tenant_id: string;
  mission_id?: string;
  certification_scope: TruthIntegrityCertificationScope;
  state: TruthIntegrityFinalCertificationState;
  valid_targets: readonly string[];
  degraded_targets: readonly string[];
  corrupted_targets: readonly string[];
  passed_categories: readonly TruthIntegrityCertificationCategory[];
  degraded_categories: readonly TruthIntegrityCertificationCategory[];
  failed_categories: readonly TruthIntegrityCertificationCategory[];
  verification_result_ids: readonly string[];
  tamper_finding_ids?: readonly string[];
  integrity_finding_ids?: readonly string[];
  replay_finding_ids?: readonly string[];
  governance_finding_ids?: readonly string[];
  lineage_finding_ids?: readonly string[];
  certification_allowed: boolean;
  conditional_certification_allowed: boolean;
  replay_allowed: boolean;
  governance_review_required: boolean;
  operator_review_required: boolean;
  escalation_required: boolean;
  blocking_reasons: readonly string[];
  warnings: readonly string[];
  rationale: readonly string[];
  result_hash: string;
  certified_at: string;
  appendOnly: true;
  sourceMutationAllowed: false;
}>;

export type TruthIntegrityCertificationLedgerRecord = Readonly<{
  certification_ledger_record_id: string;
  certification_result_id: string;
  certification_request_id: string;
  tenant_id: string;
  mission_id?: string;
  certification_scope: TruthIntegrityCertificationScope;
  state: TruthIntegrityFinalCertificationState;
  target_record_ids?: readonly string[];
  target_chain_ids?: readonly string[];
  verification_result_ids: readonly string[];
  finding_refs: readonly string[];
  passed_categories: readonly TruthIntegrityCertificationCategory[];
  degraded_categories: readonly TruthIntegrityCertificationCategory[];
  failed_categories: readonly TruthIntegrityCertificationCategory[];
  certification_allowed: boolean;
  conditional_certification_allowed: boolean;
  replay_allowed: boolean;
  operator_review_required: boolean;
  governance_review_required: boolean;
  escalation_required: boolean;
  blocking_reasons: readonly string[];
  warnings: readonly string[];
  rationale: readonly string[];
  result_hash: string;
  previous_certification_hash?: string;
  created_at: string;
  appendOnly: true;
  sourceMutationAllowed: false;
}>;

export type TruthIntegrityCertificationOperatorVisibilityReport = Readonly<{
  certification_result_id: string;
  summary: string;
  certification_state: TruthIntegrityFinalCertificationState;
  certification_scope: TruthIntegrityCertificationScope;
  tenant_id: string;
  mission_id?: string;
  valid_targets: readonly string[];
  degraded_targets: readonly string[];
  corrupted_targets: readonly string[];
  blocking_reasons: readonly string[];
  warnings: readonly string[];
  replay_status: "ALLOWED" | "LIMITED" | "BLOCKED";
  governance_status: "CLEAR" | "REVIEW_REQUIRED";
  escalation_status: "NONE" | "ESCALATION_REQUIRED";
  result_hash: string;
  previous_certification_hash?: string;
}>;

export type TruthLedgerQueryRequesterType =
  | "OPERATOR"
  | "GOVERNANCE_ENGINE"
  | "REPLAY_ENGINE"
  | "CERTIFICATION_GATE"
  | "INTEGRITY_SERVICE"
  | "OBSERVABILITY_SURFACE"
  | "MISSION_CONTROL_SERVICE"
  | "EXTERNAL_SYSTEM";

export type QueryRequesterType = TruthLedgerQueryRequesterType;

export type TruthLedgerQueryType =
  | "TRUTH_RECORD_LOOKUP"
  | "EVENT_LOOKUP"
  | "EVIDENCE_LOOKUP"
  | "RECOMMENDATION_LOOKUP"
  | "GOVERNANCE_LOOKUP"
  | "ESCALATION_LOOKUP"
  | "LINEAGE_LOOKUP"
  | "REPLAY_LOOKUP"
  | "INTEGRITY_LOOKUP"
  | "CERTIFICATION_LOOKUP"
  | "TIMELINE_QUERY"
  | "RELATIONSHIP_QUERY"
  | "AUDIT_QUERY";

export type QueryType = TruthLedgerQueryType;

export type TruthLedgerRequestedEventType =
  | "INPUT"
  | "OUTPUT"
  | "DECISION"
  | "RECOMMENDATION"
  | "RISK"
  | "CONFIDENCE"
  | "VIOLATION"
  | "GOVERNANCE"
  | "ESCALATION"
  | "RUNTIME";

export type TruthLedgerRequestedView =
  | "RAW_RECORD"
  | "SUMMARY"
  | "OPERATOR_VIEW"
  | "GOVERNANCE_VIEW"
  | "REPLAY_VIEW"
  | "EVIDENCE_VIEW"
  | "LINEAGE_VIEW"
  | "INTEGRITY_VIEW"
  | "CERTIFICATION_VIEW"
  | "REDACTED_VIEW";

export type RequestedView = TruthLedgerRequestedView;

export type TruthLedgerTenantScope = Readonly<{
  tenant_id: string;
  allow_cross_tenant: boolean;
  cross_tenant_authorization_ref?: string;
}>;

export type TruthLedgerMissionScope = Readonly<{
  mission_id: string;
}>;

export type TruthLedgerTimeScope = Readonly<{
  created_after?: string;
  created_before?: string;
}>;

export type TruthLedgerRecordScope = Readonly<{
  record_ids?: readonly string[];
  include_superseded?: boolean;
  include_archived?: boolean;
}>;

export type TruthLedgerLineageScope = Readonly<{
  root_record_id?: string;
  max_depth?: number;
  include_parent_edges: boolean;
  include_child_edges: boolean;
}>;

export type TruthLedgerReplayScope = Readonly<{
  replay_ref?: string;
  include_inputs: boolean;
  include_outputs: boolean;
  include_hashes: boolean;
}>;

export type TruthLedgerGovernanceScope = Readonly<{
  governance_ref?: string;
  include_restrictions: boolean;
  include_escalations: boolean;
}>;

export type TruthLedgerQueryScope = Readonly<{
  tenant_scope: TruthLedgerTenantScope;
  mission_scope?: TruthLedgerMissionScope;
  time_scope?: TruthLedgerTimeScope;
  record_scope?: TruthLedgerRecordScope;
  lineage_scope?: TruthLedgerLineageScope;
  replay_scope?: TruthLedgerReplayScope;
  governance_scope?: TruthLedgerGovernanceScope;
}>;

export type QueryScope = TruthLedgerQueryScope;

export type TruthLedgerRequestedRecordCriteria = Readonly<{
  truth_record_ids?: readonly string[];
  event_types?: readonly TruthLedgerRequestedEventType[];
  lifecycle_states?: readonly TruthLifecycleState[];
  evidence_refs?: readonly string[];
  replay_refs?: readonly string[];
  governance_refs?: readonly string[];
  lineage_refs?: readonly string[];
  integrity_states?: readonly TruthIntegrityFinalCertificationState[];
  certification_states?: readonly TruthIntegrityFinalCertificationState[];
  created_after?: string;
  created_before?: string;
}>;

export type RequestedRecordCriteria = TruthLedgerRequestedRecordCriteria;

export type TruthLedgerAuthorityContext = Readonly<{
  authority_id?: string;
  operator_role?: string;
  permissions: readonly string[];
  authority_scope: readonly string[];
  authority_verified: boolean;
  verification_ref?: string;
}>;

export type AuthorityContext = TruthLedgerAuthorityContext;

export type TruthLedgerGovernanceContext = Readonly<{
  governance_policy_refs: readonly string[];
  constitutional_rules_applied: readonly string[];
  restrictions: readonly string[];
  escalation_required: boolean;
  fail_closed_required: boolean;
}>;

export type GovernanceContext = TruthLedgerGovernanceContext;

export type TruthLedgerQueryIntegrityRequirements = Readonly<{
  require_hash_validation: boolean;
  require_chain_validation: boolean;
  require_tamper_check: boolean;
  minimum_integrity_state: TruthIntegrityFinalCertificationState;
}>;

export type QueryIntegrityRequirements = TruthLedgerQueryIntegrityRequirements;

export type TruthLedgerQueryReplayRequirements = Readonly<{
  replay_required: boolean;
  deterministic_order_required: boolean;
  include_query_hash: boolean;
  include_result_hash: boolean;
  replay_ref?: string;
}>;

export type QueryReplayRequirements = TruthLedgerQueryReplayRequirements;

export type TruthLedgerRedactionLevel = "NONE" | "PARTIAL" | "SUMMARY_ONLY" | "DENY";
export type RedactionLevel = TruthLedgerRedactionLevel;

export type TruthLedgerRedactionPolicy = Readonly<{
  redaction_required: boolean;
  redaction_level: TruthLedgerRedactionLevel;
  restricted_fields: readonly string[];
  reason: string;
}>;

export type RedactionPolicy = TruthLedgerRedactionPolicy;

export type TruthLedgerPaginationPolicy = Readonly<{
  limit: number;
  cursor?: string;
  deterministic_cursor_required: boolean;
}>;

export type PaginationPolicy = TruthLedgerPaginationPolicy;

export type TruthLedgerOrderingPolicy = Readonly<{
  order_by: "created_at" | "truth_record_id" | "event_sequence" | "lineage_depth";
  direction: "ASC" | "DESC";
  tie_breaker: "truth_record_id";
}>;

export type OrderingPolicy = TruthLedgerOrderingPolicy;

export type TruthLedgerQueryLifecycleState =
  | "CREATED"
  | "VALIDATED"
  | "AUTHORIZED"
  | "DENIED"
  | "EXECUTED"
  | "PARTIALLY_REDACTED"
  | "FAILED"
  | "EXPIRED"
  | "ESCALATED";

export type QueryLifecycleState = TruthLedgerQueryLifecycleState;

export type TruthLedgerQueryResultState =
  | "COMPLETE"
  | "PARTIAL"
  | "EMPTY"
  | "REDACTED"
  | "DENIED"
  | "INVALID"
  | "INTEGRITY_BLOCKED"
  | "GOVERNANCE_BLOCKED"
  | "AUTHORITY_BLOCKED";

export type QueryResultState = TruthLedgerQueryResultState;

export type TruthLedgerQueryContract = Readonly<{
  query_id: string;
  tenant_id: string;
  mission_id?: string;
  operator_id?: string;
  requester_type: TruthLedgerQueryRequesterType;
  query_type: TruthLedgerQueryType;
  query_scope: TruthLedgerQueryScope;
  requested_records: TruthLedgerRequestedRecordCriteria;
  requested_views: readonly TruthLedgerRequestedView[];
  authority_context: TruthLedgerAuthorityContext;
  governance_context: TruthLedgerGovernanceContext;
  integrity_requirements: TruthLedgerQueryIntegrityRequirements;
  replay_requirements: TruthLedgerQueryReplayRequirements;
  redaction_policy: TruthLedgerRedactionPolicy;
  pagination_policy: TruthLedgerPaginationPolicy;
  ordering_policy: TruthLedgerOrderingPolicy;
  created_at: string;
  expires_at?: string;
  query_reason: string;
  correlation_id?: string;
}>;

export type TruthLedgerQueryValidationReasonCode =
  | "QUERY_ID_PRESENT"
  | "QUERY_ID_MISSING"
  | "TENANT_SCOPE_PRESENT"
  | "TENANT_SCOPE_MISSING"
  | "REQUESTER_TYPE_VALID"
  | "REQUESTER_TYPE_INVALID"
  | "QUERY_TYPE_VALID"
  | "QUERY_TYPE_INVALID"
  | "REQUESTED_RECORDS_PRESENT"
  | "REQUESTED_RECORDS_MISSING"
  | "REQUESTED_VIEWS_PRESENT"
  | "REQUESTED_VIEWS_MISSING"
  | "AUTHORITY_CONTEXT_PRESENT"
  | "AUTHORITY_CONTEXT_MISSING"
  | "AUTHORITY_VERIFIED"
  | "AUTHORITY_BLOCKED"
  | "GOVERNANCE_CONTEXT_PRESENT"
  | "GOVERNANCE_CONTEXT_MISSING"
  | "GOVERNANCE_EVALUATED"
  | "GOVERNANCE_BLOCKED"
  | "INTEGRITY_REQUIREMENTS_PRESENT"
  | "INTEGRITY_REQUIREMENTS_MISSING"
  | "INTEGRITY_REQUIREMENTS_SATISFIED"
  | "INTEGRITY_BLOCKED"
  | "REPLAY_REQUIREMENTS_PRESENT"
  | "REPLAY_REQUIREMENTS_MISSING"
  | "REPLAYABLE_QUERY"
  | "REPLAY_REQUIREMENTS_FAILED"
  | "REDACTION_POLICY_PRESENT"
  | "REDACTION_POLICY_MISSING"
  | "REDACTION_POLICY_SATISFIED"
  | "REDACTION_POLICY_FAILED"
  | "DETERMINISTIC_ORDERING_PRESENT"
  | "NONDETERMINISTIC_ORDERING"
  | "PAGINATION_POLICY_VALID"
  | "PAGINATION_POLICY_INVALID"
  | "QUERY_REASON_PRESENT"
  | "QUERY_REASON_MISSING"
  | "CROSS_TENANT_AUTHORIZED"
  | "CROSS_TENANT_BLOCKED"
  | "QUERY_NOT_EXPIRED"
  | "QUERY_EXPIRED"
  | "READ_ONLY_CONTRACT"
  | "MUTATION_ATTEMPT_BLOCKED"
  | "QUERY_HASH_GENERATED"
  | "RESULT_HASH_GENERATED";

export type TruthLedgerQueryValidationContext = Readonly<{
  now?: string;
  observed_integrity_state?: TruthIntegrityFinalCertificationState;
  restricted_fields_requested?: readonly string[];
  mutation_attempted?: boolean;
  governance_evaluated?: boolean;
  result_payload?: unknown;
}>;

export type TruthLedgerQueryContractValidation = Readonly<{
  query_id: string;
  valid: boolean;
  lifecycle_state: TruthLedgerQueryLifecycleState;
  result_state: TruthLedgerQueryResultState;
  reason_codes: readonly TruthLedgerQueryValidationReasonCode[];
  errors: readonly string[];
  warnings: readonly string[];
  query_hash: string;
  result_hash?: string;
  replayable: boolean;
  tenant_scoped: boolean;
  readOnly: true;
  sourceMutationAllowed: false;
}>;

export type TruthLedgerQueryAuditMetadata = Readonly<{
  query_id: string;
  requester_type: TruthLedgerQueryRequesterType;
  tenant_id: string;
  mission_id?: string;
  query_type: TruthLedgerQueryType;
  query_hash: string;
  result_hash?: string;
  result_state: TruthLedgerQueryResultState;
  executed_at?: string;
  governance_decision_ref?: string;
  authority_decision_ref?: string;
  integrity_decision_ref?: string;
}>;

export type TruthLedgerSearchLookupType =
  | "RECOMMENDATION_LOOKUP"
  | "DECISION_LOOKUP"
  | "EVIDENCE_LOOKUP";

export type SearchLookupType = TruthLedgerSearchLookupType;

export type TruthLedgerSearchMode =
  | "ID_LOOKUP"
  | "FIELD_MATCH"
  | "TYPE_FILTER"
  | "TIME_WINDOW"
  | "RELATIONSHIP_SEARCH"
  | "LINEAGE_SEARCH"
  | "TEXT_SEARCH"
  | "COMBINED_SEARCH";

export type SearchMode = TruthLedgerSearchMode;

export type TruthLedgerRecommendationState =
  | "PROPOSED"
  | "SUPPORTED"
  | "RESTRICTED"
  | "REJECTED"
  | "SUPERSEDED"
  | "ESCALATED"
  | "ARCHIVED";

export type RecommendationState = TruthLedgerRecommendationState;

export type TruthLedgerDecisionState =
  | "PROPOSED"
  | "PENDING_OPERATOR_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "DEFERRED"
  | "ESCALATED"
  | "SUPERSEDED"
  | "ARCHIVED";

export type DecisionState = TruthLedgerDecisionState;

export type TruthLedgerEvidenceType =
  | "INPUT"
  | "DOCUMENT"
  | "SIGNAL"
  | "OBSERVATION"
  | "EVENT"
  | "RUNTIME_TRACE"
  | "GOVERNANCE_RECORD"
  | "REPLAY_RECORD"
  | "HASH_RECORD"
  | "OPERATOR_NOTE";

export type EvidenceType = TruthLedgerEvidenceType;

export type TruthLedgerEvidenceState =
  | "REGISTERED"
  | "VERIFIED"
  | "DEGRADED"
  | "CONFLICTING"
  | "RESTRICTED"
  | "SUPERSEDED"
  | "ARCHIVED";

export type EvidenceState = TruthLedgerEvidenceState;

export type TruthLedgerSearchView =
  | "SUMMARY_VIEW"
  | "OPERATOR_VIEW"
  | "GOVERNANCE_VIEW"
  | "REPLAY_VIEW"
  | "LINEAGE_VIEW"
  | "EVIDENCE_VIEW"
  | "INTEGRITY_VIEW"
  | "CERTIFICATION_VIEW"
  | "REDACTED_VIEW";

export type SearchView = TruthLedgerSearchView;

export type TruthLedgerSearchVisibilityState =
  | "VISIBLE"
  | "PARTIALLY_VISIBLE"
  | "SUMMARY_ONLY"
  | "RESTRICTED"
  | "DENIED";

export type SearchVisibilityState = TruthLedgerSearchVisibilityState;

export type TruthLedgerSearchResultState =
  | "COMPLETE"
  | "PARTIAL"
  | "EMPTY"
  | "REDACTED"
  | "DENIED"
  | "INVALID_QUERY"
  | "AUTHORITY_BLOCKED"
  | "GOVERNANCE_BLOCKED"
  | "INTEGRITY_BLOCKED"
  | "REPLAY_REQUIRED"
  | "FAILED";

export type SearchResultState = TruthLedgerSearchResultState;

export type TruthLedgerSearchGovernanceDecision =
  | "ALLOW"
  | "ALLOW_WITH_REDACTION"
  | "SUMMARY_ONLY"
  | "DENY"
  | "ESCALATE";

export type SearchGovernanceDecision = TruthLedgerSearchGovernanceDecision;

export type TruthLedgerSearchFilters = Readonly<{
  truth_record_ids?: readonly string[];
  recommendation_ids?: readonly string[];
  decision_ids?: readonly string[];
  evidence_ids?: readonly string[];
  event_types?: readonly TruthEventType[];
  lifecycle_states?: readonly TruthLifecycleState[];
  recommendation_states?: readonly TruthLedgerRecommendationState[];
  decision_states?: readonly TruthLedgerDecisionState[];
  evidence_states?: readonly TruthLedgerEvidenceState[];
  integrity_states?: readonly TruthIntegrityFinalCertificationState[];
  certification_states?: readonly TruthIntegrityFinalCertificationState[];
  created_after?: string;
  created_before?: string;
  parent_record_id?: string;
  child_record_id?: string;
  supports_record_id?: string;
  conflicts_with_record_id?: string;
  depends_on_record_id?: string;
  influenced_record_id?: string;
  governance_refs?: readonly string[];
  replay_refs?: readonly string[];
  lineage_refs?: readonly string[];
}>;

export type SearchFilters = TruthLedgerSearchFilters;

export type TruthLedgerSearchOrderingPolicy = Readonly<{
  order_by:
    | "created_at"
    | "truth_record_id"
    | "event_sequence"
    | "recommendation_id"
    | "decision_id"
    | "evidence_id"
    | "lineage_depth"
    | "integrity_state";
  direction: "ASC" | "DESC";
  tie_breakers: readonly string[];
}>;

export type SearchOrderingPolicy = TruthLedgerSearchOrderingPolicy;

export type TruthLedgerSearchPaginationPolicy = Readonly<{
  limit: number;
  cursor?: string;
  deterministic_cursor_required: boolean;
  max_limit: number;
}>;

export type SearchPaginationPolicy = TruthLedgerSearchPaginationPolicy;

export type TruthLedgerSearchRequest = Readonly<{
  search_id: string;
  query_contract_ref: string;
  tenant_id: string;
  mission_id?: string;
  lookup_type: TruthLedgerSearchLookupType;
  search_mode: TruthLedgerSearchMode;
  search_terms?: readonly string[];
  filters: TruthLedgerSearchFilters;
  requested_views: readonly TruthLedgerSearchView[];
  authority_context_ref: string;
  governance_context_ref: string;
  integrity_requirements_ref: string;
  replay_requirements_ref: string;
  ordering_policy: TruthLedgerSearchOrderingPolicy;
  pagination_policy: TruthLedgerSearchPaginationPolicy;
  created_at: string;
}>;

export type TruthLedgerSearchIndexRecord = Readonly<{
  index_record_id: string;
  index_version: string;
  truth_record_id: string;
  tenant_id: string;
  mission_id?: string;
  record_type: TruthEventType;
  lookup_type: TruthLedgerSearchLookupType;
  searchable_fields: readonly string[];
  searchable_tokens: readonly string[];
  relationship_refs: readonly string[];
  lineage_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  integrity_state: TruthIntegrityFinalCertificationState;
  certification_state?: TruthIntegrityFinalCertificationState;
  lifecycle_state: TruthLifecycleState;
  created_at: string;
  indexed_at: string;
  source_record_hash: string;
  index_record_hash: string;
  recommendation_id?: string;
  recommendation_state?: TruthLedgerRecommendationState;
  recommendation_summary?: string;
  recommendation_type?: string;
  supporting_evidence_refs?: readonly string[];
  conflicting_evidence_refs?: readonly string[];
  risk_refs?: readonly string[];
  confidence_refs?: readonly string[];
  decision_refs?: readonly string[];
  decision_id?: string;
  decision_state?: TruthLedgerDecisionState;
  decision_summary?: string;
  decision_rationale_refs?: readonly string[];
  recommendation_refs?: readonly string[];
  evidence_refs?: readonly string[];
  operator_refs?: readonly string[];
  evidence_id?: string;
  evidence_type?: TruthLedgerEvidenceType;
  evidence_state?: TruthLedgerEvidenceState;
  evidence_summary?: string;
  evidence_source_ref?: string;
  supports_record_refs?: readonly string[];
  conflicts_with_record_refs?: readonly string[];
  depends_on_record_refs?: readonly string[];
  influenced_record_refs?: readonly string[];
  restricted?: boolean;
  restricted_fields?: readonly string[];
  lineage_depth?: number;
  event_sequence?: number;
}>;

export type SearchIndexRecord = TruthLedgerSearchIndexRecord;

export type TruthLedgerRecommendationSearchResult = Readonly<{
  recommendation_id: string;
  truth_record_id: string;
  tenant_id: string;
  mission_id?: string;
  recommendation_state: TruthLedgerRecommendationState;
  recommendation_summary: string;
  recommendation_type?: string;
  supporting_evidence_refs: readonly string[];
  conflicting_evidence_refs: readonly string[];
  risk_refs: readonly string[];
  confidence_refs: readonly string[];
  governance_refs: readonly string[];
  decision_refs: readonly string[];
  replay_refs: readonly string[];
  lineage_refs: readonly string[];
  integrity_state: TruthIntegrityFinalCertificationState;
  visibility_state: TruthLedgerSearchVisibilityState;
}>;

export type RecommendationSearchResult = TruthLedgerRecommendationSearchResult;

export type TruthLedgerDecisionSearchResult = Readonly<{
  decision_id: string;
  truth_record_id: string;
  tenant_id: string;
  mission_id?: string;
  decision_state: TruthLedgerDecisionState;
  decision_summary: string;
  decision_rationale_refs: readonly string[];
  recommendation_refs: readonly string[];
  evidence_refs: readonly string[];
  operator_refs: readonly string[];
  governance_refs: readonly string[];
  risk_refs: readonly string[];
  confidence_refs: readonly string[];
  replay_refs: readonly string[];
  lineage_refs: readonly string[];
  integrity_state: TruthIntegrityFinalCertificationState;
  visibility_state: TruthLedgerSearchVisibilityState;
}>;

export type DecisionSearchResult = TruthLedgerDecisionSearchResult;

export type TruthLedgerEvidenceSearchResult = Readonly<{
  evidence_id: string;
  truth_record_id: string;
  tenant_id: string;
  mission_id?: string;
  evidence_type: TruthLedgerEvidenceType;
  evidence_state: TruthLedgerEvidenceState;
  evidence_summary: string;
  evidence_source_ref?: string;
  supports_record_refs: readonly string[];
  conflicts_with_record_refs: readonly string[];
  depends_on_record_refs: readonly string[];
  influenced_record_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  lineage_refs: readonly string[];
  integrity_state: TruthIntegrityFinalCertificationState;
  certification_state?: TruthIntegrityFinalCertificationState;
  visibility_state: TruthLedgerSearchVisibilityState;
}>;

export type EvidenceSearchResult = TruthLedgerEvidenceSearchResult;

export type TruthLedgerSearchResult =
  | TruthLedgerRecommendationSearchResult
  | TruthLedgerDecisionSearchResult
  | TruthLedgerEvidenceSearchResult;

export type SearchResult = TruthLedgerSearchResult;

export type TruthLedgerSearchResponse = Readonly<{
  search_id: string;
  query_id: string;
  tenant_id: string;
  mission_id?: string;
  lookup_type: TruthLedgerSearchLookupType;
  search_mode: TruthLedgerSearchMode;
  result_state: TruthLedgerSearchResultState;
  result_count: number;
  results: readonly TruthLedgerSearchResult[];
  redaction_applied: boolean;
  redaction_refs: readonly string[];
  governance_decision_ref?: string;
  authority_decision_ref?: string;
  integrity_decision_ref?: string;
  query_hash: string;
  result_hash: string;
  replay_ref?: string;
  executed_at: string;
  warnings: readonly string[];
  readOnly: true;
  sourceMutationAllowed: false;
}>;

export type TruthLedgerSearchReplayMetadata = Readonly<{
  search_id: string;
  query_id: string;
  query_hash: string;
  result_hash: string;
  index_version: string;
  search_schema_version: string;
  tokenizer_version?: string;
  ordering_policy_hash: string;
  filter_hash: string;
  authority_decision_ref?: string;
  governance_decision_ref?: string;
  integrity_decision_ref?: string;
  executed_at: string;
}>;

export type SearchReplayMetadata = TruthLedgerSearchReplayMetadata;

export type TruthLedgerSearchAuditRecord = Readonly<{
  search_id: string;
  query_id: string;
  tenant_id: string;
  mission_id?: string;
  requester_type: TruthLedgerQueryRequesterType;
  lookup_type: TruthLedgerSearchLookupType;
  result_state: TruthLedgerSearchResultState;
  result_count: number;
  redaction_applied: boolean;
  authority_decision_ref?: string;
  governance_decision_ref?: string;
  integrity_decision_ref?: string;
  replay_ref?: string;
  query_hash: string;
  result_hash: string;
  created_at: string;
}>;

export type SearchAuditRecord = TruthLedgerSearchAuditRecord;

export type TruthLedgerSearchExecutionContext = Readonly<{
  governance_decision?: TruthLedgerSearchGovernanceDecision;
  observed_integrity_state?: TruthIntegrityFinalCertificationState;
  mutation_attempted?: boolean;
  index_version?: string;
  search_schema_version?: string;
  tokenizer_version?: string;
}>;

export type TruthHistoricalReconstructionQueryType =
  | "AS_OF_RECORD_STATE"
  | "AS_OF_MISSION_STATE"
  | "TIMELINE_RECONSTRUCTION"
  | "DECISION_HISTORY"
  | "RECOMMENDATION_HISTORY"
  | "EVIDENCE_HISTORY"
  | "GOVERNANCE_HISTORY"
  | "LINEAGE_HISTORY"
  | "CHANGESET_RECONSTRUCTION"
  | "BETWEEN_TIME_DIFF"
  | "INCIDENT_RECONSTRUCTION"
  | "CERTIFICATION_HISTORY";

export type HistoricalReconstructionQueryType = TruthHistoricalReconstructionQueryType;

export type TruthHistoricalTemporalAnchorType =
  | "KNOWN_AS_OF"
  | "RECORDED_AS_OF"
  | "OCCURRED_AS_OF"
  | "EFFECTIVE_AS_OF"
  | "VERIFIED_AS_OF"
  | "BETWEEN_TIMES";

export type TemporalAnchorType = TruthHistoricalTemporalAnchorType;

export type TruthHistoricalTemporalAnchor = Readonly<{
  anchor_type: TruthHistoricalTemporalAnchorType;
  as_of_time?: string;
  start_time?: string;
  end_time?: string;
}>;

export type TemporalAnchor = TruthHistoricalTemporalAnchor;

export type TruthHistoricalReconstructionWindow = Readonly<{
  start_time: string;
  end_time: string;
}>;

export type ReconstructionWindow = TruthHistoricalReconstructionWindow;

export type TruthHistoricalLateArrivingRecordState =
  | "NOT_INCLUDED"
  | "INCLUDED_WITH_LATE_ARRIVAL_FLAG"
  | "BLOCKED_BY_POLICY";

export type LateArrivingRecordState = TruthHistoricalLateArrivingRecordState;

export type TruthHistoricalTargetRecords = Readonly<{
  truth_record_ids?: readonly string[];
  recommendation_ids?: readonly string[];
  decision_ids?: readonly string[];
  evidence_ids?: readonly string[];
  governance_refs?: readonly string[];
  escalation_refs?: readonly string[];
  replay_refs?: readonly string[];
  lineage_refs?: readonly string[];
}>;

export type HistoricalTargetRecords = TruthHistoricalTargetRecords;

export type TruthHistoricalContextRequest = Readonly<{
  include_recommendations: boolean;
  include_decisions: boolean;
  include_evidence: boolean;
  include_governance: boolean;
  include_risk: boolean;
  include_confidence: boolean;
  include_escalations: boolean;
  include_runtime_events: boolean;
  include_integrity_events: boolean;
  include_certification_events: boolean;
}>;

export type HistoricalContextRequest = TruthHistoricalContextRequest;

export type TruthHistoricalOrderingPolicy = Readonly<{
  order_by: "recorded_at" | "occurred_at" | "effective_at" | "verified_at" | "event_sequence" | "truth_record_id";
  direction: "ASC" | "DESC";
  tie_breakers: readonly string[];
}>;

export type HistoricalOrderingPolicy = TruthHistoricalOrderingPolicy;

export type TruthHistoricalReconstructionQuery = Readonly<{
  reconstruction_query_id: string;
  query_contract_ref: string;
  tenant_id: string;
  mission_id?: string;
  operator_id?: string;
  reconstruction_type: TruthHistoricalReconstructionQueryType;
  temporal_anchor: TruthHistoricalTemporalAnchor;
  reconstruction_window?: TruthHistoricalReconstructionWindow;
  target_records: TruthHistoricalTargetRecords;
  target_context: TruthHistoricalContextRequest;
  authority_context_ref: string;
  governance_context_ref: string;
  integrity_requirements_ref: string;
  replay_requirements_ref: string;
  include_lineage: boolean;
  include_evidence: boolean;
  include_governance: boolean;
  include_replay_refs: boolean;
  include_integrity_state: boolean;
  include_supersession_history: boolean;
  include_late_arriving_records: boolean;
  lineage_depth: number;
  evidence_depth: number;
  relationship_depth: number;
  ordering_policy: TruthHistoricalOrderingPolicy;
  redaction_policy_ref: string;
  created_at: string;
}>;

export type HistoricalReconstructionQuery = TruthHistoricalReconstructionQuery;

export type TruthHistoricalReconstructionResultState =
  | "RECONSTRUCTED"
  | "PARTIAL"
  | "EMPTY"
  | "REDACTED"
  | "GAP_DETECTED"
  | "CONFLICT_DETECTED"
  | "INTEGRITY_BLOCKED"
  | "GOVERNANCE_BLOCKED"
  | "AUTHORITY_BLOCKED"
  | "INVALID_QUERY"
  | "FAILED";

export type HistoricalReconstructionResultState = TruthHistoricalReconstructionResultState;

export type TruthHistoricalVisibilityState =
  | "VISIBLE"
  | "PARTIALLY_VISIBLE"
  | "SUMMARY_ONLY"
  | "RESTRICTED"
  | "DENIED";

export type HistoricalVisibilityState = TruthHistoricalVisibilityState;

export type TruthHistoricalGovernanceDecision =
  | "ALLOW"
  | "ALLOW_WITH_REDACTION"
  | "SUMMARY_ONLY"
  | "DENY"
  | "ESCALATE";

export type HistoricalGovernanceDecision = TruthHistoricalGovernanceDecision;

export type TruthHistoricalIndexRecord = Readonly<{
  historical_index_id: string;
  index_version: string;
  truth_record_id: string;
  tenant_id: string;
  mission_id?: string;
  record_type: TruthEventType;
  recorded_at: string;
  occurred_at?: string;
  verified_at?: string;
  effective_at?: string;
  valid_from?: string;
  valid_to?: string;
  lifecycle_state: TruthLifecycleState;
  parent_refs: readonly string[];
  child_refs: readonly string[];
  evidence_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  recommendation_refs?: readonly string[];
  decision_refs?: readonly string[];
  risk_refs?: readonly string[];
  confidence_refs?: readonly string[];
  escalation_refs?: readonly string[];
  lineage_refs: readonly string[];
  supersedes_ref?: string;
  superseded_by_ref?: string;
  source_record_hash: string;
  index_record_hash: string;
  integrity_state: TruthIntegrityFinalCertificationState;
  active_version_ref?: string;
  recommendation_id?: string;
  decision_id?: string;
  evidence_id?: string;
  event_summary: string;
  restricted?: boolean;
  restricted_fields?: readonly string[];
  event_sequence?: number;
  conflicting_record_refs?: readonly string[];
  missing_evidence_refs?: readonly string[];
  broken_lineage?: boolean;
  broken_hash_chain?: boolean;
}>;

export type HistoricalIndexRecord = TruthHistoricalIndexRecord;

export type TruthHistoricalRecordState = Readonly<{
  truth_record_id: string;
  tenant_id: string;
  mission_id?: string;
  record_type: TruthEventType;
  existed_as_of_anchor: boolean;
  visible_as_of_anchor: boolean;
  verified_as_of_anchor: boolean;
  lifecycle_state_as_of_anchor: TruthLifecycleState;
  active_version_ref?: string;
  superseded_by_ref?: string;
  superseded_after_anchor: boolean;
  evidence_refs_as_of_anchor: readonly string[];
  governance_refs_as_of_anchor: readonly string[];
  replay_refs_as_of_anchor: readonly string[];
  lineage_refs_as_of_anchor: readonly string[];
  integrity_state_as_of_anchor: TruthIntegrityFinalCertificationState;
  late_arriving_record: boolean;
  late_arriving_record_state: TruthHistoricalLateArrivingRecordState;
  restricted_as_of_anchor: boolean;
}>;

export type HistoricalRecordState = TruthHistoricalRecordState;

export type TruthHistoricalTimelineEvent = Readonly<{
  sequence_id: string;
  truth_record_id: string;
  tenant_id: string;
  mission_id?: string;
  event_type: TruthEventType;
  event_summary: string;
  occurred_at?: string;
  recorded_at: string;
  verified_at?: string;
  effective_at?: string;
  lifecycle_state_after_event: TruthLifecycleState;
  parent_refs: readonly string[];
  child_refs: readonly string[];
  evidence_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  integrity_state: TruthIntegrityFinalCertificationState;
  visibility_state: TruthHistoricalVisibilityState;
}>;

export type HistoricalTimelineEvent = TruthHistoricalTimelineEvent;

export type TruthHistoricalGovernanceContext = Readonly<{
  current_access_governance_ref: string;
  historical_governance_refs: readonly string[];
  historical_restrictions_as_of_anchor: readonly string[];
  access_result: TruthHistoricalGovernanceDecision;
}>;

export type HistoricalGovernanceContext = TruthHistoricalGovernanceContext;

export type TruthHistoricalReconstructionGapType =
  | "MISSING_EVENT"
  | "MISSING_EVIDENCE"
  | "MISSING_DECISION_REF"
  | "MISSING_RECOMMENDATION_REF"
  | "MISSING_GOVERNANCE_REF"
  | "BROKEN_LINEAGE"
  | "BROKEN_HASH_CHAIN"
  | "UNVERIFIED_RECORD"
  | "LATE_ARRIVING_RECORD"
  | "CONFLICTING_RECORDS"
  | "REDACTED_DEPENDENCY";

export type ReconstructionGapType = TruthHistoricalReconstructionGapType;

export type TruthHistoricalReconstructionGap = Readonly<{
  gap_id: string;
  gap_type: TruthHistoricalReconstructionGapType;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  affected_record_refs: readonly string[];
  detected_at: string;
  description: string;
  integrity_state?: TruthIntegrityFinalCertificationState;
  governance_refs?: readonly string[];
  replay_refs?: readonly string[];
}>;

export type ReconstructionGap = TruthHistoricalReconstructionGap;

export type TruthHistoricalReconstructionResponse = Readonly<{
  reconstruction_query_id: string;
  query_id: string;
  tenant_id: string;
  mission_id?: string;
  reconstruction_type: TruthHistoricalReconstructionQueryType;
  temporal_anchor: TruthHistoricalTemporalAnchor;
  result_state: TruthHistoricalReconstructionResultState;
  reconstructed_records: readonly TruthHistoricalRecordState[];
  timeline_events: readonly TruthHistoricalTimelineEvent[];
  recommendation_history_refs: readonly string[];
  decision_history_refs: readonly string[];
  evidence_history_refs: readonly string[];
  governance_history_refs: readonly string[];
  lineage_history_refs: readonly string[];
  replay_refs: readonly string[];
  gaps: readonly TruthHistoricalReconstructionGap[];
  redaction_applied: boolean;
  redaction_refs: readonly string[];
  current_access_governance_ref: string;
  historical_governance_refs: readonly string[];
  authority_decision_ref: string;
  integrity_decision_ref: string;
  query_hash: string;
  reconstruction_hash: string;
  replay_ref?: string;
  reconstructed_at: string;
  warnings: readonly string[];
  readOnly: true;
  sourceMutationAllowed: false;
}>;

export type HistoricalReconstructionResponse = TruthHistoricalReconstructionResponse;

export type TruthHistoricalReconstructionReplayMetadata = Readonly<{
  reconstruction_query_id: string;
  query_id: string;
  temporal_anchor_hash: string;
  filter_hash: string;
  ordering_policy_hash: string;
  index_version: string;
  historical_schema_version: string;
  authority_decision_ref: string;
  governance_decision_ref: string;
  integrity_decision_ref: string;
  query_hash: string;
  reconstruction_hash: string;
  reconstructed_at: string;
}>;

export type HistoricalReconstructionReplayMetadata = TruthHistoricalReconstructionReplayMetadata;

export type TruthHistoricalReconstructionAuditRecord = Readonly<{
  audit_id: string;
  reconstruction_query_id: string;
  query_id: string;
  tenant_id: string;
  mission_id?: string;
  requester_type: TruthLedgerQueryRequesterType;
  operator_id?: string;
  reconstruction_type: TruthHistoricalReconstructionQueryType;
  temporal_anchor: TruthHistoricalTemporalAnchor;
  result_state: TruthHistoricalReconstructionResultState;
  reconstructed_record_count: number;
  timeline_event_count: number;
  gap_count: number;
  redaction_applied: boolean;
  authority_decision_ref: string;
  governance_decision_ref: string;
  integrity_decision_ref: string;
  replay_ref?: string;
  query_hash: string;
  reconstruction_hash: string;
  created_at: string;
}>;

export type HistoricalReconstructionAuditRecord = TruthHistoricalReconstructionAuditRecord;

export type TruthHistoricalReconstructionExecutionContext = Readonly<{
  governance_decision?: TruthHistoricalGovernanceDecision;
  mutation_attempted?: boolean;
  observed_integrity_state?: TruthIntegrityFinalCertificationState;
  historical_schema_version?: string;
  index_version?: string;
}>;

export type TruthLedgerType =
  | "TRUTH_LEDGER"
  | "EVENT_LEDGER"
  | "EVIDENCE_LEDGER"
  | "RECOMMENDATION_LEDGER"
  | "DECISION_LEDGER"
  | "GOVERNANCE_LEDGER"
  | "LINEAGE_LEDGER"
  | "REPLAY_LEDGER"
  | "INTEGRITY_LEDGER"
  | "CERTIFICATION_LEDGER"
  | "AUDIT_LEDGER";

export type LedgerType = TruthLedgerType;

export type TruthCrossLedgerCorrelationQueryType =
  | "RECOMMENDATION_TO_DECISION"
  | "RECOMMENDATION_TO_EVIDENCE"
  | "DECISION_TO_EVIDENCE"
  | "DECISION_TO_GOVERNANCE"
  | "DECISION_TO_REPLAY"
  | "EVIDENCE_TO_INTEGRITY"
  | "EVIDENCE_TO_GOVERNANCE"
  | "REPLAY_TO_DECISION"
  | "REPLAY_TO_RECOMMENDATION"
  | "LINEAGE_TO_EVIDENCE"
  | "INTEGRITY_TO_LEDGER_RECORDS"
  | "CERTIFICATION_TO_EVIDENCE"
  | "CERTIFICATION_TO_DECISION"
  | "ESCALATION_TO_RELATED_RECORDS"
  | "MISSION_CROSS_LEDGER_CONTEXT"
  | "INCIDENT_CROSS_LEDGER_CONTEXT"
  | "FULL_CONTEXT_CORRELATION";

export type CrossLedgerCorrelationQueryType = TruthCrossLedgerCorrelationQueryType;

export type TruthCrossLedgerSeedRecord = Readonly<{
  ledger_type: TruthLedgerType;
  record_id: string;
  truth_record_id?: string;
  tenant_id: string;
  mission_id?: string;
}>;

export type CrossLedgerSeedRecord = TruthCrossLedgerSeedRecord;

export type TruthCorrelationBasis =
  | "DIRECT_REFERENCE"
  | "PARENT_CHILD_LINEAGE"
  | "SHARED_EVIDENCE"
  | "SHARED_RECOMMENDATION"
  | "SHARED_DECISION"
  | "SHARED_GOVERNANCE_RULE"
  | "SHARED_REPLAY_REF"
  | "SHARED_INTEGRITY_CHAIN"
  | "SHARED_EVENT_SEQUENCE"
  | "SHARED_CERTIFICATION_REF"
  | "TEMPORAL_OVERLAP"
  | "MISSION_CONTEXT"
  | "OPERATOR_REFERENCE";

export type CorrelationBasis = TruthCorrelationBasis;

export type TruthCorrelationStrength =
  | "VERIFIED"
  | "STRONG"
  | "RELATED"
  | "CANDIDATE"
  | "CONFLICTING"
  | "UNVERIFIED";

export type CorrelationStrength = TruthCorrelationStrength;

export type TruthCrossLedgerRelationshipType =
  | "SUPPORTED_BY"
  | "CONTRADICTED_BY"
  | "DEPENDS_ON"
  | "INFLUENCED_BY"
  | "GOVERNED_BY"
  | "RESTRICTED_BY"
  | "ESCALATED_BY"
  | "REPLAYED_BY"
  | "VERIFIED_BY"
  | "CERTIFIED_BY"
  | "DERIVED_FROM"
  | "DECIDED_FROM"
  | "RECOMMENDED_FROM"
  | "SUPERSEDES"
  | "SUPERSEDED_BY"
  | "RECORDED_AFTER"
  | "RECORDED_BEFORE"
  | "ASSOCIATED_WITH";

export type CrossLedgerRelationshipType = TruthCrossLedgerRelationshipType;

export type TruthCrossLedgerTemporalRelation = Readonly<{
  relation_type: "BEFORE" | "AFTER" | "SAME_TIME" | "OVERLAPS" | "UNKNOWN";
  source_time?: string;
  target_time?: string;
  time_basis: "RECORDED_AT" | "OCCURRED_AT" | "VERIFIED_AT" | "EFFECTIVE_AT";
}>;

export type TemporalRelation = TruthCrossLedgerTemporalRelation;

export type TruthCorrelationTraversalPolicy = Readonly<{
  max_hops: number;
  max_nodes: number;
  max_edges: number;
  allow_cycles: boolean;
  detect_cycles: boolean;
  stop_at_restricted_node: boolean;
  stop_at_corrupted_node: boolean;
  allowed_ledgers: readonly TruthLedgerType[];
  blocked_ledgers: readonly TruthLedgerType[];
  allowed_relationship_types: readonly TruthCrossLedgerRelationshipType[];
}>;

export type CorrelationTraversalPolicy = TruthCorrelationTraversalPolicy;

export type TruthCorrelationTemporalPolicy = Readonly<{
  temporal_mode: "CURRENT_LEDGER_STATE" | "KNOWN_AS_OF" | "RECORDED_AS_OF" | "OCCURRED_AS_OF" | "EFFECTIVE_AS_OF" | "VERIFIED_AS_OF" | "BETWEEN_TIMES";
  as_of_time?: string;
  start_time?: string;
  end_time?: string;
  include_late_arriving_records: boolean;
}>;

export type CorrelationTemporalPolicy = TruthCorrelationTemporalPolicy;

export type TruthCrossLedgerView =
  | "SUMMARY_VIEW"
  | "GRAPH_VIEW"
  | "EVIDENCE_VIEW"
  | "DECISION_VIEW"
  | "RECOMMENDATION_VIEW"
  | "GOVERNANCE_VIEW"
  | "LINEAGE_VIEW"
  | "REPLAY_VIEW"
  | "INTEGRITY_VIEW"
  | "CERTIFICATION_VIEW"
  | "AUDIT_VIEW"
  | "REDACTED_VIEW";

export type CrossLedgerView = TruthCrossLedgerView;

export type TruthCrossLedgerVisibilityState =
  | "VISIBLE"
  | "PARTIALLY_VISIBLE"
  | "SUMMARY_ONLY"
  | "REDACTED_NODE"
  | "REDACTED_EDGE"
  | "EXISTS_BUT_RESTRICTED"
  | "DENIED";

export type CrossLedgerVisibilityState = TruthCrossLedgerVisibilityState;

export type TruthExistenceDisclosurePolicy = Readonly<{
  allow_restricted_node_placeholder: boolean;
  allow_restricted_edge_placeholder: boolean;
  allow_restricted_counts: boolean;
  allow_restricted_ledger_type: boolean;
  disclosure_reason: string;
}>;

export type ExistenceDisclosurePolicy = TruthExistenceDisclosurePolicy;

export type TruthCrossLedgerCorrelationResultState =
  | "CORRELATED"
  | "PARTIAL"
  | "EMPTY"
  | "CANDIDATE_ONLY"
  | "CONFLICT_DETECTED"
  | "GAP_DETECTED"
  | "REDACTED"
  | "AUTHORITY_BLOCKED"
  | "GOVERNANCE_BLOCKED"
  | "INTEGRITY_BLOCKED"
  | "INVALID_QUERY"
  | "FAILED";

export type CrossLedgerCorrelationResultState = TruthCrossLedgerCorrelationResultState;

export type TruthCrossLedgerOrderingPolicy = Readonly<{
  node_order_by: "ledger_type" | "record_id" | "truth_record_id" | "created_at";
  edge_order_by: "edge_id" | "source_record_id" | "target_record_id" | "relationship_type";
  direction: "ASC" | "DESC";
  tie_breakers: readonly string[];
}>;

export type CrossLedgerOrderingPolicy = TruthCrossLedgerOrderingPolicy;

export type TruthCrossLedgerCorrelationQuery = Readonly<{
  correlation_query_id: string;
  query_contract_ref: string;
  tenant_id: string;
  mission_id?: string;
  operator_id?: string;
  correlation_type: TruthCrossLedgerCorrelationQueryType;
  source_ledger: TruthLedgerType;
  target_ledgers: readonly TruthLedgerType[];
  seed_records: readonly TruthCrossLedgerSeedRecord[];
  correlation_basis_allowed: readonly TruthCorrelationBasis[];
  relationship_types_allowed: readonly TruthCrossLedgerRelationshipType[];
  traversal_policy: TruthCorrelationTraversalPolicy;
  temporal_policy?: TruthCorrelationTemporalPolicy;
  existence_disclosure_policy: TruthExistenceDisclosurePolicy;
  include_direct_correlations: boolean;
  include_indirect_correlations: boolean;
  include_candidate_correlations: boolean;
  include_conflicts: boolean;
  include_gaps: boolean;
  include_redacted_placeholders: boolean;
  requested_views: readonly TruthCrossLedgerView[];
  authority_context_ref: string;
  governance_context_ref: string;
  integrity_requirements_ref: string;
  replay_requirements_ref: string;
  redaction_policy_ref: string;
  ordering_policy: TruthCrossLedgerOrderingPolicy;
  created_at: string;
}>;

export type CrossLedgerCorrelationQuery = TruthCrossLedgerCorrelationQuery;

export type TruthCrossLedgerIndexedRelationship = Readonly<{
  target_ledger: TruthLedgerType;
  target_record_id: string;
  target_truth_record_id?: string;
  relationship_type: TruthCrossLedgerRelationshipType;
  correlation_basis: readonly TruthCorrelationBasis[];
  correlation_strength: TruthCorrelationStrength;
  direction: "FORWARD" | "BACKWARD" | "BIDIRECTIONAL";
  evidence_refs?: readonly string[];
  governance_refs?: readonly string[];
  replay_refs?: readonly string[];
  lineage_refs?: readonly string[];
  integrity_refs?: readonly string[];
  temporal_relation?: TruthCrossLedgerTemporalRelation;
  restricted?: boolean;
  candidate_for_certification?: boolean;
  missing_target?: boolean;
  conflicting?: boolean;
  broken_lineage?: boolean;
}>;

export type CrossLedgerIndexedRelationship = TruthCrossLedgerIndexedRelationship;

export type TruthCrossLedgerCorrelationIndexRecord = Readonly<{
  correlation_index_id: string;
  index_version: string;
  ledger_type: TruthLedgerType;
  record_id: string;
  truth_record_id?: string;
  tenant_id: string;
  mission_id?: string;
  record_type: TruthEventType;
  lifecycle_state: TruthLifecycleState;
  summary: string;
  created_at: string;
  recorded_at?: string;
  verified_at?: string;
  occurred_at?: string;
  source_record_hash: string;
  index_record_hash: string;
  integrity_state: TruthIntegrityFinalCertificationState;
  relationships: readonly TruthCrossLedgerIndexedRelationship[];
  restricted?: boolean;
  restricted_fields?: readonly string[];
  late_arriving?: boolean;
}>;

export type CrossLedgerCorrelationIndexRecord = TruthCrossLedgerCorrelationIndexRecord;

export type TruthCrossLedgerCorrelationNode = Readonly<{
  node_id: string;
  ledger_type: TruthLedgerType;
  record_id: string;
  truth_record_id?: string;
  tenant_id: string;
  mission_id?: string;
  record_type: TruthEventType;
  lifecycle_state: TruthLifecycleState;
  summary: string;
  created_at: string;
  recorded_at?: string;
  verified_at?: string;
  integrity_state: TruthIntegrityFinalCertificationState;
  visibility_state: TruthCrossLedgerVisibilityState;
  redacted: boolean;
}>;

export type CrossLedgerCorrelationNode = TruthCrossLedgerCorrelationNode;

export type TruthCrossLedgerCorrelationEdge = Readonly<{
  edge_id: string;
  source_ledger: TruthLedgerType;
  source_record_id: string;
  source_truth_record_id?: string;
  target_ledger: TruthLedgerType;
  target_record_id: string;
  target_truth_record_id?: string;
  relationship_type: TruthCrossLedgerRelationshipType;
  correlation_basis: readonly TruthCorrelationBasis[];
  correlation_strength: TruthCorrelationStrength;
  direction: "FORWARD" | "BACKWARD" | "BIDIRECTIONAL";
  evidence_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  lineage_refs: readonly string[];
  integrity_refs: readonly string[];
  temporal_relation?: TruthCrossLedgerTemporalRelation;
  integrity_state: TruthIntegrityFinalCertificationState;
  visibility_state: TruthCrossLedgerVisibilityState;
  verified: boolean;
}>;

export type CrossLedgerCorrelationEdge = TruthCrossLedgerCorrelationEdge;

export type TruthCrossLedgerCorrelationGap = Readonly<{
  gap_id: string;
  gap_type: "MISSING_TARGET_RECORD" | "MISSING_EVIDENCE" | "MISSING_GOVERNANCE" | "MISSING_REPLAY" | "MISSING_INTEGRITY" | "BROKEN_LINEAGE" | "BROKEN_REFERENCE" | "REDACTED_DEPENDENCY" | "CYCLE_DETECTED" | "MAX_DEPTH_REACHED";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  affected_record_refs: readonly string[];
  description: string;
}>;

export type CrossLedgerCorrelationGap = TruthCrossLedgerCorrelationGap;

export type TruthCrossLedgerCorrelationConflict = Readonly<{
  conflict_id: string;
  conflict_type: "CONFLICTING_EVIDENCE" | "CONFLICTING_GOVERNANCE" | "CONFLICTING_INTEGRITY" | "CONFLICTING_LINEAGE" | "TEMPORAL_CONTRADICTION" | "CERTIFICATION_CONTRADICTION";
  affected_record_refs: readonly string[];
  description: string;
}>;

export type CrossLedgerCorrelationConflict = TruthCrossLedgerCorrelationConflict;

export type TruthCrossLedgerLedgerManifest = Readonly<{
  manifest_id: string;
  ledger_versions: Record<TruthLedgerType, string>;
  correlation_schema_version: string;
  correlation_index_version: string;
  policy_version?: string;
}>;

export type CrossLedgerLedgerManifest = TruthCrossLedgerLedgerManifest;

export type TruthCrossLedgerCorrelationResponse = Readonly<{
  correlation_query_id: string;
  query_id: string;
  tenant_id: string;
  mission_id?: string;
  correlation_type: TruthCrossLedgerCorrelationQueryType;
  result_state: TruthCrossLedgerCorrelationResultState;
  nodes: readonly TruthCrossLedgerCorrelationNode[];
  edges: readonly TruthCrossLedgerCorrelationEdge[];
  seed_records: readonly TruthCrossLedgerSeedRecord[];
  correlated_ledgers: readonly TruthLedgerType[];
  direct_correlation_count: number;
  indirect_correlation_count: number;
  candidate_correlation_count: number;
  conflict_count: number;
  gap_count: number;
  gaps: readonly TruthCrossLedgerCorrelationGap[];
  conflicts: readonly TruthCrossLedgerCorrelationConflict[];
  redaction_applied: boolean;
  redaction_refs: readonly string[];
  authority_decision_ref: string;
  governance_decision_ref: string;
  integrity_decision_ref: string;
  ledger_manifest: TruthCrossLedgerLedgerManifest;
  query_hash: string;
  correlation_hash: string;
  replay_ref?: string;
  correlated_at: string;
  warnings: readonly string[];
  readOnly: true;
  sourceMutationAllowed: false;
}>;

export type CrossLedgerCorrelationResponse = TruthCrossLedgerCorrelationResponse;

export type TruthCrossLedgerCorrelationReplayMetadata = Readonly<{
  correlation_query_id: string;
  query_id: string;
  query_hash: string;
  seed_record_hash: string;
  traversal_policy_hash: string;
  temporal_policy_hash: string;
  ordering_policy_hash: string;
  ledger_manifest_id: string;
  correlation_index_version: string;
  correlation_hash: string;
  correlated_at: string;
}>;

export type CrossLedgerCorrelationReplayMetadata = TruthCrossLedgerCorrelationReplayMetadata;

export type TruthCrossLedgerCorrelationAuditRecord = Readonly<{
  audit_id: string;
  correlation_query_id: string;
  query_id: string;
  tenant_id: string;
  mission_id?: string;
  requester_type: TruthLedgerQueryRequesterType;
  operator_id?: string;
  correlation_type: TruthCrossLedgerCorrelationQueryType;
  source_ledger: TruthLedgerType;
  target_ledgers: readonly TruthLedgerType[];
  result_state: TruthCrossLedgerCorrelationResultState;
  node_count: number;
  edge_count: number;
  gap_count: number;
  conflict_count: number;
  redaction_applied: boolean;
  authority_decision_ref: string;
  governance_decision_ref: string;
  integrity_decision_ref: string;
  replay_ref?: string;
  query_hash: string;
  correlation_hash: string;
  created_at: string;
}>;

export type CrossLedgerCorrelationAuditRecord = TruthCrossLedgerCorrelationAuditRecord;

export type TruthCrossLedgerCorrelationExecutionContext = Readonly<{
  governance_decision?: TruthHistoricalGovernanceDecision;
  mutation_attempted?: boolean;
  observed_integrity_state?: TruthIntegrityFinalCertificationState;
  correlation_schema_version?: string;
  correlation_index_version?: string;
  policy_version?: string;
}>;

export type TruthQueryCertificationState = "PASS" | "CONDITIONAL_PASS" | "FAIL";

export type QueryCertificationState = TruthQueryCertificationState;

export type TruthQueryCertificationScope =
  | "QUERY_CONTRACT"
  | "SEARCH_ENGINE"
  | "HISTORICAL_RECONSTRUCTION"
  | "CROSS_LEDGER_CORRELATION"
  | "AUTHORITY_ENFORCEMENT"
  | "GOVERNANCE_ENFORCEMENT"
  | "INTEGRITY_ENFORCEMENT"
  | "REPLAY_COMPATIBILITY"
  | "REDACTION_SAFETY"
  | "AUDITABILITY"
  | "DETERMINISM"
  | "FAIL_CLOSED_BEHAVIOR";

export type QueryCertificationScope = TruthQueryCertificationScope;

export type TruthQueryCertificationTestOutcome = "PASS" | "FAIL";

export type TruthQueryCertificationTestResultState =
  | "PASSED"
  | "FAILED"
  | "BLOCKING"
  | "CONDITIONAL";

export type TruthQueryCertificationTestResult = Readonly<{
  test_id: string;
  test_name: string;
  category: TruthQueryCertificationScope;
  expected: TruthQueryCertificationTestOutcome;
  actual: TruthQueryCertificationTestOutcome;
  result_state: TruthQueryCertificationTestResultState;
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  integrity_refs: readonly string[];
  governance_refs: readonly string[];
  failure_reason?: string;
  remediation_hint?: string;
  executed_at: string;
}>;

export type CertificationTestResult = TruthQueryCertificationTestResult;

export type TruthQueryCertificationGate = Readonly<{
  certification_id: string;
  tenant_id: string;
  mission_id?: string;
  certification_scope: readonly TruthQueryCertificationScope[];
  query_contract_tests: readonly TruthQueryCertificationTestResult[];
  search_tests: readonly TruthQueryCertificationTestResult[];
  historical_reconstruction_tests: readonly TruthQueryCertificationTestResult[];
  cross_ledger_correlation_tests: readonly TruthQueryCertificationTestResult[];
  authority_tests: readonly TruthQueryCertificationTestResult[];
  governance_tests: readonly TruthQueryCertificationTestResult[];
  integrity_tests: readonly TruthQueryCertificationTestResult[];
  replay_tests: readonly TruthQueryCertificationTestResult[];
  redaction_tests: readonly TruthQueryCertificationTestResult[];
  audit_tests: readonly TruthQueryCertificationTestResult[];
  determinism_tests: readonly TruthQueryCertificationTestResult[];
  fail_closed_tests: readonly TruthQueryCertificationTestResult[];
  final_state: TruthQueryCertificationState;
  blocking_failures: readonly string[];
  conditional_findings: readonly string[];
  query_hash?: string;
  certification_hash: string;
  replay_ref?: string;
  certified_at: string;
}>;

export type QueryCertificationGate = TruthQueryCertificationGate;

export type TruthQueryCertificationGateInput = Readonly<{
  certification_id: string;
  tenant_id: string;
  mission_id?: string;
  certification_scope?: readonly TruthQueryCertificationScope[];
  query_contract_tests?: readonly TruthQueryCertificationTestResult[];
  search_tests?: readonly TruthQueryCertificationTestResult[];
  historical_reconstruction_tests?: readonly TruthQueryCertificationTestResult[];
  cross_ledger_correlation_tests?: readonly TruthQueryCertificationTestResult[];
  authority_tests?: readonly TruthQueryCertificationTestResult[];
  governance_tests?: readonly TruthQueryCertificationTestResult[];
  integrity_tests?: readonly TruthQueryCertificationTestResult[];
  replay_tests?: readonly TruthQueryCertificationTestResult[];
  redaction_tests?: readonly TruthQueryCertificationTestResult[];
  audit_tests?: readonly TruthQueryCertificationTestResult[];
  determinism_tests?: readonly TruthQueryCertificationTestResult[];
  fail_closed_tests?: readonly TruthQueryCertificationTestResult[];
  query_hash?: string;
  replay_ref?: string;
  certified_at: string;
}>;

export type TruthQueryCertificationReport = Readonly<{
  certification_id: string;
  certification_state: TruthQueryCertificationState;
  passed_tests: number;
  failed_tests: number;
  blocking_failures: readonly string[];
  conditional_findings: readonly string[];
  certified_components: readonly TruthQueryCertificationScope[];
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  integrity_refs: readonly string[];
  governance_refs: readonly string[];
  certification_hash: string;
  replay_ref?: string;
  generated_at: string;
}>;

export type QueryCertificationReport = TruthQueryCertificationReport;
