export type ApprovalConflictViolation = Readonly<{
  violationId: string;
  conflictId: string;
  coordinationId: string;
  domain:
    | "dependency"
    | "replay"
    | "operator"
    | "escalation"
    | "inheritance"
    | "circularity"
    | "governance"
    | "isolation";
  severity: "elevated" | "high" | "critical";
  createdAt: string;
  deterministicHash: string;
}>;
