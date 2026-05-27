import type { GovernanceValidationInput, PlannerToolRegistryEntry, PlanStepRisk } from "./validationContracts";

export function shouldFreezeValidation(input: {
  constitutionalBlocked?: boolean;
  replayCorrupted?: boolean;
  escalationLoopDetected?: boolean;
  operatorAuthorityConflict?: boolean;
  containmentFailed?: boolean;
}) {
  return Boolean(
    input.constitutionalBlocked
      || input.replayCorrupted
      || input.escalationLoopDetected
      || input.operatorAuthorityConflict
      || input.containmentFailed,
  );
}

export function dedupeReasons(reasons: string[]) {
  return Array.from(new Set(reasons.filter(Boolean))).sort();
}

export const VALIDATION_SUPPORTED_STEP_TYPES = ["tool"] as const;
export const VALIDATION_SUPPORTED_RISKS: PlanStepRisk[] = ["low", "medium", "high", "critical"];
export const VALIDATION_POLICY_VERSION = "4.0C";
export const VALIDATOR_VERSION = "4.0C";
export const PLANNER_REGISTRY_VERSION = "planner-registry-1.0.0";

export const PLANNER_TOOL_REGISTRY: Record<string, PlannerToolRegistryEntry> = {
  echo: {
    canonicalToolId: "echo",
    enabled: true,
    riskLevel: "low",
    requiresApproval: false,
    destructive: false,
    externalMutation: false,
    privileged: false,
    inputSchema: "record",
    owner: "planner-core",
    version: "1.0.0",
  },
  list_files: {
    canonicalToolId: "list_files",
    enabled: true,
    riskLevel: "low",
    requiresApproval: false,
    destructive: false,
    externalMutation: false,
    privileged: false,
    inputSchema: "record",
    owner: "planner-core",
    version: "1.0.0",
  },
  read_file: {
    canonicalToolId: "read_file",
    enabled: true,
    riskLevel: "low",
    requiresApproval: false,
    destructive: false,
    externalMutation: false,
    privileged: false,
    inputSchema: "record",
    owner: "planner-core",
    version: "1.0.0",
  },
  summarize_text: {
    canonicalToolId: "summarize_text",
    enabled: true,
    riskLevel: "low",
    requiresApproval: false,
    destructive: false,
    externalMutation: false,
    privileged: false,
    inputSchema: "record",
    owner: "planner-core",
    version: "1.0.0",
  },
  write_file: {
    canonicalToolId: "write_file",
    enabled: true,
    riskLevel: "high",
    requiresApproval: true,
    destructive: false,
    externalMutation: true,
    privileged: true,
    inputSchema: "record",
    owner: "planner-core",
    version: "1.0.0",
  },
  append_file: {
    canonicalToolId: "append_file",
    enabled: true,
    riskLevel: "high",
    requiresApproval: true,
    destructive: false,
    externalMutation: true,
    privileged: true,
    inputSchema: "record",
    owner: "planner-core",
    version: "1.0.0",
  },
  diagnose_environment: {
    canonicalToolId: "diagnose_environment",
    enabled: true,
    riskLevel: "medium",
    requiresApproval: false,
    destructive: false,
    externalMutation: false,
    privileged: false,
    inputSchema: "record",
    owner: "planner-core",
    version: "1.0.0",
  },
  diagnose_path: {
    canonicalToolId: "diagnose_path",
    enabled: true,
    riskLevel: "medium",
    requiresApproval: false,
    destructive: false,
    externalMutation: false,
    privileged: false,
    inputSchema: "record",
    owner: "planner-core",
    version: "1.0.0",
  },
  whyblocked: {
    canonicalToolId: "whyblocked",
    enabled: true,
    riskLevel: "low",
    requiresApproval: false,
    destructive: false,
    externalMutation: false,
    privileged: false,
    inputSchema: "record",
    owner: "planner-core",
    version: "1.0.0",
  },
  list_plugins: {
    canonicalToolId: "list_plugins",
    enabled: true,
    riskLevel: "low",
    requiresApproval: false,
    destructive: false,
    externalMutation: false,
    privileged: false,
    inputSchema: "record",
    owner: "planner-core",
    version: "1.0.0",
  },
  run_plugin: {
    canonicalToolId: "run_plugin",
    enabled: false,
    riskLevel: "critical",
    requiresApproval: true,
    destructive: true,
    externalMutation: true,
    privileged: true,
    inputSchema: "record",
    owner: "plugin-governance",
    version: "1.0.0",
  },
};

export function isSupportedStepType(value: string) {
  return VALIDATION_SUPPORTED_STEP_TYPES.includes(value as (typeof VALIDATION_SUPPORTED_STEP_TYPES)[number]);
}

export function isSupportedRiskLevel(value: string) {
  return VALIDATION_SUPPORTED_RISKS.includes(value as PlanStepRisk);
}

export function classifyPlanRiskSeed(input: {
  stepRisks: string[];
  containsExternalMutation: boolean;
  containsDestructive: boolean;
  approvalRequired: boolean;
  governanceBlocked: boolean;
}) : PlanStepRisk {
  if (input.governanceBlocked || input.containsDestructive) {
    return "critical";
  }
  if (input.containsExternalMutation || input.approvalRequired || input.stepRisks.includes("high")) {
    return "high";
  }
  if (input.stepRisks.includes("medium")) {
    return "medium";
  }
  return "low";
}

export function governanceBlocksPlan(input: GovernanceValidationInput) {
  return !input.policiesAttached
    || !input.constitutionalSafe
    || !input.operatorSupremacyPreserved
    || input.freezeActive
    || Boolean(input.disputed)
    || Boolean(input.constitutionalConflict);
}
