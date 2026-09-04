import type { DurableLearningGateRequest, GateDecision, GateReasonCode } from "./durableLearningGate";
import type { KnowledgeAdmissionRequest } from "./durableKnowledge";

export type DeferredCandidateStatus = "PENDING" | "COMMITTED" | "REJECTED" | "RE_EVALUATION_REQUIRED";

export type DeferredCandidateRecord = Readonly<{
  deferredCandidateId: string;
  candidateId: string;
  lastEvaluationId: string;
  reasonCodes: readonly GateReasonCode[];
  status: DeferredCandidateStatus;
  createdAt: string;
  updatedAt: string;
}>;

export interface DeferredCandidateRegistry {
  upsert(record: DeferredCandidateRecord): Promise<DeferredCandidateRecord>;
  get(deferredCandidateId: string): Promise<DeferredCandidateRecord | undefined>;
  list(status?: DeferredCandidateStatus): Promise<readonly DeferredCandidateRecord[]>;
}

export type DeferredCandidateReevaluationInput = Readonly<{
  gateRequest: DurableLearningGateRequest;
  admission: KnowledgeAdmissionRequest;
}>;

export type DeferredCandidateReevaluationResult = Readonly<{
  status: DeferredCandidateStatus | "NOT_FOUND" | "CANDIDATE_MISMATCH";
  record?: DeferredCandidateRecord;
  gateDecision?: GateDecision;
  persistenceEffect: "CREATED" | "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;
