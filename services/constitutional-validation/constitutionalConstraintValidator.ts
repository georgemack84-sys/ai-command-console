import type { ConstitutionalCoordinationError } from "@/types/constitutional-coordination";
import type { CoordinationContainmentRecord } from "@/types/coordination-containment";
import { createConstitutionalCoordinationError } from "@/services/constitutional-coordination/coordinationBoundaryEnforcer";

export function validateConstitutionalConstraints(containmentRecord: CoordinationContainmentRecord): readonly ConstitutionalCoordinationError[] {
  const errors: ConstitutionalCoordinationError[] = [];
  for (const violation of containmentRecord.validation.violations) {
    if (violation.category === "hidden_orchestration" || violation.category === "workflow_synthesis" || violation.category === "silent_retry") {
      errors.push(createConstitutionalCoordinationError(
        "CONSTITUTIONAL_COORDINATION_HIDDEN_ORCHESTRATION",
        "Containment detected orchestration-adjacent behavior and constitutional coordination must fail closed.",
        "containmentRecord.validation.violations",
      ));
    }
    if (violation.category === "authority_expansion") {
      errors.push(createConstitutionalCoordinationError(
        "CONSTITUTIONAL_COORDINATION_AUTHORITY_EXPANSION",
        "Containment detected authority expansion and constitutional coordination must fail closed.",
        "containmentRecord.validation.violations",
      ));
    }
    if (violation.category === "recursive_coordination") {
      errors.push(createConstitutionalCoordinationError(
        "CONSTITUTIONAL_COORDINATION_RECURSIVE_GROWTH",
        "Recursive coordination is constitutionally invalid.",
        "containmentRecord.validation.violations",
      ));
    }
    if (violation.category === "runtime_mutation") {
      errors.push(createConstitutionalCoordinationError(
        "CONSTITUTIONAL_COORDINATION_RUNTIME_MUTATION",
        "Runtime mutation markers are constitutionally invalid.",
        "containmentRecord.validation.violations",
      ));
    }
  }
  return Object.freeze(errors);
}
