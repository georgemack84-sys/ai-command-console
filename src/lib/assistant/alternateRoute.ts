import { scoreRouteImpact } from "@/src/lib/assistant/scoring";
import type { AlternateRouteSuggestion, AssistantContext, RouteContext } from "@/src/lib/assistant/types";

function compatibleAlternate(primary: RouteContext, candidate: RouteContext) {
  const sameDestination = primary.route.destination.toLowerCase() === candidate.route.destination.toLowerCase();
  const sameOrigin = primary.route.origin.toLowerCase() === candidate.route.origin.toLowerCase();
  const sharedSegments = candidate.route.segmentIds.filter((segmentId) => primary.route.segmentIds.includes(segmentId)).length;

  return sameDestination || sameOrigin || sharedSegments <= Math.max(1, Math.floor(primary.route.segmentIds.length / 2));
}

export function suggestAlternateRoute(context: AssistantContext): AlternateRouteSuggestion {
  const primary = context.mostImpactedRoute;
  if (!primary) {
    return {
      available: false,
      title: "Alternate route guidance",
      summary: "There is no saved route context yet to compare against.",
      recommendation: "Save a route first so Jarvis can compare alternatives.",
    };
  }

  const primaryScore = scoreRouteImpact(primary);
  const savedCandidate = [...context.routes]
    .filter((route) => route.route.id !== primary.route.id)
    .filter((route) => compatibleAlternate(primary, route))
    .sort((a, b) => scoreRouteImpact(a) - scoreRouteImpact(b))[0];

  const alternateSegments = context.data.trafficSegments
    .filter((segment) => !primary.route.segmentIds.includes(segment.id))
    .sort((a, b) => a.travelTimeMinutes - b.travelTimeMinutes)
    .slice(0, Math.max(1, primary.route.segmentIds.length));
  const syntheticMinutes = alternateSegments.reduce((sum, segment) => sum + segment.travelTimeMinutes, 0);
  const syntheticNormal = alternateSegments.reduce((sum, segment) => sum + segment.normalTimeMinutes, 0);
  const syntheticScore = Math.max(0, syntheticMinutes - syntheticNormal) + alternateSegments.filter((segment) => segment.status === "heavy").length * 3;

  const candidate = savedCandidate
    ? {
        label: savedCandidate.route.label,
        currentMinutes: savedCandidate.route.currentTimeMinutes,
        score: scoreRouteImpact(savedCandidate),
        fromSavedRoutes: true,
      }
    : alternateSegments.length
      ? {
          label: `${alternateSegments[0]?.start} to ${alternateSegments.at(-1)?.end} relief corridor`,
          currentMinutes: syntheticMinutes,
          score: syntheticScore,
          fromSavedRoutes: false,
        }
      : null;

  if (!candidate) {
    return {
      available: false,
      title: "Alternate route guidance",
      summary: "No saved route looks materially cleaner than the current primary route.",
      recommendation: "Use the leave-time recommendation instead of switching routes right now.",
    };
  }

  const candidateScore = candidate.score;
  const expectedSavingsMinutes = Math.max(0, primary.route.currentTimeMinutes - candidate.currentMinutes);

  if (primaryScore - candidateScore < 4 || expectedSavingsMinutes < 3) {
    return {
      available: false,
      title: "Alternate route guidance",
      summary: `${candidate.label} is only marginally better than ${primary.route.label} right now.`,
      candidateRouteLabel: candidate.label,
      expectedSavingsMinutes,
      recommendation: "Switching routes is unlikely to save enough time to justify the change.",
    };
  }

  return {
    available: true,
    title: "Alternate route guidance",
    summary: `${candidate.label} currently looks lighter than ${primary.route.label}.`,
    candidateRouteLabel: candidate.label,
    expectedSavingsMinutes,
    recommendation: candidate.fromSavedRoutes
      ? `If your destination is flexible enough, ${candidate.label} is the cleaner corridor and could save about ${expectedSavingsMinutes} minutes.`
      : `Jarvis found a cleaner relief corridor through lower-pressure segments that could save about ${expectedSavingsMinutes} minutes if local routing supports it.`,
  };
}
