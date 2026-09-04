import type { CorrectionAnalysis, CorrectionErrorType, CorrectionSeverity, CorrectionTargetCandidate, CorrectionTargetResolutionInput, CorrectionTargetResolver } from "../../types/learning-constitution/correctionLearning";
import type { LearningAuditLedger } from "../../types/learning-constitution/learningAuditLedger";

const bounded = (value: number) => Math.max(0, Math.min(1, value));
const score = (candidate: CorrectionTargetCandidate) => bounded(candidate.relevance * 0.7 + candidate.recency * 0.2 + (candidate.directReference ? 0.1 : 0));

/** Produces an explainable, conservative target analysis; candidate scores must be supplied by the caller. */
export class ConservativeCorrectionTargetResolver implements CorrectionTargetResolver {
  resolve(input: CorrectionTargetResolutionInput): CorrectionAnalysis {
    const ranked = input.candidates.map((candidate) => ({ candidate, confidence: score(candidate) })).sort((left, right) => right.confidence - left.confidence);
    const strong = ranked.filter((item) => item.confidence >= 0.8);
    const top = ranked[0]; const second = ranked[1];
    const resolution = !top || top.confidence < 0.8 ? "UNRESOLVED_TARGET" : strong.length > 1 && (top.confidence - strong.at(-1)!.confidence) <= 0.15 ? "MULTIPLE_TARGETS" : top.candidate.directReference && top.confidence >= 0.95 ? "DIRECT_TARGET" : "LIKELY_TARGET";
    const targets = resolution === "UNRESOLVED_TARGET" ? [] : (resolution === "MULTIPLE_TARGETS" ? strong : [top]).map(({ candidate, confidence }) => ({ targetId: candidate.targetId, confidence, rationale: candidate.rationale }));
    return { correctionId: input.correctionId, targetResolution: resolution, targets, errorType: input.errorType ?? "UNKNOWN_ERROR", severity: input.severity ?? "MODERATE", rationale: input.rationale, analyzedAt: input.analyzedAt, immutable: true };
  }
}

/** Text heuristics are deliberately modest: they classify a suspected error, never authorize repair. */
export class ConservativeCorrectionErrorClassifier {
  classify(statement: string): Readonly<{ errorType: CorrectionErrorType; severity: CorrectionSeverity; rationale: string }> {
    const text = statement.toLowerCase();
    if (/too broadly|everything|all applications|all projects/.test(text)) return { errorType: "OVERGENERALIZATION", severity: "MAJOR", rationale: "Correction explicitly rejects a broad application." };
    if (/only|scope|not true for/.test(text)) return { errorType: "SCOPE_ERROR", severity: "MODERATE", rationale: "Correction narrows an apparent scope boundary." };
    if (/outdated|stale|no longer/.test(text)) return { errorType: "STALE_KNOWLEDGE", severity: "MODERATE", rationale: "Correction indicates temporal invalidation." };
    if (/suggestion.*decision|brainstorm.*decision/.test(text)) return { errorType: "MISINTERPRETATION", severity: "MAJOR", rationale: "Correction indicates an utterance was interpreted as a stronger claim." };
    return { errorType: "UNKNOWN_ERROR", severity: "MODERATE", rationale: "No safe root error type can be inferred from the correction alone." };
  }
}

export class CorrectionAnalysisService {
  constructor(private readonly resolver: CorrectionTargetResolver, private readonly audit?: LearningAuditLedger) {}
  async analyze(input: CorrectionTargetResolutionInput, workspaceId: string, actor: { actorId: string; actorType: "HUMAN" | "AGENT" | "SYSTEM" }, correlationId: string): Promise<CorrectionAnalysis> {
    const analysis = this.resolver.resolve(input);
    if (this.audit) {
      await this.audit.append({ eventId: `audit:${input.correctionId}:target:${analysis.analyzedAt}`, eventType: analysis.targetResolution === "UNRESOLVED_TARGET" ? "CORRECTION_TARGET_UNRESOLVED" : "CORRECTION_TARGET_IDENTIFIED", workspaceId, occurredAt: analysis.analyzedAt, actor, correlationId, schemaVersion: "10.0", references: { correctionIds: [input.correctionId], knowledgeIds: analysis.targets.map((target) => target.targetId) }, payload: { targetResolution: analysis.targetResolution, targetCount: analysis.targets.length } });
      await this.audit.append({ eventId: `audit:${input.correctionId}:classification:${analysis.analyzedAt}`, eventType: "ERROR_CLASSIFIED", workspaceId, occurredAt: analysis.analyzedAt, actor, correlationId, schemaVersion: "10.0", references: { correctionIds: [input.correctionId], knowledgeIds: analysis.targets.map((target) => target.targetId) }, payload: { errorType: analysis.errorType, severity: analysis.severity, rationale: analysis.rationale } });
    }
    return analysis;
  }
}
