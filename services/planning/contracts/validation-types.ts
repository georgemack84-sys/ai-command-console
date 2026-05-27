import type { CanonicalPlan } from "./plan-types";

export const VALIDATION_RESULT_STATUSES = [
  "valid",
  "invalid_schema",
  "unsupported_version",
  "unknown_field",
  "missing_required_field",
  "invalid_enum",
  "invalid_step_graph",
  "governance_violation",
  "nondeterministic_serialization",
] as const;

export type ValidationResultStatus = (typeof VALIDATION_RESULT_STATUSES)[number];

export type ValidationIssue = {
  code: string;
  path: string;
  message: string;
};

export type CanonicalPlanValidationEvidence = {
  validationId: string;
  schemaVersion: string;
  status: ValidationResultStatus;
  failureReason?: string;
  issues: ValidationIssue[];
  normalized?: CanonicalPlan;
  deterministicHash?: string;
  timestamp: string;
};

