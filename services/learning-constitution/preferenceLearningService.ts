import type { PreferenceArtifactStore, PreferenceCandidate, PreferenceValidation, PreferenceValidationReason, PreferenceValidator } from "../../types/learning-constitution/preferenceLearning";
import type { LearningAuditLedger } from "../../types/learning-constitution/learningAuditLedger";

/** Enforces the Phase 16 boundary: preferences are owner-scoped behavioral guidance, never law. */
export class ConservativePreferenceValidator implements PreferenceValidator {
  validate(candidate: PreferenceCandidate): PreferenceValidation {
    const reasons: PreferenceValidationReason[] = [];
    if (!candidate.ownerId.trim()) reasons.push("OWNER_REQUIRED"); if (!candidate.scope.length) reasons.push("SCOPE_REQUIRED"); if (!candidate.evidence.length || !candidate.provenanceIds.length) reasons.push("EVIDENCE_REQUIRED");
    if (candidate.scope.some((scope) => scope.type === "GLOBAL" || scope.type === "SYSTEM")) reasons.push("SCOPE_EXPANSION"); if (candidate.universalClaim) reasons.push("PREFERENCE_CLAIMS_UNIVERSAL_RULE"); if (candidate.directiveClaim) reasons.push("PREFERENCE_CLAIMS_DIRECTIVE"); if (candidate.principleClaim) reasons.push("PREFERENCE_CLAIMS_PRINCIPLE"); if (!Number.isFinite(candidate.confidence) || candidate.confidence < 0 || candidate.confidence > 1) reasons.push("CONFIDENCE_INVALID");
    const reject = reasons.includes("OWNER_REQUIRED") || reasons.includes("EVIDENCE_REQUIRED") || reasons.includes("PREFERENCE_CLAIMS_UNIVERSAL_RULE") || reasons.includes("PREFERENCE_CLAIMS_DIRECTIVE") || reasons.includes("PREFERENCE_CLAIMS_PRINCIPLE") || reasons.includes("CONFIDENCE_INVALID");
    return { preferenceId: candidate.preferenceId, status: reject ? "REJECT" : reasons.length ? "DEFER" : "VALID", reasonCodes: reasons.length ? reasons : ["PREFERENCE_VALID"], persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
  }
}
export class PreferenceCandidateService {
  constructor(private readonly validator: PreferenceValidator, private readonly audit?: LearningAuditLedger, private readonly artifacts?: PreferenceArtifactStore) {}
  async assess(candidate: PreferenceCandidate, workspaceId: string, correlationId: string): Promise<PreferenceValidation> {
    const validation = this.validator.validate(candidate); await this.artifacts?.append({ artifactId: `PREFERENCE_CANDIDATE:${candidate.preferenceId}`, artifactType: "CANDIDATE", subjectId: candidate.preferenceId, payload: candidate, createdAt: candidate.createdAt }); await this.artifacts?.append({ artifactId: `PREFERENCE_VALIDATION:${candidate.preferenceId}:${correlationId}`, artifactType: "VALIDATION", subjectId: candidate.preferenceId, payload: validation, createdAt: candidate.createdAt }); if (this.audit) await this.audit.append({ eventId: `audit:preference:${candidate.preferenceId}:${correlationId}`, eventType: "PREFERENCE_CANDIDATE_CREATED", workspaceId, occurredAt: candidate.createdAt, actor: candidate.createdBy, correlationId, schemaVersion: "10.0", references: { provenanceIds: candidate.provenanceIds }, payload: { preferenceId: candidate.preferenceId, ownerId: candidate.ownerId, strength: candidate.strength, scope: candidate.scope, validationStatus: validation.status, universalClaim: false, directiveClaim: false, executionPermissionGranted: false } }); return validation;
  }
}
