import type { CanonicalPlan } from "../contracts/plan-types";
import type { CanonicalPlanValidationEvidence, ValidationIssue } from "../contracts/validation-types";
import type { FrozenValidationContext } from "./validation-context";

export type ValidationStatus =
  | "approved_for_planning_pipeline"
  | "rejected"
  | "unsafe"
  | "approval_required";

export type ValidationError = ValidationIssue & {
  stage: string;
};

export type ValidationWarning = {
  code: string;
  path: string;
  message: string;
  stage: string;
};

export type ValidationTopologySummary = {
  nodeCount: number;
  edgeCount: number;
  branchCount: number;
  maxDepth: number;
};

export type ReplaySnapshot = {
  schemaVersion: string;
  planHash: string;
  graphHash: string;
  authoredStepOrder: string[];
  dependencyMap: Record<string, string[]>;
  topology: ValidationTopologySummary;
};

export type ValidationEvidence = {
  validationRunId: string;
  schemaVersion: string;
  validatorVersion: string;
  governancePolicyVersion: string;
  compatibilityMatrixVersion: string;
  topology: ValidationTopologySummary;
  dependencyMap: Record<string, string[]>;
  validationStages: string[];
  errors: ValidationError[];
  warnings: ValidationWarning[];
  graphHash: string;
  validationHash: string;
  replaySnapshot: ReplaySnapshot;
  schemaEvidence: CanonicalPlanValidationEvidence;
  context: FrozenValidationContext;
  normalizedPlan: CanonicalPlan;
  immutableAuditLedgerId?: string;
};

export interface ValidationResult {
  ok: boolean;
  validated: boolean;
  status: ValidationStatus;
  topology: ValidationTopologySummary;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  validationHash: string;
  graphHash: string;
  evidence: ValidationEvidence;
}
