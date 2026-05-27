export type RiskContributorView = Readonly<{
  source: string;
  reason: string;
  evidenceHash?: string;
  severity: "low" | "medium" | "high" | "unknown";
  missingEvidence: boolean;
}>;

export type RiskExplanationView = Readonly<{
  contributors: readonly RiskContributorView[];
  thresholdEvidence?: string;
  missingRiskEvidence: boolean;
  riskDrivenEscalation: boolean;
  unknownRiskState: boolean;
}>;
