import type { ReadinessContainment } from "@/types/constitutional-autonomy-readiness-gate";
import type { BoundedCoordinationFrameworkRecord } from "@/types/bounded-coordination-framework";
import { hashReadinessValue } from "./readinessHasher";

export function inspectReadinessContainment(input: {
  coordinationFramework: BoundedCoordinationFrameworkRecord;
  hiddenExecutionDetected: boolean;
  runtimeBoundarySafe: boolean;
  createdAt: string;
}): ReadinessContainment {
  const reasons = Object.freeze([
    ...(input.coordinationFramework.containment.bounded ? ["Coordination remains bounded."] : ["Coordination containment is not bounded."]),
    ...(input.coordinationFramework.containment.isolated ? ["Orchestration isolation is preserved."] : ["Orchestration isolation is broken."]),
    ...(input.coordinationFramework.containment.overrideReachable ? ["Human override remains reachable."] : ["Human override reachability is missing."]),
    ...(input.hiddenExecutionDetected ? ["Hidden execution semantics were detected."] : ["No hidden execution semantics detected."]),
    ...(input.runtimeBoundarySafe ? ["Runtime boundaries remain observational only."] : ["Runtime boundaries are unsafe for readiness."]),
  ]);

  return Object.freeze({
    containmentId: hashReadinessValue("readiness-containment-id", {
      frameworkHash: input.coordinationFramework.frameworkHash,
      createdAt: input.createdAt,
    }),
    runtimeBoundarySafe: input.runtimeBoundarySafe,
    hiddenExecutionDetected: input.hiddenExecutionDetected,
    boundedCoordination: input.coordinationFramework.containment.bounded && input.coordinationFramework.containment.isolated,
    overrideSupremacyPreserved: input.coordinationFramework.containment.overrideReachable,
    nonExecutingArchitecture: !input.hiddenExecutionDetected && input.runtimeBoundarySafe,
    reasons,
    createdAt: input.createdAt,
  });
}
