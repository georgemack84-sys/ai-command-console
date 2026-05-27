import type {
  FutureAutonomyError,
  FutureAutonomySeverity,
  FutureAutonomySimulationStatus,
} from "@/types/future-autonomy";

export function resolveFutureAutonomyState(input: {
  errors: readonly FutureAutonomyError[];
  inheritedFailClosed: boolean;
  riskLevel: FutureAutonomySeverity;
}): FutureAutonomySimulationStatus {
  if (input.inheritedFailClosed) {
    return "blocked";
  }
  const codes = input.errors.map((item) => item.code);
  if (codes.some((item) =>
    item === "FUTURE_AUTONOMY_SIMULATION_RUNTIME_BRIDGE"
    || item === "FUTURE_AUTONOMY_PRIVILEGE_ESCALATION"
    || item === "FUTURE_AUTONOMY_ADAPTIVE_AUTONOMY"
    || item === "FUTURE_AUTONOMY_EXECUTION_IMPORT",
  )) {
    return "blocked";
  }
  if (codes.length > 0) {
    return codes.some((item) => item === "FUTURE_AUTONOMY_RECURSIVE_WORKFLOW")
      ? "frozen"
      : "unsafe";
  }
  if (input.riskLevel === "high" || input.riskLevel === "critical") {
    return "disputed";
  }
  return "safe";
}
