type IntentValidationCounters = {
  intent_validation_total: number;
  planner_eligibility_failures: number;
  registry_denials: number;
  governance_denials: number;
  unsafe_parameter_blocks: number;
  freeze_blocks: number;
  replay_drift_blocks: number;
  approval_required_total: number;
  unknown_tool_attempts: number;
  semantic_denials: number;
  ambiguity_escalations: number;
  planner_firewall_denials: number;
  protected_target_requests: number;
  semantic_drift_incidents: number;
  governance_escalations: number;
  semantic_conflicts: number;
  contextualResolutionRate: number;
  ambiguityDetectionRate: number;
  clarificationGenerationRate: number;
  unsafeAssumptionBlockRate: number;
  plannerAdmissionDenialRate: number;
  replayResolutionBlocks: number;
  freezeResolutionBlocks: number;
  normalizationFrequency: number;
  planner_denials: number;
  replay_blocks: number;
  freeze_blocks_governance: number;
  escalation_frequency: number;
  ambiguity_frequency: number;
  clarification_frequency: number;
  unsafe_assumptions_governance: number;
  protected_target_escalations: number;
};

const counters: IntentValidationCounters = {
  intent_validation_total: 0,
  planner_eligibility_failures: 0,
  registry_denials: 0,
  governance_denials: 0,
  unsafe_parameter_blocks: 0,
  freeze_blocks: 0,
  replay_drift_blocks: 0,
  approval_required_total: 0,
  unknown_tool_attempts: 0,
  semantic_denials: 0,
  ambiguity_escalations: 0,
  planner_firewall_denials: 0,
  protected_target_requests: 0,
  semantic_drift_incidents: 0,
  governance_escalations: 0,
  semantic_conflicts: 0,
  contextualResolutionRate: 0,
  ambiguityDetectionRate: 0,
  clarificationGenerationRate: 0,
  unsafeAssumptionBlockRate: 0,
  plannerAdmissionDenialRate: 0,
  replayResolutionBlocks: 0,
  freezeResolutionBlocks: 0,
  normalizationFrequency: 0,
  planner_denials: 0,
  replay_blocks: 0,
  freeze_blocks_governance: 0,
  escalation_frequency: 0,
  ambiguity_frequency: 0,
  clarification_frequency: 0,
  unsafe_assumptions_governance: 0,
  protected_target_escalations: 0,
};

export function recordIntentValidationMetric(metric: keyof IntentValidationCounters, delta = 1) {
  counters[metric] += delta;
}

export function readIntentValidationTelemetry() {
  return { ...counters };
}

export function resetIntentValidationTelemetry() {
  for (const key of Object.keys(counters) as (keyof IntentValidationCounters)[]) {
    counters[key] = 0;
  }
}
