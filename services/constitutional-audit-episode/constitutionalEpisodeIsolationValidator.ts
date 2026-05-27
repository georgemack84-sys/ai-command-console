import type {
  ConstitutionalAuditEpisodeInput,
  ConstitutionalAuditError,
} from "@/types/constitutional-audit-episode";

function normalize(value: unknown, output: string[]): void {
  if (typeof value === "string") {
    output.push(value.toLowerCase().replace(/[^a-z0-9]+/g, ""));
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => normalize(item, output));
    return;
  }
  if (value && typeof value === "object") {
    Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
      output.push(key.toLowerCase().replace(/[^a-z0-9]+/g, ""));
      normalize(item, output);
    });
  }
}

export function validateConstitutionalEpisodeIsolation(
  input: ConstitutionalAuditEpisodeInput,
): readonly ConstitutionalAuditError[] {
  const markers: string[] = [];
  normalize(input.metadata, markers);
  const errors: ConstitutionalAuditError[] = [];
  if (markers.some((item) =>
    item.includes("executionimport")
    || item.includes("schedulerimport")
    || item.includes("orchestrationimport")
    || item.includes("runtimebridges")
    || item.includes("livecoordinationsystems"),
  )) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_AUDIT_ISOLATION_VIOLATION",
      message: "Execution, scheduling, orchestration, or runtime bridges violate constitutional isolation.",
      path: "metadata",
    }));
  }
  if (markers.some((item) => item.includes("runtimecontamination") || item.includes("capabilitymutation"))) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_AUDIT_RUNTIME_CONTAMINATION",
      message: "Runtime contamination or capability mutation is forbidden.",
      path: "metadata",
    }));
  }
  if (markers.some((item) => item.includes("privilegeescalation"))) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_AUDIT_PRIVILEGE_ESCALATION",
      message: "Privilege escalation is forbidden.",
      path: "metadata",
    }));
  }
  return Object.freeze(errors);
}
