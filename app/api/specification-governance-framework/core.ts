import {
  getSpecificationGovernanceFrameworkBundle,
  runSpecificationGovernanceFramework,
  validateSpecificationGovernanceFramework,
} from "@/services/specification-governance-framework";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { SpecificationGovernanceFrameworkResult, SpecificationGovernanceInput } from "@/types/specification-governance-framework";

export async function requireSpecificationGovernanceUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): SpecificationGovernanceInput { return body as SpecificationGovernanceInput; }
function resultFromBody(body: Record<string, unknown>): SpecificationGovernanceFrameworkResult { return (body.result as SpecificationGovernanceFrameworkResult | undefined) ?? runSpecificationGovernanceFramework(inputFromBody(body)); }

export function contractResponse() { return getSpecificationGovernanceFrameworkBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runSpecificationGovernanceFramework(); }
export async function registryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSpecificationGovernanceFramework(); return { registry: result.registry }; }
export async function lifecycleRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSpecificationGovernanceFramework(); return { lifecycle_contract: result.lifecycle_contract }; }
export async function versionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSpecificationGovernanceFramework(); return { version_governance: result.version_governance }; }
export async function ownershipRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSpecificationGovernanceFramework(); return { ownership: result.ownership }; }
export async function approvalRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSpecificationGovernanceFramework(); return { approval_workflow: result.approval_workflow }; }
export async function supersessionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSpecificationGovernanceFramework(); return { supersession: result.supersession }; }
export async function integrityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSpecificationGovernanceFramework(); return { integrity_validation: result.integrity_validation }; }
export async function ledgerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSpecificationGovernanceFramework(); return { governance_ledger: result.governance_ledger }; }
export async function replayRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSpecificationGovernanceFramework(); return { replay_validation: result.replay_validation, replay_hash: result.replay_hash }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSpecificationGovernanceFramework(); return { certification: result.certification, integrity_hash: result.integrity_hash }; }
export async function validateRequest(request: Request) { return validateSpecificationGovernanceFramework(resultFromBody(await readBody(request))); }
