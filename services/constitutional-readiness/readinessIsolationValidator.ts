import type { ConstitutionalReadinessInput, ReadinessError } from "@/types/constitutional-readiness";
import { normalizeReadinessMetadata } from "./readinessContracts";

export function validateReadinessIsolation(input: ConstitutionalReadinessInput): readonly ReadinessError[] {
  const normalized = normalizeReadinessMetadata(input.metadata);
  const errors: ReadinessError[] = [];

  if (
    normalized.includes("executionimport")
    || normalized.includes("orchestrationimport")
    || normalized.includes("schedulerimport")
    || normalized.includes("runtimebridge")
    || normalized.includes("runtimemutation")
  ) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_READINESS_ISOLATION_VIOLATION",
      message: "Execution, orchestration, scheduling, or runtime bridge markers were detected.",
      path: "metadata",
    }));
  }

  if (normalized.includes("privilegeescalation")) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_READINESS_PRIVILEGE_ESCALATION",
      message: "Privilege escalation markers were detected.",
      path: "metadata",
    }));
  }

  return Object.freeze(errors);
}
