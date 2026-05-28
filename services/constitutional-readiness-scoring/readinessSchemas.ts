import type {
  ConstitutionalReadinessError,
  ConstitutionalReadinessInput,
} from "./readinessStateTypes";

function isTrueLiteral(value: unknown): boolean {
  return value === true;
}

function isFalseLiteral(value: unknown): boolean {
  return value === false;
}

export function validateReadinessInput(
  input: ConstitutionalReadinessInput,
): readonly ConstitutionalReadinessError[] {
  const errors: ConstitutionalReadinessError[] = [];

  if (!input.constitutionalAuthorityBoundaryResult.derivedOnly) {
    errors.push({
      code: "CONSTITUTIONAL_READINESS_BOUNDARY_VIOLATION",
      message: "Authority boundary input must be derived-only.",
      path: "constitutionalAuthorityBoundaryResult.derivedOnly",
    });
  }
  if (!input.constitutionalReplayResult.derivedOnly) {
    errors.push({
      code: "CONSTITUTIONAL_READINESS_REPLAY_BINDING_INVALID",
      message: "Replay input must be derived-only.",
      path: "constitutionalReplayResult.derivedOnly",
    });
  }
  if (!input.humanSupremacyResult.derivedOnly) {
    errors.push({
      code: "CONSTITUTIONAL_READINESS_SUPREMACY_BROKEN",
      message: "Human supremacy input must be derived-only.",
      path: "humanSupremacyResult.derivedOnly",
    });
  }
  if (!input.runtimeAdmissibilityResult.derivedOnly) {
    errors.push({
      code: "CONSTITUTIONAL_READINESS_RUNTIME_COMPATIBILITY_UNCERTAIN",
      message: "Runtime admissibility input must be derived-only.",
      path: "runtimeAdmissibilityResult.derivedOnly",
    });
  }

  const report = input.constitutionalRuntimeSimulationResult.report;
  if (
    !isTrueLiteral(report.advisoryOnly)
    || !isFalseLiteral(report.executable)
    || !isFalseLiteral(report.runtimeMutationAllowed)
    || !isFalseLiteral(report.authorityMutationAllowed)
    || !isFalseLiteral(report.governanceMutationAllowed)
    || !isFalseLiteral(report.orchestrationAllowed)
  ) {
    errors.push({
      code: "CONSTITUTIONAL_READINESS_AUTHORITY_CROSSOVER",
      message: "Simulation input crossed the advisory-only boundary.",
      path: "constitutionalRuntimeSimulationResult.report",
    });
  }

  if (!input.constitutionalTelemetryResult.record.replaySafe) {
    errors.push({
      code: "CONSTITUTIONAL_READINESS_REPLAY_BINDING_INVALID",
      message: "Telemetry must remain replay-safe.",
      path: "constitutionalTelemetryResult.record.replaySafe",
    });
  }

  return Object.freeze(errors);
}
