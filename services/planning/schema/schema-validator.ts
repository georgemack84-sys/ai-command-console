import { ZodIssue } from "zod";

import { strictParse } from "@/services/contracts/strictModeValidator";
import { hashPayloadDeterministically } from "@/services/contracts/payloadHasher";

import type { CanonicalPlan } from "../contracts/plan-types";
import type { CanonicalPlanValidationEvidence, ValidationIssue, ValidationResultStatus } from "../contracts/validation-types";
import { canonicalPlanSchema } from "./canonical-plan";
import { checkSchemaGovernance } from "./schema-governance";
import { hashCanonicalPlan } from "./schema-hash";
import { normalizeCanonicalPlan } from "./schema-normalizer";
import { getSchemaByVersion } from "./schema-registry";
import { resolveSchemaVersion } from "./schema-version-resolver";

function issuePath(path: readonly PropertyKey[]) {
  return path.length === 0 ? "$" : path.map((segment) => String(segment)).join(".");
}

function hasIssueCode(issues: readonly ZodIssue[], code: string) {
  return issues.some((issue) => issue.code === code);
}

function mapSchemaStatus(issues: readonly ZodIssue[]): ValidationResultStatus {
  if (hasIssueCode(issues, "unrecognized_keys")) {
    return "unknown_field";
  }
  if (hasIssueCode(issues, "invalid_value")) {
    return "invalid_enum";
  }
  if (hasIssueCode(issues, "invalid_type") || hasIssueCode(issues, "too_small") || hasIssueCode(issues, "too_big")) {
    return "invalid_schema";
  }
  return "invalid_schema";
}

function mapSchemaIssues(issues: readonly ZodIssue[]): ValidationIssue[] {
  return issues.map((issue) => ({
    code:
      issue.code === "unrecognized_keys"
        ? "PHASE42A_UNKNOWN_FIELD"
        : issue.code === "invalid_value"
          ? "PHASE42A_INVALID_ENUM"
          : issue.path[0] === "schemaVersion"
            ? "PHASE42A_SCHEMA_VERSION_MISSING"
            : "PHASE42A_REQUIRED_FIELD_MISSING",
    path: issuePath(issue.path),
    message: issue.message,
  }));
}

function validateStepGraph(plan: CanonicalPlan): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const stepIds = new Set<string>();

  for (const step of plan.steps) {
    if (stepIds.has(step.stepId)) {
      issues.push({
        code: "PHASE42A_DUPLICATE_STEP_ID",
        path: `steps.${step.stepId}`,
        message: `Duplicate step id ${step.stepId}.`,
      });
    }
    stepIds.add(step.stepId);

    if (step.execution.timeoutMs <= 0 || plan.execution.timeoutMs <= 0) {
      issues.push({
        code: "PHASE42A_INVALID_STEP_GRAPH",
        path: `steps.${step.stepId}.execution.timeoutMs`,
        message: "Timeout values must be positive.",
      });
    }

    if (step.safety.riskLevel === "critical" && !step.execution.idempotent && !step.safety.approvalRequired) {
      issues.push({
        code: "PHASE42A_UNSAFE_STEP",
        path: `steps.${step.stepId}.safety`,
        message: "Critical non-idempotent steps must require approval.",
      });
    }
  }

  for (const step of plan.steps) {
    for (const dependency of step.dependencies) {
      if (!stepIds.has(dependency)) {
        issues.push({
          code: "PHASE42A_INVALID_STEP_GRAPH",
          path: `steps.${step.stepId}.dependencies`,
          message: `Dependency target ${dependency} does not exist.`,
        });
      }
    }
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();
  const adjacency = new Map(plan.steps.map((step) => [step.stepId, step.dependencies]));

  function dfs(stepId: string) {
    if (visiting.has(stepId)) {
      issues.push({
        code: "PHASE42A_CIRCULAR_DEPENDENCY",
        path: `steps.${stepId}.dependencies`,
        message: `Circular dependency detected at ${stepId}.`,
      });
      return;
    }
    if (visited.has(stepId)) {
      return;
    }
    visiting.add(stepId);
    for (const dependency of adjacency.get(stepId) ?? []) {
      if (adjacency.has(dependency)) {
        dfs(dependency);
      }
    }
    visiting.delete(stepId);
    visited.add(stepId);
  }

  for (const stepId of adjacency.keys()) {
    dfs(stepId);
  }

  return issues;
}

function makeEvidence(input: {
  schemaVersion: string;
  status: ValidationResultStatus;
  issues: ValidationIssue[];
  failureReason?: string;
  normalized?: CanonicalPlan;
  deterministicHash?: string;
  timestamp?: string;
}): CanonicalPlanValidationEvidence {
  const timestamp = input.timestamp ?? "1970-01-01T00:00:00.000Z";
  const validationId = `validation:${hashPayloadDeterministically({
    schemaVersion: input.schemaVersion,
    status: input.status,
    issues: input.issues,
    timestamp,
  }).slice(0, 16)}`;

  return {
    validationId,
    schemaVersion: input.schemaVersion,
    status: input.status,
    failureReason: input.failureReason,
    issues: input.issues,
    normalized: input.normalized,
    deterministicHash: input.deterministicHash,
    timestamp,
  };
}

export function validateCanonicalPlan(input: unknown): CanonicalPlanValidationEvidence {
  const raw = (input ?? {}) as Record<string, unknown>;
  const schemaVersion = typeof raw.schemaVersion === "string" ? raw.schemaVersion : "";
  const timestamp = typeof raw.createdAt === "string" ? raw.createdAt : "1970-01-01T00:00:00.000Z";

  if (!schemaVersion) {
    return makeEvidence({
      schemaVersion: "",
      status: "missing_required_field",
      failureReason: "schemaVersion is required.",
      issues: [{
        code: "PHASE42A_SCHEMA_VERSION_MISSING",
        path: "schemaVersion",
        message: "schemaVersion is required.",
      }],
      timestamp,
    });
  }

  const resolution = resolveSchemaVersion(schemaVersion);
  if (!resolution.supported) {
    return makeEvidence({
      schemaVersion,
      status: "unsupported_version",
      failureReason: "Unsupported schema version.",
      issues: [{
        code: "PHASE42A_SCHEMA_VERSION_UNSUPPORTED",
        path: "schemaVersion",
        message: "Unsupported schema version.",
      }],
      timestamp,
    });
  }

  const parsed = strictParse(canonicalPlanSchema, input);
  if (!parsed.success) {
    const status =
      mapSchemaStatus(parsed.error.issues) === "invalid_schema"
      && parsed.error.issues.some((issue) => issue.path[0] === "schemaVersion")
        ? "missing_required_field"
        : mapSchemaStatus(parsed.error.issues);

    return makeEvidence({
      schemaVersion,
      status,
      failureReason: "Schema validation failed.",
      issues: mapSchemaIssues(parsed.error.issues),
      timestamp,
    });
  }

  const normalized = normalizeCanonicalPlan(parsed.data);
  const graphIssues = validateStepGraph(normalized);
  if (graphIssues.length > 0) {
    const hasUnsafe = graphIssues.some((issue) => issue.code === "PHASE42A_UNSAFE_STEP");
    return makeEvidence({
      schemaVersion,
      status: hasUnsafe ? "governance_violation" : "invalid_step_graph",
      failureReason: hasUnsafe ? "Unsafe step configuration." : "Step graph validation failed.",
      issues: graphIssues,
      timestamp,
    });
  }

  const deterministicHash = hashCanonicalPlan(normalized);
  const schema = getSchemaByVersion(schemaVersion);
  const governance = checkSchemaGovernance(schemaVersion, schema?.hash ?? "");
  if (!governance.valid) {
    return makeEvidence({
      schemaVersion,
      status: "governance_violation",
      failureReason: "Schema governance check failed.",
      issues: governance.issues,
      timestamp,
    });
  }

  return makeEvidence({
    schemaVersion,
    status: "valid",
    issues: [],
    normalized,
    deterministicHash,
    timestamp,
  });
}

export function validateAndNormalizePlan(input: unknown) {
  return validateCanonicalPlan(input);
}
