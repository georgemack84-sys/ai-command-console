import type { RecoverySimulationRequest } from "./recoverySimulationTypes";

export function validateRecoverySimulationConstraints(request: RecoverySimulationRequest | (Partial<RecoverySimulationRequest> & { metadata?: Record<string, unknown> })) {
  if (request.dryRun !== true) {
    return {
      ok: false as const,
      error: {
        code: "SIMULATION_DRY_RUN_REQUIRED",
        message: "Recovery simulation requires dryRun: true.",
      },
    };
  }
  if (request.metadata?.productionMutationAllowed === true) {
    return {
      ok: false as const,
      error: {
        code: "SIMULATION_PRODUCTION_MUTATION_FORBIDDEN",
        message: "Recovery simulation cannot allow production mutation.",
      },
    };
  }
  return {
    ok: true as const,
  };
}
