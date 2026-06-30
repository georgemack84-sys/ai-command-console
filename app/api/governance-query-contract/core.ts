import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildGovernanceQueryAuditRecord,
  buildGovernanceQueryContract,
  buildGovernanceQueryObservabilitySurface,
  computeGovernanceQueryHash,
  getGovernanceQueryContract,
  normalizeGovernanceQuery,
  validateGovernanceQueryContract,
} from "@/services/governance-query-contract";
import type { GovernanceQueryContract, GovernanceQueryContractInput } from "@/types/governance-query-contract";

export async function requireGovernanceQueryContractUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function contractFromBody(body: Record<string, unknown>): GovernanceQueryContract {
  return (body.contract as GovernanceQueryContract | undefined) ?? buildGovernanceQueryContract(body as GovernanceQueryContractInput);
}

export function getGovernanceQueryContractResponse() {
  return getGovernanceQueryContract();
}

export async function createGovernanceQueryContractRequest(request: Request) {
  return buildGovernanceQueryContract(await readBody(request) as GovernanceQueryContractInput);
}

export async function validateGovernanceQueryContractRequest(request: Request) {
  const body = await readBody(request);
  return validateGovernanceQueryContract(body.contract ? contractFromBody(body) : body as GovernanceQueryContractInput);
}

export async function hashGovernanceQueryContractRequest(request: Request) {
  const contract = contractFromBody(await readBody(request));
  const normalized = normalizeGovernanceQuery(contract);
  return { query_hash: computeGovernanceQueryHash(normalized), normalized_query: normalized };
}

export async function auditGovernanceQueryContractRequest(request: Request) {
  const body = await readBody(request);
  return buildGovernanceQueryAuditRecord(contractFromBody(body), typeof body.result_count === "number" ? body.result_count : 0);
}

export async function inspectGovernanceQueryContractRequest(request?: Request) {
  if (!request) return buildGovernanceQueryObservabilitySurface();
  return buildGovernanceQueryObservabilitySurface(await readBody(request) as GovernanceQueryContractInput);
}
