import { validateContractPayload } from "@/services/contracts/validateContract";
import { governedIntentSchema } from "@/schemas/governedIntent.schema";
import type { StructuredIntent } from "@/types/intentContracts";
import type { PlannerAdmissionDecision } from "@/types/plannerAdmissionDecision";
import { enforcePlannerEligibility } from "./plannerEligibilityEnforcer";
import { appendPlannerAdmissionAudit } from "./plannerAdmissionAudit";
import { recordPlannerAdmissionTelemetry } from "./plannerAdmissionTelemetry";
import { resolveGovernedIntent } from "./governedIntentResolver";

export function evaluatePlannerAdmissionAuthority(structuredIntent: StructuredIntent) {
  const governedIntent = resolveGovernedIntent(structuredIntent);
  const contract = validateContractPayload({
    schema: governedIntentSchema,
    payload: governedIntent,
  });
  const plannerAllowed = contract.ok && enforcePlannerEligibility(governedIntent);
  const decision: PlannerAdmissionDecision = {
    admissible: plannerAllowed,
    denied: !plannerAllowed,
    reasons: plannerAllowed ? [] : governedIntent.blockedReasons,
    escalationRequired: governedIntent.escalationRequired,
    governanceState: governedIntent.governanceState,
  };

  appendPlannerAdmissionAudit({
    intentId: structuredIntent.intentId,
    eventType:
      governedIntent.governanceState === "REPLAY_BLOCKED" ? "INTENT_REPLAY_BLOCKED"
      : governedIntent.governanceState === "FROZEN" ? "INTENT_FREEZE_BLOCKED"
      : governedIntent.governanceState === "ESCALATED" ? "INTENT_GOVERNANCE_ESCALATED"
      : !plannerAllowed ? "INTENT_PLANNER_ADMISSION_DENIED"
      : "INTENT_GOVERNANCE_VALIDATED",
    details: {
      governedIntent,
      decision,
    },
  });
  if (governedIntent.governanceState === "DENIED" || governedIntent.governanceState === "BLOCKED") {
    appendPlannerAdmissionAudit({
      intentId: structuredIntent.intentId,
      eventType: "INTENT_GOVERNANCE_DENIED",
      details: { blockedReasons: governedIntent.blockedReasons },
    });
  }
  if (!governedIntent.protectedTargetValidated) {
    appendPlannerAdmissionAudit({
      intentId: structuredIntent.intentId,
      eventType: "INTENT_PROTECTED_TARGET_ESCALATED",
      details: { escalationTargets: governedIntent.escalationTargets },
    });
  }
  if (governedIntent.containmentRequired) {
    appendPlannerAdmissionAudit({
      intentId: structuredIntent.intentId,
      eventType: "INTENT_CONTAINMENT_REQUIRED",
      details: { reasons: governedIntent.blockedReasons },
    });
  }

  recordPlannerAdmissionTelemetry({
    denied: decision.denied,
    replayBlocked: governedIntent.governanceState === "REPLAY_BLOCKED",
    freezeBlocked: governedIntent.governanceState === "FROZEN",
    escalated: governedIntent.governanceState === "ESCALATED" || governedIntent.escalationRequired,
    ambiguity: !governedIntent.ambiguityResolved,
    clarification: governedIntent.clarificationRequired,
    unsafeAssumptions: governedIntent.unsafeAssumptionsDetected,
    protectedTargetEscalated: !governedIntent.protectedTargetValidated,
    governanceDenied: !governedIntent.governanceApproved,
  });

  return {
    governedIntent,
    decision,
  };
}
