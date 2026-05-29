import { calculateDeploymentTimeSignals } from "./deploymentOverrunClassifier";
import type {
  DeploymentFailureClassification,
  DeploymentOverrunSnapshot,
  DeploymentOverrunState,
  DeploymentOverrunTelemetry,
} from "./types";

export function buildDeploymentOverrunTelemetry(input: {
  snapshot: DeploymentOverrunSnapshot;
  state: DeploymentOverrunState;
  classification?: DeploymentFailureClassification;
  evidenceStatus: "PRESENT" | "MISSING" | "DISPUTED";
}): DeploymentOverrunTelemetry {
  const signals = calculateDeploymentTimeSignals(input.snapshot);

  return Object.freeze({
    workflow_id: input.snapshot.workflowId,
    run_id: input.snapshot.runId,
    started_at: input.snapshot.startedAt,
    updated_at: input.snapshot.updatedAt,
    state: input.state,
    classification: input.classification,
    heartbeat_age: signals.heartbeatAge,
    evidence_status: input.evidenceStatus,
    active_job: input.snapshot.activeJob,
    active_step: input.snapshot.activeStep,
    elapsedMinutes: signals.elapsedMinutes,
    lastProgressTimestamp: input.snapshot.lastProgressAt,
    latestLogs: Object.freeze([...input.snapshot.logs].slice(-5)),
  });
}
