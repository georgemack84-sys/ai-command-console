export function freezeTelemetryState(
  state: "stable" | "elevated" | "frozen" | "blocked" | "disputed",
): "stable" | "elevated" | "frozen" | "blocked" | "disputed" {
  return state;
}
