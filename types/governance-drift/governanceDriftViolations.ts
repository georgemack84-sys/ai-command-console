export type GovernanceDriftViolation = Readonly<{
  violationId: string;
  driftId: string;
  coordinationId: string;
  domain:
    | "governance"
    | "replay"
    | "confidence"
    | "escalation"
    | "dependency"
    | "recommendation"
    | "isolation"
    | "boundary";
  severity: "elevated" | "high" | "critical";
  createdAt: string;
  deterministicHash: string;
}>;
