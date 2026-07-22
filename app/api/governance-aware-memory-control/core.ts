import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  establishGovernanceAwareMemoryControl,
  getGovernanceAwareMemoryControl,
  replayGovernanceAwareMemoryControl,
} from "@/services/governance-aware-memory-control";
import type { GovernanceMemoryControlInput, GovernanceMemoryControlResult } from "@/types/governance-aware-memory-control";

export async function requireGovernanceMemoryControlUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getGovernanceAwareMemoryControl();
}

export async function establishRequest(request: Request) {
  const body = (await readBody(request)) as GovernanceMemoryControlInput;
  return establishGovernanceAwareMemoryControl(body);
}

export async function recordsRequest(request: Request) {
  const body = (await readBody(request)) as GovernanceMemoryControlInput;
  return establishGovernanceAwareMemoryControl(body).governance_records;
}

export async function validatorRequest(request: Request, key: "authority_validation" | "constitutional_validation" | "reuse_policy_result") {
  const body = (await readBody(request)) as GovernanceMemoryControlInput;
  return establishGovernanceAwareMemoryControl(body).governance_records.map((record) => record[key]);
}

export async function ledgerRequest(request: Request) {
  const body = (await readBody(request)) as GovernanceMemoryControlInput;
  return establishGovernanceAwareMemoryControl(body).governance_ledger;
}

export async function metricsRequest(request: Request) {
  const body = (await readBody(request)) as GovernanceMemoryControlInput;
  return establishGovernanceAwareMemoryControl(body).metrics;
}

export async function replayRequest(request: Request) {
  const body = (await readBody(request)) as Partial<GovernanceMemoryControlResult> & GovernanceMemoryControlInput;
  const result = body.contract && body.metrics ? (body as GovernanceMemoryControlResult) : establishGovernanceAwareMemoryControl(body);
  return {
    replay_valid: replayGovernanceAwareMemoryControl(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    status: result.status,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getGovernanceAwareMemoryControl();
  const body = (await readBody(request)) as GovernanceMemoryControlInput;
  const result = establishGovernanceAwareMemoryControl(body);
  return {
    status: result.status,
    failures: result.failures,
    approvals: result.metrics.approvals,
    denials: result.metrics.denials,
    governance_escalations: result.metrics.governance_escalations,
    deterministic: result.deterministic,
    replayable: result.replayable,
    explainable: result.explainable,
    tenant_isolated: result.tenant_isolated,
    governance_enforced: result.governance_enforced,
    constitutional_protections_preserved: result.constitutional_protections_preserved,
    authority_boundaries_preserved: result.authority_boundaries_preserved,
    cross_tenant_blocked_by_default: result.cross_tenant_blocked_by_default,
  };
}
