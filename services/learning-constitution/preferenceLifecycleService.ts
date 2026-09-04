import type { PreferenceArtifactStore, PreferenceLifecycleDecision } from "../../types/learning-constitution/preferenceLearning";
import type { LearningAuditLedger } from "../../types/learning-constitution/learningAuditLedger";

/** Preference lifecycle changes are human-issued interpretations, recorded beside—not inside—the original preference. */
export class PreferenceLifecycleService {
  constructor(private readonly artifacts: PreferenceArtifactStore, private readonly audit?: LearningAuditLedger) {}
  async record(decision: PreferenceLifecycleDecision, workspaceId: string, correlationId: string): Promise<Readonly<{ decision: PreferenceLifecycleDecision; persistenceEffect: "CREATED"; authorityEffect: "UNCHANGED"; executionPermissionGranted: false }>> {
    if (decision.actor.actorType !== "HUMAN" || !decision.actor.actorId.trim()) throw new Error("preference lifecycle decision requires a human actor"); if (!decision.reason.trim()) throw new Error("preference lifecycle decision requires a reason");
    if (decision.action === "ADD_EXCEPTION" && !decision.exception) throw new Error("exception decision requires an exception"); if (decision.action === "NARROW_SCOPE" && !decision.narrowedScope?.length) throw new Error("scope decision requires a narrowed scope"); if (decision.action === "SUPERSEDE" && !decision.successorPreferenceId?.trim()) throw new Error("supersession requires a successor preference");
    await this.artifacts.append({ artifactId: `PREFERENCE_${decision.action}:${decision.decisionId}`, artifactType: decision.action === "ADD_EXCEPTION" ? "EXCEPTION" : "LIFECYCLE", subjectId: decision.preferenceId, payload: decision, createdAt: decision.decidedAt });
    const eventType = decision.action === "ADD_EXCEPTION" ? "PREFERENCE_EXCEPTION_ADDED" : decision.action === "NARROW_SCOPE" ? "PREFERENCE_SCOPE_NARROWED" : decision.action === "REVOKE" ? "PREFERENCE_REVOKED" : "PREFERENCE_SUPERSEDED";
    if (this.audit) await this.audit.append({ eventId: `audit:preference-lifecycle:${decision.decisionId}`, eventType, workspaceId, occurredAt: decision.decidedAt, actor: decision.actor, correlationId, schemaVersion: "10.0", references: {}, payload: { preferenceId: decision.preferenceId, successorPreferenceId: decision.successorPreferenceId, narrowedScope: decision.narrowedScope, parentMutationAuthorized: false, executionPermissionGranted: false } });
    return { decision, persistenceEffect: "CREATED", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
  }
}
