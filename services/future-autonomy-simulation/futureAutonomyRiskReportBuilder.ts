import type {
  FutureAutonomyFinding,
  FutureAutonomyRiskReport,
  FutureAutonomySeverity,
} from "@/types/future-autonomy";
import { hashFutureAutonomyValue } from "./futureAutonomyHashEngine";

export function buildFutureAutonomyRiskReport(input: {
  simulationId: string;
  riskLevel: FutureAutonomySeverity;
  findings: readonly FutureAutonomyFinding[];
}): FutureAutonomyRiskReport {
  return Object.freeze({
    reportId: hashFutureAutonomyValue("future-autonomy-risk-report-id", input.simulationId),
    simulationId: input.simulationId,
    riskLevel: input.riskLevel,
    findingIds: Object.freeze(input.findings.map((item) => item.findingId)),
    deterministicHash: hashFutureAutonomyValue("future-autonomy-risk-report", {
      simulationId: input.simulationId,
      riskLevel: input.riskLevel,
      findings: input.findings.map((item) => item.deterministicHash),
    }),
  });
}
