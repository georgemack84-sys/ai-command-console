import type { DependencyGraph, SequentialDependencyValidationResult } from "../dependencies";
import type { ExecutionTruthPackage } from "../execution-truth";
import type { NormalizedPlan } from "../normalization";

export type ExecutionCompatibilityErrorCode =
  | "PLAN_COMPATIBILITY_INPUT_MISSING"
  | "PLAN_APPROVAL_CONTRACT_MISSING"
  | "PLAN_ROLLBACK_CONTRACT_MISSING"
  | "PLAN_SCOPE_BOUNDARY_INVALID"
  | "PLAN_COMPENSATION_REQUIRED"
  | "PLAN_AUTHORITY_GRAPH_INVALID"
  | "PLAN_ESCALATION_GRAPH_INVALID"
  | "PLAN_ROLLBACK_DEPENDENCY_CONFLICT"
  | "PLAN_ROLLBACK_GOVERNANCE_WEAKER_THAN_FORWARD"
  | "PLAN_COMPATIBILITY_HASH_MISMATCH"
  | "PLAN_COMPATIBILITY_VALIDATION_FAILED";

export type CompatibilitySeverity = "BLOCKING" | "WARNING";

export type CompatibilityScope = {
  actionScope: string[];
  resourceScope: string[];
  environmentScope: string[];
  tenantScope: string[];
  toolScope: string[];
};

export type ApprovalContract = {
  stepId: string;
  required: boolean;
  requiredRole?: string;
  scope: CompatibilityScope;
  expiresAt?: string;
};

export type RollbackContract = {
  stepId: string;
  required: boolean;
  rollbackStrategy?: string;
  rollbackOrder?: number;
  checkpointRequired: boolean;
  compensationRequired: boolean;
};

export type CompensationContract = {
  stepId: string;
  irreversible: boolean;
  compensationStrategy?: string;
  compensationWindowSeconds?: number;
  requiresApproval: boolean;
};

export type AuthorityGraphNode = {
  stepId: string;
  requiredRole?: string;
  environmentScope: string[];
};

export type AuthorityGraphEdge = {
  from: string;
  to: string;
};

export type AuthorityGraph = {
  nodes: AuthorityGraphNode[];
  edges: AuthorityGraphEdge[];
};

export type EscalationGraphNode = {
  stepId: string;
  terminal: boolean;
};

export type EscalationGraphEdge = {
  from: string;
  to: string;
};

export type EscalationGraph = {
  nodes: EscalationGraphNode[];
  edges: EscalationGraphEdge[];
};

export type CompatibilitySnapshot = {
  planId: string;
  executionTruthHash: string;
  dependencyGraphFingerprint: string;
  authorityGraph: AuthorityGraph;
  escalationGraph: EscalationGraph;
  scopeBoundaries: Record<string, CompatibilityScope>;
  rollbackOrder: Record<string, number>;
};

export type CompatibilityViolation = {
  code: ExecutionCompatibilityErrorCode;
  message: string;
  path?: string;
  severity: CompatibilitySeverity;
};

export type ExecutionCompatibilityContract = {
  executionTruthHash: string;
  executionCompatibilityHash: string;
  approvalContracts: ApprovalContract[];
  rollbackContracts: RollbackContract[];
  compensationContracts: CompensationContract[];
  authorityGraph: AuthorityGraph;
  escalationGraph: EscalationGraph;
  compatibilitySnapshot: CompatibilitySnapshot;
  violations: CompatibilityViolation[];
  compatible: boolean;
};

export type ExecutionCompatibilityInput = {
  executionTruthHash: string;
  normalizedPlan: NormalizedPlan;
  executionTruth: ExecutionTruthPackage;
  governanceMetadata?: Record<string, unknown>;
  dependencyValidation?: SequentialDependencyValidationResult;
  dependencyGraph?: DependencyGraph;
  riskProfile?: ExecutionTruthPackage["riskProfile"];
  expectedCompatibilityHash?: string;
};

export type ExecutionCompatibilityValidationResult =
  | {
      ok: true;
      contract: Readonly<ExecutionCompatibilityContract>;
      violations: CompatibilityViolation[];
    }
  | {
      ok: false;
      contract?: Readonly<ExecutionCompatibilityContract>;
      violations: CompatibilityViolation[];
    };
