import { scoreRouteImpact } from "@/src/lib/assistant/scoring";
import type { AssistantContext, WatchlistItem } from "@/src/lib/assistant/types";

export function buildWatchlist(context: AssistantContext): WatchlistItem[] {
  const items: WatchlistItem[] = [];
  const topRoute = context.mostImpactedRoute;
  const topAlert = context.topAlerts[0];
  const trend = context.data.insights.delayTrend;
  const lastTrend = trend.at(-1)?.delay ?? 0;
  const priorTrend = trend.at(-2)?.delay ?? lastTrend;

  if (topRoute) {
    const score = scoreRouteImpact(topRoute);
    if (score >= 14) {
      items.push({
        id: `watch-${topRoute.route.id}`,
        title: `Watch ${topRoute.route.label}`,
        detail: `${topRoute.route.label} is the most unstable route right now, driven by ${topRoute.incidents.length ? "incident pressure" : "broad congestion"} and a ${topRoute.delayMinutes}-minute delay.`,
        tone: "warning",
      });
    }
  }

  if (topAlert?.type === "best time to leave") {
    items.push({
      id: `leave-${topAlert.routeId}`,
      title: "Departure opportunity",
      detail: "There is a temporary opening in traffic. This is a good window to leave before the next congestion rise.",
      tone: "opportunity",
    });
  }

  if (lastTrend - priorTrend >= 2) {
    items.push({
      id: "trend-rise",
      title: "Congestion is building",
      detail: "The latest delay trend stepped up from the previous snapshot, which usually means the next 15 to 20 minutes will be tougher.",
      tone: "watch",
    });
  }

  if (!items.length) {
    items.push({
      id: "steady-state",
      title: "Conditions are steady",
      detail: "Nothing is flashing red right now. Jarvis is watching for the next disruption or departure window.",
      tone: "watch",
    });
  }

  return items.slice(0, 3);
}
