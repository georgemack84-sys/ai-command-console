import { getPilotGovernanceFoundationBundle, runPilotGovernanceFoundation, validatePilotGovernanceFoundation } from "@/services/pilot-governance-foundation";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { PilotGovernanceInput, PilotGovernanceResult } from "@/types/pilot-governance-foundation";

export async function requirePilotGovernanceUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): PilotGovernanceInput { return body as PilotGovernanceInput; }
function resultFromBody(body: Record<string, unknown>): PilotGovernanceResult { return (body.result as PilotGovernanceResult | undefined) ?? runPilotGovernanceFoundation(inputFromBody(body)); }

export function contractResponse() { return getPilotGovernanceFoundationBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runPilotGovernanceFoundation(); }
export async function authorityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPilotGovernanceFoundation(); return { authority: result.authority, ownership: result.ownership }; }
export async function scopeRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPilotGovernanceFoundation(); return { scope: result.scope, criteria: result.criteria }; }
export async function lifecycleRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPilotGovernanceFoundation(); return { lifecycle: result.lifecycle, transition: result.transition, decision: result.decision }; }
export async function ledgerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPilotGovernanceFoundation(); return { ledger: result.ledger }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPilotGovernanceFoundation(); return { certification_tests: result.certification_tests, outcome: result.outcome }; }
export async function validateRequest(request: Request) { return validatePilotGovernanceFoundation(resultFromBody(await readBody(request))); }
