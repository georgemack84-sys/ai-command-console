export type RiskAnalysis = Readonly<{
  riskId: string;
  severity: "low" | "moderate" | "high" | "critical";
  cautionState: "observe" | "restricted" | "escalated" | "frozen-recommended";
  rationale: string;
  triggerIds: readonly string[];
  evidenceHashes: readonly string[];
  createdAt: string;
}>;
