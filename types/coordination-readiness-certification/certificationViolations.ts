export type CoordinationReadinessViolation = Readonly<{
  violationId: string;
  certificationId: string;
  coordinationId: string;
  domain:
    | "replay"
    | "governance"
    | "escalation"
    | "approval"
    | "orchestration"
    | "boundary"
    | "authority"
    | "execution";
  severity: "elevated" | "high" | "critical";
  createdAt: string;
  deterministicHash: string;
}>;
