import type {
  FutureAutonomyFinding,
  FutureAutonomySeverity,
} from "@/types/future-autonomy";

const ORDER: Record<FutureAutonomySeverity, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

export function classifyFutureAutonomyRisk(
  findings: readonly FutureAutonomyFinding[],
): FutureAutonomySeverity {
  return findings.reduce<FutureAutonomySeverity>((current, finding) =>
    ORDER[finding.severity] > ORDER[current] ? finding.severity : current, "low");
}
