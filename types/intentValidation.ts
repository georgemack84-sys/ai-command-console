import type { CanonicalIntent } from "./semanticResolution";

export type IntentValidationResult = {
  valid: boolean;
  schemaValid: boolean;
  semanticValid: boolean;
  governanceValid: boolean;
  toolCompatible: boolean;
  clarificationRequired: boolean;
  blockedReasons: string[];
  warnings: string[];
  canonicalIntent: CanonicalIntent;
};

export type SemanticGovernanceResult = {
  valid: boolean;
  semanticValid: boolean;
  governanceApproved: boolean;
  plannerAdmissible: boolean;
  ambiguityDetected: boolean;
  escalationRequired: boolean;
  clarificationRequired: boolean;
  protectedTargetDetected: boolean;
  replayDriftDetected: boolean;
  freezeActive: boolean;
  riskLevel: "SAFE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "PROHIBITED";
  violations: string[];
  warnings: string[];
  semanticConflicts: string[];
  governanceReasons: string[];
  plannerBlockReasons: string[];
  nextState:
    | "ALLOW_PLANNING"
    | "REQUIRE_APPROVAL"
    | "REQUEST_CLARIFICATION"
    | "ESCALATE"
    | "BLOCK"
    | "FREEZE";
  auditId: string;
};

export type CanonicalIntentValidationResult = {
  valid: boolean;
  canonicalIntent: {
    action: string;
    target: string;
    parameters: Record<string, unknown>;
  } | null;
  plannerEligible: boolean;
  validation: {
    registryValid: boolean;
    capabilityValid: boolean;
    governanceValid: boolean;
    parameterSafe: boolean;
    targetAllowed: boolean;
  };
  governance: {
    risk: "safe" | "review" | "restricted" | "blocked";
    approvalRequired: boolean;
    blocked: boolean;
  };
  registry: {
    matchedTool: string | null;
    toolEnabled: boolean;
    plannerEligible: boolean;
    capabilityMatch: boolean;
  };
  blockedReasons: string[];
  warnings: string[];
  semanticGovernance: SemanticGovernanceResult;
  auditId: string;
  timestamp: number;
};
