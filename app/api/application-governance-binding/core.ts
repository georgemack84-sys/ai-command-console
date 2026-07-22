import {
  getApplicationGovernanceBindingBundle,
  runApplicationGovernanceBinding,
  validateApplicationGovernanceBinding,
} from "@/services/application-governance-binding";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ApplicationGovernanceBindingResult, ApplicationGovernanceInput } from "@/types/application-governance-binding";

export async function requireApplicationGovernanceBindingUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): ApplicationGovernanceInput { return body as ApplicationGovernanceInput; }
function resultFromBody(body: Record<string, unknown>): ApplicationGovernanceBindingResult { return (body.result as ApplicationGovernanceBindingResult | undefined) ?? runApplicationGovernanceBinding(inputFromBody(body)); }

export function contractResponse() { return getApplicationGovernanceBindingBundle(); }
export async function validateRequest(request: Request) { return validateApplicationGovernanceBinding(resultFromBody(await readBody(request))); }
export async function bindingRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationGovernanceBinding(); return { constitutional_binding: result.constitutional_binding }; }
export async function authorityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationGovernanceBinding(); return { authority_binding: result.authority_binding }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationGovernanceBinding(); return { governance_binding: result.governance_binding }; }
export async function approvalsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationGovernanceBinding(); return { approval_routing: result.approval_routing }; }
export async function policyRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationGovernanceBinding(); return { policy_compliance: result.policy_compliance }; }
export async function safetyRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationGovernanceBinding(); return { safety_compliance: result.safety_compliance }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationGovernanceBinding(); return { governance_evidence: result.governance_evidence }; }
export async function complianceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationGovernanceBinding(); return { compliance_report: result.compliance_report }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationGovernanceBinding(); return { certification: result.certification, integrity_hash: result.integrity_hash }; }
