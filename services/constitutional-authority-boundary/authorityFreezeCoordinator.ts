import type { AuthorityBoundaryError, AuthorityBoundaryRecord } from "./authorityBoundaryTypes";

export function resolveAuthorityCertificationState(input: {
  errors: readonly AuthorityBoundaryError[];
  revoked: boolean;
}): AuthorityBoundaryRecord["certificationState"] {
  if (input.errors.some((item) =>
    item.code.includes("PRIVILEGE")
    || item.code.includes("SYNTHETIC")
    || item.code.includes("RECURSIVE")
    || item.code.includes("OPERATOR_SUPREMACY"))) {
    return "INVALID";
  }
  if (input.revoked) {
    return "REVOKED";
  }
  if (input.errors.some((item) =>
    item.code.includes("GOVERNANCE")
    || item.code.includes("REPLAY")
    || item.code.includes("CEILING")
    || item.code.includes("CONTAINMENT"))) {
    return "FROZEN";
  }
  if (input.errors.some((item) =>
    item.code.includes("INHERITANCE")
    || item.code.includes("TOPOLOGY")
    || item.code.includes("DRIFT")
    || item.code.includes("LINEAGE"))) {
    return "DISPUTED";
  }
  return "CERTIFIED";
}
