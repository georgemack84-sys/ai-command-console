import type { AuthorityBoundaryError, ConstitutionalAuthorityBoundaryInput } from "./authorityBoundaryTypes";
import { normalizeAuthorityMetadata } from "./authorityBoundarySchemas";

export function validateAuthorityReplay(input: ConstitutionalAuthorityBoundaryInput): readonly AuthorityBoundaryError[] {
  const gate = input.controlledAutonomyReadinessGateResult;
  const normalized = normalizeAuthorityMetadata(input.metadata);
  const errors: AuthorityBoundaryError[] = [];
  if (!gate.record.replaySafe) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_AUTHORITY_REPLAY_INVALID",
      message: "Authority certification requires replay-safe upstream readiness certification.",
      path: "controlledAutonomyReadinessGateResult.record.replaySafe",
    }));
  }
  if (normalized.includes("replaycorruption") || normalized.includes("stalesnapshot") || normalized.includes("latestauthoritystate")) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_AUTHORITY_REPLAY_INVALID",
      message: "Replay corruption, stale snapshot, or latest-state authority reconstruction markers were detected.",
      path: "metadata",
    }));
  }
  return Object.freeze(errors);
}
