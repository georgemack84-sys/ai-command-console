import type { CompatibilityChange, ContractCompatibilityResult } from "./contractTypes";
import { parseContractVersion } from "./contractVersion";

const SAFE_CHANGE_TYPES = new Set<CompatibilityChange["type"]>([
  "add_optional_field",
  "add_enum_value",
]);

export function evaluateCompatibilityRules({
  fromVersion,
  toVersion,
  changes,
}: {
  fromVersion: string;
  toVersion: string;
  changes: CompatibilityChange[];
}): ContractCompatibilityResult {
  const from = parseContractVersion(fromVersion);
  const to = parseContractVersion(toVersion);
  const breaking = changes.some((change) => !SAFE_CHANGE_TYPES.has(change.type));
  const majorChanged = to.major !== from.major;

  if (breaking && !majorChanged) {
    return {
      compatible: false,
      code: "API_COMPATIBILITY_FAILURE",
      reason: "Breaking changes require a major version bump.",
      requiresMajorVersionBump: true,
    };
  }

  return {
    compatible: true,
    requiresMajorVersionBump: breaking,
  };
}
