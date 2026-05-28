export type TruthDisputeSeverity = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

export type TruthDispute = {
  code: string;
  severity: TruthDisputeSeverity;
  evidence: string[];
};
