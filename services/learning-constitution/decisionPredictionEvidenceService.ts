import type { DecisionPredictionArtifactStore, DecisionPredictionContextProfile, DecisionPredictionContradiction, DecisionPredictionEvidence, DecisionPredictionEvidenceSource, DecisionPredictionSimilarity } from "../../types/learning-constitution/decisionPrediction";

const validSourceTypes = new Set(["HUMAN_DECISION", "HUMAN_CORRECTION", "APPROVED_PRINCIPLE", "SCOPED_PREFERENCE", "APPROVED_PROCEDURE", "DECISION_PATTERN", "EXAMPLE", "EXCEPTION"]);
/** Collects only established evidence sources. Decision-prediction artifacts have no source adapter and are rejected at the boundary. */
export class DecisionPredictionEvidenceRetrievalService {
  constructor(private readonly sources: readonly DecisionPredictionEvidenceSource[]) {}
  async retrieve(input: Readonly<{ question: string; context: DecisionPredictionContextProfile; optionIds: readonly string[] }>): Promise<readonly DecisionPredictionEvidence[]> {
    if (!input.question.trim() || input.optionIds.length < 2 || !input.context.scope.trim()) throw new Error("prediction retrieval requires a question, scope, and multiple options"); const retrieved = (await Promise.all(this.sources.map((source) => source.retrieve(input)))).flat();
    return retrieved.filter((evidence, index) => evidence.evidenceId.trim() && evidence.sourceId.trim() && evidence.summary.trim() && input.optionIds.includes(evidence.optionId) && validSourceTypes.has(evidence.sourceType) && [evidence.authorityWeight, evidence.contextualRelevance, evidence.recency, evidence.consistency, evidence.scopeCompatibility].every((value) => Number.isFinite(value) && value >= 0 && value <= 1) && retrieved.findIndex((other) => other.evidenceId === evidence.evidenceId) === index);
  }
}
/** Separates decision-relevant differences from superficial resemblance before precedent can affect a prediction. */
export class DecisionPredictionSimilarityService {
  compare(input: Readonly<{ evidenceId: string; current: DecisionPredictionContextProfile; precedent: DecisionPredictionContextProfile }>): DecisionPredictionSimilarity {
    const normalize = (items: readonly string[]) => new Set(items.map((item) => item.trim().toLowerCase()).filter(Boolean)); const currentFactors = normalize([...input.current.factors, ...input.current.constraints]); const priorFactors = normalize([...input.precedent.factors, ...input.precedent.constraints]); const matching = [...currentFactors].filter((item) => priorFactors.has(item)); const differences = [...currentFactors].filter((item) => !priorFactors.has(item)); const surface = currentFactors.size ? matching.length / currentFactors.size : 0; const currentConstraints = normalize(input.current.constraints); const priorConstraints = normalize(input.precedent.constraints); const matchingConstraints = [...currentConstraints].filter((item) => priorConstraints.has(item)).length; const relevant = currentConstraints.size ? matchingConstraints / currentConstraints.size : surface;
    return { evidenceId: input.evidenceId, matchingFactors: matching, importantDifferences: differences, decisionRelevantSimilarity: relevant, surfaceSimilarity: surface };
  }
}
/** Contradicting support for different options remains visible and must lower later confidence unless an explanation is supplied. */
export class DecisionPredictionContradictionService {
  detect(evidence: readonly DecisionPredictionEvidence[], explanations: Readonly<Record<string, string>> = {}): readonly DecisionPredictionContradiction[] {
    const supporting = evidence.filter((item) => item.supports && item.contextualRelevance >= 0.5 && item.scopeCompatibility >= 0.5); const options = [...new Set(supporting.map((item) => item.optionId))]; if (options.length < 2) return []; return [{ contradictionId: `CONTRADICTION:${supporting.map((item) => item.evidenceId).sort().join(":")}`, optionIds: options.sort(), evidenceIds: supporting.map((item) => item.evidenceId).sort(), explanation: explanations[options.sort().join("|")] ?? null, confidenceEffect: explanations[options.sort().join("|")] ? "RESOLVED" : "REDUCE" }];
  }
}
export class DecisionPredictionEvidenceArtifactService {
  constructor(private readonly artifacts: DecisionPredictionArtifactStore) {}
  async record(predictionId: string, evidence: readonly DecisionPredictionEvidence[], contradictions: readonly DecisionPredictionContradiction[], createdAt: string): Promise<void> { await this.artifacts.append({ artifactId: `DECISION_PREDICTION_RETRIEVAL:${predictionId}`, artifactType: "RETRIEVAL", subjectId: predictionId, payload: evidence, createdAt }); for (const contradiction of contradictions) await this.artifacts.append({ artifactId: `DECISION_PREDICTION_CONTRADICTION:${contradiction.contradictionId}`, artifactType: "CONTRADICTION", subjectId: predictionId, payload: contradiction, createdAt }); }
}
