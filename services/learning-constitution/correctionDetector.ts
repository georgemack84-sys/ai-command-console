import type { CorrectionDetectionInput, CorrectionDetector, CorrectionSignal } from "../../types/learning-constitution/correctionLearning";

const explicitPhrases = ["that's wrong", "that is wrong", "that's incorrect", "that is incorrect", "not exactly", "that's not what i meant", "that is not what i meant", "change that", "don't do that", "do not do that", "i told you something different", "i meant "];
const implicitPatterns = [/\bactually,?\b/i, /\bonly applies when\b/i, /\byou(?:'re| are) applying that too broadly\b/i];

/** Conservative lexical detector. A signal begins investigation only; it cannot alter durable knowledge. */
export class ConservativeCorrectionDetector implements CorrectionDetector {
  detect(input: CorrectionDetectionInput): CorrectionSignal | null {
    const text = input.sourceText.trim(); const normalized = text.toLowerCase();
    const phrase = explicitPhrases.find((candidate) => normalized.includes(candidate));
    const implicit = !phrase && implicitPatterns.some((pattern) => pattern.test(text));
    const bareNo = /^no[.!\s]/i.test(text);
    if (!phrase && !implicit && !bareNo) return null;
    return { correctionId: input.correctionId, sourceEventId: input.sourceEventId, sourceText: text, detectedPhrase: phrase ?? (bareNo ? "no" : "implicit correction"), targetCandidateIds: input.targetCandidateIds ?? [], explicitness: phrase || bareNo ? "EXPLICIT" : "IMPLICIT", confidence: phrase || bareNo ? 0.95 : 0.75, actor: input.actor, timestamp: input.timestamp, processingStatus: "DETECTED", immutable: true };
  }
}
