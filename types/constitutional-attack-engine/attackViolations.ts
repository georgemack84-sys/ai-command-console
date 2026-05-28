export type AttackViolation = Readonly<{
  violationId: string;
  attackId: string;
  coordinationId: string;
  domain:
    | "governance"
    | "escalation"
    | "dependency"
    | "confidence"
    | "replay"
    | "authority"
    | "execution"
    | "orchestration"
    | "isolation";
  severity: "elevated" | "high" | "critical";
  createdAt: string;
  deterministicHash: string;
}>;
