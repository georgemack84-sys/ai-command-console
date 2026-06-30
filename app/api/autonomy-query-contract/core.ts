import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildAutonomyQueryAuditRecord,
  buildAutonomyQueryContract,
  buildAutonomyQueryObservabilitySurface,
  computeAutonomyQueryHash,
  getAutonomyQueryContract,
  normalizeAutonomyQuery,
  validateAutonomyQueryContract,
} from "@/services/autonomy-query-contract";
import type { AutonomyQueryContract, AutonomyQueryContractInput } from "@/types/autonomy-query-contract";

export async function requireAutonomyQueryContractUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function contractFromBody(body: Record<string, unknown>): AutonomyQueryContract {
  return (body.contract as AutonomyQueryContract | undefined) ?? buildAutonomyQueryContract(body as AutonomyQueryContractInput);
}

export function getAutonomyQueryContractResponse() { return getAutonomyQueryContract(); }
export async function createAutonomyQueryContractRequest(request: Request) { return buildAutonomyQueryContract(await readBody(request) as AutonomyQueryContractInput); }
export async function validateAutonomyQueryContractRequest(request: Request) {
  const body = await readBody(request);
  return validateAutonomyQueryContract(body.contract ? contractFromBody(body) : body as AutonomyQueryContractInput);
}
export async function hashAutonomyQueryContractRequest(request: Request) {
  const normalized = normalizeAutonomyQuery(contractFromBody(await readBody(request)));
  return { query_hash: computeAutonomyQueryHash(normalized), normalized_query: normalized };
}
export async function auditAutonomyQueryContractRequest(request: Request) {
  const body = await readBody(request);
  return buildAutonomyQueryAuditRecord(contractFromBody(body), typeof body.returned_record_count === "number" ? body.returned_record_count : 0, typeof body.execution_duration === "string" ? body.execution_duration : "PT0.000S");
}
export async function inspectAutonomyQueryContractRequest(request?: Request) {
  if (!request) return buildAutonomyQueryObservabilitySurface();
  return buildAutonomyQueryObservabilitySurface(await readBody(request) as AutonomyQueryContractInput);
}
