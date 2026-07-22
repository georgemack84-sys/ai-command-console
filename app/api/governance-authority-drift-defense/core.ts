import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  defendGovernanceAuthority,
  getGovernanceAuthorityFoundation,
  replayGovernanceAuthorityDefense,
} from "@/services/governance-authority-drift-defense";
import type { GovernanceAuthorityInput, GovernanceAuthorityResult } from "@/types/governance-authority-drift-defense";

export async function requireGovernanceAuthorityUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getGovernanceAuthorityFoundation();
}

export async function defendRequest(request: Request) {
  const body = await readBody(request) as GovernanceAuthorityInput;
  return defendGovernanceAuthority(body);
}

export async function baselineRequest(request: Request) {
  const body = await readBody(request) as GovernanceAuthorityInput;
  return defendGovernanceAuthority(body).baseline;
}

export async function governanceReportRequest(request: Request) {
  const body = await readBody(request) as GovernanceAuthorityInput;
  return defendGovernanceAuthority(body).governance_report;
}

export async function authorityReportRequest(request: Request) {
  const body = await readBody(request) as GovernanceAuthorityInput;
  return defendGovernanceAuthority(body).authority_report;
}

export async function constitutionalReportRequest(request: Request) {
  const body = await readBody(request) as GovernanceAuthorityInput;
  return defendGovernanceAuthority(body).constitutional_report;
}

export async function approvalReportRequest(request: Request) {
  const body = await readBody(request) as GovernanceAuthorityInput;
  return defendGovernanceAuthority(body).approval_report;
}

export async function escalationReportRequest(request: Request) {
  const body = await readBody(request) as GovernanceAuthorityInput;
  return defendGovernanceAuthority(body).escalation_report;
}

export async function containmentRequest(request: Request) {
  const body = await readBody(request) as GovernanceAuthorityInput;
  return defendGovernanceAuthority(body).containment_decision;
}

export async function ledgerRequest(request: Request) {
  const body = await readBody(request) as GovernanceAuthorityInput;
  return defendGovernanceAuthority(body).drift_record;
}

export async function metricsRequest(request: Request) {
  const body = await readBody(request) as GovernanceAuthorityInput;
  return defendGovernanceAuthority(body).metrics;
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<GovernanceAuthorityResult> & GovernanceAuthorityInput;
  const result = body.baseline && body.metrics ? body as GovernanceAuthorityResult : defendGovernanceAuthority(body);
  return {
    replay_valid: replayGovernanceAuthorityDefense(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    status: result.status,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getGovernanceAuthorityFoundation();
  const body = await readBody(request) as GovernanceAuthorityInput;
  const result = defendGovernanceAuthority(body);
  return {
    status: result.status,
    failures: result.failures,
    severity: result.drift_record.severity,
    recommended_response: result.drift_record.recommended_response,
    automatic_blocks: result.containment_decision.automatic_blocks,
    containment_actions: result.containment_decision.containment_actions,
    mandatory_escalation_required: result.mandatory_escalation.required,
    deterministic: result.deterministic,
    replayable: result.replayable,
    explainable: result.explainable,
    evidence_backed: result.evidence_backed,
    governance_preserved: result.governance_preserved,
    constitutional_preserved: result.constitutional_preserved,
    operator_authority_preserved: result.operator_authority_preserved,
    tenant_isolated: result.tenant_isolated,
    advisory_only: result.advisory_only,
    expands_authority: result.expands_authority,
    authorizes_autonomous_execution: result.authorizes_autonomous_execution,
  };
}
