export type ConstitutionalReplayViolation = Readonly<{
  violationId: string;
  replayAttackId: string;
  coordinationId: string;
  domain:
    | "validator"
    | "governance"
    | "dependency"
    | "evidence"
    | "lineage"
    | "topology"
    | "isolation"
    | "replay";
  severity: "elevated" | "high" | "critical";
  createdAt: string;
  deterministicHash: string;
}>;
