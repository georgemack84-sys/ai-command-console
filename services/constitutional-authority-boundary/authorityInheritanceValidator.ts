import type { AuthorityBoundaryError, ConstitutionalAuthorityBoundaryInput } from "./authorityBoundaryTypes";
import { normalizeAuthorityMetadata } from "./authorityBoundarySchemas";

export function validateAuthorityInheritance(input: ConstitutionalAuthorityBoundaryInput): readonly AuthorityBoundaryError[] {
  const normalized = normalizeAuthorityMetadata(input.metadata);
  const errors: AuthorityBoundaryError[] = [];
  if (normalized.includes("authorityambiguity") || normalized.includes("inferredauthority") || normalized.includes("approvalinheritance")) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_AUTHORITY_INHERITANCE_AMBIGUOUS",
      message: "Authority inheritance became ambiguous, inferred, or approval-derived outside governance lineage.",
      path: "metadata",
    }));
  }
  return Object.freeze(errors);
}
