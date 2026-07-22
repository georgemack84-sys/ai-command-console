import {
  getGovernanceAuthorityPolicyBundle,
  runGovernanceAuthorityPolicy,
  validateGovernanceAuthorityPolicy,
} from "@/services/caf-governance-authority-policy";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { GovernanceAuthorityPolicyInput, GovernanceAuthorityPolicyResult } from "@/types/caf-governance-authority-policy";

export async function requireGovernanceAuthorityPolicyUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): GovernanceAuthorityPolicyInput { return body as GovernanceAuthorityPolicyInput; }
function resultFromBody(body: Record<string, unknown>): GovernanceAuthorityPolicyResult { return (body.result as GovernanceAuthorityPolicyResult | undefined) ?? runGovernanceAuthorityPolicy(inputFromBody(body)); }

export function contractResponse() { return getGovernanceAuthorityPolicyBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runGovernanceAuthorityPolicy(); }
export async function validateRequest(request: Request) { return validateGovernanceAuthorityPolicy(resultFromBody(await readBody(request))); }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runGovernanceAuthorityPolicy(); return { certification: result.certification, integrity_hash: result.integrity_hash }; }
export async function authorityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runGovernanceAuthorityPolicy(); return { authority_decision: result.authority_decision }; }
export async function policyRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runGovernanceAuthorityPolicy(); return { policy_evaluation: result.policy_evaluation, approval_decision: result.approval_decision }; }
export async function gateRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runGovernanceAuthorityPolicy(); return { gate_result: result.gate_result, admission_request: result.admission_request, replay_validation: result.replay_validation }; }
export async function warningsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runGovernanceAuthorityPolicy(); return { warning_collection: result.warning_collection }; }
