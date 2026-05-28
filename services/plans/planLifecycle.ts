import { evaluateExecutionEligibility } from "@/services/validation/executionEligibilityGate";
import { appendPlanAudit } from "./planAudit";
import { appendLifecycleEvent, getPlan, updatePlanState } from "./planPersistence";
import type { PersistedPlanState, PlanLifecycleEvent, PlanActor } from "./planContracts";
import { PLAN_ERROR_CODES } from "./planContracts";
import { isAllowedPlanTransition } from "./planTransitionMatrix";
import { readValidationBinding } from "./planStore";

function buildEventId(planId: string, fromState: string, toState: string, actor: string, createdAt: number) {
  return `plan-event:${planId}:${fromState}:${toState}:${actor}:${createdAt}`;
}

export function transition(input: {
  planId: string;
  fromState: PersistedPlanState;
  toState: PersistedPlanState;
  actor: PlanActor;
  reason?: string;
  metadata?: Record<string, unknown>;
  createdAt?: number;
}) {
  const createdAt = input.createdAt ?? 0;
  const plan = getPlan(input.planId);

  if (plan.lifecycleState !== input.fromState) {
    appendPlanAudit({
      planId: input.planId,
      eventType: "plan.transition_rejected",
      details: {
        code: PLAN_ERROR_CODES.PLAN_STATE_MISMATCH,
        expected: input.fromState,
        actual: plan.lifecycleState,
        attempted: input.toState,
      },
    });
    throw new Error(PLAN_ERROR_CODES.PLAN_STATE_MISMATCH);
  }

  if (!isAllowedPlanTransition(input.fromState, input.toState)) {
    appendPlanAudit({
      planId: input.planId,
      eventType: "plan.transition_rejected",
      details: {
        code: PLAN_ERROR_CODES.PLAN_TRANSITION_DENIED,
        fromState: input.fromState,
        toState: input.toState,
      },
    });
    throw new Error(PLAN_ERROR_CODES.INVALID_PLAN_STATE_TRANSITION);
  }

  if (plan.lifecycleState === "FROZEN" && input.toState !== "DISPUTED") {
    throw new Error(PLAN_ERROR_CODES.PLAN_FROZEN_BY_GOVERNANCE);
  }
  if (plan.lifecycleState === "DISPUTED" && input.toState !== "VALIDATING" && input.toState !== "FROZEN") {
    throw new Error(PLAN_ERROR_CODES.PLAN_DISPUTED);
  }

  const validationBinding = readValidationBinding(input.planId);
  const requiresEligibility = input.toState === "QUEUED" || input.toState === "EXECUTING";
  if (requiresEligibility) {
    if (!validationBinding) {
      throw new Error(PLAN_ERROR_CODES.PLAN_VALIDATION_SNAPSHOT_MISSING);
    }

    const eligibility = evaluateExecutionEligibility({
      result: validationBinding.validationResult,
      snapshot: validationBinding.snapshot,
      approvalGranted: plan.approvalState === "APPROVED" || !plan.approvalRequired,
      currentPlanHash: plan.planHash ?? "",
      currentGovernanceDecisionHash: plan.governanceDecisionHash ?? "",
      currentSchemaVersion: plan.schemaVersion,
      validatorVersion: plan.validatorVersion,
      registryVersion: plan.registryVersion,
      governanceVersion: plan.governanceVersion,
      freezePropagationActive: plan.lifecycleState === "FROZEN" || plan.lifecycleState === "DISPUTED" || plan.executionBlocked,
    });

    if (plan.approvalRequired && plan.approvalState !== "APPROVED") {
      throw new Error(PLAN_ERROR_CODES.PLAN_APPROVAL_REQUIRED);
    }
    if (!eligibility.eligible) {
      if (eligibility.reasons.includes("VALIDATION_PLAN_HASH_MISMATCH")) {
        throw new Error(PLAN_ERROR_CODES.PLAN_VALIDATION_HASH_DRIFT);
      }
      if (eligibility.reasons.includes("VALIDATION_GOVERNANCE_HASH_MISMATCH")) {
        throw new Error(PLAN_ERROR_CODES.PLAN_GOVERNANCE_HASH_DRIFT);
      }
      if (eligibility.reasons.includes("VALIDATION_VERSION_MISMATCH")) {
        throw new Error(PLAN_ERROR_CODES.PLAN_VERSION_DRIFT);
      }
      if (eligibility.frozen) {
        throw new Error(PLAN_ERROR_CODES.PLAN_FROZEN_BY_GOVERNANCE);
      }
      throw new Error(PLAN_ERROR_CODES.PLAN_EXECUTION_BLOCKED);
    }
  }

  const nextPlan = updatePlanState(input.planId, input.toState, createdAt, {
    executionBlocked: input.toState === "FROZEN" || input.toState === "DISPUTED" ? true : plan.executionBlocked,
    frozenReason: input.toState === "FROZEN" ? (input.reason ?? plan.frozenReason) : undefined,
    disputedReason: input.toState === "DISPUTED" ? (input.reason ?? plan.disputedReason) : undefined,
    approvalState:
      input.toState === "APPROVED" ? "APPROVED"
      : input.toState === "REJECTED" ? "DENIED"
      : plan.approvalState,
    approvals:
      input.toState === "APPROVED"
        ? {
            ...plan.approvals,
            approvalRequired: plan.approvalRequired,
            approved: true,
            approvedBy: input.actor,
            approvedAt: createdAt,
          }
        : input.toState === "REJECTED"
          ? {
              ...plan.approvals,
              approvalRequired: plan.approvalRequired,
              approved: false,
            }
          : plan.approvals,
  });

  const event: PlanLifecycleEvent = {
    eventId: buildEventId(input.planId, input.fromState, input.toState, input.actor, createdAt),
    planId: input.planId,
    eventType: `plan.transition.${input.fromState.toLowerCase()}_to_${input.toState.toLowerCase()}`,
    previousState: input.fromState,
    nextState: input.toState,
    reason: input.reason,
    actor: input.actor,
    timestamp: createdAt,
    createdAt,
    metadata: input.metadata ? JSON.parse(JSON.stringify(input.metadata)) : undefined,
  };

  appendLifecycleEvent(event);
  appendPlanAudit({
    planId: input.planId,
    eventType: "plan.transition_applied",
    details: {
      previousState: input.fromState,
      nextState: input.toState,
      actor: input.actor,
      reason: input.reason ?? null,
    },
  });

  return {
    plan: nextPlan,
    event,
  };
}
