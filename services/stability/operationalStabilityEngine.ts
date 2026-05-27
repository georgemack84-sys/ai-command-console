import { analyzeDegradation, type StabilityTrend } from "./degradationAnalysis";
import {
  clampMetric,
  computeDependencyInstabilityScore,
  computeEscalationPressure,
  computeOperatorInterventionPressure,
  computeRecoveryPressure,
  computeRecoverySuccessConfidence,
  computeReplayInstabilityScore,
  computeStaleExecutionSpread,
} from "./stabilityMetrics";
import { scoreOperationalSurvivability } from "./survivabilityScoring";

export type OperationalStabilityAssessment = {
  operationalState: string;
  survivabilityScore: number;
  degradationRate: number;
  recoveryPressure: number;
  escalationPressure: number;
  continuityConfidence: number;
  unstableSubsystems: string[];
  stabilizationRequired: boolean;
  containmentRecommended: boolean;
  lockdownRecommended: boolean;
  replayInstabilityScore: number;
  staleExecutionSpread: number;
  dependencyInstabilityScore: number;
  operatorInterventionPressure: number;
  recoverySuccessConfidence: number;
  trend: StabilityTrend;
  confidence: number;
  reasons: string[];
  disputed: boolean;
  timestamp: string;
};

export type OperationalStabilityInput = {
  stewardshipState?: string;
  stewardshipSignals?: {
    freezeRequired?: boolean;
    containmentRequired?: boolean;
    escalationRequired?: boolean;
    disputed?: boolean;
  };
  survivabilityForecast?: {
    collapseRisk?: number;
    survivabilityScore?: number;
    confidence?: number;
    reasons?: string[];
  };
  continuity?: {
    continuityConfidence?: number;
    staleExecutions?: number;
    degradedDependencies?: string[];
    activeRecoveries?: number;
  };
  replay?: {
    divergenceCount?: number;
    divergenceSeverity?: number;
  };
  recovery?: {
    activeRecoveries?: number;
    failedRecoveries?: number;
    successfulRecoveries?: number;
    repeatedFailures?: number;
  };
  escalation?: {
    escalationCount?: number;
    unresolvedEscalations?: number;
  };
  operator?: {
    interventionCount?: number;
  };
  timestamp?: string;
};

function deriveOperationalState({
  disputed,
  score,
  trend,
  stabilizationRequired,
  containmentRecommended,
  lockdownRecommended,
}: {
  disputed: boolean;
  score: number;
  trend: StabilityTrend;
  stabilizationRequired: boolean;
  containmentRecommended: boolean;
  lockdownRecommended: boolean;
}) {
  if (disputed) return "DISPUTED";
  if (lockdownRecommended || trend === "COLLAPSING" || score <= 0.12) return "COLLAPSING";
  if (containmentRecommended || score <= 0.28) return "CRITICAL";
  if (trend === "DECLINING" || stabilizationRequired || score <= 0.48) return "UNSTABLE";
  if (score <= 0.68) return "DEGRADED";
  if (score <= 0.82) return "WATCH";
  return "STABLE";
}

export function assessOperationalStability(input: OperationalStabilityInput): OperationalStabilityAssessment {
  const disputed = Boolean(input.stewardshipSignals?.disputed || input.stewardshipState === "DISPUTED");
  const continuityConfidence = clampMetric(input.continuity?.continuityConfidence, 0.35);
  const replayInstabilityScore = computeReplayInstabilityScore({
    divergenceCount: input.replay?.divergenceCount,
    divergenceSeverity: input.replay?.divergenceSeverity,
  });
  const staleExecutionSpread = computeStaleExecutionSpread(
    input.continuity?.staleExecutions || 0,
    input.recovery?.activeRecoveries ?? input.continuity?.activeRecoveries ?? 0,
  );
  const dependencyInstabilityScore = computeDependencyInstabilityScore(input.continuity?.degradedDependencies || []);
  const recoveryPressure = computeRecoveryPressure({
    activeRecoveries: input.recovery?.activeRecoveries ?? input.continuity?.activeRecoveries,
    failedRecoveries: input.recovery?.failedRecoveries,
    repeatedFailures: input.recovery?.repeatedFailures,
  });
  const escalationPressure = computeEscalationPressure({
    escalationCount: input.escalation?.escalationCount,
    unresolvedEscalations: input.escalation?.unresolvedEscalations,
  });
  const operatorInterventionPressure = computeOperatorInterventionPressure(input.operator?.interventionCount);
  const recoverySuccessConfidence = computeRecoverySuccessConfidence({
    successfulRecoveries: input.recovery?.successfulRecoveries,
    failedRecoveries: input.recovery?.failedRecoveries,
    repeatedFailures: input.recovery?.repeatedFailures,
  });

  const degradation = analyzeDegradation({
    staleExecutions: input.continuity?.staleExecutions,
    degradedDependencies: input.continuity?.degradedDependencies,
    replayDivergence: replayInstabilityScore > 0.35,
    repeatedRecoveryFailures: input.recovery?.repeatedFailures,
    unresolvedEscalations: input.escalation?.unresolvedEscalations,
    containmentRequired: Boolean(input.stewardshipSignals?.containmentRequired),
    freezeRequired: Boolean(input.stewardshipSignals?.freezeRequired),
    disputed,
  });

  const collapseRisk = Math.max(
    clampMetric(input.survivabilityForecast?.collapseRisk, 0.25),
    recoveryPressure * 0.5,
    escalationPressure * 0.55,
    replayInstabilityScore * 0.8,
  );

  const survivability = scoreOperationalSurvivability({
    continuityConfidence,
    replayInstabilityScore,
    staleExecutionSpread,
    dependencyInstabilityScore,
    escalationPressure,
    recoverySuccessConfidence,
    disputed,
    freezeRequired: Boolean(input.stewardshipSignals?.freezeRequired),
    containmentRequired: Boolean(input.stewardshipSignals?.containmentRequired),
    degradationRate: degradation.degradationRate,
    collapseRisk,
    trend: degradation.trend,
  });

  const unstableSubsystems = Array.from(new Set([
    ...(input.continuity?.degradedDependencies || []),
    ...(replayInstabilityScore > 0.35 ? ["replay"] : []),
    ...(staleExecutionSpread > 0.35 ? ["execution"] : []),
    ...(escalationPressure > 0.4 ? ["governance"] : []),
    ...(recoveryPressure > 0.45 ? ["recovery"] : []),
  ]));

  const confidence = clampMetric(
    (
      continuityConfidence
      + recoverySuccessConfidence
      + clampMetric(input.survivabilityForecast?.confidence, 0.35)
      + (disputed ? 0 : 0.2)
    ) / 3.2,
    0.3,
  );

  const operationalState = deriveOperationalState({
    disputed,
    score: survivability.score,
    trend: degradation.trend,
    stabilizationRequired: survivability.stabilizationRequired,
    containmentRecommended: survivability.containmentRecommended,
    lockdownRecommended: survivability.lockdownRecommended,
  });

  return {
    operationalState,
    survivabilityScore: survivability.score,
    degradationRate: degradation.degradationRate,
    recoveryPressure,
    escalationPressure,
    continuityConfidence,
    unstableSubsystems,
    stabilizationRequired: survivability.stabilizationRequired,
    containmentRecommended: survivability.containmentRecommended,
    lockdownRecommended: survivability.lockdownRecommended,
    replayInstabilityScore,
    staleExecutionSpread,
    dependencyInstabilityScore,
    operatorInterventionPressure,
    recoverySuccessConfidence,
    trend: degradation.trend,
    confidence,
    reasons: Array.from(new Set([
      ...degradation.reasons,
      ...survivability.reasons,
      ...(input.survivabilityForecast?.reasons || []),
      ...(disputed ? ["stewardship_disputed"] : []),
    ])),
    disputed,
    timestamp: input.timestamp || new Date(0).toISOString(),
  };
}
