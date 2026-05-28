import type { ControlledAutonomyDomainCertification, ControlledAutonomyReadinessGateInput } from "./controlledAutonomyReadinessGate";
import { buildGateDomainCertification } from "./readinessClassificationEngine";
import { validateGovernanceDriftResistance } from "./governanceDriftResistanceValidator";
import { validateReplayDriftResistance } from "./replayDriftResistanceValidator";
import { validateEscalationDriftResistance } from "./escalationDriftResistanceValidator";
import { validateContainmentDriftResistance } from "./containmentDriftResistanceValidator";

export function certifyDriftResistance(input: ControlledAutonomyReadinessGateInput): ControlledAutonomyDomainCertification {
  const errors = Object.freeze([
    ...validateGovernanceDriftResistance(input),
    ...validateReplayDriftResistance(input),
    ...validateEscalationDriftResistance(input),
    ...validateContainmentDriftResistance(input),
  ]);
  return buildGateDomainCertification({
    domain: "drift",
    errors,
  });
}
