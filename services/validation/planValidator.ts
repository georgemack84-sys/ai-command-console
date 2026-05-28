import { validatePlanSchema } from "./schemaValidator";
import { validateToolResolution } from "./toolResolutionValidator";
import { validateGovernance } from "./governanceValidator";
import { validateApprovalRequirements } from "./approvalValidator";
import { classifyPlanRisk } from "./riskClassifier";
import { appendExecutionEligibilityAudit, appendPlanValidationAudit, appendValidationSnapshotAudit } from "./validationAudit";
import { evaluateConstitutionalFreezePropagation } from "./constitutionalFreezePropagation";
import { evaluateExecutionEligibility } from "./executionEligibilityGate";
import { hashGovernanceDecision, hashPlanDraft } from "./validationHashing";
import { createValidationSnapshot } from "./validationSnapshot";
import { VALIDATION_ERROR_CODES, makeValidationError } from "./validationErrors";
import { dedupeReasons, PLANNER_REGISTRY_VERSION, PLANNER_TOOL_REGISTRY, VALIDATOR_VERSION } from "./validationPolicies";
import type { GovernanceDecision, GovernanceValidationInput, PlanDraft, PlanValidationResult, ValidationError } from "./validationContracts";

function detectExecutionPath(plan: PlanDraft) {
  const serialized = JSON.stringify(plan);
  return /executionEngine|resumeExecution|toolRouter\.route|runtime mutation|stateDatabase|applyOperatorRecoveryAction/i.test(serialized);
}

export function validatePlanDraft(input: {
  plan: PlanDraft;
  governance?: GovernanceValidationInput;
}) : PlanValidationResult {
  const validatedAt = 0;
  const planId = String(input.plan.planId || "");
  const planHash = hashPlanDraft(input.plan);
  const governanceVersion = input.governance?.governanceVersion ?? "governance-unversioned";

  try {
    const executionPathDetected = detectExecutionPath(input.plan);
    const schema = validatePlanSchema(input.plan);
    const steps = Array.isArray(input.plan.steps) ? input.plan.steps : [];
    const tools = validateToolResolution({ steps, registry: PLANNER_TOOL_REGISTRY });
    const governance = validateGovernance({
      governance: input.governance,
      steps,
      registry: PLANNER_TOOL_REGISTRY,
    });
    const approval = validateApprovalRequirements({ steps, registry: PLANNER_TOOL_REGISTRY });
    const riskLevel = classifyPlanRisk({
      steps,
      registry: PLANNER_TOOL_REGISTRY,
      approval,
      governanceBlocked: !governance.valid,
    });

    const validationErrors: ValidationError[] = [
      ...schema.errors,
      ...tools.errors,
      ...governance.errors,
      ...(executionPathDetected
        ? [makeValidationError({
            code: VALIDATION_ERROR_CODES.EXECUTION_PATH_DETECTED,
            phase: "execution-detection",
            severity: "critical",
            message: "execution path detected in plan payload",
            recoverable: false,
          })]
        : []),
      ...(!approval.approvalRequired
        ? []
        : [makeValidationError({
            code: VALIDATION_ERROR_CODES.APPROVAL_REQUIRED,
            phase: "approval",
            severity: "error",
            message: "plan requires operator approval",
            recoverable: true,
          })]),
    ];

    const governanceDecision: GovernanceDecision =
      governance.decision === "DISPUTED" ? "DISPUTED"
      : !input.governance ? "BLOCKED"
      : executionPathDetected ? "BLOCKED"
      : !schema.valid || !tools.valid ? "BLOCKED"
      : !governance.valid ? governance.decision
      : approval.approvalRequired ? "REQUIRE_APPROVAL"
      : governance.decision;

    const governanceDecisionHash = hashGovernanceDecision({
      governance: input.governance,
      decision: governanceDecision,
      blockedReasons: [
        ...schema.blockedReasons,
        ...tools.blockedReasons,
        ...governance.blockedReasons,
      ],
    });

    const blockedReasons = dedupeReasons([
      ...schema.blockedReasons,
      ...tools.blockedReasons,
      ...governance.blockedReasons,
      ...(executionPathDetected ? [VALIDATION_ERROR_CODES.EXECUTION_PATH_DETECTED] : []),
      ...(approval.approvalRequired ? [VALIDATION_ERROR_CODES.APPROVAL_REQUIRED] : []),
    ]);

    const validationState: PlanValidationResult["validationState"] =
      !input.governance ? "BLOCKED"
      : executionPathDetected ? "BLOCKED"
      : !schema.valid || !tools.valid ? "INVALID"
      : governanceDecision === "DISPUTED" ? "DISPUTED"
      : !governance.valid ? "BLOCKED"
      : approval.approvalRequired ? "REQUIRES_APPROVAL"
      : "VALID";
    const valid = validationState === "VALID";

    const baseResult = {
      validationId: `plan-validation:${planId || "missing-plan"}:${validatedAt}`,
      planId,
      valid,
      validationState,
      schemaValid: schema.valid,
      governanceValid: governance.valid,
      toolsValid: tools.valid,
      approvalRequired: approval.approvalRequired,
      riskLevel,
      resolvedTools: tools.resolvedTools,
      blockedReasons,
      validationErrors,
      warnings: governance.warnings,
      validatedAt,
      planHash,
      governanceDecisionHash,
      governanceDecision,
      validatorVersion: VALIDATOR_VERSION,
      registryVersion: PLANNER_REGISTRY_VERSION,
      governanceVersion,
      executionEligible: false,
      frozen: false,
      freezeReasons: [] as string[],
      snapshotId: undefined,
    };

    const audit = appendPlanValidationAudit({ result: baseResult });
    const freezePropagation = evaluateConstitutionalFreezePropagation({
      governanceDecision,
      disputed: Boolean(input.governance?.disputed),
      containmentActive: Boolean(input.governance?.containmentActive),
      constitutionalConflict: Boolean(input.governance?.constitutionalConflict),
      operatorSupremacyPreserved: Boolean(input.governance?.operatorSupremacyPreserved),
      immutableAuditIdPresent: Boolean(audit.ledgerId),
      driftDetected: false,
      versionConflict: false,
    });

    const frozenValidationState: PlanValidationResult["validationState"] =
      validationState === "INVALID" ? "INVALID"
      : validationState === "BLOCKED" ? "BLOCKED"
      : freezePropagation.frozen ? "FROZEN"
      : validationState;
    const frozenValid = frozenValidationState === "VALID";
    const escalatedWarnings = dedupeReasons([
      ...governance.warnings,
      ...(riskLevel !== "low" && steps.length > 1 ? [VALIDATION_ERROR_CODES.VALIDATION_CUMULATIVE_RISK_ESCALATED] : []),
      ...(freezePropagation.frozen ? [VALIDATION_ERROR_CODES.VALIDATION_FREEZE_PROPAGATED] : []),
    ]);

    const auditedResult = {
      ...baseResult,
      valid: frozenValid,
      validationState: frozenValidationState,
      warnings: escalatedWarnings,
      executionEligible: false,
      frozen: freezePropagation.frozen,
      freezeReasons: freezePropagation.freezeReasons,
      immutableAuditId: audit.ledgerId,
    };

    const provisionalSnapshot = createValidationSnapshot({
      result: auditedResult,
      schemaVersion: String(input.plan.schemaVersion ?? ""),
      executionEligible: false,
    });

    const eligibility = evaluateExecutionEligibility({
      result: auditedResult,
      snapshot: provisionalSnapshot,
      approvalGranted: false,
      currentPlanHash: planHash,
      currentGovernanceDecisionHash: governanceDecisionHash,
      currentSchemaVersion: String(input.plan.schemaVersion ?? ""),
      validatorVersion: VALIDATOR_VERSION,
      registryVersion: PLANNER_REGISTRY_VERSION,
      governanceVersion,
      freezePropagationActive: freezePropagation.frozen,
    });

    const snapshot = createValidationSnapshot({
      result: {
        ...auditedResult,
        executionEligible: eligibility.eligible,
      },
      schemaVersion: String(input.plan.schemaVersion ?? ""),
      executionEligible: eligibility.eligible,
    });
    appendValidationSnapshotAudit({ snapshot });
    appendExecutionEligibilityAudit({ eligibility });

    return {
      ...auditedResult,
      executionEligible: eligibility.eligible,
      snapshotId: snapshot.snapshotId,
    };
  } catch (error) {
    const governanceDecisionHash = hashGovernanceDecision({
      governance: input.governance,
      decision: "BLOCKED",
      blockedReasons: [VALIDATION_ERROR_CODES.VALIDATION_RUNTIME_FAILURE],
      freezeReasons: [VALIDATION_ERROR_CODES.VALIDATION_CONSTITUTIONAL_FREEZE],
    });
    const fallback = {
      validationId: `plan-validation:${planId || "missing-plan"}:${validatedAt}`,
      planId,
      valid: false,
      validationState: "FROZEN" as const,
      schemaValid: false,
      governanceValid: false,
      toolsValid: false,
      approvalRequired: false,
      riskLevel: "critical" as const,
      resolvedTools: [],
      blockedReasons: [VALIDATION_ERROR_CODES.VALIDATION_RUNTIME_FAILURE],
      validationErrors: [
        makeValidationError({
          code: VALIDATION_ERROR_CODES.VALIDATION_RUNTIME_FAILURE,
          phase: "validator",
          severity: "critical",
          message: error instanceof Error ? error.message : "validation runtime failure",
          recoverable: false,
        }),
      ],
      warnings: [],
      validatedAt,
      planHash,
      governanceDecisionHash,
      governanceDecision: "BLOCKED" as const,
      validatorVersion: VALIDATOR_VERSION,
      registryVersion: PLANNER_REGISTRY_VERSION,
      governanceVersion,
      executionEligible: false,
      frozen: true,
      freezeReasons: [VALIDATION_ERROR_CODES.VALIDATION_CONSTITUTIONAL_FREEZE],
      snapshotId: undefined,
    };
    const audit = appendPlanValidationAudit({ result: fallback });
    const snapshot = createValidationSnapshot({
      result: {
        ...fallback,
        immutableAuditId: audit.ledgerId,
      },
      schemaVersion: String(input.plan.schemaVersion ?? ""),
      executionEligible: false,
    });
    appendValidationSnapshotAudit({ snapshot });
    appendExecutionEligibilityAudit({
      eligibility: {
        eligible: false,
        blocked: true,
        frozen: true,
        planId,
        validationId: fallback.validationId,
        snapshotId: snapshot.snapshotId,
        reasons: [VALIDATION_ERROR_CODES.VALIDATION_RUNTIME_FAILURE],
        requiredApproval: false,
        governanceDecision: "BLOCKED",
        checkedAt: validatedAt,
      },
    });
    return {
      ...fallback,
      immutableAuditId: audit.ledgerId,
      snapshotId: snapshot.snapshotId,
    };
  }
}
