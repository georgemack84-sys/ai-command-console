import { scoreLeaveWindow } from "@/src/lib/assistant/scoring";
import type { AssistantContext, LeaveRecommendation, RouteContext } from "@/src/lib/assistant/types";

function routeTrendScore(routeContext: RouteContext) {
  const worseningSegments = routeContext.segments.filter((segment) => segment.trend === "worsening").length;
  const improvingSegments = routeContext.segments.filter((segment) => segment.trend === "improving").length;
  return worseningSegments - improvingSegments;
}

export function getLeaveRecommendation(context: AssistantContext): LeaveRecommendation {
  const route = context.mostImpactedRoute;

  if (!route) {
    return {
      label: "leave later",
      minutesUntilDeparture: 0,
      confidence: "low",
      reason: "The system needs at least one saved route before it can give a personalized leave-time recommendation.",
    };
  }

  const score = scoreLeaveWindow(route.delayMinutes, routeTrendScore(route), route.incidents.length);

  if (score >= 15) {
    return {
      label: "leave now",
      minutesUntilDeparture: 0,
      confidence: "high",
      reason: "The route is already strained and the current trend suggests conditions could get worse if you wait.",
    };
  }

  if (score >= 8) {
    return {
      label: "leave soon",
      minutesUntilDeparture: 10,
      confidence: "medium",
      reason: "Traffic is elevated but not fully peaked. A short buffer still gives you a decent window.",
    };
  }

  return {
    label: "leave later",
    minutesUntilDeparture: 20,
    confidence: "medium",
    reason: "Current conditions are manageable and the route does not look like it is spiking right this minute.",
  };
}
