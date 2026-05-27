import { setSamGauge } from "../performance/samPerformanceMetrics";
import { determineSamDegradedMode } from "./samDegradedMode";
import type { SamBackpressureDecision, SamBackpressureInput } from "./samScalingTypes";

export function evaluateSamBackpressure(input: SamBackpressureInput): SamBackpressureDecision {
  setSamGauge("sam.queue.depth", input.queueDepth);
  const mode = determineSamDegradedMode(input);

  if (mode === "FROZEN") {
    return {
      mode,
      shouldThrottle: true,
      shouldReject: true,
      reason: "AUDIT_OR_QUEUE_PRESSURE_FROZEN",
    };
  }
  if (mode === "RESTRICTED") {
    return {
      mode,
      shouldThrottle: true,
      shouldReject: true,
      reason:
        input.auditAppendLatencyMs > input.limits.MAX_AUDIT_APPEND_LATENCY_MS
          ? "AUDIT_LATENCY_RESTRICTED"
          : "CAPACITY_RESTRICTED",
    };
  }
  if (mode === "DEGRADED" || mode === "THROTTLED") {
    return {
      mode,
      shouldThrottle: true,
      shouldReject: false,
      reason:
        input.auditAppendLatencyMs > input.limits.MAX_AUDIT_APPEND_LATENCY_MS
          ? "AUDIT_LATENCY_ELEVATED"
          : "QUEUE_PRESSURE_THROTTLED",
    };
  }
  if (mode === "ELEVATED") {
    return {
      mode,
      shouldThrottle: false,
      shouldReject: false,
      reason: "ELEVATED_PRESSURE",
    };
  }
  return {
    mode,
    shouldThrottle: false,
    shouldReject: false,
    reason: "NORMAL",
  };
}
