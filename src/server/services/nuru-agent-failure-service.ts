export type NuruSpecialistStatus = "success" | "failure" | "timeout" | "permission_denied" | "budget_exceeded" | "partial_result" | "invalid_output" | "tool_failure" | "model_failure" | "conflicting";
export type NuruSpecialistOutcome = { specialist: string; status: NuruSpecialistStatus; detail?: string };

export function buildDegradedCuration(outcomes: NuruSpecialistOutcome[]) {
  const failures = outcomes.filter((outcome) => outcome.status !== "success");
  return { status: failures.length ? "CURATION_INCOMPLETE" as const : "CURATION_COMPLETE" as const, degraded: failures.length > 0, completedSpecialists: outcomes.filter((outcome) => outcome.status === "success").map((outcome) => outcome.specialist), unavailable: failures.map((outcome) => ({ specialist: outcome.specialist, reason: outcome.detail ?? outcome.status.replaceAll("_", " ") })), message: failures.length ? `${failures.map((failure) => failure.specialist).join(", ")} analysis unavailable.` : "All required specialist analyses completed." };
}
