import type {
  ConstitutionalAuditError,
  ConstitutionalAuditSeverity,
} from "@/types/constitutional-audit-episode";

export function resolveConstitutionalEpisodeState(input: {
  errors: readonly ConstitutionalAuditError[];
  disputesDetected: boolean;
  inheritedFailClosed: boolean;
  severity: ConstitutionalAuditSeverity;
}): "verified" | "frozen" | "blocked" | "disputed" {
  if (input.inheritedFailClosed) {
    return "blocked";
  }
  if (input.errors.some((item) =>
    item.code === "CONSTITUTIONAL_AUDIT_ISOLATION_VIOLATION"
    || item.code === "CONSTITUTIONAL_AUDIT_RUNTIME_CONTAMINATION"
    || item.code === "CONSTITUTIONAL_AUDIT_PRIVILEGE_ESCALATION"
    || item.code === "CONSTITUTIONAL_AUDIT_SYNTHETIC_AUTHORITY",
  )) {
    return "blocked";
  }
  if (input.disputesDetected) {
    return "disputed";
  }
  if (input.errors.length > 0 || input.severity === "critical") {
    return "frozen";
  }
  return "verified";
}
