import type { EscalationAwareCoordinationInput } from "@/types/escalation-aware-coordination";
import { detectConfidenceDegradation } from "./confidenceDegradationDetector";
import { detectOrchestrationAmbiguity } from "./orchestrationAmbiguityDetector";
import { detectReplayUncertainty } from "./replayUncertaintyDetector";

export type CoordinationUncertaintyProfile = Readonly<{
  confidenceDegradation: number;
  orchestrationAmbiguity: number;
  replayUncertainty: number;
  governanceMismatch: number;
  approvalIncomplete: number;
  boundaryDrift: number;
  policyUncertainty: number;
}>;

export function detectCoordinationUncertainty(input: EscalationAwareCoordinationInput): CoordinationUncertaintyProfile {
  const governanceMismatch = input.coordinationReplay.errors.some((error) => error.code.includes("GOVERNANCE")) ? 1 : 0;
  const approvalIncomplete = !input.approval.valid || !input.approval.explicit || input.approval.status !== "approved" ? 1 : 0;
  const boundaryDrift = input.orchestrationRecord.errors.length > 0 ? 0.6 : 0;
  const serialized = JSON.stringify(input.metadata ?? {}).toLowerCase();
  const policyUncertainty = serialized.includes("policyuncertainty") ? 1 : 0;
  return Object.freeze({
    confidenceDegradation: detectConfidenceDegradation({
      coordinationReplay: input.coordinationReplay,
      metadata: input.metadata,
    }),
    orchestrationAmbiguity: detectOrchestrationAmbiguity({
      orchestrationRecord: input.orchestrationRecord,
      metadata: input.metadata,
    }),
    replayUncertainty: detectReplayUncertainty({
      coordinationReplay: input.coordinationReplay,
      metadata: input.metadata,
    }),
    governanceMismatch,
    approvalIncomplete,
    boundaryDrift,
    policyUncertainty,
  });
}
