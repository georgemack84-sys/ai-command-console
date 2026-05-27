export type ReadinessRiskLevel = "low" | "moderate" | "high" | "critical";

export type ReadinessDomainScore = Readonly<{
  domain: string;
  score: number;
}>;

export type RecommendationReadinessRecord = Readonly<{
  readinessId: string;
  recommendationAnomalyRate: number;
  confidenceVolatilityScore: number;
  recommendationIntegrityStable: boolean;
  verificationHash: string;
}>;

export type DriftResistanceRecord = Readonly<{
  readinessId: string;
  driftPressureScore: number;
  driftResistant: boolean;
  verificationHash: string;
}>;

export type ReadinessRiskProfile = Readonly<{
  riskId: string;
  readinessId: string;
  riskLevel: ReadinessRiskLevel;
  aggregateScore: number;
  scores: readonly ReadinessDomainScore[];
  deterministicHash: string;
}>;
