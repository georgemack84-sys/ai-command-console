import { getRegisteredSource, type SourceRegistry } from "./sourceRegistry";
import type { SourceValidationResult } from "./sourceTypes";

export function validateSource(registry: SourceRegistry, sourceId: string): SourceValidationResult {
  const source = getRegisteredSource(registry, sourceId);

  if (!source) {
    return {
      status: "REJECTED",
      code: "SOURCE_UNKNOWN",
      reason: "Unknown sources are invalid.",
    };
  }

  if (!source.owner_id || !source.tenant_id) {
    return {
      status: "REJECTED",
      code: "SOURCE_MISSING_OWNERSHIP",
      source,
      reason: "Source ownership is mandatory.",
    };
  }

  if (source.source_name.trim().toLowerCase() === "anonymous") {
    return {
      status: "REJECTED",
      code: "SOURCE_ANONYMOUS",
      source,
      reason: "Anonymous sources are prohibited.",
    };
  }

  if (source.status === "disabled") {
    return {
      status: "REJECTED",
      code: "SOURCE_DISABLED",
      source,
      reason: "Disabled sources are blocked.",
    };
  }

  return {
    status: source.status === "limited" ? "LIMITED" : "VALID",
    code: "SOURCE_VALID",
    source,
    reason: "Source is registered and usable.",
  };
}
