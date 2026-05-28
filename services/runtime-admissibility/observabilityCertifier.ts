import type {
  RuntimeAdmissibilityError,
  RuntimeAdmissibilityInput,
  RuntimeVisibilityDomain,
} from "./runtimeAdmissibilityStateTypes";

const REQUIRED_DOMAINS: readonly RuntimeVisibilityDomain[] = Object.freeze([
  "runtime",
  "governance",
  "escalation",
  "approval",
  "override",
  "rollback",
  "replay",
  "containment",
]);

export function certifyRuntimeObservability(
  input: RuntimeAdmissibilityInput,
): readonly RuntimeAdmissibilityError[] {
  const coverage = new Set(input.observabilitySnapshot.coverageDomains);
  const missing = REQUIRED_DOMAINS.filter((domain) => !coverage.has(domain));
  if (missing.length === 0 && input.observabilitySnapshot.lineageRefs.length > 0) {
    return Object.freeze([]);
  }
  return Object.freeze([Object.freeze({
    code: "RUNTIME_ADMISSIBILITY_OBSERVABILITY_GAP",
    message: `Runtime admissibility requires visibility across all constitutional domains. Missing: ${missing.join(", ") || "lineage_refs"}.`,
    path: "observabilitySnapshot.coverageDomains",
  })]);
}
