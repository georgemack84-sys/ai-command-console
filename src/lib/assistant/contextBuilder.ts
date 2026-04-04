import type { AssistantContext, RouteContext } from "@/src/lib/assistant/types";
import type { DashboardData } from "@/src/lib/types";

function dominantTrafficStatus(route: RouteContext["route"], segments: RouteContext["segments"]) {
  if (!segments.length) {
    return "light";
  }
  if (segments.some((segment) => segment.status === "heavy")) {
    return "heavy";
  }
  if (segments.some((segment) => segment.status === "moderate")) {
    return "moderate";
  }
  return "light";
}

export function buildAssistantContext(data: DashboardData): AssistantContext {
  const routes = data.savedRoutes.map((route) => {
    const segments = data.trafficSegments.filter((segment) => route.segmentIds.includes(segment.id));
    const incidents = data.incidents.filter((incident) => route.segmentIds.includes(incident.segmentId) && incident.active);
    const delayMinutes = route.currentTimeMinutes - route.normalTimeMinutes;

    return {
      route,
      segments,
      incidents,
      delayMinutes,
      dominantTraffic: dominantTrafficStatus(route, segments),
    } satisfies RouteContext;
  });

  const mostImpactedRoute =
    [...routes].sort((a, b) => {
      const impactA = a.delayMinutes + a.incidents.length * 4;
      const impactB = b.delayMinutes + b.incidents.length * 4;
      return impactB - impactA;
    })[0] ?? null;

  return {
    data,
    routes,
    topAlerts: [...data.alerts].sort((a, b) => b.rank - a.rank).slice(0, 5),
    recentHistory: data.insights.delayTrend.map((point, index) => ({
      timestamp: point.label,
      averageCommuteMinutes: point.delay,
      byTimeOfDay: index < 2 ? "Morning" : index < 4 ? "Midday" : index < 6 ? "Evening" : "Night",
      dayOfWeek: "Today",
      routeMetrics: [],
      congestedSegments: [],
    })),
    mostImpactedRoute,
  };
}
