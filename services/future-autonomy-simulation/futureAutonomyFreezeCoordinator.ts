import type {
  FutureAutonomySeverity,
  FutureAutonomySimulationStatus,
} from "@/types/future-autonomy";

export function freezeFutureAutonomyState(input: {
  status: FutureAutonomySimulationStatus;
  riskLevel: FutureAutonomySeverity;
}): FutureAutonomySimulationStatus {
  if (input.status === "blocked" || input.status === "frozen") {
    return input.status;
  }
  if (input.riskLevel === "critical") {
    return "frozen";
  }
  return input.status;
}
