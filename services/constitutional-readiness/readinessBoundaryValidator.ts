import type { ConstitutionalReadinessInput, ReadinessError } from "@/types/constitutional-readiness";
import { normalizeReadinessMetadata } from "./readinessContracts";

export function validateReadinessBoundary(input: ConstitutionalReadinessInput): readonly ReadinessError[] {
  const normalized = normalizeReadinessMetadata(input.metadata);
  const errors: ReadinessError[] = [];

  if (
    normalized.includes("hiddenorchestration")
    || normalized.includes("hiddenexecution")
    || normalized.includes("syntheticauthority")
  ) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_READINESS_BOUNDARY_VIOLATION",
      message: "Hidden orchestration, execution, or synthetic authority markers were detected.",
      path: "metadata",
    }));
  }

  if (normalized.includes("recursivecoordination")) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_READINESS_RECURSIVE_COORDINATION",
      message: "Recursive coordination markers were detected.",
      path: "metadata",
    }));
  }

  return Object.freeze(errors);
}
