import { suggestAlternateRoute } from "@/src/lib/assistant/alternateRoute";
import { summarizeRouteChange } from "@/src/lib/assistant/changeTracker";
import { buildAssistantContext } from "@/src/lib/assistant/contextBuilder";
import { buildForecast } from "@/src/lib/assistant/forecastEngine";
import { getLeaveRecommendation } from "@/src/lib/assistant/predictionEngine";
import { buildAlertSummary, buildCommuteBriefing, explainRoute } from "@/src/lib/assistant/trafficReasoner";
import { buildWatchlist } from "@/src/lib/assistant/watchlist";
import type { AssistantAnswer } from "@/src/lib/assistant/types";
import type { DashboardData, RouteEstimate } from "@/src/lib/types";

export function composeCommuteBriefing(data: DashboardData) {
  return buildCommuteBriefing(buildAssistantContext(data));
}

export function composeAlertSummary(data: DashboardData) {
  return buildAlertSummary(buildAssistantContext(data));
}

export function composeLeaveAdvisor(data: DashboardData) {
  return getLeaveRecommendation(buildAssistantContext(data));
}

export function composeForecast(data: DashboardData) {
  return buildForecast(buildAssistantContext(data));
}

export function composeRouteExplanation(data: DashboardData, estimate?: RouteEstimate) {
  const context = buildAssistantContext(data);

  if (estimate) {
    const routeContext = {
      route: {
        id: estimate.id,
        label: estimate.label,
        origin: estimate.origin,
        destination: estimate.destination,
        currentTimeMinutes: estimate.currentTimeMinutes,
        normalTimeMinutes: estimate.normalTimeMinutes,
        lastUpdated: "Now",
        segmentIds: estimate.segmentIds,
      },
      segments: data.trafficSegments.filter((segment) => estimate.segmentIds.includes(segment.id)),
      incidents: estimate.incidents,
      delayMinutes: estimate.delayMinutes,
      dominantTraffic: estimate.status,
    };

    return explainRoute(routeContext);
  }

  return context.mostImpactedRoute ? explainRoute(context.mostImpactedRoute) : explainRoute({
    route: {
      id: "empty",
      label: "Current route",
      origin: "",
      destination: "",
      currentTimeMinutes: 0,
      normalTimeMinutes: 0,
      lastUpdated: "",
      segmentIds: [],
    },
    segments: [],
    incidents: [],
    delayMinutes: 0,
    dominantTraffic: "light",
  });
}

export function composeRouteChangeSummary(data: DashboardData, estimate?: RouteEstimate) {
  const context = buildAssistantContext(data);

  if (estimate) {
    const routeContext = {
      route: {
        id: estimate.id,
        label: estimate.label,
        origin: estimate.origin,
        destination: estimate.destination,
        currentTimeMinutes: estimate.currentTimeMinutes,
        normalTimeMinutes: estimate.normalTimeMinutes,
        lastUpdated: "Now",
        segmentIds: estimate.segmentIds,
      },
      segments: data.trafficSegments.filter((segment) => estimate.segmentIds.includes(segment.id)),
      incidents: estimate.incidents,
      delayMinutes: estimate.delayMinutes,
      dominantTraffic: estimate.status,
    };

    return summarizeRouteChange(routeContext, data.insights.delayTrend.map((point) => ({
      timestamp: point.label,
      averageCommuteMinutes: point.delay,
      byTimeOfDay: "Morning",
      dayOfWeek: "Today",
      routeMetrics: [
        {
          routeId: estimate.id,
          routeLabel: estimate.label,
          delayMinutes: point.delay,
          currentTimeMinutes: estimate.normalTimeMinutes + point.delay,
          normalTimeMinutes: estimate.normalTimeMinutes,
        },
      ],
      congestedSegments: [],
    })));
  }

  return context.mostImpactedRoute
    ? summarizeRouteChange(context.mostImpactedRoute, context.recentHistory)
    : {
        title: "Route change summary",
        summary: "There is not enough route context yet to explain what changed.",
        changed: false,
        bullets: ["Save a route or run a route estimate to unlock change tracking."],
        recommendation: "Run a route check first.",
      };
}

export function composeAlternateRoute(data: DashboardData) {
  return suggestAlternateRoute(buildAssistantContext(data));
}

export function composeWatchlist(data: DashboardData) {
  return buildWatchlist(buildAssistantContext(data));
}

export function composeAssistantReply(data: DashboardData, prompt: string, estimate?: RouteEstimate): AssistantAnswer {
  const normalized = prompt.toLowerCase();
  const briefing = composeCommuteBriefing(data);
  const alertSummary = composeAlertSummary(data);
  const leave = composeLeaveAdvisor(data);
  const forecast = composeForecast(data);
  const routeExplanation = composeRouteExplanation(data, estimate);
  const routeChange = composeRouteChangeSummary(data, estimate);
  const alternate = composeAlternateRoute(data);

  if (normalized.includes("leave")) {
    return {
      title: "Leave-time advice",
      summary: `You should ${leave.label}${leave.minutesUntilDeparture ? ` in about ${leave.minutesUntilDeparture} minutes` : ""}.`,
      bullets: [leave.reason, briefing.summary],
      recommendation: leave.reason,
    };
  }

  if (normalized.includes("changed") || normalized.includes("why")) {
    return {
      title: routeChange.title,
      summary: routeChange.summary,
      bullets: routeChange.bullets,
      recommendation: routeChange.recommendation,
    };
  }

  if (normalized.includes("alternate")) {
    return {
      title: alternate.title,
      summary: alternate.summary,
      bullets: [
        alternate.candidateRouteLabel ? `Best candidate: ${alternate.candidateRouteLabel}.` : "No cleaner saved-route candidate is available.",
        routeExplanation.explanation,
      ],
      recommendation: alternate.recommendation,
    };
  }

  if (normalized.includes("traffic")) {
    return briefing;
  }

  if (normalized.includes("predict") || normalized.includes("forecast")) {
    return {
      title: forecast.title,
      summary: forecast.summary,
      bullets: [briefing.summary, leave.reason],
      recommendation: forecast.recommendation,
    };
  }

  return {
    title: "Assistant summary",
    summary: alertSummary.summary,
    bullets: [briefing.summary, forecast.summary, routeExplanation.explanation],
    recommendation: alertSummary.recommendation,
  };
}
