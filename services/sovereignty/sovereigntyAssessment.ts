export enum SovereignGovernanceState {
  STABLE = "STABLE",
  GOVERNED = "GOVERNED",
  SUPERVISED = "SUPERVISED",
  CONTAINED = "CONTAINED",
  ESCALATED = "ESCALATED",
  CRITICAL = "CRITICAL",
  CONSTITUTIONAL_RISK = "CONSTITUTIONAL_RISK",
  SURVIVABILITY_RISK = "SURVIVABILITY_RISK",
  EMERGENCY_CONTAINMENT = "EMERGENCY_CONTAINMENT",
  CIVILIZATION_LOCKDOWN = "CIVILIZATION_LOCKDOWN",
}

export type ConstitutionalSovereigntyAssessment = {
  sovereigntyState: string;
  constitutionalIntegrity: number;
  survivabilityConfidence: number;
  operationalStability: number;
  governanceReliability: number;
  escalationPressure: number;
  containmentPressure: number;
  systemicRisk: number;
  autonomyRisk: number;
  civilizationScaleRisk: number;
  emergencyControlsRequired: boolean;
  operatorInterventionRequired: boolean;
  unstableSystems: string[];
  frozenSystems: string[];
  constitutionalSafe: boolean;
  immutableAuditHealthy: boolean;
};

function clamp(value: number) {
  return Number(Math.max(0.05, Math.min(1, value)).toFixed(4));
}

export function assessConstitutionalSovereignty(input: {
  constitutionalIntegrity: number;
  survivabilityConfidence: number;
  operationalStability: number;
  governanceReliability: number;
  escalationPressure: number;
  containmentPressure: number;
  systemicRisk: number;
  autonomyRisk: number;
  civilizationScaleRisk: number;
  emergencyControlsRequired: boolean;
  operatorInterventionRequired: boolean;
  unstableSystems: string[];
  frozenSystems: string[];
  constitutionalSafe: boolean;
  immutableAuditHealthy: boolean;
}) : ConstitutionalSovereigntyAssessment {
  const constitutionalIntegrity = clamp(input.constitutionalIntegrity);
  const survivabilityConfidence = clamp(input.survivabilityConfidence);
  const operationalStability = clamp(input.operationalStability);
  const governanceReliability = clamp(input.governanceReliability);
  const escalationPressure = clamp(input.escalationPressure);
  const containmentPressure = clamp(input.containmentPressure);
  const systemicRisk = clamp(input.systemicRisk);
  const autonomyRisk = clamp(input.autonomyRisk);
  const civilizationScaleRisk = clamp(input.civilizationScaleRisk);

  let sovereigntyState: SovereignGovernanceState = SovereignGovernanceState.STABLE;
  if (!input.constitutionalSafe || !input.immutableAuditHealthy) sovereigntyState = SovereignGovernanceState.CONSTITUTIONAL_RISK;
  if (containmentPressure >= 0.75) sovereigntyState = SovereignGovernanceState.CONTAINED;
  if (systemicRisk >= 0.75 || survivabilityConfidence < 0.4) sovereigntyState = SovereignGovernanceState.SURVIVABILITY_RISK;
  if (escalationPressure >= 0.72 || input.operatorInterventionRequired) sovereigntyState = SovereignGovernanceState.ESCALATED;
  if (input.emergencyControlsRequired || systemicRisk >= 0.86) sovereigntyState = SovereignGovernanceState.EMERGENCY_CONTAINMENT;
  if (civilizationScaleRisk >= 0.9 || (!input.constitutionalSafe && input.emergencyControlsRequired)) sovereigntyState = SovereignGovernanceState.CIVILIZATION_LOCKDOWN;
  else if (sovereigntyState === SovereignGovernanceState.STABLE && (autonomyRisk >= 0.5 || escalationPressure >= 0.45)) sovereigntyState = SovereignGovernanceState.SUPERVISED;
  else if (sovereigntyState === SovereignGovernanceState.STABLE && governanceReliability < 0.8) sovereigntyState = SovereignGovernanceState.GOVERNED;

  return {
    sovereigntyState,
    constitutionalIntegrity,
    survivabilityConfidence,
    operationalStability,
    governanceReliability,
    escalationPressure,
    containmentPressure,
    systemicRisk,
    autonomyRisk,
    civilizationScaleRisk,
    emergencyControlsRequired: input.emergencyControlsRequired,
    operatorInterventionRequired: input.operatorInterventionRequired,
    unstableSystems: input.unstableSystems,
    frozenSystems: input.frozenSystems,
    constitutionalSafe: input.constitutionalSafe,
    immutableAuditHealthy: input.immutableAuditHealthy,
  };
}
