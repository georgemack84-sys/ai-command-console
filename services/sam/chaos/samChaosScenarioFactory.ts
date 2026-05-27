import { SAM_CHAOS_ERROR_CODES } from "./samChaosErrors";
import type { SamChaosHookMode, SamChaosScenarioRequest } from "./samChaosTypes";

export function validateSamChaosScenario(request: Partial<SamChaosScenarioRequest>) {
  if (!request?.type) {
    return { ok: false as const, error: SAM_CHAOS_ERROR_CODES.SAM_CHAOS_INVALID_SCENARIO };
  }
  if (request.dryRun !== true) {
    return { ok: false as const, error: SAM_CHAOS_ERROR_CODES.SAM_CHAOS_INVALID_SCENARIO };
  }
  if (!String(request.executionId || "").trim()) {
    return { ok: false as const, error: SAM_CHAOS_ERROR_CODES.SAM_CHAOS_INVALID_SCENARIO };
  }
  if (!String(request.attemptId || "").trim()) {
    return { ok: false as const, error: SAM_CHAOS_ERROR_CODES.SAM_CHAOS_INVALID_SCENARIO };
  }
  if (!String(request.deterministicSeed || "").trim()) {
    return { ok: false as const, error: SAM_CHAOS_ERROR_CODES.SAM_CHAOS_INVALID_SCENARIO };
  }
  return { ok: true as const };
}

export function createSamChaosHookMode(request: SamChaosScenarioRequest): SamChaosHookMode {
  switch (request.type) {
    case "DB_FAILURE":
    case "IDEMPOTENCY_STORE_FAILURE":
      return { deterministicSeed: request.deterministicSeed, failStoreWrite: true };
    case "TIMEOUT_MID_EXECUTION":
      return { deterministicSeed: request.deterministicSeed, failDryRunTimeout: true };
    case "AUDIT_APPEND_FAILURE":
      return { deterministicSeed: request.deterministicSeed, failAuditAppend: true };
    case "CORRUPTED_STATE_READ":
      return { deterministicSeed: request.deterministicSeed, corruptReadMode: "proposal_hash_mismatch" };
    case "PARTIAL_WRITE":
      return { deterministicSeed: request.deterministicSeed, corruptReadMode: "pending" };
    case "LOCK_LOSS":
      return { deterministicSeed: request.deterministicSeed, corruptReadMode: "ambiguous" };
    case "DUPLICATE_REPLAY":
      return { deterministicSeed: request.deterministicSeed };
    default:
      return { deterministicSeed: request.deterministicSeed };
  }
}
