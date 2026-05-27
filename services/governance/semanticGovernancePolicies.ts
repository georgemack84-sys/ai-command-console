export const PROTECTED_TARGET_PATTERNS = [
  /(^|[\\/])windows([\\/]|$)/i,
  /(^|[\\/])system32([\\/]|$)/i,
  /(^|[\\/])etc([\\/]|$)/i,
  /credential/i,
  /secret/i,
  /audit/i,
  /ledger/i,
  /governance/i,
  /prod/i,
  /production/i,
  /database/i,
  /tenant/i,
  /deploy/i,
] as const;

export const PROTECTED_PARAMETER_KEYS = [
  "credentialStore",
  "auditLedger",
  "governanceState",
  "deploymentTarget",
  "tenantScope",
] as const;

export function mapSemanticRiskLevel(input: {
  protectedTargetDetected: boolean;
  governanceBlocked: boolean;
  semanticConflicts: string[];
  ambiguityDetected: boolean;
  approvalRequired: boolean;
}) {
  if (input.governanceBlocked) {
    return "PROHIBITED" as const;
  }
  if (input.protectedTargetDetected || input.semanticConflicts.length > 0) {
    return "CRITICAL" as const;
  }
  if (input.ambiguityDetected || input.approvalRequired) {
    return "HIGH" as const;
  }
  return "SAFE" as const;
}
