import type { ActivePreference, PreferenceArtifactStore, PreferenceReinforcement, PreferenceReinforcementResult, PreferenceStrength } from "../../types/learning-constitution/preferenceLearning";
import type { LearningAuditLedger } from "../../types/learning-constitution/learningAuditLedger";
import type { KnowledgeScopeReference } from "../../types/learning-constitution/knowledgeScope";

const ranks: PreferenceStrength[] = ["WEAK", "NORMAL", "STRONG", "EXPLICIT", "MANDATORY"];
const key = (scope: KnowledgeScopeReference) => `${scope.type}:${"id" in scope ? scope.id ?? "" : ""}`;
const contained = (observed: readonly KnowledgeScopeReference[], established: readonly KnowledgeScopeReference[]) => observed.every((scope) => established.some((item) => key(item) === key(scope)));
/** Reinforces only within the established boundary; scope expansion is evidence for review, never an automatic mutation. */
export class PreferenceReinforcementService {
  constructor(private readonly artifacts: PreferenceArtifactStore, private readonly audit?: LearningAuditLedger) {}
  async record(preference: ActivePreference, reinforcement: PreferenceReinforcement, workspaceId: string, correlationId: string): Promise<PreferenceReinforcementResult> {
    if (preference.preferenceId !== reinforcement.preferenceId) throw new Error("reinforcement preference mismatch");
    if (!contained(reinforcement.observedScope, preference.candidate.scope)) return { preferenceId: preference.preferenceId, status: "DEFERRED", reason: "SCOPE_EXPANSION_REQUIRES_REVIEW", nextStrength: preference.candidate.strength, nextConfidence: preference.candidate.confidence, persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
    const nextConfidence = Math.min(1, preference.candidate.confidence + Math.max(0, reinforcement.evidence.weight) * 0.1); const index = ranks.indexOf(preference.candidate.strength); const nextStrength = nextConfidence >= 0.9 && index < ranks.length - 1 ? ranks[index + 1]! : preference.candidate.strength;
    const result: PreferenceReinforcementResult = { preferenceId: preference.preferenceId, status: "RECORDED", reason: "REINFORCED_WITHIN_SCOPE", nextStrength, nextConfidence, persistenceEffect: "CREATED", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
    await this.artifacts.append({ artifactId: `PREFERENCE_REINFORCEMENT:${reinforcement.reinforcementId}`, artifactType: "REINFORCEMENT", subjectId: preference.preferenceId, payload: { reinforcement, result }, createdAt: reinforcement.observedAt });
    if (this.audit) await this.audit.append({ eventId: `audit:preference-reinforcement:${reinforcement.reinforcementId}`, eventType: nextStrength === preference.candidate.strength ? "PREFERENCE_REINFORCED" : "PREFERENCE_STRENGTH_CHANGED", workspaceId, occurredAt: reinforcement.observedAt, actor: reinforcement.actor, correlationId, schemaVersion: "10.0", references: { provenanceIds: [reinforcement.evidence.provenanceId] }, payload: { preferenceId: preference.preferenceId, priorStrength: preference.candidate.strength, nextStrength, priorConfidence: preference.candidate.confidence, nextConfidence, scopeExpanded: false, executionPermissionGranted: false } });
    return result;
  }
}
