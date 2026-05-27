import type { HumanSupremacyEnforcementInput, HumanSupremacyError } from "./supremacyStateTypes";
import { normalizeSupremacyMetadata } from "./supremacySchemas";

export function validateSupremacyIsolation(input: HumanSupremacyEnforcementInput): readonly HumanSupremacyError[] {
  const normalized = normalizeSupremacyMetadata(input.metadata);
  if (
    normalized.includes("execution")
    || normalized.includes("orchestration")
    || normalized.includes("runtime mutation".replace(/[^a-z0-9]+/g, ""))
    || normalized.includes("hiddenscheduling")
    || normalized.includes("hiddenretry")
  ) {
    return Object.freeze([Object.freeze({
      code: "HUMAN_SUPREMACY_ISOLATION_VIOLATION",
      message: "Execution, orchestration, scheduling, retry, or runtime mutation markers were detected.",
      path: "metadata",
    })]);
  }
  return Object.freeze([]);
}
