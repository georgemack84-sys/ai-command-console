import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  explainGovernanceReplay,
  getGovernanceExplainabilityReplayFoundation,
  replayGovernanceExplainability,
} from "@/services/governance-explainability-replay";
import type { GovernanceExplainabilityReplayInput, GovernanceExplainabilityReplayResult } from "@/types/governance-explainability-replay";

export async function requireGovernanceExplainabilityReplayUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getGovernanceExplainabilityReplayFoundation();
}

export async function explainRequest(request: Request) {
  const body = await readBody(request) as GovernanceExplainabilityReplayInput;
  return explainGovernanceReplay(body);
}

export async function validationRequest(request: Request) {
  const body = await readBody(request) as GovernanceExplainabilityReplayInput;
  return explainGovernanceReplay(body).validation;
}

export async function policyAttributionRequest(request: Request) {
  const body = await readBody(request) as GovernanceExplainabilityReplayInput;
  return explainGovernanceReplay(body).policy_attribution_report;
}

export async function constitutionalReasoningRequest(request: Request) {
  const body = await readBody(request) as GovernanceExplainabilityReplayInput;
  return explainGovernanceReplay(body).constitutional_reasoning_report;
}

export async function authorityExplanationRequest(request: Request) {
  const body = await readBody(request) as GovernanceExplainabilityReplayInput;
  return explainGovernanceReplay(body).authority_validation_explanation;
}

export async function evidenceAttributionRequest(request: Request) {
  const body = await readBody(request) as GovernanceExplainabilityReplayInput;
  return explainGovernanceReplay(body).evidence_attribution_graph;
}

export async function escalationRestrictionRequest(request: Request) {
  const body = await readBody(request) as GovernanceExplainabilityReplayInput;
  const result = explainGovernanceReplay(body);
  return {
    restrictions: result.restriction_explanation_report,
    escalations: result.escalation_explanation_report,
  };
}

export async function replayTraceRequest(request: Request) {
  const body = await readBody(request) as GovernanceExplainabilityReplayInput;
  return explainGovernanceReplay(body).governance_replay_trace;
}

export async function replayVerificationRequest(request: Request) {
  const body = await readBody(request) as GovernanceExplainabilityReplayInput;
  return explainGovernanceReplay(body).deterministic_replay_verification_report;
}

export async function ledgerRequest(request: Request) {
  const body = await readBody(request) as GovernanceExplainabilityReplayInput;
  return explainGovernanceReplay(body).ledger_entry;
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<GovernanceExplainabilityReplayResult> & GovernanceExplainabilityReplayInput;
  const result = body.validation && body.ledger_entry ? body as GovernanceExplainabilityReplayResult : explainGovernanceReplay(body);
  return {
    replay_valid: replayGovernanceExplainability(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    replay_status: result.deterministic_replay_verification_report.replay_status,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getGovernanceExplainabilityReplayFoundation();
  const body = await readBody(request) as GovernanceExplainabilityReplayInput;
  const result = explainGovernanceReplay(body);
  return {
    final_validation_state: result.final_validation_state,
    fully_explainable: result.fully_explainable,
    byte_identical: result.byte_identical,
    failures: result.failures,
    evidence_attributions: result.evidence_attribution_graph.length,
    replay_steps: result.governance_replay_trace.length,
    fail_closed: result.fail_closed,
    tenant_isolated: result.tenant_isolated,
    audit_ready: result.audit_ready,
    replayable: result.replayable,
    advisory_only: result.advisory_only,
  };
}
