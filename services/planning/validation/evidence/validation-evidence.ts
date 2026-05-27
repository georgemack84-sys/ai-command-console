import { hashPayloadDeterministically } from "@/services/contracts/payloadHasher";

import type { CanonicalPlan } from "../../contracts/plan-types";
import type { CanonicalPlanValidationEvidence } from "../../contracts/validation-types";
import type { FrozenValidationContext } from "../validation-context";
import type { ValidationError, ValidationEvidence, ValidationTopologySummary, ValidationWarning } from "../validation-result";
import { createValidationAuditLog } from "./validation-audit-log";

export function createValidationEvidence(input: {
  plan: CanonicalPlan;
  schemaEvidence: CanonicalPlanValidationEvidence;
  context: FrozenValidationContext;
  topology: ValidationTopologySummary;
  dependencyMap: Record<string, string[]>;
  validationStages: string[];
  errors: ValidationError[];
  warnings: ValidationWarning[];
  graphHash: string;
  replaySnapshot: ValidationEvidence["replaySnapshot"];
}) {
  const validationRunId = `planning-validation:${hashPayloadDeterministically({
    planId: input.plan.planId,
    graphHash: input.graphHash,
    context: input.context,
  }).slice(0, 16)}`;

  const base = {
    validationRunId,
    schemaVersion: input.plan.schemaVersion,
    validatorVersion: input.context.validatorVersion,
    governancePolicyVersion: input.context.governancePolicyVersion,
    compatibilityMatrixVersion: input.context.compatibilityMatrixVersion,
    topology: input.topology,
    dependencyMap: input.dependencyMap,
    validationStages: input.validationStages,
    errors: input.errors,
    warnings: input.warnings,
    graphHash: input.graphHash,
    replaySnapshot: input.replaySnapshot,
    schemaEvidence: input.schemaEvidence,
    context: input.context,
    normalizedPlan: input.plan,
  };

  const validationHash = hashPayloadDeterministically(base);
  const evidence: ValidationEvidence = {
    ...base,
    validationHash,
  };
  const audit = createValidationAuditLog(evidence);

  return {
    ...evidence,
    immutableAuditLedgerId: audit.ledgerId,
  };
}

