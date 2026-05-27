import type { ConstitutionalReadinessError } from "@/types/constitutional-autonomy-readiness-gate";
import type { MonitoringTriggerModel } from "@/services/monitoring-trigger-model";
import { createReadinessError } from "./readinessErrors";

export function validateRuntimeBoundary(monitoringModel: MonitoringTriggerModel): Readonly<{
  runtimeBoundarySafe: boolean;
  reasons: readonly string[];
  errors: readonly ConstitutionalReadinessError[];
}> {
  const unsafeRuntimeTrigger = monitoringModel.triggers.find((trigger) =>
    trigger.triggerType === "runtime" && (trigger.severity === "high" || trigger.severity === "critical"));
  const runtimeBoundarySafe = !unsafeRuntimeTrigger && monitoringModel.cautionState !== "frozen-recommended";

  return Object.freeze({
    runtimeBoundarySafe,
    reasons: Object.freeze(
      runtimeBoundarySafe ? ["Runtime evidence remains observational and non-controlling."] : ["Runtime evidence indicates unsafe operational boundary conditions."],
    ),
    errors: Object.freeze(
      runtimeBoundarySafe ? [] : [createReadinessError("AUTONOMY_RUNTIME_UNSAFE", "Runtime boundary is unsafe for readiness certification.", "monitoringModel.triggers")],
    ),
  });
}
