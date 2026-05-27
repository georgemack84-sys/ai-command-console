export type ValidationError = {
  code: string;
  phase: string;
  severity: "warning" | "error" | "critical";
  message: string;
  stepId?: string;
  recoverable: boolean;
};

export type PlanStepRisk = "low" | "medium" | "high" | "critical";

export type PlanStepDraft = {
  id: string;
  type: string;
  tool: string;
  input: Record<string, unknown>;
  safety: {
    riskLevel: PlanStepRisk | string;
    requiresApproval: boolean;
  };
};

export type PlanDraft = {
  planId?: string;
  intent?: string;
  metadata?: Record<string, unknown>;
  schemaVersion?: string;
  steps?: readonly PlanStepDraft[];
};

export type PlannerToolRegistryEntry = {
  canonicalToolId: string;
  enabled: boolean;
  riskLevel: PlanStepRisk;
  requiresApproval: boolean;
  destructive: boolean;
  externalMutation: boolean;
  privileged: boolean;
  inputSchema: "record";
  owner: string;
  version: string;
};

export type GovernanceValidationInput = {
  policiesAttached: boolean;
  constitutionalSafe: boolean;
  containmentActive: boolean;
  freezeActive: boolean;
  operatorSupremacyPreserved: boolean;
  destructiveToolsAllowed?: boolean;
  governanceVersion?: string;
  disputed?: boolean;
  constitutionalConflict?: boolean;
};

export type GovernanceDecision =
  | "ALLOW"
  | "WARN"
  | "REQUIRE_APPROVAL"
  | "DENY"
  | "FREEZE"
  | "DISPUTED"
  | "BLOCKED";

export type ApprovalValidationResult = {
  approvalRequired: boolean;
  blocking: boolean;
  approvalReasons: string[];
  approvalSteps: string[];
};

export type PlanValidationResult = {
  validationId: string;
  planId: string;
  valid: boolean;
  validationState: "VALID" | "INVALID" | "BLOCKED" | "REQUIRES_APPROVAL" | "DISPUTED" | "FROZEN";
  schemaValid: boolean;
  governanceValid: boolean;
  toolsValid: boolean;
  approvalRequired: boolean;
  riskLevel: "low" | "medium" | "high" | "critical";
  resolvedTools: string[];
  blockedReasons: string[];
  validationErrors: ValidationError[];
  warnings: string[];
  validatedAt: number;
  planHash: string;
  governanceDecisionHash: string;
  governanceDecision: GovernanceDecision;
  validatorVersion: string;
  registryVersion: string;
  governanceVersion: string;
  executionEligible: boolean;
  frozen: boolean;
  freezeReasons: string[];
  snapshotId?: string;
  immutableAuditId: string;
};

export type ValidationSnapshot = {
  snapshotId: string;
  validationId: string;
  planId: string;
  planHash: string;
  governanceDecisionHash: string;
  schemaVersion: string;
  validatorVersion: string;
  registryVersion: string;
  governanceVersion: string;
  validationState:
    | "VALID"
    | "INVALID"
    | "BLOCKED"
    | "REQUIRES_APPROVAL"
    | "DISPUTED"
    | "FROZEN";
  riskLevel: "low" | "medium" | "high" | "critical";
  approvalRequired: boolean;
  executionEligible: boolean;
  frozen: boolean;
  freezeReasons: string[];
  createdAt: number;
  immutableAuditId: string;
};

export type ExecutionEligibilityResult = {
  eligible: boolean;
  blocked: boolean;
  frozen: boolean;
  planId: string;
  validationId: string;
  snapshotId?: string;
  reasons: string[];
  requiredApproval: boolean;
  governanceDecision: GovernanceDecision;
  checkedAt: number;
};

export type ValidationReplayResult = {
  replayId: string;
  originalValidationId: string;
  planId: string;
  deterministic: boolean;
  driftDetected: boolean;
  driftReasons: string[];
  originalPlanHash: string;
  replayPlanHash: string;
  originalGovernanceDecisionHash: string;
  replayGovernanceDecisionHash: string;
  replayedAt: number;
};
