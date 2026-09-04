import type { PreferenceCandidate, PreferenceInterpretation, PreferenceInterpretationInput, PreferencePolarity, PreferenceStrength } from "../../types/learning-constitution/preferenceLearning";

/** Conservative language interpreter. Direct instructions are deliberately classified out of preference learning. */
export class PreferenceInterpretationService {
  interpret(input: PreferenceInterpretationInput): PreferenceInterpretation {
    const text = input.statement.trim(); const lower = text.toLowerCase();
    if (!text) return this.result(input, "UNRESOLVED", undefined, undefined, [], 0, ["STATEMENT_REQUIRED"]);
    if (/^(use|build|create|implement)\b/.test(lower) || /\balways use\b/.test(lower) || /\bnever\b/.test(lower)) return this.result(input, "DIRECTIVE", undefined, undefined, [], 0.95, ["DIRECTIVE_LANGUAGE"]);
    const polarity: PreferencePolarity | undefined = /\b(?:avoid|rather not|dislike)\b/.test(lower) ? "AVOID" : /\b(?:like|prefer|favor)\b/.test(lower) ? "PREFER" : undefined;
    if (!polarity) return this.result(input, "UNRESOLVED", undefined, undefined, [], 0, ["PREFERENCE_LANGUAGE_NOT_DETECTED"]);
    const strength: PreferenceStrength = /\b(?:always|must|required)\b/.test(lower) ? "MANDATORY" : /\b(?:generally|usually)\b/.test(lower) ? "NORMAL" : /\b(?:strongly|really)\b/.test(lower) ? "STRONG" : "WEAK";
    const scope = input.activeScopes.filter((item) => item.type !== "GLOBAL" && item.type !== "SYSTEM"); const confidence = scope.length ? 0.8 : 0.45;
    if (!scope.length) return this.result(input, "UNRESOLVED", polarity, strength, [], confidence, ["SCOPE_UNRESOLVED"]);
    const candidate: PreferenceCandidate = { preferenceId: `preference:${input.interpretationId}`, ownerId: input.ownerId, subject: "interpreted preference", preferredOption: text, polarity, scope, strength, evidence: [{ evidenceId: `evidence:${input.interpretationId}`, kind: "EXPLICIT_STATEMENT", provenanceId: input.provenanceId, observedAt: input.occurredAt, weight: 1 }], lastReinforcedAt: input.occurredAt, exceptions: [], confidence, provenanceIds: [input.provenanceId], authority: "HUMAN_PREFERENCE", status: "CANDIDATE", universalClaim: false, directiveClaim: false, principleClaim: false, createdBy: input.actor, createdAt: input.occurredAt, immutable: true, executionPermissionGranted: false };
    return this.result(input, "PREFERENCE", polarity, strength, scope, confidence, ["PREFERENCE_DETECTED"], candidate);
  }
  private result(input: PreferenceInterpretationInput, classification: PreferenceInterpretation["classification"], polarity: PreferencePolarity | undefined, strength: PreferenceStrength | undefined, scope: PreferenceInterpretation["scope"], confidence: number, reasonCodes: readonly string[], candidate?: PreferenceCandidate): PreferenceInterpretation { return { interpretationId: input.interpretationId, classification, polarity, strength, scope, confidence, reasonCodes, candidate, persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false }; }
}
