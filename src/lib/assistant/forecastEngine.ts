import { scoreRouteImpact } from "@/src/lib/assistant/scoring";
import type { AssistantContext, ForecastSummary } from "@/src/lib/assistant/types";

function recentDelayDelta(context: AssistantContext) {
  const points = context.data.insights.delayTrend;
  if (points.length < 2) {
    return 0;
  }

  const last = points.at(-1)?.delay ?? 0;
  const prior = points.at(-2)?.delay ?? 0;
  return last - prior;
}

export function buildForecast(context: AssistantContext): ForecastSummary {
  const route = context.mostImpactedRoute;
  if (!route) {
    return {
      title: "Commute forecast",
      summary: "There is not enough saved-route context yet to predict how your commute will shift next.",
      forecastMinutes: 0,
      trendLabel: "steady",
      recommendation: "Save a route first so the system can forecast it.",
    };
  }

  const delta = recentDelayDelta(context);
  const impact = scoreRouteImpact(route);
  const baseForecast = route.route.currentTimeMinutes;
  const forecastMinutes = Math.max(
    route.route.normalTimeMinutes,
    Math.round(baseForecast + delta * 0.8 + Math.max(0, impact - 10) * 0.2),
  );
  const trendLabel: ForecastSummary["trendLabel"] =
    delta >= 2 ? "worsening" : delta <= -2 ? "improving" : "steady";

  if (trendLabel === "worsening") {
    return {
      title: "Commute forecast",
      summary: `${route.route.label} is likely to climb toward ${forecastMinutes} minutes if the current trend continues over the next 20 to 30 minutes.`,
      forecastMinutes,
      trendLabel,
      recommendation: "If this route matters, acting earlier is safer than waiting for a late recovery.",
    };
  }

  if (trendLabel === "improving") {
    return {
      title: "Commute forecast",
      summary: `${route.route.label} looks like it may ease toward ${forecastMinutes} minutes if the current recovery holds.`,
      forecastMinutes,
      trendLabel,
      recommendation: "You have a little more flexibility right now, but keep watching for new incidents.",
    };
  }

  return {
    title: "Commute forecast",
    summary: `${route.route.label} is likely to stay near ${forecastMinutes} minutes in the next update window.`,
    forecastMinutes,
    trendLabel,
    recommendation: "Use the leave-time advisor rather than expecting a sharp traffic swing.",
  };
}
