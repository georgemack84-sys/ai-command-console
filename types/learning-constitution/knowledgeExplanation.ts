import type {
  DurableKnowledgeRecord,
  KnowledgeAuditEvent,
  KnowledgeException,
  KnowledgeReview,
  KnowledgeSupersession,
} from "./durableKnowledge";
import type { KnowledgeFreshnessAssessment } from "./knowledgeFreshness";
import type { KnowledgeScopeReference } from "./knowledgeScope";

export type KnowledgeExplanationRequest = Readonly<{
  knowledgeId: string;
  scope?: KnowledgeScopeReference;
}>;

export type KnowledgeExplanationTrace = Readonly<{
  knowledgeRecord: DurableKnowledgeRecord;
  auditEvents: readonly KnowledgeAuditEvent[];
  latestReview?: KnowledgeReview;
  freshness?: KnowledgeFreshnessAssessment;
  supersession?: KnowledgeSupersession;
  exception?: KnowledgeException;
  exceptionsToThisKnowledge: readonly KnowledgeException[];
}>;

export type KnowledgeExplanationResult = Readonly<{
  status: "COMPLETE" | "INCOMPLETE_HISTORY" | "NOT_FOUND" | "OUT_OF_SCOPE" | "EXPLANATION_FAILED";
  reasonCode: "KNOWLEDGE_HISTORY_EXPLAINED" | "ADMISSION_HISTORY_MISSING" | "KNOWLEDGE_NOT_FOUND" | "KNOWLEDGE_OUT_OF_SCOPE" | "EXPLANATION_FAILED";
  trace?: KnowledgeExplanationTrace;
  persistenceEffect: "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;

export interface KnowledgeExplanationService {
  explain(request: KnowledgeExplanationRequest): Promise<KnowledgeExplanationResult>;
}
