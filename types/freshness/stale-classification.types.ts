export type StaleClassification = Readonly<{
  proposalId: string;
  classification:
    | "aging"
    | "revalidation_required"
    | "stale"
    | "restricted"
    | "expired"
    | "frozen";
  severity:
    | "low"
    | "moderate"
    | "high"
    | "critical";
  governanceRestriction:
    | "none"
    | "review_required"
    | "restricted"
    | "blocked";
  reasonCodes: readonly string[];
  classificationHash: string;
  createdAt: string;
}>;
