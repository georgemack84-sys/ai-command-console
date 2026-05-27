import type {
  CoordinationCeiling,
  CoordinationContainment,
  CoordinationFrameworkError,
  CoordinationIsolation,
  DelegationBoundary,
} from "@/types/bounded-coordination-framework";
import type { AutonomyAuditEpisode } from "@/types/autonomy-audit-episode-model";
import { hashCoordinationValue } from "./coordinationGraphHasher";
import { createCoordinationError } from "./coordinationErrors";

export function deriveCoordinationContainment(input: {
  effectiveCeiling: CoordinationCeiling;
  boundaries: readonly DelegationBoundary[];
  isolation: CoordinationIsolation;
  auditEpisode: AutonomyAuditEpisode;
  createdAt: string;
}): { containment: CoordinationContainment; errors: readonly CoordinationFrameworkError[] } {
  const reasons: string[] = [];
  const errors: CoordinationFrameworkError[] = [];
  const bounded = input.boundaries.every((boundary) => boundary.allowed);
  const isolated = input.isolation.isolated;
  const overrideReachable = input.isolation.overrideReachable;
  if (!bounded) {
    reasons.push("delegation-boundary-violated");
  }
  if (!isolated) {
    reasons.push("orchestration-isolation-violated");
    errors.push(createCoordinationError("COORDINATION_ISOLATION_VIOLATION", "Coordination isolation was violated.", "isolation"));
  }
  if (!overrideReachable) {
    reasons.push("override-unreachable");
    errors.push(createCoordinationError("COORDINATION_OVERRIDE_UNREACHABLE", "Human override must remain reachable across coordination topology.", "override"));
  }

  const containment: CoordinationContainment = Object.freeze({
    containmentId: hashCoordinationValue("coordination-containment-id", {
      ceiling: input.effectiveCeiling,
      createdAt: input.createdAt,
    }),
    valid: bounded && isolated && overrideReachable,
    bounded,
    isolated,
    overrideReachable,
    effectiveCeiling: input.effectiveCeiling,
    reasons: Object.freeze(reasons),
    cautionState: input.auditEpisode.observation.cautionState,
    createdAt: input.createdAt,
  });

  return { containment, errors: Object.freeze(errors) };
}
