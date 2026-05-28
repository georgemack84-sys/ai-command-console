import type { DeploymentFailureClass, DeploymentSnapshot, DeploymentTelemetry } from "./types";

export function elapsedMinutes(startedAt: string, observedAt: string) {
  return Math.max(0, Math.floor((Date.parse(observedAt) - Date.parse(startedAt)) / 60_000));
}

export function minutesSince(timestamp: string | undefined, observedAt: string) {
  if (!timestamp) return null;
  return Math.max(0, Math.floor((Date.parse(observedAt) - Date.parse(timestamp)) / 60_000));
}

export function buildDeploymentTelemetry(input: {
  snapshot: DeploymentSnapshot;
  failureClass?: DeploymentFailureClass;
}): DeploymentTelemetry {
  return Object.freeze({
    workflowId: input.snapshot.workflowId,
    deploymentId: input.snapshot.deploymentId,
    currentStep: input.snapshot.currentStep,
    currentPartition: input.snapshot.currentPartition,
    lastCompletedPartition: input.snapshot.lastCompletedPartition,
    elapsedTime: elapsedMinutes(input.snapshot.startedAt, input.snapshot.observedAt),
    heartbeatAt: input.snapshot.heartbeatAt,
    failureClass: input.failureClass,
    certificateStatus: input.snapshot.certificateStatus,
    attemptCount: input.snapshot.attemptCount,
  });
}
