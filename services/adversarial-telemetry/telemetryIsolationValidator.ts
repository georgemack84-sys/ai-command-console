import type { ConstitutionalTelemetryInput, TelemetryError } from "@/types/adversarial-telemetry";

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

export function validateTelemetryIsolation(input: ConstitutionalTelemetryInput): readonly TelemetryError[] {
  const markers: string[] = [];
  normalize(input.metadata, markers);
  const errors: TelemetryError[] = [];
  if (markers.some((item) => item.includes("executionimport") || item.includes("schedulerimport") || item.includes("orchestrationimport") || item.includes("runtimebridges"))) {
    errors.push(Object.freeze({
      code: "ADVERSARIAL_TELEMETRY_ISOLATION_VIOLATION",
      message: "Execution, orchestration, scheduling, or runtime bridge markers violate telemetry isolation.",
      path: "metadata",
    }));
  }
  if (markers.some((item) => item.includes("runtimecontamination") || item.includes("adaptivereplaymutation"))) {
    errors.push(Object.freeze({
      code: "ADVERSARIAL_TELEMETRY_RUNTIME_CONTAMINATION",
      message: "Runtime contamination or adaptive replay mutation is forbidden.",
      path: "metadata",
    }));
  }
  if (markers.some((item) => item.includes("privilegeescalation"))) {
    errors.push(Object.freeze({
      code: "ADVERSARIAL_TELEMETRY_PRIVILEGE_ESCALATION",
      message: "Privilege escalation markers are forbidden.",
      path: "metadata",
    }));
  }
  return Object.freeze(errors);
}
