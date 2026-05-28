import type { LifecycleContainmentBoundary, LifecycleError } from "@/types/lifecycle";
import { createLifecycleError } from "@/services/lifecycle/lifecycleBoundaryGuards";

export function validateLifecycleBoundaryContract(boundary: LifecycleContainmentBoundary): readonly LifecycleError[] {
  const invalidField = Object.entries(boundary).find(([, value]) => value !== false)?.[0];
  return Object.freeze(
    invalidField
      ? [createLifecycleError(
        "LIFECYCLE_BOUNDARY_VIOLATION",
        `Lifecycle boundary field ${invalidField} must remain false.`,
        `boundary.${invalidField}`,
      )]
      : [],
  );
}
