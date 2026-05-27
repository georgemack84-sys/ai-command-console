export type RecommendationViolation = Readonly<{
  violationId: string;
  recommendationId: string;
  coordinationId: string;
  domain:
    | "governance"
    | "replay"
    | "confidence"
    | "evidence"
    | "approval"
    | "escalation"
    | "authority"
    | "orchestration"
    | "isolation";
  severity: "elevated" | "high" | "critical";
  createdAt: string;
  deterministicHash: string;
}>;
