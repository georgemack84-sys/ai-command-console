import type { ControlledAutonomyDomainCertification, ControlledAutonomyReadinessGateInput } from "./controlledAutonomyReadinessGate";
import { buildGateDomainCertification } from "./readinessClassificationEngine";
import { validateReplayProof } from "./replayProofValidator";
import { verifyReplayIntegrity } from "./replayIntegrityVerifier";
import { certifyReplayLineage } from "./replayLineageCertificationEngine";
import { validateReplayBoundary } from "./replayBoundaryValidator";

export function certifyReplayDeterminism(input: ControlledAutonomyReadinessGateInput): ControlledAutonomyDomainCertification {
  const errors = Object.freeze([
    ...validateReplayProof(input),
    ...verifyReplayIntegrity(input),
    ...certifyReplayLineage(input),
    ...validateReplayBoundary(input),
  ]);
  return buildGateDomainCertification({
    domain: "replay",
    errors,
    frozen: errors.length > 0,
  });
}
