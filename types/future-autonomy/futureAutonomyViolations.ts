import type { FutureAutonomySeverity } from "./futureAutonomySeverity";

export type FutureAutonomyViolation = Readonly<{
  violationId: string;
  simulationId: string;
  coordinationId: string;
  domain:
    | "governance"
    | "replay"
    | "escalation"
    | "approval"
    | "confidence"
    | "topology"
    | "boundary"
    | "isolation";
  severity: FutureAutonomySeverity;
  createdAt: string;
  deterministicHash: string;
}>;
