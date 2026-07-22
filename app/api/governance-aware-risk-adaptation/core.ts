import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { evaluateGovernanceAwareRiskAdaptation, getGovernanceAwareRiskAdaptationFoundation, replayGovernanceAwareRiskAdaptation } from "@/services/governance-aware-risk-adaptation";
import type { GovernanceRiskInput, GovernanceRiskResult } from "@/types/governance-aware-risk-adaptation";

export async function requireGovernanceRiskUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getGovernanceAwareRiskAdaptationFoundation();
}

export async function evaluateRequest(request: Request) {
  const body = await readBody(request) as GovernanceRiskInput;
  return evaluateGovernanceAwareRiskAdaptation(body);
}

export async function recordsRequest(request: Request) {
  const body = await readBody(request) as GovernanceRiskInput;
  return evaluateGovernanceAwareRiskAdaptation(body).records;
}

export async function impactRequest(request: Request) {
  const body = await readBody(request) as GovernanceRiskInput;
  return evaluateGovernanceAwareRiskAdaptation(body).impact_report;
}

export async function decisionRequest(request: Request) {
  const body = await readBody(request) as GovernanceRiskInput;
  const result = evaluateGovernanceAwareRiskAdaptation(body);
  return {
    governance_decision: result.records[0]?.governance_decision,
    required_actions: result.records[0]?.required_actions,
    escalation_required: result.impact_report.escalation_required,
    escalation_reasons: result.impact_report.escalation_reasons,
  };
}

export async function ledgerRequest(request: Request) {
  const body = await readBody(request) as GovernanceRiskInput;
  return evaluateGovernanceAwareRiskAdaptation(body).decision_ledger;
}

export async function validationRequest(request: Request) {
  const body = await readBody(request) as GovernanceRiskInput;
  return evaluateGovernanceAwareRiskAdaptation(body).validation;
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<GovernanceRiskResult> & GovernanceRiskInput;
  const result = body.decision_ledger ? body as GovernanceRiskResult : evaluateGovernanceAwareRiskAdaptation(body);
  return {
    replay_valid: replayGovernanceAwareRiskAdaptation(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    replay_refs: result.records.flatMap((record) => record.replay_refs),
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getGovernanceAwareRiskAdaptationFoundation();
  const body = await readBody(request) as GovernanceRiskInput;
  const result = evaluateGovernanceAwareRiskAdaptation(body);
  return {
    state: result.validation.state,
    certified: result.validation.certified,
    failures: result.validation.failures,
    governance_decision: result.records[0]?.governance_decision,
    advisory_only: result.advisory_only,
    authorizes_production_deployment: result.authorizes_production_deployment,
    mutates_production_risk_models: result.mutates_production_risk_models,
  };
}
