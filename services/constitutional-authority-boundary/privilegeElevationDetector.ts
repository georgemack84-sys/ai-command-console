import type { AuthorityBoundaryError, ConstitutionalAuthorityBoundaryInput } from "./authorityBoundaryTypes";
import { normalizeAuthorityMetadata } from "./authorityBoundarySchemas";

export function detectPrivilegeElevation(input: ConstitutionalAuthorityBoundaryInput): readonly AuthorityBoundaryError[] {
  const normalized = normalizeAuthorityMetadata(input.metadata);
  if (normalized.includes("hiddenprivilegeelevation") || normalized.includes("privilegeelevation") || normalized.includes("operatoroverridefailure")) {
    return Object.freeze([Object.freeze({
      code: "CONSTITUTIONAL_AUTHORITY_PRIVILEGE_ELEVATION",
      message: "Privilege elevation or operator supremacy failure markers were detected.",
      path: "metadata",
    })]);
  }
  return Object.freeze([]);
}
