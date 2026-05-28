import type { GovernanceDriftError, GovernanceDriftInput } from "@/types/governance-drift";

function normalizeMarkers(value: unknown, buffer: string[]): void {
  if (typeof value === "string") {
    buffer.push(value.toLowerCase().replace(/[^a-z0-9]+/g, ""));
    return;
  }
  if (typeof value === "boolean" || typeof value === "number") {
    buffer.push(String(value).toLowerCase());
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) normalizeMarkers(item, buffer);
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      buffer.push(key.toLowerCase().replace(/[^a-z0-9]+/g, ""));
      normalizeMarkers(item, buffer);
    }
  }
}

export function validateDriftIsolation(input: GovernanceDriftInput): readonly GovernanceDriftError[] {
  const markers: string[] = [];
  normalizeMarkers(input.metadata, markers);
  const errors: GovernanceDriftError[] = [];
  if (markers.some((item) => item.includes("executionimport") || item.includes("schedulerimport") || item.includes("orchestrationimport"))) {
    errors.push(Object.freeze({
      code: "GOVERNANCE_DRIFT_ISOLATION_VIOLATION",
      message: "Execution, scheduler, or orchestration imports violate governance drift isolation.",
      path: "metadata",
    }));
  }
  if (markers.some((item) =>
    item.includes("runtimedispatch")
    || item.includes("hiddenworkflows")
    || item.includes("recursivecoordination")
    || item.includes("adaptivgovernance")
    || item.includes("adaptivegovernance")
    || item.includes("selfhealingsystems")
    || item.includes("autonomousremediation")
    || item.includes("hiddenretries")
    || item.includes("workflowcontinuation")
  )) {
    errors.push(Object.freeze({
      code: "GOVERNANCE_DRIFT_ISOLATION_VIOLATION",
      message: "Hidden workflows, adaptive governance, or continuation markers violate drift isolation.",
      path: "metadata",
    }));
  }
  if (markers.some((item) => item.includes("runtimemutation"))) {
    errors.push(Object.freeze({
      code: "GOVERNANCE_DRIFT_RUNTIME_MUTATION",
      message: "Runtime mutation is forbidden in governance drift detection.",
      path: "metadata",
    }));
  }
  return Object.freeze(errors);
}
