import type { LearningObjectiveProfile, LearningObjectiveType, MasteryLevel, SelectionRisk } from "../../types/learning-constitution/strategySelectionEngine";

const rank: Record<MasteryLevel, number> = { NOVICE: 0, DEVELOPING: 1, COMPETENT: 2, ADVANCED: 3, MASTERED: 4 };
/** Validates the canonical Phase 40 intake before it becomes durable selection input. */
export class ObjectiveProfileService {
  analyze(input: Omit<LearningObjectiveProfile, "immutable">): LearningObjectiveProfile {
    if (!input.profileId.trim() || !input.objectiveId.trim() || !input.domain.trim()) throw new Error("Objective-profile identity and domain are required.");
    if (!Number.isFinite(input.typeConfidence) || input.typeConfidence < 0 || input.typeConfidence > 1) throw new Error("Objective classification confidence must be between 0 and 1.");
    if (input.primaryType && input.secondaryTypes.includes(input.primaryType)) throw new Error("Primary learning type cannot also be a secondary type.");
    if (new Set(input.secondaryTypes).size !== input.secondaryTypes.length) throw new Error("Secondary learning types must be unique.");
    if (rank[input.targetMastery] < rank[input.currentMastery]) throw new Error("Target mastery cannot be below current mastery.");
    if (input.risk === "SECURITY_CRITICAL" && (input.transferRequirement !== "HIGH" || input.retentionRequirement !== "HIGH")) throw new Error("Security-critical objectives require high transfer and retention requirements.");
    return { ...input, immutable: true };
  }
  requiresClarification(profile: LearningObjectiveProfile, minimumConfidence: number) { return profile.primaryType === null || profile.typeConfidence < minimumConfidence; }
  defaultContext(primaryType: LearningObjectiveType | null): "FACTUAL" | "CONCEPTUAL" | "PROCEDURAL" | "REASONING" | "JUDGMENT" | "COMPLEX_SKILL" { return primaryType === "FACTUAL" ? "FACTUAL" : primaryType === "CONCEPTUAL" || primaryType === "PRINCIPLE" ? "CONCEPTUAL" : primaryType === "PROCEDURAL" ? "PROCEDURAL" : primaryType === "DECISION_JUDGMENT" ? "JUDGMENT" : "REASONING"; }
  riskTier(risk: SelectionRisk) { return risk === "SECURITY_CRITICAL" ? "HIGH" as const : risk; }
}
