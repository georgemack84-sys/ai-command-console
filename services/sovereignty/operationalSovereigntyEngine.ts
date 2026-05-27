import { analyzeSystemicRisk } from "./systemicRiskAnalysis";
import { scoreGovernanceIntegrity } from "./governanceIntegrity";
import { scoreContainmentEffectiveness } from "./containmentEffectiveness";

export type SovereigntyState =
  | "STABLE"
  | "UNSTABLE"
  | "GOVERNANCE_RISK"
  | "CONTAINMENT_ACTIVE"
  | "SURVIVABILITY_RISK"
  | "CRITICAL"
  | "COLLAPSING"
  | "EMERGENCY_CONTAINMENT";

export type OperationalSovereigntyAssessment = {
  sovereigntyState: SovereigntyState;
  governanceIntegrity: number;
  survivabilityConfidence: number;
  systemicRisk: number;
  containmentEffectiveness: number;
  escalationPressure: number;
  emergencyControlsRequired: boolean;
  unstableDomains: string[];
};

export function evaluateOperationalSovereignty(input: {
  governanceConfidence: number;
  survivabilityConfidence: number;
  escalationPressure: number;
  activeContainment: boolean;
  failedContainmentAttempts?: number;
  unresolvedInstability?: number;
  repeatedRecoveryLoops?: number;
  containmentWeakness?: number;
  runawayAutonomySignals?: number;
  governanceFailures?: number;
  crossDomainInstability?: number;
  constitutionalDegradation?: number;
  approvalAvailability?: number;
  auditConsistency?: number;
  constitutionalValidationHealth?: number;
  enforcementCoverage?: number;
  disputedTruthPresent?: boolean;
}) : OperationalSovereigntyAssessment {
  const governance = scoreGovernanceIntegrity({
    approvalAvailability: input.approvalAvailability,
    auditConsistency: input.auditConsistency,
    constitutionalValidationHealth: input.constitutionalValidationHealth,
    enforcementCoverage: input.enforcementCoverage,
    disputedTruthPresent: input.disputedTruthPresent,
    governanceConfidence: input.governanceConfidence,
  });
  const containment = scoreContainmentEffectiveness({
    activeContainment: input.activeContainment,
    failedContainmentAttempts: input.failedContainmentAttempts,
    unresolvedInstability: input.unresolvedInstability,
    repeatedRecoveryLoops: input.repeatedRecoveryLoops,
    escalationSaturation: input.escalationPressure,
    containmentWeakness: input.containmentWeakness,
  });
  const systemic = analyzeSystemicRisk({
    runawayAutonomySignals: input.runawayAutonomySignals,
    governanceFailures: input.governanceFailures ?? (1 - governance.governanceIntegrity),
    recoveryLoopSignals: input.repeatedRecoveryLoops,
    crossDomainInstability: input.crossDomainInstability,
    escalationSaturation: input.escalationPressure,
    survivabilityLoss: 1 - input.survivabilityConfidence,
    constitutionalDegradation: input.constitutionalDegradation ?? (input.disputedTruthPresent ? 0.8 : 1 - governance.governanceIntegrity),
  });

  let sovereigntyState: SovereigntyState = "STABLE";
  if (input.disputedTruthPresent || systemic.systemicRisk >= 0.9) {
    sovereigntyState = "EMERGENCY_CONTAINMENT";
  } else if (systemic.systemicRisk >= 0.8 || input.survivabilityConfidence < 0.3) {
    sovereigntyState = "COLLAPSING";
  } else if (systemic.systemicRisk >= 0.68 || governance.governanceIntegrity < 0.35) {
    sovereigntyState = "CRITICAL";
  } else if (input.activeContainment && containment.containmentEffectiveness < 0.55) {
    sovereigntyState = "CONTAINMENT_ACTIVE";
  } else if (input.survivabilityConfidence < 0.5) {
    sovereigntyState = "SURVIVABILITY_RISK";
  } else if (governance.governanceIntegrity < 0.55) {
    sovereigntyState = "GOVERNANCE_RISK";
  } else if (systemic.systemicRisk >= 0.5 || input.escalationPressure >= 0.65) {
    sovereigntyState = "UNSTABLE";
  }

  return {
    sovereigntyState,
    governanceIntegrity: governance.governanceIntegrity,
    survivabilityConfidence: input.survivabilityConfidence,
    systemicRisk: systemic.systemicRisk,
    containmentEffectiveness: containment.containmentEffectiveness,
    escalationPressure: input.escalationPressure,
    emergencyControlsRequired: sovereigntyState === "COLLAPSING" || sovereigntyState === "EMERGENCY_CONTAINMENT" || sovereigntyState === "CRITICAL",
    unstableDomains: systemic.unstableDomains,
  };
}
