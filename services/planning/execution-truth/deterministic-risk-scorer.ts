import type {
  DeterministicRiskProfile,
  ExecutionRiskSignals,
  RiskCategory,
  RiskLevel,
  RiskScore,
} from "./execution-truth-types";

export const RISK_WEIGHTS = Object.freeze({
  destructive: 30,
  externalSideEffect: 25,
  production: 30,
  unknownEnvironment: 20,
  missingIdempotency: 25,
  rollbackNone: 30,
  rollbackUnknown: 20,
  autonomyCritical: 30,
  autonomyUnknown: 15,
  terminalBranch: 20,
  failureBranch: 10,
  rollbackBranch: 10,
}) satisfies Record<string, number>;

export function mapScoreToRiskLevel(score: number, forbidden = false): RiskLevel {
  if (forbidden) {
    return "R6_FORBIDDEN";
  }
  if (score <= 0) return "R0_SAFE";
  if (score <= 20) return "R1_LOW";
  if (score <= 40) return "R2_MODERATE";
  if (score <= 60) return "R3_ELEVATED";
  if (score <= 80) return "R4_HIGH";
  return "R5_CRITICAL";
}

function buildScore(category: RiskCategory, score: number, reasons: string[], forbidden = false): RiskScore {
  return {
    category,
    score,
    level: mapScoreToRiskLevel(score, forbidden),
    reasons,
  };
}

export function scoreRiskDeterministically(stepSignals: ExecutionRiskSignals[]): DeterministicRiskProfile {
  const scores: RiskScore[] = [];
  const reasons: string[] = [];
  let failClosed = false;

  for (const signal of stepSignals) {
    let executionScore = 0;
    const executionReasons: string[] = [];
    let rollbackScore = 0;
    const rollbackReasons: string[] = [];
    let autonomyScore = 0;
    const autonomyReasons: string[] = [];
    let externalScore = 0;
    const externalReasons: string[] = [];
    let governanceScore = 0;
    const governanceReasons: string[] = [];
    let forbidden = false;

    if (signal.destructive) {
      executionScore += RISK_WEIGHTS.destructive;
      executionReasons.push(`${signal.stepId}: destructive operation`);
    }
    if (signal.externalSideEffect) {
      externalScore += RISK_WEIGHTS.externalSideEffect;
      externalReasons.push(`${signal.stepId}: external side effect`);
    }
    if (signal.targetEnvironment === "production") {
      executionScore += RISK_WEIGHTS.production;
      executionReasons.push(`${signal.stepId}: production target`);
    } else if (signal.targetEnvironment === "unknown") {
      executionScore += RISK_WEIGHTS.unknownEnvironment;
      executionReasons.push(`${signal.stepId}: unknown target environment`);
      failClosed = true;
    }
    if ((signal.destructive || signal.externalSideEffect) && !signal.idempotent) {
      externalScore += RISK_WEIGHTS.missingIdempotency;
      externalReasons.push(`${signal.stepId}: missing idempotency metadata`);
    }
    if (signal.rollbackCapability === "none") {
      rollbackScore += RISK_WEIGHTS.rollbackNone;
      rollbackReasons.push(`${signal.stepId}: no rollback capability`);
    } else if (signal.rollbackCapability === "unknown") {
      rollbackScore += RISK_WEIGHTS.rollbackUnknown;
      rollbackReasons.push(`${signal.stepId}: unknown rollback capability`);
      failClosed = true;
    }
    if (signal.autonomySensitivity === "critical") {
      autonomyScore += RISK_WEIGHTS.autonomyCritical;
      autonomyReasons.push(`${signal.stepId}: critical autonomy sensitivity`);
    } else if (signal.autonomySensitivity === "unknown") {
      autonomyScore += RISK_WEIGHTS.autonomyUnknown;
      autonomyReasons.push(`${signal.stepId}: unknown autonomy sensitivity`);
      failClosed = true;
    }
    if (signal.terminalBranch) {
      rollbackScore += RISK_WEIGHTS.terminalBranch;
      rollbackReasons.push(`${signal.stepId}: terminal branch increases irreversibility risk`);
    }
    if (signal.failureBranch) {
      rollbackScore += RISK_WEIGHTS.failureBranch;
      rollbackReasons.push(`${signal.stepId}: failure branch containment risk`);
    }
    if (signal.rollbackBranch) {
      rollbackScore += RISK_WEIGHTS.rollbackBranch;
      rollbackReasons.push(`${signal.stepId}: rollback branch exposure`);
    }
    if (signal.destructive && signal.targetEnvironment === "production" && !signal.idempotent) {
      forbidden = true;
      governanceScore = 100;
      governanceReasons.push(`${signal.stepId}: destructive production operation without idempotency is forbidden`);
      failClosed = true;
    }

    scores.push(buildScore("execution_risk", executionScore, executionReasons));
    scores.push(buildScore("rollback_risk", rollbackScore, rollbackReasons));
    scores.push(buildScore("autonomy_risk", autonomyScore, autonomyReasons));
    scores.push(buildScore("external_system_risk", externalScore, externalReasons));
    if (governanceReasons.length > 0) {
      scores.push(buildScore("governance_risk", governanceScore, governanceReasons, forbidden));
    }

    reasons.push(...executionReasons, ...rollbackReasons, ...autonomyReasons, ...externalReasons, ...governanceReasons);
  }

  const overallRisk = scores.reduce<RiskLevel>((current, score) => {
    const ordered: RiskLevel[] = ["R0_SAFE", "R1_LOW", "R2_MODERATE", "R3_ELEVATED", "R4_HIGH", "R5_CRITICAL", "R6_FORBIDDEN"];
    return ordered.indexOf(score.level) > ordered.indexOf(current) ? score.level : current;
  }, "R0_SAFE");

  return {
    overallRisk,
    scores,
    stepSignals,
    failClosed,
    reasons,
  };
}
