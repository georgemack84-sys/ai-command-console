import { hashPayloadDeterministically } from "../contracts/payloadHasher";
import type {
  OperationalRuleEvaluationInput,
  OperationalRuleId,
  ViolationEvent,
} from "./types";

function sha256(value: unknown) {
  return `sha256:${hashPayloadDeterministically(value)}`;
}

export function hashOperationalEvidence(value: unknown) {
  return sha256(value);
}

export function buildViolationEvent(input: {
  ruleId: OperationalRuleId;
  ruleEvidence: Record<string, unknown>;
  request: OperationalRuleEvaluationInput;
}): ViolationEvent {
  const evidenceHash = sha256({
    actor: input.request.actor,
    enforcementPoint: input.request.enforcementPoint,
    ruleEvidence: input.ruleEvidence,
    ruleId: input.ruleId,
    stateAfter: input.request.stateAfter,
    stateBefore: input.request.stateBefore,
    timestamp: input.request.timestamp,
    workflowId: input.request.workflowId,
  });

  const violationId = sha256({
    actor: input.request.actor,
    evidenceHash,
    ruleId: input.ruleId,
    stateAfter: input.request.stateAfter,
    stateBefore: input.request.stateBefore,
    timestamp: input.request.timestamp,
    workflowId: input.request.workflowId,
  });

  return Object.freeze({
    violationId,
    ruleId: input.ruleId,
    workflowId: input.request.workflowId,
    actor: input.request.actor,
    stateBefore: input.request.stateBefore,
    stateAfter: input.request.stateAfter,
    timestamp: input.request.timestamp,
    evidenceHash,
  });
}
