import type { AuthorityGateResult } from "./authorityEnforcement";
import type { ConstitutionalAdmissionDecision } from "./constitutionalAdmission";
import type { ConflictAdmissionGateResult } from "./conflictAdmission";
import type { DurableKnowledgeCandidate } from "./durableKnowledge";
import type { InformationClassificationResult } from "./informationClassification";
import type { KnowledgeScopeResolutionResult } from "./knowledgeScope";
import type { KnowledgeValidationResult } from "./knowledgeValidation";
import type { SourceCriticismDecision } from "./sourceCriticism";
import type { EpistemicPosition } from "./epistemicSynthesis";

/** The only stable dispositions emitted by the Phase 9 durable-learning boundary. */
export const GATE_OUTCOMES = ["ACCEPT", "DEFER", "REJECT"] as const;
export type GateOutcome = (typeof GATE_OUTCOMES)[number];

export const GATE_REASON_CODES = [
  "GATE_ACCEPTED",
  "CANDIDATE_ID_MISSING",
  "CANDIDATE_CONTENT_MISSING",
  "PROVENANCE_MISSING",
  "CLASSIFICATION_INCONSISTENT",
  "CLASSIFICATION_AMBIGUOUS",
  "NOT_DURABLE_CLASSIFICATION",
  "INTENT_NOT_ESTABLISHED",
  "SCOPE_UNRESOLVED",
  "AUTHORITY_INSUFFICIENT",
  "AUTHORITY_UNCERTAIN",
  "CONFLICT_UNRESOLVED",
  "VALIDATION_INCOMPLETE",
  "VALIDATION_FAILED",
  "CONSTITUTIONAL_VETO",
  "CONSTITUTIONAL_REVIEW_REQUIRED",
  "POLICY_CONTEXT_INCOMPLETE",
  "AUDIT_PERSISTENCE_FAILED",
  "TEACH_BACK_REQUIRED",
  "TEACH_BACK_INSUFFICIENT",
  "SOURCE_INSUFFICIENT",
  "SOURCE_UNVERIFIED",
  "SOURCE_OUT_OF_SCOPE",
  "SOURCE_DERIVATIVE",
  "SOURCE_CONFLICT_UNRESOLVED",
  "SOURCE_AUTHORITY_INSUFFICIENT",
  "EPISTEMIC_POSITION_INSUFFICIENT",
  "EPISTEMIC_POSITION_SUSPENDED",
  "EPISTEMIC_POSITION_REFUTED",
] as const;
export type GateReasonCode = (typeof GATE_REASON_CODES)[number];

export const GATE_CHECK_STAGES = [
  "INTEGRITY",
  "CLASSIFICATION",
  "INTENT",
  "SCOPE",
  "AUTHORITY",
  "CONFLICT",
  "VALIDATION",
  "CONSTITUTION",
  "TEACH_BACK",
  "SOURCE_CRITICISM",
  "EPISTEMIC_SYNTHESIS",
] as const;
export type GateCheckStage = (typeof GATE_CHECK_STAGES)[number];
export type GateCheckStatus = "PASS" | "DEFER" | "REJECT";

export type GateCheck = Readonly<{
  stage: GateCheckStage;
  status: GateCheckStatus;
  reasonCode: GateReasonCode;
}>;

export type LearningIntent = "EXPLICIT" | "APPROVED" | "IMPLICIT" | "NONE" | "UNKNOWN";

/** Versioned inputs that make a decision explainable and replayable. */
export type GateContext = Readonly<{
  gateVersion: string;
  constitutionVersion: string;
  taxonomyVersion: string;
  authorityPolicyVersion: string;
  validationPolicyVersion: string;
  conflictEngineVersion: string;
  registryVersion: string;
  learningIntent: LearningIntent;
  decisionActorId: string;
  teachBack?: Readonly<{ requirement: "NOT_REQUIRED" | "OPTIONAL" | "REQUIRED"; outcome?: "PASS" | "PASS_WITH_UNCERTAINTY" | "PARTIAL" | "CLARIFICATION_REQUIRED" | "FAIL" }>;
}>;

export type DurableLearningGateRequest = Readonly<{
  evaluationId: string;
  candidate: DurableKnowledgeCandidate;
  classification: InformationClassificationResult;
  scope: KnowledgeScopeResolutionResult;
  authority: AuthorityGateResult;
  conflict: ConflictAdmissionGateResult;
  validation: KnowledgeValidationResult;
  constitution: ConstitutionalAdmissionDecision;
  /** Phase 29 evidence assessment. Omission is retained only for pre-Phase-29 legacy candidates. */
  sourceCriticism?: SourceCriticismDecision;
  /** Phase 30 belief position. Omission is retained only for pre-Phase-30 legacy candidates. */
  epistemicPosition?: EpistemicPosition;
  context: GateContext;
}>;

/** Capability bound to precisely the candidate and registry state that were evaluated. */
export type CommitAuthorization = Readonly<{
  authorizationId: string;
  evaluationId: string;
  candidateId: string;
  candidateFingerprint: string;
  classification: DurableKnowledgeCandidate["classification"];
  scope: NonNullable<KnowledgeScopeResolutionResult["scope"]>;
  registryVersion: string;
  gateVersion: string;
}>;

export type GateDecision = Readonly<{
  evaluationId: string;
  candidateId: string;
  outcome: GateOutcome;
  reasonCodes: readonly GateReasonCode[];
  checks: readonly GateCheck[];
  inputFingerprint: string;
  context: GateContext;
  commitAuthorization?: CommitAuthorization;
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;

export type GateAuditEvent = Readonly<{
  eventId: string;
  eventType: "DURABLE_LEARNING_GATE_EVALUATED";
  decision: GateDecision;
  /** Captured for deterministic replay; legacy audit entries may not contain it. */
  request?: DurableLearningGateRequest;
  occurredAt: string;
}>;

export interface GateAuditLedger {
  append(event: GateAuditEvent): Promise<GateAuditEvent>;
  findByCandidateId(candidateId: string): Promise<readonly GateAuditEvent[]>;
}

export interface DurableLearningGate {
  evaluate(request: DurableLearningGateRequest): Promise<GateDecision>;
}
