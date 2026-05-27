import type { AuthorityBoundaryError, ConstitutionalAuthorityBoundaryInput } from "./authorityBoundaryTypes";
import { normalizeAuthorityMetadata } from "./authorityBoundarySchemas";

export function detectRecursiveDelegation(input: ConstitutionalAuthorityBoundaryInput): readonly AuthorityBoundaryError[] {
  const normalized = normalizeAuthorityMetadata(input.metadata);
  if (normalized.includes("recursivedelegation") || normalized.includes("recursivecoordination") || normalized.includes("recursivedelegationattempt")) {
    return Object.freeze([Object.freeze({
      code: "CONSTITUTIONAL_AUTHORITY_RECURSIVE_DELEGATION",
      message: "Recursive delegation or recursive coordination authority markers were detected.",
      path: "metadata",
    })]);
  }
  return Object.freeze([]);
}
