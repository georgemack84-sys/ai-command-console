import type { CanonicalPlan } from "../contracts/plan-types";
import type { ReplaySnapshot, ValidationEvidence, ValidationResult } from "../validation/validation-result";

export type ApprovalMode = "REQUIRED" | "OPTIONAL" | "BLOCKED";
export type RetryMode = "NEVER" | "SAFE_ONLY" | "MANUAL_ONLY";
export type ExecutionMode = "SERIAL" | "PARALLEL";
export type AutonomyLevel = "NONE" | "ADVISORY" | "SUPERVISED";
export type ContainmentLevel = "STRICT" | "STANDARD";

export type NormalizePlanInput = {
  validatedPlan: CanonicalPlan;
  validationResult: ValidationResult;
  replaySnapshot: ReplaySnapshot;
  graphHash: string;
  validationHash: string;
  normalizationVersion: string;
};

export type NormalizedPlanStep = {
  id: string;
  sourceId?: string;
  index: number;
  title?: string;
  intent?: string;
  type: string;
  action: unknown;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  dependencies: string[];
  constraints: unknown[];
  approvalMode: ApprovalMode;
  retryMode: RetryMode;
  executionMode: ExecutionMode;
  autonomyLevel: AutonomyLevel;
  containmentLevel: ContainmentLevel;
  hash: string;
};

export type CanonicalPlanMetadata = {
  plannerVersion: string;
  generatedBy: string;
  createdAt: string;
  extensions: Record<string, unknown>;
};

export type NormalizedPlan = {
  schemaVersion: string;
  normalizationVersion: string;
  planId: string;
  goal: string;
  validatedGraphHash: string;
  validationHash: string;
  normalizationHash: string;
  replayHash: string;
  steps: NormalizedPlanStep[];
  metadata: CanonicalPlanMetadata;
  evidenceRef: string;
};

export type NormalizationHashes = {
  graphHash: string;
  validationHash: string;
  normalizationHash: string;
  replayHash: string;
  stepHashes: Record<string, string>;
};

export type NormalizationEvent = {
  eventId: string;
  path: string;
  action:
    | "FIELD_RENAMED"
    | "DEFAULT_APPLIED"
    | "ENUM_CANONICALIZED"
    | "ID_NORMALIZED"
    | "DEPENDENCY_NORMALIZED"
    | "ORDER_CANONICALIZED"
    | "METADATA_CANONICALIZED"
    | "HASH_COMPUTED";
  before: unknown;
  after: unknown;
  reason: string;
};

export type NormalizationEvidence = {
  validationRunId: string;
  schemaVersion: string;
  normalizationVersion: string;
  graphHash: string;
  validationHash: string;
  normalizationHash: string;
  replayHash: string;
  orderedEvents: NormalizationEvent[];
  replaySnapshot: ReplaySnapshot;
  sourceValidationMetadata: ValidationEvidence;
  immutableAuditLedgerId?: string;
};

export type NormalizePlanSuccess = {
  ok: true;
  normalizedPlan: Readonly<NormalizedPlan>;
  normalizationEvidence: Readonly<NormalizationEvidence>;
  hashes: Readonly<NormalizationHashes>;
};

export type NormalizePlanFailure = {
  ok: false;
  error: PlanNormalizationError;
};

export type NormalizePlanResult = NormalizePlanSuccess | NormalizePlanFailure;

export type PlanNormalizationErrorCode =
  | "PLAN_NORMALIZATION_UNVALIDATED_INPUT"
  | "PLAN_NORMALIZATION_FAILED"
  | "PLAN_NORMALIZATION_NON_DETERMINISTIC"
  | "PLAN_NORMALIZATION_ID_COLLISION"
  | "PLAN_NORMALIZATION_ENUM_UNKNOWN"
  | "PLAN_NORMALIZATION_DEPENDENCY_MISSING"
  | "PLAN_NORMALIZATION_HASH_FAILED"
  | "PLAN_NORMALIZATION_BOUNDARY_VIOLATION"
  | "PLAN_NORMALIZATION_REPLAY_MISMATCH";

export type PlanNormalizationError = {
  code: PlanNormalizationErrorCode;
  message: string;
  details?: Record<string, unknown>;
};

