import type { RouteContext } from "@/src/lib/assistant/types";
import type { Alert } from "@/src/lib/types";

export function scoreRouteImpact(routeContext: RouteContext) {
  const incidentWeight = routeContext.incidents.reduce((sum, incident) => {
    if (incident.impact === "major") {
      return sum + 7;
    }
    if (incident.impact === "moderate") {
      return sum + 4;
    }
    return sum + 2;
  }, 0);

  const trafficWeight =
    routeContext.dominantTraffic === "heavy" ? 8 : routeContext.dominantTraffic === "moderate" ? 4 : 1;

  return routeContext.delayMinutes + incidentWeight + trafficWeight;
}

export function scoreAlertPriority(alert: Alert) {
  const severityWeight = alert.severity === "critical" ? 100 : alert.severity === "warning" ? 60 : 25;
  const typeWeight =
    alert.type === "incident detected" ? 18 : alert.type === "delay warning" ? 12 : 4;

  return severityWeight + typeWeight + alert.travelDeltaMinutes;
}

export function scoreLeaveWindow(delayMinutes: number, trend: number, incidentCount: number) {
  return delayMinutes + trend * 0.7 + incidentCount * 3;
}
