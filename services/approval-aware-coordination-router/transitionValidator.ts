import type { ApprovalAwareRoutingInput, CoordinationRouteTarget } from "@/types/approval-aware-coordination-router";

const STATIC_TRANSITIONS: Readonly<Record<string, CoordinationRouteTarget>> = Object.freeze({
  "created->validated": "governance_review",
  "validated->governance_bound": "governance_review",
  "governance_bound->replay_bound": "replay_review",
  "replay_bound->escalation_bound": "escalation_review",
  "escalation_bound->coordinated": "approval_review",
  "coordinated->restricted": "human_review",
  "restricted->frozen": "coordination_hold",
  "restricted->coordinated": "human_review",
});

const FORBIDDEN_TARGETS = [
  "execution",
  "dispatch",
  "retry",
  "generated_workflow",
  "recursive_review_loop",
];

export function validateRoutingTransition(input: ApprovalAwareRoutingInput): Readonly<{
  valid: boolean;
  target: CoordinationRouteTarget;
  reasons: readonly string[];
}> {
  const transitionKey = `${input.currentCoordinationState}->${input.targetCoordinationState}`;
  const reasons: string[] = [];

  if (FORBIDDEN_TARGETS.some((marker) =>
    input.requestedTransition.toLowerCase().includes(marker)
    || input.targetCoordinationState.toLowerCase().includes(marker))) {
    reasons.push("transition:forbidden-operational-target");
  }

  const target = STATIC_TRANSITIONS[transitionKey];
  if (!target) {
    reasons.push("transition:unknown");
  }

  return Object.freeze({
    valid: reasons.length === 0 && Boolean(target),
    target: target ?? "coordination_hold",
    reasons: Object.freeze(reasons),
  });
}
