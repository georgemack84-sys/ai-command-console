import { ConstitutionalResilienceState, type ConstitutionalResilienceAssessment } from "../resilience/resilienceTypes";
import type { SupervisoryControlView } from "./supervisoryControlView";

export function isDashboardStateStale({
  generatedAt,
  nowMs,
  maxAgeMs = 5 * 60 * 1000,
}: {
  generatedAt: string;
  nowMs: number;
  maxAgeMs?: number;
}) {
  const generated = Date.parse(generatedAt);
  if (!Number.isFinite(generated)) {
    return true;
  }
  return nowMs - generated > maxAgeMs;
}

export function applyStewardshipDashboardPolicies({
  view,
  resilience,
  stale,
}: {
  view: SupervisoryControlView;
  resilience: ConstitutionalResilienceAssessment;
  stale: boolean;
}) {
  if (!stale) {
    return {
      view,
      controlsHidden: resilience.requiresFreeze || resilience.disputedConditions.length > 0,
      stale,
    };
  }

  return {
    view: {
      ...view,
      runtimeStability: {
        ...view.runtimeStability,
        operationalState: "STALE",
      },
      resilience: {
        ...resilience,
        resilienceState: ConstitutionalResilienceState.SURVIVABILITY_DISPUTED,
        requiresFreeze: true,
        requiresOperatorIntervention: true,
        disputedConditions: Array.from(new Set([...resilience.disputedConditions, "stale_dashboard_state"])),
      },
    },
    controlsHidden: true,
    stale,
  };
}
