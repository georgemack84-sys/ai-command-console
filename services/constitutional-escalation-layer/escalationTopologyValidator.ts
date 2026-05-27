import type { ConstitutionalEscalationError } from "@/types/constitutional-escalation-layer";
import type { BoundedCoordinationFrameworkRecord } from "@/types/bounded-coordination-framework";
import { createEscalationError } from "./escalationErrors";

export type EscalationTopologySignals = Readonly<{
  recursiveTopology: boolean;
  hiddenDelegationPath: boolean;
  branchFactorOverflow: boolean;
  depthOverflow: boolean;
  authorityDrift: boolean;
  topologyAmbiguous: boolean;
  missingOverrideReachability: boolean;
}>;

export function validateEscalationTopology(
  coordinationFramework: BoundedCoordinationFrameworkRecord,
): Readonly<{
  signals: EscalationTopologySignals;
  errors: readonly ConstitutionalEscalationError[];
}> {
  const has = (code: string) => coordinationFramework.errors.some((error) => error.code === code);
  const signals: EscalationTopologySignals = Object.freeze({
    recursiveTopology: has("COORDINATION_RECURSION_DETECTED"),
    hiddenDelegationPath: has("COORDINATION_HIDDEN_PATH_DETECTED"),
    branchFactorOverflow: has("COORDINATION_BRANCH_FACTOR_EXCEEDED"),
    depthOverflow: has("COORDINATION_DEPTH_EXCEEDED"),
    authorityDrift: has("COORDINATION_AUTHORITY_DRIFT"),
    topologyAmbiguous: has("COORDINATION_TOPOLOGY_INVALID"),
    missingOverrideReachability: has("COORDINATION_OVERRIDE_UNREACHABLE"),
  });

  const errors: ConstitutionalEscalationError[] = [];
  if (signals.recursiveTopology) {
    errors.push(createEscalationError("ESCALATION_RECURSIVE_TOPOLOGY", "Recursive coordination topology is constitutionally invalid.", "coordinationFramework.topology"));
  }
  if (signals.hiddenDelegationPath) {
    errors.push(createEscalationError("ESCALATION_HIDDEN_PATH", "Hidden delegation paths require fail-closed escalation.", "coordinationFramework.topology"));
  }
  if (signals.topologyAmbiguous) {
    errors.push(createEscalationError("ESCALATION_TOPOLOGY_AMBIGUOUS", "Topology ambiguity is unsafe.", "coordinationFramework.topology"));
  }
  if (signals.authorityDrift) {
    errors.push(createEscalationError("ESCALATION_AUTHORITY_DRIFT", "Authority drift requires escalated oversight.", "coordinationFramework.isolation"));
  }
  if (signals.missingOverrideReachability) {
    errors.push(createEscalationError("ESCALATION_OVERRIDE_MISSING", "Override reachability is required for constitutional escalation.", "coordinationFramework.isolation"));
  }
  return Object.freeze({ signals, errors: Object.freeze(errors) });
}
