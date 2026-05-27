import type { MonitoringTrigger, RuntimeObservationSnapshot } from "@/types/monitoring-trigger-model";
import { hashTriggerValue } from "./triggerHasher";

export function observeRuntimeTrigger(input: {
  runtimeObservation?: RuntimeObservationSnapshot;
  confidenceScore: number;
  replayBindings: readonly string[];
  governanceBindings: readonly string[];
  overrideBindings: readonly string[];
  lineageHash: string;
  createdAt: string;
}): MonitoringTrigger | undefined {
  const observation = input.runtimeObservation;
  if (!observation) {
    return undefined;
  }

  const unhealthy =
    observation.heartbeatState !== "healthy"
    || observation.leaseState !== "stable"
    || observation.queueDepth > 50
    || observation.retryRate > 0.2;

  if (!unhealthy) {
    return undefined;
  }

  const severity =
    observation.heartbeatState === "missing"
    || observation.leaseState === "missing"
    || observation.queueDepth > 100
    || observation.retryRate > 0.5
      ? "critical"
      : "high";

  return Object.freeze({
    triggerId: hashTriggerValue("monitoring-trigger-runtime-id", {
      observation,
      createdAt: input.createdAt,
      lineageHash: input.lineageHash,
    }),
    triggerType: "runtime",
    severity,
    cautionState: severity === "critical" ? "frozen-recommended" : "escalated",
    confidenceScore: input.confidenceScore,
    replayBindings: input.replayBindings,
    governanceBindings: input.governanceBindings,
    overrideBindings: input.overrideBindings,
    evidenceHashes: Object.freeze([
      hashTriggerValue("monitoring-trigger-runtime-heartbeat", observation.heartbeatState),
      hashTriggerValue("monitoring-trigger-runtime-lease", observation.leaseState),
      hashTriggerValue("monitoring-trigger-runtime-queue", observation.queueDepth),
      hashTriggerValue("monitoring-trigger-runtime-retry", observation.retryRate),
    ]),
    lineageHash: input.lineageHash,
    createdAt: input.createdAt,
  });
}
