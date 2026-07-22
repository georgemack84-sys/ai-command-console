import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  determineEscalationRestriction,
  getEscalationRestrictionEngineFoundation,
  replayEscalationRestrictionDecision,
} from "@/services/escalation-restriction-engine";
import type { EscalationRestrictionEngineInput, EscalationRestrictionEngineResult } from "@/types/escalation-restriction-engine";

export async function requireEscalationRestrictionEngineUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getEscalationRestrictionEngineFoundation();
}

export async function determineRequest(request: Request) {
  const body = await readBody(request) as EscalationRestrictionEngineInput;
  return determineEscalationRestriction(body);
}

export async function contextRequest(request: Request) {
  const body = await readBody(request) as EscalationRestrictionEngineInput;
  return determineEscalationRestriction(body).decision.validation_summary;
}

export async function triggersRequest(request: Request) {
  const body = await readBody(request) as EscalationRestrictionEngineInput;
  return determineEscalationRestriction(body).decision.escalation_triggers;
}

export async function restrictionsRequest(request: Request) {
  const body = await readBody(request) as EscalationRestrictionEngineInput;
  return determineEscalationRestriction(body).decision.restrictions;
}

export async function workflowRequest(request: Request) {
  const body = await readBody(request) as EscalationRestrictionEngineInput;
  return determineEscalationRestriction(body).decision.review_workflow;
}

export async function reviewersRequest(request: Request) {
  const body = await readBody(request) as EscalationRestrictionEngineInput;
  return determineEscalationRestriction(body).decision.required_reviewers;
}

export async function enforcementRequest(request: Request) {
  const body = await readBody(request) as EscalationRestrictionEngineInput;
  return determineEscalationRestriction(body).restriction_enforcement_report;
}

export async function ledgerRequest(request: Request) {
  const body = await readBody(request) as EscalationRestrictionEngineInput;
  return determineEscalationRestriction(body).ledger_entry;
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<EscalationRestrictionEngineResult> & EscalationRestrictionEngineInput;
  const result = body.decision && body.ledger_entry ? body as EscalationRestrictionEngineResult : determineEscalationRestriction(body);
  return {
    replay_valid: replayEscalationRestrictionDecision(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    replay_reference: result.decision.replay_reference,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getEscalationRestrictionEngineFoundation();
  const body = await readBody(request) as EscalationRestrictionEngineInput;
  const result = determineEscalationRestriction(body);
  return {
    final_decision: result.final_decision,
    escalation_level: result.decision.escalation_level,
    triggers: result.decision.escalation_triggers.length,
    restrictions: result.decision.restrictions.length,
    reviewers: result.decision.required_reviewers.map((reviewer) => reviewer.reviewer_role),
    simulation_authorization: result.simulation_authorization_decision,
    failures: result.failures,
    fail_closed: result.fail_closed,
    tenant_isolated: result.tenant_isolated,
    audit_ready: result.audit_ready,
    replayable: result.replayable,
    advisory_only: result.advisory_only,
  };
}
