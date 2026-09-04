import type { LearningAuditEntry, LearningAuditLedger } from "./learningAuditLedger";

export type KnowledgeAuditHistory = Readonly<{ workspaceId: string; knowledgeId: string; entries: readonly LearningAuditEntry[]; persistenceEffect: "NONE"; authorityEffect: "UNCHANGED"; executionPermissionGranted: false }>;
export type KnowledgeAuditExplanation = Readonly<{
  status: "COMPLETE" | "EXPLANATION_INCOMPLETE" | "NOT_FOUND";
  knowledgeId: string;
  learnedAt?: string;
  actorId?: string;
  gateEvaluationId?: string;
  provenanceIds: readonly string[];
  conflictIds: readonly string[];
  authorityIds: readonly string[];
  missing: readonly string[];
  entries: readonly LearningAuditEntry[];
  persistenceEffect: "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;

export interface LearningAuditQuery { history(workspaceId: string, knowledgeId: string): Promise<KnowledgeAuditHistory>; }
export interface AuditExplanationService { explain(workspaceId: string, knowledgeId: string): Promise<KnowledgeAuditExplanation>; }
export type LearningAuditReadableLedger = Pick<LearningAuditLedger, "findByKnowledgeId">;
