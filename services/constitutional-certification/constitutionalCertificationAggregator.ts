import type {
  CertificationAggregationRecord,
  CertificationScorecard,
  ConstitutionalCertificationInput,
} from "./certificationStateTypes";
import { hashCertificationValue } from "./certificationTraceHasher";

export function aggregateCertificationReadiness(input: {
  certificationInput: ConstitutionalCertificationInput;
  scorecard: CertificationScorecard;
}): CertificationAggregationRecord {
  const readinessScore = input.certificationInput.constitutionalReadinessResult.report.readinessScore;
  const confidenceScore = input.certificationInput.constitutionalReadinessResult.report.confidenceScore;
  const uncertaintyPenalty = input.certificationInput.constitutionalReadinessResult.report.uncertaintyPenalty;
  const scorecardAverage = (
    input.scorecard.governanceIntegrity
    + input.scorecard.replayDeterminism
    + input.scorecard.containmentStrength
    + input.scorecard.humanSupremacy
    + input.scorecard.escalationDeterminism
    + input.scorecard.overrideReliability
    + input.scorecard.driftResistance
    + input.scorecard.runtimeCompatibility
    + input.scorecard.antiEmergenceIntegrity
  ) / 9;
  const aggregateScore = Number(Math.max(
    0,
    ((readinessScore + confidenceScore + scorecardAverage) / 3) - uncertaintyPenalty,
  ).toFixed(4));

  return Object.freeze({
    readinessScore,
    confidenceScore,
    uncertaintyPenalty,
    aggregateScore,
    aggregateHash: hashCertificationValue("constitutional-certification-aggregation", {
      readinessScore,
      confidenceScore,
      uncertaintyPenalty,
      aggregateScore,
      scoreHash: input.scorecard.scoreHash,
    }),
  });
}
