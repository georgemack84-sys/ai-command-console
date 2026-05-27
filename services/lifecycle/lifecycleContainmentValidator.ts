import type { LifecycleError, LifecycleTransitionRequest } from "@/types/lifecycle";
import { createLifecycleError } from "./lifecycleBoundaryGuards";

export function validateLifecycleContainment(request: LifecycleTransitionRequest): readonly LifecycleError[] {
  const errors: LifecycleError[] = [];
  const correlationRelationships = request.correlationComputation.result.relationships;

  if (request.metadata?.["correlationDrivenTransition"] === true) {
    errors.push(createLifecycleError(
      "LIFECYCLE_CORRELATION_DRIVEN_TRANSITION_REJECTED",
      "Lifecycle progression may not be driven by correlation visibility.",
      "metadata.correlationDrivenTransition",
    ));
  }

  if (request.metadata?.["autoRepair"] === true) {
    errors.push(createLifecycleError(
      "LIFECYCLE_AUTONOMOUS_REPAIR_REJECTED",
      "Automatic lifecycle repair is constitutionally forbidden.",
      "metadata.autoRepair",
    ));
  }

  if (request.metadata?.["approvalInheritance"] === true) {
    errors.push(createLifecycleError(
      "LIFECYCLE_APPROVAL_INHERITANCE_REJECTED",
      "Lifecycle progression may not inherit approval state.",
      "metadata.approvalInheritance",
    ));
  }

  if (request.currentState === "expired" && request.nextState === "revalidate") {
    errors.push(createLifecycleError(
      "LIFECYCLE_AUTONOMOUS_REPAIR_REJECTED",
      "Expired proposals may not automatically re-enter revalidation.",
      "nextState",
    ));
  }

  if (request.nextState === "bounded_coordination" && correlationRelationships.length > 1 && request.metadata?.["impliedGrouping"] === true) {
    errors.push(createLifecycleError(
      "LIFECYCLE_CORRELATION_DRIVEN_TRANSITION_REJECTED",
      "Correlated proposals may not imply lifecycle grouping or coordination eligibility.",
      "metadata.impliedGrouping",
    ));
  }

  return Object.freeze(errors);
}
