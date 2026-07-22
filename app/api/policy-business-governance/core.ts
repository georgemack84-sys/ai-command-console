import {
  getPolicyBusinessGovernanceBundle,
  runPolicyBusinessGovernance,
  validatePolicyBusinessGovernance,
} from "@/services/policy-business-governance";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { PbgInput, PolicyBusinessGovernanceResult } from "@/types/policy-business-governance";

export async function requirePbgUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): PbgInput { return body as PbgInput; }
function resultFromBody(body: Record<string, unknown>): PolicyBusinessGovernanceResult { return (body.result as PolicyBusinessGovernanceResult | undefined) ?? runPolicyBusinessGovernance(inputFromBody(body)); }

export function contractResponse() { return getPolicyBusinessGovernanceBundle(); }
export async function validateRequest(request: Request) { return validatePolicyBusinessGovernance(resultFromBody(await readBody(request))); }
export async function foundationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPolicyBusinessGovernance(); return { foundation: result.foundation }; }
export async function organizationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPolicyBusinessGovernance(); return { organization: result.organization }; }
export async function lifecycleRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPolicyBusinessGovernance(); return { lifecycle: result.lifecycle }; }
export async function rulesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPolicyBusinessGovernance(); return { rules: result.rules }; }
export async function workflowsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPolicyBusinessGovernance(); return { workflows: result.workflows }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPolicyBusinessGovernance(); return { organizational_governance: result.organizational_governance }; }
export async function catalogRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPolicyBusinessGovernance(); return { catalog: result.catalog }; }
export async function notificationsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPolicyBusinessGovernance(); return { notifications: result.notifications }; }
export async function reportingRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPolicyBusinessGovernance(); return { reporting: result.reporting }; }
export async function integrationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPolicyBusinessGovernance(); return { integration: result.integration }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPolicyBusinessGovernance(); return { readiness: result.readiness, certification: result.certification, integrity_hash: result.integrity_hash }; }
