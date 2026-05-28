import type { ObservabilityMetric } from "./metricTypes";
import type { ObservabilityComponentHealth, ObservabilityHealthSnapshot } from "./observabilityTypes";

const COMPONENT_ORDER = ["contracts", "apiV1", "sam", "recovery", "verification", "locks", "telemetry"] as const;

function summarizeStatus(metrics: ObservabilityMetric[]) {
  if (metrics.length === 0) {
    return "UNKNOWN" as const;
  }
  if (metrics.some((metric) => metric.status === "CRITICAL")) {
    return "UNHEALTHY" as const;
  }
  if (metrics.some((metric) => metric.status === "WARNING")) {
    return "DEGRADED" as const;
  }
  if (metrics.some((metric) => metric.status === "UNKNOWN")) {
    return "DEGRADED" as const;
  }
  return "HEALTHY" as const;
}

function recommendedActionForStatus(status: ObservabilityHealthSnapshot["status"]) {
  switch (status) {
    case "UNHEALTHY":
      return "Immediate operator intervention is recommended.";
    case "DEGRADED":
      return "Inspect degraded or unknown components.";
    case "UNKNOWN":
      return "Inspect unavailable telemetry sources.";
    default:
      return "Continue monitoring.";
  }
}

export function buildSystemHealthSnapshot({
  generatedAt,
  metrics,
}: {
  generatedAt: string;
  metrics: ObservabilityMetric[];
}): ObservabilityHealthSnapshot {
  const components: ObservabilityComponentHealth[] = COMPONENT_ORDER.map((name) => {
    const componentMetrics = metrics.filter((metric) => metric.component === name);
    const status = summarizeStatus(componentMetrics);
    return {
      name,
      status,
      summary:
        componentMetrics.length === 0
          ? "No signals are currently available."
          : `${componentMetrics.length} signal(s) evaluated.`,
      recommendedAction: recommendedActionForStatus(status),
      signals: componentMetrics.map((metric) => metric.name),
    };
  });

  const overall =
    components.some((component) => component.status === "UNHEALTHY")
      ? "UNHEALTHY"
      : components.some((component) => component.status === "DEGRADED")
        ? "DEGRADED"
        : components.some((component) => component.status === "UNKNOWN")
          ? "DEGRADED"
          : "HEALTHY";

  return {
    status: overall,
    generatedAt,
    components,
    summary:
      overall === "HEALTHY"
        ? "All monitored components are healthy."
        : overall === "UNHEALTHY"
          ? "One or more critical components are unhealthy."
          : overall === "DEGRADED"
            ? "One or more components are degraded or unknown."
            : "System health is unknown.",
    recommendedAction: recommendedActionForStatus(overall),
  };
}
