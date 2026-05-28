import type { NormalizedPlan } from "../normalization";

export type DependencyNode = {
  stepId: string;
  sourceId?: string;
  sequenceIndex: number;
  stepType?: string;
  operation?: string;
  branchType?: "normal" | "failure" | "rollback" | "terminal";
  requiresApproval?: boolean;
  requiresPreflight?: boolean;
  isDestructive?: boolean;
  hasExternalSideEffect?: boolean;
  idempotencyKey?: string;
  declaredPriority?: string;
};

export type DependencyEdge = {
  from: string;
  to: string;
  edgeType:
    | "depends_on"
    | "approval_gate"
    | "preflight_gate"
    | "verification"
    | "rollback"
    | "failure_branch";
};

export type DependencyGraph = {
  planId: string;
  nodes: DependencyNode[];
  edges: DependencyEdge[];
  roots: string[];
  terminalStepIds: string[];
  graphHash?: string;
  graphVersion: string;
};

export type SequentialDependencyErrorCode =
  | "PLAN_DEPENDENCY_REFERENCE_NOT_FOUND"
  | "PLAN_DUPLICATE_STEP_ID"
  | "PLAN_SELF_DEPENDENCY_BLOCKED"
  | "PLAN_DUPLICATE_DEPENDENCY_FOUND"
  | "PLAN_DISABLED_STEP_REFERENCED"
  | "PLAN_DEPENDENCY_CYCLE_DETECTED"
  | "PLAN_ORDERING_NON_DETERMINISTIC"
  | "PLAN_APPROVAL_GATE_BYPASSED"
  | "PLAN_GATE_INHERITANCE_BROKEN"
  | "PLAN_PREFLIGHT_REQUIRED"
  | "PLAN_VERIFICATION_ORDER_INVALID"
  | "PLAN_ROLLBACK_ORDER_INVALID"
  | "PLAN_TERMINAL_STEP_HAS_DEPENDENTS"
  | "PLAN_FAILURE_BRANCH_USED_AS_SUCCESS_PATH"
  | "PLAN_DEPENDENCY_POLICY_VIOLATION";

export type DependencyValidationError = {
  code: SequentialDependencyErrorCode;
  stepId?: string;
  message: string;
  path?: string[];
};

export type DependencyValidationWarning = {
  code: string;
  stepId?: string;
  message: string;
  path?: string[];
};

export type SequentialDependencyValidationResult = {
  ok: boolean;
  planId: string;
  graph?: DependencyGraph;
  orderedStepIds?: string[];
  dependencyGraphFingerprint?: string;
  errors: DependencyValidationError[];
  warnings: DependencyValidationWarning[];
};

export type DependencyValidationReport = SequentialDependencyValidationResult;

export type NormalizedDependencyInput = NormalizedPlan;
