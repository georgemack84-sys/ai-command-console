import type {
  ConstitutionalReadinessError,
  ConstitutionalReadinessInput,
} from "./readinessStateTypes";

function hasIsolationMarker(metadata: Readonly<Record<string, unknown>> | undefined, key: string): boolean {
  return metadata?.[key] === true;
}

export function enforceReadinessIsolationBoundary(
  input: ConstitutionalReadinessInput,
): readonly ConstitutionalReadinessError[] {
  const errors: ConstitutionalReadinessError[] = [];

  if (
    hasIsolationMarker(input.metadata, "execution")
    || hasIsolationMarker(input.metadata, "orchestration")
    || hasIsolationMarker(input.metadata, "scheduling")
    || hasIsolationMarker(input.metadata, "runtimeActivation")
  ) {
    errors.push({
      code: "CONSTITUTIONAL_READINESS_ISOLATION_VIOLATION",
      message: "Readiness scoring crossed into execution or orchestration semantics.",
      path: "metadata",
    });
  }

  if (
    input.constitutionalRuntimeSimulationResult.report.executable
    || input.constitutionalRuntimeSimulationResult.report.orchestrationAllowed
    || input.constitutionalRuntimeSimulationResult.report.schedulingAllowed
  ) {
    errors.push({
      code: "CONSTITUTIONAL_READINESS_ISOLATION_VIOLATION",
      message: "Simulation layer exposed operational semantics to readiness scoring.",
      path: "constitutionalRuntimeSimulationResult.report",
    });
  }

  return Object.freeze(errors);
}
