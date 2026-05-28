import { clampMetric } from "../stability/stabilityMetrics";

export function analyzeSystemicRisk(input: {
  runawayAutonomySignals?: number;
  governanceFailures?: number;
  recoveryLoopSignals?: number;
  crossDomainInstability?: number;
  escalationSaturation?: number;
  survivabilityLoss?: number;
  constitutionalDegradation?: number;
}) {
  const runawayAutonomySignals = clampMetric(input.runawayAutonomySignals ?? 0, 0);
  const governanceFailures = clampMetric(input.governanceFailures ?? 0, 0);
  const recoveryLoopSignals = clampMetric(input.recoveryLoopSignals ?? 0, 0);
  const crossDomainInstability = clampMetric(input.crossDomainInstability ?? 0, 0);
  const escalationSaturation = clampMetric(input.escalationSaturation ?? 0, 0);
  const survivabilityLoss = clampMetric(input.survivabilityLoss ?? 0, 0);
  const constitutionalDegradation = clampMetric(input.constitutionalDegradation ?? 0, 0);

  const systemicRisk = clampMetric(
    runawayAutonomySignals * 0.18
      + governanceFailures * 0.18
      + recoveryLoopSignals * 0.16
      + crossDomainInstability * 0.14
      + escalationSaturation * 0.14
      + survivabilityLoss * 0.12
      + constitutionalDegradation * 0.08,
    0,
  );

  const unstableDomains = [
    ...(runawayAutonomySignals >= 0.65 ? ["autonomy_coordination"] : []),
    ...(governanceFailures >= 0.6 ? ["governance_integrity"] : []),
    ...(recoveryLoopSignals >= 0.55 ? ["recovery_supervision"] : []),
    ...(crossDomainInstability >= 0.6 ? ["cross_domain_continuity"] : []),
    ...(escalationSaturation >= 0.7 ? ["escalation_saturation"] : []),
    ...(survivabilityLoss >= 0.6 ? ["survivability_loss"] : []),
    ...(constitutionalDegradation >= 0.55 ? ["constitutional_degradation"] : []),
  ];

  return {
    systemicRisk,
    unstableDomains,
  };
}
