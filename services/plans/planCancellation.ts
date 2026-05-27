import { appendPlanAudit } from "./planAudit";
import { appendLifecycleEvent, getPlan, updatePlanState } from "./planPersistence";
import type { PlanActor, PlanLifecycleEvent } from "./planContracts";
import { PLAN_ERROR_CODES } from "./planContracts";

function buildCancellationEvent(planId: string, actor: PlanActor, eventType: string, nextState: string, createdAt: number, reason?: string) : PlanLifecycleEvent {
  return {
    eventId: `plan-cancel:${planId}:${eventType}:${actor}:${createdAt}`,
    planId,
    eventType,
    nextState,
    actor,
    timestamp: createdAt,
    createdAt,
    reason,
  };
}

export function requestCancellation(planId: string, actor: PlanActor, reason?: string, createdAt = 0) {
  const plan = getPlan(planId);
  if (plan.lifecycleState === "COMPLETED") {
    throw new Error(PLAN_ERROR_CODES.PLAN_CANCELLATION_NOT_ALLOWED);
  }

  const updatedPlan = updatePlanState(planId, plan.lifecycleState, createdAt, {
    cancellationRequested: true,
  });
  const event = buildCancellationEvent(planId, actor, "plan.cancellation_requested", plan.lifecycleState, createdAt, reason);
  appendLifecycleEvent(event);
  appendPlanAudit({
    planId,
    eventType: "plan.cancellation_requested",
    details: {
      actor,
      reason: reason ?? null,
      state: plan.lifecycleState,
    },
  });
  return {
    plan: updatedPlan,
    event,
  };
}

export function confirmCancellation(planId: string, actor: PlanActor, reason?: string, createdAt = 0) {
  const plan = getPlan(planId);
  if (plan.lifecycleState === "COMPLETED") {
    throw new Error(PLAN_ERROR_CODES.PLAN_CANCELLATION_NOT_ALLOWED);
  }
  if (!["QUEUED", "EXECUTING", "PAUSED"].includes(plan.lifecycleState)) {
    throw new Error(PLAN_ERROR_CODES.INVALID_PLAN_STATE_TRANSITION);
  }

  const updatedPlan = updatePlanState(planId, "CANCELLED", createdAt, {
    cancellationRequested: true,
    executionBlocked: true,
  });
  const event = buildCancellationEvent(planId, actor, "plan.cancellation_confirmed", "CANCELLED", createdAt, reason);
  appendLifecycleEvent(event);
  appendPlanAudit({
    planId,
    eventType: "plan.cancellation_confirmed",
    details: {
      actor,
      reason: reason ?? null,
      previousState: plan.lifecycleState,
    },
  });
  return {
    plan: updatedPlan,
    event,
  };
}
