import type { EscalationDecision } from "@/types/escalation";
import { hashEscalationCoordinationValue } from "./escalationHasher";

export function buildEscalationDecision(input: {
  coordinationId: string;
  trigger: EscalationDecision["trigger"];
  resultingState: EscalationDecision["resultingState"];
  severity: EscalationDecision["severity"];
  freezeRecommended: boolean;
  pauseRecommended: boolean;
  governanceValidated: boolean;
  replaySafe: boolean;
  requiresHumanOversight: boolean;
  escalationReason: string;
  createdAt: string;
}): EscalationDecision {
  return Object.freeze({
    escalationId: hashEscalationCoordinationValue("governance-aware-escalation-id", {
      coordinationId: input.coordinationId,
      trigger: input.trigger,
      createdAt: input.createdAt,
    }),
    coordinationId: input.coordinationId,
    trigger: input.trigger,
    resultingState: input.resultingState,
    severity: input.severity,
    freezeRecommended: input.freezeRecommended,
    pauseRecommended: input.pauseRecommended,
    escalationReason: input.escalationReason,
    governanceValidated: input.governanceValidated,
    replaySafe: input.replaySafe,
    requiresHumanOversight: input.requiresHumanOversight,
    createdAt: input.createdAt,
  });
}
