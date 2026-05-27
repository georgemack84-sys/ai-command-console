import { clampMetric } from "../stability/stabilityMetrics";

export function scoreGovernanceIntegrity(input: {
  approvalAvailability?: number;
  auditConsistency?: number;
  constitutionalValidationHealth?: number;
  enforcementCoverage?: number;
  disputedTruthPresent?: boolean;
  governanceConfidence?: number;
}) {
  const approvalAvailability = clampMetric(input.approvalAvailability ?? 0, 0);
  const auditConsistency = clampMetric(input.auditConsistency ?? 0, 0);
  const constitutionalValidationHealth = clampMetric(input.constitutionalValidationHealth ?? 0, 0);
  const enforcementCoverage = clampMetric(input.enforcementCoverage ?? 0, 0);
  const governanceConfidence = clampMetric(input.governanceConfidence ?? 0, 0);

  const governanceIntegrity = clampMetric(
    approvalAvailability * 0.2
      + auditConsistency * 0.25
      + constitutionalValidationHealth * 0.25
      + enforcementCoverage * 0.15
      + governanceConfidence * 0.15
      - (input.disputedTruthPresent ? 0.3 : 0),
    0.05,
  );

  return {
    governanceIntegrity,
    degraded: governanceIntegrity < 0.55 || Boolean(input.disputedTruthPresent),
  };
}
