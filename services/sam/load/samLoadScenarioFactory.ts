import { SAM_LOAD_ERROR_CODES } from "./samLoadErrors";
import type { SamLoadScenarioRequest } from "./samLoadTypes";

export function validateSamLoadScenario(request: SamLoadScenarioRequest) {
  if (!request || request.dryRun !== true) {
    return {
      ok: false as const,
      error: SAM_LOAD_ERROR_CODES.SAM_LOAD_INVALID_SCENARIO,
    };
  }
  if (!String(request.executionId || "").trim() || !String(request.attemptId || "").trim() || !String(request.deterministicSeed || "").trim()) {
    return {
      ok: false as const,
      error: SAM_LOAD_ERROR_CODES.SAM_LOAD_INVALID_SCENARIO,
    };
  }
  return {
    ok: true as const,
    data: {
      ...request,
      iterations: request.iterations && request.iterations > 0 ? request.iterations : 1,
    },
  };
}
