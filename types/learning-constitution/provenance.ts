import type { KnowledgeClassification } from "./constitutionalVocabulary";
import type { ConflictRecord } from "./conflictEngine";
import type { ConflictAuditEvent, ConflictResolutionProposal, ResolutionEvidencePackage } from "./conflictResolution";
import type { KnowledgeScopeReference } from "./knowledgeScope";

/** Canonical identity introduced by Phase 7. "Learning Agent" is its role, not its name. */
export const NOESIS_IDENTITY = Object.freeze({
  systemId: "agent:noesis",
  systemName: "Noesis",
  systemType: "LEARNING_AGENT" as const,
  legacyAliases: ["Learning Agent"] as const,
});

export const NOESIS_IDENTITY_MIGRATION = Object.freeze({
  eventId: "system-migration:learning-agent-to-noesis:v1",
  eventType: "SYSTEM_IDENTITY_MIGRATION" as const,
  from: "Learning Agent",
  to: NOESIS_IDENTITY.systemName,
  actor: { actorId: NOESIS_IDENTITY.systemId, actorType: "SYSTEM" as const },
  occurredAt: "2026-08-23T00:00:00.000Z",
  immutable: true as const,
});

export const PROVENANCE_SOURCE_TYPES = [
  "CONVERSATION", "DOCUMENT", "HUMAN_ENTRY", "APPROVED_REFERENCE", "EXTERNAL_SOURCE",
  "SYSTEM_EVENT", "AGENT_OUTPUT", "OBSERVATION", "IMPORT",
] as const;
export type ProvenanceSourceType = (typeof PROVENANCE_SOURCE_TYPES)[number];

export const PROVENANCE_RELATIONSHIP_TYPES = [
  "DERIVED_FROM", "EXTRACTED_FROM", "INTERPRETED_AS", "SUPPORTED_BY", "CONTRADICTED_BY",
  "APPROVED_BY", "REJECTED_BY", "CORRECTS", "CORRECTED_BY", "SUPERSEDES", "SUPERSEDED_BY",
  "REFINES", "MERGED_FROM", "SPLIT_FROM", "REFERENCES", "INVALIDATED_BY",
  "CONFLICTS_EXISTING", "CONFLICTS_CANDIDATE",
  "PROPOSED_FOR_CONFLICT", "EVIDENCE_SNAPSHOT_FOR", "AUDITS_CONFLICT_PROPOSAL",
] as const;
export type ProvenanceRelationshipType = (typeof PROVENANCE_RELATIONSHIP_TYPES)[number];

export const CANDIDATE_KNOWLEDGE_STATES = [
  "PROPOSED", "VALIDATING", "CONFLICTED", "AWAITING_APPROVAL", "APPROVED", "REJECTED", "WITHDRAWN", "SUPERSEDED",
] as const;
export type CandidateKnowledgeState = (typeof CANDIDATE_KNOWLEDGE_STATES)[number];

export type ProvenanceActor = Readonly<{ actorId: string; actorType: "HUMAN" | "AGENT" | "SYSTEM" | "EXTERNAL" }>;

export type TeachingEvent = Readonly<{
  id: string;
  recordType: "TEACHING_EVENT";
  sourceType: ProvenanceSourceType;
  sourceActor: ProvenanceActor;
  originalContent: string;
  receivedAt: string;
  scopeHint?: KnowledgeScopeReference;
  immutable: true;
}>;

export type TeachingEventCaptureRequest = Readonly<{
  sourceType: ProvenanceSourceType;
  sourceActor: ProvenanceActor;
  originalContent: string;
  receivedAt?: string;
  scopeHint?: KnowledgeScopeReference;
  /** External correlation only; interpretation must never be written here. */
  sourceReference?: string;
}>;

export const TEACHING_EVENT_CAPTURE_STATUSES = ["CAPTURED", "REJECTED", "PERSISTENCE_FAILED"] as const;
export type TeachingEventCaptureStatus = (typeof TEACHING_EVENT_CAPTURE_STATUSES)[number];
export type TeachingEventCaptureReasonCode = "TEACHING_EVENT_CAPTURED" | "CONTENT_MISSING" | "ACTOR_UNKNOWN" | "TIMESTAMP_INVALID" | "PERSISTENCE_FAILED";
export type TeachingEventCaptureResult = Readonly<{
  status: TeachingEventCaptureStatus;
  reasonCode: TeachingEventCaptureReasonCode;
  teachingEvent?: TeachingEvent;
  created: boolean;
  persistenceEffect: "CREATED" | "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;

export type ExtractionRecord = Readonly<{
  id: string;
  recordType: "EXTRACTION";
  sourceRefs: readonly string[];
  interpretedBy: ProvenanceActor;
  classification: KnowledgeClassification;
  scope: KnowledgeScopeReference;
  interpretation: string;
  confidence: number;
  createdAt: string;
  immutable: true;
}>;

export type ExtractionRequest = Readonly<{
  sourceRefs: readonly string[];
  interpretedBy: ProvenanceActor;
  classification: KnowledgeClassification;
  scope: KnowledgeScopeReference;
  interpretation: string;
  confidence: number;
  createdAt?: string;
}>;

export const EXTRACTION_STATUSES = ["EXTRACTED", "REJECTED", "PERSISTENCE_FAILED"] as const;
export type ExtractionStatus = (typeof EXTRACTION_STATUSES)[number];
export type ExtractionReasonCode = "EXTRACTION_RECORDED" | "SOURCE_MISSING" | "SOURCE_NOT_TEACHING_EVENT" | "INTERPRETATION_MISSING" | "INTERPRETER_UNKNOWN" | "CONFIDENCE_INVALID" | "PERSISTENCE_FAILED";
export type ExtractionResult = Readonly<{
  status: ExtractionStatus;
  reasonCode: ExtractionReasonCode;
  extraction?: ExtractionRecord;
  relationships: readonly ProvenanceRelationship[];
  created: boolean;
  persistenceEffect: "CREATED" | "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;

export type CandidateKnowledgeRecord = Readonly<{
  id: string;
  recordType: "CANDIDATE_KNOWLEDGE";
  statement: string;
  classification: KnowledgeClassification;
  scope: KnowledgeScopeReference;
  authority: string;
  extractionRefs: readonly string[];
  evidenceRefs: readonly string[];
  status: CandidateKnowledgeState;
  createdAt: string;
  immutable: true;
}>;

export type CandidateKnowledgeRequest = Readonly<{
  statement: string;
  classification: KnowledgeClassification;
  scope: KnowledgeScopeReference;
  authority: string;
  extractionRefs: readonly string[];
  evidenceRefs?: readonly string[];
  status?: Extract<CandidateKnowledgeState, "PROPOSED" | "VALIDATING" | "CONFLICTED" | "AWAITING_APPROVAL">;
  createdAt?: string;
}>;

export const CANDIDATE_KNOWLEDGE_CREATION_STATUSES = ["CREATED", "REJECTED", "PERSISTENCE_FAILED"] as const;
export type CandidateKnowledgeCreationStatus = (typeof CANDIDATE_KNOWLEDGE_CREATION_STATUSES)[number];
export type CandidateKnowledgeCreationReasonCode = "CANDIDATE_KNOWLEDGE_CREATED" | "STATEMENT_MISSING" | "AUTHORITY_MISSING" | "EXTRACTION_MISSING" | "EXTRACTION_INVALID" | "EVIDENCE_MISSING" | "PERSISTENCE_FAILED";
export type CandidateKnowledgeCreationResult = Readonly<{
  status: CandidateKnowledgeCreationStatus;
  reasonCode: CandidateKnowledgeCreationReasonCode;
  candidate?: CandidateKnowledgeRecord;
  relationships: readonly ProvenanceRelationship[];
  created: boolean;
  persistenceEffect: "CREATED" | "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;

export type EvidenceSet = Readonly<{
  id: string;
  recordType: "EVIDENCE_SET";
  evidenceRefs: readonly string[];
  collectedBy: ProvenanceActor;
  createdAt: string;
  immutable: true;
}>;

export type EvidenceSetRequest = Readonly<{
  evidenceRefs: readonly string[];
  collectedBy: ProvenanceActor;
  createdAt?: string;
}>;
export type EvidenceSetResult = Readonly<{
  status: "CREATED" | "REJECTED" | "PERSISTENCE_FAILED";
  reasonCode: "EVIDENCE_SET_CREATED" | "EVIDENCE_MISSING" | "COLLECTOR_UNKNOWN" | "PERSISTENCE_FAILED";
  evidenceSet?: EvidenceSet;
  created: boolean;
  persistenceEffect: "CREATED" | "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;

export type HumanApprovalRequest = Readonly<{
  candidateId: string;
  decision: "APPROVED" | "REJECTED";
  actor: ProvenanceActor;
  approvedStatement: string;
  decidedAt?: string;
}>;
export type HumanApprovalResult = Readonly<{
  status: "RECORDED" | "REJECTED" | "PERSISTENCE_FAILED";
  reasonCode: "HUMAN_APPROVAL_RECORDED" | "CANDIDATE_MISSING" | "ACTOR_NOT_HUMAN" | "APPROVED_STATEMENT_MISSING" | "PERSISTENCE_FAILED";
  approval?: HumanApproval;
  relationship?: ProvenanceRelationship;
  created: boolean;
  persistenceEffect: "CREATED" | "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;

export type HumanApproval = Readonly<{
  id: string;
  recordType: "HUMAN_APPROVAL";
  candidateId: string;
  decision: "APPROVED" | "REJECTED";
  actor: ProvenanceActor;
  approvedStatement: string;
  decidedAt: string;
  immutable: true;
}>;

export type DurableProvenancedKnowledge = Readonly<{
  id: string;
  recordType: "DURABLE_KNOWLEDGE";
  statement: string;
  classification: KnowledgeClassification;
  scope: KnowledgeScopeReference;
  authority: string;
  candidateId: string;
  approvalId: string;
  evidenceRefs: readonly string[];
  status: "ACTIVE" | "SUPERSEDED" | "QUARANTINED" | "UNVERIFIED" | "INVALID" | "REQUIRES_REPAIR";
  createdAt: string;
  supersededAt?: string;
  immutable: true;
}>;

export type ProvenanceRecord = TeachingEvent | ExtractionRecord | CandidateKnowledgeRecord | EvidenceSet | HumanApproval | DurableProvenancedKnowledge | ConflictRecord | ConflictResolutionProposal | ResolutionEvidencePackage | ConflictAuditEvent;

export type ProvenanceRelationship = Readonly<{
  id: string;
  fromId: string;
  toId: string;
  type: ProvenanceRelationshipType;
  createdAt: string;
  actor: ProvenanceActor;
  immutable: true;
}>;

export type ProvenanceRelationshipRequest = Readonly<{
  fromId: string;
  toId: string;
  type: ProvenanceRelationshipType;
  actor: ProvenanceActor;
  createdAt?: string;
}>;
export type ProvenanceRelationshipResult = Readonly<{
  status: "CREATED" | "EXISTS" | "REJECTED" | "PERSISTENCE_FAILED";
  reasonCode: "RELATIONSHIP_CREATED" | "IDEMPOTENT_REPLAY" | "ENDPOINT_MISSING" | "SELF_RELATIONSHIP" | "ACTOR_UNKNOWN" | "PERSISTENCE_FAILED";
  relationship?: ProvenanceRelationship;
  created: boolean;
  persistenceEffect: "CREATED" | "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;

export type ProvenanceSupersessionRequest = Readonly<{
  priorKnowledgeId: string;
  successorKnowledgeId: string;
  reason: string;
  actor: ProvenanceActor;
  occurredAt?: string;
}>;
export type ProvenanceSupersessionResult = Readonly<{
  status: "SUPERSEDED" | "REJECTED" | "PERSISTENCE_FAILED";
  reasonCode: "KNOWLEDGE_SUPERSEDED" | "PRIOR_KNOWLEDGE_MISSING" | "SUCCESSOR_KNOWLEDGE_MISSING" | "SCOPE_INCOMPATIBLE" | "REASON_MISSING" | "ACTOR_NOT_HUMAN" | "CIRCULAR_SUPERSESSION" | "PERSISTENCE_FAILED";
  predecessor?: DurableProvenancedKnowledge;
  successor?: DurableProvenancedKnowledge;
  relationships: readonly ProvenanceRelationship[];
  created: boolean;
  persistenceEffect: "CREATED" | "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;

export type ProvenanceKnowledgeState = Readonly<{
  knowledgeId: string;
  current: boolean;
  historicalStatus: "ACTIVE" | "SUPERSEDED";
  predecessorIds: readonly string[];
  successorIds: readonly string[];
}>;

export type KnowledgeProvenanceExplanation = Readonly<{
  knowledgeId: string;
  currentState?: ProvenanceKnowledgeState;
  originalSources: readonly TeachingEvent[];
  interpretations: readonly ExtractionRecord[];
  approvals: readonly HumanApproval[];
  evidence: readonly ProvenanceRecord[];
  predecessors: readonly string[];
  successors: readonly string[];
  history: readonly ProvenanceRecord[];
  integrity: ProvenanceIntegrityResult;
}>;

export type ProvenanceIntegrityViolationCode =
  | "ORPHAN_KNOWLEDGE" | "MISSING_SOURCE" | "MISSING_INTERPRETATION" | "MISSING_APPROVAL"
  | "INVALID_AUTHORITY" | "BROKEN_LINEAGE" | "MISSING_REQUIRED_EVIDENCE" | "UNKNOWN_ACTOR"
  | "CIRCULAR_LINEAGE" | "INVALID_SUPERSESSION" | "MISSING_PREDECESSOR" | "MISSING_SUCCESSOR";

export type ProvenanceIntegrityResult = Readonly<{
  valid: boolean;
  violations: readonly ProvenanceIntegrityViolationCode[];
}>;

export type ProvenanceTrustState = "TRUSTED" | "QUARANTINED" | "UNVERIFIED" | "INVALID" | "REQUIRES_REPAIR";
export type ProvenanceIntegrityAssessment = Readonly<{
  knowledgeId: string;
  integrity: ProvenanceIntegrityResult;
  trustState: ProvenanceTrustState;
}>;
export type ProvenancePhaseExitReport = Readonly<{
  phase: "PHASE_7";
  passed: boolean;
  assessments: readonly ProvenanceIntegrityAssessment[];
  durableKnowledgeCount: number;
  trustedKnowledgeCount: number;
}>;

export type ProvenanceEnvelope = Readonly<{
  provenanceId: string;
  subjectRecordId: string;
  subjectRecordType: ProvenanceRecord["recordType"];
  sourceRefs: readonly string[];
  sourceActors: readonly ProvenanceActor[];
  extractionRefs: readonly string[];
  interpretationRefs: readonly string[];
  classification?: KnowledgeClassification;
  scope?: KnowledgeScopeReference;
  authority?: string;
  confidence?: number;
  evidenceRefs: readonly string[];
  approvalRefs: readonly string[];
  predecessorRefs: readonly string[];
  successorRefs: readonly string[];
  relationships: readonly ProvenanceRelationship[];
  createdAt: string;
  currentStatus?: DurableProvenancedKnowledge["status"] | CandidateKnowledgeState | ConflictRecord["status"];
}>;

export interface ProvenanceLedger {
  append(record: ProvenanceRecord): Promise<ProvenanceRecord>;
  relate(relationship: ProvenanceRelationship): Promise<ProvenanceRelationship>;
  get(recordId: string): Promise<ProvenanceRecord | undefined>;
  getRelationships(recordId: string): Promise<readonly ProvenanceRelationship[]>;
  getAll(): Promise<readonly ProvenanceRecord[]>;
}
