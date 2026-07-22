import { getGovernanceConstitutionalEnforcementContract, runGovernanceConstitutionalEnforcement, validateGovernanceConstitutionalEnforcement } from "@/services/governance-constitutional-enforcement";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { GovernanceEnforcementInput, GovernanceEnforcementResult } from "@/types/governance-constitutional-enforcement";

export async function requireGovernanceEnforcementUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): GovernanceEnforcementInput { return body as GovernanceEnforcementInput; }
function resultFromBody(body: Record<string, unknown>): GovernanceEnforcementResult { return (body.result as GovernanceEnforcementResult | undefined) ?? runGovernanceConstitutionalEnforcement(inputFromBody(body)); }
export function contractResponse() { return getGovernanceConstitutionalEnforcementContract(); }
export async function dashboardRequest(request?: Request) { if (!request) return runGovernanceConstitutionalEnforcement(); return runGovernanceConstitutionalEnforcement(inputFromBody(await readBody(request))); }
export async function validateRequest(request: Request) { return validateGovernanceConstitutionalEnforcement(resultFromBody(await readBody(request))); }
export async function reportsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runGovernanceConstitutionalEnforcement(); return { constitutional_contract: result.constitutional_contract, governance: result.governance, policy: result.policy, authority: result.authority, replay_evidence: result.replay_evidence }; }
export async function approvalsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runGovernanceConstitutionalEnforcement(); return { human_approval: result.human_approval, authority: result.authority, certification: result.certification }; }
export async function ledgerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runGovernanceConstitutionalEnforcement(); return { ledger: result.ledger, certification: result.certification, replay_hash: result.replay_hash }; }
export async function observabilityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runGovernanceConstitutionalEnforcement(); return { status: result.certification.status, persistent_capabilities_enabled: result.certification.persistent_capabilities_enabled, observability: result.observability, integrity_hash: result.integrity_hash }; }
