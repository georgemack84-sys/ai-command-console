import type { RouteChangeSummary, RouteContext } from "@/src/lib/assistant/types";
import type { TrafficSnapshot } from "@/src/lib/types";

function latestDelayForRoute(history: TrafficSnapshot[], routeId: string) {
  const latest = history
    .slice(-6)
    .flatMap((snapshot) => snapshot.routeMetrics.map((metric) => ({ timestamp: snapshot.timestamp, ...metric })))
    .filter((metric) => metric.routeId === routeId);

  return latest.slice(-2);
}

export function summarizeRouteChange(routeContext: RouteContext, history: TrafficSnapshot[]): RouteChangeSummary {
  const recent = latestDelayForRoute(history, routeContext.route.id);
  const prior = recent.at(-2);
  const current = recent.at(-1);
  const delta = current && prior ? current.delayMinutes - prior.delayMinutes : 0;
  const worseningSegments = routeContext.segments.filter((segment) => segment.trend === "worsening");
  const improvingSegments = routeContext.segments.filter((segment) => segment.trend === "improving");

  if (!current || !prior) {
    return {
      title: "Route change summary",
      summary: "There is not enough recent history yet to explain what changed on this route.",
      changed: false,
      bullets: ["The system needs a few more live snapshots before it can compare route movement over time."],
      recommendation: "Keep watching this route for another update cycle.",
    };
  }

  if (delta >= 3) {
    return {
      title: "Route change summary",
      summary: `${routeContext.route.label} has worsened by about ${delta} minutes over the recent simulation window.`,
      changed: true,
      bullets: [
        `${worseningSegments.length} segment${worseningSegments.length === 1 ? " is" : "s are"} trending worse.`,
        routeContext.incidents.length
          ? `${routeContext.incidents.length} active incident${routeContext.incidents.length === 1 ? "" : "s"} are contributing to the slowdown.`
          : "The change appears to come from broad congestion rather than a single incident.",
      ],
      recommendation: "If this trip matters, treat the route as unstable and leave earlier than usual.",
    };
  }

  if (delta <= -3) {
    return {
      title: "Route change summary",
      summary: `${routeContext.route.label} has improved by about ${Math.abs(delta)} minutes compared with the previous update.`,
      changed: true,
      bullets: [
        `${improvingSegments.length} segment${improvingSegments.length === 1 ? " is" : "s are"} easing.`,
        routeContext.incidents.length
          ? "Incident pressure is still present, but traffic is recovering."
          : "Volumes are easing without any new disruption taking over.",
      ],
      recommendation: "This is a reasonable moment to depart if the route is your main concern.",
    };
  }

  return {
    title: "Route change summary",
    summary: `${routeContext.route.label} has been relatively steady over the last two updates.`,
    changed: false,
    bullets: [
      "Travel time has not materially changed in the recent window.",
      routeContext.incidents.length
        ? "The current disruption is stable rather than sharply worsening."
        : "No new event is pushing the route out of its current pattern.",
    ],
    recommendation: "Stick with the current leave-time guidance unless another alert appears.",
  };
}
