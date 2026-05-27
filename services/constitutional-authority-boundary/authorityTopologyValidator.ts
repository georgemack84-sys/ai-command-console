import type { AuthorityBoundaryError, ConstitutionalAuthorityBoundaryInput } from "./authorityBoundaryTypes";
import { normalizeAuthorityMetadata } from "./authorityBoundarySchemas";

export function validateAuthorityTopology(input: ConstitutionalAuthorityBoundaryInput): readonly AuthorityBoundaryError[] {
  const normalized = normalizeAuthorityMetadata(input.metadata);
  if (normalized.includes("topologydrift") || normalized.includes("authoritymerging") || normalized.includes("invisibleauthoritypropagation")) {
    return Object.freeze([Object.freeze({
      code: "CONSTITUTIONAL_AUTHORITY_TOPOLOGY_DRIFT",
      message: "Authority topology drift, merging, or invisible propagation markers were detected.",
      path: "metadata",
    })]);
  }
  return Object.freeze([]);
}
