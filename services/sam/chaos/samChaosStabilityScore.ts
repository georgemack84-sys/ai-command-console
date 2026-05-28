import type { SamChaosScenarioResult, SamChaosStabilityScore } from "./samChaosTypes";
import { measureSamSyncDuration } from "../performance/samLatencyTracker";

function boolScore(value: boolean, pass = 100, fail = 0) {
  return value ? pass : fail;
}

export function calculateSamChaosStabilityScore(input: {
  recoveryCorrect: boolean;
  unauthorizedMutationDetected: boolean;
  duplicateDryRunDetected: boolean;
  duplicateAuditDetected: boolean;
  governanceBypassDetected: boolean;
  findings: string[];
}) {
  const breakdown: SamChaosStabilityScore = {
    recoveryCorrectness: boolScore(input.recoveryCorrect),
    idempotencyIntegrity: boolScore(!input.duplicateDryRunDetected && !input.governanceBypassDetected),
    auditIntegrity: boolScore(!input.duplicateAuditDetected),
    governanceIntegrity: boolScore(!input.governanceBypassDetected),
    dryRunContainment: boolScore(!input.unauthorizedMutationDetected),
    duplicateSuppression: boolScore(!input.duplicateDryRunDetected && !input.duplicateAuditDetected),
    failureExplainability: boolScore(input.findings.length > 0),
    totalScore: 0,
  };

  breakdown.totalScore = Math.round(
    (
      breakdown.recoveryCorrectness
      + breakdown.idempotencyIntegrity
      + breakdown.auditIntegrity
      + breakdown.governanceIntegrity
      + breakdown.dryRunContainment
      + breakdown.duplicateSuppression
      + breakdown.failureExplainability
    ) / 7,
  );

  return breakdown;
}

export function attachSamChaosScore(
  result: Omit<SamChaosScenarioResult, "stabilityScore" | "scoreBreakdown">,
): SamChaosScenarioResult {
  const scoreBreakdown = measureSamSyncDuration("sam.stability.score.duration", () => calculateSamChaosStabilityScore({
    recoveryCorrect: result.recoveryCorrect,
    unauthorizedMutationDetected: result.unauthorizedMutationDetected,
    duplicateDryRunDetected: result.duplicateDryRunDetected,
    duplicateAuditDetected: result.duplicateAuditDetected,
    governanceBypassDetected: result.governanceBypassDetected,
    findings: result.findings,
  }));

  return {
    ...result,
    stabilityScore: scoreBreakdown.totalScore,
    scoreBreakdown,
  };
}
