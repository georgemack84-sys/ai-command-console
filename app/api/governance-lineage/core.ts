import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildGovernanceLineageObservabilitySurface,
  computeGovernanceLineageHash,
  explainGovernanceConclusion,
  getGovernanceLineage,
  getGovernanceLineageContract,
  registerGovernanceLineage,
  resolveInfluenceChain,
  validateGovernanceLineage,
  verifyGovernanceReplay,
} from "@/services/governance-lineage";
import type { GovernanceLineageRecord, GovernanceLineageScenario } from "@/types/governance-lineage";

export async function requireGovernanceLineageUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function getGovernanceLineageContractResponse() {
  return getGovernanceLineageContract();
}

export async function registerGovernanceLineageRequest(request: Request) {
  const body = await readBody(request) as { tenant_id?: string; mission_id?: string; session_id?: string; scenario?: GovernanceLineageScenario };
  return registerGovernanceLineage(body);
}

export async function validateGovernanceLineageRequest(request: Request) {
  const body = await readBody(request);
  return validateGovernanceLineage(Object.keys(body).length ? body as Partial<GovernanceLineageRecord> : registerGovernanceLineage());
}

export async function replayGovernanceLineageRequest(request: Request) {
  const body = await readBody(request);
  return verifyGovernanceReplay(Object.keys(body).length ? body as GovernanceLineageRecord : registerGovernanceLineage());
}

export async function hashGovernanceLineageRequest(request: Request) {
  const body = await readBody(request);
  const record = Object.keys(body).length ? body as GovernanceLineageRecord : registerGovernanceLineage();
  return { governance_lineage_hash: computeGovernanceLineageHash(record) };
}

export async function inspectGovernanceLineageRequest(request?: Request) {
  if (!request) return buildGovernanceLineageObservabilitySurface();
  const body = await readBody(request);
  return buildGovernanceLineageObservabilitySurface(Object.keys(body).length ? body as GovernanceLineageRecord : registerGovernanceLineage());
}

export async function resolveGovernanceLineageRequest(request?: Request) {
  if (!request) return resolveInfluenceChain();
  const body = await readBody(request);
  return resolveInfluenceChain(Object.keys(body).length ? body as GovernanceLineageRecord : registerGovernanceLineage());
}

export async function explainGovernanceLineageRequest(request?: Request) {
  if (!request) return explainGovernanceConclusion();
  const body = await readBody(request);
  return explainGovernanceConclusion(Object.keys(body).length ? body as GovernanceLineageRecord : registerGovernanceLineage());
}

export async function retrieveGovernanceLineageRequest(request?: Request) {
  if (!request) return getGovernanceLineage();
  const body = await readBody(request);
  return getGovernanceLineage(Object.keys(body).length ? body as GovernanceLineageRecord : registerGovernanceLineage());
}
