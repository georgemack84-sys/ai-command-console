import type { ConstitutionalTelemetryInput, TelemetryError } from "@/types/adversarial-telemetry";

export function validateTelemetryBoundary(input: ConstitutionalTelemetryInput): readonly TelemetryError[] {
  const normalized = JSON.stringify(input.metadata ?? {}).toLowerCase().replace(/[^a-z0-9]+/g, "");
  const errors: TelemetryError[] = [];
  if (normalized.includes("hiddenorchestration") || normalized.includes("recursivecoordination")) {
    errors.push(Object.freeze({
      code: "ADVERSARIAL_TELEMETRY_HIDDEN_ORCHESTRATION",
      message: "Hidden orchestration or recursive coordination markers violate telemetry boundaries.",
      path: "metadata",
    }));
  }
  if (normalized.includes("syntheticauthorityinjection")) {
    errors.push(Object.freeze({
      code: "ADVERSARIAL_TELEMETRY_SYNTHETIC_AUTHORITY",
      message: "Synthetic authority markers are forbidden.",
      path: "metadata",
    }));
  }
  return Object.freeze(errors);
}
