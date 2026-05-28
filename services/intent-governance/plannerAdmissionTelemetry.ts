import { recordIntentValidationMetric } from "@/services/telemetry/intentValidationTelemetry";

export function recordPlannerAdmissionTelemetry(input: {
  denied: boolean;
  replayBlocked: boolean;
  freezeBlocked: boolean;
  escalated: boolean;
  ambiguity: boolean;
  clarification: boolean;
  unsafeAssumptions: boolean;
  protectedTargetEscalated: boolean;
  governanceDenied: boolean;
}) {
  if (input.denied) recordIntentValidationMetric("planner_denials");
  if (input.replayBlocked) recordIntentValidationMetric("replay_blocks");
  if (input.freezeBlocked) recordIntentValidationMetric("freeze_blocks_governance");
  if (input.escalated) recordIntentValidationMetric("escalation_frequency");
  if (input.ambiguity) recordIntentValidationMetric("ambiguity_frequency");
  if (input.clarification) recordIntentValidationMetric("clarification_frequency");
  if (input.unsafeAssumptions) recordIntentValidationMetric("unsafe_assumptions_governance");
  if (input.protectedTargetEscalated) recordIntentValidationMetric("protected_target_escalations");
  if (input.governanceDenied) recordIntentValidationMetric("governance_denials");
}
