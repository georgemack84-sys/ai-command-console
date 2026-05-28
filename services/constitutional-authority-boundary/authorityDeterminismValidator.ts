import type { AuthorityBoundaryError, ConstitutionalAuthorityBoundaryInput } from "./authorityBoundaryTypes";
import { hashAuthorityValue } from "./authorityHashingEngine";

export function validateAuthorityDeterminism(input: ConstitutionalAuthorityBoundaryInput): readonly AuthorityBoundaryError[] {
  const first = hashAuthorityValue("constitutional-authority-determinism-check", {
    boundaryId: input.boundaryId,
    gateHash: input.controlledAutonomyReadinessGateResult.deterministicHash,
    authorityClass: input.requestedAuthorityClass,
  });
  const second = hashAuthorityValue("constitutional-authority-determinism-check", {
    boundaryId: input.boundaryId,
    gateHash: input.controlledAutonomyReadinessGateResult.deterministicHash,
    authorityClass: input.requestedAuthorityClass,
  });
  if (first !== second) {
    return Object.freeze([Object.freeze({
      code: "CONSTITUTIONAL_AUTHORITY_VALIDATOR_MISMATCH",
      message: "Deterministic authority reconstruction produced inconsistent hashes.",
      path: "determinism",
    })]);
  }
  return Object.freeze([]);
}
