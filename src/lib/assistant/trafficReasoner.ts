import { scoreAlertPriority, scoreRouteImpact } from "@/src/lib/assistant/scoring";
import type { AssistantContext, AssistantAnswer, RouteContext, RouteReasoning } from "@/src/lib/assistant/types";

function causeLabel(routeContext: RouteContext): RouteReasoning["dominantCause"] {
  const majorIncident = routeContext.incidents.find((incident) => incident.impact === "major");
  if (majorIncident?.type === "accident") {
    return "accident";
  }
  if (majorIncident?.type === "road closure") {
    return "road closure";
  }
  if (routeContext.incidents.some((incident) => incident.type === "construction")) {
    return "construction";
  }
  if (routeContext.delayMinutes > 3 || routeContext.dominantTraffic !== "light") {
    return "congestion";
  }
  return "clear";
}

export function explainRoute(routeContext: RouteContext): RouteReasoning {
  const dominantCause = causeLabel(routeContext);
  const incidentSummary = routeContext.incidents[0]?.title;

  if (dominantCause === "accident") {
    return {
      headline: `${routeContext.route.label} is slow because of an accident`,
      cause: "Accident",
      explanation: incidentSummary || "A collision on this route is reducing speeds and increasing travel time.",
      recommendation: "If this trip is optional, give traffic a few minutes to settle or look for an alternate corridor.",
      dominantCause,
    };
  }

  if (dominantCause === "road closure") {
    return {
      headline: `${routeContext.route.label} is being constrained by a closure`,
      cause: "Road closure",
      explanation: incidentSummary || "A closure is forcing traffic into fewer lanes or surface streets.",
      recommendation: "Expect lane pressure to persist until the closure clears. Leaving early is safer than waiting too long.",
      dominantCause,
    };
  }

  if (dominantCause === "construction") {
    return {
      headline: `${routeContext.route.label} is mainly slowed by construction`,
      cause: "Construction",
      explanation: incidentSummary || "Work zones are reducing lane availability and creating a steady slowdown.",
      recommendation: "This kind of delay is usually sticky, so a small early departure buffer is the best move.",
      dominantCause,
    };
  }

  if (dominantCause === "congestion") {
    return {
      headline: `${routeContext.route.label} is heavy from broad congestion`,
      cause: "Congestion",
      explanation: "Traffic volumes are climbing across the route even without a single dominant incident.",
      recommendation: "Leaving slightly earlier is likely to help more than waiting if this trend continues.",
      dominantCause,
    };
  }

  return {
    headline: `${routeContext.route.label} is moving close to normal`,
    cause: "Clear conditions",
    explanation: "No major disruption is dominating this route right now.",
    recommendation: "You can keep your normal departure window unless conditions change.",
    dominantCause,
  };
}

export function buildCommuteBriefing(context: AssistantContext): AssistantAnswer {
  const route = context.mostImpactedRoute;
  if (!route) {
    return {
      title: "Commute briefing",
      summary: "No saved routes are available yet, so the system cannot build a personalized briefing.",
      bullets: ["Save a route to start receiving route-specific explanations and recommendations."],
      recommendation: "Add your main commute in Route Monitor first.",
    };
  }

  const explanation = explainRoute(route);
  const impactedCount = context.routes.filter((item) => scoreRouteImpact(item) >= 10).length;

  return {
    title: "Commute briefing",
    summary: `${route.route.label} is currently ${route.delayMinutes} minutes slower than normal.`,
    bullets: [
      `${route.route.currentTimeMinutes} min now vs ${route.route.normalTimeMinutes} min typical.`,
      explanation.explanation,
      impactedCount > 1 ? `${impactedCount} saved routes are seeing meaningful slowdown right now.` : "Only one saved route is materially impacted right now.",
    ],
    recommendation: explanation.recommendation,
  };
}

export function buildAlertSummary(context: AssistantContext): AssistantAnswer {
  const alerts = [...context.topAlerts].sort((a, b) => scoreAlertPriority(b) - scoreAlertPriority(a));

  if (!alerts.length) {
    return {
      title: "Alert summary",
      summary: "No urgent alert is active across your saved routes.",
      bullets: ["The system is still watching for incident spikes and departure windows."],
      recommendation: "You can stick with your normal travel plan for now.",
    };
  }

  const critical = alerts.filter((alert) => alert.severity === "critical");
  const top = alerts[0];
  const impactedRoutes = new Set(alerts.map((alert) => alert.routeId)).size;

  return {
    title: "Alert summary",
    summary: critical.length
      ? `${critical.length} critical alert${critical.length > 1 ? "s are" : " is"} active.`
      : "Warnings are active, but no critical alert is leading right now.",
    bullets: [
      `Top issue: ${top.title}.`,
      `${impactedRoutes} saved route${impactedRoutes > 1 ? "s are" : " is"} currently affected.`,
      alerts.slice(0, 2).map((alert) => alert.detail).join(" "),
    ],
    recommendation: top.severity === "critical" ? "Prioritize the top impacted route before you leave." : "Watch the leading warning, but conditions are still manageable.",
  };
}
