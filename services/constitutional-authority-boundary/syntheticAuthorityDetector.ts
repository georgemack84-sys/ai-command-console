import type { AuthorityBoundaryError, ConstitutionalAuthorityBoundaryInput } from "./authorityBoundaryTypes";
import { normalizeAuthorityMetadata } from "./authorityBoundarySchemas";

export function detectSyntheticAuthority(input: ConstitutionalAuthorityBoundaryInput): readonly AuthorityBoundaryError[] {
  const normalized = normalizeAuthorityMetadata(input.metadata);
  if (normalized.includes("syntheticauthority") || normalized.includes("authoritysynthesis")) {
    return Object.freeze([Object.freeze({
      code: "CONSTITUTIONAL_AUTHORITY_SYNTHETIC_EMERGENCE",
      message: "Synthetic authority emergence markers were detected.",
      path: "metadata",
    })]);
  }
  return Object.freeze([]);
}
