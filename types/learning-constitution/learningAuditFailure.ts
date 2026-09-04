import type { LearningAuditEventType, LearningAuditLedger } from "./learningAuditLedger";
import type { ProvenanceActor } from "./provenance";

export type LearningIntegrityFailureType = Extract<LearningAuditEventType, "LEARNING_TRANSITION_FAILED" | "AUDIT_APPEND_FAILED" | "INTEGRITY_CHECK_FAILED" | "REPLAY_MISMATCH_DETECTED" | "UNAUTHORIZED_MUTATION_ATTEMPTED" | "CONSTITUTION_VIOLATION_DETECTED" | "INVALID_STATE_TRANSITION" | "INVALID_AUTHORITY_TRANSITION">;
export type LearningIntegrityFailure = Readonly<{ eventId: string; eventType: LearningIntegrityFailureType; workspaceId: string; occurredAt: string; actor: ProvenanceActor; correlationId: string; causationId?: string; references?: Readonly<{ knowledgeIds?: readonly string[]; gateEvaluationId?: string; provenanceIds?: readonly string[] }>; reason: string }>;
export interface LearningIntegrityFailureRecorder { record(failure: LearningIntegrityFailure): Promise<void>; }
export type LearningFailureLedger = Pick<LearningAuditLedger, "append">;
