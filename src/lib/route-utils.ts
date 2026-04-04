import { demoSavedRoutes, getDashboardData } from "@/src/lib/mock-data";
import type {
  Alert,
  DashboardData,
  Incident,
  InsightData,
  RouteEstimate,
  SavedRoute,
  TrafficLevel,
  TrafficSegment,
  TrafficSnapshot,
  UserSettings,
} from "@/src/lib/types";

export const defaultSettings: UserSettings = {
  theme: "system",
  refreshInterval: "Every 15 seconds",
  alertsEnabled: true,
  mapAnimation: true,
  routeBufferMinutes: 10,
};

export function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function trafficTone(level: TrafficLevel) {
  if (level === "light") {
    return {
      label: "Light",
      badge: "border-emerald-400/30 bg-emerald-400/12 text-emerald-100",
      line: "#22c55e",
    };
  }

  if (level === "moderate") {
    return {
      label: "Moderate",
      badge: "border-amber-300/30 bg-amber-300/12 text-amber-100",
      line: "#facc15",
    };
  }

  return {
    label: "Heavy",
    badge: "border-rose-400/30 bg-rose-400/12 text-rose-100",
    line: "#ef4444",
  };
}

export function incidentTone(impact: Incident["impact"]) {
  if (impact === "minor") {
    return "border-sky-400/30 bg-sky-400/10 text-sky-100";
  }

  if (impact === "moderate") {
    return "border-amber-300/30 bg-amber-300/10 text-amber-100";
  }

  return "border-rose-400/30 bg-rose-400/10 text-rose-100";
}

export function alertTone(severity: Alert["severity"]) {
  if (severity === "info") {
    return "border-sky-400/30 bg-sky-400/10 text-sky-100";
  }

  if (severity === "warning") {
    return "border-amber-300/30 bg-amber-300/10 text-amber-100";
  }

  return "border-rose-400/30 bg-rose-400/10 text-rose-100";
}

function scoreRoute(route: SavedRoute, origin: string, destination: string) {
  const haystack = `${route.label} ${route.origin} ${route.destination}`.toLowerCase();
  let score = 0;

  for (const term of [origin, destination]) {
    if (!term) {
      continue;
    }

    const normalized = term.toLowerCase();
    if (haystack.includes(normalized)) {
      score += 3;
    }

    if (route.origin.toLowerCase().includes(normalized) || route.destination.toLowerCase().includes(normalized)) {
      score += 2;
    }
  }

  return score;
}

function findSegmentsByIds(data: DashboardData, segmentIds: string[]) {
  return segmentIds
    .map((segmentId) => data.trafficSegments.find((segment) => segment.id === segmentId))
    .filter((segment): segment is TrafficSegment => Boolean(segment));
}

export function estimateRoute(origin: string, destination: string, data = getDashboardData()): RouteEstimate {
  const normalizedOrigin = origin.trim();
  const normalizedDestination = destination.trim();
  const candidateRoutes = data.savedRoutes.length ? data.savedRoutes : demoSavedRoutes;
  const matchedRoute =
    [...candidateRoutes]
      .sort((a, b) => scoreRoute(b, normalizedOrigin, normalizedDestination) - scoreRoute(a, normalizedOrigin, normalizedDestination))
      .find((route) => scoreRoute(route, normalizedOrigin, normalizedDestination) > 0) ?? candidateRoutes[0];

  const segments = findSegmentsByIds(data, matchedRoute.segmentIds);
  const routeIncidents = data.incidents.filter((incident) => matchedRoute.segmentIds.includes(incident.segmentId) && incident.active);
  const currentTimeMinutes = segments.reduce((sum, segment) => sum + segment.travelTimeMinutes, 0);
  const normalTimeMinutes = segments.reduce((sum, segment) => sum + segment.normalTimeMinutes, 0);
  const delayMinutes = currentTimeMinutes - normalTimeMinutes;
  const status = segments.some((segment) => segment.status === "heavy")
    ? "heavy"
    : segments.some((segment) => segment.status === "moderate")
      ? "moderate"
      : "light";

  return {
    id: `${matchedRoute.id}-${normalizedOrigin}-${normalizedDestination}`.toLowerCase().replace(/\s+/g, "-"),
    label: `${normalizedOrigin || matchedRoute.origin} to ${normalizedDestination || matchedRoute.destination}`,
    origin: normalizedOrigin || matchedRoute.origin,
    destination: normalizedDestination || matchedRoute.destination,
    currentTimeMinutes,
    normalTimeMinutes,
    delayMinutes,
    status,
    segmentIds: matchedRoute.segmentIds,
    incidents: routeIncidents,
    summary:
      delayMinutes > 10
        ? "Leave early if you can. Traffic intelligence is showing a meaningful slowdown on this route."
        : delayMinutes > 4
          ? "Conditions are manageable, but congestion is starting to build."
          : "This route is moving close to normal right now.",
  };
}

export function createSavedRouteFromEstimate(estimate: RouteEstimate, label?: string): SavedRoute {
  return {
    id: estimate.id,
    label: label?.trim() || estimate.label,
    origin: estimate.origin,
    destination: estimate.destination,
    segmentIds: estimate.segmentIds,
    currentTimeMinutes: estimate.currentTimeMinutes,
    normalTimeMinutes: estimate.normalTimeMinutes,
    lastUpdated: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
    routeGeometry: estimate.routeGeometry,
    originCoordinate: estimate.originCoordinate,
    destinationCoordinate: estimate.destinationCoordinate,
  };
}

export function buildRouteAlerts(savedRoutes: SavedRoute[], incidents: Incident[]): Alert[] {
  return savedRoutes
    .flatMap((route) => {
      const routeIncidents = incidents.filter((incident) => route.segmentIds.includes(incident.segmentId) && incident.active);
      const travelDeltaMinutes = route.currentTimeMinutes - route.normalTimeMinutes;
      const items: Alert[] = [];

      if (travelDeltaMinutes >= 5) {
        items.push({
          id: `delay-${route.id}`,
          routeId: route.id,
          title: `${route.label} delay warning`,
          severity: travelDeltaMinutes >= 10 ? "critical" : "warning",
          type: "delay warning",
          detail: `${route.label} is running ${travelDeltaMinutes} minutes slower than normal.`,
          travelDeltaMinutes,
          incidentIds: routeIncidents.map((incident) => incident.id),
          updatedAt: "Updated now",
          rank: travelDeltaMinutes >= 10 ? 95 : 70,
        });
      }

      if (routeIncidents.length) {
        items.push({
          id: `incident-${route.id}`,
          routeId: route.id,
          title: `${route.label} incident detected`,
          severity: routeIncidents.some((incident) => incident.impact === "major") ? "critical" : "warning",
          type: "incident detected",
          detail: routeIncidents.map((incident) => incident.title).join(" • "),
          travelDeltaMinutes,
          incidentIds: routeIncidents.map((incident) => incident.id),
          updatedAt: "Updated now",
          rank: routeIncidents.some((incident) => incident.impact === "major") ? 100 : 80,
        });
      }

      return items;
    })
    .sort((a, b) => b.rank - a.rank);
}

export function pickTimeBucket(hour: number) {
  if (hour >= 6 && hour < 11) {
    return "Morning";
  }
  if (hour >= 11 && hour < 16) {
    return "Midday";
  }
  if (hour >= 16 && hour < 21) {
    return "Evening";
  }
  return "Night";
}

export function buildInsightsFromHistory(history: TrafficSnapshot[]): InsightData {
  if (!history.length) {
    return getDashboardData().insights;
  }

  const averageByKey = (entries: Array<{ label: string; minutes: number }>) =>
    Object.values(
      entries.reduce<Record<string, { label: string; total: number; count: number }>>((acc, entry) => {
        const current = acc[entry.label] ?? { label: entry.label, total: 0, count: 0 };
        current.total += entry.minutes;
        current.count += 1;
        acc[entry.label] = current;
        return acc;
      }, {}),
    ).map((entry) => ({
      label: entry.label,
      minutes: Number((entry.total / entry.count).toFixed(1)),
    }));

  const commuteByTimeOfDay = averageByKey(
    history.map((snapshot) => ({
      label: snapshot.byTimeOfDay,
      minutes: snapshot.averageCommuteMinutes,
    })),
  );

  const commuteByDayOfWeek = averageByKey(
    history.map((snapshot) => ({
      label: snapshot.dayOfWeek,
      minutes: snapshot.averageCommuteMinutes,
    })),
  );

  const routeDelayMap = history.flatMap((snapshot) => snapshot.routeMetrics).reduce<Record<string, { label: string; total: number; count: number }>>((acc, metric) => {
    const current = acc[metric.routeId] ?? { label: metric.routeLabel, total: 0, count: 0 };
    current.total += metric.delayMinutes;
    current.count += 1;
    acc[metric.routeId] = current;
    return acc;
  }, {});

  const routeCongestion = Object.values(routeDelayMap)
    .map((route) => ({
      label: route.label,
      averageDelay: Number((route.total / route.count).toFixed(1)),
    }))
    .sort((a, b) => b.averageDelay - a.averageDelay)
    .slice(0, 5);

  const delayTrend = history.slice(-8).map((snapshot) => ({
    label: new Date(snapshot.timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
    delay: Number(
      (
        snapshot.routeMetrics.reduce((sum, metric) => sum + metric.delayMinutes, 0) /
        Math.max(snapshot.routeMetrics.length, 1)
      ).toFixed(1),
    ),
  }));

  return {
    commuteByTimeOfDay,
    commuteByDayOfWeek,
    routeCongestion,
    delayTrend,
  };
}
