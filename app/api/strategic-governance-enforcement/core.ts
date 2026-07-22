import { getStrategicGovernanceEnforcementContract, runStrategicGovernanceEnforcement, validateStrategicGovernanceEnforcement } from "@/services/strategic-governance-enforcement";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { StrategicGovernanceInput, StrategicGovernanceResult } from "@/types/strategic-governance-enforcement";

export async function requireStrategicGovernanceUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): StrategicGovernanceInput { return body as StrategicGovernanceInput; }
function resultFromBody(body: Record<string, unknown>): StrategicGovernanceResult { return (body.result as StrategicGovernanceResult | undefined) ?? runStrategicGovernanceEnforcement(inputFromBody(body)); }

export function contractResponse() { return getStrategicGovernanceEnforcementContract(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runStrategicGovernanceEnforcement(); }
export async function constitutionalRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStrategicGovernanceEnforcement(); return { constitution: result.constitution }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStrategicGovernanceEnforcement(); return { governance: result.governance }; }
export async function authorityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStrategicGovernanceEnforcement(); return { authority: result.authority }; }
export async function operatorRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStrategicGovernanceEnforcement(); return { operator: result.operator }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStrategicGovernanceEnforcement(); return { evidence: result.evidence }; }
export async function trustRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStrategicGovernanceEnforcement(); return { trust: result.trust }; }
export async function tenantRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStrategicGovernanceEnforcement(); return { tenant: result.tenant }; }
export async function restrictedDataRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStrategicGovernanceEnforcement(); return { restricted_data: result.restricted_data }; }
export async function securityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStrategicGovernanceEnforcement(); return { security: result.security }; }
export async function failClosedRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStrategicGovernanceEnforcement(); return { fail_closed: result.fail_closed }; }
export async function ledgerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStrategicGovernanceEnforcement(); return { ledger: result.ledger }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStrategicGovernanceEnforcement(); return { certification: result.certification, integrity_hash: result.integrity_hash }; }
export async function validateRequest(request: Request) { return validateStrategicGovernanceEnforcement(resultFromBody(await readBody(request))); }
export async function observabilityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStrategicGovernanceEnforcement(); return { observability: result.observability, certification_status: result.certification.status }; }
